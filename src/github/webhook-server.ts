/**
 * GitHub Webhook Server
 *
 * Express-based webhook server for receiving and processing GitHub events.
 * Supports signature verification, rate limiting, and async job queuing.
 */

import express, { Request, Response, NextFunction, Express } from 'express';
import { Server } from 'http';
import { SignatureVerifier } from './signature-verifier.js';
import { CommentParser } from './comment-parser.js';
import { PermissionChecker } from './permission-checker.js';
import {
  WebhookConfig,
  WebhookPayload,
  IssueCommentEvent,
  PullRequestEvent,
  TestJob,
  JobStatus,
  JobPriority,
  WebhookStats,
} from '../types/webhook-types.js';

/**
 * Rate limiter store for tracking requests
 */
interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Job queue for async processing
 */
interface JobQueue {
  [jobId: string]: TestJob;
}

/**
 * GitHub Webhook Server
 *
 * Handles incoming webhooks from GitHub, verifies signatures,
 * parses commands from PR comments, and queues test jobs.
 *
 * @example
 * ```typescript
 * const config: WebhookConfig = {
 *   port: 3000,
 *   secret: process.env.WEBHOOK_SECRET!,
 *   path: '/webhook',
 *   healthPath: '/health',
 *   logging: true,
 *   rateLimit: {
 *     enabled: true,
 *     maxRequests: 10,
 *     windowMs: 60000,
 *   },
 *   timeout: 30000,
 *   maxBodySize: '1mb',
 * };
 *
 * const server = new WebhookServer(config);
 * await server.start(3000);
 * ```
 */
export class WebhookServer {
  private app: Express;
  private server: Server | null = null;
  private config: WebhookConfig;
  private verifier: SignatureVerifier;
  private parser: CommentParser;
  private permissionChecker: PermissionChecker | null = null;
  private jobQueue: JobQueue = {};
  private rateLimitStore: RateLimitStore = {};
  private stats: WebhookStats;

