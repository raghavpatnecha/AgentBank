/**
 * OpenAI Client for AI-powered test generation and repair
 *
 * Features:
 * - GPT-4 integration with retry logic
 * - Exponential backoff for rate limiting
 * - Token usage monitoring
 * - Response caching
 * - Graceful degradation
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';

/**
 * OpenAI configuration options
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  timeout?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

/**
 * Completion result from OpenAI
 */
export interface CompletionResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached: boolean;
  retryCount: number;
}

/**
 * Token usage metrics
 */
export interface TokenMetrics {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageTokensPerRequest: number;
  estimatedCostUSD: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limitRequests: number;
  limitTokens: number;
  remainingRequests: number;
  remainingTokens: number;
  resetRequests: Date | null;
  resetTokens: Date | null;
}

/**
 * Error types for OpenAI operations
 */
export class OpenAIError extends Error {
  constructor(message: string, public readonly code: string, public readonly status?: number) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class RateLimitError extends OpenAIError {
  constructor(message: string, public readonly retryAfter: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ConfigurationError extends OpenAIError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * OpenAI client with retry logic, caching, and monitoring
 */
export class OpenAIClient {
  private client: OpenAI;
  private config: Required<OpenAIConfig>;
  private cache: Map<string, { result: CompletionResult; expiresAt: number }>;
  private metrics: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    requestCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
  private rateLimitInfo: RateLimitInfo;

  constructor(config: OpenAIConfig) {
    this.validateConfig(config);

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens || 2000,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 60000,
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour default
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
      maxRetries: 0, // We handle retries manually
    });

    this.cache = new Map();
    this.metrics = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.rateLimitInfo = {
      limitRequests: 0,
      limitTokens: 0,
      remainingRequests: 0,
      remainingTokens: 0,
      resetRequests: null,
      resetTokens: null,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: OpenAIConfig): void {
    if (!config.apiKey) {
      throw new ConfigurationError('API key is required');
    }

    if (config.apiKey.trim().length === 0) {
      throw new ConfigurationError('API key cannot be empty');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      throw new ConfigurationError('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens <= 0) {
      throw new ConfigurationError('Max tokens must be positive');
    }

    if (config.maxRetries !== undefined && config.maxRetries < 0) {
      throw new ConfigurationError('Max retries cannot be negative');
    }

    if (config.timeout !== undefined && config.timeout <= 0) {
      throw new ConfigurationError('Timeout must be positive');
    }

    if (config.cacheTTL !== undefined && config.cacheTTL < 0) {
      throw new ConfigurationError('Cache TTL cannot be negative');
    }
  }

  /**
   * Generate a completion from OpenAI
   */
  async generateCompletion(prompt: string): Promise<CompletionResult> {
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResponse(prompt);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
      this.metrics.cacheMisses++;
    }

    // Make API call
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      // Update rate limit info from headers
      this.updateRateLimitInfo(response);

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const result: CompletionResult = {
        content,
        model: response.model,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cached: false,
        retryCount: 0,
      };

      // Update metrics
      this.updateMetrics(result);

      // Cache the result
      if (this.config.enableCaching) {
        this.cacheResponse(prompt, result);
      }

      return result;
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new RateLimitError(
          'Rate limit exceeded',
          this.getRetryAfter(error)
        );
      }

      throw new OpenAIError(
        error instanceof Error ? error.message : 'Unknown error',
        'API_ERROR',
        this.getErrorStatus(error)
      );
    }
  }

  /**
   * Generate completion with retry logic
   */
  async generateWithRetry(
    prompt: string,
    maxRetries?: number
  ): Promise<CompletionResult> {
    const retries = maxRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.generateCompletion(prompt);
        result.retryCount = attempt;
        return result;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof RateLimitError) {
          // Handle rate limiting with exponential backoff
          if (attempt < retries) {
            const delay = this.calculateBackoffDelay(attempt, error.retryAfter);
            console.warn(
              `Rate limit hit, retrying after ${delay}ms (attempt ${attempt + 1}/${retries})`
            );
            await this.sleep(delay);
            continue;
          }
        } else if (this.isRetryableError(error)) {
          // Retry other retryable errors with exponential backoff
          if (attempt < retries) {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(
              `Retryable error, retrying after ${delay}ms (attempt ${attempt + 1}/${retries})`
            );
            await this.sleep(delay);
            continue;
          }
        }

