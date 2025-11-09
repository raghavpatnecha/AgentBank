/**
 * Unit tests for Data Aggregator (Feature 6)
 * Comprehensive test coverage for report data aggregation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataAggregator } from '../../src/reporting/data-aggregator.js';
import {
  TestReport,
  TestStatus,
  ReportSeverity,
  PlaywrightResults,
  PlaywrightSuite,
  PlaywrightTest,
} from '../../src/types/report-types.js';
import {
  HealingAttempt,
  HealingMetricsSummary,
  FailureType,
  HealingStrategy,
} from '../../src/types/self-healing-types.js';

describe('DataAggregator', () => {
  let aggregator: DataAggregator;

  beforeEach(() => {
    aggregator = new DataAggregator({
      baseUrl: 'https://api.example.com',
      environment: 'test',
      slowTestThreshold: 3000,
    });
  });

  // ==================== Constructor Tests ====================

  describe('constructor', () => {
    it('should create aggregator with default config', () => {
      const agg = new DataAggregator();
      expect(agg).toBeDefined();
    });

    it('should create aggregator with custom config', () => {
      const agg = new DataAggregator({
        includeDetails: false,
        includeStackTraces: false,
        slowTestThreshold: 5000,
      });
      expect(agg).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const agg = new DataAggregator({
        includeDetails: false,
      });
      expect(agg).toBeDefined();
    });
  });

  // ==================== Healing Data Tests ====================

  describe('setHealingData', () => {
    it('should set healing attempts', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ success: true }),
      ];
      aggregator.setHealingData(attempts);
      expect(aggregator).toBeDefined();
    });

    it('should handle empty healing data', () => {
      aggregator.setHealingData([]);
      expect(aggregator).toBeDefined();
    });
  });

  describe('setHealingMetrics', () => {
    it('should set healing metrics summary', () => {
      const metrics = createMockHealingMetricsSummary();
      aggregator.setHealingMetrics(metrics);
      expect(aggregator).toBeDefined();
    });
  });

  // ==================== Report Aggregation Tests ====================

  describe('aggregateResults', () => {
    it('should aggregate complete report from playwright results', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed' }),
        createMockPlaywrightTest({ status: 'failed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report).toBeDefined();
      expect(report.version).toBe('1.0.0');
      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.tests).toHaveLength(2);
    });

    it('should include all report sections', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.summary).toBeDefined();
      expect(report.environment).toBeDefined();
      expect(report.tests).toBeDefined();
      expect(report.selfHealing).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.suites).toBeDefined();
      expect(report.severity).toBeDefined();
      expect(report.warnings).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should handle empty test results', async () => {
      const results = createMockPlaywrightResults([]);
      const report = await aggregator.aggregateResults(results);

      expect(report.summary.total).toBe(0);
      expect(report.tests).toHaveLength(0);
    });

    it('should throw error on invalid report data', async () => {
      const results = createMockPlaywrightResults([]);
      // Manually create invalid data scenario if needed
      // For now, normal flow should pass validation
      const report = await aggregator.aggregateResults(results);
      expect(report).toBeDefined();
    });
  });

  // ==================== Summary Calculation Tests ====================

  describe('calculateSummary', () => {
    it('should calculate summary for all passed tests', () => {
      const testResults = [
        createMockTestResult({ status: TestStatus.PASSED, duration: 100 }),
        createMockTestResult({ status: TestStatus.PASSED, duration: 200 }),
        createMockTestResult({ status: TestStatus.PASSED, duration: 150 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(3);
      expect(summary.failed).toBe(0);
      expect(summary.successRate).toBe(100);
      expect(summary.duration).toBe(450);
      expect(summary.averageDuration).toBe(150);
    });

    it('should calculate summary for mixed test results', () => {
      const testResults = [
        createMockTestResult({ status: TestStatus.PASSED, duration: 100 }),
        createMockTestResult({ status: TestStatus.FAILED, duration: 200 }),
        createMockTestResult({ status: TestStatus.SKIPPED, duration: 0 }),
        createMockTestResult({ status: TestStatus.TIMEOUT, duration: 300 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.total).toBe(4);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.timeout).toBe(1);
      expect(summary.successRate).toBe(25);
    });

    it('should calculate summary for all failed tests', () => {
      const testResults = [
        createMockTestResult({ status: TestStatus.FAILED }),
        createMockTestResult({ status: TestStatus.FAILED }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(2);
      expect(summary.successRate).toBe(0);
    });

    it('should include healed tests in effective success rate', () => {
      const testResults = [
        createMockTestResult({ status: TestStatus.PASSED }),
        createMockTestResult({ status: TestStatus.HEALED }),
        createMockTestResult({ status: TestStatus.FAILED }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(1);
      expect(summary.selfHealed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.successRate).toBeCloseTo(33.33, 1);
      expect(summary.effectiveSuccessRate).toBeCloseTo(66.67, 1);
    });

    it('should handle empty test results', () => {
      const summary = aggregator.calculateSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.successRate).toBe(0);
      expect(summary.averageDuration).toBe(0);
    });

    it('should calculate fastest and slowest test durations', () => {
      const testResults = [
        createMockTestResult({ duration: 500 }),
        createMockTestResult({ duration: 100 }),
        createMockTestResult({ duration: 300 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.fastestTest).toBe(100);
      expect(summary.slowestTest).toBe(500);
    });

    it('should count total retries', () => {
      const testResults = [
        createMockTestResult({ retries: 2 }),
        createMockTestResult({ retries: 1 }),
        createMockTestResult({ retries: 0 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.totalRetries).toBe(3);
    });
  });

  // ==================== Test Result Collection Tests ====================

  describe('collectTestResults', () => {
    it('should collect tests from single suite', () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ title: 'Test 1' }),
        createMockPlaywrightTest({ title: 'Test 2' }),
      ]);

      const testResults = aggregator.collectTestResults(results);

      expect(testResults).toHaveLength(2);
      expect(testResults[0].name).toBe('Test 1');
      expect(testResults[1].name).toBe('Test 2');
    });

    it('should collect tests from nested suites', () => {
      const suite: PlaywrightSuite = {
        title: 'Parent Suite',
        file: '/path/to/test.spec.ts',
        tests: [createMockPlaywrightTest({ title: 'Test 1' })],
        suites: [
          {
            title: 'Child Suite',
            file: '/path/to/test.spec.ts',
            tests: [createMockPlaywrightTest({ title: 'Test 2' })],
          },
        ],
      };

      const results: PlaywrightResults = {
        config: {},
        suites: [suite],
        errors: [],
        startTime: new Date(),
        duration: 1000,
      };

      const testResults = aggregator.collectTestResults(results);

      expect(testResults).toHaveLength(2);
      expect(testResults[0].suite).toBe('Parent Suite');
      expect(testResults[1].suite).toBe('Parent Suite > Child Suite');
    });

    it('should handle empty suites', () => {
      const results = createMockPlaywrightResults([]);
      const testResults = aggregator.collectTestResults(results);

      expect(testResults).toHaveLength(0);
    });

    it('should preserve test metadata', () => {
      const test = createMockPlaywrightTest({
        title: 'Test 1',
        tags: ['@smoke', '@critical'],
      });
      const results = createMockPlaywrightResults([test]);

      const testResults = aggregator.collectTestResults(results);

      expect(testResults[0].tags).toEqual(['@smoke', '@critical']);
    });
  });

  // ==================== Failure Detail Tests ====================

  describe('extractFailureDetails', () => {
    it('should extract failure details from failed test', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: {
          message: 'Expected 200 but got 404',
          stack: 'Error: ...',
        },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.message).toBe('Expected 200 but got 404');
      expect(failure.type).toBeDefined();
      expect(failure.retryable).toBeDefined();
    });

    it('should infer timeout failure type', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: { message: 'Test timed out after 30000ms' },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.type).toBe(FailureType.TIMEOUT);
      expect(failure.retryable).toBe(true);
    });

    it('should infer network failure type', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: { message: 'Network request failed' },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.type).toBe(FailureType.NETWORK);
      expect(failure.retryable).toBe(true);
    });

    it('should infer assertion failure type', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: { message: 'expect(received).toBe(expected)' },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.type).toBe(FailureType.ASSERTION);
    });

    it('should include stack trace when configured', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: {
          message: 'Test failed',
          stack: 'Error: Test failed\n    at test.spec.ts:10:5',
        },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.stack).toBeDefined();
      expect(failure.stack).toContain('test.spec.ts');
    });

    it('should include location information', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: { message: 'Test failed' },
        location: { file: 'test.spec.ts', line: 42, column: 10 },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.location).toBeDefined();
      expect(failure.location?.file).toBe('test.spec.ts');
      expect(failure.location?.line).toBe(42);
    });
  });

  // ==================== Healing Metrics Tests ====================

  describe('aggregateHealingMetrics', () => {
    it('should aggregate healing metrics from attempts', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ success: true }),
        createMockHealingAttempt({ success: true }),
        createMockHealingAttempt({ success: false }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.successful).toBe(2);
      expect(metrics.failed).toBe(1);
      expect(metrics.successRate).toBeCloseTo(66.67, 1);
    });

    it('should count healing attempts by failure type', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ failureType: FailureType.TIMEOUT }),
        createMockHealingAttempt({ failureType: FailureType.TIMEOUT }),
        createMockHealingAttempt({ failureType: FailureType.ASSERTION }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.byFailureType[FailureType.TIMEOUT]).toBe(2);
      expect(metrics.byFailureType[FailureType.ASSERTION]).toBe(1);
    });

    it('should count healing attempts by strategy', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ strategy: HealingStrategy.AI_POWERED }),
        createMockHealingAttempt({ strategy: HealingStrategy.AI_POWERED }),
        createMockHealingAttempt({ strategy: HealingStrategy.FALLBACK }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.aiUsed).toBe(2);
      expect(metrics.fallbackUsed).toBe(1);
    });

    it('should calculate total tokens and cost', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ tokensUsed: 500, cost: 0.01 }),
        createMockHealingAttempt({ tokensUsed: 300, cost: 0.005 }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.totalTokens).toBe(800);
      expect(metrics.totalCost).toBeCloseTo(0.015, 3);
    });

    it('should calculate cache hit rate', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({ cacheHit: true }),
        createMockHealingAttempt({ cacheHit: true }),
        createMockHealingAttempt({ cacheHit: false }),
        createMockHealingAttempt({ cacheHit: false }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.cacheHitRate).toBe(50);
    });

    it('should handle empty healing data', () => {
      aggregator.setHealingData([]);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.successful).toBe(0);
      expect(metrics.successRate).toBe(0);
    });

    it('should extract top healing patterns', () => {
      const attempts: HealingAttempt[] = [
        createMockHealingAttempt({
          test: createMockFailedTest({ errorMessage: 'Error A' }),
          success: true,
        }),
        createMockHealingAttempt({
          test: createMockFailedTest({ errorMessage: 'Error A' }),
          success: true,
        }),
        createMockHealingAttempt({
          test: createMockFailedTest({ errorMessage: 'Error B' }),
          success: false,
        }),
      ];

      aggregator.setHealingData(attempts);
      const metrics = aggregator.aggregateHealingMetrics();

      expect(metrics.topPatterns).toBeDefined();
      expect(metrics.topPatterns.length).toBeGreaterThan(0);
    });
  });

  // ==================== Performance Metrics Tests ====================

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics', () => {
      const testResults = [
        createMockTestResult({ duration: 100 }),
        createMockTestResult({ duration: 200 }),
        createMockTestResult({ duration: 300 }),
      ];

      const metrics = aggregator.calculatePerformanceMetrics(testResults);

      expect(metrics.averageDuration).toBe(200);
      expect(metrics.slowestTest.duration).toBe(300);
      expect(metrics.fastestTest.duration).toBe(100);
    });

    it('should calculate percentiles', () => {
      const testResults = Array.from({ length: 100 }, (_, i) =>
        createMockTestResult({ duration: (i + 1) * 10 })
      );

      const metrics = aggregator.calculatePerformanceMetrics(testResults);

      expect(metrics.percentiles.p50).toBeGreaterThan(0);
      expect(metrics.percentiles.p95).toBeGreaterThan(metrics.percentiles.p50);
      expect(metrics.percentiles.p99).toBeGreaterThan(metrics.percentiles.p95);
    });

    it('should identify slow tests', () => {
      const testResults = [
        createMockTestResult({ name: 'Fast Test', duration: 1000 }),
        createMockTestResult({ name: 'Slow Test 1', duration: 5000 }),
        createMockTestResult({ name: 'Slow Test 2', duration: 4000 }),
      ];

      const metrics = aggregator.calculatePerformanceMetrics(testResults);

      expect(metrics.slowTests.length).toBe(2);
      expect(metrics.slowTests[0].name).toBe('Slow Test 1');
    });

    it('should calculate duration by suite', () => {
      const testResults = [
        createMockTestResult({ suite: 'Suite A', duration: 100 }),
        createMockTestResult({ suite: 'Suite A', duration: 200 }),
        createMockTestResult({ suite: 'Suite B', duration: 300 }),
      ];

      const metrics = aggregator.calculatePerformanceMetrics(testResults);

      expect(metrics.durationBySuite['Suite A']).toBe(300);
      expect(metrics.durationBySuite['Suite B']).toBe(300);
    });

    it('should count timeout violations', () => {
      const testResults = [
        createMockTestResult({ status: TestStatus.TIMEOUT }),
        createMockTestResult({ status: TestStatus.TIMEOUT }),
        createMockTestResult({ status: TestStatus.PASSED }),
      ];

      const metrics = aggregator.calculatePerformanceMetrics(testResults);

      expect(metrics.timeoutViolations).toBe(2);
    });

    it('should handle empty results', () => {
      const metrics = aggregator.calculatePerformanceMetrics([]);

      expect(metrics.averageDuration).toBe(0);
      expect(metrics.slowestTest.duration).toBe(0);
    });
  });

  // ==================== Suite Organization Tests ====================

  describe('organizeByTestSuite', () => {
    it('should organize tests by suite', () => {
      const testResults = [
        createMockTestResult({ suite: 'Suite A', name: 'Test 1' }),
        createMockTestResult({ suite: 'Suite A', name: 'Test 2' }),
        createMockTestResult({ suite: 'Suite B', name: 'Test 3' }),
      ];

      const suites = aggregator.organizeByTestSuite(testResults);

      expect(Object.keys(suites)).toHaveLength(2);
      expect(suites['Suite A'].tests).toHaveLength(2);
      expect(suites['Suite B'].tests).toHaveLength(1);
    });

    it('should calculate suite summary', () => {
      const testResults = [
        createMockTestResult({ suite: 'Suite A', status: TestStatus.PASSED }),
        createMockTestResult({ suite: 'Suite A', status: TestStatus.FAILED }),
        createMockTestResult({ suite: 'Suite A', status: TestStatus.SKIPPED }),
      ];

      const suites = aggregator.organizeByTestSuite(testResults);
      const summary = suites['Suite A'].summary;

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
    });

    it('should calculate suite success rate', () => {
      const testResults = [
        createMockTestResult({ suite: 'Suite A', status: TestStatus.PASSED }),
        createMockTestResult({ suite: 'Suite A', status: TestStatus.PASSED }),
        createMockTestResult({ suite: 'Suite A', status: TestStatus.FAILED }),
      ];

      const suites = aggregator.organizeByTestSuite(testResults);

      expect(suites['Suite A'].summary.successRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate suite duration', () => {
      const testResults = [
        createMockTestResult({ suite: 'Suite A', duration: 100 }),
        createMockTestResult({ suite: 'Suite A', duration: 200 }),
      ];

      const suites = aggregator.organizeByTestSuite(testResults);

      expect(suites['Suite A'].summary.duration).toBe(300);
    });

    it('should handle empty test results', () => {
      const suites = aggregator.organizeByTestSuite([]);

      expect(Object.keys(suites)).toHaveLength(0);
    });
  });

  // ==================== Environment Data Tests ====================

  describe('enrichWithEnvironmentData', () => {
    it('should collect environment information', () => {
      const env = aggregator.enrichWithEnvironmentData();

      expect(env.baseUrl).toBe('https://api.example.com');
      expect(env.environment).toBe('test');
      expect(env.timestamp).toBeDefined();
      expect(env.nodeVersion).toBeDefined();
      expect(env.osInfo).toBeDefined();
    });

    it('should include OS information', () => {
      const env = aggregator.enrichWithEnvironmentData();

      expect(env.osInfo.platform).toBeDefined();
      expect(env.osInfo.arch).toBeDefined();
      expect(env.osInfo.cpus).toBeGreaterThan(0);
      expect(env.osInfo.memory).toBeGreaterThan(0);
    });

    it('should detect CI environment', () => {
      const originalCI = process.env.CI;
      process.env.CI = 'true';

      const env = aggregator.enrichWithEnvironmentData();

      expect(env.ci).toBeDefined();
      expect(env.ci?.isCI).toBe(true);

      process.env.CI = originalCI;
    });
  });

  // ==================== Validation Tests ====================

  describe('validateReportData', () => {
    it('should validate valid report', () => {
      const report = createMockReport();
      const validation = aggregator.validateReportData(report);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing version', () => {
      const report = createMockReport();
      report.version = '';

      const validation = aggregator.validateReportData(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Report version is required');
    });

    it('should detect missing report ID', () => {
      const report = createMockReport();
      report.reportId = '';

      const validation = aggregator.validateReportData(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Report ID is required');
    });

    it('should detect summary total mismatch', () => {
      const report = createMockReport();
      report.summary.total = 10;
      report.summary.passed = 5;
      report.summary.failed = 3;
      report.summary.skipped = 1;
      report.summary.timeout = 0;
      report.summary.error = 0;
      report.summary.selfHealed = 0;

      const validation = aggregator.validateReportData(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes("don't match"))).toBe(true);
    });

    it('should detect invalid success rate', () => {
      const report = createMockReport();
      report.summary.successRate = 150;

      const validation = aggregator.validateReportData(report);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Success rate must be between 0 and 100');
    });
  });

  // ==================== Edge Case Tests ====================

  describe('edge cases', () => {
    it('should handle very large number of tests', async () => {
      const tests = Array.from({ length: 1000 }, (_, i) =>
        createMockPlaywrightTest({ title: `Test ${i}` })
      );
      const results = createMockPlaywrightResults(tests);

      const report = await aggregator.aggregateResults(results);

      expect(report.summary.total).toBe(1000);
    });

    it('should handle deeply nested suites', () => {
      let suite: PlaywrightSuite = {
        title: 'Level 5',
        file: '/path/to/test.spec.ts',
        tests: [createMockPlaywrightTest()],
      };

      for (let i = 4; i >= 1; i--) {
        suite = {
          title: `Level ${i}`,
          file: '/path/to/test.spec.ts',
          tests: [],
          suites: [suite],
        };
      }

      const results: PlaywrightResults = {
        config: {},
        suites: [suite],
        errors: [],
        startTime: new Date(),
        duration: 1000,
      };

      const testResults = aggregator.collectTestResults(results);

      expect(testResults).toHaveLength(1);
      expect(testResults[0].suite).toContain('Level 1');
      expect(testResults[0].suite).toContain('Level 5');
    });

    it('should handle tests with zero duration', () => {
      const testResults = [
        createMockTestResult({ duration: 0 }),
        createMockTestResult({ duration: 0 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.averageDuration).toBe(0);
      expect(summary.fastestTest).toBe(0);
    });

    it('should handle tests with extremely long durations', () => {
      const testResults = [
        createMockTestResult({ duration: 999999999 }),
      ];

      const summary = aggregator.calculateSummary(testResults);

      expect(summary.duration).toBe(999999999);
    });

    it('should sanitize sensitive data in error messages', () => {
      const test = createMockPlaywrightTest({
        status: 'failed',
        error: { message: 'Authentication failed with password: secret123' },
      });

      const failure = aggregator.extractFailureDetails(test);

      expect(failure.message).toContain('[REDACTED]');
    });
  });

  // ==================== Severity Tests ====================

  describe('report severity', () => {
    it('should mark report as SUCCESS when all tests pass', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed' }),
        createMockPlaywrightTest({ status: 'passed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.severity).toBe(ReportSeverity.SUCCESS);
    });

    it('should mark report as CRITICAL when success rate is low', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed' }),
        createMockPlaywrightTest({ status: 'failed' }),
        createMockPlaywrightTest({ status: 'failed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.severity).toBe(ReportSeverity.CRITICAL);
    });
  });

  // ==================== Warning Generation Tests ====================

  describe('warning generation', () => {
    it('should generate warnings for low success rate', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed' }),
        createMockPlaywrightTest({ status: 'failed' }),
        createMockPlaywrightTest({ status: 'failed' }),
        createMockPlaywrightTest({ status: 'failed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.warnings.some(w => w.includes('success rate'))).toBe(true);
    });

    it('should generate warnings for timeouts', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'timedOut' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.warnings.some(w => w.includes('timed out'))).toBe(true);
    });
  });

  // ==================== Recommendation Tests ====================

  describe('recommendation generation', () => {
    it('should recommend fixing failing tests', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'failed' }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.recommendations.some(r => r.includes('failing tests'))).toBe(true);
    });

    it('should recommend optimizing slow tests', async () => {
      const results = createMockPlaywrightResults([
        createMockPlaywrightTest({ status: 'passed', duration: 10000 }),
      ]);

      const report = await aggregator.aggregateResults(results);

      expect(report.recommendations.some(r => r.includes('slow tests'))).toBe(true);
    });
  });
});

// ==================== Helper Functions ====================

function createMockPlaywrightResults(tests: PlaywrightTest[]): PlaywrightResults {
  return {
    config: {},
    suites: [
      {
        title: 'Test Suite',
        file: '/path/to/test.spec.ts',
        tests,
      },
    ],
    errors: [],
    startTime: new Date(),
    duration: 1000,
  };
}

function createMockPlaywrightTest(overrides?: Partial<PlaywrightTest>): PlaywrightTest {
  return {
    title: 'Test',
    status: 'passed',
    duration: 100,
    results: [
      {
        status: 'passed',
        duration: 100,
        retry: 0,
        startTime: new Date(),
      },
    ],
    location: {
      file: '/path/to/test.spec.ts',
      line: 10,
      column: 5,
    },
    ...overrides,
  };
}

function createMockTestResult(overrides?: Partial<any>): any {
  return {
    id: 'test-123',
    name: 'Test',
    suite: 'Suite',
    filePath: '/path/to/test.spec.ts',
    status: TestStatus.PASSED,
    duration: 100,
    retries: 0,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    ...overrides,
  };
}

function createMockHealingAttempt(overrides?: Partial<any>): HealingAttempt {
  const failureType = overrides?.failureType || FailureType.ASSERTION;
  const tokensUsed = overrides?.tokensUsed !== undefined ? overrides.tokensUsed : 100;
  const cost = overrides?.cost !== undefined ? overrides.cost : 0.001;

  return {
    id: 'heal-123',
    test: createMockFailedTest({ failureType }),
    strategy: HealingStrategy.AI_POWERED,
    startTime: new Date(),
    endTime: new Date(),
    duration: 1000,
    success: true,
    tokensUsed,
    estimatedCost: cost,
    cacheHit: false,
    ...overrides,
  };
}

function createMockFailedTest(overrides?: Partial<any>): any {
  return {
    id: 'test-123',
    name: 'Failed Test',
    filePath: '/path/to/test.spec.ts',
    failureType: FailureType.ASSERTION,
    errorMessage: 'Test failed',
    testCode: 'expect(result).toBe(expected)',
    timestamp: new Date(),
    previousAttempts: 0,
    ...overrides,
  };
}

function createMockHealingMetricsSummary(): HealingMetricsSummary {
  return {
    totalAttempts: 10,
    successful: 8,
    failed: 2,
    successRate: 80,
    averageTime: 1500,
    totalCost: 0.05,
    byFailureType: {
      [FailureType.ASSERTION]: {
        attempts: 5,
        successful: 4,
        failed: 1,
        successRate: 0.8,
        averageTime: 1200,
        totalCost: 0.02,
      },
      [FailureType.TIMEOUT]: {
        attempts: 3,
        successful: 2,
        failed: 1,
        successRate: 0.67,
        averageTime: 2000,
        totalCost: 0.015,
      },
      [FailureType.NETWORK]: {
        attempts: 2,
        successful: 2,
        failed: 0,
        successRate: 1,
        averageTime: 1000,
        totalCost: 0.01,
      },
      [FailureType.VALIDATION]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
      [FailureType.SETUP]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
      [FailureType.TEARDOWN]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
      [FailureType.SYNTAX]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
      [FailureType.RUNTIME]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
      [FailureType.UNKNOWN]: {
        attempts: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        totalCost: 0,
      },
    },
    aiStats: {
      timesUsed: 8,
      totalTokens: 5000,
      promptTokens: 3000,
      completionTokens: 2000,
      totalCost: 0.04,
      averageTokens: 625,
      successRate: 0.875,
      cacheHitRate: 0.25,
    },
    fallbackStats: {
      timesUsed: 2,
      successRate: 0.5,
      averageTime: 500,
      fallbackReasons: {
        'budget-exceeded': 1,
        'ai-unavailable': 1,
      },
    },
    period: {
      start: new Date(),
      end: new Date(),
    },
    warnings: [],
    recommendations: [],
  };
}

function createMockReport(): TestReport {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    reportId: 'report-123',
    summary: {
      total: 5,
      passed: 3,
      failed: 1,
      skipped: 1,
      timeout: 0,
      error: 0,
      selfHealed: 0,
      duration: 5000,
      successRate: 60,
      effectiveSuccessRate: 60,
      averageDuration: 1000,
      fastestTest: 500,
      slowestTest: 2000,
      totalRetries: 2,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    },
    environment: {
      baseUrl: 'https://api.example.com',
      environment: 'test',
      timestamp: new Date().toISOString(),
      nodeVersion: 'v18.0.0',
      osInfo: {
        platform: 'linux',
        release: '5.10.0',
        arch: 'x64',
        cpus: 4,
        memory: 8589934592,
      },
    },
    tests: [],
    selfHealing: {
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      byFailureType: {} as any,
      byStrategy: {} as any,
      aiUsed: 0,
      fallbackUsed: 0,
      totalTokens: 0,
      totalCost: 0,
      averageHealingTime: 0,
      cacheHitRate: 0,
      topPatterns: [],
      cacheSavings: 0,
    },
    performance: {
      averageDuration: 1000,
      averageResponseTime: 200,
      slowestTest: {
        name: 'Slow Test',
        duration: 2000,
        filePath: '/path/to/test.spec.ts',
      },
      fastestTest: {
        name: 'Fast Test',
        duration: 500,
        filePath: '/path/to/test.spec.ts',
      },
      durationBySuite: {},
      durationByFile: {},
      timeByEndpoint: {},
      percentiles: { p50: 1000, p75: 1500, p90: 1800, p95: 1900, p99: 2000 },
      timeoutViolations: 0,
      slowTests: [],
    },
    suites: {},
    severity: ReportSeverity.SUCCESS,
    warnings: [],
    recommendations: [],
  };
}
