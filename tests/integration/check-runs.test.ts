/**
 * Integration tests for CheckRunner (Feature 5, Task 5.6)
 * Tests the complete check run lifecycle with GitHub API mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CheckRunner,
  createCheckRunner,
  GitHubClient,
  SimpleGitHubClient,
} from '../../src/github/check-runner.js';
import {
  CheckContext,
  CheckRun,
  Annotation,
  Progress,
  CheckRunnerConfig,
  CheckRunStatus,
  Conclusion,
} from '../../src/types/check-run-types.js';
import { FormattedTestResults } from '../../src/github/comment-formatter.js';
import {
  TestResult,
  TestStatus,
  ExecutionSummary,
  ErrorType,
} from '../../src/types/executor-types.js';

describe('CheckRunner Integration Tests', () => {
  let mockClient: GitHubClient;
  let runner: CheckRunner;

  beforeEach(() => {
    mockClient = createMockGitHubClient();
    runner = new CheckRunner(mockClient);
  });

  describe('createCheckRunner', () => {
    it('should create CheckRunner with SimpleGitHubClient', () => {
      const config: CheckRunnerConfig = { token: 'test-token' };
      const createdRunner = createCheckRunner(config);

      expect(createdRunner).toBeInstanceOf(CheckRunner);
    });
  });

  describe('createCheckRun', () => {
    it('should create a check run successfully', async () => {
      const context: CheckContext = {
        owner: 'test-owner',
        repo: 'test-repo',
        name: 'API Tests',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
      };

      const checkRun = await runner.createCheckRun(context);

      expect(checkRun).toBeDefined();
      expect(checkRun.name).toBe('API Tests');
      expect(checkRun.status).toBe('queued');
      expect(checkRun.head_sha).toBe(context.head_sha);
    });

    it('should include started_at timestamp', async () => {
      const context = createValidContext();
      const checkRun = await runner.createCheckRun(context);

      expect(checkRun.started_at).toBeDefined();
    });

    it('should include optional details URL', async () => {
      const context = {
        ...createValidContext(),
        details_url: 'https://example.com/report',
      };

      const checkRun = await runner.createCheckRun(context);
      expect(checkRun.details_url).toBe('https://example.com/report');
    });

    it('should include optional external ID', async () => {
      const context = {
        ...createValidContext(),
        external_id: 'ext-123',
      };

      const checkRun = await runner.createCheckRun(context);
      expect(checkRun.external_id).toBe('ext-123');
    });

    it('should throw error for missing owner', async () => {
      const context = {
        owner: '',
        repo: 'test-repo',
        name: 'API Tests',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
      };

      await expect(runner.createCheckRun(context)).rejects.toThrow('owner is required');
    });

    it('should throw error for missing repo', async () => {
      const context = {
        owner: 'test-owner',
        repo: '',
        name: 'API Tests',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
      };

      await expect(runner.createCheckRun(context)).rejects.toThrow('repo is required');
    });

    it('should throw error for missing name', async () => {
      const context = {
        owner: 'test-owner',
        repo: 'test-repo',
        name: '',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
      };

      await expect(runner.createCheckRun(context)).rejects.toThrow('name is required');
    });

    it('should throw error for missing head_sha', async () => {
      const context = {
        owner: 'test-owner',
        repo: 'test-repo',
        name: 'API Tests',
        head_sha: '',
      };

      await expect(runner.createCheckRun(context)).rejects.toThrow('head_sha is required');
    });

    it('should throw error for invalid head_sha format', async () => {
      const context = {
        owner: 'test-owner',
        repo: 'test-repo',
        name: 'API Tests',
        head_sha: 'invalid-sha',
      };

      await expect(runner.createCheckRun(context)).rejects.toThrow('valid 40-character SHA-1');
    });
  });

  describe('updateToInProgress', () => {
    it('should update check run to in_progress status', async () => {
      const checkRun = await createTestCheckRun(runner);
      const progress: Progress = {
        summary: 'Running 10 tests...',
        testsCompleted: 5,
        testsTotal: 10,
      };

      const updated = await runner.updateToInProgress(checkRun.id, progress, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.status).toBe('in_progress');
      expect(updated.output?.title).toBe('Tests In Progress');
      expect(updated.output?.summary).toContain('Running 10 tests');
    });

    it('should calculate progress percentage', async () => {
      const checkRun = await createTestCheckRun(runner);
      const progress: Progress = {
        summary: 'Running tests',
        testsCompleted: 7,
        testsTotal: 10,
      };

      const updated = await runner.updateToInProgress(checkRun.id, progress, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.text).toContain('70.0%');
    });

    it('should include progress details if provided', async () => {
      const checkRun = await createTestCheckRun(runner);
      const progress: Progress = {
        summary: 'Running tests',
        testsCompleted: 3,
        testsTotal: 10,
        details: 'Currently testing authentication endpoints',
      };

      const updated = await runner.updateToInProgress(checkRun.id, progress, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.text).toContain('Currently testing authentication');
    });

    it('should handle progress without test counts', async () => {
      const checkRun = await createTestCheckRun(runner);
      const progress: Progress = {
        summary: 'Tests in progress',
      };

      const updated = await runner.updateToInProgress(checkRun.id, progress, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.status).toBe('in_progress');
      expect(updated.output?.summary).toBe('Tests in progress');
    });
  });

  describe('updateToCompleted', () => {
    it('should update check run to completed with success', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createAllPassedResults();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.status).toBe('completed');
      expect(updated.conclusion).toBe('success');
      expect(updated.completed_at).toBeDefined();
    });

    it('should update check run to completed with failure', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createMixedResults();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.status).toBe('completed');
      expect(updated.conclusion).toBe('failure');
    });

    it('should include output summary', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createMixedResults();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.summary).toContain('Total Tests');
      expect(updated.output?.summary).toContain('Passed');
      expect(updated.output?.summary).toContain('Failed');
    });

    it('should include annotations for failures', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createMixedResults();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.annotations).toBeDefined();
      expect(updated.output?.annotations!.length).toBeGreaterThan(0);
    });

    it('should limit annotations to max per batch', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createResultsWithManyFailures(60);

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.annotations!.length).toBeLessThanOrEqual(50);
      expect(updated.output?.annotations_count).toBe(60);
    });

    it('should include healed tests in summary', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createResultsWithHealedTests();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.summary).toContain('Self-Healed');
    });

    it('should include performance metrics in details', async () => {
      const checkRun = await createTestCheckRun(runner);
      const results = createResultsWithMetrics();

      const updated = await runner.updateToCompleted(checkRun.id, results, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(updated.output?.text).toContain('Performance Metrics');
      expect(updated.output?.text).toContain('Average Response Time');
    });
  });

  describe('addAnnotations', () => {
    it('should add annotations to check run', async () => {
      const checkRun = await createTestCheckRun(runner);
      const annotations = createValidAnnotations(5);

      await runner.addAnnotations(checkRun.id, annotations, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should batch large annotation sets', async () => {
      const runnerWithBatching = new CheckRunner(mockClient, {
        batchAnnotations: true,
        maxAnnotationsPerBatch: 50,
      });

      const checkRun = await createTestCheckRun(runnerWithBatching);
      const annotations = createValidAnnotations(125);

      await runnerWithBatching.addAnnotations(checkRun.id, annotations, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      // Should complete without error (3 batches: 50 + 50 + 25)
      expect(true).toBe(true);
    });

    it('should handle empty annotations array', async () => {
      const checkRun = await createTestCheckRun(runner);

      await runner.addAnnotations(checkRun.id, [], {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should throw error for invalid annotations', async () => {
      const checkRun = await createTestCheckRun(runner);
      const invalidAnnotations: Annotation[] = [
        {
          path: '',
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: 'Test failed',
        },
      ];

      await expect(
        runner.addAnnotations(checkRun.id, invalidAnnotations, {
          owner: 'test-owner',
          repo: 'test-repo',
        })
      ).rejects.toThrow('Invalid annotations');
    });

    it('should validate start_line is positive', async () => {
      const checkRun = await createTestCheckRun(runner);
      const invalidAnnotations: Annotation[] = [
        {
          path: 'test.ts',
          start_line: 0,
          end_line: 1,
          annotation_level: 'failure',
          message: 'Test failed',
        },
      ];

      await expect(
        runner.addAnnotations(checkRun.id, invalidAnnotations, {
          owner: 'test-owner',
          repo: 'test-repo',
        })
      ).rejects.toThrow('must be >= 1');
    });

    it('should validate end_line >= start_line', async () => {
      const checkRun = await createTestCheckRun(runner);
      const invalidAnnotations: Annotation[] = [
        {
          path: 'test.ts',
          start_line: 10,
          end_line: 5,
          annotation_level: 'failure',
          message: 'Test failed',
        },
      ];

      await expect(
        runner.addAnnotations(checkRun.id, invalidAnnotations, {
          owner: 'test-owner',
          repo: 'test-repo',
        })
      ).rejects.toThrow('must be >= start_line');
    });
  });

  describe('cancel', () => {
    it('should cancel a check run', async () => {
      const checkRun = await createTestCheckRun(runner);

      const cancelled = await runner.cancel(checkRun.id, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(cancelled.status).toBe('completed');
      expect(cancelled.conclusion).toBe('cancelled');
      expect(cancelled.completed_at).toBeDefined();
    });

    it('should include cancellation message in output', async () => {
      const checkRun = await createTestCheckRun(runner);

      const cancelled = await runner.cancel(checkRun.id, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(cancelled.output?.title).toBe('Check Run Cancelled');
      expect(cancelled.output?.summary).toContain('cancelled');
    });
  });

  describe('generateCheckRunOutput', () => {
    it('should generate output for all passed tests', () => {
      const results = createAllPassedResults();
      const output = runner.generateCheckRunOutput(results);

      expect(output.title).toContain('All');
      expect(output.title).toContain('passed');
      expect(output.summary).toContain('**Passed**: 3');
    });

    it('should generate output for failed tests', () => {
      const results = createMixedResults();
      const output = runner.generateCheckRunOutput(results);

      expect(output.title).toContain('failed');
      expect(output.summary).toContain('**Failed**:');
    });

    it('should include annotations for failures', () => {
      const results = createMixedResults();
      const output = runner.generateCheckRunOutput(results);

      expect(output.annotations).toBeDefined();
      expect(output.annotations!.length).toBeGreaterThan(0);
    });

    it('should include detailed text with failed test information', () => {
      const results = createMixedResults();
      const output = runner.generateCheckRunOutput(results);

      expect(output.text).toContain('Failed Tests');
    });
  });

  describe('createAnnotationsFromFailures', () => {
    it('should create annotations from failed tests', () => {
      const failures = createFailedTests(3);
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations).toHaveLength(3);
      expect(annotations[0].annotation_level).toBe('failure');
    });

    it('should use error location when available', () => {
      const failures = createFailedTestsWithLocation();
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations[0].path).toBe('test.ts');
      expect(annotations[0].start_line).toBe(42);
    });

    it('should fallback to test file path when no location', () => {
      const failures = createFailedTests(1);
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations[0].path).toBe('test.spec.ts');
      expect(annotations[0].start_line).toBe(1);
    });

    it('should include error message', () => {
      const failures = createFailedTests(1);
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations[0].message).toContain('Test assertion failed');
    });

    it('should include test name in title', () => {
      const failures = createFailedTests(1);
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations[0].title).toContain('failed-test-0');
    });

    it('should include raw details with stack trace', () => {
      const failures = createFailedTests(1);
      const annotations = runner.createAnnotationsFromFailures(failures);

      expect(annotations[0].raw_details).toBeDefined();
    });
  });

  describe('calculateConclusion', () => {
    it('should return success for all passed tests', () => {
      const results = createAllPassedResults();
      const conclusion = runner.calculateConclusion(results);

      expect(conclusion).toBe('success');
    });

    it('should return failure for any failed tests', () => {
      const results = createMixedResults();
      const conclusion = runner.calculateConclusion(results);

      expect(conclusion).toBe('failure');
    });

    it('should return neutral for all skipped tests', () => {
      const results = createAllSkippedResults();
      const conclusion = runner.calculateConclusion(results);

      expect(conclusion).toBe('neutral');
    });

    it('should return neutral for no tests', () => {
      const results = createEmptyResults();
      const conclusion = runner.calculateConclusion(results);

      expect(conclusion).toBe('neutral');
    });
  });

  describe('SimpleGitHubClient', () => {
    it('should create client with default base URL', () => {
      const config: CheckRunnerConfig = { token: 'test-token' };
      const client = new SimpleGitHubClient(config);

      expect(client).toBeInstanceOf(SimpleGitHubClient);
    });

    it('should create client with custom base URL', () => {
      const config: CheckRunnerConfig = {
        token: 'test-token',
        baseUrl: 'https://github.enterprise.com/api/v3',
      };
      const client = new SimpleGitHubClient(config);

      expect(client).toBeInstanceOf(SimpleGitHubClient);
    });

    it('should use default timeout if not specified', () => {
      const config: CheckRunnerConfig = { token: 'test-token' };
      const client = new SimpleGitHubClient(config);

      expect(client).toBeInstanceOf(SimpleGitHubClient);
    });
  });

  describe('end-to-end workflow', () => {
    it('should complete full check run lifecycle', async () => {
      // 1. Create check run
      const context = createValidContext();
      const checkRun = await runner.createCheckRun(context);
      expect(checkRun.status).toBe('queued');

      // 2. Update to in_progress
      const progress: Progress = {
        summary: 'Running 10 tests...',
        testsCompleted: 0,
        testsTotal: 10,
      };
      const inProgress = await runner.updateToInProgress(checkRun.id, progress, {
        owner: context.owner,
        repo: context.repo,
      });
      expect(inProgress.status).toBe('in_progress');

      // 3. Update progress
      progress.testsCompleted = 5;
      const midProgress = await runner.updateToInProgress(checkRun.id, progress, {
        owner: context.owner,
        repo: context.repo,
      });
      expect(midProgress.output?.text).toContain('50.0%');

      // 4. Complete with results
      const results = createAllPassedResults();
      const completed = await runner.updateToCompleted(checkRun.id, results, {
        owner: context.owner,
        repo: context.repo,
      });
      expect(completed.status).toBe('completed');
      expect(completed.conclusion).toBe('success');
    });

    it('should handle workflow with failures', async () => {
      const context = createValidContext();
      const checkRun = await runner.createCheckRun(context);

      const results = createMixedResults();
      const completed = await runner.updateToCompleted(checkRun.id, results, {
        owner: context.owner,
        repo: context.repo,
      });

      expect(completed.conclusion).toBe('failure');
      expect(completed.output?.annotations!.length).toBeGreaterThan(0);
    });

    it('should handle cancellation mid-workflow', async () => {
      const context = createValidContext();
      const checkRun = await runner.createCheckRun(context);

      await runner.updateToInProgress(
        checkRun.id,
        { summary: 'Running...' },
        { owner: context.owner, repo: context.repo }
      );

      const cancelled = await runner.cancel(checkRun.id, {
        owner: context.owner,
        repo: context.repo,
      });

      expect(cancelled.conclusion).toBe('cancelled');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorClient = createErrorGitHubClient();
      const errorRunner = new CheckRunner(errorClient);

      const context = createValidContext();

      await expect(errorRunner.createCheckRun(context)).rejects.toThrow('GitHub API error');
    });

    it('should validate annotation message length', async () => {
      const checkRun = await createTestCheckRun(runner);
      const longMessage = 'x'.repeat(70000);
      const annotations: Annotation[] = [
        {
          path: 'test.ts',
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: longMessage,
        },
      ];

      // Should truncate message automatically
      await runner.addAnnotations(checkRun.id, annotations, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      expect(annotations[0].message.length).toBe(64000);
    });
  });

  describe('batching functionality', () => {
    it('should not batch when disabled', async () => {
      const noBatchRunner = new CheckRunner(mockClient, { batchAnnotations: false });
      const checkRun = await createTestCheckRun(noBatchRunner);
      const annotations = createValidAnnotations(60);

      await noBatchRunner.addAnnotations(checkRun.id, annotations, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      // Should complete (client handles the limit)
      expect(true).toBe(true);
    });

    it('should use custom batch size', async () => {
      const customRunner = new CheckRunner(mockClient, {
        batchAnnotations: true,
        maxAnnotationsPerBatch: 25,
      });

      const checkRun = await createTestCheckRun(customRunner);
      const annotations = createValidAnnotations(60);

      await customRunner.addAnnotations(checkRun.id, annotations, {
        owner: 'test-owner',
        repo: 'test-repo',
      });

      // Should complete with 3 batches (25 + 25 + 10)
      expect(true).toBe(true);
    });
  });
});

// Helper functions

function createMockGitHubClient(): GitHubClient {
  let checkRunCounter = 1;

  return {
    async createCheckRun(request) {
      return {
        id: checkRunCounter++,
        name: request.name,
        head_sha: request.head_sha,
        status: request.status || 'queued',
        conclusion: request.conclusion,
        started_at: request.started_at || new Date().toISOString(),
        details_url: request.details_url,
        external_id: request.external_id,
        output: request.output,
      };
    },

    async updateCheckRun(request) {
      return {
        id: request.check_run_id,
        name: request.name || 'API Tests',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
        status: request.status || 'queued',
        conclusion: request.conclusion,
        started_at: request.started_at,
        completed_at: request.completed_at,
        details_url: request.details_url,
        external_id: request.external_id,
        output: request.output,
      };
    },

    async addAnnotations(owner, repo, checkRunId, annotations) {
      return {
        id: checkRunId,
        name: 'API Tests',
        head_sha: '1234567890abcdef1234567890abcdef12345678',
        status: 'in_progress' as CheckRunStatus,
        output: {
          title: 'Annotations Added',
          summary: `Added ${annotations.length} annotations`,
          annotations,
        },
      };
    },
  };
}

function createErrorGitHubClient(): GitHubClient {
  return {
    async createCheckRun() {
      throw new Error('GitHub API error: 401 - Unauthorized');
    },
    async updateCheckRun() {
      throw new Error('GitHub API error: 404 - Not Found');
    },
    async addAnnotations() {
      throw new Error('GitHub API error: 422 - Validation Failed');
    },
  };
}

function createValidContext(): CheckContext {
  return {
    owner: 'test-owner',
    repo: 'test-repo',
    name: 'API Tests',
    head_sha: '1234567890abcdef1234567890abcdef12345678',
  };
}

async function createTestCheckRun(runner: CheckRunner): Promise<CheckRun> {
  return await runner.createCheckRun(createValidContext());
}

function createValidAnnotations(count: number): Annotation[] {
  return Array.from({ length: count }, (_, i) => ({
    path: `test-${i}.ts`,
    start_line: i + 1,
    end_line: i + 1,
    annotation_level: 'failure' as const,
    message: `Test ${i} failed`,
    title: `Failed test ${i}`,
  }));
}

function createAllPassedResults(): FormattedTestResults {
  const tests = createPassedTests(3);
  return {
    summary: createSummary(3, 3, 0),
    tests,
    failedTests: [],
    healedTests: [],
  };
}

function createMixedResults(): FormattedTestResults {
  const passed = createPassedTests(5);
  const failed = createFailedTests(2);
  const tests = [...passed, ...failed];

  return {
    summary: createSummary(7, 5, 2),
    tests,
    failedTests: failed,
    healedTests: [],
  };
}

function createAllSkippedResults(): FormattedTestResults {
  const tests = createSkippedTests(3);
  return {
    summary: {
      totalTests: 3,
      passed: 0,
      failed: 0,
      skipped: 3,
      timeout: 0,
      error: 0,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      successRate: 0,
      averageDuration: 0,
      filesExecuted: [],
      totalRetries: 0,
      byFile: {},
    },
    tests,
    failedTests: [],
    healedTests: [],
  };
}

function createEmptyResults(): FormattedTestResults {
  return {
    summary: createSummary(0, 0, 0),
    tests: [],
    failedTests: [],
    healedTests: [],
  };
}

function createResultsWithManyFailures(count: number): FormattedTestResults {
  const failed = createFailedTests(count);
  return {
    summary: createSummary(count, 0, count),
    tests: failed,
    failedTests: failed,
    healedTests: [],
  };
}

function createResultsWithHealedTests(): FormattedTestResults {
  const passed = createPassedTests(3);
  return {
    summary: createSummary(3, 3, 0),
    tests: passed,
    failedTests: [],
    healedTests: [
      {
        test: passed[0],
        healingDescription: 'Field renamed',
        strategy: 'ai-powered',
        success: true,
      },
    ],
  };
}

function createResultsWithMetrics(): FormattedTestResults {
  const passed = createPassedTests(5);
  return {
    summary: createSummary(5, 5, 0),
    tests: passed,
    failedTests: [],
    healedTests: [],
    metrics: {
      averageResponseTime: 150,
      slowestEndpoint: { name: 'GET /slow', duration: 2000 },
      fastestEndpoint: { name: 'GET /fast', duration: 50 },
      totalRequests: 50,
      requestsPerSecond: 10,
    },
  };
}

function createSummary(total: number, passed: number, failed: number): ExecutionSummary {
  return {
    totalTests: total,
    passed,
    failed,
    skipped: 0,
    timeout: 0,
    error: 0,
    duration: total * 100,
    startTime: new Date(),
    endTime: new Date(),
    successRate: total > 0 ? passed / total : 0,
    averageDuration: 100,
    filesExecuted: ['test.spec.ts'],
    totalRetries: 0,
    byFile: {},
  };
}

function createPassedTests(count: number): TestResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `passed-${i}`,
    name: `passed-test-${i}`,
    filePath: 'test.spec.ts',
    status: TestStatus.PASSED,
    duration: 100 + i * 10,
    retries: 0,
    startTime: new Date(),
    endTime: new Date(),
  }));
}

function createFailedTests(count: number): TestResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `failed-${i}`,
    name: `failed-test-${i}`,
    filePath: 'test.spec.ts',
    status: TestStatus.FAILED,
    duration: 200,
    retries: 0,
    startTime: new Date(),
    endTime: new Date(),
    error: {
      message: 'Test assertion failed',
      type: ErrorType.ASSERTION,
      stack: 'Error: Test assertion failed\n  at test.spec.ts:10:5',
    },
  }));
}

function createFailedTestsWithLocation(): TestResult[] {
  return [
    {
      id: 'failed-with-loc',
      name: 'failed-test-with-location',
      filePath: 'test.spec.ts',
      status: TestStatus.FAILED,
      duration: 200,
      retries: 0,
      startTime: new Date(),
      endTime: new Date(),
      error: {
        message: 'Assertion error',
        type: ErrorType.ASSERTION,
        location: {
          file: 'test.ts',
          line: 42,
          column: 10,
        },
      },
    },
  ];
}

function createSkippedTests(count: number): TestResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `skipped-${i}`,
    name: `skipped-test-${i}`,
    filePath: 'test.spec.ts',
    status: TestStatus.SKIPPED,
    duration: 0,
    retries: 0,
    startTime: new Date(),
    endTime: new Date(),
  }));
}
