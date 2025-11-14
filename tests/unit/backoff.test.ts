/**
 * Unit tests for Backoff Utility
 * Tests exponential backoff, jitter, sleep, and retry execution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateBackoff,
  applyJitter,
  sleep,
  executeWithBackoff,
  createRetryConfig,
  calculateTotalRetryTime,
  validateRetryConfig,
  DEFAULT_RETRY_CONFIG,
} from '../../src/utils/backoff.js';
import type { RetryConfig } from '../../src/types/executor-types.js';

describe('Backoff Utility', () => {
  describe('calculateBackoff', () => {
    it('should calculate exponential backoff for attempt 0', () => {
      const result = calculateBackoff(0);
      expect(result.delayMs).toBeGreaterThanOrEqual(700); // 1000 * (1 - 0.3)
      expect(result.delayMs).toBeLessThanOrEqual(1300); // 1000 * (1 + 0.3)
      expect(result.attemptNumber).toBe(0);
      expect(result.maxDelayReached).toBe(false);
    });

    it('should calculate exponential backoff for attempt 1', () => {
      const result = calculateBackoff(1);
      expect(result.delayMs).toBeGreaterThanOrEqual(1400); // 2000 * (1 - 0.3)
      expect(result.delayMs).toBeLessThanOrEqual(2600); // 2000 * (1 + 0.3)
    });

    it('should calculate exponential backoff for attempt 2', () => {
      const result = calculateBackoff(2);
      expect(result.delayMs).toBeGreaterThanOrEqual(2800); // 4000 * (1 - 0.3)
      expect(result.delayMs).toBeLessThanOrEqual(5200); // 4000 * (1 + 0.3)
    });

    it('should cap at maximum delay', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxDelayMs: 5000,
      };
      const result = calculateBackoff(10, config);
      expect(result.delayMs).toBeLessThanOrEqual(5000 * 1.3); // Account for jitter
      expect(result.maxDelayReached).toBe(true);
    });

    it('should work without jitter', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        enableJitter: false,
      };
      const result = calculateBackoff(1, config);
      expect(result.delayMs).toBe(2000); // Exactly 2 seconds
    });

    it('should throw error for negative attempt number', () => {
      expect(() => calculateBackoff(-1)).toThrow('Attempt number must be non-negative');
    });

    it('should handle custom backoff multiplier', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        backoffMultiplier: 3,
        enableJitter: false,
      };
      const result = calculateBackoff(2, config);
      expect(result.delayMs).toBe(9000); // 1000 * 3^2
    });

    it('should handle custom initial delay', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        initialDelayMs: 500,
        enableJitter: false,
      };
      const result = calculateBackoff(0, config);
      expect(result.delayMs).toBe(500);
    });
  });

  describe('applyJitter', () => {
    it('should apply jitter within expected range', () => {
      const delay = 1000;
      const jitterFactor = 0.3;

      // Run multiple times to test randomness
      for (let i = 0; i < 10; i++) {
        const result = applyJitter(delay, jitterFactor);
        expect(result).toBeGreaterThanOrEqual(700); // 1000 * (1 - 0.3)
        expect(result).toBeLessThanOrEqual(1300); // 1000 * (1 + 0.3)
      }
    });

    it('should return same value with zero jitter', () => {
      const delay = 1000;
      const result = applyJitter(delay, 0);
      expect(result).toBe(delay);
    });

    it('should throw error for negative jitter factor', () => {
      expect(() => applyJitter(1000, -0.1)).toThrow('Jitter factor must be between 0 and 1');
    });

    it('should throw error for jitter factor > 1', () => {
      expect(() => applyJitter(1000, 1.5)).toThrow('Jitter factor must be between 0 and 1');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should sleep for specified duration', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await promise;
      // If we get here without timing out, the test passes
      expect(true).toBe(true);
    });

    it('should handle zero delay', async () => {
      const promise = sleep(0);
      vi.advanceTimersByTime(0);
      await promise;
      expect(true).toBe(true);
    });

    it('should throw error for negative delay', async () => {
      await expect(sleep(-100)).rejects.toThrow('Delay must be non-negative');
    });
  });

  describe('executeWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await executeWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
        initialDelayMs: 10,
        enableJitter: false,
      };

      const promise = executeWithBackoff(fn, config);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
        initialDelayMs: 10,
      };

      const promise = executeWithBackoff(fn, config);
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect shouldRetry function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
      const shouldRetry = vi.fn().mockReturnValue(false);
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
      };

      await expect(executeWithBackoff(fn, config, shouldRetry)).rejects.toThrow('non-retryable');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    it('should only retry on retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const shouldRetry = (error: Error) => /ECONNREFUSED/.test(error.message);
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
        initialDelayMs: 10,
      };

      const promise = executeWithBackoff(fn, config, shouldRetry);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createRetryConfig', () => {
    it('should create config with defaults', () => {
      const config = createRetryConfig({});
      expect(config).toEqual(DEFAULT_RETRY_CONFIG);
    });

    it('should override specific values', () => {
      const config = createRetryConfig({
        maxRetries: 5,
        initialDelayMs: 2000,
      });
      expect(config.maxRetries).toBe(5);
      expect(config.initialDelayMs).toBe(2000);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier);
    });
  });

  describe('calculateTotalRetryTime', () => {
    it('should calculate total time without jitter', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        enableJitter: false,
      };

      const totalTime = calculateTotalRetryTime(config);
      // 1000 + 2000 + 4000 = 7000
      expect(totalTime).toBe(7000);
    });

    it('should calculate total time with jitter (approximate)', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        enableJitter: true,
        jitterFactor: 0.3,
      };

      const totalTime = calculateTotalRetryTime(config);
      // Should be around 7000, but with jitter variance
      expect(totalTime).toBeGreaterThan(4900); // 7000 * 0.7
      expect(totalTime).toBeLessThan(9100); // 7000 * 1.3
    });

    it('should return 0 for zero retries', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 0,
      };
      expect(calculateTotalRetryTime(config)).toBe(0);
    });
  });

  describe('validateRetryConfig', () => {
    it('should validate correct config', () => {
      expect(() => validateRetryConfig(DEFAULT_RETRY_CONFIG)).not.toThrow();
    });

    it('should throw for negative maxRetries', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: -1,
      };
      expect(() => validateRetryConfig(config)).toThrow('maxRetries must be non-negative');
    });

    it('should throw for non-positive initialDelayMs', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        initialDelayMs: 0,
      };
      expect(() => validateRetryConfig(config)).toThrow('initialDelayMs must be positive');
    });

    it('should throw for maxDelayMs < initialDelayMs', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        initialDelayMs: 5000,
        maxDelayMs: 1000,
      };
      expect(() => validateRetryConfig(config)).toThrow(
        'maxDelayMs must be greater than or equal to initialDelayMs'
      );
    });

    it('should throw for backoffMultiplier <= 1', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        backoffMultiplier: 1,
      };
      expect(() => validateRetryConfig(config)).toThrow('backoffMultiplier must be greater than 1');
    });

    it('should throw for invalid jitterFactor', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        jitterFactor: 1.5,
      };
      expect(() => validateRetryConfig(config)).toThrow('jitterFactor must be between 0 and 1');
    });
  });
});
