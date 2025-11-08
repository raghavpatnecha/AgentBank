/**
 * TypeScript type definitions for Test Generator (Feature 2)
 * Defines interfaces for generating Playwright API tests from OpenAPI specifications
 */

import type { AuthScheme, SchemaObject, ResponseObject } from './openapi-types.js';

/**
 * Test case structure representing a single Playwright test
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;

  /** Human-readable test name */
  name: string;

  /** Test description explaining what is being tested */
  description: string;

  /** Test type/category */
  type: TestType;

  /** HTTP method (GET, POST, etc.) */
  method: string;

  /** API endpoint path */
  endpoint: string;

  /** Request configuration */
  request: TestRequest;

  /** Expected response validation */
  expectedResponse: ExpectedResponse;

  /** Authentication requirements */
  auth?: TestAuth;

  /** Test setup/teardown hooks */
  hooks?: TestHooks;

  /** Test metadata */
  metadata: TestMetadata;
}

/**
 * Test type categories
 */
export type TestType =
  | 'happy-path' // Successful scenario with valid inputs
  | 'error-case' // Error scenarios (4xx, 5xx responses)
  | 'auth' // Authentication/authorization testing
  | 'edge-case' // Boundary values, edge conditions
  | 'flow' // Multi-step API workflows
  | 'validation' // Schema validation tests
  | 'performance'; // Basic performance checks

/**
 * Request configuration for a test
 */
export interface TestRequest {
  /** Path parameters */
  pathParams?: Record<string, TestValue>;

  /** Query parameters */
  queryParams?: Record<string, TestValue>;

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body */
  body?: TestRequestBody;

  /** Request timeout in ms */
  timeout?: number;
}

/**
 * Test value with metadata
 */
export interface TestValue {
  /** Actual value to use in test */
  value: unknown;

  /** Value description for documentation */
  description?: string;

  /** Whether this is a generated/synthetic value */
  generated: boolean;

  /** Faker.js method used (if generated) */
  fakerMethod?: string;
}

/**
 * Request body configuration
 */
export interface TestRequestBody {
  /** Content type */
  contentType: string;

  /** Request payload */
  data: unknown;

  /** Schema that generated this data */
  schema?: SchemaObject;

  /** Whether data was auto-generated */
  generated: boolean;
}

/**
 * Expected response validation
 */
export interface ExpectedResponse {
  /** Expected HTTP status code(s) */
  status: number | number[];

  /** Response headers to validate */
  headers?: Record<string, string | RegExp>;

  /** Response body validation */
  body?: ResponseBodyValidation;

  /** Response time validation (ms) */
  maxResponseTime?: number;
}

/**
 * Response body validation configuration
 */
export interface ResponseBodyValidation {
  /** Expected content type */
  contentType?: string;

  /** Schema validation */
  schema?: SchemaObject;

  /** Exact value match */
  exactMatch?: unknown;

  /** Partial match (subset of fields) */
  partialMatch?: Record<string, unknown>;

  /** Custom validation rules */
  customRules?: ValidationRule[];
}

/**
 * Custom validation rule
 */
export interface ValidationRule {
  /** Rule identifier */
  name: string;

  /** JSON path to field being validated */
  path: string;

  /** Validation type */
  type: 'type' | 'format' | 'range' | 'pattern' | 'custom';

  /** Validation configuration */
  config: unknown;

  /** Error message if validation fails */
  errorMessage?: string;
}

/**
 * Authentication configuration for test
 */
export interface TestAuth {
  /** Authentication scheme from OpenAPI spec */
  scheme: AuthScheme;

  /** Test-specific credentials/tokens */
  credentials?: TestCredentials;

  /** Whether to test unauthorized access */
  testUnauthorized?: boolean;
}

/**
 * Test credentials (references to env vars or test data)
 */
export interface TestCredentials {
  /** API key value or env var reference */
  apiKey?: string;

  /** Bearer token or env var reference */
  bearerToken?: string;

  /** Basic auth username */
  username?: string;

  /** Basic auth password */
  password?: string;

  /** OAuth2 configuration */
  oauth2?: OAuth2Config;
}

/**
 * OAuth2 test configuration
 */
export interface OAuth2Config {
  /** Token URL */
  tokenUrl: string;

  /** Client ID */
  clientId: string;

  /** Client secret */
  clientSecret: string;

  /** Scopes */
  scopes?: string[];
}

