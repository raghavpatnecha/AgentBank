/**
 * TypeScript type definitions for AI-powered Self-Healing features (Feature 4)
 * Defines interfaces for test regeneration, code validation, and self-healing orchestration
 */

import type { TestResult } from './executor-types.js';

/**
 * OpenAPI specification change
 */
export interface SpecChange {
  /** Type of change detected */
  type: SpecChangeType;

  /** Path in the OpenAPI spec that changed */
  path: string;

  /** Previous value (before change) */
  oldValue: unknown;

  /** New value (after change) */
  newValue: unknown;

  /** Impact level of the change */
  impact: ChangeImpact;

  /** Description of the change */
  description: string;
}

/**
 * Types of specification changes
 */
export enum SpecChangeType {
  FIELD_ADDED = 'field_added',
  FIELD_REMOVED = 'field_removed',
  FIELD_RENAMED = 'field_renamed',
  TYPE_CHANGED = 'type_changed',
  ENDPOINT_ADDED = 'endpoint_added',
  ENDPOINT_REMOVED = 'endpoint_removed',
  ENDPOINT_MODIFIED = 'endpoint_modified',
  STATUS_CODE_CHANGED = 'status_code_changed',
  REQUIRED_CHANGED = 'required_changed',
  ENUM_VALUES_CHANGED = 'enum_values_changed',
}

/**
 * Impact level of a change
 */
export enum ChangeImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  BREAKING = 'breaking',
}

/**
 * Test failure analysis result
 */
export interface FailureAnalysis {
  /** Original test result */
  testResult: TestResult;

  /** Type of failure detected */
  failureType: FailureType;

  /** Root cause of the failure */
  rootCause: string;

  /** Related spec changes (if any) */
  relatedChanges: SpecChange[];

  /** Whether the failure is healable */
  healable: boolean;

  /** Confidence score (0-1) */
  confidence: number;

  /** Suggested fix description */
  suggestedFix?: string;

  /** Analysis timestamp */
  analyzedAt: Date;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Failure types that can be detected
 */
export enum FailureType {
  FIELD_MISSING = 'field_missing',
  TYPE_MISMATCH = 'type_mismatch',
  STATUS_CODE_CHANGED = 'status_code_changed',
  ENDPOINT_NOT_FOUND = 'endpoint_not_found',
  SCHEMA_VALIDATION = 'schema_validation',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  ASSERTION_ERROR = 'assertion_error',
  UNKNOWN = 'unknown',
}

/**
 * Test regeneration context
 */
export interface RegenerationContext {
  /** Original test file path */
  testFilePath: string;

  /** Test name/identifier */
  testName: string;

  /** Failure analysis */
  failureAnalysis: FailureAnalysis;

  /** Current OpenAPI specification */
  currentSpec: unknown;

  /** Original test code */
  originalTestCode: string;

  /** Spec changes that triggered regeneration */
  specChanges: SpecChange[];

  /** Additional context for AI */
  additionalContext?: string;
}

/**
 * Test regeneration result
 */
export interface RegenerationResult {
  /** Whether regeneration was successful */
  success: boolean;

  /** Regenerated test code */
  regeneratedCode?: string;

  /** Path where regenerated test was saved */
  savedPath?: string;

  /** Validation result of generated code */
  validation?: ValidationResult;

  /** Error if regeneration failed */
  error?: RegenerationError;

  /** AI model used */
  modelUsed: string;

  /** Number of tokens used */
  tokensUsed?: number;

  /** Time taken for regeneration (ms) */
  duration: number;

  /** Regeneration timestamp */
  timestamp: Date;
}

/**
 * Regeneration error
 */
export interface RegenerationError {
  /** Error message */
  message: string;

  /** Error type */
  type: RegenerationErrorType;

  /** Error details */
  details?: string;

  /** Stack trace if available */
  stack?: string;
}

/**
 * Regeneration error types
 */
export enum RegenerationErrorType {
  AI_API_ERROR = 'ai_api_error',
  PARSING_ERROR = 'parsing_error',
  VALIDATION_ERROR = 'validation_error',
  FILE_WRITE_ERROR = 'file_write_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Code validation result
 */
export interface ValidationResult {
  /** Whether code is valid */
  valid: boolean;

  /** Syntax validation result */
  syntax: SyntaxValidation;

  /** Import validation result */
  imports: ImportValidation;

  /** Test structure validation */
  structure: StructureValidation;

