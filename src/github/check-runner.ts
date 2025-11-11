/**
 * GitHub Check Runner (Feature 5, Task 5.6)
 * Creates and updates GitHub check runs to show test status in PR UI
 */

import {
  CheckContext,
  CheckRun,
  CheckRunOutput,
  Annotation,
  Progress,
  Conclusion,
  CreateCheckRunRequest,
  UpdateCheckRunRequest,
  AnnotationBatch,
  CheckRunnerConfig,
  ValidationResult,
} from '../types/check-run-types.js';
import { TestResult, ExecutionSummary } from '../types/executor-types.js';
import { FormattedTestResults } from './comment-formatter.js';

/**
 * GitHub API client interface
 */
export interface GitHubClient {
  /**
   * Create a check run
   * @param request - Check run creation request
   * @returns Created check run
   */
  createCheckRun(request: CreateCheckRunRequest): Promise<CheckRun>;

  /**
   * Update a check run
   * @param request - Check run update request
   * @returns Updated check run
   */
  updateCheckRun(request: UpdateCheckRunRequest): Promise<CheckRun>;

  /**
   * Add annotations to a check run
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param checkRunId - Check run ID
   * @param annotations - Annotations to add
   * @returns Updated check run
   */
  addAnnotations(
    owner: string,
    repo: string,
    checkRunId: number,
    annotations: Annotation[]
  ): Promise<CheckRun>;
}

/**
 * Simple GitHub API client implementation
 */
export class SimpleGitHubClient implements GitHubClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: CheckRunnerConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
    this.timeout = config.timeout || 30000;
  }

  async createCheckRun(request: CreateCheckRunRequest): Promise<CheckRun> {
    const url = `${this.baseUrl}/repos/${request.owner}/${request.repo}/check-runs`;

    const response = await this.request('POST', url, {
      name: request.name,
      head_sha: request.head_sha,
      status: request.status || 'queued',
      details_url: request.details_url,
      external_id: request.external_id,
      started_at: request.started_at,
      conclusion: request.conclusion,
      completed_at: request.completed_at,
      output: request.output,
      actions: request.actions,
    });

    return response as CheckRun;
  }

  async updateCheckRun(request: UpdateCheckRunRequest): Promise<CheckRun> {
    const url = `${this.baseUrl}/repos/${request.owner}/${request.repo}/check-runs/${request.check_run_id}`;

    const response = await this.request('PATCH', url, {
      name: request.name,
      details_url: request.details_url,
      external_id: request.external_id,
      started_at: request.started_at,
      status: request.status,
      conclusion: request.conclusion,
      completed_at: request.completed_at,
      output: request.output,
      actions: request.actions,
    });

    return response as CheckRun;
  }

  async addAnnotations(
    owner: string,
    repo: string,
    checkRunId: number,
    annotations: Annotation[]
  ): Promise<CheckRun> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/check-runs/${checkRunId}`;

    const response = await this.request('PATCH', url, {
      output: {
        title: 'Test Annotations',
        summary: `Added ${annotations.length} annotations`,
        annotations,
      },
    });

    return response as CheckRun;
  }

  private async request(method: string, url: string, body?: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ message: response.statusText }))) as { message?: string };
        throw new Error(
          `GitHub API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

/**
 * Check runner for managing GitHub check runs
 */
export class CheckRunner {
  private readonly client: GitHubClient;
  private readonly maxAnnotationsPerBatch: number;
  private readonly batchAnnotations: boolean;

  constructor(client: GitHubClient, config?: Partial<CheckRunnerConfig>) {
    this.client = client;
    this.maxAnnotationsPerBatch = config?.maxAnnotationsPerBatch || 50;
    this.batchAnnotations = config?.batchAnnotations !== false;
  }

  /**
   * Create a check run
   * @param context - Check run context
   * @returns Created check run
   */
  async createCheckRun(context: CheckContext): Promise<CheckRun> {
    this.validateContext(context);

    const request: CreateCheckRunRequest = {
      owner: context.owner,
      repo: context.repo,
      name: context.name,
      head_sha: context.head_sha,
      status: 'queued',
      details_url: context.details_url,
      external_id: context.external_id,
      started_at: context.started_at || new Date().toISOString(),
    };

    return await this.client.createCheckRun(request);
  }