/**
 * Test lifecycle hooks
 */
export interface TestHooks {
  /** Setup code to run before test */
  beforeTest?: string[];

  /** Cleanup code to run after test */
  afterTest?: string[];

  /** Setup for entire test file */
  beforeAll?: string[];

  /** Cleanup for entire test file */
  afterAll?: string[];
}

/**
 * Test metadata
 */
export interface TestMetadata {
  /** Tags for test organization */
  tags: string[];

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';

  /** Test stability */
  stability: 'stable' | 'flaky' | 'experimental';

  /** Associated operation ID from OpenAPI */
  operationId?: string;

  /** Generation timestamp */
  generatedAt: string;

  /** Generator version */
  generatorVersion: string;
}

/**
 * Generated test file structure
 */
export interface GeneratedTestFile {
  /** File path relative to output directory */
  filePath: string;

  /** File name */
  fileName: string;

  /** File content (Playwright test code) */
  content: string;

  /** Tests included in this file */
  tests: TestCase[];

  /** File-level imports */
  imports: string[];

  /** File-level fixtures/helpers */
  fixtures?: string[];

  /** File metadata */
  metadata: FileMetadata;
}

/**
 * Test file metadata
 */
export interface FileMetadata {
  /** API endpoint(s) covered */
  endpoints: string[];

  /** Test types included */
  testTypes: TestType[];

  /** Total test count */
  testCount: number;

  /** API tags */
  tags: string[];

  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Test generator configuration
 */
export interface TestGeneratorConfig {
  /** Output directory for generated tests */
  outputDir: string;

  /** Base URL for API */
  baseURL: string;

  /** Test organization strategy */
  organizationStrategy: OrganizationStrategy;

  /** Test types to generate */
  testTypes: TestType[];

  /** Authentication configuration */
  auth?: AuthConfig;

  /** Data generation options */
  dataGeneration: DataGenerationOptions;

  /** Code generation options */
  codeGeneration: CodeGenerationOptions;

  /** Validation options */
  validation: ValidationOptions;
}

/**
 * Test organization strategies
 */
export type OrganizationStrategy =
  | 'by-endpoint' // One file per endpoint
  | 'by-tag' // One file per OpenAPI tag
  | 'by-type' // One file per test type
  | 'by-method' // One file per HTTP method
  | 'flat'; // All tests in one directory

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Environment variable prefix for credentials */
  envPrefix?: string;

  /** Default authentication scheme to use */
  defaultScheme?: string;

  /** Test unauthorized scenarios */
  testUnauthorized: boolean;

  /** Generate auth fixtures */
  generateFixtures: boolean;
}

/**
 * Data generation options
 */
export interface DataGenerationOptions {
  /** Use faker.js for realistic data */
  useFaker: boolean;

  /** Faker locale */
  fakerLocale?: string;

  /** Seed for reproducible data */
  seed?: number;

  /** Generate edge cases (nulls, empty strings, etc.) */
  includeEdgeCases: boolean;

  /** Generate boundary values */
  includeBoundaryValues: boolean;

  /** Custom data generators */
  customGenerators?: Record<string, DataGenerator>;
}

/**
 * Custom data generator function
 */
export type DataGenerator = (schema: SchemaObject, context: GenerationContext) => unknown;

/**
 * Data generation context
 */
export interface GenerationContext {
  /** Field name being generated */
  fieldName: string;

  /** Parent schema context */
  parentSchema?: SchemaObject;

  /** Depth in schema tree */
  depth: number;

  /** Test type context */
  testType: TestType;
}

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  /** Use TypeScript instead of JavaScript */
  typescript: boolean;

  /** Add detailed comments */
  addComments: boolean;

  /** Code style */
  style: CodeStyle;

  /** Import style */
  importStyle: 'esm' | 'commonjs';

  /** Generate helper functions */
  generateHelpers: boolean;

  /** Generate fixtures */
  generateFixtures: boolean;
}

/**
 * Code style options
 */
export interface CodeStyle {
  /** Indentation (spaces) */
  indent: number;

  /** Quote style */
  quotes: 'single' | 'double';

  /** Semicolons */
  semi: boolean;

  /** Trailing commas */
  trailingComma: boolean;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Validate response schema */
  validateSchema: boolean;

  /** Validate response headers */
  validateHeaders: boolean;

  /** Strict validation (fail on extra fields) */
  strictValidation: boolean;

