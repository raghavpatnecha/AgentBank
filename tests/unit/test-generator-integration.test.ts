/**
 * Unit Tests for TestGenerator Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestGenerator } from '../../src/core/test-generator.js';
import type { ParsedApiSpec } from '../../src/types/openapi-types.js';
import type { TestCase } from '../../src/types/test-generator-types.js';
import type { TestGeneratorInterface } from '../../src/types/generator-interfaces.js';

describe('TestGenerator Integration', () => {
  let mockSpec: ParsedApiSpec;

  beforeEach(() => {
    mockSpec = createMockSpec();
  });

  describe('constructor', () => {
    it('should create generator with default options', () => {
      const generator = new TestGenerator(mockSpec);

      expect(generator).toBeDefined();
      expect(generator.getBaseUrl()).toBe('https://api.example.com');
      expect(generator.getApiInfo()).toEqual(mockSpec.info);
    });

    it('should create generator with custom options', () => {
      const generator = new TestGenerator(mockSpec, {
        includeAuth: false,
        includeErrors: false,
        includeEdgeCases: false,
        baseUrl: 'https://custom.api.com',
        outputDir: './custom-output',
        organizationStrategy: 'by-endpoint',
      });

      expect(generator).toBeDefined();
      expect(generator.getBaseUrl()).toBe('https://custom.api.com');
    });
  });

  describe('extractEndpoints', () => {
    it('should extract all endpoints from spec', () => {
      const generator = new TestGenerator(mockSpec);
      const endpoints = generator.extractEndpoints();

      expect(endpoints.length).toBe(3); // GET, POST, DELETE /pets
      expect(endpoints[0]?.path).toBe('/pets');
      expect(endpoints[0]?.method).toBe('get');
    });

    it('should extract endpoint metadata correctly', () => {
      const generator = new TestGenerator(mockSpec);
      const endpoints = generator.extractEndpoints();

      const getEndpoint = endpoints.find((e) => e.method === 'get');
      expect(getEndpoint).toBeDefined();
      expect(getEndpoint?.operationId).toBe('listPets');
      expect(getEndpoint?.summary).toBe('List all pets');
      expect(getEndpoint?.tags).toContain('pets');
    });

    it('should extract parameters correctly', () => {
      const generator = new TestGenerator(mockSpec);
      const endpoints = generator.extractEndpoints();

      const getEndpoint = endpoints.find((e) => e.method === 'get');
      expect(getEndpoint?.parameters).toBeDefined();
      expect(Array.isArray(getEndpoint?.parameters)).toBe(true);
    });

    it('should extract responses correctly', () => {
      const generator = new TestGenerator(mockSpec);
      const endpoints = generator.extractEndpoints();

      const getEndpoint = endpoints.find((e) => e.method === 'get');
      expect(getEndpoint?.responses).toBeDefined();
      expect(getEndpoint?.responses.size).toBeGreaterThan(0);
      expect(getEndpoint?.responses.has(200)).toBe(true);
    });

    it('should handle spec with no paths', () => {
      const emptySpec = {
        ...mockSpec,
        paths: {},
      };

      const generator = new TestGenerator(emptySpec);
      const endpoints = generator.extractEndpoints();

      expect(endpoints).toEqual([]);
    });
  });

  describe('generator registration', () => {
    it('should register generators correctly', () => {
      const generator = new TestGenerator(mockSpec);
      const mockGen = createMockGenerator('happy-path');

      generator.setGenerator('happy-path', mockGen);

      expect(generator.hasGenerator('happy-path')).toBe(true);
      expect(generator.getGeneratorCount()).toBe(1);
    });

    it('should track multiple generators', () => {
      const generator = new TestGenerator(mockSpec);

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));
      generator.setGenerator('error-case', createMockGenerator('error-case'));
      generator.setGenerator('edge-case', createMockGenerator('edge-case'));

      expect(generator.getGeneratorCount()).toBe(3);
      expect(generator.hasGenerator('happy-path')).toBe(true);
      expect(generator.hasGenerator('error-case')).toBe(true);
      expect(generator.hasGenerator('edge-case')).toBe(true);
    });

    it('should check for non-existent generators', () => {
      const generator = new TestGenerator(mockSpec);

      expect(generator.hasGenerator('non-existent')).toBe(false);
    });
  });

  describe('generateTests', () => {
    it('should generate tests using registered generators', async () => {
      const generator = new TestGenerator(mockSpec, {
        includeAuth: false,
        includeErrors: false,
        includeEdgeCases: false,
        includeFlows: false,
      });

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));

      const result = await generator.generateTests();

      expect(result).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.totalTests).toBeGreaterThan(0);
    });

    it('should use all enabled generator types', async () => {
      const generator = new TestGenerator(mockSpec, {
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: false,
      });

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));
      generator.setGenerator('error-case', createMockGenerator('error-case'));
      generator.setGenerator('edge-case', createMockGenerator('edge-case'));
      generator.setGenerator('auth', createMockGenerator('auth'));

      const result = await generator.generateTests();

      expect(result.totalTests).toBeGreaterThan(0);
      expect(Object.keys(result.statistics.testsByType).length).toBeGreaterThan(1);
    });

    it('should respect includeAuth option', async () => {
      const generator = new TestGenerator(mockSpec, {
        includeAuth: false,
        includeErrors: false,
        includeEdgeCases: false,
        includeFlows: false,
      });

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));
      generator.setGenerator('auth', createMockGenerator('auth'));

      const result = await generator.generateTests();

      // Should not have auth tests
      expect(result.statistics.testsByType['auth']).toBeUndefined();
    });

    it('should respect includeErrors option', async () => {
      const generator = new TestGenerator(mockSpec, {
        includeAuth: false,
        includeErrors: false,
        includeEdgeCases: false,
        includeFlows: false,
      });

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));
      generator.setGenerator('error-case', createMockGenerator('error-case'));

      const result = await generator.generateTests();

      // Should not have error tests
      expect(result.statistics.testsByType['error-case']).toBeUndefined();
    });

    it('should collect accurate statistics', async () => {
      const generator = new TestGenerator(mockSpec);

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));

      const result = await generator.generateTests();

      expect(result.statistics.endpointsProcessed).toBe(3);
      expect(result.statistics.filesGenerated).toBeGreaterThan(0);
      expect(result.statistics.generationTime).toBeGreaterThanOrEqual(0); // Can be 0 on very fast systems
      expect(result.statistics.linesOfCode).toBeGreaterThan(0);
    });

    it('should generate valid test file content', async () => {
      const generator = new TestGenerator(mockSpec);

      generator.setGenerator('happy-path', createMockGenerator('happy-path'));

      const result = await generator.generateTests();

      expect(result.files.length).toBeGreaterThan(0);

      const firstFile = result.files[0]!;
      expect(firstFile.content).toContain("import { test, expect } from '@playwright/test'");
      expect(firstFile.content).toContain('test(');
      expect(firstFile.content).toContain('async ({ request })');
    });

    it('should handle errors gracefully', async () => {
      const generator = new TestGenerator(mockSpec);

      // Register generator that throws
      const errorGen: TestGeneratorInterface = {
        generateTests: () => {
          throw new Error('Generator error');
        },
      };

      generator.setGenerator('happy-path', errorGen);

      const result = await generator.generateTests();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('error');
    });

    it('should warn when no endpoints found', async () => {
      const emptySpec = {
        ...mockSpec,
        paths: {},
      };

      const generator = new TestGenerator(emptySpec);

      const result = await generator.generateTests();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.message).toContain('No endpoints');
    });
  });

  describe('getBaseUrl', () => {
    it('should return custom base URL when provided', () => {
      const generator = new TestGenerator(mockSpec, {
        baseUrl: 'https://custom.com',
      });

      expect(generator.getBaseUrl()).toBe('https://custom.com');
    });

    it('should return spec server URL when no custom URL', () => {
      const generator = new TestGenerator(mockSpec);

      expect(generator.getBaseUrl()).toBe('https://api.example.com');
    });

    it('should return fallback URL when no servers in spec', () => {
      const noServerSpec = {
        ...mockSpec,
        servers: [],
      };

      const generator = new TestGenerator(noServerSpec);

      expect(generator.getBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('getApiInfo', () => {
    it('should return API info from spec', () => {
      const generator = new TestGenerator(mockSpec);
      const info = generator.getApiInfo();

      expect(info.title).toBe('Test API');
      expect(info.version).toBe('1.0.0');
    });
  });
});

/**
 * Create a mock OpenAPI spec for testing
 */
