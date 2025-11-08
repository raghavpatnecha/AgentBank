/**
 * TypeScript type definitions for Reporting (Feature 6)
 * Defines interfaces for test reports, JSON, and JUnit XML formats
 */

/**
 * Complete test report structure
 */
export interface TestReport {
  /** Report format version */
  version: string;

  /** Report generation timestamp */
  generatedAt: Date;

  /** Test execution summary */
  summary: ReportSummary;

  /** Test environment information */
  environment: EnvironmentInfo;

  /** Individual test results */
  tests: TestReportEntry[];

  /** Self-healing statistics */
  selfHealing?: SelfHealingStats;

  /** Performance metrics */
  performance?: PerformanceMetrics;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Report summary statistics
 */
export interface ReportSummary {
  /** Total number of tests */
  total: number;

  /** Tests that passed */
  passed: number;

  /** Tests that failed */
  failed: number;

  /** Tests that were skipped */
  skipped: number;

  /** Tests that were self-healed */
  selfHealed?: number;

  /** Total execution duration in milliseconds */
  duration: number;

  /** Success rate percentage (0-100) */
  successRate: number;

  /** Test execution start time */
  startTime?: Date;

  /** Test execution end time */
  endTime?: Date;
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
  /** Base URL of the API under test */
  baseUrl?: string;

  /** Environment name (e.g., staging, production) */
  environment?: string;

  /** Test execution timestamp */
  timestamp: Date;

  /** Node.js version */
  nodeVersion: string;

  /** Operating system information */
  osInfo: string;

  /** Platform (linux, darwin, win32) */
  platform?: string;

  /** Architecture (x64, arm64) */
  architecture?: string;

  /** CI/CD information */
  ci?: CIInfo;
}

/**
 * CI/CD environment information
 */
export interface CIInfo {
  /** Whether running in CI */
  isCI: boolean;

  /** CI provider name */
  provider?: string;

  /** Build/run number */
  buildNumber?: string;

  /** Branch name */
  branch?: string;

  /** Commit SHA */
  commit?: string;

  /** Pull request number */
  pullRequest?: string;
}

/**
 * Test report entry (enhanced test result for reporting)
 */
export interface TestReportEntry {
  /** Unique test identifier */
  id: string;

  /** Test name/title */
  name: string;

  /** Test suite/file name */
  suite: string;

  /** Test status */
  status: 'passed' | 'failed' | 'skipped' | 'timeout' | 'error';

  /** Test duration in milliseconds */
  duration: number;

  /** Test start time */
  startTime?: Date;

  /** Test end time */
  endTime?: Date;

  /** Number of retry attempts */
  retries?: number;

  /** Whether test was self-healed */
  selfHealed?: boolean;

  /** Request information (for API tests) */
  request?: RequestInfo;

  /** Response information (for API tests) */
  response?: ResponseInfo;

  /** Error information if test failed */
  error?: TestErrorInfo;

