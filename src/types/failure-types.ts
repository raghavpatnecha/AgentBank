/**
 * Type definitions for Playwright test failure analysis
 * Feature 4: Self-Healing Agent - Task 4.2
 */

/**
 * Comprehensive failure type classification
 */
export enum FailureType {
  ASSERTION = 'assertion',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  AUTH = 'auth',
  SELECTOR = 'selector',
  NAVIGATION = 'navigation',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * Network error subtypes
 */
export enum NetworkErrorType {
  CONNECTION_REFUSED = 'connection_refused',
  DNS_FAILURE = 'dns_failure',
  SSL_ERROR = 'ssl_error',
  HTTP_ERROR = 'http_error',
  CORS_ERROR = 'cors_error',
  TIMEOUT = 'timeout',
}

/**
 * Assertion error subtypes
 */
export enum AssertionErrorType {
  EQUALITY = 'equality',
  VISIBILITY = 'visibility',
  TEXT_CONTENT = 'text_content',
  ATTRIBUTE = 'attribute',
  COUNT = 'count',
  STATE = 'state',
  VALUE = 'value',
}

/**
 * Test result from Playwright
 */
export interface TestResult {
  testPath: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: TestError;
  retry: number;
  stdout?: string[];
  stderr?: string[];
  attachments?: TestAttachment[];
}

/**
 * Test error information
 */
export interface TestError {
  message: string;
  stack?: string;
  snippet?: string;
  location?: ErrorLocation;
}

/**
 * Error location in code
 */
export interface ErrorLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * Test attachment (screenshots, traces, etc.)
 */
export interface TestAttachment {
  name: string;
  path: string;
  contentType: string;
  body?: Buffer;
}

/**
 * Parsed error with structured information
 */
export interface ParsedError {
  type: FailureType;
  rawMessage: string;
  cleanMessage: string;
  stackTrace?: string[];
  selector?: string;
  expectedValue?: any;
  actualValue?: any;
  httpStatus?: number;
  url?: string;
  fieldName?: string;
  timeout?: number;
  location?: ErrorLocation;
}

/**
 * Assertion failure details
 */
export interface AssertionFailure {
  type: AssertionErrorType;
  selector?: string;
  expectedValue?: any;
  actualValue?: any;
  comparisonType?: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';
  fieldName?: string;
  message: string;
  suggestion?: string;
}

/**
 * Network error details
 */
export interface NetworkError {
  type: NetworkErrorType;
  url: string;
  statusCode?: number;
  statusText?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  responseTime?: number;
  message: string;
  suggestion?: string;
}

/**
 * Timeout error details
 */
export interface TimeoutError {
  operation: 'navigation' | 'selector' | 'assertion' | 'action' | 'network';
  timeout: number;
  elapsed?: number;
  selector?: string;
  url?: string;
  message: string;
  suggestion?: string;
}

/**
 * Authentication error details
 */
export interface AuthError {
  type: 'unauthorized' | 'forbidden' | 'token_expired' | 'invalid_credentials';
  statusCode?: number;
  endpoint?: string;
  authMethod?: 'basic' | 'bearer' | 'apiKey' | 'oauth2';
  message: string;
  suggestion?: string;
}

/**
 * Selector error details
 */
export interface SelectorError {
  selector: string;
  selectorType: 'css' | 'xpath' | 'text' | 'id' | 'role' | 'testId';
  reason: 'not_found' | 'multiple_found' | 'hidden' | 'detached' | 'invalid';
  count?: number;
  message: string;
  suggestion?: string;
}

/**
 * Navigation error details
 */
export interface NavigationError {
  url: string;
  reason: 'timeout' | 'network' | 'ssl' | 'dns' | 'redirect' | 'blocked';
  statusCode?: number;
  message: string;
  suggestion?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  fieldName: string;
  validationType: 'type' | 'format' | 'required' | 'range' | 'pattern';
  expectedFormat?: string;
  actualValue?: any;
  message: string;
  suggestion?: string;
}

/**
 * Context surrounding the failure
 */
export interface FailureContext {
  testFile: string;
  testName: string;
  lineNumber?: number;
  codeSnippet?: string;
  previousActions?: string[];
  pageUrl?: string;
  pageTitle?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
  timestamp: Date;
  screenshots?: string[];
  traces?: string[];
  logs?: LogEntry[];
}

/**
 * Log entry from browser or test
 */
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'browser' | 'test' | 'network' | 'console';
  message: string;
  args?: any[];
}

/**
 * Complete failure analysis result
 */
export interface FailureAnalysis {
  testResult: TestResult;
  failureType: FailureType;
  parsedError: ParsedError;
  context: FailureContext;
  specificError?:
    | AssertionFailure
    | NetworkError
    | TimeoutError
    | AuthError
    | SelectorError
    | NavigationError
    | ValidationError;
  rootCause: string;
  potentialFixes: Fix[];
  relatedFailures?: RelatedFailure[];
  confidence: number; // 0-1, how confident we are in the analysis
}

/**
 * Suggested fix for the failure
 */
export interface Fix {
  type: 'code' | 'config' | 'data' | 'infrastructure';
  description: string;
  code?: string;
  file?: string;
  line?: number;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  automated: boolean;
}

/**
 * Related failure that might have the same root cause
 */
export interface RelatedFailure {
  testName: string;
  testFile: string;
  similarity: number; // 0-1
  reason: string;
}

/**
 * Pattern for detecting specific failure types
 */
export interface FailurePattern {
  type: FailureType;
  regex: RegExp;
  extractor: (match: RegExpMatchArray) => Partial<ParsedError>;
  priority: number; // Higher priority patterns are checked first
}

/**
 * Statistics about failure patterns
 */
export interface FailureStatistics {
  totalFailures: number;
  byType: Record<FailureType, number>;
  mostCommon: FailureType;
  averageConfidence: number;
  automatedFixRate: number;
  successfulFixes: number;
  failedFixes: number;
}

/**
 * Options for failure analysis
 */
export interface AnalysisOptions {
  includeContext?: boolean;
  includeSuggestions?: boolean;
  includeRelatedFailures?: boolean;
  maxRelatedFailures?: number;
  confidenceThreshold?: number;
  enablePatternLearning?: boolean;
}
