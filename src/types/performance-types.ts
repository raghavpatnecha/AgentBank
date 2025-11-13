/**
 * TypeScript type definitions for Performance Testing
 * Defines interfaces for load testing, stress testing, and performance metrics
 */

import type { TestCase } from './test-generator-types.js';

/**
 * Load pattern types for performance testing
 */
export type LoadPattern =
  | 'constant' // Constant number of users
  | 'ramp' // Gradual increase/decrease
  | 'spike' // Sudden load increases
  | 'wave' // Oscillating load pattern
  | 'step'; // Step-wise increases

/**
 * Performance test types
 */
export type PerformanceTestType =
  | 'load' // Simulate concurrent users
  | 'stress' // Find breaking points
  | 'spike' // Sudden load increases
  | 'endurance' // Sustained load over time
  | 'scalability' // Gradual increase to find limits
  | 'soak'; // Long duration stability test

/**
 * Performance test case extending base TestCase
 */
export interface PerformanceTestCase extends TestCase {
  type: 'performance';

  /** Performance-specific configuration */
  performance: PerformanceConfig;

  /** Performance assertions */
  assertions: PerformanceAssertion[];

  /** Think time between requests (ms) */
  thinkTime?: ThinkTimeConfig;

  /** Session/cookie management */
  session?: SessionConfig;
}

/**
 * Performance test configuration
 */
export interface PerformanceConfig {
  /** Type of performance test */
  testType: PerformanceTestType;

  /** Load pattern to use */
  loadPattern: LoadPattern;

  /** Number of virtual users */
  virtualUsers: number;

  /** Test duration in seconds */
  duration: number;

  /** Ramp-up time in seconds (for ramp/step patterns) */
  rampUpTime?: number;

  /** Ramp-down time in seconds */
  rampDownTime?: number;

  /** Target requests per second (optional limit) */
  targetRPS?: number;

  /** Maximum concurrent requests */
  maxConcurrency?: number;

  /** Iterations per user (alternative to duration) */
  iterations?: number;
}

/**
 * Load profile defining how users are ramped up
 */
export interface LoadProfile {
  /** Pattern type */
  pattern: LoadPattern;

  /** Stages for multi-phase tests */
  stages?: LoadStage[];

  /** Total duration across all stages (seconds) */
  totalDuration: number;

  /** Peak number of users */
  peakUsers: number;
}

/**
 * Load test stage
 */
export interface LoadStage {
  /** Stage name */
  name: string;

  /** Target number of users */
  targetUsers: number;

  /** Duration of this stage (seconds) */
  duration: number;

  /** Time to ramp to target users (seconds) */
  rampTime?: number;
}

/**
 * Performance assertion for SLA validation
 */
export interface PerformanceAssertion {
  /** Assertion name */
  name: string;

  /** Metric to check */
  metric: PerformanceMetricType;

  /** Comparison operator */
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

  /** Threshold value */
  threshold: number;

  /** Severity if assertion fails */
  severity: 'warning' | 'error' | 'critical';

  /** Optional scope (percentile, etc.) */
  scope?: string;
}

/**
 * Performance metric types
 */
export type PerformanceMetricType =
  | 'response_time' // Average response time
  | 'response_time_p50' // Median response time
  | 'response_time_p95' // 95th percentile
  | 'response_time_p99' // 99th percentile
  | 'throughput' // Requests per second
  | 'error_rate' // Percentage of errors
  | 'concurrent_users' // Active concurrent users
  | 'cpu_usage' // CPU utilization
  | 'memory_usage'; // Memory utilization

/**
 * Think time configuration (delay between requests)
 */
export interface ThinkTimeConfig {
  /** Minimum think time (ms) */
  min: number;

  /** Maximum think time (ms) */
  max: number;

  /** Distribution type */
  distribution: 'uniform' | 'normal' | 'exponential';

  /** Mean for normal distribution */
  mean?: number;

  /** Standard deviation for normal distribution */
  stdDev?: number;
}

/**
 * Session configuration for realistic scenarios
 */
export interface SessionConfig {
  /** Enable cookie handling */
  cookies: boolean;

