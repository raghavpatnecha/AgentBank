/**
 * Test Organizer - Organizes test cases into files based on different strategies
 * Supports organization by tag, endpoint, type, and method
 */

import type {
  TestCase,
  GeneratedTestFile,
  OrganizationStrategy,
  FileMetadata,
} from '../types/test-generator-types.js';

/**
 * Organized tests structure
 */
export interface OrganizedTests {
  /** Map of filename to test cases */
  files: Map<string, TestCase[]>;

  /** Organization strategy used */
  strategy: OrganizationStrategy;

  /** Total test count */
  totalTests: number;
}

/**
 * Test Organizer
 * Organizes test cases into files based on different strategies
 */
export class TestOrganizer {
  /**
   * Organize tests based on strategy
   */
  organize(tests: TestCase[], strategy: OrganizationStrategy): OrganizedTests {
    const files = new Map<string, TestCase[]>();

    switch (strategy) {
      case 'by-tag':
        this.organizeByTag(tests, files);
        break;

      case 'by-endpoint':
        this.organizeByEndpoint(tests, files);
        break;

      case 'by-type':
        this.organizeByType(tests, files);
        break;

      case 'by-method':
        this.organizeByMethod(tests, files);
        break;

      case 'flat':
        this.organizeFlat(tests, files);
        break;

      default:
        throw new Error(`Unknown organization strategy: ${strategy}`);
    }

    return {
      files,
      strategy,
      totalTests: tests.length,
    };
  }

  /**
   * Organize tests by OpenAPI tags
   * Groups tests by their primary tag (users.spec.ts, products.spec.ts)
   */
  private organizeByTag(tests: TestCase[], files: Map<string, TestCase[]>): void {
    for (const test of tests) {
      const primaryTag = test.metadata.tags[0] ?? 'untagged';
      const filename = `${this.sanitizeFilename(primaryTag)}.spec.ts`;

      if (!files.has(filename)) {
        files.set(filename, []);
      }

      files.get(filename)!.push(test);
    }
  }

  /**
   * Organize tests by endpoint path
   * One file per endpoint (or similar endpoints grouped)
   */
  private organizeByEndpoint(tests: TestCase[], files: Map<string, TestCase[]>): void {
    for (const test of tests) {
      // Extract base endpoint (remove parameters)
      const baseEndpoint = this.getBaseEndpoint(test.endpoint);
      const filename = `${this.sanitizeFilename(baseEndpoint)}.spec.ts`;

      if (!files.has(filename)) {
        files.set(filename, []);
      }

      files.get(filename)!.push(test);
    }
  }

  /**
   * Organize tests by test type
   * Groups by happy-path, error-case, auth, etc.
   */
  private organizeByType(tests: TestCase[], files: Map<string, TestCase[]>): void {
    for (const test of tests) {
      const filename = `${test.type}.spec.ts`;

      if (!files.has(filename)) {
        files.set(filename, []);
      }

      files.get(filename)!.push(test);
    }
  }

  /**
   * Organize tests by HTTP method
   * Groups by GET, POST, PUT, DELETE, etc.
   */
  private organizeByMethod(tests: TestCase[], files: Map<string, TestCase[]>): void {
    for (const test of tests) {
      const method = test.method.toLowerCase();
      const filename = `${method}-tests.spec.ts`;

      if (!files.has(filename)) {
        files.set(filename, []);
      }

      files.get(filename)!.push(test);
    }
  }

  /**
   * Organize tests in a flat structure (all in one directory)
   */
  private organizeFlat(tests: TestCase[], files: Map<string, TestCase[]>): void {
    const filename = 'all-tests.spec.ts';
    files.set(filename, [...tests]);
  }

  /**
   * Generate test files from organized tests
   */
  generateTestFiles(organized: OrganizedTests): GeneratedTestFile[] {
    const testFiles: GeneratedTestFile[] = [];

    for (const [filename, tests] of organized.files.entries()) {
      const content = this.generateFileContent(tests);
      const metadata = this.generateFileMetadata(tests);

      testFiles.push({
        filePath: filename,
        fileName: filename,
        content,
        tests,
        imports: this.generateImports(),
        metadata,
      });
    }

    return testFiles;
  }

