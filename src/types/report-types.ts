/**
 * TypeScript type definitions for Reporting (Feature 6)
 * Defines interfaces for report data aggregation, formatting, and distribution
 */

import type { FailureType, HealingStrategy } from './self-healing-types.js';

/**
 * Report version for compatibility tracking
 */
export const REPORT_VERSION = '1.0.0';

/**
 * Report format types
 */
export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  JUNIT = 'junit',
  SLACK = 'slack',
  EMAIL = 'email',
}

/**
 * Test status for reports (extends executor status with healed)
 */
export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout',
  ERROR = 'error',
  HEALED = 'healed',
}

/**
 * Report severity levels
 */
export enum ReportSeverity {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Main test report structure
 */
export interface TestReport {
  /** Report version */
  version: string;

  /** Report generation timestamp */
  generatedAt: string;

  /** Unique report ID */
  reportId: string;

  /** Report summary */
  summary: TestSummary;

  /** Environment information */
  environment: EnvironmentInfo;

  /** All test results */
  tests: TestResult[];

  /** Self-healing metrics */
  selfHealing: HealingMetrics;

  /** Performance metrics */
  performance: PerformanceMetrics;

  /** Test suite organization */
  suites: Record<string, TestSuiteResult>;

  /** Coverage information (if available) */
  coverage?: CoverageInfo;

  /** Custom metadata */
  metadata?: Record<string, unknown>;

  /** Report severity */
  severity: ReportSeverity;

  /** Warnings and alerts */
  warnings: string[];

  /** Recommendations */
  recommendations: string[];
}

/**
 * Test summary statistics
 */
export interface TestSummary {
  /** Total number of tests */
  total: number;

  /** Number of passed tests */
  passed: number;

  /** Number of failed tests */
  failed: number;

  /** Number of skipped tests */
  skipped: number;

  /** Number of timed out tests */
  timeout: number;

  /** Number of error tests */
  error: number;

  /** Number of self-healed tests */
  selfHealed: number;

  /** Total duration in milliseconds */
  duration: number;

  /** Success rate as percentage (0-100) */
  successRate: number;

  /** Effective success rate including healed tests */
  effectiveSuccessRate: number;

  /** Average test duration in milliseconds */
  averageDuration: number;

  /** Fastest test duration */
  fastestTest: number;

  /** Slowest test duration */
  slowestTest: number;

  /** Total retries across all tests */
  totalRetries: number;

  /** Test execution start time */
  startTime: string;

  /** Test execution end time */
  endTime: string;
}

/**
 * Individual test result for reports
 */
export interface TestResult {
  /** Unique test identifier */
  id: string;

  /** Test name/title */
  name: string;

  /** Test suite name */
  suite: string;

  /** Test file path */
  filePath: string;

  /** Test status */
  status: TestStatus;

  /** Test duration in milliseconds */
  duration: number;

  /** Number of retry attempts */
  retries: number;

  /** Test error information (if failed) */
  error?: TestFailure;

  /** Test start timestamp */
  startTime: string;

  /** Test end timestamp */
  endTime: string;

  /** Test tags */
  tags?: string[];

  /** Request information (for API tests) */
  request?: RequestInfo;

  /** Response information (for API tests) */
  response?: ResponseInfo;

  /** Self-healing information (if healed) */
  healingInfo?: TestHealingInfo;

  /** Test metadata */
  metadata?: Record<string, unknown>;

  /** Test annotations */
  annotations?: TestAnnotation[];

  /** Screenshots/attachments */
  attachments?: TestAttachment[];
}

/**
 * Test failure details
 */
export interface TestFailure {
  /** Error message */
  message: string;

  /** Error stack trace */
  stack?: string;

  /** Failure type */
  type: FailureType;

  /** Expected vs actual values */
  comparison?: {
    expected: unknown;
    actual: unknown;
    diff?: string;
  };

  /** Location where error occurred */
  location?: {
    file: string;
    line: number;
    column: number;
  };

  /** Error code (if applicable) */
  code?: string;

  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Request information for API tests
 */
export interface RequestInfo {
  /** HTTP method */
  method: string;

  /** Request URL */
  url: string;

  /** Request headers */
  headers: Record<string, string>;

  /** Request body */
  body?: unknown;

  /** Query parameters */
  query?: Record<string, string>;

