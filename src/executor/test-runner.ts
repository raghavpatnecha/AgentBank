/**
 * Test Execution Engine
 * Executes Playwright tests and captures results
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  ExecutionOptions,
  ExecutionSummary,
  TestResult,
  TestStatus,
  ProgressEvent,
  ProgressEventType,
  ProgressCallback,
  ErrorType,
} from '../types/executor-types.js';
import { ResultCollector } from './result-collector.js';

/**
 * Test Runner Implementation
 * Executes tests using Playwright's CLI and collects results
 */
export class PlaywrightTestRunner {
  private resultCollector: ResultCollector;
  private progressCallbacks: ProgressCallback[] = [];
  private currentProcess: ChildProcess | null = null;
  private isRunning = false;

  constructor(resultCollector?: ResultCollector) {
    this.resultCollector = resultCollector || new ResultCollector();
  }

  /**
   * Execute tests with given options
   */
  async executeTests(options: ExecutionOptions = {}): Promise<ExecutionSummary> {
    if (this.isRunning) {
      throw new Error('Test execution already in progress');
    }

    this.isRunning = true;
    this.resultCollector.clear();

    try {
      // Emit start event
      this.emitProgress({
        type: ProgressEventType.START,
        timestamp: new Date(),
        completed: 0,
        total: 0,
        percentage: 0,
      });

      // Build Playwright command
      const command = this.buildPlaywrightCommand(options);

      // Execute tests
      await this.runPlaywrightTests(command, options);

      // Load and process results
      await this.loadTestResults(options);

      // Emit completion event
      const summary = this.resultCollector.getSummary();
      this.emitProgress({
        type: ProgressEventType.COMPLETE,
        timestamp: new Date(),
        completed: summary.totalTests,
        total: summary.totalTests,
        percentage: 100,
      });

      return summary;
    } catch (error) {
      this.emitProgress({
        type: ProgressEventType.ERROR,
        timestamp: new Date(),
        completed: 0,
        total: 0,
        percentage: 0,
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    } finally {
      this.isRunning = false;
      this.currentProcess = null;
    }
  }

  /**
   * Subscribe to progress events
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Stop test execution
   */
  async stop(): Promise<void> {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.isRunning = false;

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force kill if still running
      if (this.currentProcess.killed === false) {
        this.currentProcess.kill('SIGKILL');
      }
    }
  }

  /**
   * Build Playwright CLI command
   */
  private buildPlaywrightCommand(options: ExecutionOptions): string[] {
    const args: string[] = ['npx', 'playwright', 'test'];

    // Add test path
    if (options.testPath) {
      const paths = Array.isArray(options.testPath) ? options.testPath : [options.testPath];
      args.push(...paths);
    }

    // Add config
    if (options.configPath) {
      args.push('--config', options.configPath);
    }

    // Add workers
    if (options.workers !== undefined) {
      args.push('--workers', String(options.workers));
    }

    // Add retries
    if (options.retries !== undefined) {
      args.push('--retries', String(options.retries));
    }

    // Add timeout
    if (options.timeout !== undefined) {
      args.push('--timeout', String(options.timeout));
    }

    // Add grep
    if (options.grep) {
      const pattern = typeof options.grep === 'string' ? options.grep : options.grep.source;
      args.push('--grep', pattern);
    }

    // Add fail-fast
    if (options.failFast) {
      args.push('-x');
    }

    // Add update snapshots
    if (options.updateSnapshots) {
      args.push('--update-snapshots');
    }

    // Add headed mode
    if (options.headed) {
      args.push('--headed');
    }

    // Add debug mode
    if (options.debug) {
      args.push('--debug');
    }

    // Force JSON reporter for result parsing
    args.push('--reporter=json');

    return args;
  }

  /**
   * Run Playwright tests as child process
   */
  private async runPlaywrightTests(command: string[], options: ExecutionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command;

      // Set up environment
      const env = {
        ...process.env,
        ...options.env,
      };

      // Spawn process
      this.currentProcess = spawn(cmd || 'npx', args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      const currentProc = this.currentProcess;
      if (currentProc.stdout) {
        currentProc.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          stdout += output;

          if (options.showProgress) {
            process.stdout.write(output);
          }

          // Parse progress from output
          this.parseProgressFromOutput(output);
        });
      }

      // Capture stderr
      if (currentProc.stderr) {
        currentProc.stderr.on('data', (data: Buffer) => {
          const output = data.toString();
          stderr += output;

          if (options.showProgress) {
            process.stderr.write(output);
          }
        });
      }

      // Handle process completion
      currentProc.on('close', (code) => {
        // Playwright returns non-zero exit code when tests fail
        // We still want to process results, so we resolve instead of reject
        // unless there was a critical error (code > 1)
        if (code !== null && code > 1) {
          reject(new Error(`Playwright exited with code ${code}\n${stderr}`));
        } else {
          resolve();
        }
      });

      // Handle process errors
      currentProc.on('error', (error) => {
        reject(new Error(`Failed to execute Playwright: ${error.message}`));
      });
    });
  }

  /**
   * Parse progress information from Playwright output
   */
  private parseProgressFromOutput(output: string): void {
    // Playwright outputs progress in various formats
    // Example: "Running 25 tests using 4 workers"
    // Example: "[1/25] test.spec.ts:10:5 › should pass"

    const runningMatch = output.match(/Running (\d+) tests/);
    if (runningMatch?.[1]) {
      const total = parseInt(runningMatch[1], 10);
      this.emitProgress({
        type: ProgressEventType.START,
        timestamp: new Date(),
        completed: 0,
        total,
        percentage: 0,
      });
    }

    const progressMatch = output.match(/\[(\d+)\/(\d+)\]/);
    if (progressMatch?.[1] && progressMatch[2]) {
      const completed = parseInt(progressMatch[1], 10);
      const total = parseInt(progressMatch[2], 10);
      this.emitProgress({
        type: ProgressEventType.TEST_END,
        timestamp: new Date(),
        completed,
        total,
        percentage: (completed / total) * 100,
      });
    }
  }

  /**
   * Load test results from Playwright JSON output
   */
  private async loadTestResults(options: ExecutionOptions): Promise<void> {
    const outputDir = options.outputDir || 'results';
    const jsonReportPath = path.join(outputDir, 'results.json');

    try {
      // Check if JSON report exists
      await fs.access(jsonReportPath);

      // Read and parse results
      const content = await fs.readFile(jsonReportPath, 'utf-8');
      const playwrightResults = JSON.parse(content);

      // Process results
      await this.processPlaywrightResults(playwrightResults);
    } catch (error) {
      // If JSON report doesn't exist, we might be using a different reporter
      // or tests failed to run. Log warning but don't throw.
      console.warn(`Warning: Could not load test results from ${jsonReportPath}`);
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process Playwright test results and add to collector
   */
  private async processPlaywrightResults(playwrightResults: any): Promise<void> {
    // Playwright JSON reporter structure varies by version
    // Handle both old and new formats

    const suites = playwrightResults.suites || [];

    for (const suite of suites) {
      await this.processSuite(suite, suite.file || 'unknown');
    }
  }

  /**
   * Process a test suite recursively
   */
  private async processSuite(suite: any, filePath: string): Promise<void> {
    // Process tests in this suite
    if (suite.tests && Array.isArray(suite.tests)) {
      for (const test of suite.tests) {
        const result = this.convertPlaywrightTestResult(test, filePath);
        this.resultCollector.addResult(result);
      }
    }

    // Process nested suites
    if (suite.suites && Array.isArray(suite.suites)) {
      for (const nestedSuite of suite.suites) {
        await this.processSuite(nestedSuite, suite.file || filePath);
      }
    }
  }

  /**
   * Convert Playwright test result to our format
   */
  private convertPlaywrightTestResult(pwTest: any, filePath: string): TestResult {
    const testId = this.generateTestId(pwTest, filePath);
    const status = this.convertStatus(pwTest.status);

    // Extract timing information
    const startTime = pwTest.startTime ? new Date(pwTest.startTime) : new Date();
    const duration = pwTest.duration || 0;
    const endTime = new Date(startTime.getTime() + duration);

    // Extract error information
    let error = undefined;
    if (pwTest.error || pwTest.errors?.[0]) {
      const pwError = pwTest.error || pwTest.errors[0];
      error = {
        message: pwError.message || 'Unknown error',
        stack: pwError.stack,
        type: this.classifyError(pwError.message, status),
      };
    }

    return {
      id: testId,
      name: this.getFullTestName(pwTest),
      filePath,
      status,
      duration,
      retries: pwTest.retry || 0,
      error,
      startTime,
      endTime,
      tags: this.extractTags(pwTest),
      metadata: {
        projectName: pwTest.projectName,
        workerIndex: pwTest.workerIndex,
      },
    };
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(test: any, filePath: string): string {
    const name = this.getFullTestName(test);
    const normalized = `${filePath}:${name}`.replace(/[^a-zA-Z0-9]/g, '-');
    return normalized.toLowerCase();
  }

  /**
   * Get full test name including parent suites
   */
  private getFullTestName(test: any): string {
    const titles: string[] = [];

    if (test.titlePath && Array.isArray(test.titlePath)) {
      titles.push(...test.titlePath.filter((t: any) => typeof t === 'string'));
    } else if (test.title) {
      titles.push(String(test.title));
    }

    return titles.filter(Boolean).join(' › ');
  }

  /**
   * Convert Playwright status to our status enum
   */
  private convertStatus(status: string): TestStatus {
    switch (status) {
      case 'passed':
        return TestStatus.PASSED;
      case 'failed':
        return TestStatus.FAILED;
      case 'timedOut':
        return TestStatus.TIMEOUT;
      case 'skipped':
        return TestStatus.SKIPPED;
      default:
        return TestStatus.ERROR;
    }
  }

  /**
   * Classify error type based on error message
   */
  private classifyError(message: string, status: TestStatus): ErrorType {
    if (status === TestStatus.TIMEOUT) {
      return ErrorType.TIMEOUT;
    }

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('expect') || lowerMessage.includes('assert')) {
      return ErrorType.ASSERTION;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused')) {
      return ErrorType.NETWORK;
    }
    if (lowerMessage.includes('before') || lowerMessage.includes('beforeall')) {
      return ErrorType.SETUP;
    }
    if (lowerMessage.includes('after') || lowerMessage.includes('afterall')) {
      return ErrorType.TEARDOWN;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('schema')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Extract tags from test
   */
  private extractTags(test: any): string[] {
    const tags: string[] = [];

    // Playwright stores tags in annotations
    if (test.annotations && Array.isArray(test.annotations)) {
      for (const annotation of test.annotations) {
        if (annotation.type === 'tag' && annotation.description) {
          tags.push(String(annotation.description));
        }
      }
    }

    // Also check titlePath for @tags
    if (test.titlePath && Array.isArray(test.titlePath)) {
      for (const title of test.titlePath) {
        if (typeof title === 'string') {
          const tagMatches = title.match(/@[\w-]+/g);
          if (tagMatches) {
            tags.push(...tagMatches.map((t: string) => t.substring(1)));
          }
        }
      }
    }

    return [...new Set(tags)].filter(Boolean);
  }

  /**
   * Emit progress event to all subscribers
   */
  private emitProgress(event: ProgressEvent): void {
    for (const callback of this.progressCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    }
  }
}

/**
 * Execute tests with simplified API
 * @param options - Execution options
 * @returns Execution summary
 */
export async function executeTests(options?: ExecutionOptions): Promise<ExecutionSummary> {
  const runner = new PlaywrightTestRunner();
  return runner.executeTests(options);
}
