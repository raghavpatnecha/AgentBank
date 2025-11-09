/**
 * Exponential Backoff Utility
 * Provides intelligent retry delays with jitter to prevent thundering herd
 */

import type { RetryConfig, BackoffResult } from '../types/worker-types.js';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  enableJitter: true,
  jitterFactor: 0.3, // 30% jitter
};

/**
 * Calculate exponential backoff delay with optional jitter
 *
 * Formula: delay = min(initialDelay * (multiplier ^ attemptNumber), maxDelay)
 * With jitter: delay = delay * (1 + random(-jitterFactor, +jitterFactor))
 *
 * @param attemptNumber - Retry attempt number (0-based)
 * @param config - Retry configuration
 * @returns Backoff calculation result
 */
export function calculateBackoff(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): BackoffResult {
  if (attemptNumber < 0) {
    throw new Error('Attempt number must be non-negative');
  }

  // Calculate base delay using exponential backoff
  const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);

  // Cap at maximum delay
  const cappedDelay = Math.min(baseDelay, config.maxDelayMs);
  const maxDelayReached = baseDelay >= config.maxDelayMs;

  // Apply jitter if enabled
  let finalDelay = cappedDelay;
  if (config.enableJitter) {
    finalDelay = applyJitter(cappedDelay, config.jitterFactor);
  }

  return {
    delayMs: Math.round(finalDelay),
    maxDelayReached,
    attemptNumber,
  };
}

/**
 * Apply jitter to a delay value
 * Jitter helps prevent thundering herd problem when multiple retries happen simultaneously
 *
 * @param delay - Base delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1), e.g., 0.3 = ±30%
 * @returns Delay with jitter applied
 */
export function applyJitter(delay: number, jitterFactor: number): number {
  if (jitterFactor < 0 || jitterFactor > 1) {
    throw new Error('Jitter factor must be between 0 and 1');
  }

  // Generate random jitter between -jitterFactor and +jitterFactor
  const jitter = (Math.random() * 2 - 1) * jitterFactor;
  return delay * (1 + jitter);
}

/**
 * Wait/sleep for specified duration
 *
 * @param delayMs - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export async function sleep(delayMs: number): Promise<void> {
  if (delayMs < 0) {
    throw new Error('Delay must be non-negative');
  }

  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Execute function with exponential backoff retry
 *
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @param shouldRetry - Optional function to determine if error is retryable
 * @returns Result from successful execution
 */
export async function executeWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry?: (error: Error) => boolean
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't delay after last attempt
      if (attempt < config.maxRetries) {
        const backoff = calculateBackoff(attempt, config);
        await sleep(backoff.delayMs);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Create a retry configuration with custom values
 *
 * @param partial - Partial retry configuration
 * @returns Complete retry configuration
 */
export function createRetryConfig(partial: Partial<RetryConfig>): RetryConfig {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...partial,
  };
}

/**
 * Calculate total maximum time for all retry attempts
 *
 * @param config - Retry configuration
 * @returns Total maximum time in milliseconds
 */
export function calculateTotalRetryTime(config: RetryConfig): number {
  let totalTime = 0;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    const backoff = calculateBackoff(attempt, config);
    totalTime += backoff.delayMs;
  }

  return totalTime;
}

/**
 * Validate retry configuration
 *
 * @param config - Retry configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateRetryConfig(config: RetryConfig): void {
  if (config.maxRetries < 0) {
    throw new Error('maxRetries must be non-negative');
  }
  if (config.initialDelayMs <= 0) {
    throw new Error('initialDelayMs must be positive');
  }
  if (config.maxDelayMs < config.initialDelayMs) {
    throw new Error('maxDelayMs must be greater than or equal to initialDelayMs');
  }
  if (config.backoffMultiplier <= 1) {
    throw new Error('backoffMultiplier must be greater than 1');
  }
  if (config.jitterFactor < 0 || config.jitterFactor > 1) {
    throw new Error('jitterFactor must be between 0 and 1');
  }
}