  /**
   * Update check run to in_progress status
   * @param checkRunId - Check run ID
   * @param progress - Progress information
   * @param context - Check context (owner/repo)
   * @returns Updated check run
   */
  async updateToInProgress(
    checkRunId: number,
    progress: Progress,
    context: { owner: string; repo: string }
  ): Promise<CheckRun> {
    const output: CheckRunOutput = {
      title: 'Tests In Progress',
      summary: progress.summary,
      text: this.formatProgressText(progress),
    };

    const request: UpdateCheckRunRequest = {
      owner: context.owner,
      repo: context.repo,
      check_run_id: checkRunId,
      status: 'in_progress',
      output,
    };

    return await this.client.updateCheckRun(request);
  }

  /**
   * Update check run to completed status
   * @param checkRunId - Check run ID
   * @param results - Test results
   * @param context - Check context (owner/repo)
   * @returns Updated check run
   */
  async updateToCompleted(
    checkRunId: number,
    results: FormattedTestResults,
    context: { owner: string; repo: string }
  ): Promise<CheckRun> {
    const conclusion = this.calculateConclusion(results);
    const output = this.generateCheckRunOutput(results);

    const request: UpdateCheckRunRequest = {
      owner: context.owner,
      repo: context.repo,
      check_run_id: checkRunId,
      status: 'completed',
      conclusion,
      completed_at: new Date().toISOString(),
      output,
    };

    return await this.client.updateCheckRun(request);
  }

  /**
   * Add annotations to a check run
   * @param checkRunId - Check run ID
   * @param annotations - Annotations to add
   * @param context - Check context (owner/repo)
   * @returns Updated check run
   */
  async addAnnotations(
    checkRunId: number,
    annotations: Annotation[],
    context: { owner: string; repo: string }
  ): Promise<void> {
    if (annotations.length === 0) {
      return;
    }

    // Validate annotations
    const validationResult = this.validateAnnotations(annotations);
    if (!validationResult.valid) {
      throw new Error(`Invalid annotations: ${validationResult.errors.join(', ')}`);
    }

    // Batch annotations if needed
    if (this.batchAnnotations && annotations.length > this.maxAnnotationsPerBatch) {
      const batches = this.batchAnnotationsList(annotations);
      for (const batch of batches) {
        await this.client.addAnnotations(
          context.owner,
          context.repo,
          checkRunId,
          batch.annotations
        );
      }
    } else {
      await this.client.addAnnotations(context.owner, context.repo, checkRunId, annotations);
    }
  }

  /**
   * Cancel a check run
   * @param checkRunId - Check run ID
   * @param context - Check context (owner/repo)
   * @returns Updated check run
   */
  async cancel(checkRunId: number, context: { owner: string; repo: string }): Promise<CheckRun> {
    const request: UpdateCheckRunRequest = {
      owner: context.owner,
      repo: context.repo,
      check_run_id: checkRunId,
      status: 'completed',
      conclusion: 'cancelled',
      completed_at: new Date().toISOString(),
      output: {
        title: 'Check Run Cancelled',
        summary: 'This check run was cancelled.',
      },
    };

    return await this.client.updateCheckRun(request);
  }

  /**
   * Generate check run output from test results
   * @param results - Test results
   * @returns Check run output
   */
  generateCheckRunOutput(results: FormattedTestResults): CheckRunOutput {
    const { summary } = results;
    const title = this.generateOutputTitle(summary);
    const summaryText = this.generateOutputSummary(results);
    const detailText = this.generateOutputDetails(results);

    // Create annotations from failures
    const annotations = this.createAnnotationsFromFailures(results.failedTests);

    // Limit annotations to GitHub's max (50 per request)
    const limitedAnnotations = annotations.slice(0, this.maxAnnotationsPerBatch);

    return {
      title,
      summary: summaryText,
      text: detailText,
      annotations: limitedAnnotations,
      annotations_count: annotations.length,
    };
  }

