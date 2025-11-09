/**
 * Integration tests for Self-Healing Orchestrator (Feature 4, Task 4.6)
 * Comprehensive tests for the complete self-healing workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SelfHealingOrchestrator,
  SimpleFailureAnalyzer,
} from '../../src/ai/self-healing-orchestrator.js';
import {
  TestRegenerator,
  PromptBuilder,
  type OpenAIClient,
} from '../../src/ai/test-regenerator.js';
import type {
  HealingComponents,
  SelfHealingConfig,
  FailureAnalysis,
  FailureType,
  SpecChange,
  RegenerationContext,
  RegenerationResult,
} from '../../src/types/ai-types.js';
import type { TestResult, TestStatus, ErrorType } from '../../src/types/executor-types.js';

// Mock components
class MockOpenAIClient implements OpenAIClient {
  private shouldFail = false;
  private customResponse?: string;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  setCustomResponse(response: string) {
    this.customResponse = response;
  }

  async createCompletion(
    prompt: string,
    options?: any
  ): Promise<{
    text: string;
    tokensUsed: number;
    model: string;
  }> {
    if (this.shouldFail) {
      throw new Error('AI API Error');
    }

    const code =
      this.customResponse ||
      `
import { test, expect } from '@playwright/test';

test('regenerated test', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toBeDefined();
});
`;

    return {
      text: `\`\`\`typescript\n${code}\n\`\`\``,
      tokensUsed: 150,
      model: 'gpt-4',
    };
  }
}

class MockTestRunner {
  private testResults: Map<string, TestResult> = new Map();

  setTestResult(testId: string, result: TestResult) {
    this.testResults.set(testId, result);
  }

  async runTest(testPath: string, testName: string): Promise<TestResult> {
    const mockId = `${testPath}:${testName}`;
    return this.testResults.get(mockId) || createPassedTestResult();
  }
}

describe('SelfHealingOrchestrator', () => {
  let orchestrator: SelfHealingOrchestrator;
  let mockClient: MockOpenAIClient;
  let mockTestRunner: MockTestRunner;
  let components: HealingComponents;

  beforeEach(() => {
    mockClient = new MockOpenAIClient();
    mockTestRunner = new MockTestRunner();

    const promptBuilder = new PromptBuilder();
    const testRegenerator = new TestRegenerator(mockClient, promptBuilder, {
      apiKey: 'test',
      model: 'gpt-4',
    });

    components = {
      failureAnalyzer: new SimpleFailureAnalyzer(),
      specChangeDetector: {
        detectChanges: async () => [],
      },
      testRegenerator,
      testRunner: mockTestRunner,
    };

    orchestrator = new SelfHealingOrchestrator(components);
  });

  describe('healFailedTests', () => {
    it('should detect failed tests', async () => {
      const testResults = [
        createFailedTestResult({ id: 'test-1' }),
        createPassedTestResult({ id: 'test-2' }),
      ];

      const report = await orchestrator.healFailedTests(testResults);

      expect(report.failedTests).toBe(1);
      expect(report.totalTests).toBe(2);
    });

    it('should attempt to heal failed tests', async () => {
      const testResults = [createFailedTestResult()];
      const report = await orchestrator.healFailedTests(testResults);

      expect(report.healingAttempts).toBeGreaterThan(0);
    });

    it('should successfully heal healable failures', async () => {
      const testResults = [
        createFailedTestResult({
          error: {
            message: 'Field missing in response',
            type: 'assertion' as ErrorType,
          },
        }),
      ];

      mockTestRunner.setTestResult('test.spec.ts:test-1', createPassedTestResult());

      const report = await orchestrator.healFailedTests(testResults);

      expect(report.successfullyHealed).toBeGreaterThan(0);
    });

    it('should skip non-healable failures', async () => {
      const testResults = [
        createFailedTestResult({
          error: {
            message: 'Network timeout',
            type: 'timeout' as ErrorType,
          },
        }),
      ];

      const report = await orchestrator.healFailedTests(testResults);

      expect(report.nonHealable).toBe(1);
    });

    it('should respect max attempts per test limit', async () => {
      const config: Partial<SelfHealingConfig> = {
        maxAttemptsPerTest: 1,
      };
      orchestrator = new SelfHealingOrchestrator(components, config);

      const testResults = [createFailedTestResult()];

      // First attempt
      await orchestrator.healFailedTests(testResults);

      // Second attempt should be blocked
      const report2 = await orchestrator.healFailedTests(testResults);

      expect(report2.healingAttempts).toBe(0);
    });

    it('should respect max total time limit', async () => {
      const config: Partial<SelfHealingConfig> = {
        maxTotalTime: 100, // 100ms
      };
      orchestrator = new SelfHealingOrchestrator(components, config);

      // Create many failed tests
      const testResults = Array.from({ length: 10 }, (_, i) =>
        createFailedTestResult({ id: `test-${i}` })
      );

      const report = await orchestrator.healFailedTests(testResults);

      expect(report.totalTime).toBeLessThan(150); // Some buffer for execution
    });

    it('should generate comprehensive healing report', async () => {
      const testResults = [
        createFailedTestResult({ id: 'test-1' }),
        createFailedTestResult({ id: 'test-2' }),
      ];

      const report = await orchestrator.healFailedTests(testResults);

      expect(report).toHaveProperty('totalTests');
      expect(report).toHaveProperty('failedTests');
      expect(report).toHaveProperty('healingAttempts');
      expect(report).toHaveProperty('successfullyHealed');
      expect(report).toHaveProperty('failedHealing');
      expect(report).toHaveProperty('nonHealable');
      expect(report).toHaveProperty('totalTime');
      expect(report).toHaveProperty('attempts');
      expect(report).toHaveProperty('statistics');
    });

    it('should track healing statistics', async () => {
      const testResults = [createFailedTestResult()];
      const report = await orchestrator.healFailedTests(testResults);

      expect(report.statistics).toHaveProperty('successRate');
      expect(report.statistics).toHaveProperty('averageHealingTime');
      expect(report.statistics).toHaveProperty('byFailureType');
    });

    it('should handle empty test results', async () => {
      const report = await orchestrator.healFailedTests([]);

      expect(report.totalTests).toBe(0);
      expect(report.failedTests).toBe(0);
    });

    it('should handle all passing tests', async () => {
      const testResults = [createPassedTestResult(), createPassedTestResult()];

      const report = await orchestrator.healFailedTests(testResults);

      expect(report.failedTests).toBe(0);
      expect(report.healingAttempts).toBe(0);
    });
  });

  describe('detectFailedTests', () => {
    it('should detect failed status tests', async () => {
      const results = [createFailedTestResult(), createPassedTestResult()];

      const failed = await orchestrator.detectFailedTests(results);

      expect(failed).toHaveLength(1);
    });

    it('should detect error status tests', async () => {
      const results = [createTestResult({ status: 'error' as TestStatus })];

      const failed = await orchestrator.detectFailedTests(results);

      expect(failed).toHaveLength(1);
    });

    it('should ignore passed tests', async () => {
      const results = [createPassedTestResult()];

      const failed = await orchestrator.detectFailedTests(results);

      expect(failed).toHaveLength(0);
    });

    it('should ignore skipped tests', async () => {
      const results = [createTestResult({ status: 'skipped' as TestStatus })];

      const failed = await orchestrator.detectFailedTests(results);

      expect(failed).toHaveLength(0);
    });

    it('should read test file content', async () => {
      const results = [createFailedTestResult({ filePath: '/tmp/test.spec.ts' })];

      const failed = await orchestrator.detectFailedTests(results);

      expect(failed[0]?.testCode).toBeDefined();
    });
  });

  describe('analyzeFailure', () => {
    it('should analyze field_missing failures', async () => {
      const test = createFailedTest({
        error: {
          message: 'field email missing',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await orchestrator.analyzeFailure(test);

      expect(analysis.failureType).toBe('field_missing');
    });

    it('should analyze type_mismatch failures', async () => {
      const test = createFailedTest({
        error: {
          message: 'type mismatch: expected string, got number',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await orchestrator.analyzeFailure(test);

      expect(analysis.failureType).toBe('type_mismatch');
    });

    it('should analyze status_code_changed failures', async () => {
      const test = createFailedTest({
        error: {
          message: 'Expected status 200, got 404',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await orchestrator.analyzeFailure(test);

      expect(analysis.failureType).toBe('status_code_changed');
    });

    it('should analyze endpoint_not_found failures', async () => {
      const test = createFailedTest({
        error: {
          message: 'endpoint not found',
          type: 'network' as ErrorType,
        },
      });

      const analysis = await orchestrator.analyzeFailure(test);

      expect(analysis.failureType).toBe('endpoint_not_found');
    });

    it('should analyze timeout failures', async () => {
      const test = createFailedTest({
        status: 'timeout' as TestStatus,
        error: {
          message: 'timeout',
          type: 'timeout' as ErrorType,
        },
      });

      const analysis = await orchestrator.analyzeFailure(test);

      expect(analysis.failureType).toBe('timeout');
    });
  });

  describe('attemptHealing', () => {
    it('should regenerate test code', async () => {
      const test = createFailedTest();
      const analysis = await orchestrator.analyzeFailure(test);

      const result = await orchestrator.attemptHealing(test, analysis);

      expect(result.attempted).toBe(true);
      expect(result.regenerationResult).toBeDefined();
    });

    it('should retry test after healing when autoRetry enabled', async () => {
      const test = createFailedTest();
      const analysis = await orchestrator.analyzeFailure(test);

      mockTestRunner.setTestResult('test.spec.ts:test-1', createPassedTestResult());

      const result = await orchestrator.attemptHealing(test, analysis);

      expect(result.retryResult).toBeDefined();
    });

    it('should mark as success if retry passes', async () => {
      const test = createFailedTest();
      const analysis = await orchestrator.analyzeFailure(test);

      mockTestRunner.setTestResult('test.spec.ts:test-1', createPassedTestResult());

      const result = await orchestrator.attemptHealing(test, analysis);

      expect(result.success).toBe(true);
    });

    it('should mark as failure if retry fails', async () => {
      const test = createFailedTest();
      const analysis = await orchestrator.analyzeFailure(test);

      mockTestRunner.setTestResult('test.spec.ts:test-1', createFailedTestResult());

      const result = await orchestrator.attemptHealing(test, analysis);

      expect(result.success).toBe(false);
    });

    it('should handle regeneration errors', async () => {
      mockClient.setShouldFail(true);

      const test = createFailedTest();
      const analysis = await orchestrator.analyzeFailure(test);

      const result = await orchestrator.attemptHealing(test, analysis);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('error');
    });
  });

  describe('isHealable', () => {
    it('should identify healable field_missing failures', () => {
      const analysis = createFailureAnalysis({
        failureType: 'field_missing' as FailureType,
        healable: true,
        confidence: 0.9,
      });

      expect(orchestrator.isHealable(analysis)).toBe(true);
    });

    it('should identify healable type_mismatch failures', () => {
      const analysis = createFailureAnalysis({
        failureType: 'type_mismatch' as FailureType,
        healable: true,
        confidence: 0.9,
      });

      expect(orchestrator.isHealable(analysis)).toBe(true);
    });

    it('should reject non-healable timeout failures', () => {
      const analysis = createFailureAnalysis({
        failureType: 'timeout' as FailureType,
        healable: false,
        confidence: 0.3,
      });

      expect(orchestrator.isHealable(analysis)).toBe(false);
    });

    it('should reject low confidence failures', () => {
      const config: Partial<SelfHealingConfig> = {
        minConfidence: 0.7,
      };
      orchestrator = new SelfHealingOrchestrator(components, config);

      const analysis = createFailureAnalysis({
        confidence: 0.5,
      });

      expect(orchestrator.isHealable(analysis)).toBe(false);
    });

    it('should respect healable flag', () => {
      const analysis = createFailureAnalysis({
        failureType: 'field_missing' as FailureType,
        healable: false,
        confidence: 0.9,
      });

      expect(orchestrator.isHealable(analysis)).toBe(false);
    });
  });

  describe('limitHealingAttempts', () => {
    it('should allow first attempt', () => {
      const test = createFailedTest();

      expect(orchestrator.limitHealingAttempts(test)).toBe(true);
    });

    it('should enforce max attempts limit', async () => {
      const config: Partial<SelfHealingConfig> = {
        maxAttemptsPerTest: 2,
      };
      orchestrator = new SelfHealingOrchestrator(components, config);

      const testResults = [createFailedTestResult({ id: 'test-1' })];

      // Attempt 1
      await orchestrator.healFailedTests(testResults);

      // Attempt 2
      await orchestrator.healFailedTests(testResults);

      // Attempt 3 (should be blocked)
      const report = await orchestrator.healFailedTests(testResults);

      expect(report.healingAttempts).toBe(0);
    });
  });

  describe('trackHealingSuccess', () => {
    it('should track successful healing', async () => {
      const test = createFailedTest({ id: 'test-1' });
      const result = {
        testId: 'test-1',
        attempted: true,
        success: true,
        duration: 1000,
        regenerationResult: {} as RegenerationResult,
      };

      orchestrator.trackHealingSuccess(test, result);

      const attempts = orchestrator.getHealingAttempts('test-1');
      expect(attempts).toHaveLength(1);
    });

    it('should track failed healing', async () => {
      const test = createFailedTest({ id: 'test-1' });
      const result = {
        testId: 'test-1',
        attempted: true,
        success: false,
        duration: 1000,
        regenerationResult: {} as RegenerationResult,
      };

      orchestrator.trackHealingSuccess(test, result);

      const attempts = orchestrator.getHealingAttempts('test-1');
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.success).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = orchestrator.getConfig();

      expect(config.maxAttemptsPerTest).toBe(2);
      expect(config.maxTotalTime).toBe(300000);
    });

    it('should allow config updates', () => {
      orchestrator.updateConfig({
        maxAttemptsPerTest: 5,
      });

      const config = orchestrator.getConfig();
      expect(config.maxAttemptsPerTest).toBe(5);
    });

    it('should respect custom config on creation', () => {
      const customConfig: Partial<SelfHealingConfig> = {
        maxAttemptsPerTest: 3,
        maxTotalTime: 600000,
      };

      const customOrchestrator = new SelfHealingOrchestrator(components, customConfig);
      const config = customOrchestrator.getConfig();

      expect(config.maxAttemptsPerTest).toBe(3);
      expect(config.maxTotalTime).toBe(600000);
    });
  });

  describe('Statistics', () => {
    it('should provide summary statistics', async () => {
      const testResults = [createFailedTestResult()];
      await orchestrator.healFailedTests(testResults);

      const summary = orchestrator.getSummary();

      expect(summary).toHaveProperty('totalAttempts');
      expect(summary).toHaveProperty('successfulAttempts');
      expect(summary).toHaveProperty('failedAttempts');
      expect(summary).toHaveProperty('totalTimeSpent');
      expect(summary).toHaveProperty('averageTime');
    });

    it('should calculate average healing time', async () => {
      const testResults = [
        createFailedTestResult({ id: 'test-1' }),
        createFailedTestResult({ id: 'test-2' }),
      ];

      await orchestrator.healFailedTests(testResults);

      const summary = orchestrator.getSummary();
      expect(summary.averageTime).toBeGreaterThan(0);
    });
  });

  describe('History Management', () => {
    it('should track healing attempts', async () => {
      const testResults = [createFailedTestResult({ id: 'test-1' })];

      await orchestrator.healFailedTests(testResults);

      const attempts = orchestrator.getHealingAttempts('test-1');
      expect(attempts.length).toBeGreaterThan(0);
    });

    it('should clear history', async () => {
      const testResults = [createFailedTestResult()];
      await orchestrator.healFailedTests(testResults);

      orchestrator.clearHistory();

      const summary = orchestrator.getSummary();
      expect(summary.totalAttempts).toBe(0);
    });
  });
});

describe('SimpleFailureAnalyzer', () => {
  let analyzer: SimpleFailureAnalyzer;

  beforeEach(() => {
    analyzer = new SimpleFailureAnalyzer();
  });

  describe('analyze', () => {
    it('should detect field_missing failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'field email missing from response',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('field_missing');
      expect(analysis.healable).toBe(true);
    });

    it('should detect type_mismatch failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'type mismatch detected',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('type_mismatch');
    });

    it('should detect status_code_changed failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'Expected status 200, received 404',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('status_code_changed');
    });

    it('should detect endpoint_not_found failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'endpoint /api/v2/users not found',
          type: 'network' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('endpoint_not_found');
    });

    it('should detect timeout failures', async () => {
      const testResult = createFailedTestResult({
        status: 'timeout' as TestStatus,
        error: {
          message: 'request timeout after 5000ms',
          type: 'timeout' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('timeout');
      expect(analysis.healable).toBe(false);
    });

    it('should detect network_error failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'network connection refused ECONNREFUSED',
          type: 'network' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.failureType).toBe('network_error');
      expect(analysis.healable).toBe(false);
    });

    it('should provide confidence scores', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'field missing',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should suggest fixes for healable failures', async () => {
      const testResult = createFailedTestResult({
        error: {
          message: 'field email missing',
          type: 'assertion' as ErrorType,
        },
      });

      const analysis = await analyzer.analyze(testResult);

      expect(analysis.suggestedFix).toBeDefined();
      expect(analysis.suggestedFix).toContain('field');
    });
  });
});

// Helper functions
function createTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: overrides.id || 'test-1',
    name: overrides.name || 'Sample test',
    filePath: overrides.filePath || 'test.spec.ts',
    status: overrides.status || ('passed' as TestStatus),
    duration: overrides.duration || 1000,
    retries: overrides.retries || 0,
    startTime: overrides.startTime || new Date(),
    endTime: overrides.endTime || new Date(),
    error: overrides.error,
    ...overrides,
  };
}

function createPassedTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return createTestResult({
    status: 'passed' as TestStatus,
    ...overrides,
  });
}

function createFailedTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return createTestResult({
    status: 'failed' as TestStatus,
    error: overrides.error || {
      message: 'Test assertion failed',
      type: 'assertion' as ErrorType,
    },
    ...overrides,
  });
}

function createFailedTest(overrides: Partial<TestResult> = {}): any {
  return {
    result: createFailedTestResult(overrides),
    testCode: 'test("sample", () => {})',
    healingAttempts: 0,
    previousAttempts: [],
  };
}

function createFailureAnalysis(overrides: Partial<FailureAnalysis> = {}): FailureAnalysis {
  return {
    testResult: createFailedTestResult(),
    failureType: overrides.failureType || ('field_missing' as FailureType),
    rootCause: overrides.rootCause || 'Test failure',
    relatedChanges: overrides.relatedChanges || [],
    healable: overrides.healable ?? true,
    confidence: overrides.confidence ?? 0.9,
    suggestedFix: overrides.suggestedFix,
    analyzedAt: new Date(),
    metadata: {},
    ...overrides,
  };
}