  /** Request timestamp */
  timestamp: string;

  /** Request size in bytes */
  size?: number;
}

/**
 * Response information for API tests
 */
export interface ResponseInfo {
  /** HTTP status code */
  status: number;

  /** Status text */
  statusText: string;

  /** Response headers */
  headers: Record<string, string>;

  /** Response body */
  body?: unknown;

  /** Response timestamp */
  timestamp: string;

  /** Response time in milliseconds */
  responseTime: number;

  /** Response size in bytes */
  size?: number;
}

/**
 * Self-healing information for a test
 */
export interface TestHealingInfo {
  /** Healing strategy used */
  strategy: HealingStrategy;

  /** Number of healing attempts */
  attempts: number;

  /** Whether healing was successful */
  successful: boolean;

  /** Changes made during healing */
  changes: string[];

  /** Original error */
  originalError: string;

  /** Healing duration in milliseconds */
  healingDuration: number;

  /** AI tokens used (if applicable) */
  tokensUsed?: number;

  /** Cost in USD (if applicable) */
  cost?: number;

  /** Whether cache was used */
  cacheHit?: boolean;

  /** Healing timestamp */
  timestamp: string;
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
  /** Base URL for tests */
  baseUrl: string;

  /** Environment name (dev/staging/prod) */
  environment: string;

  /** Test execution timestamp */
  timestamp: string;

  /** Node.js version */
  nodeVersion: string;

  /** Operating system information */
  osInfo: {
    platform: string;
    release: string;
    arch: string;
    cpus: number;
    memory: number;
  };

  /** Playwright version */
  playwrightVersion?: string;

  /** Browser versions (if applicable) */
  browsers?: Record<string, string>;

  /** CI/CD information */
  ci?: CIInfo;

  /** Git information */
  git?: GitInfo;

  /** Environment variables (sanitized) */
  envVars?: Record<string, string>;
}

/**
 * CI/CD information
 */
export interface CIInfo {
  /** Whether running in CI */
  isCI: boolean;

  /** CI provider name */
  provider?: string;

  /** Build/run ID */
  buildId?: string;

  /** Build URL */
  buildUrl?: string;

  /** Branch name */
  branch?: string;

  /** Commit SHA */
  commit?: string;

  /** PR number (if applicable) */
  pr?: number;
}

/**
 * Git information
 */
export interface GitInfo {
  /** Current branch */
  branch: string;

  /** Current commit SHA */
  commit: string;

  /** Commit message */
  commitMessage?: string;

  /** Commit author */
  author?: string;

  /** Repository URL */
  repositoryUrl?: string;

  /** Whether working directory is clean */
  isClean: boolean;
}

/**
 * Aggregated healing metrics
 */
export interface HealingMetrics {
  /** Total healing attempts */
  totalAttempts: number;

  /** Successful healings */
  successful: number;

  /** Failed healings */
  failed: number;

  /** Success rate as percentage (0-100) */
  successRate: number;

  /** Healing attempts by failure type */
  byFailureType: Record<FailureType, number>;

  /** Healing attempts by strategy */
  byStrategy: Record<HealingStrategy, number>;

  /** Number of times AI was used */
  aiUsed: number;

  /** Number of times fallback was used */
  fallbackUsed: number;

  /** Total AI tokens consumed */
  totalTokens: number;

  /** Total AI cost in USD */
  totalCost: number;

  /** Average healing time in milliseconds */
  averageHealingTime: number;

  /** Cache hit rate */
  cacheHitRate: number;

  /** Top healing patterns */
  topPatterns: HealingPattern[];

  /** Cost savings from caching */
  cacheSavings: number;
}

/**
 * Healing pattern for analysis
 */
export interface HealingPattern {
  /** Pattern description */
  pattern: string;

  /** Failure type */
  failureType: FailureType;

  /** Number of occurrences */
  occurrences: number;

  /** Success rate */
  successRate: number;

  /** Average healing time */
  averageTime: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average test duration */
  averageDuration: number;

  /** Average response time (for API tests) */
  averageResponseTime: number;

  /** Slowest test */
  slowestTest: {
    name: string;
    duration: number;
    filePath: string;
  };

  /** Fastest test */
  fastestTest: {
    name: string;
    duration: number;
    filePath: string;
  };

  /** Duration by test suite */
  durationBySuite: Record<string, number>;

