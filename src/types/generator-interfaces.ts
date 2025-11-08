/**
 * Generator Interfaces - Define contracts for all test generators
 * These interfaces ensure consistent integration across all generator modules
 */

import type { ApiEndpoint } from './openapi-types.js';
import type { TestCase, OrganizationStrategy, GeneratedTestFile } from './test-generator-types.js';

/**
 * Base generator interface that all test generators must implement
 */
export interface TestGeneratorInterface {
  /**
   * Generate test cases for given endpoints
   * @param endpoints - API endpoints to generate tests for
   * @returns Array of generated test cases
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Happy Path Test Generator Interface
 * Generates tests for successful scenarios with valid inputs
 */
export interface HappyPathGeneratorInterface extends TestGeneratorInterface {
  /**
   * Generate happy path tests for endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Error Case Test Generator Interface
 * Generates tests for error scenarios (4xx, 5xx responses)
 */
export interface ErrorCaseGeneratorInterface extends TestGeneratorInterface {
  /**
   * Generate error case tests for endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Edge Case Test Generator Interface
 * Generates tests for boundary values and edge conditions
 */
export interface EdgeCaseGeneratorInterface extends TestGeneratorInterface {
  /**
   * Generate edge case tests for endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Auth Test Generator Interface
 * Generates tests for authentication and authorization
 */
export interface AuthTestGeneratorInterface extends TestGeneratorInterface {
  /**
   * Generate authentication tests for endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Flow Test Generator Interface
 * Generates tests for multi-step API workflows
 */
export interface FlowGeneratorInterface {
  /**
   * Generate workflow tests for related endpoints
   * @param endpoints - API endpoints to analyze for workflows
   * @returns Array of workflow test cases
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[];
}

/**
 * Test Organizer Interface
 * Organizes test cases into files based on strategy
 */
export interface TestOrganizerInterface {
  /**
   * Organize tests into files based on organization strategy
   * @param tests - Test cases to organize
   * @param strategy - Organization strategy to use
   * @returns Array of generated test files
   */
  organize(tests: TestCase[], strategy: OrganizationStrategy): OrganizedTests;
}

/**
 * Organized tests structure
 */
export interface OrganizedTests {
  /** Test files organized by strategy */
  files: Map<string, TestCase[]>;

  /** Metadata about organization */
  metadata: {
    strategy: OrganizationStrategy;
    fileCount: number;
    testCount: number;
  };
}

/**
 * Code Generator Interface
 * Generates actual Playwright test code from test cases
 */
export interface CodeGeneratorInterface {
  /**
   * Generate test files from organized tests
   * @param organized - Organized test structure
   * @returns Array of generated test files with content
   */
  generateFiles(organized: OrganizedTests): GeneratedTestFile[];

  /**
   * Generate a single test file
   * @param fileName - Name of the test file
   * @param tests - Test cases to include
   * @returns Generated test file
   */
  generateFile(fileName: string, tests: TestCase[]): GeneratedTestFile;
}

/**
 * Endpoint Extractor Interface
 * Extracts API endpoints from parsed OpenAPI spec
 */
export interface EndpointExtractorInterface {
  /**
   * Extract all API endpoints from specification
   * @returns Array of API endpoints
   */
  extractEndpoints(): ApiEndpoint[];

  /**
   * Filter endpoints by criteria
   * @param filter - Filter criteria
   * @returns Filtered endpoints
   */
  filterEndpoints(filter: EndpointFilter): ApiEndpoint[];
}

/**
 * Endpoint filter criteria
 */
export interface EndpointFilter {
  /** Filter by tags */
  tags?: string[];

  /** Filter by HTTP methods */
  methods?: string[];

  /** Filter by path pattern */
  pathPattern?: RegExp;

  /** Filter by authentication requirement */
  requiresAuth?: boolean;
}
