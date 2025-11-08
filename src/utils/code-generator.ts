/**
 * Code Generator - Generates complete Playwright test files
 * Converts TestCase objects into executable TypeScript test code
 */

import type { TestCase } from '../types/test-generator-types.js';
import type { FileMetadata } from '../types/test-generator-types.js';
import { ResponseValidatorGenerator } from '../generators/response-validator-generator.js';

/**
 * Options for code generation
 */
export interface CodeGeneratorOptions {
  /** Use TypeScript (default: true) */
  typescript?: boolean;
  /** Add detailed comments */
  addComments?: boolean;
  /** Indentation size */
  indent?: number;
  /** Quote style */
  quotes?: 'single' | 'double';
  /** Add semicolons */
  semi?: boolean;
  /** Base URL for API */
  baseURL?: string;
}

/**
 * Code Generator
 * Generates Playwright test files from test cases
 */
export class CodeGenerator {
  private options: Required<CodeGeneratorOptions>;
  private validatorGenerator: ResponseValidatorGenerator;

  constructor(options: CodeGeneratorOptions = {}) {
    this.options = {
      typescript: options.typescript ?? true,
      addComments: options.addComments ?? true,
      indent: options.indent ?? 2,
      quotes: options.quotes ?? 'single',
      semi: options.semi ?? true,
      baseURL: options.baseURL ?? 'http://localhost:3000',
    };

    this.validatorGenerator = new ResponseValidatorGenerator({
      addComments: this.options.addComments,
    });
  }

  /**
   * Generate a complete test file from test cases
   */
  generateTestFile(testCases: TestCase[], metadata: FileMetadata): string {
    const sections: string[] = [];

    // File header
    sections.push(this.generateFileHeader(metadata));
    sections.push('');

    // Imports
    sections.push(this.generateImports());
    sections.push('');

    // Test describe block
    sections.push(this.generateDescribeBlock(testCases, metadata));

    return sections.join('\n');
  }

  /**
   * Generate file header comment
   */
  private generateFileHeader(metadata: FileMetadata): string {
    if (!this.options.addComments) return '';

    const lines: string[] = [
      '/**',
      ` * Generated API Tests`,
      ` * Generated at: ${metadata.generatedAt}`,
      ` * Endpoints: ${metadata.endpoints.join(', ')}`,
      ` * Tags: ${metadata.tags.join(', ')}`,
      ` * Test count: ${metadata.testCount}`,
      ' */',
    ];

    return lines.join('\n');
  }

  /**
   * Generate import statements
   */
  private generateImports(): string {
    const q = this.q;
    const imports: string[] = [];

    imports.push(`import { test, expect } from ${q}@playwright/test${q}${this.semi}`);

    return imports.join('\n');
  }

  /**
   * Generate test describe block
   */
  private generateDescribeBlock(testCases: TestCase[], metadata: FileMetadata): string {
    const lines: string[] = [];
    const q = this.q;

    // Group tests by endpoint or tag
    const groupName = this.getGroupName(metadata);

    lines.push(`test.describe(${q}${groupName}${q}, () => {`);

    // Generate each test
    for (const testCase of testCases) {
      lines.push('');
      lines.push(this.indent(this.generateTest(testCase), 1));
    }

    lines.push('});');

    return lines.join('\n');
  }

  /**
   * Generate a single test
   */
  private generateTest(testCase: TestCase): string {
    const lines: string[] = [];
    const q = this.q;

    // Test comment
    if (this.options.addComments && testCase.description) {
      lines.push(`// ${testCase.description}`);
    }

    // Test declaration
    lines.push(`test(${q}${testCase.name}${q}, async ({ request }) => {`);

    // Test body
    const testBody = this.generateTestBody(testCase);
    lines.push(this.indent(testBody, 1));

    lines.push(`})${this.semi}`);

    return lines.join('\n');
  }

  /**
   * Generate test body
   */
  private generateTestBody(testCase: TestCase): string {
    const lines: string[] = [];

    // Build endpoint URL with path params
    const url = this.buildEndpointUrl(testCase);
    lines.push(`const endpoint = ${this.q}${url}${this.q}${this.semi}`);
    lines.push('');

    // Build request options
    const requestOptions = this.buildRequestOptions(testCase);

    // Make API call
    lines.push(this.generateApiCall(testCase, requestOptions));
    lines.push('');

    // Validate response
    lines.push(this.generateResponseValidation(testCase));

    return lines.join('\n');
  }