  /** Duration by test file */
  durationByFile: Record<string, number>;

  /** Response time by endpoint */
  timeByEndpoint: Record<string, EndpointMetrics>;

  /** Performance percentiles */
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };

  /** Timeout violations */
  timeoutViolations: number;

  /** Slow tests (above threshold) */
  slowTests: Array<{
    name: string;
    duration: number;
    threshold: number;
  }>;
}

/**
 * Endpoint performance metrics
 */
export interface EndpointMetrics {
  /** Endpoint URL pattern */
  endpoint: string;

  /** HTTP method */
  method: string;

  /** Number of requests */
  requests: number;

  /** Average response time */
  averageTime: number;

  /** Minimum response time */
  minTime: number;

  /** Maximum response time */
  maxTime: number;

  /** Success rate */
  successRate: number;

  /** Status code distribution */
  statusCodes: Record<number, number>;
}

/**
 * Test suite result
 */
export interface TestSuiteResult {
  /** Suite name */
  name: string;

  /** Suite file path */
  filePath: string;

  /** Tests in suite */
  tests: TestResult[];

  /** Suite summary */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    successRate: number;
  };

  /** Suite start time */
  startTime: string;

  /** Suite end time */
  endTime: string;
}

/**
 * Coverage information
 */
export interface CoverageInfo {
  /** Overall coverage percentage */
  overall: number;

  /** Line coverage */
  lines: CoverageMetric;

  /** Statement coverage */
  statements: CoverageMetric;

  /** Function coverage */
  functions: CoverageMetric;

  /** Branch coverage */
  branches: CoverageMetric;

  /** Coverage by file */
  byFile: Record<string, FileCoverage>;
}

/**
 * Coverage metric
 */
export interface CoverageMetric {
  /** Coverage percentage */
  percentage: number;

  /** Number covered */
  covered: number;

  /** Total number */
  total: number;
}

/**
 * File coverage
 */
export interface FileCoverage {
  /** File path */
  path: string;

  /** Overall percentage */
  percentage: number;

  /** Lines covered */
  linesCovered: number;

  /** Total lines */
  totalLines: number;

  /** Uncovered line ranges */
  uncoveredLines: Array<{
    start: number;
    end: number;
  }>;
}

/**
 * Test annotation
 */
export interface TestAnnotation {
  /** Annotation type */
  type: 'info' | 'warning' | 'error';

  /** Annotation message */
  message: string;

  /** Timestamp */
  timestamp: string;
}

/**
 * Test attachment
 */
export interface TestAttachment {
  /** Attachment name */
  name: string;

  /** Attachment type */
  type: 'screenshot' | 'video' | 'trace' | 'log' | 'other';

  /** File path or URL */
  path: string;

  /** Content type */
  contentType: string;

  /** File size in bytes */
  size: number;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  /** Include detailed test results */
  includeDetails: boolean;

  /** Include request/response data */
  includeRequestResponse: boolean;

  /** Include stack traces */
  includeStackTraces: boolean;

  /** Include environment information */
  includeEnvironment: boolean;

  /** Include healing metrics */
  includeHealingMetrics: boolean;

  /** Include performance metrics */
  includePerformanceMetrics: boolean;

  /** Include coverage information */
  includeCoverage: boolean;

  /** Base URL for tests */
  baseUrl?: string;

  /** Environment name */
  environment?: string;

  /** Slow test threshold in milliseconds */
  slowTestThreshold: number;

  /** Custom metadata to include */
  metadata?: Record<string, unknown>;

  /** Sanitize sensitive data */
  sanitizeSensitiveData: boolean;

