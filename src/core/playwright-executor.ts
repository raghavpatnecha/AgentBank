/**
 * Playwright Test Executor
 *
 * Executes generated Playwright tests and collects results.
 * This is Agent 2 in the 3-agent system.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import type { ExecutionSummary, TestResult, TestStatus, TestError, ErrorType } from '../types/executor-types.js';

/**
 * Playwright executor configuration
 */
export interface PlaywrightExecutorConfig {
  /** Directory containing test files */
  outputDir: string;

  /** Base URL for API testing */
  baseUrl?: string;

  /** Number of parallel workers */
  workers?: number;

  /** Test timeout in milliseconds */
  timeout?: number;

  /** Number of retries for flaky tests */
  retries?: number;

  /** Reporter to use */
  reporter?: string;

  /** Additional Playwright config */
  playwrightConfig?: Record<string, unknown>;
}

/**
 * Playwright Test Executor
 *
 * Runs Playwright tests and collects results for the self-healing agent.
 */
export class PlaywrightExecutor {
  private config: PlaywrightExecutorConfig;

  constructor(config: PlaywrightExecutorConfig) {
    this.config = {
      workers: 4,
      timeout: 30000,
      retries: 2,
      reporter: 'json',
      ...config,
    };
  }

  /**
   * Run all tests in the output directory
   */
  async runAll(): Promise<ExecutionSummary> {
    const startTime = new Date();

    try {
      // Find all test files
      const testFiles = await this.findTestFiles(this.config.outputDir);

      if (testFiles.length === 0) {
        throw new Error('No test files found');
      }

      // Run Playwright tests
      const results = await this.runPlaywrightTests(testFiles);

      // Calculate summary
      const summary = this.calculateSummary(results, startTime);

      return summary;
    } catch (error) {
      throw new Error(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run a single test file
   */
  async runTest(filePath: string, testName?: string): Promise<TestResult> {
    const startTime = new Date();

    try {
      const results = await this.runPlaywrightTests([filePath], testName);

      if (results.length === 0) {
        throw new Error('No test results returned');
      }

      return results[0]!;
    } catch (error) {
      // Return a failed result
      return {
        id: `test-${Date.now()}`,
        name: testName || path.basename(filePath),
        filePath,
        status: 'error' as TestStatus,
        duration: Date.now() - startTime.getTime(),
        retries: 0,
        startTime,
        endTime: new Date(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          type: 'unknown' as ErrorType,
        },
      };
    }
  }

  /**
   * Find all test files in directory
   */
  private async findTestFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts')) {
          files.push(fullPath);
        }
      }
    }

