/**
 * File Structure Generator - Generates complete file structure for test suites
 * Creates directories, test files, index files, and additional helper files
 */

import type {
  GeneratedTestFile,
  FileStructure,
  AdditionalFile,
  TestSuite,
} from '../types/test-generator-types.js';

/**
 * Generate file structure for organized tests
 */
export function generateFileStructure(
  files: GeneratedTestFile[],
  outputDir: string = 'generated-tests'
): FileStructure {
  const directories = generateDirectories(files, outputDir);
  const additionalFiles = generateAdditionalFiles(files, outputDir);

  return {
    root: outputDir,
    directories,
    files,
    additionalFiles,
  };
}

/**
 * Generate directories needed for test structure
 */
function generateDirectories(files: GeneratedTestFile[], outputDir: string): string[] {
  const directories = new Set<string>();

  // Add root directory
  directories.add(outputDir);

  // Add directories for each file
  for (const file of files) {
    const dir = getDirectoryPath(file.filePath, outputDir);
    if (dir !== outputDir) {
      directories.add(dir);
    }
  }

  // Add common directories
  directories.add(`${outputDir}/fixtures`);
  directories.add(`${outputDir}/helpers`);

  return Array.from(directories).sort();
}

/**
 * Get directory path from file path
 */
function getDirectoryPath(filePath: string, outputDir: string): string {
  const parts = filePath.split('/');
  if (parts.length === 1) {
    return outputDir;
  }

  parts.pop(); // Remove filename
  return `${outputDir}/${parts.join('/')}`;
}

/**
 * Generate index file that imports all test files
 */
export function generateIndexFile(files: GeneratedTestFile[]): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Generated Test Suite Index');
  lines.push(' * Auto-generated - DO NOT EDIT');
  lines.push(' */');
  lines.push('');

  // Add imports for all test files
  for (const file of files) {
    const importPath = `./${file.fileName.replace('.ts', '.js')}`;
    lines.push(`import '${importPath}';`);
  }

  lines.push('');
  lines.push('// Test files imported successfully');
  lines.push(`// Total files: ${files.length}`);
  lines.push(`// Generated at: ${new Date().toISOString()}`);

  return lines.join('\n');
}

/**
 * Generate additional helper files
 */
function generateAdditionalFiles(files: GeneratedTestFile[], outputDir: string): AdditionalFile[] {
  const additionalFiles: AdditionalFile[] = [];

  // Generate index file
  additionalFiles.push({
    path: `${outputDir}/index.ts`,
    content: generateIndexFile(files),
    type: 'config',
  });

  // Generate test helpers
  additionalFiles.push({
    path: `${outputDir}/helpers/test-helpers.ts`,
    content: generateTestHelpers(),
    type: 'helper',
  });

  // Generate fixtures
  additionalFiles.push({
    path: `${outputDir}/fixtures/test-data.ts`,
    content: generateTestDataFixtures(),
    type: 'fixture',
  });

  // Generate types
  additionalFiles.push({
    path: `${outputDir}/types/test-types.ts`,
    content: generateTestTypes(),
    type: 'types',
  });

  // Generate README
  additionalFiles.push({
    path: `${outputDir}/README.md`,
    content: generateReadme(files),
    type: 'config',
  });

  return additionalFiles;
}

/**
 * Generate test helper functions
 */
function generateTestHelpers(): string {
  return `/**
 * Test Helper Functions
 * Common utilities for API testing
 */

import { expect, type APIResponse } from '@playwright/test';

/**
 * Validate response status code
 */
export async function expectStatus(response: APIResponse, status: number): Promise<void> {
  expect(response.status()).toBe(status);
}

/**
 * Validate response contains JSON
 */
export async function expectJSON(response: APIResponse): Promise<unknown> {
  const contentType = response.headers()['content-type'];
  expect(contentType).toContain('application/json');
  return await response.json();
}

/**
 * Validate response schema (basic validation)
 */
export function expectSchema(data: unknown, schema: Record<string, string>): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Data is not an object');
  }

  const obj = data as Record<string, unknown>;

  for (const [key, type] of Object.entries(schema)) {
    expect(obj).toHaveProperty(key);
    expect(typeof obj[key]).toBe(type);
  }
}

/**
 * Extract ID from response
 */
export async function extractId(response: APIResponse): Promise<string | number> {
  const data = await response.json();
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return (data as { id: string | number }).id;
  }
  throw new Error('Response does not contain an id field');
}

/**
 * Wait for resource to be ready
 */
export async function waitForResource(
  fn: () => Promise<APIResponse>,
  maxAttempts: number = 5,
  delayMs: number = 1000
): Promise<APIResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fn();
    if (response.ok()) {
      return response;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Resource not ready after maximum attempts');
}
`;
}