  /** Generate custom validators */
  generateCustomValidators: boolean;
}

/**
 * Test generation options (per-generation configuration)
 */
export interface TestGenerationOptions {
  /** Endpoints to generate tests for (empty = all) */
  endpoints?: string[];

  /** Tags to filter by */
  tags?: string[];

  /** Methods to filter by */
  methods?: string[];

  /** Override config for this generation */
  config?: Partial<TestGeneratorConfig>;

  /** Dry run (don't write files) */
  dryRun?: boolean;
}

/**
 * Test generation result
 */
export interface TestGenerationResult {
  /** Generated test files */
  files: GeneratedTestFile[];

  /** Total test count */
  totalTests: number;

  /** Generation statistics */
  statistics: GenerationStatistics;

  /** Warnings encountered */
  warnings: GenerationWarning[];

  /** Errors encountered */
  errors: GenerationError[];
}

/**
 * Generation statistics
 */
export interface GenerationStatistics {
  /** Total endpoints processed */
  endpointsProcessed: number;

  /** Tests by type */
  testsByType: Record<TestType, number>;

  /** Files generated */
  filesGenerated: number;

  /** Generation time (ms) */
  generationTime: number;

  /** Lines of code generated */
  linesOfCode: number;
}

/**
 * Generation warning
 */
export interface GenerationWarning {
  /** Warning message */
  message: string;

  /** Related endpoint */
  endpoint?: string;

  /** Warning code */
  code: string;

  /** Severity */
  severity: 'low' | 'medium' | 'high';
}

/**
 * Generation error
 */
export interface GenerationError {
  /** Error message */
  message: string;

  /** Related endpoint */
  endpoint?: string;

  /** Error code */
  code: string;

  /** Error stack trace */
  stack?: string;
}

/**
 * Test suite structure (collection of test files)
 */
export interface TestSuite {
  /** Suite name */
  name: string;

  /** Test files in suite */
  files: GeneratedTestFile[];

  /** Suite configuration */
  config: TestGeneratorConfig;

  /** Global fixtures */
  globalFixtures?: string[];

  /** Global helpers */
  globalHelpers?: string[];

  /** Playwright config */
  playwrightConfig?: PlaywrightConfigOptions;
}

/**
 * Playwright configuration options
 */
export interface PlaywrightConfigOptions {
  /** Test timeout */
  timeout?: number;

  /** Expect timeout */
  expectTimeout?: number;

  /** Number of retries */
  retries?: number;

  /** Number of workers */
  workers?: number;

  /** Reporter configuration */
  reporter?: string;

  /** Base URL */
  baseURL?: string;
}

/**
 * Schema-based data factory interface
 */
export interface DataFactory {
  /** Generate data from schema */
  generate(schema: SchemaObject, context: GenerationContext): unknown;

  /** Generate array of test values for a field */
  generateTestValues(schema: SchemaObject, testType: TestType): TestValue[];

  /** Generate edge case values */
  generateEdgeCases(schema: SchemaObject): TestValue[];

  /** Generate boundary values */
  generateBoundaryValues(schema: SchemaObject): TestValue[];
}

/**
 * Response validator interface
 */
export interface ResponseValidator {
  /** Generate validation code for response */
  generateValidationCode(response: ResponseObject, varName: string): string;

  /** Generate schema validation code */
  generateSchemaValidation(schema: SchemaObject, varName: string): string;

  /** Generate custom validation code */
  generateCustomValidation(rules: ValidationRule[], varName: string): string;
}

/**
 * Test organizer interface
 */
export interface TestOrganizer {
  /** Organize tests into files based on strategy */
  organizeTests(tests: TestCase[], strategy: OrganizationStrategy): GeneratedTestFile[];

  /** Generate file structure */
  generateFileStructure(suite: TestSuite): FileStructure;
}

/**
 * File structure for test suite
 */
export interface FileStructure {
  /** Root directory */
  root: string;

  /** Directories to create */
  directories: string[];

  /** Files to generate */
  files: GeneratedTestFile[];

  /** Additional files (helpers, fixtures, config) */
  additionalFiles: AdditionalFile[];
}

/**
 * Additional file (helper, fixture, config)
 */
export interface AdditionalFile {
  /** File path */
  path: string;

  /** File content */
  content: string;

  /** File type */
  type: 'helper' | 'fixture' | 'config' | 'types';
}
