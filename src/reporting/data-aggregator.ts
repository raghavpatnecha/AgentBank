/**
 * Data Aggregator for Test Reporting (Feature 6)
 * Aggregates test results, execution metadata, and self-healing information
 */

import * as os from 'os';
import { randomUUID } from 'crypto';
import {
  TestReport,
  TestSummary,
  TestResult,
  TestStatus,
  EnvironmentInfo,
  HealingMetrics,
  PerformanceMetrics,
  TestFailure,
  TestSuiteResult,
  AggregatorConfig,
  ValidationResult,
  ReportSeverity,
  REPORT_VERSION,
  PlaywrightResults,
  PlaywrightSuite,
  PlaywrightTest,
  EndpointMetrics,
  HealingPattern,
  TestHealingInfo,
  CIInfo,
  GitInfo,
} from '../types/report-types.js';
import {
  HealingAttempt,
  HealingMetricsSummary,
  FailureType,
  HealingStrategy,
} from '../types/self-healing-types.js';

/**
 * Default aggregator configuration
 */
const DEFAULT_CONFIG: AggregatorConfig = {
  includeDetails: true,
  includeRequestResponse: true,
  includeStackTraces: true,
  includeEnvironment: true,
  includeHealingMetrics: true,
  includePerformanceMetrics: true,
  includeCoverage: false,
  slowTestThreshold: 5000, // 5 seconds
  sanitizeSensitiveData: true,
  sensitivePatterns: [/password/i, /token/i, /api[_-]?key/i, /secret/i, /auth/i],
};

/**
 * Data Aggregator class
 */
export class DataAggregator {
  private config: AggregatorConfig;
  private healingData: HealingAttempt[] = [];
  private healingMetrics?: HealingMetricsSummary;