  /** Test tags */
  tags?: string[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * HTTP request information
 */
export interface RequestInfo {
  /** HTTP method */
  method: string;

  /** Request URL/path */
  url: string;

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body */
  body?: unknown;

  /** Query parameters */
  query?: Record<string, string>;
}

/**
 * HTTP response information
 */
export interface ResponseInfo {
  /** HTTP status code */
  status: number;

  /** Response headers */
  headers?: Record<string, string>;

  /** Response body */
  body?: unknown;

  /** Response time in milliseconds */
  responseTime?: number;
}

/**
 * Test error information for reporting
 */
export interface TestErrorInfo {
  /** Error message */
  message: string;

  /** Error type */
  type: string;

  /** Stack trace */
  stack?: string;

  /** Expected value (for assertions) */
  expected?: unknown;

  /** Actual value (for assertions) */
  actual?: unknown;

  /** Diff output */
  diff?: string;
}

/**
 * Self-healing statistics for reports
 */
export interface SelfHealingStats {
  /** Total healing attempts */
  totalAttempts: number;

  /** Successful healings */
  successful: number;

  /** Failed healings */
  failed: number;

  /** Success rate percentage (0-100) */
  successRate: number;

  /** Healing by failure type */
  byFailureType?: Record<string, number>;

  /** Total cost of healing operations */
  totalCost?: number;
}

/**
 * Performance metrics for reports
 */
export interface PerformanceMetrics {
  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Median response time */
  medianResponseTime?: number;

  /** 95th percentile response time */
  p95ResponseTime?: number;

  /** Slowest test */
  slowestTest?: {
    name: string;
    duration: number;
  };

  /** Fastest test */
  fastestTest?: {
    name: string;
    duration: number;
  };

  /** Tests per second */
  testsPerSecond?: number;
}

/**
 * JSON reporter configuration
 */
export interface JSONReporterConfig {
  /** Output file path */
  outputPath?: string;

  /** Pretty print JSON (default: false) */
  pretty?: boolean;

  /** Indent size for pretty printing (default: 2) */
  indent?: number;

  /** Validate JSON against schema (default: true) */
  validateSchema?: boolean;

  /** Compress JSON output (default: false) */
  compress?: boolean;

  /** Include environment information (default: true) */
  includeEnvironment?: boolean;

  /** Include self-healing stats (default: true) */
  includeSelfHealing?: boolean;

  /** Include performance metrics (default: true) */
  includePerformance?: boolean;

  /** Additional metadata to include */
  metadata?: Record<string, unknown>;
}

/**
 * JUnit reporter configuration
 */
export interface JUnitReporterConfig {
  /** Output file path */
  outputPath?: string;

  /** Test suite name (default: "API Tests") */
  suiteName?: string;

  /** Include system-out logs (default: true) */
  includeSystemOut?: boolean;

  /** Include system-err logs (default: true) */
  includeSystemErr?: boolean;

  /** Include test properties (default: true) */
  includeProperties?: boolean;

  /** Validate XML output (default: true) */
  validateXML?: boolean;

  /** Additional properties to include */
  properties?: Record<string, string>;

  /** Hostname for test execution */
  hostname?: string;
}

/**
 * JUnit test suite structure
 */
export interface JUnitTestSuite {
  /** Suite name */
  name: string;

  /** Number of tests */
  tests: number;

  /** Number of failures */
  failures: number;

  /** Number of errors */
  errors: number;

  /** Number of skipped tests */
  skipped: number;

  /** Suite execution time in seconds */
  time: number;

  /** Suite timestamp */
  timestamp: Date;

  /** Hostname */
  hostname?: string;

  /** Test cases in suite */
  testCases: JUnitTestCase[];

  /** Suite properties */
  properties?: Record<string, string>;

  /** System output */
  systemOut?: string;

  /** System error output */
  systemErr?: string;
}

/**
 * JUnit test case structure
 */
export interface JUnitTestCase {
  /** Test case name */
  name: string;

  /** Class name (suite name) */
  classname: string;

  /** Test execution time in seconds */
  time: number;

  /** Failure information */
  failure?: JUnitFailure;

  /** Error information */
  error?: JUnitError;

  /** Whether test was skipped */
  skipped?: boolean;

  /** System output */
  systemOut?: string;

  /** System error output */
  systemErr?: string;
}

/**
 * JUnit failure element
 */
export interface JUnitFailure {
  /** Failure message */
  message: string;

  /** Failure type */
  type: string;

  /** Failure details/stack trace */
  content: string;
}

/**
 * JUnit error element
 */
export interface JUnitError {
  /** Error message */
  message: string;

  /** Error type */
  type: string;

  /** Error details/stack trace */
  content: string;
}

/**
 * Reporter interface
 */
export interface Reporter {
  /**
   * Generate report from test data
   * @param data - Test report data
   * @returns Generated report content
   */
  generateReport(data: TestReport): Promise<string>;

  /**
   * Save report to file
   * @param content - Report content
   * @param filepath - Output file path
   */
  saveToFile(content: string, filepath: string): Promise<void>;

  /**
   * Validate report format
   * @param content - Report content
   * @returns Whether report is valid
   */
  validate(content: string): boolean;
}

/**
 * Report formats
 */
export type ReportFormat = 'html' | 'json' | 'junit' | 'markdown' | 'pdf';

/**
 * Report theme
 */
export type ReportTheme = 'light' | 'dark' | 'auto';

/**
 * Storage provider types
 */
export type StorageProvider = 's3' | 'gcs' | 'azure' | 'http';

/**
 * HTML Report Configuration
 */
export interface HtmlReportConfig {
  includeCharts: boolean;
  theme: ReportTheme;
  embedAssets: boolean;
  includeScreenshots: boolean;
  includeVideos: boolean;
  includeTraces: boolean;
  includeTimeline: boolean;
  customCss?: string;
  customJs?: string;
  logo?: string;
  title?: string;
}

/**
 * Markdown Report Configuration
 */
export interface MarkdownReportConfig {
  includeEnvironment: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  includeToc: boolean;
  emojis: boolean;
}

/**
 * PDF Report Configuration
 */
export interface PdfReportConfig {
  format: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  includePageNumbers: boolean;
  includeTimestamp: boolean;
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

/**
 * Email Configuration
 */
export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  attachReport: boolean;
  attachFormats: ReportFormat[];
  onlyOnFailure: boolean;
  includeScreenshots: boolean;
  maxAttachmentSize?: number;
}

/**
 * S3 Storage Configuration
 */
export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  prefix?: string;
  acl?: string;
}

/**
 * Google Cloud Storage Configuration
 */
export interface GcsConfig {
  bucket: string;
  projectId: string;
  keyFilename?: string;
  credentials?: Record<string, unknown>;
  prefix?: string;
}

/**
 * Azure Blob Storage Configuration
 */
export interface AzureConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
  endpoint?: string;
  prefix?: string;
}

/**
 * HTTP Upload Configuration
 */
export interface HttpConfig {
  endpoint: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  auth?: {
    type: 'basic' | 'bearer';
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * Upload Configuration
 */
export interface UploadConfig {
  enabled: boolean;
  provider: StorageProvider;
  s3?: S3Config;
  gcs?: GcsConfig;
  azure?: AzureConfig;
  http?: HttpConfig;
  uploadFormats: ReportFormat[];
  uploadScreenshots: boolean;
  uploadVideos: boolean;
  uploadTraces: boolean;
  compression?: boolean;
}

/**
 * Retention Configuration
 */
export interface RetentionConfig {
  maxReports: number;
  maxAge: number;
  cleanupOnGenerate: boolean;
  archiveOldReports: boolean;
  archivePath?: string;
}

/**
 * Complete Reporting Configuration
 */
export interface ReportingConfig {
  formats: ReportFormat[];
  outputDir: string;
  filenamePattern: string;
  timestampFormat?: string;

  html: HtmlReportConfig;
  json: JSONReporterConfig;
  junit: JUnitReporterConfig;
  markdown: MarkdownReportConfig;
  pdf: PdfReportConfig;

  email: EmailConfig;
  upload: UploadConfig;
  retention: RetentionConfig;

  parallel: boolean;
  compression: boolean;
}

/**
 * Generated Report
 */
export interface GeneratedReport {
  format: ReportFormat;
  content: string;
  path?: string;
  size: number;
  generatedAt: Date;
}

/**
 * Collection of Generated Reports
 */
export interface GeneratedReports {
  [key: string]: GeneratedReport;
}

/**
 * Saved Report
 */
export interface SavedReport {
  format: ReportFormat;
  path: string;
  size: number;
  savedAt: Date;
}

/**
 * Collection of Saved Reports
 */
export interface SavedReports {
  [key: string]: SavedReport;
}

/**
 * Upload Result
 */
export interface UploadResult {
  success: boolean;
  format: ReportFormat;
  url?: string;
  error?: string;
  uploadedAt?: Date;
  size?: number;
}

/**
 * Upload Results Collection
 */
export interface UploadResults {
  success: boolean;
  uploads: UploadResult[];
  totalSize: number;
  duration: number;
}

/**
 * Email Send Result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  recipients: string[];
  error?: string;
  sentAt?: Date;
}

/**
 * Report Generation Result
 */
export interface ReportGenerationResult {
  success: boolean;
  reports: SavedReports;
  email?: EmailResult;
  upload?: UploadResults;
  duration: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Cleanup Result
 */
export interface CleanupResult {
  deletedCount: number;
  archivedCount: number;
  freedSpace: number;
  duration: number;
  errors?: string[];
}