/**
 * Generate test data fixtures
 */
function generateTestDataFixtures(): string {
  return `/**
 * Test Data Fixtures
 * Reusable test data for API testing
 */

export const testUsers = {
  valid: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
  },
  invalid: {
    name: '',
    email: 'invalid-email',
    age: -1,
  },
};

export const testProducts = {
  valid: {
    name: 'Test Product',
    price: 99.99,
    stock: 100,
  },
  invalid: {
    name: '',
    price: -10,
    stock: -1,
  },
};

/**
 * Generate random test data
 */
export function generateTestId(): string {
  return \`test-\${Date.now()}-\${Math.random().toString(36).substring(7)}\`;
}

/**
 * Generate timestamp
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}
`;
}

/**
 * Generate TypeScript types for tests
 */
function generateTestTypes(): string {
  return `/**
 * Test Types
 * TypeScript type definitions for test data
 */

export interface TestUser {
  id?: string | number;
  name: string;
  email: string;
  age?: number;
}

export interface TestProduct {
  id?: string | number;
  name: string;
  price: number;
  stock: number;
}

export interface APIError {
  message: string;
  code?: string;
  details?: unknown;
}
`;
}

/**
 * Generate README for test suite
 */
function generateReadme(files: GeneratedTestFile[]): string {
  const testCount = files.reduce((sum, file) => sum + file.tests.length, 0);
  const endpoints = new Set(files.flatMap((f) => f.metadata.endpoints));
  const tags = new Set(files.flatMap((f) => f.metadata.tags));

  return `# Generated API Test Suite

Auto-generated Playwright API tests from OpenAPI specification.

## Overview

- **Total Files**: ${files.length}
- **Total Tests**: ${testCount}
- **Endpoints Covered**: ${endpoints.size}
- **Tags**: ${Array.from(tags).join(', ')}
- **Generated**: ${new Date().toISOString()}

## Structure

\`\`\`
generated-tests/
├── index.ts           # Import all test files
├── helpers/           # Test helper functions
├── fixtures/          # Test data fixtures
├── types/             # TypeScript type definitions
${files.map((f) => `├── ${f.fileName}`).join('\n')}
\`\`\`

## Running Tests

\`\`\`bash
# Run all tests
npx playwright test generated-tests

# Run specific file
npx playwright test generated-tests/${files[0]?.fileName ?? 'tests.spec.ts'}

# Run with specific tag
npx playwright test --grep @tag-name
\`\`\`

## Test Files

${files
  .map(
    (f) =>
      `### ${f.fileName}\n- Tests: ${f.tests.length}\n- Endpoints: ${f.metadata.endpoints.join(', ')}\n- Types: ${f.metadata.testTypes.join(', ')}`
  )
  .join('\n\n')}

## Notes

- These tests were auto-generated from an OpenAPI specification
- Review and modify as needed for your specific use case
- Add authentication configuration in your Playwright config
- Update base URLs and test data as needed
`;
}

/**
 * Generate complete test suite structure
 */
export function generateTestSuite(
  suite: TestSuite,
  outputDir: string = 'generated-tests'
): FileStructure {
  const structure = generateFileStructure(suite.files, outputDir);

  // Add global fixtures if present
  if (suite.globalFixtures && suite.globalFixtures.length > 0) {
    structure.additionalFiles.push({
      path: `${outputDir}/fixtures/global-fixtures.ts`,
      content: suite.globalFixtures.join('\n\n'),
      type: 'fixture',
    });
  }

  // Add global helpers if present
  if (suite.globalHelpers && suite.globalHelpers.length > 0) {
    structure.additionalFiles.push({
      path: `${outputDir}/helpers/global-helpers.ts`,
      content: suite.globalHelpers.join('\n\n'),
      type: 'helper',
    });
  }

  return structure;
}

/**
 * Generate directory tree visualization
 */
export function visualizeStructure(structure: FileStructure): string {
  const lines: string[] = [];

  lines.push(`${structure.root}/`);

  // Add directories
  const dirs = structure.directories
    .filter((d) => d !== structure.root)
    .map((d) => d.replace(`${structure.root}/`, ''));

  for (const dir of dirs) {
    lines.push(`├── ${dir}/`);
  }

  // Add files
  for (const file of structure.files) {
    lines.push(`├── ${file.fileName}`);
  }

  // Add additional files
  for (const file of structure.additionalFiles) {
    const relativePath = file.path.replace(`${structure.root}/`, '');
    lines.push(`├── ${relativePath}`);
  }

  return lines.join('\n');
}
