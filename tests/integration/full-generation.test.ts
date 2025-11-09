/**
 * End-to-End Integration Test for Complete Generation Workflow
 * Tests the entire flow from parsing to file generation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseOpenAPIFile } from '../../src/core/openapi-parser.js';
import { TestGenerator } from '../../src/core/test-generator.js';
import type { TestCase } from '../../src/types/test-generator-types.js';
import type { TestGeneratorInterface } from '../../src/types/generator-interfaces.js';

describe('Full Generation Workflow - End-to-End', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create temporary directory for test output
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-test-gen-'));
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should complete full generation workflow from spec to files', async () => {
    // Step 1: Parse OpenAPI specification
    const specPath = path.resolve(__dirname, '../fixtures/real-world-specs/petstore.yaml');
    const spec = await parseOpenAPIFile(specPath);

    expect(spec).toBeDefined();
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe('Petstore API');

    // Step 2: Create test generator
    const generator = new TestGenerator(spec, {
      includeAuth: true,
      includeErrors: true,
      includeEdgeCases: true,
      includeFlows: true,
      outputDir: tempDir,
      organizationStrategy: 'by-tag',
    });

    expect(generator).toBeDefined();

    // Step 3: Extract endpoints
    const endpoints = generator.extractEndpoints();

    expect(endpoints.length).toBeGreaterThan(0);
    expect(endpoints[0]).toHaveProperty('path');
    expect(endpoints[0]).toHaveProperty('method');
    expect(endpoints[0]).toHaveProperty('responses');

    // Step 4: Register mock generators
    const mockHappyGen = createMockGenerator('happy-path', endpoints.length);
    const mockErrorGen = createMockGenerator('error-case', endpoints.length * 2);
    const mockEdgeGen = createMockGenerator('edge-case', endpoints.length);

    generator.setGenerator('happy-path', mockHappyGen);
    generator.setGenerator('error-case', mockErrorGen);
    generator.setGenerator('edge-case', mockEdgeGen);

    // Step 5: Generate tests
    const result = await generator.generateTests();

    expect(result).toBeDefined();
    expect(result.files).toBeDefined();
    expect(result.totalTests).toBeGreaterThan(0);
    expect(result.statistics).toBeDefined();
    expect(result.errors).toEqual([]);

    // Step 6: Verify files were generated
    expect(result.files.length).toBeGreaterThan(0);

    for (const file of result.files) {
      expect(file.filePath).toBeDefined();
      expect(file.content).toBeDefined();
      expect(file.tests.length).toBeGreaterThan(0);
      expect(file.metadata).toBeDefined();
    }

    // Step 7: Verify test content
    const firstFile = result.files[0]!;
    expect(firstFile.content).toContain("import { test, expect } from '@playwright/test'");
    expect(firstFile.content).toContain('test(');
    expect(firstFile.content).toContain('async ({ request })');

    // Step 8: Write files to disk
    for (const file of result.files) {
      const filePath = path.join(tempDir, file.filePath);
      const fileDir = path.dirname(filePath);

      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    // Step 9: Verify files exist on disk
    for (const file of result.files) {
      const filePath = path.join(tempDir, file.filePath);
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);

      // Verify file content
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe(file.content);
      expect(content.length).toBeGreaterThan(0);
    }

    // Step 10: Verify statistics
    expect(result.statistics.endpointsProcessed).toBe(endpoints.length);
    expect(result.statistics.filesGenerated).toBe(result.files.length);
    expect(result.statistics.generationTime).toBeGreaterThan(0);
    expect(result.statistics.linesOfCode).toBeGreaterThan(0);
  });

  it('should handle spec with no endpoints gracefully', async () => {
    const emptySpec = {
      version: '3.0.0',
      type: 'openapi-3.0' as const,
      info: {
        title: 'Empty API',
        version: '1.0.0',
      },
      servers: [],
      paths: {},
      security: [],
      tags: [],
    };

    const generator = new TestGenerator(emptySpec);
    const result = await generator.generateTests();

    expect(result.files).toEqual([]);
    expect(result.totalTests).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]?.message).toContain('No endpoints');
  });

  it('should generate tests with different organization strategies', async () => {
    const specPath = path.resolve(__dirname, '../fixtures/real-world-specs/petstore.yaml');
    const spec = await parseOpenAPIFile(specPath);

    const strategies = ['by-tag', 'by-type', 'by-endpoint', 'by-method'] as const;

    for (const strategy of strategies) {
      const generator = new TestGenerator(spec, {
        organizationStrategy: strategy,
        outputDir: tempDir,
      });

      const endpoints = generator.extractEndpoints();
      const mockGen = createMockGenerator('happy-path', endpoints.length);
      generator.setGenerator('happy-path', mockGen);

      const result = await generator.generateTests();

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.totalTests).toBeGreaterThan(0);
    }
  });

  it('should respect test type inclusion options', async () => {
    const specPath = path.resolve(__dirname, '../fixtures/real-world-specs/petstore.yaml');
    const spec = await parseOpenAPIFile(specPath);

    // Test with only happy path tests
    const generator = new TestGenerator(spec, {
      includeAuth: false,
      includeErrors: false,
      includeEdgeCases: false,
      includeFlows: false,
    });

    const endpoints = generator.extractEndpoints();
    const mockGen = createMockGenerator('happy-path', endpoints.length);
    generator.setGenerator('happy-path', mockGen);

    const result = await generator.generateTests();

    // Should only have happy path tests
    expect(result.totalTests).toBe(endpoints.length);
  });

  it('should extract correct endpoint information', async () => {
    const specPath = path.resolve(__dirname, '../fixtures/real-world-specs/petstore.yaml');
    const spec = await parseOpenAPIFile(specPath);

    const generator = new TestGenerator(spec);
    const endpoints = generator.extractEndpoints();

    // Verify endpoint structure
    for (const endpoint of endpoints) {
      expect(endpoint.path).toBeTruthy();
      expect(endpoint.method).toMatch(/^(get|post|put|patch|delete|options|head|trace)$/);
      expect(endpoint.responses).toBeDefined();
      expect(endpoint.responses.size).toBeGreaterThan(0);
      expect(Array.isArray(endpoint.parameters)).toBe(true);
      expect(Array.isArray(endpoint.tags)).toBe(true);
      expect(Array.isArray(endpoint.security)).toBe(true);
    }
  });

  it('should handle errors gracefully', async () => {
    const spec = {
      version: '3.0.0',
      type: 'openapi-3.0' as const,
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [],
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      },
      security: [],
      tags: [],
    };

    const generator = new TestGenerator(spec);

    // Register a generator that throws an error
    const errorGen: TestGeneratorInterface = {
      generateTests: () => {
        throw new Error('Test generator error');
      },
    };

    generator.setGenerator('happy-path', errorGen);

    const result = await generator.generateTests();

    // Should handle error and return error in result
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('error');
  });
});

/**
 * Create a mock test generator for testing
 */
function createMockGenerator(type: string, testCount: number): TestGeneratorInterface {
  return {
    generateTests: (endpoints) => {
      const tests: TestCase[] = [];

      for (let i = 0; i < Math.min(testCount, endpoints.length); i++) {
        const endpoint = endpoints[i]!;
        tests.push({
          id: `test-${type}-${i}`,
          name: `${type} test for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
          description: `Test ${type} scenario`,
          type: type as any,
          method: endpoint.method,
          endpoint: endpoint.path,
          request: {
            pathParams: {},
            queryParams: {},
            headers: {},
          },
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: endpoint.tags,
            priority: 'medium',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '0.1.0',
          },
        });
      }

      return tests;
    },
  };
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