  /**
   * Create annotations from failed tests
   * @param failures - Failed test results
   * @returns Array of annotations
   */
  createAnnotationsFromFailures(failures: TestResult[]): Annotation[] {
    const annotations: Annotation[] = [];

    for (const test of failures) {
      // Try to create annotation from test location
      if (test.error?.location) {
        annotations.push({
          path: test.error.location.file,
          start_line: test.error.location.line,
          end_line: test.error.location.line,
          annotation_level: 'failure',
          title: `Test Failed: ${test.name}`,
          message: test.error.message || 'Test failed',
          raw_details: this.formatAnnotationDetails(test),
        });
      } else {
        // Create annotation for test file
        annotations.push({
          path: test.filePath,
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          title: `Test Failed: ${test.name}`,
          message: test.error?.message || 'Test failed',
          raw_details: this.formatAnnotationDetails(test),
        });
      }
    }

    return annotations;
  }

  /**
   * Calculate check run conclusion from test results
   * @param results - Test results
   * @returns Conclusion status
   */
  calculateConclusion(results: FormattedTestResults): Conclusion {
    const { summary } = results;

    if (summary.failed > 0) {
      return 'failure';
    }

    if (summary.passed === 0 && summary.skipped > 0) {
      return 'neutral';
    }

    if (summary.passed > 0 && summary.failed === 0) {
      return 'success';
    }

    return 'neutral';
  }

