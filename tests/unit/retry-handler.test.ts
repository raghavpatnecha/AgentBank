/**
 * Unit tests for Retry Handler
 * Tests retry logic, flaky test detection, and report generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetryHandler, createRetryHandler } from '../../src/executor/retry-handler.js';
import type { TestTask, TestExecutionResult, RetryConfig } from '../../src/types/worker-types.js';

describe('RetryHandler', () => {
  let handler: RetryHandler;

  beforeEach(() => {
    handler = new RetryHandler({
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      enableJitter: false,
    });
  });

  describe('constructor', () => {
    it('should create handler with default config', () => {
      const h = new RetryHandler();
      expect(h).toBeInstanceOf(RetryHandler);
      expect(h.getConfig().maxRetries).toBeGreaterThan(0);
    });

    it('should create handler with custom config', () => {
      const h = new RetryHandler({ maxRetries: 5 });
      expect(h.getConfig().maxRetries).toBe(5);
    });

    it('should throw for invalid config', () => {
      expect(() => new RetryHandler({ maxRetries: -1 })).toThrow();
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const task: TestTask = {
        id: 'test-1',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 3,
      };

      const executor = vi.fn().mockResolvedValue({
        taskId: 'test-1',
        success: true,
        executionTime: 100,
        workerId: 'worker-1',
        retryAttempt: 0,
        isFlaky: false,
      });

      const result = await handler.executeWithRetry(task, executor);
      expect(result.success).toBe(true);
      expect(result.retryAttempt).toBe(0);
      expect(result.isFlaky).toBe(false);
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const task: TestTask = {
        id: 'test-2',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 3,
      };

      const executor = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'test-2',
          success: false,
          error: new Error('Fail 1'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        })
        .mockResolvedValueOnce({
          taskId: 'test-2',
          success: false,
          error: new Error('Fail 2'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 1,
          isFlaky: false,
        })
        .mockResolvedValue({
          taskId: 'test-2',
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 2,
          isFlaky: false,
        });

      const result = await handler.executeWithRetry(task, executor);
      expect(result.success).toBe(true);
      expect(result.isFlaky).toBe(true);
      expect(executor).toHaveBeenCalledTimes(3);
    });

    it('should record permanent failure after max retries', async () => {
      const task: TestTask = {
        id: 'test-3',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
      };

      const executor = vi.fn().mockResolvedValue({
        taskId: 'test-3',
        success: false,
        error: new Error('Persistent failure'),
        executionTime: 100,
        workerId: 'worker-1',
        retryAttempt: 0,
        isFlaky: false,
      });

      const result = await handler.executeWithRetry(task, executor);
      expect(result.success).toBe(false);
      expect(handler.isPermanentFailure('test-3')).toBe(true);
      expect(executor).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle executor throwing error', async () => {
      const task: TestTask = {
        id: 'test-4',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 1,
      };

      const executor = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await handler.executeWithRetry(task, executor);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unexpected error');
    });

    it('should respect task maxRetries over config maxRetries', async () => {
      const task: TestTask = {
        id: 'test-5',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 1, // Lower than config's 3
      };

      const executor = vi.fn().mockResolvedValue({
        taskId: 'test-5',
        success: false,
        error: new Error('Failure'),
        executionTime: 100,
        workerId: 'worker-1',
        retryAttempt: 0,
        isFlaky: false,
      });

      await handler.executeWithRetry(task, executor);
      expect(executor).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('isPermanentFailure', () => {
    it('should return false for non-failed tasks', () => {
      expect(handler.isPermanentFailure('non-existent')).toBe(false);
    });

    it('should return true for permanent failures', async () => {
      const task: TestTask = {
        id: 'test-6',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 0,
      };

      const executor = vi.fn().mockResolvedValue({
        taskId: 'test-6',
        success: false,
        error: new Error('Failure'),
        executionTime: 100,
        workerId: 'worker-1',
        retryAttempt: 0,
        isFlaky: false,
      });

      await handler.executeWithRetry(task, executor);
      expect(handler.isPermanentFailure('test-6')).toBe(true);
    });
  });

  describe('isFlaky', () => {
    it('should return false for non-flaky tasks', () => {
      expect(handler.isFlaky('non-existent')).toBe(false);
    });

    it('should return true for flaky tests', async () => {
      const task: TestTask = {
        id: 'test-7',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
      };

      const executor = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'test-7',
          success: false,
          error: new Error('Fail'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        })
        .mockResolvedValue({
          taskId: 'test-7',
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 1,
          isFlaky: false,
        });

      await handler.executeWithRetry(task, executor);
      expect(handler.isFlaky('test-7')).toBe(true);
    });
  });

  describe('getRetryAttempts', () => {
    it('should return empty array for non-existent task', () => {
      expect(handler.getRetryAttempts('non-existent')).toEqual([]);
    });

    it('should return retry attempts for task', async () => {
      const task: TestTask = {
        id: 'test-8',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
      };

      const executor = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'test-8',
          success: false,
          error: new Error('Fail 1'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        })
        .mockResolvedValue({
          taskId: 'test-8',
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 1,
          isFlaky: false,
        });

      await handler.executeWithRetry(task, executor);
      const attempts = handler.getRetryAttempts('test-8');
      expect(attempts.length).toBe(1);
      expect(attempts[0]?.attemptNumber).toBe(1);
    });
  });

  describe('getFlakyTest', () => {
    it('should return undefined for non-flaky task', () => {
      expect(handler.getFlakyTest('non-existent')).toBeUndefined();
    });

    it('should return flaky test information', async () => {
      const task: TestTask = {
        id: 'test-9',
        filePath: '/test/flaky.spec.ts',
        testName: 'flaky test',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 2,
      };

      const executor = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'test-9',
          success: false,
          error: new Error('Fail'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        })
        .mockResolvedValue({
          taskId: 'test-9',
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 1,
          isFlaky: false,
        });

      await handler.executeWithRetry(task, executor);
      const flakyTest = handler.getFlakyTest('test-9');
      expect(flakyTest).toBeDefined();
      expect(flakyTest?.testId).toBe('test-9');
      expect(flakyTest?.failureCount).toBe(1);
    });
  });

  describe('getAllFlakyTests', () => {
    it('should return empty array when no flaky tests', () => {
      expect(handler.getAllFlakyTests()).toEqual([]);
    });

    it('should return all flaky tests', async () => {
      // Create multiple flaky tests
      for (let i = 0; i < 3; i++) {
        const task: TestTask = {
          id: `flaky-${i}`,
          filePath: `/test/flaky-${i}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 2,
        };

        const executor = vi.fn()
          .mockResolvedValueOnce({
            taskId: task.id,
            success: false,
            error: new Error('Fail'),
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: 0,
            isFlaky: false,
          })
          .mockResolvedValue({
            taskId: task.id,
            success: true,
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: 1,
            isFlaky: false,
          });

        await handler.executeWithRetry(task, executor);
      }

      const flakyTests = handler.getAllFlakyTests();
      expect(flakyTests.length).toBe(3);
    });
  });

  describe('getAllPermanentFailures', () => {
    it('should return empty array when no permanent failures', () => {
      expect(handler.getAllPermanentFailures()).toEqual([]);
    });

    it('should return all permanent failures', async () => {
      for (let i = 0; i < 2; i++) {
        const task: TestTask = {
          id: `failed-${i}`,
          filePath: `/test/failed-${i}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 0,
        };

        const executor = vi.fn().mockResolvedValue({
          taskId: task.id,
          success: false,
          error: new Error('Permanent failure'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        });

        await handler.executeWithRetry(task, executor);
      }

      const failures = handler.getAllPermanentFailures();
      expect(failures.length).toBe(2);
    });
  });

  describe('generateFlakyTestReport', () => {
    it('should generate empty report', () => {
      const report = handler.generateFlakyTestReport();
      expect(report.totalFlakyTests).toBe(0);
      expect(report.flakyTests).toEqual([]);
      expect(report.statistics.totalTests).toBe(0);
    });

    it('should generate comprehensive report with statistics', async () => {
      // Create flaky tests with varying failure counts
      const failureCounts = [1, 2, 3];
      for (const failCount of failureCounts) {
        const task: TestTask = {
          id: `test-fail-${failCount}`,
          filePath: `/test/file-${failCount}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 3,
        };

        const executor = vi.fn();
        for (let i = 0; i < failCount; i++) {
          executor.mockResolvedValueOnce({
            taskId: task.id,
            success: false,
            error: new Error(`Fail ${i}`),
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: i,
            isFlaky: false,
          });
        }
        executor.mockResolvedValue({
          taskId: task.id,
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: failCount,
          isFlaky: false,
        });

        await handler.executeWithRetry(task, executor);
      }

      const report = handler.generateFlakyTestReport();
      expect(report.totalFlakyTests).toBe(3);
      expect(report.statistics.totalTests).toBe(3);
      expect(report.statistics.flakyPercentage).toBe(100);
      expect(report.statistics.averageRetries).toBe(2); // (1+2+3)/3
      expect(report.statistics.mostFlakyTest?.failureCount).toBe(3);
    });

    it('should sort flaky tests by failure count', async () => {
      const failureCounts = [1, 3, 2];
      for (const failCount of failureCounts) {
        const task: TestTask = {
          id: `test-${failCount}`,
          filePath: '/test/file.spec.ts',
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 3,
        };

        const executor = vi.fn();
        for (let i = 0; i < failCount; i++) {
          executor.mockResolvedValueOnce({
            taskId: task.id,
            success: false,
            error: new Error('Fail'),
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: i,
            isFlaky: false,
          });
        }
        executor.mockResolvedValue({
          taskId: task.id,
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: failCount,
          isFlaky: false,
        });

        await handler.executeWithRetry(task, executor);
      }

      const report = handler.generateFlakyTestReport();
      expect(report.flakyTests[0]?.failureCount).toBe(3);
      expect(report.flakyTests[1]?.failureCount).toBe(2);
      expect(report.flakyTests[2]?.failureCount).toBe(1);
    });
  });

  describe('exportFlakyTestReport', () => {
    it('should export report as JSON string', () => {
      const json = handler.exportFlakyTestReport();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('generatedAt');
      expect(parsed).toHaveProperty('totalFlakyTests');
      expect(parsed).toHaveProperty('flakyTests');
      expect(parsed).toHaveProperty('statistics');
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      const task: TestTask = {
        id: 'test-reset',
        filePath: '/test/file.spec.ts',
        priority: 1,
        requiresSerialization: false,
        dependencies: [],
        retryCount: 0,
        maxRetries: 1,
      };

      const executor = vi.fn()
        .mockResolvedValueOnce({
          taskId: 'test-reset',
          success: false,
          error: new Error('Fail'),
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        })
        .mockResolvedValue({
          taskId: 'test-reset',
          success: true,
          executionTime: 100,
          workerId: 'worker-1',
          retryAttempt: 1,
          isFlaky: false,
        });

      await handler.executeWithRetry(task, executor);
      expect(handler.isFlaky('test-reset')).toBe(true);

      handler.reset();
      expect(handler.isFlaky('test-reset')).toBe(false);
      expect(handler.getAllFlakyTests()).toEqual([]);
      expect(handler.getAllPermanentFailures()).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics for new handler', () => {
      const stats = handler.getStatistics();
      expect(stats.totalTasks).toBe(0);
      expect(stats.flakyTests).toBe(0);
      expect(stats.permanentFailures).toBe(0);
      expect(stats.totalRetryAttempts).toBe(0);
    });

    it('should return accurate statistics', async () => {
      // Execute some tasks
      const tasks = [
        { id: 't1', maxRetries: 2, shouldFail: false },
        { id: 't2', maxRetries: 2, shouldFail: true },
        { id: 't3', maxRetries: 1, shouldFail: false },
      ];

      for (const t of tasks) {
        const task: TestTask = {
          id: t.id,
          filePath: '/test/file.spec.ts',
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: t.maxRetries,
        };

        const executor = vi.fn();
        if (t.shouldFail) {
          executor.mockResolvedValue({
            taskId: t.id,
            success: false,
            error: new Error('Fail'),
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: 0,
            isFlaky: false,
          });
        } else {
          executor.mockResolvedValueOnce({
            taskId: t.id,
            success: false,
            error: new Error('Fail'),
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: 0,
            isFlaky: false,
          }).mockResolvedValue({
            taskId: t.id,
            success: true,
            executionTime: 100,
            workerId: 'worker-1',
            retryAttempt: 1,
            isFlaky: false,
          });
        }

        await handler.executeWithRetry(task, executor);
      }

      const stats = handler.getStatistics();
      expect(stats.totalTasks).toBe(3);
      expect(stats.flakyTests).toBe(2);
      expect(stats.permanentFailures).toBe(1);
    });
  });

  describe('getConfig and updateConfig', () => {
    it('should get current config', () => {
      const config = handler.getConfig();
      expect(config.maxRetries).toBe(3);
      expect(config.initialDelayMs).toBe(10);
    });

    it('should update config', () => {
      handler.updateConfig({ maxRetries: 5 });
      expect(handler.getConfig().maxRetries).toBe(5);
    });

    it('should throw for invalid config update', () => {
      expect(() => handler.updateConfig({ maxRetries: -1 })).toThrow();
    });
  });

  describe('createRetryHandler', () => {
    it('should create handler with default config', () => {
      const h = createRetryHandler();
      expect(h).toBeInstanceOf(RetryHandler);
    });

    it('should create handler with custom config', () => {
      const h = createRetryHandler({ maxRetries: 10 });
      expect(h.getConfig().maxRetries).toBe(10);
    });
  });
});
