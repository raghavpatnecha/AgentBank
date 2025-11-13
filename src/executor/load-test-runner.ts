/**
 * Load Test Runner
 * Executes performance tests with virtual users and load patterns
 */

import type {
  PerformanceTestCase,
  LoadTestConfig,
  PerformanceMetrics,
  ResponseTimeStats,
  LoadTestResult,
  VirtualUser,
  LoadProfile,
  ThinkTimeConfig,
  PerformanceAssertion,
  AssertionResult,
  TimeSeriesData,
  DataTransferStats,
  ResourceStats,
} from '../types/performance-types.js';

/**
 * Load Test Runner
 * Simulates concurrent users and measures performance metrics
 */
export class LoadTestRunner {
  private config: LoadTestConfig;
  private virtualUsers: Map<number, VirtualUser>;
  private results: LoadTestResult[];
  private startTime: number;
  private activeRequests: number;
  private stopRequested: boolean;

  constructor(config: LoadTestConfig) {
    this.config = {
      timeout: 30000,
      trackResources: true,
      ...config,
    };
    this.virtualUsers = new Map();
    this.results = [];
    this.activeRequests = 0;
    this.stopRequested = false;
    this.startTime = 0;
  }

  /**
   * Execute load tests
   */
  async executeTests(): Promise<PerformanceMetrics> {
    console.log(`🚀 Starting load test with ${this.config.tests.length} test(s)`);

    this.startTime = Date.now();
    const timeSeriesData: TimeSeriesData[] = [];
    const resourceCollector = this.config.trackResources
      ? this.startResourceTracking(timeSeriesData)
      : null;

    try {
      // Run all performance tests
      for (const test of this.config.tests) {
        await this.executePerformanceTest(test, timeSeriesData);
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(timeSeriesData);

      return metrics;
    } finally {
      // Stop resource tracking
      if (resourceCollector) {
        clearInterval(resourceCollector);
      }
    }
  }

  /**
   * Execute a single performance test
   */
  private async executePerformanceTest(
    test: PerformanceTestCase,
    timeSeriesData: TimeSeriesData[]
  ): Promise<void> {
    console.log(`\n📊 Running: ${test.name}`);
    console.log(`   Users: ${test.performance.virtualUsers}, Duration: ${test.performance.duration}s`);

    const startTime = Date.now();
    const endTime = startTime + test.performance.duration * 1000;

    // Initialize virtual users
    this.initializeVirtualUsers(test);

    // Generate load profile
    const loadProfile = this.generateLoadProfile(test);

    // Execute based on load pattern
    await this.executeWithLoadPattern(test, loadProfile, endTime, timeSeriesData);

    // Wait for all requests to complete
    await this.waitForCompletion();

    const duration = Date.now() - startTime;
    console.log(`   ✓ Completed in ${(duration / 1000).toFixed(1)}s`);
  }

  /**
   * Initialize virtual users
   */
  private initializeVirtualUsers(test: PerformanceTestCase): void {
    this.virtualUsers.clear();

    for (let i = 0; i < test.performance.virtualUsers; i++) {
      this.virtualUsers.set(i, {
        id: i,
        state: 'idle',
        requestsCompleted: 0,
        errors: 0,
        startTime: Date.now(),
      });
    }
  }

  /**
   * Generate load profile
   */
  private generateLoadProfile(test: PerformanceTestCase): LoadProfile {
    const { loadPattern, virtualUsers, duration } = test.performance;

    return {
      pattern: loadPattern,
      totalDuration: duration,
      peakUsers: virtualUsers,
      stages: this.createStages(loadPattern, virtualUsers, duration),
    };
  }

  /**
   * Create load stages
   */
  private createStages(pattern: string, users: number, duration: number): any[] {
    switch (pattern) {
      case 'ramp':
        return [
          { name: 'Ramp Up', targetUsers: users, duration: duration * 0.3, rampTime: duration * 0.3 },
          { name: 'Sustain', targetUsers: users, duration: duration * 0.4 },
          { name: 'Ramp Down', targetUsers: 0, duration: duration * 0.3, rampTime: duration * 0.3 },
        ];

      case 'spike':
        return [
          { name: 'Baseline', targetUsers: Math.ceil(users * 0.1), duration: duration * 0.3 },
          { name: 'Spike', targetUsers: users, duration: duration * 0.4, rampTime: 5 },
          { name: 'Recovery', targetUsers: 0, duration: duration * 0.3, rampTime: duration * 0.2 },
        ];

      case 'constant':
      default:
        return [{ name: 'Constant', targetUsers: users, duration }];
    }
  }

  /**
   * Execute with load pattern
   */
  private async executeWithLoadPattern(
    test: PerformanceTestCase,
    profile: LoadProfile,
    endTime: number,
    timeSeriesData: TimeSeriesData[]
  ): Promise<void> {
    const stages = profile.stages || [];

    for (const stage of stages) {
      if (this.stopRequested || Date.now() >= endTime) {
        break;
      }

      await this.executeStage(test, stage, timeSeriesData);
    }
  }

  /**
   * Execute a load stage
   */
  private async executeStage(
    test: PerformanceTestCase,
    stage: any,
    timeSeriesData: TimeSeriesData[]
  ): Promise<void> {
    const stageStartTime = Date.now();
    const stageEndTime = stageStartTime + stage.duration * 1000;
    const rampTime = (stage.rampTime || 0) * 1000;

    console.log(`   📈 ${stage.name}: ${stage.targetUsers} users`);

    while (Date.now() < stageEndTime && !this.stopRequested) {
      const elapsed = Date.now() - stageStartTime;
      const currentUsers = this.calculateCurrentUsers(stage, elapsed, rampTime);

      // Execute requests for current users
      const promises: Promise<void>[] = [];
      for (let i = 0; i < currentUsers; i++) {
        if (this.virtualUsers.get(i)?.state === 'idle' ||
            this.virtualUsers.get(i)?.state === 'thinking') {
          promises.push(this.executeUserRequest(test, i));
        }
      }

      // Wait a bit before next iteration
      await Promise.race([
        Promise.all(promises),
        this.sleep(100), // Sample every 100ms
      ]);

      // Collect time series data every second
      if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - 100) / 1000)) {
        timeSeriesData.push(this.captureTimeSeriesData());
      }
    }
  }

  /**
   * Calculate current number of users based on ramp
   */
  private calculateCurrentUsers(stage: any, elapsed: number, rampTime: number): number {
    if (!rampTime || rampTime === 0) {
      return stage.targetUsers;
    }

    const progress = Math.min(elapsed / rampTime, 1);
    const previousUsers = 0; // Simplified - could track previous stage
    return Math.floor(previousUsers + (stage.targetUsers - previousUsers) * progress);
  }

  /**
   * Execute a request for a virtual user
   */
  private async executeUserRequest(test: PerformanceTestCase, userId: number): Promise<void> {
    const user = this.virtualUsers.get(userId);
    if (!user) return;

    user.state = 'active';
    this.activeRequests++;

    const requestId = `${userId}-${user.requestsCompleted}`;
    const startTime = Date.now();

    try {
      // Simulate HTTP request
      const result = await this.makeRequest(test, userId, requestId);
      this.results.push(result);

      user.requestsCompleted++;
      user.lastRequestTime = Date.now();

      if (!result.success) {
        user.errors++;
      }
    } catch (error) {
      // Record error
      this.results.push({
        requestId,
        userId,
        endpoint: test.endpoint,
        method: test.method,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        statusCode: 0,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'network',
        },
        requestSize: 0,
        responseSize: 0,
      });
      user.errors++;
    } finally {
      this.activeRequests--;

      // Think time
      if (test.thinkTime) {
        user.state = 'thinking';
        const thinkTime = this.calculateThinkTime(test.thinkTime);
        await this.sleep(thinkTime);
      }

      user.state = 'idle';
    }
  }

  /**
   * Make HTTP request (simulated)
   */
  private async makeRequest(
    test: PerformanceTestCase,
    userId: number,
    requestId: string
  ): Promise<LoadTestResult> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would use fetch or a HTTP client
      // For now, we'll simulate the request
      const duration = Math.floor(Math.random() * 500) + 50; // 50-550ms
      await this.sleep(duration);

      const success = Math.random() > 0.05; // 95% success rate
      const statusCode = success ? 200 : 500;

      return {
        requestId,
        userId,
        endpoint: test.endpoint,
        method: test.method,
        startTime,
        endTime: Date.now(),
        duration,
        statusCode,
        success,
        requestSize: 1024,
        responseSize: 2048,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate think time
   */
  private calculateThinkTime(config: ThinkTimeConfig): number {
    switch (config.distribution) {
      case 'uniform':
        return Math.floor(Math.random() * (config.max - config.min)) + config.min;

      case 'normal':
        const mean = config.mean || (config.min + config.max) / 2;
        const stdDev = config.stdDev || (config.max - config.min) / 6;
        return Math.max(
          config.min,
          Math.min(config.max, this.normalRandom(mean, stdDev))
        );

      case 'exponential':
        const lambda = 1 / ((config.min + config.max) / 2);
        return Math.min(config.max, -Math.log(1 - Math.random()) / lambda);

      default:
        return config.min;
    }
  }

  /**
   * Generate normal random number
   */
  private normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Wait for all active requests to complete
   */
  private async waitForCompletion(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const startWait = Date.now();

    while (this.activeRequests > 0 && Date.now() - startWait < maxWait) {
      await this.sleep(100);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Capture time series data point
   */
  private captureTimeSeriesData(): TimeSeriesData {
    const now = Date.now();
    const windowStart = now - 1000; // Last 1 second

    const recentResults = this.results.filter((r) => r.startTime >= windowStart);
    const rps = recentResults.length;
    const errors = recentResults.filter((r) => !r.success).length;
    const avgResponseTime =
      recentResults.length > 0
        ? recentResults.reduce((sum, r) => sum + r.duration, 0) / recentResults.length
        : 0;

    const activeUsers = Array.from(this.virtualUsers.values()).filter(
      (u) => u.state === 'active' || u.state === 'thinking'
    ).length;

    return {
      timestamp: now,
      activeUsers,
      rps,
      avgResponseTime,
      errors,
    };
  }

  /**
   * Start resource tracking
   */
  private startResourceTracking(timeSeriesData: TimeSeriesData[]): NodeJS.Timeout {
    return setInterval(() => {
      // In a real implementation, this would track actual CPU/memory
      // For now, we'll simulate it
      const lastData = timeSeriesData[timeSeriesData.length - 1];
      if (lastData && !lastData.resources) {
        lastData.resources = {
          cpu: Math.random() * 100,
          memory: Math.random() * 1000,
        };
      }
    }, 1000);
  }

  /**
   * Calculate final metrics
   */
  private calculateMetrics(timeSeriesData: TimeSeriesData[]): PerformanceMetrics {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    const responseTime = this.calculateResponseTimeStats();
    const duration = (Date.now() - this.startTime) / 1000;
    const throughput = totalRequests / duration;

    const dataTransferred = this.calculateDataTransferred();
    const resources = this.calculateResourceStats(timeSeriesData);
    const assertions = this.evaluateAssertions();

    const peakConcurrentUsers = Math.max(
      ...timeSeriesData.map((d) => d.activeUsers),
      0
    );

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate,
      responseTime,
      throughput,
      peakConcurrentUsers,
      dataTransferred,
      resources,
      assertions,
      timeSeries: timeSeriesData,
    };
  }

  /**
   * Calculate response time statistics
   */
  private calculateResponseTimeStats(): ResponseTimeStats {
    if (this.results.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      };
    }

    const durations = this.results.map((r) => r.duration).sort((a, b) => a - b);
    const count = durations.length;

    const min = durations[0] || 0;
    const max = durations[count - 1] || 0;
    const mean = durations.reduce((sum, d) => sum + d, 0) / count;
    const median = durations[Math.floor(count / 2)] || 0;
    const p90 = durations[Math.floor(count * 0.9)] || 0;
    const p95 = durations[Math.floor(count * 0.95)] || 0;
    const p99 = durations[Math.floor(count * 0.99)] || 0;

    // Calculate standard deviation
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    return { min, max, mean, median, p90, p95, p99, stdDev };
  }

  /**
   * Calculate data transferred
   */
  private calculateDataTransferred(): DataTransferStats {
    const totalBytesSent = this.results.reduce((sum, r) => sum + r.requestSize, 0);
    const totalBytesReceived = this.results.reduce((sum, r) => sum + r.responseSize, 0);
    const count = this.results.length || 1;

    return {
      bytesSent: totalBytesSent,
      bytesReceived: totalBytesReceived,
      avgRequestSize: totalBytesSent / count,
      avgResponseSize: totalBytesReceived / count,
    };
  }

  /**
   * Calculate resource statistics
   */
  private calculateResourceStats(timeSeriesData: TimeSeriesData[]): ResourceStats | undefined {
    if (!this.config.trackResources) {
      return undefined;
    }

    const cpuValues = timeSeriesData
      .filter((d) => d.resources?.cpu)
      .map((d) => d.resources!.cpu);

    const memoryValues = timeSeriesData
      .filter((d) => d.resources?.memory)
      .map((d) => d.resources!.memory);

    if (cpuValues.length === 0 || memoryValues.length === 0) {
      return undefined;
    }

    return {
      cpu: {
        min: Math.min(...cpuValues),
        max: Math.max(...cpuValues),
        avg: cpuValues.reduce((sum, v) => sum + v, 0) / cpuValues.length,
      },
      memory: {
        min: Math.min(...memoryValues),
        max: Math.max(...memoryValues),
        avg: memoryValues.reduce((sum, v) => sum + v, 0) / memoryValues.length,
      },
    };
  }

  /**
   * Evaluate performance assertions
   */
  private evaluateAssertions(): AssertionResult[] {
    const results: AssertionResult[] = [];
    const responseTime = this.calculateResponseTimeStats();
    const errorRate = this.results.length > 0
      ? this.results.filter((r) => !r.success).length / this.results.length
      : 0;
    const duration = (Date.now() - this.startTime) / 1000;
    const throughput = this.results.length / duration;

    // Collect all assertions from tests
    const allAssertions: PerformanceAssertion[] = [];
    for (const test of this.config.tests) {
      allAssertions.push(...test.assertions);
    }

    // Evaluate each assertion
    for (const assertion of allAssertions) {
      const actualValue = this.getMetricValue(
        assertion.metric,
        responseTime,
        errorRate,
        throughput
      );

      const passed = this.evaluateAssertion(
        actualValue,
        assertion.operator,
        assertion.threshold
      );

      results.push({
        name: assertion.name,
        metric: assertion.metric,
        actualValue,
        threshold: assertion.threshold,
        passed,
        severity: assertion.severity,
        message: passed
          ? undefined
          : `${assertion.name} failed: ${actualValue} ${assertion.operator} ${assertion.threshold}`,
      });
    }

    return results;
  }

  /**
   * Get metric value
   */
  private getMetricValue(
    metric: string,
    responseTime: ResponseTimeStats,
    errorRate: number,
    throughput: number
  ): number {
    switch (metric) {
      case 'response_time':
        return responseTime.mean;
      case 'response_time_p50':
        return responseTime.median;
      case 'response_time_p95':
        return responseTime.p95;
      case 'response_time_p99':
        return responseTime.p99;
      case 'throughput':
        return throughput;
      case 'error_rate':
        return errorRate;
      default:
        return 0;
    }
  }

  /**
   * Evaluate assertion
   */
  private evaluateAssertion(
    actualValue: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'lt':
        return actualValue < threshold;
      case 'lte':
        return actualValue <= threshold;
      case 'gt':
        return actualValue > threshold;
      case 'gte':
        return actualValue >= threshold;
      case 'eq':
        return actualValue === threshold;
      default:
        return false;
    }
  }

  /**
   * Stop the test execution
   */
  stop(): void {
    this.stopRequested = true;
  }
}