  /**
   * Generate file content for a test file
   */
  private generateFileContent(tests: TestCase[]): string {
    const lines: string[] = [];

    // Add imports
    lines.push(...this.generateImports());
    lines.push('');

    // Group tests by endpoint for better organization
    const grouped = this.groupTestsByEndpoint(tests);

    for (const [endpoint, endpointTests] of grouped.entries()) {
      lines.push(`describe('${endpoint}', () => {`);

      for (const test of endpointTests) {
        lines.push(this.generateTestCode(test));
        lines.push('');
      }

      lines.push('});');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate imports for test file
   */
  private generateImports(): string[] {
    return [
      "import { test, expect } from '@playwright/test';",
    ];
  }

  /**
   * Generate test code for a single test case
   */
  private generateTestCode(test: TestCase): string {
    const lines: string[] = [];
    const indent = '  ';

    lines.push(`${indent}test('${test.name}', async ({ request }) => {`);
    lines.push(`${indent}  // ${test.description}`);

    // Generate request
    const method = test.method.toLowerCase();
    const path = test.endpoint;

    if (test.request.body) {
      lines.push(`${indent}  const response = await request.${method}('${path}', {`);
      lines.push(`${indent}    data: ${JSON.stringify(test.request.body.data, null, 6).split('\n').join(`\n${indent}    `)}`);
      lines.push(`${indent}  });`);
    } else {
      lines.push(`${indent}  const response = await request.${method}('${path}');`);
    }

    // Generate assertions
    const expectedStatus = Array.isArray(test.expectedResponse.status)
      ? test.expectedResponse.status[0]
      : test.expectedResponse.status;

    lines.push(`${indent}  expect(response.status()).toBe(${expectedStatus});`);

    // Add body validation if present
    if (test.expectedResponse.body) {
      lines.push(`${indent}  const data = await response.json();`);

      if (test.expectedResponse.body.partialMatch) {
        for (const [key, value] of Object.entries(test.expectedResponse.body.partialMatch)) {
          lines.push(`${indent}  expect(data.${key}).toBe(${JSON.stringify(value)});`);
        }
      }
    }

    lines.push(`${indent}});`);

    return lines.join('\n');
  }

  /**
   * Group tests by endpoint for organization
   */
  private groupTestsByEndpoint(tests: TestCase[]): Map<string, TestCase[]> {
    const groups = new Map<string, TestCase[]>();

    for (const test of tests) {
      const endpoint = this.getBaseEndpoint(test.endpoint);

      if (!groups.has(endpoint)) {
        groups.set(endpoint, []);
      }

      groups.get(endpoint)!.push(test);
    }

    return groups;
  }

  /**
   * Generate file metadata
   */
  private generateFileMetadata(tests: TestCase[]): FileMetadata {
    const endpoints = [...new Set(tests.map((t) => t.endpoint))];
    const testTypes = [...new Set(tests.map((t) => t.type))];
    const tags = [...new Set(tests.flatMap((t) => t.metadata.tags))];

    return {
      endpoints,
      testTypes,
      testCount: tests.length,
      tags,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get base endpoint (remove path parameters)
   */
  private getBaseEndpoint(endpoint: string): string {
    return endpoint.replace(/\/\{[^}]+\}/g, '');
  }

  /**
   * Sanitize filename (remove special characters)
   */
  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get file path for a test based on strategy
   */
  getFilePath(test: TestCase, strategy: OrganizationStrategy): string {
    switch (strategy) {
      case 'by-tag': {
        const tag = test.metadata.tags[0] ?? 'untagged';
        return `${this.sanitizeFilename(tag)}.spec.ts`;
      }

      case 'by-endpoint': {
        const endpoint = this.getBaseEndpoint(test.endpoint);
        return `${this.sanitizeFilename(endpoint)}.spec.ts`;
      }

      case 'by-type':
        return `${test.type}.spec.ts`;

      case 'by-method':
        return `${test.method.toLowerCase()}-tests.spec.ts`;

      case 'flat':
        return 'all-tests.spec.ts';

      default:
        return 'default.spec.ts';
    }
  }

  /**
   * Get recommended strategy based on test count and distribution
   */
  getRecommendedStrategy(tests: TestCase[]): OrganizationStrategy {
    const tagCount = new Set(tests.flatMap((t) => t.metadata.tags)).size;
    const endpointCount = new Set(tests.map((t) => this.getBaseEndpoint(t.endpoint))).size;
    const typeCount = new Set(tests.map((t) => t.type)).size;

    // If many tags, organize by tag
    if (tagCount > 5 && tagCount < endpointCount) {
      return 'by-tag';
    }

    // If many endpoints, organize by endpoint
    if (endpointCount > 10) {
      return 'by-endpoint';
    }

    // If diverse test types, organize by type
    if (typeCount > 3) {
      return 'by-type';
    }

    // Default to by-tag
    return 'by-tag';
  }
}