  /**
   * Create a new webhook server
   *
   * @param config - Server configuration
   */
  constructor(config: WebhookConfig) {
    this.config = config;
    this.app = express();
    this.verifier = new SignatureVerifier();
    this.parser = new CommentParser();

    // Initialize stats
    this.stats = {
      totalReceived: 0,
      totalProcessed: 0,
      totalRejected: 0,
      totalQueued: 0,
      byEventType: {},
      byAction: {},
      rateLimitHits: 0,
      signatureFailures: 0,
      uptime: 0,
      startTime: new Date(),
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set permission checker
   *
   * @param checker - PermissionChecker instance
   */
  public setPermissionChecker(checker: PermissionChecker): void {
    this.permissionChecker = checker;
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // JSON body parser with size limit
    this.app.use(express.json({ limit: this.config.maxBodySize }));

    // Request logging
    if (this.config.logging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        });
        next();
      });
    }

    // CORS middleware
    if (this.config.cors) {
      this.app.use((_req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', this.config.cors!.origins.join(','));
        res.header('Access-Control-Allow-Methods', this.config.cors!.methods.join(','));
        res.header('Access-Control-Allow-Headers', this.config.cors!.headers.join(','));
        next();
      });
    }

    // Rate limiting middleware
    if (this.config.rateLimit.enabled) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        // Skip rate limiting for health checks
        if (req.path === this.config.healthPath) {
          return next();
        }

        const ip = req.ip || 'unknown';
        const now = Date.now();

        // Clean up expired entries
        this.cleanupRateLimitStore(now);

        // Get or create rate limit entry
        let entry = this.rateLimitStore[ip];
        if (!entry || now >= entry.resetTime) {
          entry = {
            count: 0,
            resetTime: now + this.config.rateLimit.windowMs,
          };
          this.rateLimitStore[ip] = entry;
        }

        // Check rate limit
        if (entry.count >= this.config.rateLimit.maxRequests) {
          this.stats.rateLimitHits++;
          const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
          res.setHeader('Retry-After', retryAfter.toString());
          return res.status(429).json({
            error: this.config.rateLimit.message || 'Too many requests',
            retryAfter,
          });
        }

        // Increment counter
        entry.count++;
        next();
      });
    }

    // Request timeout
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.setTimeout(this.config.timeout, () => {
        res.status(408).json({ error: 'Request timeout' });
      });
      next();
    });
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitStore(now: number): void {
    Object.keys(this.rateLimitStore).forEach(ip => {
      if (now >= this.rateLimitStore[ip]!.resetTime) {
        delete this.rateLimitStore[ip];
      }
    });
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get(this.config.healthPath, (req: Request, res: Response) => {
      this.handleHealthCheck(req, res);
    });

    // Webhook endpoint
    this.app.post(this.config.path, (req: Request, res: Response) => {
      this.handleWebhook(req, res).catch(error => {
        console.error('Webhook handler error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    });

    // Stats endpoint
    this.app.get('/stats', (req: Request, res: Response) => {
      this.handleStats(req, res);
    });

    // Jobs endpoint
    this.app.get('/jobs', (req: Request, res: Response) => {
      this.handleJobsList(req, res);
    });

    // Job details endpoint
    this.app.get('/jobs/:jobId', (req: Request, res: Response) => {
      this.handleJobDetails(req, res);
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Express error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  /**
   * Handle health check request
   */
  private handleHealthCheck(_req: Request, res: Response): void {
    const uptime = Date.now() - this.stats.startTime.getTime();
    res.status(200).json({
      status: 'healthy',
      uptime,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle stats request
   */
  private handleStats(_req: Request, res: Response): void {
    const uptime = Date.now() - this.stats.startTime.getTime();
    res.status(200).json({
      ...this.stats,
      uptime,
      queueSize: Object.keys(this.jobQueue).length,
    });
  }

  /**
   * Handle jobs list request
   */
  private handleJobsList(req: Request, res: Response): void {
    const jobs = Object.values(this.jobQueue);
    const status = req.query.status as JobStatus | undefined;

    const filtered = status
      ? jobs.filter(job => job.status === status)
      : jobs;

    res.status(200).json({
      total: filtered.length,
      jobs: filtered.map(job => ({
        id: job.id,
        repository: job.repository,
        prNumber: job.prNumber,
        command: job.command.command,
        status: job.status,
        priority: job.priority,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })),
    });
  }

  /**
   * Handle job details request
   */
  private handleJobDetails(req: Request, res: Response): void {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    const job = this.jobQueue[jobId];

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.status(200).json(job);
  }

  /**
   * Handle incoming webhook
   */
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    this.stats.totalReceived++;

    try {
      // Extract event type
      const eventType = req.headers['x-github-event'] as string;
      if (!eventType) {
        this.stats.totalRejected++;
        res.status(400).json({ error: 'Missing X-GitHub-Event header' });
        return;
      }

      // Track event type
      this.stats.byEventType[eventType] = (this.stats.byEventType[eventType] || 0) + 1;

      // Verify signature
      const signature = req.headers['x-hub-signature-256'] as string | undefined;
      const payload = JSON.stringify(req.body);

      if (!this.verifier.verify(payload, signature, this.config.secret)) {
        this.stats.signatureFailures++;
        this.stats.totalRejected++;
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Parse webhook payload
      const webhookPayload = req.body as WebhookPayload;

      // Track action
      if (webhookPayload.action) {
        this.stats.byAction[webhookPayload.action] = (this.stats.byAction[webhookPayload.action] || 0) + 1;
      }

      // Handle different event types
      if (eventType === 'issue_comment') {
        await this.handleIssueComment(req.body as IssueCommentEvent);
      } else if (eventType === 'pull_request') {
        await this.handlePullRequest(req.body as PullRequestEvent);
      } else {
        // Unsupported event type - acknowledge but don't process
        console.log(`Received unsupported event type: ${eventType}`);
      }

      this.stats.totalProcessed++;
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      this.stats.totalRejected++;
      console.error('Webhook processing error:', error);
      res.status(500).json({
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle issue comment event
   *
   * Processes comments on issues and pull requests, looking for
   * @api-test-agent mentions to trigger test jobs.
   */
  public async handleIssueComment(payload: IssueCommentEvent): Promise<void> {
    // Only process created comments
    if (payload.action !== 'created') {
      console.log(`Ignoring ${payload.action} comment event`);
      return;
    }

    // Check if it's a pull request comment
    if (!payload.issue.pull_request) {
      console.log('Comment is not on a pull request, ignoring');
      return;
    }

    // Check if comment author is a bot (prevent loops)
    if (payload.comment.user.type === 'Bot') {
      console.log('Comment author is a bot, ignoring to prevent loops');
      return;
    }

    // Parse comment for commands
    const command = this.parser.parse(payload.comment.body);
    if (!command || !command.valid) {
      console.log('No valid command found in comment');
      return;
    }

    // Check permissions if permission checker is configured
    if (this.permissionChecker) {
      const hasPermission = await this.permissionChecker.hasWriteAccess(
        payload.comment.user.login,
        payload.repository.full_name
      );

      if (!hasPermission) {
        console.log(`User ${payload.comment.user.login} does not have permission`);
        return;
      }
    }

    // Create and queue test job
    const job: TestJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      repository: payload.repository.full_name,
      prNumber: payload.issue.number,
      branch: '', // Would need to fetch PR details to get branch
      author: payload.comment.user.login,
      command,
      status: 'queued' as JobStatus,
      priority: this.determinePriority(command.args),
      createdAt: new Date(),
      metadata: {
        commentId: payload.comment.id,
        commentUrl: payload.comment.html_url,
        issueUrl: payload.issue.html_url,
        retryCount: 0,
      },
    };

    await this.queueTestExecution(job);
  }

  /**
   * Handle pull request event
   *
   * Processes pull request events (opened, synchronize, etc.)
   * to potentially trigger automatic tests.
   */
  public async handlePullRequest(payload: PullRequestEvent): Promise<void> {
    console.log(`Received pull_request event: ${payload.action} for PR #${payload.pull_request.number}`);

    // Could implement automatic testing on PR open/update here
    // For now, we just log the event
  }

  /**
   * Queue test execution job
   *
   * Adds a job to the queue for async processing.
   */
  public async queueTestExecution(job: TestJob): Promise<void> {
    console.log(`Queuing test job: ${job.id} for ${job.repository}#${job.prNumber}`);

    // Add to queue
    this.jobQueue[job.id] = job;
    this.stats.totalQueued++;

    // In a real implementation, this would publish to a message queue
    // or trigger a background worker. For now, we just store it.
    console.log(`Job ${job.id} queued successfully`);
  }

  /**
   * Determine job priority based on command arguments
   */
  private determinePriority(args: any): JobPriority {
    // High priority for production environments
    if (args.env === 'production' || args.env === 'prod') {
      return 'high';
    }

    // Medium priority for staging
    if (args.env === 'staging' || args.env === 'stage') {
      return 'medium';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Start the webhook server
   *
   * @param port - Port to listen on (defaults to config.port)
   */
  public async start(port?: number): Promise<void> {
    const listenPort = port || this.config.port;

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(listenPort, () => {
          console.log(`Webhook server listening on port ${listenPort}`);
          console.log(`Webhook endpoint: POST ${this.config.path}`);
          console.log(`Health check: GET ${this.config.healthPath}`);
          this.stats.startTime = new Date();
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Shutdown the webhook server gracefully
   */
  public async shutdown(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          console.error('Error shutting down server:', error);
          reject(error);
        } else {
          console.log('Webhook server shut down successfully');
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Get server statistics
   */
  public getStats(): WebhookStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime(),
    };
  }

  /**
   * Get job by ID
   */
  public getJob(jobId: string): TestJob | undefined {
    return this.jobQueue[jobId];
  }

  /**
   * Get all jobs
   */
  public getJobs(): TestJob[] {
    return Object.values(this.jobQueue);
  }

  /**
   * Update job status
   */
  public updateJobStatus(jobId: string, status: JobStatus): void {
    const job = this.jobQueue[jobId];
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = status;

    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date();
    } else if ((status === 'completed' || status === 'failed' || status === 'cancelled') && !job.completedAt) {
      job.completedAt = new Date();
    }
  }

  /**
   * Remove job from queue
   */
  public removeJob(jobId: string): void {
    delete this.jobQueue[jobId];
  }

  /**
   * Clear all completed jobs
   */
  public clearCompletedJobs(): void {
    Object.keys(this.jobQueue).forEach(jobId => {
      const job = this.jobQueue[jobId]!;
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        delete this.jobQueue[jobId];
      }
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): Express {
    return this.app;
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}

/**
 * Create default webhook configuration
 */
export function createDefaultConfig(secret: string): WebhookConfig {
  return {
    port: 3000,
    secret,
    path: '/webhook',
    healthPath: '/health',
    logging: true,
    rateLimit: {
      enabled: true,
      maxRequests: 10,
      windowMs: 60000,
      message: 'Too many requests, please try again later',
    },
    timeout: 30000,
    maxBodySize: '1mb',
  };
}