  /**
   * Validate check context
   * @param context - Check context to validate
   */
  private validateContext(context: CheckContext): void {
    const errors: string[] = [];

    if (!context.owner) {
      errors.push('owner is required');
    }

    if (!context.repo) {
      errors.push('repo is required');
    }

    if (!context.name) {
      errors.push('name is required');
    }

    if (!context.head_sha) {
      errors.push('head_sha is required');
    }

    if (context.head_sha && !/^[0-9a-f]{40}$/i.test(context.head_sha)) {
      errors.push('head_sha must be a valid 40-character SHA-1 hash');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid check context: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate annotations
   * @param annotations - Annotations to validate
   * @returns Validation result
   */
  private validateAnnotations(annotations: Annotation[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const annotation of annotations) {
      if (!annotation.path) {
        errors.push('Annotation missing required field: path');
      }

      if (annotation.start_line < 1) {
        errors.push(`Invalid start_line: ${annotation.start_line} (must be >= 1)`);
      }

      if (annotation.end_line < annotation.start_line) {
        errors.push(
          `Invalid end_line: ${annotation.end_line} (must be >= start_line: ${annotation.start_line})`
        );
      }

      if (!annotation.annotation_level) {
        errors.push('Annotation missing required field: annotation_level');
      }

      if (!annotation.message) {
        errors.push('Annotation missing required field: message');
      }

      if (annotation.message && annotation.message.length > 64000) {
        warnings.push(`Annotation message exceeds 64KB limit, will be truncated`);
        annotation.message = annotation.message.substring(0, 64000);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Batch annotations into chunks
   * @param annotations - All annotations
   * @returns Batches of annotations
   */
  private batchAnnotationsList(annotations: Annotation[]): AnnotationBatch[] {
    const batches: AnnotationBatch[] = [];
    const totalBatches = Math.ceil(annotations.length / this.maxAnnotationsPerBatch);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.maxAnnotationsPerBatch;
      const end = Math.min(start + this.maxAnnotationsPerBatch, annotations.length);
      const batchAnnotations = annotations.slice(start, end);

      batches.push({
        batchNumber: i + 1,
        annotations: batchAnnotations,
        isFinal: i === totalBatches - 1,
      });
    }

    return batches;
  }

  /**
   * Format progress text
   * @param progress - Progress information
   * @returns Formatted progress text
   */
  private formatProgressText(progress: Progress): string {
    const lines: string[] = [];

    lines.push(progress.summary);

    if (progress.testsCompleted !== undefined && progress.testsTotal !== undefined) {
      const percentage =
        progress.percentage || (progress.testsCompleted / progress.testsTotal) * 100;
      lines.push(
        `\n**Progress**: ${progress.testsCompleted}/${progress.testsTotal} tests (${percentage.toFixed(1)}%)`
      );
    }

    if (progress.details) {
      lines.push(`\n${progress.details}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate output title
   * @param summary - Execution summary
   * @returns Title string
   */
  private generateOutputTitle(summary: ExecutionSummary): string {
    if (summary.failed > 0) {
      return `❌ ${summary.failed} test${summary.failed > 1 ? 's' : ''} failed`;
    }

    if (summary.passed > 0) {
      return `✅ All ${summary.passed} tests passed`;
    }

    return 'Test Results';
  }

  /**
   * Generate output summary
   * @param results - Test results
   * @returns Summary text
   */
  private generateOutputSummary(results: FormattedTestResults): string {
    const { summary } = results;
    const lines: string[] = [];

    lines.push(`**Total Tests**: ${summary.totalTests}`);
    lines.push(`**Passed**: ${summary.passed} ✅`);
    lines.push(`**Failed**: ${summary.failed} ❌`);

    if (summary.skipped > 0) {
      lines.push(`**Skipped**: ${summary.skipped} ⏭️`);
    }

    if (results.healedTests && results.healedTests.length > 0) {
      const successfulHeals = results.healedTests.filter((h) => h.success).length;
      lines.push(`**Self-Healed**: ${successfulHeals} 🔧`);
    }

    const duration = this.formatDuration(summary.duration);
    lines.push(`**Duration**: ${duration} ⏱️`);

    const successRate = (summary.successRate * 100).toFixed(1);
    lines.push(`**Success Rate**: ${successRate}%`);

    return lines.join('\n');
  }

  /**
   * Generate output details
   * @param results - Test results
   * @returns Detailed text
   */
  private generateOutputDetails(results: FormattedTestResults): string {
    const lines: string[] = [];

    if (results.failedTests.length > 0) {
      lines.push('## Failed Tests\n');
      for (const test of results.failedTests) {
        lines.push(`### ${test.name}`);
        if (test.error?.message) {
          lines.push(`**Error**: ${test.error.message}\n`);
        }
      }
    }

    if (results.healedTests && results.healedTests.length > 0) {
      lines.push('\n## Self-Healed Tests\n');
      for (const healed of results.healedTests.filter((h) => h.success)) {
        lines.push(`- ${healed.test.name}: ${healed.healingDescription}`);
      }
    }

    if (results.metrics) {
      lines.push('\n## Performance Metrics\n');
      lines.push(
        `**Average Response Time**: ${this.formatDuration(results.metrics.averageResponseTime)}`
      );

      if (results.metrics.slowestEndpoint) {
        lines.push(
          `**Slowest Endpoint**: ${results.metrics.slowestEndpoint.name} (${this.formatDuration(results.metrics.slowestEndpoint.duration)})`
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Format annotation details
   * @param test - Failed test
   * @returns Formatted details
   */
  private formatAnnotationDetails(test: TestResult): string {
    const lines: string[] = [];

    if (test.error?.type) {
      lines.push(`Error Type: ${test.error.type}`);
    }

    if (test.error?.stack) {
      lines.push('\nStack Trace:');
      lines.push(test.error.stack.split('\n').slice(0, 5).join('\n'));
    }

    if (test.error?.comparison) {
      lines.push('\nExpected:');
      lines.push(JSON.stringify(test.error.comparison.expected, null, 2));
      lines.push('\nActual:');
      lines.push(JSON.stringify(test.error.comparison.actual, null, 2));
    }

    return lines.join('\n');
  }

  /**
   * Format duration
   * @param milliseconds - Duration in milliseconds
   * @returns Formatted duration string
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}

/**
 * Create a check runner instance
 * @param config - Check runner configuration
 * @returns CheckRunner instance
 */
export function createCheckRunner(config: CheckRunnerConfig): CheckRunner {
  const client = new SimpleGitHubClient(config);
  return new CheckRunner(client, config);
}