  /** Assertion validation */
  assertions: AssertionValidation;

  /** Compilation result */
  compilation?: CompilationResult;

  /** Overall validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Syntax validation result
 */
export interface SyntaxValidation {
  /** Whether syntax is valid */
  valid: boolean;

  /** Syntax errors found */
  errors: SyntaxError[];

  /** Language/parser used */
  parser: string;
}

/**
 * Syntax error
 */
export interface SyntaxError {
  /** Error message */
  message: string;

  /** Line number */
  line: number;

  /** Column number */
  column: number;

  /** Error code */
  code?: string;
}

/**
 * Import validation result
 */
export interface ImportValidation {
  /** Whether imports are valid */
  valid: boolean;

  /** Has Playwright test imports */
  hasPlaywrightImports: boolean;

  /** Missing required imports */
  missingImports: string[];

  /** Invalid imports */
  invalidImports: string[];
}

/**
 * Test structure validation
 */
export interface StructureValidation {
  /** Whether structure is valid */
  valid: boolean;

  /** Has test blocks */
  hasTestBlocks: boolean;

  /** Number of test cases found */
  testCount: number;

  /** Has describe blocks */
  hasDescribeBlocks: boolean;

  /** Structural issues */
  issues: string[];
}

/**
 * Assertion validation
 */
export interface AssertionValidation {
  /** Whether assertions are valid */
  valid: boolean;

  /** Number of assertions found */
  assertionCount: number;

  /** Has expect statements */
  hasExpectStatements: boolean;

  /** Assertion issues */
  issues: string[];
}

/**
 * TypeScript compilation result
 */
export interface CompilationResult {
  /** Whether code compiles successfully */
  success: boolean;

  /** Compilation errors */
  errors: CompilationError[];

  /** Compilation warnings */
  warnings: CompilationWarning[];

  /** Generated JavaScript code */
  output?: string;
}

/**
 * Compilation error
 */
export interface CompilationError {
  /** Error message */
  message: string;

  /** File path */
  file: string;

  /** Line number */
  line: number;

  /** Column number */
  column: number;

  /** Error code (TS error code) */
  code: number;

  /** Category (Error, Warning, Message) */
  category: number;
}

/**
 * Compilation warning
 */
export interface CompilationWarning {
  /** Warning message */
  message: string;

  /** File path */
  file: string;

  /** Line number */
  line: number;

  /** Column number */
  column: number;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string;

  /** Validation type that failed */
  type: ValidationType;

  /** Severity level */
  severity: 'error' | 'warning';

  /** Location if applicable */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning message */
  message: string;

  /** Warning type */
  type: ValidationType;

  /** Recommendation */
  recommendation?: string;
}

/**
 * Validation types
 */
export enum ValidationType {
  SYNTAX = 'syntax',
  IMPORTS = 'imports',
  STRUCTURE = 'structure',
  ASSERTIONS = 'assertions',
  COMPILATION = 'compilation',
  TYPESCRIPT = 'typescript',
  PLAYWRIGHT = 'playwright',
}

/**
 * AI prompt builder configuration
 */
export interface PromptConfig {
  /** Include spec changes in prompt */
  includeSpecChanges: boolean;

  /** Include original test code */
  includeOriginalCode: boolean;

  /** Include failure analysis */
  includeFailureAnalysis: boolean;

  /** Maximum prompt length (tokens) */
  maxTokens?: number;

  /** Temperature for AI model */
  temperature?: number;

  /** Custom instructions */
  customInstructions?: string;
}

/**
 * Parsed AI response
 */
export interface ParsedCode {
  /** Extracted code */
  code: string;

  /** Code language detected */
  language: string;

  /** Whether code was found in response */
  found: boolean;

  /** Raw AI response */
  rawResponse: string;

  /** Confidence that parsing was correct (0-1) */
  confidence: number;
}

/**
 * OpenAI client configuration
 */
export interface OpenAIConfig {
  /** API key */
  apiKey: string;

  /** Model to use */
  model: string;

  /** API endpoint */
  endpoint?: string;

  /** Request timeout (ms) */
  timeout?: number;

  /** Max retries */
  maxRetries?: number;
}

/**
 * Healing attempt record
 */
export interface HealingAttempt {
  /** Attempt number */
  attemptNumber: number;

  /** Test identifier */
  testId: string;

  /** Timestamp of attempt */
  timestamp: Date;

