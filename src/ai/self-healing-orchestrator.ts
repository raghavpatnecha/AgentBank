/**
 * Self-Healing Orchestrator (Feature 4, Task 4.6)
 * Coordinates the complete self-healing process from detection to retry
 */

import { promises as fs } from 'fs';
import type {
  HealingComponents,
  HealingReport,
  HealingResult,
  HealingAttempt,
  HealingStatistics,
  FailedTest,
  FailureAnalysis,
  FailureType,
  SelfHealingConfig,
  SpecChange,
} from '../types/ai-types.js';
import type { TestResult, TestStatus } from '../types/executor-types.js';

/**
 * Default self-healing configuration
 */
const DEFAULT_CONFIG: SelfHealingConfig = {
  maxAttemptsPerTest: 2,
  maxTotalTime: 300000, // 5 minutes
  minConfidence: 0.6,
  healableFailureTypes: [
    'field_missing' as FailureType,
    'type_mismatch' as FailureType,
    'status_code_changed' as FailureType,
    'endpoint_not_found' as FailureType,
    'schema_validation' as FailureType,
  ],
  autoRetry: true,
  backupOriginal: true,
  aiConfig: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    timeout: 30000,
    maxRetries: 3,
  },
};

/**
 * Self-Healing Orchestrator - Coordinates complete healing workflow
 */
export class SelfHealingOrchestrator {
  private config: SelfHealingConfig;
  private healingAttempts: Map<string, HealingAttempt[]>;
  private totalTimeSpent: number;

  constructor(
    private components: HealingComponents,
    config?: Partial<SelfHealingConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.healingAttempts = new Map();
    this.totalTimeSpent = 0;
  }

  /**
   * Heal failed tests
   */
  async healFailedTests(testResults: TestResult[]): Promise<HealingReport> {
    this.totalTimeSpent = 0;

    const failedTests = await this.detectFailedTests(testResults);
    const healingResults: HealingResult[] = [];
    const allAttempts: HealingAttempt[] = [];

    for (const failedTest of failedTests) {
      // Check time limit
      if (this.totalTimeSpent >= this.config.maxTotalTime) {
        console.warn(`Healing timeout: ${this.totalTimeSpent}ms >= ${this.config.maxTotalTime}ms`);
        break;
      }

      // Check attempt limit
      if (!this.limitHealingAttempts(failedTest)) {
        healingResults.push({
          testId: failedTest.result.id,
          attempted: false,
          success: false,
          reason: `Exceeded maximum attempts (${this.config.maxAttemptsPerTest})`,
          duration: 0,
        });
        continue;
      }

      const attemptStartTime = Date.now();

      try {
        // Analyze failure
        const analysis = await this.analyzeFailure(failedTest);

        // Check if healable
        if (!this.isHealable(analysis)) {
          healingResults.push({
            testId: failedTest.result.id,
            attempted: false,
            success: false,
            reason: `Non-healable failure type: ${analysis.failureType}`,
            duration: Date.now() - attemptStartTime,
          });
          continue;
        }

        // Attempt healing
        const healingResult = await this.attemptHealing(failedTest, analysis);
        healingResults.push(healingResult);

        // Track attempt
        const attempt: HealingAttempt = {
          attemptNumber: failedTest.healingAttempts + 1,
          testId: failedTest.result.id,
          timestamp: new Date(),
          regenerationResult: healingResult.regenerationResult!,
          success: healingResult.success,
          testResultAfterHealing: healingResult.retryResult,
        };

        allAttempts.push(attempt);
        this.trackHealingSuccess(failedTest, healingResult);

        // Update time spent
        const duration = Date.now() - attemptStartTime;
        this.totalTimeSpent += duration;
      } catch (error) {
        const duration = Date.now() - attemptStartTime;
        this.totalTimeSpent += duration;

        healingResults.push({
          testId: failedTest.result.id,
          attempted: true,
          success: false,
          reason: error instanceof Error ? error.message : String(error),
          duration,
        });
      }
    }

    return this.generateHealingReport(testResults, failedTests, healingResults, allAttempts);
  }

