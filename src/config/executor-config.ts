/**
 * Executor Configuration
 * Centralized configuration for test execution, workers, and retry logic
 */

import type { WorkerConfig, RetryConfig } from '../types/worker-types.js';
import { DEFAULT_RETRY_CONFIG } from '../utils/backoff.js';

/**
 * Environment variable configuration keys
 */
export const ENV_KEYS = {
  // Worker configuration
  MAX_WORKERS: 'MAX_WORKERS',
  MIN_WORKERS: 'MIN_WORKERS',
  WORKER_MEMORY_LIMIT_MB: 'WORKER_MEMORY_LIMIT_MB',
  WORKER_TIMEOUT_MS: 'WORKER_TIMEOUT_MS',
  WORKER_ISOLATION: 'WORKER_ISOLATION',

  // Retry configuration
  MAX_RETRIES: 'MAX_RETRIES',
  INITIAL_DELAY_MS: 'INITIAL_DELAY_MS',
  MAX_DELAY_MS: 'MAX_DELAY_MS',
  BACKOFF_MULTIPLIER: 'BACKOFF_MULTIPLIER',
  ENABLE_JITTER: 'ENABLE_JITTER',
  JITTER_FACTOR: 'JITTER_FACTOR',

  // Execution configuration
  GLOBAL_TIMEOUT_MS: 'GLOBAL_TIMEOUT_MS',
  ACTION_TIMEOUT_MS: 'ACTION_TIMEOUT_MS',
  NAVIGATION_TIMEOUT_MS: 'NAVIGATION_TIMEOUT_MS',
  API_BASE_URL: 'API_BASE_URL',

  // CI/CD configuration
  CI: 'CI',
  CI_WORKERS: 'CI_WORKERS',
} as const;

/**
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  maxWorkers: parseInt(process.env[ENV_KEYS.MAX_WORKERS] || '4', 10),
  minWorkers: parseInt(process.env[ENV_KEYS.MIN_WORKERS] || '1', 10),
  memoryLimitMB: parseInt(process.env[ENV_KEYS.WORKER_MEMORY_LIMIT_MB] || '512', 10),
  workerTimeout: parseInt(process.env[ENV_KEYS.WORKER_TIMEOUT_MS] || '30000', 10),
  isolation: process.env[ENV_KEYS.WORKER_ISOLATION] === 'true',
};

/**
 * Get worker configuration from environment
 */
export function getWorkerConfig(): WorkerConfig {
  return { ...DEFAULT_WORKER_CONFIG };
}

/**
 * Get retry configuration from environment
 */
export function getRetryConfig(): RetryConfig {
  return {
    maxRetries: parseInt(
      process.env[ENV_KEYS.MAX_RETRIES] || DEFAULT_RETRY_CONFIG.maxRetries.toString(),
      10
    ),
    initialDelayMs: parseInt(
      process.env[ENV_KEYS.INITIAL_DELAY_MS] || DEFAULT_RETRY_CONFIG.initialDelayMs.toString(),
      10
    ),
    maxDelayMs: parseInt(
      process.env[ENV_KEYS.MAX_DELAY_MS] || DEFAULT_RETRY_CONFIG.maxDelayMs.toString(),
      10
    ),
    backoffMultiplier: parseFloat(
      process.env[ENV_KEYS.BACKOFF_MULTIPLIER] || DEFAULT_RETRY_CONFIG.backoffMultiplier.toString()
    ),
    enableJitter: process.env[ENV_KEYS.ENABLE_JITTER] !== 'false',
    jitterFactor: parseFloat(
      process.env[ENV_KEYS.JITTER_FACTOR] || DEFAULT_RETRY_CONFIG.jitterFactor.toString()
    ),
  };
}

/**
 * Executor configuration
 */
export interface ExecutorConfig {
  worker: WorkerConfig;
  retry: RetryConfig;
  globalTimeout: number;
  actionTimeout: number;
  navigationTimeout: number;
  baseURL: string;
  isCI: boolean;
}

/**
 * Get complete executor configuration
 */
