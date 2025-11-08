/**
 * GitHub API Client
 * Comprehensive client for GitHub API interactions using Octokit
 */

import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import type {
  PullRequest,
  Comment,
  CheckRun,
  CheckRunData,
  CheckRunUpdate,
  PRFile,
  Repository,
  Permission,
  ClientConfig,
  RateLimitInfo,
  RateLimitResponse,
  FileContent,
  GitHubError,
  RetryOptions,
} from '../types/github-types.js';
import { DEFAULT_CONFIG } from '../types/github-types.js';

// Create Octokit with plugins
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

/**
 * GitHub API Client
 * Handles all GitHub API interactions with rate limiting and retry logic
 */
export class GitHubClient {
  private octokit: InstanceType<typeof OctokitWithPlugins>;
  private config: Required<ClientConfig>;
  private rateLimitCache: RateLimitInfo | null = null;
  private lastRateLimitCheck: number = 0;
  private readonly RATE_LIMIT_CACHE_TTL = 60000; // 1 minute

  /**
   * Create a new GitHub API client
   * @param token - GitHub personal access token
   * @param config - Optional client configuration
   */
  constructor(token: string, config?: ClientConfig) {
    if (!token) {
      throw new Error('GitHub token is required');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      throttle: {
        ...DEFAULT_CONFIG.throttle,
        ...config?.throttle,
      },
      retry: {
        ...DEFAULT_CONFIG.retry,
        ...config?.retry,
      },
      log: {
        ...DEFAULT_CONFIG.log,
        ...config?.log,
      },
    };

    this.octokit = new OctokitWithPlugins({
      auth: token,
      baseUrl: this.config.baseUrl,
      userAgent: this.config.userAgent,
      request: {
        timeout: this.config.timeout,
      },
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          if (this.config.log.warn) {
            this.config.log.warn(
              `Rate limit hit for ${options.method} ${options.url}. Retrying after ${retryAfter}s`
            );
          }

          if (this.config.throttle.onRateLimit) {
            return this.config.throttle.onRateLimit(retryAfter, options);
          }

          return retryAfter < 60; // Default: retry if wait is less than 1 minute
        },
        onSecondaryRateLimit: (retryAfter: number, options: any) => {
          if (this.config.log.warn) {
            this.config.log.warn(
              `Secondary rate limit hit for ${options.method} ${options.url}. Retrying after ${retryAfter}s`
            );
          }

          if (this.config.throttle.onSecondaryRateLimit) {
            return this.config.throttle.onSecondaryRateLimit(retryAfter, options);
          }

          return retryAfter < 60; // Default: retry if wait is less than 1 minute
        },
      },
      retry: this.config.retry,
      log: this.config.log.debug ? ({
        debug: this.config.log.debug.bind(this.config.log),
        info: this.config.log.info!.bind(this.config.log),
        warn: this.config.log.warn!.bind(this.config.log),
        error: this.config.log.error!.bind(this.config.log),
      }) : undefined,
    });
  }

  /**
   * Get a pull request
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param number - Pull request number
   * @returns Pull request data
   */
  async getPullRequest(
    owner: string,
    repo: string,
    number: number
  ): Promise<PullRequest> {
    this.validateParams({ owner, repo, number });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: number,
        });
      });

      return response.data as PullRequest;
    } catch (error) {
      throw this.handleError(error, 'getPullRequest');
    }
  }

  /**
   * Get file content from repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path
   * @param ref - Optional git reference (branch, tag, commit SHA)
   * @returns File content as string
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    this.validateParams({ owner, repo, path });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref,
        });
      });

      const data = response.data as FileContent;

      if (data.type !== 'file') {
        throw new Error(`Path ${path} is not a file (type: ${data.type})`);
      }

      if (!data.content) {
        throw new Error(`No content available for file ${path}`);
      }

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      throw this.handleError(error, 'getFileContent');
    }
  }

  /**
   * Post a comment on an issue or pull request
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue or PR number
   * @param body - Comment body
   * @returns Created comment
   */
  async postComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<Comment> {
    this.validateParams({ owner, repo, issueNumber });

    if (!body || !body.trim()) {
      throw new Error('Comment body cannot be empty');
    }

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body,
        });
      });

      return response.data as Comment;
    } catch (error) {
      throw this.handleError(error, 'postComment');
    }
  }

  /**
   * Update an existing comment
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param commentId - Comment ID
   * @param body - New comment body
   * @returns Updated comment
   */
  async updateComment(
    owner: string,
    repo: string,
    commentId: number,
    body: string
  ): Promise<Comment> {
    this.validateParams({ owner, repo, commentId });

    if (!body || !body.trim()) {
      throw new Error('Comment body cannot be empty');
    }

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: commentId,
          body,
        });
      });

      return response.data as Comment;
    } catch (error) {
      throw this.handleError(error, 'updateComment');
    }
  }

  /**
   * Delete a comment
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param commentId - Comment ID
   */
  async deleteComment(
    owner: string,
    repo: string,
    commentId: number
  ): Promise<void> {
    this.validateParams({ owner, repo, commentId });

    try {
      await this.checkRateLimit();

      await this.retryRequest(async () => {
        return await this.octokit.rest.issues.deleteComment({
          owner,
          repo,
          comment_id: commentId,
        });
      });
    } catch (error) {
      throw this.handleError(error, 'deleteComment');
    }
  }

  /**
   * Create a check run
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param data - Check run data
   * @returns Created check run
   */
  async createCheckRun(
    owner: string,
    repo: string,
    data: CheckRunData
  ): Promise<CheckRun> {
    this.validateParams({ owner, repo });
    this.validateCheckRunData(data);

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.checks.create({
          owner,
          repo,
          ...data,
        } as any);
      });

      return response.data as unknown as CheckRun;
    } catch (error) {
      throw this.handleError(error, 'createCheckRun');
    }
  }

  /**
   * Update a check run
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param checkRunId - Check run ID
   * @param data - Check run update data
   * @returns Updated check run
   */
  async updateCheckRun(
    owner: string,
    repo: string,
    checkRunId: number,
    data: CheckRunUpdate
  ): Promise<CheckRun> {
    this.validateParams({ owner, repo, checkRunId });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.checks.update({
          owner,
          repo,
          check_run_id: checkRunId,
          ...data,
        } as any);
      });

      return response.data as unknown as CheckRun;
    } catch (error) {
      throw this.handleError(error, 'updateCheckRun');
    }
  }

  /**
   * List files in a pull request
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param number - Pull request number
   * @returns List of changed files
   */
  async listPRFiles(
    owner: string,
    repo: string,
    number: number
  ): Promise<PRFile[]> {
    this.validateParams({ owner, repo, number });

    try {
      await this.checkRateLimit();

      const files: PRFile[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await this.retryRequest(async () => {
          return await this.octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: number,
            per_page: perPage,
            page,
          });
        });

        files.push(...(response.data as PRFile[]));

        if (response.data.length < perPage) {
          break;
        }

        page++;
      }

      return files;
    } catch (error) {
      throw this.handleError(error, 'listPRFiles');
    }
  }

  /**
   * Get repository information
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Repository data
   */
  async getRepoInfo(owner: string, repo: string): Promise<Repository> {
    this.validateParams({ owner, repo });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.repos.get({
          owner,
          repo,
        });
      });

      return response.data as Repository;
    } catch (error) {
      throw this.handleError(error, 'getRepoInfo');
    }
  }

  /**
   * Check user permissions on a repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param username - Username to check
   * @returns User permissions
   */
  async checkUserPermissions(
    owner: string,
    repo: string,
    username: string
  ): Promise<Permission> {
    this.validateParams({ owner, repo, username });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.repos.getCollaboratorPermissionLevel({
          owner,
          repo,
          username,
        });
      });

      return response.data as Permission;
    } catch (error) {
      throw this.handleError(error, 'checkUserPermissions');
    }
  }

  /**
   * Get current rate limit information
   * @returns Rate limit info
   */
  async getRateLimitInfo(): Promise<RateLimitInfo> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      const rateLimitData = response.data as RateLimitResponse;

      const info: RateLimitInfo = {
        limit: rateLimitData.rate.limit,
        remaining: rateLimitData.rate.remaining,
        reset: new Date(rateLimitData.rate.reset * 1000),
        used: rateLimitData.rate.used,
      };

      // Cache the result
      this.rateLimitCache = info;
      this.lastRateLimitCheck = Date.now();

      return info;
    } catch (error) {
      throw this.handleError(error, 'getRateLimitInfo');
    }
  }

  /**
   * Handle rate limiting by waiting if necessary
   */
  async handleRateLimit(): Promise<void> {
    const rateLimitInfo = await this.getRateLimitInfo();

    if (rateLimitInfo.remaining === 0) {
      const now = Date.now();
      const resetTime = rateLimitInfo.reset.getTime();
      const waitTime = Math.max(0, resetTime - now);

      if (waitTime > 0) {
        if (this.config.log.warn) {
          this.config.log.warn(
            `Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s until reset at ${rateLimitInfo.reset.toISOString()}`
          );
        }
        await this.delay(waitTime);
      }
    } else if (rateLimitInfo.remaining < 100) {
      if (this.config.log.warn) {
        this.config.log.warn(
          `Rate limit low: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining. Resets at ${rateLimitInfo.reset.toISOString()}`
        );
      }
    }
  }

  /**
   * Check rate limit before making requests
   */
  private async checkRateLimit(): Promise<void> {
    // Use cached value if recent
    const now = Date.now();
    if (
      this.rateLimitCache &&
      now - this.lastRateLimitCheck < this.RATE_LIMIT_CACHE_TTL
    ) {
      if (this.rateLimitCache.remaining < 10) {
        await this.handleRateLimit();
      }
      return;
    }

    // Fetch fresh rate limit info
    const rateLimitInfo = await this.getRateLimitInfo();
    if (rateLimitInfo.remaining < 10) {
      await this.handleRateLimit();
    }
  }

  /**
   * Retry a request with exponential backoff
   * @param fn - Function to retry
   * @param options - Retry options
   * @returns Result of the function
   */
  async retryRequest<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    const retryableStatuses = options?.retryableStatuses ?? [408, 429, 500, 502, 503, 504];
    const backoffMultiplier = options?.backoffMultiplier ?? 2;
    const initialDelay = options?.initialDelay ?? 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        const status = error?.status || error?.response?.status;
        const isRetryable = this.isRetryableError(error, retryableStatuses);

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry non-retryable errors
        if (!isRetryable) {
          if (this.config.log.debug) {
            this.config.log.debug(
              `Error is not retryable (status: ${status}): ${error.message}`
            );
          }
          break;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        const totalDelay = delay + jitter;

        if (this.config.log.warn) {
          this.config.log.warn(
            `Request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.ceil(totalDelay / 1000)}s...`
          );
        }

        await this.delay(totalDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any, retryableStatuses: number[]): boolean {
    const status = error?.status || error?.response?.status;

    // Network errors are retryable
    if (!status) {
      return true;
    }

    // Check against retryable status codes
    return retryableStatuses.includes(status);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate required parameters
   */
  private validateParams(params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        throw new Error(`Parameter '${key}' is required`);
      }

      if (typeof value === 'number' && (isNaN(value) || value < 0)) {
        throw new Error(`Parameter '${key}' must be a valid positive number`);
      }
    }
  }

  /**
   * Validate check run data
   */
  private validateCheckRunData(data: CheckRunData): void {
    if (!data.name || !data.name.trim()) {
      throw new Error('Check run name is required');
    }

    if (!data.head_sha || !data.head_sha.trim()) {
      throw new Error('Check run head_sha is required');
    }

    if (data.status === 'completed' && !data.conclusion) {
      throw new Error('Check run conclusion is required when status is completed');
    }

    if (data.conclusion && data.status !== 'completed') {
      throw new Error('Check run conclusion can only be set when status is completed');
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, operation: string): GitHubError {
    const githubError = error as GitHubError;

    // Add operation context
    const message = githubError.response
      ? `GitHub API error during ${operation}: ${githubError.response.data?.message || githubError.message}`
      : `Error during ${operation}: ${githubError.message}`;

    const enhancedError = new Error(message) as GitHubError;
    enhancedError.status = githubError.status || githubError.response?.status;
    enhancedError.response = githubError.response;
    enhancedError.stack = githubError.stack;

    if (this.config.log.error) {
      this.config.log.error(`${operation} failed:`, {
        status: enhancedError.status,
        message: enhancedError.message,
        url: githubError.response?.url,
      });
    }

    return enhancedError;
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(): Promise<any> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.users.getAuthenticated();
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getAuthenticatedUser');
    }
  }

  /**
   * List pull request reviews
   */
  async listPRReviews(
    owner: string,
    repo: string,
    number: number
  ): Promise<any[]> {
    this.validateParams({ owner, repo, number });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.pulls.listReviews({
          owner,
          repo,
          pull_number: number,
        });
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'listPRReviews');
    }
  }

  /**
   * Create a review on a pull request
   */
  async createPRReview(
    owner: string,
    repo: string,
    number: number,
    options: {
      event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
      body?: string;
      comments?: Array<{
        path: string;
        position: number;
        body: string;
      }>;
    }
  ): Promise<any> {
    this.validateParams({ owner, repo, number });

    try {
      await this.checkRateLimit();

      const response = await this.retryRequest(async () => {
        return await this.octokit.rest.pulls.createReview({
          owner,
          repo,
          pull_number: number,
          event: options.event,
          body: options.body,
          comments: options.comments,
        });
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createPRReview');
    }
  }

  /**
   * Get Octokit instance for advanced usage
   */
  getOctokit(): InstanceType<typeof OctokitWithPlugins> {
    return this.octokit;
  }
}