  /** Enable session storage */
  sessionStorage: boolean;

  /** Session timeout (ms) */
  timeout?: number;

  /** Session initialization endpoint */
  initEndpoint?: string;

  /** Session cleanup endpoint */
  cleanupEndpoint?: string;
}

/**
 * Load test execution configuration
 */
export interface LoadTestConfig {
  /** Test cases to run */
  tests: PerformanceTestCase[];

  /** Base URL for API */
  baseURL: string;

  /** Global timeout (ms) */
  timeout?: number;

  /** Think time between requests */
  thinkTime?: ThinkTimeConfig;

  /** Enable resource tracking */
  trackResources?: boolean;

  /** Output directory for results */
  outputDir?: string;

  /** Comparison baseline file */
  baseline?: string;

  /** Tags to filter tests */
  tags?: string[];
}

/**
 * Performance metrics collected during test
 */
export interface PerformanceMetrics {
  /** Total requests made */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Error rate (0-1) */
  errorRate: number;

  /** Response time statistics */
  responseTime: ResponseTimeStats;

  /** Throughput (requests per second) */
  throughput: number;

  /** Concurrent users at peak */
  peakConcurrentUsers: number;

  /** Data transferred */
  dataTransferred: DataTransferStats;

  /** Resource utilization (if tracked) */
  resources?: ResourceStats;

  /** Assertion results */
  assertions: AssertionResult[];

  /** Time series data */
  timeSeries?: TimeSeriesData[];
}

/**
 * Response time statistics
 */
export interface ResponseTimeStats {
  /** Minimum response time (ms) */
  min: number;

  /** Maximum response time (ms) */
  max: number;

  /** Average/mean response time (ms) */
  mean: number;

  /** Median (p50) response time (ms) */
  median: number;

  /** 90th percentile (ms) */
  p90: number;

  /** 95th percentile (ms) */
  p95: number;

  /** 99th percentile (ms) */
  p99: number;

  /** Standard deviation */
  stdDev: number;
}

/**
 * Data transfer statistics
 */
export interface DataTransferStats {
  /** Total bytes sent */
  bytesSent: number;

  /** Total bytes received */
  bytesReceived: number;

  /** Average request size (bytes) */
  avgRequestSize: number;

  /** Average response size (bytes) */
  avgResponseSize: number;
}

/**
 * Resource utilization statistics
 */
export interface ResourceStats {
  /** CPU usage percentage */
  cpu: ResourceMetric;

  /** Memory usage (MB) */
  memory: ResourceMetric;

  /** Network I/O */
  network?: {
    inbound: number; // MB/s
    outbound: number; // MB/s
  };
}

/**
 * Resource metric with min/max/avg
 */
export interface ResourceMetric {
  min: number;
  max: number;
  avg: number;
}

/**
 * Performance assertion result
 */
export interface AssertionResult {
  /** Assertion name */
  name: string;

  /** Metric checked */
  metric: PerformanceMetricType;

  /** Actual value */
  actualValue: number;

  /** Threshold value */
  threshold: number;

  /** Whether assertion passed */
  passed: boolean;

  /** Severity */
  severity: 'warning' | 'error' | 'critical';

  /** Error message if failed */
  message?: string;
}

/**
 * Time series data point
 */
export interface TimeSeriesData {
  /** Timestamp */
  timestamp: number;

  /** Active users at this time */
  activeUsers: number;

  /** Requests per second */
  rps: number;

  /** Average response time (ms) */
  avgResponseTime: number;

  /** Error count */
  errors: number;

  /** Resource usage */
  resources?: {
    cpu: number;
    memory: number;
  };
}

/**
 * Performance report
 */
export interface PerformanceReport {
  /** Report version */
  version: string;

  /** Test configuration */
  config: LoadTestConfig;

  /** Test execution summary */
  summary: PerformanceSummary;

  /** Detailed metrics */
  metrics: PerformanceMetrics;

  /** Test results by endpoint */
  byEndpoint: Map<string, EndpointMetrics>;

  /** Baseline comparison (if available) */
  comparison?: BaselineComparison;

  /** Report generated timestamp */
  generatedAt: Date;