  /**
   * Create a new DataAggregator
   * @param config - Aggregator configuration
   */
  constructor(config?: Partial<AggregatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set healing data for aggregation
   * @param attempts - Healing attempts to include
   */
  setHealingData(attempts: HealingAttempt[]): void {
    this.healingData = attempts;
  }

  /**
   * Set healing metrics summary
   * @param metrics - Healing metrics to include
   */
  setHealingMetrics(metrics: HealingMetricsSummary): void {
    this.healingMetrics = metrics;
  }

  /**
   * Aggregate test results into a complete report
   * @param results - Playwright test results
   * @returns Complete test report
   */
  async aggregateResults(results: PlaywrightResults): Promise<TestReport> {
    // Collect test results from Playwright format
    const testResults = this.collectTestResults(results);

    // Calculate summary statistics
    const summary = this.calculateSummary(testResults);

    // Organize tests by suite
    const suites = this.organizeByTestSuite(testResults);

    // Aggregate healing metrics
    const healingMetrics = this.aggregateHealingMetrics();

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(testResults);

    // Collect environment information
    const environment = this.enrichWithEnvironmentData();

    // Determine report severity
    const severity = this.determineReportSeverity(summary, healingMetrics);

    // Generate warnings and recommendations
    const warnings = this.generateWarnings(summary, healingMetrics, performanceMetrics);
    const recommendations = this.generateRecommendations(
      summary,
      healingMetrics,
      performanceMetrics
    );

    // Create the complete report
    const report: TestReport = {
      version: REPORT_VERSION,
      generatedAt: new Date().toISOString(),
      reportId: randomUUID(),
      summary,
      environment,
      tests: testResults,
      selfHealing: healingMetrics,
      performance: performanceMetrics,
      suites,
      severity,
      warnings,
      recommendations,
      metadata: this.config.metadata,
    };

    // Validate report data
    const validation = this.validateReportData(report);
    if (!validation.valid) {
      throw new Error(`Invalid report data: ${validation.errors.join(', ')}`);
    }

    return report;
  }

  /**
   * Calculate summary statistics from test results
   * @param results - Test results
   * @returns Test summary
   */
  calculateSummary(results: TestResult[]): TestSummary {
    const total = results.length;
    const passed = results.filter((r) => r.status === TestStatus.PASSED).length;
    const failed = results.filter((r) => r.status === TestStatus.FAILED).length;
    const skipped = results.filter((r) => r.status === TestStatus.SKIPPED).length;
    const timeout = results.filter((r) => r.status === TestStatus.TIMEOUT).length;
    const error = results.filter((r) => r.status === TestStatus.ERROR).length;
    const selfHealed = results.filter((r) => r.status === TestStatus.HEALED).length;

    const durations = results.map((r) => r.duration);
    const duration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = total > 0 ? duration / total : 0;
    const fastestTest = total > 0 ? Math.min(...durations) : 0;
    const slowestTest = total > 0 ? Math.max(...durations) : 0;

    const totalRetries = results.reduce((sum, r) => sum + r.retries, 0);

    const successRate = total > 0 ? (passed / total) * 100 : 0;
    const effectiveSuccessRate = total > 0 ? ((passed + selfHealed) / total) * 100 : 0;

    const startTimes = results.map((r) => new Date(r.startTime).getTime());
    const endTimes = results.map((r) => new Date(r.endTime).getTime());
    const startTime =
      startTimes.length > 0
        ? new Date(Math.min(...startTimes)).toISOString()
        : new Date().toISOString();
    const endTime =
      endTimes.length > 0
        ? new Date(Math.max(...endTimes)).toISOString()
        : new Date().toISOString();

    return {
      total,
      passed,
      failed,
      skipped,
      timeout,
      error,
      selfHealed,
      duration,
      successRate,
      effectiveSuccessRate,
      averageDuration,
      fastestTest,
      slowestTest,
      totalRetries,
      startTime,
      endTime,
    };
  }

  /**
   * Collect test results from Playwright results
   * @param results - Playwright results
   * @returns Array of test results
   */
  collectTestResults(results: PlaywrightResults): TestResult[] {
    const testResults: TestResult[] = [];

    const processSuite = (suite: PlaywrightSuite, parentTitle: string = ''): void => {
      const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

      // Process tests in this suite
      for (const test of suite.tests || []) {
        const testResult = this.convertPlaywrightTest(test, suiteTitle, suite.file);
        testResults.push(testResult);
      }

      // Process child suites recursively
      if (suite.suites) {
        for (const childSuite of suite.suites) {
          processSuite(childSuite, suiteTitle);
        }
      }
    };

    // Process all suites
    for (const suite of results.suites) {
      processSuite(suite);
    }

    return testResults;
  }

  /**
   * Convert Playwright test to TestResult
   * @param test - Playwright test
   * @param suiteName - Suite name
   * @param filePath - Test file path
   * @returns Test result
   */
  private convertPlaywrightTest(
    test: PlaywrightTest,
    suiteName: string,
    filePath: string
  ): TestResult {
    const id = randomUUID();
    const status = this.mapPlaywrightStatus(test.status);
    const duration = test.duration;
    const retries = test.results.length - 1;

    const lastResult = test.results[test.results.length - 1];
    const startTime = lastResult?.startTime
      ? new Date(lastResult.startTime).toISOString()
      : new Date().toISOString();
    const endTime = new Date(new Date(startTime).getTime() + duration).toISOString();

    const testResult: TestResult = {
      id,
      name: test.title,
      suite: suiteName,
      filePath,
      status,
      duration,
      retries,
      startTime,
      endTime,
      tags: test.tags,
    };

    // Add error information if test failed
    if (test.error) {
      testResult.error = this.extractFailureDetails(test);
    }

    // Check if test was healed
    const healingInfo = this.findHealingInfo(test.title, filePath);
    if (healingInfo) {
      testResult.status = TestStatus.HEALED;
      testResult.healingInfo = healingInfo;
    }

    return testResult;
  }

  /**
   * Map Playwright status to TestStatus
   * @param status - Playwright status
   * @returns TestStatus
   */
  private mapPlaywrightStatus(status: string): TestStatus {
    switch (status) {
      case 'passed':
        return TestStatus.PASSED;
      case 'failed':
        return TestStatus.FAILED;
      case 'skipped':
        return TestStatus.SKIPPED;
      case 'timedOut':
        return TestStatus.TIMEOUT;
      default:
        return TestStatus.ERROR;
    }
  }

  /**
   * Extract failure details from a failed test
   * @param test - Playwright test
   * @returns Test failure details
   */
  extractFailureDetails(test: PlaywrightTest): TestFailure {
    const error = test.error;
    if (!error) {
      throw new Error('Cannot extract failure details from test without error');
    }

    const failureType = this.inferFailureType(error.message);
    const retryable = this.isRetryable(failureType);

    const failure: TestFailure = {
      message: error.message,
      stack: this.config.includeStackTraces ? error.stack : undefined,
      type: failureType,
      retryable,
    };

    // Add location if available
    if (test.location) {
      failure.location = {
        file: test.location.file,
        line: test.location.line,
        column: test.location.column,
      };
    }

    // Sanitize sensitive data if enabled
    if (this.config.sanitizeSensitiveData) {
      failure.message = this.sanitizeString(failure.message);
      if (failure.stack) {
        failure.stack = this.sanitizeString(failure.stack);
      }
    }

    return failure;
  }

  /**
   * Infer failure type from error message
   * @param message - Error message
   * @returns Failure type
   */
  private inferFailureType(message: string): FailureType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return FailureType.TIMEOUT;
    }
    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('connection')
    ) {
      return FailureType.NETWORK;
    }
    if (lowerMessage.includes('expect') || lowerMessage.includes('assert')) {
      return FailureType.ASSERTION;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return FailureType.VALIDATION;
    }
    if (
      lowerMessage.includes('setup') ||
      lowerMessage.includes('beforeall') ||
      lowerMessage.includes('beforeeach')
    ) {
      return FailureType.SETUP;
    }
    if (
      lowerMessage.includes('teardown') ||
      lowerMessage.includes('afterall') ||
      lowerMessage.includes('aftereach')
    ) {
      return FailureType.TEARDOWN;
    }

    return FailureType.UNKNOWN;
  }

  /**
   * Check if failure type is retryable
   * @param type - Failure type
   * @returns Whether failure is retryable
   */
  private isRetryable(type: FailureType): boolean {
    return [FailureType.TIMEOUT, FailureType.NETWORK].includes(type);
  }

  /**
   * Find healing information for a test
   * @param testName - Test name
   * @param filePath - Test file path
   * @returns Healing information if found
   */
  private findHealingInfo(testName: string, filePath: string): TestHealingInfo | undefined {
    const attempt = this.healingData.find(
      (a) => a.test.name === testName && a.test.filePath === filePath && a.success
    );

    if (!attempt) {
      return undefined;
    }

    return {
      strategy: attempt.strategy,
      attempts: 1,
      successful: attempt.success,
      changes: attempt.generatedFix ? [attempt.generatedFix] : [],
      originalError: attempt.test.errorMessage,
      healingDuration: attempt.duration || 0,
      tokensUsed: attempt.tokensUsed,
      cost: attempt.estimatedCost,
      cacheHit: attempt.cacheHit,
      timestamp: attempt.startTime.toISOString(),
    };
  }

  /**
   * Aggregate healing metrics from healing data
   * @returns Healing metrics
   */
  aggregateHealingMetrics(): HealingMetrics {
    if (this.healingMetrics) {
      // Use provided metrics summary
      return this.convertHealingMetricsSummary(this.healingMetrics);
    }

    // Calculate from healing data
    const totalAttempts = this.healingData.length;
    const successful = this.healingData.filter((a) => a.success).length;
    const failed = totalAttempts - successful;
    const successRate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0;

    const byFailureType: Record<FailureType, number> = {} as Record<FailureType, number>;
    const byStrategy: Record<HealingStrategy, number> = {} as Record<HealingStrategy, number>;

    for (const attempt of this.healingData) {
      const failureType = attempt.test.failureType;
      byFailureType[failureType] = (byFailureType[failureType] || 0) + 1;

      const strategy = attempt.strategy;
      byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
    }

    const aiUsed = this.healingData.filter(
      (a) => a.strategy === HealingStrategy.AI_POWERED || a.strategy === HealingStrategy.HYBRID
    ).length;
    const fallbackUsed = this.healingData.filter(
      (a) => a.strategy === HealingStrategy.FALLBACK || a.strategy === HealingStrategy.RULE_BASED
    ).length;

    const totalTokens = this.healingData.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
    const totalCost = this.healingData.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);

    const durations = this.healingData.map((a) => a.duration || 0).filter((d) => d > 0);
    const averageHealingTime =
      durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

    const cacheHits = this.healingData.filter((a) => a.cacheHit).length;
    const cacheHitRate = totalAttempts > 0 ? (cacheHits / totalAttempts) * 100 : 0;

    const topPatterns = this.extractHealingPatterns();

    // Estimate cache savings (assumed $0.01 per cached request)
    const cacheSavings = cacheHits * 0.01;

    return {
      totalAttempts,
      successful,
      failed,
      successRate,
      byFailureType,
      byStrategy,
      aiUsed,
      fallbackUsed,
      totalTokens,
      totalCost,
      averageHealingTime,
      cacheHitRate,
      topPatterns,
      cacheSavings,
    };
  }

  /**
   * Convert HealingMetricsSummary to HealingMetrics
   * @param summary - Healing metrics summary
   * @returns Healing metrics
   */
  private convertHealingMetricsSummary(summary: HealingMetricsSummary): HealingMetrics {
    const byFailureType: Record<FailureType, number> = {} as Record<FailureType, number>;
    for (const [type, metrics] of Object.entries(summary.byFailureType)) {
      byFailureType[type as FailureType] = metrics.attempts;
    }

    const byStrategy: Record<HealingStrategy, number> = {
      [HealingStrategy.AI_POWERED]: summary.aiStats.timesUsed,
      [HealingStrategy.FALLBACK]: summary.fallbackStats.timesUsed,
      [HealingStrategy.RULE_BASED]: summary.fallbackStats.timesUsed,
      [HealingStrategy.HYBRID]: 0,
    };

    return {
      totalAttempts: summary.totalAttempts,
      successful: summary.successful,
      failed: summary.failed,
      successRate: summary.successRate,
      byFailureType,
      byStrategy,
      aiUsed: summary.aiStats.timesUsed,
      fallbackUsed: summary.fallbackStats.timesUsed,
      totalTokens: summary.aiStats.totalTokens,
      totalCost: summary.totalCost,
      averageHealingTime: summary.averageTime,
      cacheHitRate: summary.aiStats.cacheHitRate * 100,
      topPatterns: [],
      cacheSavings: 0,
    };
  }

  /**
   * Extract top healing patterns
   * @returns Array of healing patterns
   */
  private extractHealingPatterns(): HealingPattern[] {
    const patterns = new Map<
      string,
      {
        count: number;
        successful: number;
        totalTime: number;
        failureType: FailureType;
      }
    >();

    for (const attempt of this.healingData) {
      const pattern = attempt.test.errorMessage.substring(0, 100);
      const existing = patterns.get(pattern) || {
        count: 0,
        successful: 0,
        totalTime: 0,
        failureType: attempt.test.failureType,
      };

      existing.count++;
      if (attempt.success) {
        existing.successful++;
      }
      existing.totalTime += attempt.duration || 0;

      patterns.set(pattern, existing);
    }

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        failureType: data.failureType,
        occurrences: data.count,
        successRate: data.count > 0 ? (data.successful / data.count) * 100 : 0,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0,
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);
  }

  /**
   * Calculate performance metrics from test results
   * @param results - Test results
   * @returns Performance metrics
   */
  calculatePerformanceMetrics(results: TestResult[]): PerformanceMetrics {
    if (results.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const durations = results.map((r) => r.duration);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    // Find slowest and fastest tests
    const sortedByDuration = [...results].sort((a, b) => b.duration - a.duration);
    const slowestTestData = sortedByDuration[0];
    const fastestTestData = sortedByDuration[sortedByDuration.length - 1];

    const slowestTest = {
      name: slowestTestData?.name || '',
      duration: slowestTestData?.duration || 0,
      filePath: slowestTestData?.filePath || '',
    };
    const fastestTest = {
      name: fastestTestData?.name || '',
      duration: fastestTestData?.duration || 0,
      filePath: fastestTestData?.filePath || '',
    };

    // Calculate duration by suite
    const durationBySuite: Record<string, number> = {};
    for (const result of results) {
      durationBySuite[result.suite] = (durationBySuite[result.suite] || 0) + result.duration;
    }

    // Calculate duration by file
    const durationByFile: Record<string, number> = {};
    for (const result of results) {
      durationByFile[result.filePath] = (durationByFile[result.filePath] || 0) + result.duration;
    }

    // Calculate response time metrics (for API tests)
    const responseTimes = results
      .filter((r) => r.response?.responseTime)
      .map((r) => r.response!.responseTime);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    // Calculate endpoint metrics
    const timeByEndpoint = this.calculateEndpointMetrics(results);

    // Calculate percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const percentiles = {
      p50: this.getPercentile(sortedDurations, 50),
      p75: this.getPercentile(sortedDurations, 75),
      p90: this.getPercentile(sortedDurations, 90),
      p95: this.getPercentile(sortedDurations, 95),
      p99: this.getPercentile(sortedDurations, 99),
    };

    // Find timeout violations
    const timeoutViolations = results.filter((r) => r.status === TestStatus.TIMEOUT).length;

    // Find slow tests
    const slowTests = results
      .filter((r) => r.duration > this.config.slowTestThreshold)
      .map((r) => ({
        name: r.name,
        duration: r.duration,
        threshold: this.config.slowTestThreshold,
      }))
      .sort((a, b) => b.duration - a.duration);

    return {
      averageDuration,
      averageResponseTime,
      slowestTest,
      fastestTest,
      durationBySuite,
      durationByFile,
      timeByEndpoint,
      percentiles,
      timeoutViolations,
      slowTests,
    };
  }

  /**
   * Get empty performance metrics
   * @returns Empty performance metrics
   */
  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      averageDuration: 0,
      averageResponseTime: 0,
      slowestTest: { name: '', duration: 0, filePath: '' },
      fastestTest: { name: '', duration: 0, filePath: '' },
      durationBySuite: {},
      durationByFile: {},
      timeByEndpoint: {},
      percentiles: { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
      timeoutViolations: 0,
      slowTests: [],
    };
  }

  /**
   * Calculate endpoint metrics
   * @param results - Test results
   * @returns Endpoint metrics by URL
   */
  private calculateEndpointMetrics(results: TestResult[]): Record<string, EndpointMetrics> {
    const endpointMap = new Map<
      string,
      {
        times: number[];
        statuses: number[];
        method: string;
      }
    >();

    for (const result of results) {
      if (result.request && result.response) {
        const key = `${result.request.method} ${this.normalizeUrl(result.request.url)}`;
        const existing = endpointMap.get(key) || {
          times: [],
          statuses: [],
          method: result.request.method,
        };

        existing.times.push(result.response.responseTime);
        existing.statuses.push(result.response.status);

        endpointMap.set(key, existing);
      }
    }

    const metrics: Record<string, EndpointMetrics> = {};
    for (const [endpoint, data] of endpointMap.entries()) {
      const times = data.times;
      const successCount = data.statuses.filter((s) => s >= 200 && s < 300).length;

      const statusCodes: Record<number, number> = {};
      for (const status of data.statuses) {
        statusCodes[status] = (statusCodes[status] || 0) + 1;
      }

      metrics[endpoint] = {
        endpoint,
        method: data.method,
        requests: times.length,
        averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        successRate: (successCount / times.length) * 100,
        statusCodes,
      };
    }

    return metrics;
  }

  /**
   * Normalize URL by removing dynamic segments
   * @param url - URL to normalize
   * @returns Normalized URL
   */
  private normalizeUrl(url: string): string {
    return url.replace(/\/\d+/g, '/:id').replace(/\?.*$/, '');
  }

  /**
   * Get percentile value from sorted array
   * @param sorted - Sorted array
   * @param percentile - Percentile (0-100)
   * @returns Percentile value
   */
  private getPercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Organize test results by test suite
   * @param results - Test results
   * @returns Test suites with results
   */
  organizeByTestSuite(results: TestResult[]): Record<string, TestSuiteResult> {
    const suites: Record<string, TestSuiteResult> = {};

    for (const result of results) {
      if (!suites[result.suite]) {
        suites[result.suite] = {
          name: result.suite,
          filePath: result.filePath,
          tests: [],
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            successRate: 0,
          },
          startTime: result.startTime,
          endTime: result.endTime,
        };
      }

      const suite = suites[result.suite]!;
      suite.tests.push(result);

      // Update suite summary
      suite.summary.total++;
      if (result.status === TestStatus.PASSED) suite.summary.passed++;
      if (result.status === TestStatus.FAILED) suite.summary.failed++;
      if (result.status === TestStatus.SKIPPED) suite.summary.skipped++;
      suite.summary.duration += result.duration;

      // Update suite time range
      if (new Date(result.startTime) < new Date(suite.startTime)) {
        suite.startTime = result.startTime;
      }
      if (new Date(result.endTime) > new Date(suite.endTime)) {
        suite.endTime = result.endTime;
      }
    }

    // Calculate success rates
    for (const suite of Object.values(suites)) {
      suite.summary.successRate =
        suite.summary.total > 0 ? (suite.summary.passed / suite.summary.total) * 100 : 0;
    }

    return suites;
  }

  /**
   * Enrich report with environment data
   * @returns Environment information
   */
  enrichWithEnvironmentData(): EnvironmentInfo {
    const ciInfo = this.detectCIEnvironment();
    const gitInfo = this.extractGitInfo();

    return {
      baseUrl: this.config.baseUrl || process.env.BASE_URL || 'http://localhost',
      environment: this.config.environment || process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      osInfo: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: os.totalmem(),
      },
      playwrightVersion: this.getPlaywrightVersion(),
      ci: ciInfo,
      git: gitInfo,
      envVars: this.collectSanitizedEnvVars(),
    };
  }

  /**
   * Detect CI environment
   * @returns CI information if running in CI
   */
  private detectCIEnvironment(): CIInfo | undefined {
    const isCI = process.env.CI === 'true' || Boolean(process.env.GITHUB_ACTIONS);
    if (!isCI) return undefined;

    const ci: CIInfo = {
      isCI: true,
    };

    // GitHub Actions
    if (process.env.GITHUB_ACTIONS) {
      ci.provider = 'GitHub Actions';
      ci.buildId = process.env.GITHUB_RUN_ID;
      ci.buildUrl = process.env.GITHUB_SERVER_URL
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined;
      ci.branch = process.env.GITHUB_REF_NAME;
      ci.commit = process.env.GITHUB_SHA;
      ci.pr =
        process.env.GITHUB_EVENT_NAME === 'pull_request'
          ? parseInt(process.env.GITHUB_REF?.split('/')[2] || '0', 10)
          : undefined;
    }

    return ci;
  }

  /**
   * Extract Git information
   * @returns Git information if available
   */
  private extractGitInfo(): GitInfo | undefined {
    // This would typically use a git library or exec
    // For now, return undefined as it requires additional dependencies
    return undefined;
  }

  /**
   * Get Playwright version
   * @returns Playwright version or undefined
   */
  private getPlaywrightVersion(): string | undefined {
    try {
      // Would need to read package.json to get actual version
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Collect sanitized environment variables
   * @returns Sanitized environment variables
   */
  private collectSanitizedEnvVars(): Record<string, string> {
    if (!this.config.includeEnvironment) {
      return {};
    }

    const safeEnvVars: Record<string, string> = {};
    const allowedPrefixes = ['NODE_', 'PLAYWRIGHT_', 'TEST_'];

    for (const [key, value] of Object.entries(process.env)) {
      if (value && allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
        safeEnvVars[key] = this.sanitizeString(value);
      }
    }

    return safeEnvVars;
  }

  /**
   * Sanitize string by removing sensitive data
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  private sanitizeString(str: string): string {
    if (!this.config.sanitizeSensitiveData) {
      return str;
    }

    let sanitized = str;
    for (const pattern of this.config.sensitivePatterns || []) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    return sanitized;
  }

  /**
   * Determine report severity based on results
   * @param summary - Test summary
   * @returns Report severity
   */
  private determineReportSeverity(
    summary: TestSummary,
    _healingMetrics: HealingMetrics
  ): ReportSeverity {
    if (summary.failed === 0 && summary.error === 0 && summary.timeout === 0) {
      return ReportSeverity.SUCCESS;
    }

    if (summary.successRate < 50) {
      return ReportSeverity.CRITICAL;
    }

    if (summary.successRate < 80 || summary.timeout > 0) {
      return ReportSeverity.ERROR;
    }

    return ReportSeverity.WARNING;
  }

  /**
   * Generate warnings based on report data
   * @param summary - Test summary
   * @param healing - Healing metrics
   * @param performance - Performance metrics
   * @returns Array of warnings
   */
  private generateWarnings(
    summary: TestSummary,
    healing: HealingMetrics,
    performance: PerformanceMetrics
  ): string[] {
    const warnings: string[] = [];

    if (summary.successRate < 80) {
      warnings.push(`Low success rate: ${summary.successRate.toFixed(1)}%`);
    }

    if (summary.timeout > 0) {
      warnings.push(`${summary.timeout} test(s) timed out`);
    }

    if (performance.slowTests.length > 0) {
      warnings.push(`${performance.slowTests.length} slow test(s) detected`);
    }

    if (healing.successRate < 50 && healing.totalAttempts > 0) {
      warnings.push(`Low healing success rate: ${healing.successRate.toFixed(1)}%`);
    }

    if (healing.totalCost > 1) {
      warnings.push(`High healing cost: $${healing.totalCost.toFixed(2)}`);
    }

    return warnings;
  }

  /**
   * Generate recommendations based on report data
   * @param summary - Test summary
   * @param healing - Healing metrics
   * @param performance - Performance metrics
   * @returns Array of recommendations
   */
  private generateRecommendations(
    summary: TestSummary,
    healing: HealingMetrics,
    performance: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (summary.failed > 0) {
      recommendations.push('Review and fix failing tests');
    }

    if (performance.slowTests.length > 0) {
      recommendations.push('Optimize slow tests to improve execution time');
    }

    if (healing.cacheHitRate < 50 && healing.totalAttempts > 10) {
      recommendations.push('Improve cache hit rate to reduce costs');
    }

    if (healing.aiUsed > healing.fallbackUsed && healing.successRate < 70) {
      recommendations.push('Consider tuning AI prompts or using rule-based healing');
    }

    if (summary.totalRetries > summary.total) {
      recommendations.push('High retry count indicates flaky tests');
    }

    return recommendations;
  }

  /**
   * Validate report data completeness and correctness
   * @param report - Test report to validate
   * @returns Validation result
   */
  validateReportData(report: TestReport): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!report.version) {
      errors.push('Report version is required');
    }
    if (!report.reportId) {
      errors.push('Report ID is required');
    }
    if (!report.generatedAt) {
      errors.push('Generation timestamp is required');
    }

    // Validate summary
    if (!report.summary) {
      errors.push('Report summary is required');
    } else {
      const sum = report.summary;
      const calculatedTotal =
        sum.passed + sum.failed + sum.skipped + sum.timeout + sum.error + sum.selfHealed;
      if (calculatedTotal !== sum.total) {
        errors.push(`Summary totals don't match: ${calculatedTotal} !== ${sum.total}`);
      }

      if (sum.successRate < 0 || sum.successRate > 100) {
        errors.push('Success rate must be between 0 and 100');
      }
    }

    // Validate tests
    if (!Array.isArray(report.tests)) {
      errors.push('Tests must be an array');
    } else if (report.tests.length === 0) {
      warnings.push('No tests in report');
    }

    // Validate environment
    if (!report.environment) {
      errors.push('Environment information is required');
    }

    // Validate healing metrics
    if (!report.selfHealing) {
      warnings.push('No healing metrics available');
    }

    // Validate performance metrics
    if (!report.performance) {
      errors.push('Performance metrics are required');
    }

    const valid = errors.length === 0;

    return {
      valid,
      errors,
      warnings,
    };
  }
}