  /**
   * Detect failed tests from results
   */
  async detectFailedTests(results: TestResult[]): Promise<FailedTest[]> {
    const failedTests: FailedTest[] = [];

    for (const result of results) {
      if (result.status === ('failed' as TestStatus) || result.status === ('error' as TestStatus)) {
        // Read test file to get code
        let testCode = '';
        try {
          testCode = await fs.readFile(result.filePath, 'utf-8');
        } catch (error) {
          console.warn(`Could not read test file: ${result.filePath}`);
          testCode = '// Test code not available';
        }

        failedTests.push({
          result,
          testCode,
          healingAttempts: 0,
          previousAttempts: [],
        });
      }
    }

    return failedTests;
  }

  /**
   * Analyze test failure
   */
  async analyzeFailure(test: FailedTest): Promise<FailureAnalysis> {
    // Get spec changes (if detector is available)
    let specChanges: SpecChange[] = [];
    if (this.components.specChangeDetector) {
      try {
        // In a real implementation, we'd have old and new specs
        // For now, we'll use empty array
        specChanges = [];
      } catch (error) {
        console.warn('Could not detect spec changes:', error);
      }
    }

    // Analyze failure
    return await this.components.failureAnalyzer.analyze(test.result, specChanges);
  }

  /**
   * Attempt to heal a failed test
   */
  async attemptHealing(test: FailedTest, analysis: FailureAnalysis): Promise<HealingResult> {
    const startTime = Date.now();

    try {
      // Build regeneration context
      const context = {
        testFilePath: test.result.filePath,
        testName: test.result.name,
        failureAnalysis: analysis,
        currentSpec: {}, // Would come from OpenAPI spec in real implementation
        originalTestCode: test.testCode,
        specChanges: analysis.relatedChanges,
      };

      // Regenerate test
      const regenerationResult = await this.components.testRegenerator.regenerateTest(context);

      if (!regenerationResult.success) {
        return {
          testId: test.result.id,
          attempted: true,
          success: false,
          regenerationResult,
          reason: regenerationResult.error?.message || 'Regeneration failed',
          duration: Date.now() - startTime,
        };
      }

      // Retry test if auto-retry is enabled
      let retryResult: TestResult | undefined;
      if (this.config.autoRetry && regenerationResult.savedPath) {
        try {
          retryResult = await this.retryTest(test);
        } catch (error) {
          console.warn('Test retry failed:', error);
        }
      }

      return {
        testId: test.result.id,
        attempted: true,
        success: retryResult ? retryResult.status === ('passed' as TestStatus) : false,
        regenerationResult,
        retryResult,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testId: test.result.id,
        attempted: true,
        success: false,
        reason: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Retry a test after healing
   */
  async retryTest(test: FailedTest): Promise<TestResult> {
    if (!this.components.testRunner) {
      throw new Error('Test runner not available for retry');
    }

    return await this.components.testRunner.runTest(test.result.filePath, test.result.name);
  }

  /**
   * Check if failure is healable
   */
  isHealable(failure: FailureAnalysis): boolean {
    // Check if failure type is in healable list
    if (!this.config.healableFailureTypes.includes(failure.failureType)) {
      return false;
    }

    // Check confidence threshold
    if (failure.confidence < this.config.minConfidence) {
      return false;
    }

    // Check if explicitly marked as healable
    return failure.healable;
  }

  /**
   * Check if test has exceeded healing attempt limits
   */
  limitHealingAttempts(test: FailedTest): boolean {
    const attempts = this.healingAttempts.get(test.result.id) || [];
    return attempts.length < this.config.maxAttemptsPerTest;
  }

  /**
   * Track healing success/failure
   */
  trackHealingSuccess(test: FailedTest, result: HealingResult): void {
    const attempts = this.healingAttempts.get(test.result.id) || [];

    if (result.regenerationResult) {
      attempts.push({
        attemptNumber: attempts.length + 1,
        testId: test.result.id,
        timestamp: new Date(),
        regenerationResult: result.regenerationResult,
        success: result.success,
        testResultAfterHealing: result.retryResult,
      });

      this.healingAttempts.set(test.result.id, attempts);
    }
  }

  /**
   * Generate healing report
   */
  generateHealingReport(
    allResults: TestResult[],
    failedTests: FailedTest[],
    healingResults: HealingResult[],
    attempts: HealingAttempt[]
  ): HealingReport {
    const successfullyHealed = healingResults.filter((r) => r.success).length;
    const failedHealing = healingResults.filter((r) => r.attempted && !r.success).length;
    const nonHealable = healingResults.filter((r) => !r.attempted).length;
    const healingAttempts = healingResults.filter((r) => r.attempted).length;

    // Calculate statistics
    const statistics = this.calculateStatistics(healingResults, attempts);

    return {
      totalTests: allResults.length,
      failedTests: failedTests.length,
      healingAttempts,
      successfullyHealed,
      failedHealing,
      nonHealable,
      totalTime: this.totalTimeSpent,
      attempts,
      statistics,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate healing statistics
   */
  private calculateStatistics(
    results: HealingResult[],
    attempts: HealingAttempt[]
  ): HealingStatistics {
    const attempted = results.filter((r) => r.attempted);
    const successful = results.filter((r) => r.success);

    const successRate = attempted.length > 0 ? successful.length / attempted.length : 0;

    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    const averageHealingTime = attempted.length > 0 ? totalTime / attempted.length : 0;

    const byFailureType: Record<string, number> = {};
    const failureTypeCounts = new Map<FailureType, number>();

    for (const _attempt of attempts) {
      // Extract failure type from attempt (would be in metadata in real implementation)
      // For now, we'll use a placeholder
      const failureType = 'unknown' as FailureType;
      const count = failureTypeCounts.get(failureType) || 0;
      failureTypeCounts.set(failureType, count + 1);
      byFailureType[failureType] = count + 1;
    }

    const topFailureTypes = Array.from(failureTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalTokensUsed = attempts.reduce(
      (sum, a) => sum + (a.regenerationResult.tokensUsed || 0),
      0
    );

    const avgConfidence =
      attempts.length > 0
        ? attempts.reduce((sum, a) => {
            // Get confidence from regeneration result if available
            const confidence = a.regenerationResult.validation?.valid ? 0.9 : 0.5;
            return sum + confidence;
          }, 0) / attempts.length
        : 0;

    return {
      successRate,
      averageHealingTime,
      byFailureType: byFailureType as Record<FailureType, number>,
      topFailureTypes,
      totalTokensUsed,
      averageConfidence: avgConfidence,
    };
  }

  /**
   * Get healing attempts for a specific test
   */
  getHealingAttempts(testId: string): HealingAttempt[] {
    return this.healingAttempts.get(testId) || [];
  }

  /**
   * Clear healing history
   */
  clearHistory(): void {
    this.healingAttempts.clear();
    this.totalTimeSpent = 0;
  }

  /**
   * Get current configuration
   */
  getConfig(): SelfHealingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SelfHealingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get healing statistics summary
   */
  getSummary(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    totalTimeSpent: number;
    averageTime: number;
  } {
    let totalAttempts = 0;
    let successfulAttempts = 0;
    let failedAttempts = 0;

    for (const attempts of this.healingAttempts.values()) {
      totalAttempts += attempts.length;
      successfulAttempts += attempts.filter((a) => a.success).length;
      failedAttempts += attempts.filter((a) => !a.success).length;
    }

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      totalTimeSpent: this.totalTimeSpent,
      averageTime: totalAttempts > 0 ? this.totalTimeSpent / totalAttempts : 0,
    };
  }
}

/**
 * Simple failure analyzer implementation
 */
export class SimpleFailureAnalyzer {
  async analyze(testResult: TestResult, _specChanges: SpecChange[] = []): Promise<FailureAnalysis> {
    const failureType = this.detectFailureType(testResult);
    const rootCause = this.identifyRootCause(testResult, failureType);
    const healable = this.isHealable(failureType);
    const confidence = this.calculateConfidence(testResult, failureType);
    const suggestedFix = this.suggestFix(failureType, _specChanges);

    return {
      testResult,
      failureType,
      rootCause,
      relatedChanges: _specChanges,
      healable,
      confidence,
      suggestedFix,
      analyzedAt: new Date(),
      metadata: {
        errorMessage: testResult.error?.message,
        errorType: testResult.error?.type,
      },
    };
  }

  private detectFailureType(testResult: TestResult): FailureType {
    const errorMessage = testResult.error?.message?.toLowerCase() || '';

    if (errorMessage.includes('field') && errorMessage.includes('missing')) {
      return 'field_missing' as FailureType;
    }
    if (errorMessage.includes('type') && errorMessage.includes('mismatch')) {
      return 'type_mismatch' as FailureType;
    }
    if (
      errorMessage.includes('status') ||
      errorMessage.includes('404') ||
      errorMessage.includes('500')
    ) {
      return 'status_code_changed' as FailureType;
    }
    if (errorMessage.includes('endpoint') || errorMessage.includes('not found')) {
      return 'endpoint_not_found' as FailureType;
    }
    if (errorMessage.includes('schema') || errorMessage.includes('validation')) {
      return 'schema_validation' as FailureType;
    }
    if (errorMessage.includes('timeout') || testResult.status === ('timeout' as TestStatus)) {
      return 'timeout' as FailureType;
    }
    if (errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
      return 'network_error' as FailureType;
    }

    return 'unknown' as FailureType;
  }

  private identifyRootCause(testResult: TestResult, failureType: FailureType): string {
    switch (failureType) {
      case 'field_missing' as FailureType:
        return 'API response is missing expected field';
      case 'type_mismatch' as FailureType:
        return 'Field type in API response does not match expected type';
      case 'status_code_changed' as FailureType:
        return 'API endpoint returned unexpected status code';
      case 'endpoint_not_found' as FailureType:
        return 'API endpoint not found or has been removed';
      case 'schema_validation' as FailureType:
        return 'Response does not match expected schema';
      case 'timeout' as FailureType:
        return 'Request timed out';
      case 'network_error' as FailureType:
        return 'Network connection failed';
      default:
        return testResult.error?.message || 'Unknown failure cause';
    }
  }

  private isHealable(failureType: FailureType): boolean {
    const healableTypes = [
      'field_missing' as FailureType,
      'type_mismatch' as FailureType,
      'status_code_changed' as FailureType,
      'endpoint_not_found' as FailureType,
      'schema_validation' as FailureType,
    ];
    return healableTypes.includes(failureType);
  }

  private calculateConfidence(_testResult: TestResult, failureType: FailureType): number {
    // High confidence for specific error types
    if (
      failureType === ('field_missing' as FailureType) ||
      failureType === ('type_mismatch' as FailureType)
    ) {
      return 0.9;
    }
    if (
      failureType === ('status_code_changed' as FailureType) ||
      failureType === ('schema_validation' as FailureType)
    ) {
      return 0.8;
    }
    if (failureType === ('endpoint_not_found' as FailureType)) {
      return 0.7;
    }
    // Low confidence for timeouts and network errors
    if (
      failureType === ('timeout' as FailureType) ||
      failureType === ('network_error' as FailureType)
    ) {
      return 0.3;
    }
    return 0.5;
  }

  private suggestFix(failureType: FailureType, _specChanges: SpecChange[]): string | undefined {
    switch (failureType) {
      case 'field_missing' as FailureType:
        return 'Update test to handle missing field or use new field name from spec';
      case 'type_mismatch' as FailureType:
        return 'Update type assertions to match new field type in spec';
      case 'status_code_changed' as FailureType:
        return 'Update expected status code to match API specification';
      case 'endpoint_not_found' as FailureType:
        return 'Update endpoint path to match new API specification';
      case 'schema_validation' as FailureType:
        return 'Update schema validation to match new API response structure';
      default:
        return undefined;
    }
  }
}