  /** Test duration (ms) */
  duration: number;
}

/**
 * Performance test summary
 */
export interface PerformanceSummary {
  /** Test start time */
  startTime: Date;

  /** Test end time */
  endTime: Date;

  /** Total duration (seconds) */
  duration: number;

  /** Total requests */
  totalRequests: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average throughput (RPS) */
  avgThroughput: number;

  /** Average response time (ms) */
  avgResponseTime: number;

  /** SLA compliance */
  slaCompliance: boolean;

  /** Failed assertions */
  failedAssertions: number;
}

/**
 * Per-endpoint performance metrics
 */
export interface EndpointMetrics {
  /** Endpoint path */
  endpoint: string;

  /** HTTP method */
  method: string;

  /** Request count */
  requestCount: number;

  /** Success count */
  successCount: number;

  /** Response time stats */
  responseTime: ResponseTimeStats;

  /** Throughput for this endpoint */
  throughput: number;

  /** Error rate */
  errorRate: number;
}

/**
 * Baseline comparison for trend analysis
 */
export interface BaselineComparison {
  /** Baseline file used */
  baselineFile: string;

  /** Baseline timestamp */
  baselineDate: Date;

  /** Comparison results */
  changes: MetricChange[];

  /** Overall regression detected */
  hasRegression: boolean;

  /** Improvement detected */
  hasImprovement: boolean;
}

/**
 * Metric change from baseline
 */
export interface MetricChange {
  /** Metric name */
  metric: string;

  /** Baseline value */
  baselineValue: number;

  /** Current value */
  currentValue: number;

  /** Percentage change */
  percentChange: number;

  /** Change direction */
  direction: 'improved' | 'regressed' | 'stable';

  /** Is significant */
  significant: boolean;
}

/**
 * Virtual user state
 */
export interface VirtualUser {
  /** User ID */
  id: number;

  /** Current state */
  state: 'idle' | 'active' | 'thinking' | 'completed' | 'error';

  /** Requests completed */
  requestsCompleted: number;

  /** Errors encountered */
  errors: number;

  /** Session data */
  session?: {
    cookies: Record<string, string>;
    tokens: Record<string, string>;
  };

  /** Start time */
  startTime: number;

  /** Last request time */
  lastRequestTime?: number;
}

/**
 * Load test result for a single request
 */
export interface LoadTestResult {
  /** Request ID */
  requestId: string;

  /** Virtual user ID */
  userId: number;

  /** Endpoint */
  endpoint: string;

  /** HTTP method */
  method: string;

  /** Start timestamp */
  startTime: number;

  /** End timestamp */
  endTime: number;

  /** Duration (ms) */
  duration: number;

  /** HTTP status code */
  statusCode: number;

  /** Success flag */
  success: boolean;

  /** Error details */
  error?: {
    message: string;
    type: string;
  };

  /** Request size (bytes) */
  requestSize: number;

  /** Response size (bytes) */
  responseSize: number;
}

/**
 * Performance test generator options
 */
export interface PerformanceGeneratorOptions {
  /** Default number of virtual users */
  defaultUsers?: number;

  /** Default test duration (seconds) */
  defaultDuration?: number;

  /** Default think time config */
  defaultThinkTime?: ThinkTimeConfig;

  /** Performance assertions to add */
  defaultAssertions?: PerformanceAssertion[];

  /** Enable session management */
  enableSessions?: boolean;

  /** Generate multiple scenarios per endpoint */
  generateMultipleScenarios?: boolean;
}

/**
 * Export format options for performance reports
 */
export type PerformanceReportFormat =
  | 'json' // JSON format
  | 'html' // HTML report with charts
  | 'csv' // CSV for spreadsheet analysis
  | 'jmeter' // JMeter XML format
  | 'markdown'; // Markdown summary

/**
 * Report export options
 */
export interface ReportExportOptions {
  /** Output format */
  format: PerformanceReportFormat;

  /** Output file path */
  outputPath: string;

  /** Include charts (for HTML) */
  includeCharts?: boolean;

  /** Include time series data */
  includeTimeSeries?: boolean;

  /** Include baseline comparison */
  includeComparison?: boolean;
}
