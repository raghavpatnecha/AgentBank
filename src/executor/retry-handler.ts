/**
 * Retry Handler
 * Manages intelligent retry logic for failed tests with exponential backoff
 */

import type {
  TestTask,
  TestExecutionResult,
  RetryConfig,
  RetryAttempt,
  FlakyTest,
  FlakyTestReport,
} from '../types/worker-types.js';
import {
  calculateBackoff,
  sleep,
  DEFAULT_RETRY_CONFIG,
  validateRetryConfig,
} from '../utils/backoff.js';

/**
 * Retry handler for test execution
 */
export class RetryHandler {
  private config: RetryConfig;
  private retryAttempts: Map<string, RetryAttempt[]> = new Map();
  private flakyTests: Map<string, FlakyTest> = new Map();
  private permanentFailures: Set<string> = new Set();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    validateRetryConfig(this.config);
  }

  /**
   * Execute a test task with retry logic
   *
   * @param task - Test task to execute
   * @param executor - Function that executes the test
   * @returns Test result
   */
  async executeWithRetry(
    task: TestTask,
    executor: (task: TestTask) => Promise<TestExecutionResult>
  ): Promise<TestExecutionResult> {
    const taskId = task.id;
    const maxRetries = Math.min(task.maxRetries, this.config.maxRetries);

    // Initialize retry tracking
    if (!this.retryAttempts.has(taskId)) {
      this.retryAttempts.set(taskId, []);
    }

    let lastResult: TestExecutionResult | undefined;
    let hadFailures = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        // Execute the test
        const result = await executor(task);

        // Record execution time
        result.executionTime = Date.now() - startTime;
        result.retryAttempt = attempt;

        if (result.success) {
          // Check if this is a flaky test (failed before, now passed)
          if (hadFailures) {
            this.recordFlakyTest(task, attempt, result);
            result.isFlaky = true;
          }
          return result;
        }

        // Test failed
        hadFailures = true;
        lastResult = result;

        // Don't retry if max attempts reached
        if (attempt >= maxRetries) {
          this.recordPermanentFailure(taskId);
          break;
        }

        // Calculate backoff delay
        const backoff = calculateBackoff(attempt, this.config);

        // Record retry attempt
        this.recordRetryAttempt(taskId, attempt + 1, result.error!, backoff.delayMs);

        // Log retry
        console.warn(
          `Retrying test ${taskId} (attempt ${attempt + 1}/${maxRetries}) after ${backoff.delayMs}ms delay`
        );

        // Wait before retry
        await sleep(backoff.delayMs);
      } catch (error) {
        // Unexpected error during execution
        const execError = error instanceof Error ? error : new Error(String(error));
        lastResult = {
          taskId,
          success: false,
          error: execError,
          executionTime: Date.now() - startTime,
          workerId: 'unknown',
          retryAttempt: attempt,
          isFlaky: false,
        };

        hadFailures = true;

        // Don't retry if max attempts reached
        if (attempt >= maxRetries) {
          this.recordPermanentFailure(taskId);
          break;
        }

        // Calculate backoff delay
        const backoff = calculateBackoff(attempt, this.config);

        // Record retry attempt
        this.recordRetryAttempt(taskId, attempt + 1, execError, backoff.delayMs);

        // Wait before retry
        await sleep(backoff.delayMs);
      }
    }

    // All retries exhausted, return last result
    return lastResult!;
  }

  /**
   * Record a retry attempt
   */
  private recordRetryAttempt(
    taskId: string,
    attemptNumber: number,
    error: Error,
    delayMs: number
  ): void {
    const attempts = this.retryAttempts.get(taskId) || [];
    attempts.push({
      attemptNumber,
      timestamp: new Date(),
      error,
      delayMs,
    });
    this.retryAttempts.set(taskId, attempts);
  }

  /**
   * Record a flaky test
   */
  private recordFlakyTest(task: TestTask, failureCount: number, result: TestExecutionResult): void {
    const attempts = this.retryAttempts.get(task.id) || [];
    const firstAttempt = attempts[0];
    const totalTime = attempts.reduce((sum, att) => sum + att.delayMs, 0) + result.executionTime;

    const flakyTest: FlakyTest = {
      testId: task.id,
      filePath: task.filePath,
      testName: task.testName || task.filePath,
      failureCount,
      attempts,
      firstFailure: firstAttempt?.timestamp || new Date(),
      finalSuccess: new Date(),
      totalExecutionTime: totalTime,
    };

    this.flakyTests.set(task.id, flakyTest);
  }

  /**
   * Record a permanent failure
   */
  private recordPermanentFailure(taskId: string): void {
    this.permanentFailures.add(taskId);
  }

  /**
   * Check if a test is a permanent failure
   */
  isPermanentFailure(taskId: string): boolean {
    return this.permanentFailures.has(taskId);
  }

  /**
   * Check if a test is flaky
   */
  isFlaky(taskId: string): boolean {
    return this.flakyTests.has(taskId);
  }

  /**
   * Get retry attempts for a task
   */
  getRetryAttempts(taskId: string): RetryAttempt[] {
    return this.retryAttempts.get(taskId) || [];
  }

  /**
   * Get flaky test information
   */
  getFlakyTest(taskId: string): FlakyTest | undefined {
    return this.flakyTests.get(taskId);
  }

  /**
   * Get all flaky tests
   */
  getAllFlakyTests(): FlakyTest[] {
    return Array.from(this.flakyTests.values());
  }

  /**
   * Get all permanent failures
   */
  getAllPermanentFailures(): string[] {
    return Array.from(this.permanentFailures);
  }

  /**
   * Generate a comprehensive flaky test report
   */
  generateFlakyTestReport(): FlakyTestReport {
    const flakyTests = this.getAllFlakyTests();
    const totalTests = this.retryAttempts.size;

    // Calculate statistics
    const totalRetries = flakyTests.reduce((sum, test) => sum + test.failureCount, 0);
    const averageRetries = flakyTests.length > 0 ? totalRetries / flakyTests.length : 0;

    // Find most flaky test
    const mostFlakyTest = flakyTests.reduce(
      (most, current) => {
        if (!most || current.failureCount > most.failureCount) {
          return current;
        }
        return most;
      },
      undefined as FlakyTest | undefined
    );

    return {
      generatedAt: new Date(),
      totalFlakyTests: flakyTests.length,
      flakyTests: flakyTests.sort((a, b) => b.failureCount - a.failureCount),
      statistics: {
        totalTests,
        flakyPercentage: totalTests > 0 ? (flakyTests.length / totalTests) * 100 : 0,
        averageRetries,
        mostFlakyTest,
      },
    };
  }

  /**
   * Export flaky test report to JSON
   */
  exportFlakyTestReport(): string {
    const report = this.generateFlakyTestReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Reset retry handler state
   */
  reset(): void {
    this.retryAttempts.clear();
    this.flakyTests.clear();
    this.permanentFailures.clear();
  }

  /**
   * Get retry statistics
   */
  getStatistics() {
    return {
      totalTasks: this.retryAttempts.size,
      flakyTests: this.flakyTests.size,
      permanentFailures: this.permanentFailures.size,
      totalRetryAttempts: Array.from(this.retryAttempts.values()).reduce(
        (sum, attempts) => sum + attempts.length,
        0
      ),
    };
  }

  /**
   * Determine if an error is retryable
   * Override this method to customize retry logic
   */
  protected isRetryable(error: Error): boolean {
    // Network errors are typically retryable
    const retryablePatterns = [
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /ECONNRESET/,
      /timeout/i,
      /network/i,
      /temporarily unavailable/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Get configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
    validateRetryConfig(this.config);
  }
}

/**
 * Create a retry handler with default configuration
 */
export function createRetryHandler(config?: Partial<RetryConfig>): RetryHandler {
  return new RetryHandler(config);
}