export function getExecutorConfig(): ExecutorConfig {
  const isCI = process.env[ENV_KEYS.CI] === 'true';

  return {
    worker: getWorkerConfig(),
    retry: getRetryConfig(),
    globalTimeout: parseInt(process.env[ENV_KEYS.GLOBAL_TIMEOUT_MS] || '600000', 10),
    actionTimeout: parseInt(process.env[ENV_KEYS.ACTION_TIMEOUT_MS] || '10000', 10),
    navigationTimeout: parseInt(process.env[ENV_KEYS.NAVIGATION_TIMEOUT_MS] || '30000', 10),
    baseURL: process.env[ENV_KEYS.API_BASE_URL] || 'http://localhost:3000',
    isCI,
  };
}

/**
 * Validate executor configuration
 */
export function validateExecutorConfig(config: ExecutorConfig): string[] {
  const errors: string[] = [];

  // Validate worker config
  if (config.worker.maxWorkers < 1) {
    errors.push('maxWorkers must be at least 1');
  }
  if (config.worker.minWorkers < 1) {
    errors.push('minWorkers must be at least 1');
  }
  if (config.worker.minWorkers > config.worker.maxWorkers) {
    errors.push('minWorkers cannot exceed maxWorkers');
  }
  if (config.worker.memoryLimitMB < 64) {
    errors.push('memoryLimitMB must be at least 64');
  }
  if (config.worker.workerTimeout < 1000) {
    errors.push('workerTimeout must be at least 1000ms');
  }

  // Validate retry config
  if (config.retry.maxRetries < 0) {
    errors.push('maxRetries must be non-negative');
  }
  if (config.retry.initialDelayMs <= 0) {
    errors.push('initialDelayMs must be positive');
  }
  if (config.retry.maxDelayMs < config.retry.initialDelayMs) {
    errors.push('maxDelayMs must be greater than or equal to initialDelayMs');
  }
  if (config.retry.backoffMultiplier <= 1) {
    errors.push('backoffMultiplier must be greater than 1');
  }
  if (config.retry.jitterFactor < 0 || config.retry.jitterFactor > 1) {
    errors.push('jitterFactor must be between 0 and 1');
  }

  // Validate timeouts
  if (config.globalTimeout <= 0) {
    errors.push('globalTimeout must be positive');
  }
  if (config.actionTimeout <= 0) {
    errors.push('actionTimeout must be positive');
  }
  if (config.navigationTimeout <= 0) {
    errors.push('navigationTimeout must be positive');
  }

  // Validate base URL
  try {
    new URL(config.baseURL);
  } catch {
    errors.push('baseURL must be a valid URL');
  }

  return errors;
}

/**
 * Print configuration summary
 */
export function printConfigSummary(config: ExecutorConfig): void {
  console.warn('Executor Configuration:');
  console.warn('  Worker Configuration:');
  console.warn(`    Max Workers: ${config.worker.maxWorkers}`);
  console.warn(`    Min Workers: ${config.worker.minWorkers}`);
  console.warn(`    Memory Limit: ${config.worker.memoryLimitMB}MB`);
  console.warn(`    Worker Timeout: ${config.worker.workerTimeout}ms`);
  console.warn(`    Isolation: ${config.worker.isolation}`);
  console.warn('  Retry Configuration:');
  console.warn(`    Max Retries: ${config.retry.maxRetries}`);
  console.warn(`    Initial Delay: ${config.retry.initialDelayMs}ms`);
  console.warn(`    Max Delay: ${config.retry.maxDelayMs}ms`);
  console.warn(`    Backoff Multiplier: ${config.retry.backoffMultiplier}x`);
  console.warn(
    `    Jitter: ${config.retry.enableJitter ? `Enabled (${config.retry.jitterFactor * 100}%)` : 'Disabled'}`
  );
  console.warn('  Execution Configuration:');
  console.warn(`    Global Timeout: ${config.globalTimeout}ms`);
  console.warn(`    Action Timeout: ${config.actionTimeout}ms`);
  console.warn(`    Navigation Timeout: ${config.navigationTimeout}ms`);
  console.warn(`    Base URL: ${config.baseURL}`);
  console.warn(`    CI Mode: ${config.isCI ? 'Yes' : 'No'}`);
}