  /**
   * Build endpoint URL with path parameters
   */
  private buildEndpointUrl(testCase: TestCase): string {
    let url = testCase.endpoint;

    // Replace path parameters
    if (testCase.request.pathParams) {
      for (const [name, param] of Object.entries(testCase.request.pathParams)) {
        const value = param.value;
        url = url.replace(`{${name}}`, String(value));
      }
    }

    return url;
  }

  /**
   * Build request options object
   */
  private buildRequestOptions(testCase: TestCase): string[] {
    const options: string[] = [];

    // Query parameters
    if (testCase.request.queryParams && Object.keys(testCase.request.queryParams).length > 0) {
      const params: string[] = [];
      for (const [name, param] of Object.entries(testCase.request.queryParams)) {
        const value = JSON.stringify(param.value);
        params.push(`${this.indent(`${name}: ${value}`, 2)}`);
      }
      options.push(`params: {`);
      options.push(params.join(',\n'));
      options.push(`}`);
    }

    // Request body
    if (testCase.request.body) {
      const data = JSON.stringify(testCase.request.body.data, null, this.options.indent);
      options.push(`data: ${data}`);
    }

    // Headers
    if (testCase.request.headers && Object.keys(testCase.request.headers).length > 0) {
      const headers: string[] = [];
      for (const [name, value] of Object.entries(testCase.request.headers)) {
        headers.push(`${this.indent(`${this.q}${name}${this.q}: ${this.q}${value}${this.q}`, 2)}`);
      }
      options.push(`headers: {`);
      options.push(headers.join(',\n'));
      options.push(`}`);
    }

    return options;
  }

  /**
   * Generate API call code
   */
  private generateApiCall(testCase: TestCase, requestOptions: string[]): string {
    const method = testCase.method.toLowerCase();
    const lines: string[] = [];

    if (requestOptions.length === 0) {
      lines.push(`const response = await request.${method}(endpoint)${this.semi}`);
    } else {
      lines.push(`const response = await request.${method}(endpoint, {`);
      lines.push(this.indent(requestOptions.join(',\n'), 1));
      lines.push(`})${this.semi}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate response validation code
   */
  private generateResponseValidation(testCase: TestCase): string {
    const lines: string[] = [];
    const expectedResponse = testCase.expectedResponse;

    // Status code validation
    if (this.options.addComments) {
      lines.push('// Validate response status');
    }
    lines.push(this.validatorGenerator.generateStatusValidation(expectedResponse.status));
    lines.push('');

    // Body validation
    if (expectedResponse.body?.schema) {
      if (this.options.addComments) {
        lines.push('// Validate response body');
      }
      lines.push('const body = await response.json();');
      lines.push('');
      lines.push(this.validatorGenerator.generateValidation(expectedResponse.body.schema));
    }

    // Header validation
    if (expectedResponse.headers) {
      if (this.options.addComments) {
        lines.push('');
        lines.push('// Validate response headers');
      }
      for (const [name, value] of Object.entries(expectedResponse.headers)) {
        lines.push(this.validatorGenerator.generateHeaderValidation(name, value));
      }
    }

    return lines.join('\n');
  }

  /**
   * Get group name from metadata
   */
  private getGroupName(metadata: FileMetadata): string {
    if (metadata.tags.length > 0) {
      return `${metadata.tags[0]} API`;
    }
    if (metadata.endpoints.length > 0) {
      return metadata.endpoints[0] || 'API Tests';
    }
    return 'API Tests';
  }

  /**
   * Indent text
   */
  private indent(text: string, level: number): string {
    const indentStr = ' '.repeat(this.options.indent * level);
    return text
      .split('\n')
      .map((line) => (line.trim() ? indentStr + line : line))
      .join('\n');
  }

  /**
   * Get quote character
   */
  private get q(): string {
    return this.options.quotes === 'single' ? "'" : '"';
  }

  /**
   * Get semicolon
   */
  private get semi(): string {
    return this.options.semi ? ';' : '';
  }

  /**
   * Generate multiple test files
   */
  generateTestFiles(
    testCasesByFile: Map<string, TestCase[]>,
    metadataByFile: Map<string, FileMetadata>
  ): Map<string, string> {
    const files = new Map<string, string>();

    for (const [fileName, testCases] of testCasesByFile.entries()) {
      const metadata = metadataByFile.get(fileName);
      if (metadata) {
        const content = this.generateTestFile(testCases, metadata);
        files.set(fileName, content);
      }
    }

    return files;
  }
}

/**
 * Convenience function to generate a test file
 */
export function generateTestFile(
  testCases: TestCase[],
  metadata: FileMetadata,
  options?: CodeGeneratorOptions
): string {
  const generator = new CodeGenerator(options);
  return generator.generateTestFile(testCases, metadata);
}