  /** Sensitive data patterns to redact */
  sensitivePatterns?: RegExp[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Validation details */
  details?: Record<string, unknown>;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  /** Report format */
  format: ReportFormat;

  /** Output file path */
  outputPath: string;

  /** Report title */
  title?: string;

  /** Include timestamp in filename */
  includeTimestamp: boolean;

  /** Template path (for HTML/PDF) */
  templatePath?: string;

  /** Custom CSS (for HTML) */
  customCSS?: string;

  /** Theme (light/dark) */
  theme?: 'light' | 'dark';

  /** Include charts/graphs */
  includeVisualizations: boolean;

  /** Report sections to include */
  sections?: ReportSection[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Report sections
 */
export enum ReportSection {
  SUMMARY = 'summary',
  ENVIRONMENT = 'environment',
  TESTS = 'tests',
  FAILURES = 'failures',
  HEALING = 'healing',
  PERFORMANCE = 'performance',
  COVERAGE = 'coverage',
  RECOMMENDATIONS = 'recommendations',
}

/**
 * Distribution configuration
 */
export interface DistributionConfig {
  /** Distribution channels */
  channels: DistributionChannel[];

  /** Distribution conditions */
  conditions?: DistributionCondition[];

  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoff: 'linear' | 'exponential';
  };

  /** Notification preferences */
  notifications?: {
    onSuccess: boolean;
    onFailure: boolean;
    recipients: string[];
  };
}

/**
 * Distribution channel
 */
export interface DistributionChannel {
  /** Channel type */
  type: 'slack' | 'email' | 'github' | 'webhook' | 'file';

  /** Channel enabled */
  enabled: boolean;

  /** Channel configuration */
  config: SlackConfig | EmailConfig | GitHubConfig | WebhookConfig | FileConfig;

  /** Report format for this channel */
  format?: ReportFormat;
}

/**
 * Slack configuration
 */
export interface SlackConfig {
  /** Webhook URL */
  webhookUrl: string;

  /** Channel name */
  channel?: string;

  /** Bot username */
  username?: string;

  /** Bot icon emoji */
  iconEmoji?: string;

  /** Mention users on failure */
  mentionOnFailure?: string[];
}

/**
 * Email configuration
 */
export interface EmailConfig {
  /** SMTP host */
  host: string;

  /** SMTP port */
  port: number;

  /** Use TLS */
  secure: boolean;

  /** Authentication */
  auth: {
    user: string;
    pass: string;
  };

  /** From address */
  from: string;

  /** To addresses */
  to: string[];

  /** CC addresses */
  cc?: string[];

  /** Email subject template */
  subjectTemplate?: string;
}

/**
 * GitHub configuration
 */
export interface GitHubConfig {
  /** GitHub token */
  token: string;

  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Create issue on failure */
  createIssue?: boolean;

  /** Update PR comment */
  updatePRComment?: boolean;

  /** PR number */
  prNumber?: number;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;

  /** HTTP method */
  method: 'POST' | 'PUT';

  /** Request headers */
  headers?: Record<string, string>;

  /** Authentication */
  auth?: {
    type: 'basic' | 'bearer' | 'api-key';
    credentials: string | { username: string; password: string };
  };
}

/**
 * File configuration
 */
export interface FileConfig {
  /** Output directory */
  outputDir: string;

  /** Filename pattern */
  filenamePattern: string;

  /** Keep history (number of reports) */
  keepHistory?: number;

  /** Compress reports */
  compress?: boolean;
}

/**
 * Distribution condition
 */
export interface DistributionCondition {
  /** Condition type */
  type: 'always' | 'on-failure' | 'on-success' | 'on-threshold';

  /** Threshold configuration (if applicable) */
  threshold?: {
    metric: 'success-rate' | 'failure-count' | 'duration';
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
    value: number;
  };
}

/**
 * Playwright test results (input format)
 */
export interface PlaywrightResults {
  /** Test configuration */
  config: unknown;

  /** Test suites */
  suites: PlaywrightSuite[];

  /** Errors */
  errors: unknown[];

  /** Start time */
  startTime: Date;

  /** Duration */
  duration: number;
}

/**
 * Playwright test suite
 */
export interface PlaywrightSuite {
  /** Suite title */
  title: string;

  /** Suite file */
  file: string;

  /** Suite tests */
  tests: PlaywrightTest[];

  /** Child suites */
  suites?: PlaywrightSuite[];
}

/**
 * Playwright test
 */
export interface PlaywrightTest {
  /** Test title */
  title: string;

  /** Test status */
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';

  /** Test duration */
  duration: number;

  /** Test error */
  error?: {
    message: string;
    stack?: string;
  };

  /** Test results (per retry) */
  results: Array<{
    status: string;
    duration: number;
    error?: unknown;
    retry: number;
    startTime: Date;
    attachments?: unknown[];
  }>;

  /** Test location */
  location: {
    file: string;
    line: number;
    column: number;
  };

  /** Test tags */
  tags?: string[];
}