function createMockSpec(): ParsedApiSpec {
  return {
    version: '3.0.0',
    type: 'openapi-3.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API for unit tests',
    },
    servers: [
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          summary: 'List all pets',
          tags: ['pets'],
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
        post: {
          operationId: 'createPet',
          summary: 'Create a pet',
          tags: ['pets'],
          responses: {
            '201': {
              description: 'Created',
            },
          },
        },
        delete: {
          operationId: 'deletePet',
          summary: 'Delete a pet',
          tags: ['pets'],
          responses: {
            '204': {
              description: 'No content',
            },
          },
        },
      },
    },
    components: {},
    security: [],
    tags: [
      {
        name: 'pets',
        description: 'Pet operations',
      },
    ],
  };
}

/**
 * Create a mock test generator
 */
function createMockGenerator(type: string): TestGeneratorInterface {
  return {
    generateTests: (endpoints) => {
      return endpoints.map((endpoint, index) => {
        const test: TestCase = {
          id: `test-${type}-${index}`,
          name: `${type} test for ${endpoint.method.toUpperCase()} ${endpoint.path}`,
          description: `Test ${type} scenario for ${endpoint.operationId || endpoint.path}`,
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
            operationId: endpoint.operationId,
            generatedAt: new Date().toISOString(),
            generatorVersion: '0.1.0',
          },
        };

        return test;
      });
    },
  };
}