        // Non-retryable error, throw immediately
        throw error;
      }
    }

    throw lastError || new OpenAIError('Max retries exceeded', 'MAX_RETRIES');
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter) {
      return retryAfter * 1000;
    }

    // Exponential backoff: 2s, 4s, 8s
    const baseDelay = 2000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);

    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);

    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof RateLimitError) {
      return true;
    }

    const err = error as any;
    return (
      err?.status === 429 ||
      err?.code === 'rate_limit_exceeded' ||
      err?.type === 'rate_limit_error'
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const err = error as any;
    const status = err?.status || 0;

    // Retry on 5xx errors, timeouts, and network errors
    return (
      status >= 500 ||
      err?.code === 'ECONNRESET' ||
      err?.code === 'ETIMEDOUT' ||
      err?.code === 'ENOTFOUND'
    );
  }

  /**
   * Get retry-after value from error
   */
  private getRetryAfter(error: unknown): number {
    const err = error as any;

    // Check for retry-after header
    if (err?.headers?.['retry-after']) {
      return parseInt(err.headers['retry-after'], 10);
    }

    // Default to 2 seconds
    return 2;
  }

  /**
   * Get error status code
   */
  private getErrorStatus(error: unknown): number | undefined {
    const err = error as any;
    return err?.status;
  }

  /**
   * Update rate limit information from response
   */
  private updateRateLimitInfo(response: any): void {
    // Note: OpenAI's Node SDK doesn't expose headers directly
    // This is a placeholder for when headers are available
    const headers = (response as any).headers || {};

    if (headers['x-ratelimit-limit-requests']) {
      this.rateLimitInfo.limitRequests = parseInt(
        headers['x-ratelimit-limit-requests'],
        10
      );
    }

    if (headers['x-ratelimit-limit-tokens']) {
      this.rateLimitInfo.limitTokens = parseInt(
        headers['x-ratelimit-limit-tokens'],
        10
      );
    }

    if (headers['x-ratelimit-remaining-requests']) {
      this.rateLimitInfo.remainingRequests = parseInt(
        headers['x-ratelimit-remaining-requests'],
        10
      );
    }

    if (headers['x-ratelimit-remaining-tokens']) {
      this.rateLimitInfo.remainingTokens = parseInt(
        headers['x-ratelimit-remaining-tokens'],
        10
      );
    }

    if (headers['x-ratelimit-reset-requests']) {
      this.rateLimitInfo.resetRequests = new Date(
        headers['x-ratelimit-reset-requests']
      );
    }

    if (headers['x-ratelimit-reset-tokens']) {
      this.rateLimitInfo.resetTokens = new Date(
        headers['x-ratelimit-reset-tokens']
      );
    }
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Get cached response
   */
  private getCachedResponse(prompt: string): CompletionResult | null {
    const key = this.getCacheKey(prompt);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...cached.result,
      cached: true,
    };
  }

  /**
   * Cache response
   */
  private cacheResponse(prompt: string, result: CompletionResult): void {
    const key = this.getCacheKey(prompt);
    const expiresAt = Date.now() + this.config.cacheTTL;

    this.cache.set(key, {
      result: { ...result, cached: false },
      expiresAt,
    });

    // Clean expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanExpiredCache();
    }
  }

  /**
   * Get cache key for prompt
   */
  private getCacheKey(prompt: string): string {
    return createHash('sha256')
      .update(prompt)
      .update(this.config.model)
      .update(String(this.config.temperature))
      .update(String(this.config.maxTokens))
      .digest('hex');
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: CompletionResult): void {
    this.metrics.totalPromptTokens += result.usage.promptTokens;
    this.metrics.totalCompletionTokens += result.usage.completionTokens;
    this.metrics.totalTokens += result.usage.totalTokens;
    this.metrics.requestCount++;
  }

  /**
   * Get token usage metrics
   */
  monitorTokenUsage(): TokenMetrics {
    const averageTokensPerRequest =
      this.metrics.requestCount > 0
        ? this.metrics.totalTokens / this.metrics.requestCount
        : 0;

    // GPT-4 pricing (approximate)
    const promptCostPer1k = 0.03; // $0.03 per 1K prompt tokens
    const completionCostPer1k = 0.06; // $0.06 per 1K completion tokens

    const estimatedCostUSD =
      (this.metrics.totalPromptTokens / 1000) * promptCostPer1k +
      (this.metrics.totalCompletionTokens / 1000) * completionCostPer1k;

    return {
      totalPromptTokens: this.metrics.totalPromptTokens,
      totalCompletionTokens: this.metrics.totalCompletionTokens,
      totalTokens: this.metrics.totalTokens,
      requestCount: this.metrics.requestCount,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      averageTokensPerRequest,
      estimatedCostUSD,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.metrics.cacheHits / total : 0,
      missRate: total > 0 ? this.metrics.cacheMisses / total : 0,
    };
  }

  /**
   * Test connection to OpenAI
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateCompletion('Hello');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get client configuration (without API key)
   */
  getConfig(): Omit<Required<OpenAIConfig>, 'apiKey'> {
    const { apiKey, ...config } = this.config;
    return config;
  }
}