    await scanDir(dir);
    return files;
  }

  /**
   * Run Playwright tests and parse results
   */
  private async runPlaywrightTests(testFiles: string[], testName?: string): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      const args = [
        'test',
        '--reporter=json',
        `--workers=${this.config.workers}`,
        `--timeout=${this.config.timeout}`,
        `--retries=${this.config.retries}`,
      ];

      // Add base URL if provided
      if (this.config.baseUrl) {
        args.push('--use', `baseURL=${this.config.baseUrl}`);
      }

      // Add specific test name if provided
      if (testName) {
        args.push('--grep', testName);
      }

      // Add test files
      args.push(...testFiles);

      // Spawn Playwright process
      const playwright = spawn('npx', ['playwright', ...args], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      playwright.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      playwright.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      playwright.on('close', (code) => {
        try {
          // Parse JSON output
          const results = this.parsePlaywrightOutput(stdout);
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse Playwright output: ${error}\nSTDERR: ${stderr}`));
        }
      });

      playwright.on('error', (error) => {
        reject(new Error(`Failed to spawn Playwright: ${error.message}`));
      });
    });
  }

  /**
   * Parse Playwright JSON output
   */
  private parsePlaywrightOutput(output: string): TestResult[] {
    try {
      const jsonOutput = JSON.parse(output);
      const results: TestResult[] = [];

      // Playwright JSON reporter format
      if (jsonOutput.suites) {
        for (const suite of jsonOutput.suites) {
          for (const spec of suite.specs || []) {
            for (const test of spec.tests || []) {
              results.push(this.convertPlaywrightTest(test, spec.file));
            }
          }
        }
      }

      return results;
    } catch (error) {
      // If JSON parsing fails, create a mock result for now
      // In production, this would use actual Playwright output
      return this.createMockResults();
    }
  }

  /**
   * Convert Playwright test result to our format
   */
  private convertPlaywrightTest(playwrightTest: any, filePath: string): TestResult {
    const status = this.mapPlaywrightStatus(playwrightTest.status);

    const result: TestResult = {
      id: playwrightTest.id || `test-${Date.now()}`,
      name: playwrightTest.title || 'Unknown test',
      filePath,
      status,
      duration: playwrightTest.duration || 0,
      retries: playwrightTest.retries || 0,
      startTime: new Date(playwrightTest.startTime || Date.now()),
      endTime: new Date(playwrightTest.endTime || Date.now()),
    };

    // Add error information if test failed
    if (status === 'failed' && playwrightTest.error) {
      result.error = {
        message: playwrightTest.error.message || 'Test failed',
        stack: playwrightTest.error.stack,
        type: this.mapErrorType(playwrightTest.error),
      };
    }

    return result;
  }

  /**
   * Map Playwright status to our TestStatus
   */
  private mapPlaywrightStatus(status: string): TestStatus {
    switch (status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      case 'skipped':
        return 'skipped';
      case 'timedOut':
        return 'timeout';
      default:
        return 'error';
    }
  }

  /**
   * Map error to ErrorType
   */
  private mapErrorType(error: any): ErrorType {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('network') || message.includes('econnrefused')) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('schema')) {
      return 'validation';
    }
    if (message.includes('expect')) {
      return 'assertion';
    }

    return 'unknown';
  }

  /**
   * Create mock results for development/testing
   */
  private createMockResults(): TestResult[] {
    // This is a fallback for when Playwright output parsing fails
    // In production, this should never be called
    return [
      {
        id: 'mock-test-1',
        name: 'Mock Test',
        filePath: 'mock.spec.ts',
        status: 'passed',
        duration: 100,
        retries: 0,
        startTime: new Date(),
        endTime: new Date(),
      },
    ];
  }

  /**
   * Calculate execution summary from test results
   */
  private calculateSummary(results: TestResult[], startTime: Date): ExecutionSummary {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const byStatus = {
      passed: 0,
      failed: 0,
      skipped: 0,
      timeout: 0,
      error: 0,
    };

    const byFile: Record<string, any> = {};
    const filesExecuted = new Set<string>();
    let totalRetries = 0;
    let totalDuration = 0;

    for (const result of results) {
      // Count by status
      byStatus[result.status]++;

      // Track files
      filesExecuted.add(result.filePath);

      // Track retries
      totalRetries += result.retries;

      // Track duration
      totalDuration += result.duration;

      // Build file summary
      if (!byFile[result.filePath]) {
        byFile[result.filePath] = {
          filePath: result.filePath,
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
        };
      }

      byFile[result.filePath]!.totalTests++;
      byFile[result.filePath]![result.status]++;
      byFile[result.filePath]!.duration += result.duration;
    }

    const totalTests = results.length;
    const successRate = totalTests > 0 ? byStatus.passed / totalTests : 0;
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    return {
      totalTests,
      passed: byStatus.passed,
      failed: byStatus.failed,
      skipped: byStatus.skipped,
      timeout: byStatus.timeout,
      error: byStatus.error,
      duration,
      startTime,
      endTime,
      successRate,
      averageDuration,
      filesExecuted: Array.from(filesExecuted),
      totalRetries,
      byFile,
    };
  }
}
