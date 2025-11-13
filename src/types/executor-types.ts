/**
 * TypeScript type definitions for Test Executor (Feature 3)
 * Defines interfaces for test execution, result collection, and reporting
 */

/**
 * Test execution status
 */
export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout',
  ERROR = 'error',
}

/**
 * Individual test result
 */
export interface TestResult {
  /** Unique test identifier */
  id: string;

  /** Test name/title */
  name: string;

  /** Test file path */
  filePath: string;

  /** Test status */
  status: TestStatus;

  /** Test duration in milliseconds */
  duration: number;

  /** Number of retry attempts */
  retries: number;

  /** Error information if test failed */
  error?: TestError;

  /** Test start timestamp */
  startTime: Date;

  /** Test end timestamp */
  endTime: Date;

  /** Test tags/labels */
  tags?: string[];

  /** Test metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Test error information
 */
export interface TestError {
  /** Error message */
  message: string;

  /** Error stack trace */
  stack?: string;

  /** Error type/category */
  type: ErrorType;

  /** Expected vs actual values (for assertion errors) */
  comparison?: {
    expected: unknown;
    actual: unknown;
  };

  /** Location where error occurred */
  location?: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * Error types
 */
export enum ErrorType {
  ASSERTION = 'assertion',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SETUP = 'setup',
  TEARDOWN = 'teardown',
  UNKNOWN = 'unknown',
}

/**
 * Execution summary/statistics
 */
export interface ExecutionSummary {
  /** Total number of tests */
  totalTests: number;

  /** Number of passed tests */
  passed: number;

  /** Number of failed tests */
  failed: number;

  /** Number of skipped tests */
  skipped: number;

  /** Number of timeout tests */
  timeout: number;

  /** Number of error tests */
  error: number;

  /** Total execution duration in milliseconds */
  duration: number;

  /** Execution start time */
  startTime: Date;

  /** Execution end time */
  endTime: Date;

  /** Success rate (0-1) */
  successRate: number;

  /** Average test duration in milliseconds */
  averageDuration: number;

  /** Test files executed */
  filesExecuted: string[];

  /** Total retry attempts */
  totalRetries: number;

  /** Statistics by file */
  byFile: Record<string, FileSummary>;

  /** Statistics by tag */
  byTag?: Record<string, TagSummary>;

  /** Details of failed tests */
  failedTestDetails?: Array<{
    testName: string;
    file: string;
    error: string;
  }>;
}

/**
 * File-level test summary
 */
export interface FileSummary {
  /** File path */
  filePath: string;

  /** Number of tests in file */
  testCount: number;

  /** Passed tests */
  passed: number;

  /** Failed tests */
  failed: number;

  /** Skipped tests */
  skipped: number;

  /** File execution duration */
  duration: number;
}

/**
 * Tag-level test summary
 */
export interface TagSummary {
  /** Tag name */
  tag: string;

  /** Number of tests with this tag */
  testCount: number;

  /** Passed tests */
  passed: number;

  /** Failed tests */
  failed: number;

  /** Success rate for this tag */
  successRate: number;
}

/**
 * Test execution options
 */
export interface ExecutionOptions {
  /** Test directory or specific test files */
  testPath?: string | string[];

  /** Playwright config file path */
  configPath?: string;

  /** Number of workers (parallel execution) */
  workers?: number;

  /** Number of retries for failed tests */
  retries?: number;

  /** Test timeout in milliseconds */
  timeout?: number;

  /** Whether to show progress during execution */
  showProgress?: boolean;

  /** Reporter formats to use */
  reporters?: ReporterFormat[];

  /** Output directory for results */
  outputDir?: string;

  /** Tags to filter tests */
  tags?: string[];

  /** Grep pattern to filter test names */
  grep?: string | RegExp;

  /** Whether to fail fast (stop on first failure) */
  failFast?: boolean;

  /** Environment variables */
  env?: Record<string, string>;

  /** Update snapshots */
  updateSnapshots?: boolean;

  /** Headed mode (for debugging) */
  headed?: boolean;

  /** Debug mode */
  debug?: boolean;
}

/**
 * Reporter format types
 */
export enum ReporterFormat {
  JSON = 'json',
  JUNIT = 'junit',
  HTML = 'html',
  LIST = 'list',
  DOT = 'dot',
  LINE = 'line',
}

/**
 * Test execution progress event
 */
export interface ProgressEvent {
  /** Event type */
  type: ProgressEventType;

  /** Event timestamp */
  timestamp: Date;

  /** Current test being executed */
  currentTest?: TestResult;

  /** Tests completed so far */
  completed: number;

  /** Total tests to execute */
  total: number;

  /** Current progress percentage (0-100) */
  percentage: number;

  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Progress event types
 */
export enum ProgressEventType {
  START = 'start',
  TEST_START = 'test_start',
  TEST_END = 'test_end',
  FILE_START = 'file_start',
  FILE_END = 'file_end',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Test result export format
 */
export interface ExportFormat {
  /** Format name */
  format: 'json' | 'junit' | 'html' | 'csv' | 'markdown';

  /** Output file path */
  outputPath: string;

  /** Format-specific options */
  options?: ExportOptions;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Include detailed test results */
  includeDetails?: boolean;

  /** Include error stack traces */
  includeStackTraces?: boolean;

  /** Pretty print (for JSON) */
  prettyPrint?: boolean;

  /** Include timestamp */
  includeTimestamp?: boolean;

  /** Include environment info */
  includeEnvironment?: boolean;

  /** Custom metadata to include */
  metadata?: Record<string, unknown>;
}

/**
 * Test runner interface
 */
export interface TestRunner {
  /**
   * Execute tests
   * @param options - Execution options
   * @returns Execution summary
   */
  executeTests(options?: ExecutionOptions): Promise<ExecutionSummary>;

  /**
   * Subscribe to progress events
   * @param callback - Progress event handler
   */
  onProgress(callback: ProgressCallback): void;

  /**
   * Stop test execution
   */
  stop(): Promise<void>;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Result collector interface
 */
export interface ResultCollector {
  /**
   * Add test result
   * @param result - Test result to add
   */
  addResult(result: TestResult): void;

  /**
   * Get all results
   * @returns All collected test results
   */
  getResults(): TestResult[];

  /**
   * Get execution summary
   * @returns Execution summary with statistics
   */
  getSummary(): ExecutionSummary;

  /**
   * Export results in specified format
   * @param format - Export format configuration
   */
  exportResults(format: ExportFormat): Promise<void>;

  /**
   * Clear all results
   */
  clear(): void;
}

/**
 * Playwright test result (from Playwright's test reporter)
 */
export interface PlaywrightTestResult {
  /** Test title/name */
  title: string;

  /** Test file path */
  file: string;

  /** Test status */
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';

  /** Test duration */
  duration: number;

  /** Test retry count */
  retry: number;

  /** Error if test failed */
  error?: {
    message: string;
    stack?: string;
  };

  /** Test start time */
  startTime: Date;

  /** Test tags */
  tags?: string[];
}

/**
 * Playwright test suite result
 */
export interface PlaywrightSuiteResult {
  /** Suite title */
  title: string;

  /** Suite file */
  file: string;

  /** Test results in suite */
  tests: PlaywrightTestResult[];

  /** Suite duration */
  duration: number;
}
