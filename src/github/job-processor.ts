/**
 * Job Processor
 *
 * Processes test jobs queued by the webhook server.
 * This is the bridge between GitHub PR comments and the 3-agent pipeline.
 */

import { PipelineOrchestrator } from '../core/pipeline-orchestrator.js';
import type { TestJob, JobStatus } from '../types/webhook-types.js';
import type { PipelineResult } from '../core/pipeline-orchestrator.js';

/**
 * Job processor configuration
 */
export interface JobProcessorConfig {
  /** Default OpenAPI spec path (can be overridden by job) */
  defaultSpecPath?: string;

  /** Default output directory */
  defaultOutputDir?: string;

  /** Default base URL for testing */
  defaultBaseUrl?: string;

  /** GitHub token for posting results */
  githubToken?: string;

  /** OpenAI API key for AI features */
  openaiApiKey?: string;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Job Processor
 *
 * Takes jobs from the webhook queue and executes the full pipeline:
 * 1. Parse OpenAPI spec
 * 2. Generate tests
 * 3. Execute tests
 * 4. Self-heal failures
 * 5. Post results to GitHub PR
 */
export class JobProcessor {
  private config: JobProcessorConfig;
  private processingJobs: Set<string> = new Set();

  constructor(config: JobProcessorConfig) {
    this.config = config;
  }

  /**
   * Process a test job
   *
   * This is called when a job is pulled from the queue (typically by a background worker).
   */
  async processJob(job: TestJob, updateStatus: (jobId: string, status: JobStatus) => void): Promise<PipelineResult> {
    // Check if already processing
    if (this.processingJobs.has(job.id)) {
      throw new Error(`Job ${job.id} is already being processed`);
    }

    this.processingJobs.add(job.id);

    try {
      this.log(`Processing job ${job.id} for ${job.repository}#${job.prNumber}`);

      // Update status to running
      updateStatus(job.id, 'running');

      // Extract configuration from job command
      const pipelineConfig = this.buildPipelineConfig(job);

      // Create and execute pipeline
      const pipeline = new PipelineOrchestrator(pipelineConfig);
      const result = await pipeline.execute();

      // Update status based on result
      updateStatus(job.id, result.success ? 'completed' : 'failed');

      this.log(`Job ${job.id} completed: ${result.success ? 'success' : 'failed'}`);

      return result;
    } catch (error) {
      this.log(`Job ${job.id} failed: ${error}`);
      updateStatus(job.id, 'failed');
      throw error;
    } finally {
      this.processingJobs.delete(job.id);
    }
  }

  /**
   * Build pipeline configuration from job
   */
  private buildPipelineConfig(job: TestJob) {
    const { command, repository, prNumber } = job;

    // Extract spec path from command args or use default
    const specPath = command.args.spec || this.config.defaultSpecPath || './openapi.yaml';

    // Extract output dir - use default (not configurable via command)
    const outputDir = this.config.defaultOutputDir || './tests/generated';

    // Extract base URL from command args or use default
    const baseUrl = command.args.baseUrl || this.config.defaultBaseUrl;

    // Determine if AI should be used (default: yes if API key is available)
    // NO FLAGS NEEDED - automatic based on API key presence
    const useAI = !!(this.config.openaiApiKey || process.env.OPENAI_API_KEY);

    // Determine if healing should be enabled (default: yes if API key is available)
    // NO FLAGS NEEDED - automatic based on API key presence
    const enableHealing = !!(this.config.openaiApiKey || process.env.OPENAI_API_KEY);

    return {
      specPath,
      outputDir,
      baseUrl,
      useAI,
      enableHealing,
      repository,
      prNumber,
      githubToken: this.config.githubToken,
      openaiApiKey: this.config.openaiApiKey,
      verbose: this.config.verbose,
    };
  }

  /**
   * Check if a job is currently being processed
   */
  isProcessing(jobId: string): boolean {
    return this.processingJobs.has(jobId);
  }

  /**
   * Get count of jobs currently being processed
   */
  getProcessingCount(): number {
    return this.processingJobs.size;
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose !== false) {
      console.log(`[JobProcessor] ${message}`);
    }
  }
}

/**
 * Create a background job processor worker
 *
 * This would typically be run as a separate process/worker
 * that polls the job queue and processes jobs.
 */
export class JobWorker {
  private processor: JobProcessor;
  private pollInterval: number;
  private running: boolean = false;
  private getJobs: () => TestJob[];
  private updateStatus: (jobId: string, status: JobStatus) => void;

  constructor(
    processor: JobProcessor,
    getJobs: () => TestJob[],
    updateStatus: (jobId: string, status: JobStatus) => void,
    options: { pollInterval?: number } = {}
  ) {
    this.processor = processor;
    this.getJobs = getJobs;
    this.updateStatus = updateStatus;
    this.pollInterval = options.pollInterval || 5000; // 5 seconds default
  }

  /**
   * Start the worker
   */
  start(): void {
    if (this.running) {
      console.warn('Worker is already running');
      return;
    }

    this.running = true;
    console.log('🚀 Job worker started');

    this.poll();
  }

  /**
   * Stop the worker
   */
  stop(): void {
    this.running = false;
    console.log('🛑 Job worker stopped');
  }

  /**
   * Poll for jobs
   */
  private async poll(): Promise<void> {
    while (this.running) {
      try {
        // Get queued jobs
        const jobs = this.getJobs().filter(job => job.status === 'queued');

        if (jobs.length > 0) {
          console.log(`📋 Found ${jobs.length} queued job(s)`);

          // Process jobs (one at a time for now)
          for (const job of jobs.slice(0, 1)) {
            try {
              await this.processor.processJob(job, this.updateStatus);
            } catch (error) {
              console.error(`Failed to process job ${job.id}:`, error);
            }
          }
        }

        // Wait before next poll
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('Error in worker poll:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if worker is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