  /** Regeneration result */
  regenerationResult: RegenerationResult;

  /** Whether healing was successful */
  success: boolean;

  /** Test result after healing */
  testResultAfterHealing?: TestResult;
}

/**
 * Self-healing configuration
 */
export interface SelfHealingConfig {
  /** Maximum healing attempts per test */
  maxAttemptsPerTest: number;

  /** Maximum total healing time (ms) */
  maxTotalTime: number;

  /** Minimum confidence threshold for healing (0-1) */
  minConfidence: number;

  /** Failure types that are healable */
  healableFailureTypes: FailureType[];

  /** Enable automatic retry after healing */
  autoRetry: boolean;

  /** Backup original tests */
  backupOriginal: boolean;

  /** AI model configuration */
  aiConfig: OpenAIConfig;
}

/**
 * Healing report
 */
export interface HealingReport {
  /** Total tests analyzed */
  totalTests: number;

  /** Failed tests found */
  failedTests: number;

  /** Tests attempted to heal */
  healingAttempts: number;

  /** Successfully healed tests */
  successfullyHealed: number;

  /** Failed healing attempts */
  failedHealing: number;

  /** Non-healable failures */
  nonHealable: number;

  /** Total time spent healing (ms) */
  totalTime: number;

  /** Individual healing attempts */
  attempts: HealingAttempt[];

  /** Summary statistics */
  statistics: HealingStatistics;

  /** Report timestamp */
  timestamp: Date;
}

/**
 * Healing statistics
 */
export interface HealingStatistics {
  /** Success rate (0-1) */
  successRate: number;

  /** Average healing time (ms) */
  averageHealingTime: number;

  /** Healing by failure type */
  byFailureType: Record<FailureType, number>;

  /** Most common failure types */
  topFailureTypes: Array<{ type: FailureType; count: number }>;

  /** Tokens used for AI */
  totalTokensUsed: number;

  /** Average confidence score */
  averageConfidence: number;
}

/**
 * Failed test information
 */
export interface FailedTest {
  /** Test result */
  result: TestResult;

  /** Test file content */
  testCode: string;

  /** Number of healing attempts so far */
  healingAttempts: number;

  /** Previous healing results */
  previousAttempts: HealingAttempt[];
}

/**
 * Healing result for a single test
 */
export interface HealingResult {
  /** Test identifier */
  testId: string;

  /** Whether healing was attempted */
  attempted: boolean;

  /** Whether healing was successful */
  success: boolean;

  /** Regeneration result */
  regenerationResult?: RegenerationResult;

  /** Test result after retry */
  retryResult?: TestResult;

  /** Reason if healing was not attempted or failed */
  reason?: string;

  /** Time taken (ms) */
  duration: number;
}

/**
 * Healing components for orchestrator
 */
export interface HealingComponents {
  /** Failure analyzer */
  failureAnalyzer: FailureAnalyzer;

  /** Spec change detector */
  specChangeDetector: SpecChangeDetector;

  /** Test regenerator */
  testRegenerator: TestRegenerator;

  /** Test runner for retries */
  testRunner: TestRunner;
}

/**
 * Failure analyzer interface
 */
export interface FailureAnalyzer {
  /**
   * Analyze a test failure
   */
  analyze(testResult: TestResult, specChanges?: SpecChange[]): Promise<FailureAnalysis>;
}

/**
 * Spec change detector interface
 */
export interface SpecChangeDetector {
  /**
   * Detect changes between two OpenAPI specs
   */
  detectChanges(oldSpec: unknown, newSpec: unknown): Promise<SpecChange[]>;
}

/**
 * Test regenerator interface
 */
export interface TestRegenerator {
  /**
   * Regenerate a test based on context
   */
  regenerateTest(context: RegenerationContext): Promise<RegenerationResult>;
}

/**
 * Test runner interface for healing
 */
export interface TestRunner {
  /**
   * Run a specific test
   */
  runTest(testPath: string, testName: string): Promise<TestResult>;
}

/**
 * Success rate metrics
 */
export interface SuccessRateMetrics {
  /** Total regeneration attempts */
  totalAttempts: number;

  /** Successful regenerations */
  successful: number;

  /** Failed regenerations */
  failed: number;

  /** Success rate (0-1) */
  rate: number;

  /** Metrics by failure type */
  byFailureType: Record<
    FailureType,
    {
      attempts: number;
      successes: number;
      rate: number;
    }
  >;
}
