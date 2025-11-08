/**
 * Performance tests for parallel execution
 * Tests worker manager performance, scalability, and resource usage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkerManager } from '../../src/executor/worker-manager.js';
import { RetryHandler } from '../../src/executor/retry-handler.js';
import type { TestTask, TestExecutionResult } from '../../src/types/worker-types.js';

describe('Parallel Execution Performance', () => {
  let manager: WorkerManager;
  let retryHandler: RetryHandler;

  beforeEach(() => {
    manager = new WorkerManager({
      maxWorkers: 8,
      minWorkers: 2,
      memoryLimitMB: 512,
      workerTimeout: 10000,
      isolation: true,
    });

    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      enableJitter: true,
      jitterFactor: 0.3,
    });
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe('Throughput', () => {
    it('should execute 50 parallel tasks efficiently', async () => {
      const taskCount = 50;
      const tasks: TestTask[] = [];

      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `perf-task-${i}`,
          filePath: `/test/perf-${i}.spec.ts`,
          priority: Math.floor(Math.random() * 5) + 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 1,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        // Simulate test execution with random duration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
        return {
          taskId: task.id,
          success: true,
          executionTime: Math.random() * 100 + 50,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      const startTime = Date.now();
      const results = await manager.executeTasks(executor);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(taskCount);
      expect(results.every(r => r.success)).toBe(true);

      // Should complete in reasonable time with parallelization
      // Sequential would take ~1500ms (50 * 30ms avg), parallel should be much faster
      expect(duration).toBeLessThan(1000);

      console.log(`Executed ${taskCount} tasks in ${duration}ms`);
      console.log(`Throughput: ${(taskCount / duration * 1000).toFixed(2)} tasks/sec`);
    }, 15000);

    it('should handle mixed serial and parallel tasks', async () => {
      const tasks: TestTask[] = [];

      // Add 10 serial tasks
      for (let i = 0; i < 10; i++) {
        tasks.push({
          id: `serial-${i}`,
          filePath: `/test/serial-${i}.spec.ts`,
          priority: 5,
          requiresSerialization: true,
          dependencies: [],
          retryCount: 0,
          maxRetries: 0,
        });
      }

      // Add 40 parallel tasks
      for (let i = 0; i < 40; i++) {
        tasks.push({
          id: `parallel-${i}`,
          filePath: `/test/parallel-${i}.spec.ts`,
          priority: 3,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 0,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          taskId: task.id,
          success: true,
          executionTime: 20,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      const startTime = Date.now();
      const results = await manager.executeTasks(executor);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(50);
      console.log(`Mixed execution completed in ${duration}ms`);
    }, 15000);
  });

  describe('Scalability', () => {
    it('should scale with increasing worker count', async () => {
      const taskCount = 100;
      const workerCounts = [1, 2, 4, 8];
      const results: Array<{ workers: number; duration: number }> = [];

      for (const workerCount of workerCounts) {
        const testManager = new WorkerManager({
          maxWorkers: workerCount,
          minWorkers: workerCount,
          memoryLimitMB: 512,
          workerTimeout: 10000,
          isolation: true,
        });

        const tasks: TestTask[] = [];
        for (let i = 0; i < taskCount; i++) {
          tasks.push({
            id: `scale-${workerCount}-${i}`,
            filePath: `/test/scale-${i}.spec.ts`,
            priority: 1,
            requiresSerialization: false,
            dependencies: [],
            retryCount: 0,
            maxRetries: 0,
          });
        }

        for (const task of tasks) {
          await testManager.scheduleTask(task);
        }

        const executor = async (task: TestTask): Promise<TestExecutionResult> => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return {
            taskId: task.id,
            success: true,
            executionTime: 10,
            workerId: 'worker-1',
            retryAttempt: 0,
            isFlaky: false,
          };
        };

        const startTime = Date.now();
        await testManager.executeTasks(executor);
        const duration = Date.now() - startTime;

        results.push({ workers: workerCount, duration });
        await testManager.shutdown();
      }

      // Duration should decrease as worker count increases
      console.log('Scalability results:');
      results.forEach(r => {
        console.log(`  ${r.workers} workers: ${r.duration}ms`);
      });

      // Each doubling of workers should improve performance
      expect(results[3]!.duration).toBeLessThan(results[0]!.duration);
    }, 30000);
  });

  describe('Resource Management', () => {
    it('should manage memory efficiently', async () => {
      const taskCount = 100;
      const tasks: TestTask[] = [];

      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `mem-task-${i}`,
          filePath: `/test/mem-${i}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 0,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return {
          taskId: task.id,
          success: true,
          executionTime: 5,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      await manager.executeTasks(executor);

      const stats = manager.getStatistics();
      expect(stats.totalMemoryUsageMB).toBeLessThan(512 * stats.totalWorkers);

      console.log(`Memory usage: ${stats.totalMemoryUsageMB}MB across ${stats.totalWorkers} workers`);
    }, 15000);

    it('should handle worker lifecycle correctly', async () => {
      const initialWorkers = manager.getWorkers().length;

      // Execute tasks that might trigger worker creation
      const tasks: TestTask[] = [];
      for (let i = 0; i < 20; i++) {
        tasks.push({
          id: `lifecycle-${i}`,
          filePath: `/test/lifecycle-${i}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 0,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return {
          taskId: task.id,
          success: true,
          executionTime: 20,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      await manager.executeTasks(executor);

      // Workers should be managed within limits
      const finalWorkers = manager.getWorkers().length;
      const config = manager.getConfig();
      expect(finalWorkers).toBeGreaterThanOrEqual(config.minWorkers);
      expect(finalWorkers).toBeLessThanOrEqual(config.maxWorkers);
    }, 15000);
  });

  describe('Retry Performance', () => {
    it('should handle retries with minimal overhead', async () => {
      const tasks: TestTask[] = [];
      const flakyTaskCount = 10;

      for (let i = 0; i < flakyTaskCount; i++) {
        tasks.push({
          id: `retry-task-${i}`,
          filePath: `/test/retry-${i}.spec.ts`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 3,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      let attemptCount = 0;
      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        attemptCount++;

        // Simulate flaky test - fail first attempt, succeed on retry
        const attempt = Math.floor(attemptCount / flakyTaskCount);
        const success = attempt > 0;

        await new Promise(resolve => setTimeout(resolve, 10));

        return {
          taskId: task.id,
          success,
          error: success ? undefined : new Error('Flaky failure'),
          executionTime: 10,
          workerId: 'worker-1',
          retryAttempt: attempt,
          isFlaky: false,
        };
      };

      const executorWithRetry = async (task: TestTask): Promise<TestExecutionResult> => {
        return retryHandler.executeWithRetry(task, executor);
      };

      const startTime = Date.now();
      const results = await manager.executeTasks(executorWithRetry);
      const duration = Date.now() - startTime;

      const successfulResults = results.filter(r => r.success);
      const flakyTests = retryHandler.getAllFlakyTests();

      console.log(`Retry performance: ${duration}ms for ${flakyTaskCount} tasks`);
      console.log(`Successful: ${successfulResults.length}, Flaky: ${flakyTests.length}`);

      expect(successfulResults.length).toBeGreaterThan(0);
    }, 15000);

    it('should generate comprehensive flaky test report', async () => {
      // Execute some flaky tests
      const tasks: TestTask[] = [];
      for (let i = 0; i < 5; i++) {
        tasks.push({
          id: `report-task-${i}`,
          filePath: `/test/report-${i}.spec.ts`,
          testName: `Report test ${i}`,
          priority: 1,
          requiresSerialization: false,
          dependencies: [],
          retryCount: 0,
          maxRetries: 2,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      let callCount = 0;
      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        callCount++;
        const success = callCount > 5; // First 5 calls fail, rest succeed

        return {
          taskId: task.id,
          success,
          error: success ? undefined : new Error('Test failure'),
          executionTime: 50,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      const executorWithRetry = async (task: TestTask): Promise<TestExecutionResult> => {
        return retryHandler.executeWithRetry(task, executor);
      };

      await manager.executeTasks(executorWithRetry);

      const report = retryHandler.generateFlakyTestReport();
      const reportJson = retryHandler.exportFlakyTestReport();

      expect(report.totalFlakyTests).toBeGreaterThan(0);
      expect(reportJson).toBeTruthy();
      expect(JSON.parse(reportJson)).toHaveProperty('statistics');

      console.log('Flaky Test Report:');
      console.log(`  Total Flaky Tests: ${report.totalFlakyTests}`);
      console.log(`  Flaky Percentage: ${report.statistics.flakyPercentage.toFixed(2)}%`);
      console.log(`  Average Retries: ${report.statistics.averageRetries.toFixed(2)}`);
    }, 15000);
  });

  describe('Stress Testing', () => {
    it('should handle high concurrency', async () => {
      const taskCount = 200;
      const tasks: TestTask[] = [];

      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `stress-${i}`,
          filePath: `/test/stress-${i}.spec.ts`,
          priority: Math.floor(Math.random() * 5) + 1,
          requiresSerialization: i % 10 === 0, // 10% serialized
          dependencies: i > 0 && i % 20 === 0 ? [`stress-${i - 1}`] : [], // 5% with dependencies
          retryCount: 0,
          maxRetries: 2,
        });
      }

      for (const task of tasks) {
        await manager.scheduleTask(task);
      }

      const executor = async (task: TestTask): Promise<TestExecutionResult> => {
        // Simulate variable execution time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));

        // 5% failure rate
        const success = Math.random() > 0.05;

        return {
          taskId: task.id,
          success,
          error: success ? undefined : new Error('Random failure'),
          executionTime: Math.random() * 50 + 10,
          workerId: 'worker-1',
          retryAttempt: 0,
          isFlaky: false,
        };
      };

      const startTime = Date.now();
      const results = await manager.executeTasks(executor);
      const duration = Date.now() - startTime;

      expect(results.length).toBe(taskCount);

      const stats = manager.getStatistics();
      console.log(`Stress test completed in ${duration}ms`);
      console.log(`  Tasks completed: ${stats.totalTasksCompleted}`);
      console.log(`  Tasks failed: ${stats.totalTasksFailed}`);
      console.log(`  Average execution time: ${stats.averageExecutionTime.toFixed(2)}ms`);
    }, 30000);
  });
});
