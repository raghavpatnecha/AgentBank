/**
 * Unit tests for CodeGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGenerator } from '../../src/utils/code-generator.js';
import type { TestCase, FileMetadata } from '../../src/types/test-generator-types.js';

describe('CodeGenerator', () => {
  let generator: CodeGenerator;

  beforeEach(() => {
    generator = new CodeGenerator();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(generator).toBeInstanceOf(CodeGenerator);
    });

    it('should accept custom options', () => {
      const customGen = new CodeGenerator({
        typescript: false,
        addComments: false,
        indent: 4,
        quotes: 'double',
        semi: false,
        baseURL: 'https://api.example.com',
      });

      expect(customGen).toBeInstanceOf(CodeGenerator);
    });
  });

  describe('generateTestFile', () => {
    it('should generate basic test file structure', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users - list users',
          description: 'Test listing users',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {},
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: ['users'],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: ['users'],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain("import { test, expect } from '@playwright/test'");
      expect(code).toContain('test.describe');
      expect(code).toContain("test('GET /users - list users'");
      expect(code).toContain('async ({ request }) =>');
    });

    it('should generate GET request test', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users',
          description: 'Get users',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {},
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('await request.get(endpoint)');
      expect(code).toContain('expect(response.status()).toBe(200)');
    });

    it('should generate POST request test with body', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'POST /users',
          description: 'Create user',
          type: 'happy-path',
          method: 'POST',
          endpoint: '/users',
          request: {
            body: {
              contentType: 'application/json',
              data: { name: 'John Doe', email: 'john@example.com' },
              generated: true,
            },
          },
          expectedResponse: {
            status: 201,
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['POST /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('await request.post(endpoint');
      expect(code).toContain('data:');
      expect(code).toContain('John Doe');
      expect(code).toContain('expect(response.status()).toBe(201)');
    });

    it('should generate test with query parameters', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users with params',
          description: 'Get users with params',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {
            queryParams: {
              limit: { value: 10, generated: true },
              offset: { value: 0, generated: true },
            },
          },
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('params:');
      expect(code).toContain('limit: 10');
      expect(code).toContain('offset: 0');
    });

    it('should generate test with path parameters', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users/{id}',
          description: 'Get user by ID',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users/{id}',
          request: {
            pathParams: {
              id: { value: 123, generated: true },
            },
          },
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users/{id}'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('/users/123');
    });

    it('should generate test with headers', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users with headers',
          description: 'Get users with headers',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {
            headers: {
              'X-API-Version': '1.0',
              'X-Request-ID': 'abc123',
            },
          },
          expectedResponse: {
            status: 200,
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('headers:');
      expect(code).toContain('X-API-Version');
      expect(code).toContain('X-Request-ID');
    });

    it('should generate response body validation', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'GET /users',
          description: 'Get users',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {},
          expectedResponse: {
            status: 200,
            body: {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('const body = await response.json()');
      expect(code).toContain('expect(Array.isArray(body)).toBe(true)');
    });

    it('should include file header comments', () => {
      const testCases: TestCase[] = [];
      const metadata: FileMetadata = {
        endpoints: ['GET /users'],
        testTypes: ['happy-path'],
        testCount: 0,
        tags: ['users'],
        generatedAt: '2024-01-01T00:00:00Z',
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain('/**');
      expect(code).toContain('Generated API Tests');
      expect(code).toContain('2024-01-01T00:00:00Z');
      expect(code).toContain('GET /users');
    });

    it('should handle multiple test cases', () => {
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test 1',
          description: 'First test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
        {
          id: 'test-2',
          name: 'Test 2',
          description: 'Second test',
          type: 'happy-path',
          method: 'POST',
          endpoint: '/users',
          request: {},
          expectedResponse: { status: 201 },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const metadata: FileMetadata = {
        endpoints: ['GET /users', 'POST /users'],
        testTypes: ['happy-path'],
        testCount: 2,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = generator.generateTestFile(testCases, metadata);

      expect(code).toContain("test('Test 1'");
      expect(code).toContain("test('Test 2'");
    });
  });

  describe('code style options', () => {
    it('should use double quotes when configured', () => {
      const customGen = new CodeGenerator({ quotes: 'double' });
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test',
          description: 'Test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/test',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];
      const metadata: FileMetadata = {
        endpoints: [],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = customGen.generateTestFile(testCases, metadata);

      expect(code).toContain('"@playwright/test"');
    });

    it('should omit semicolons when configured', () => {
      const customGen = new CodeGenerator({ semi: false });
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test',
          description: 'Test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/test',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];
      const metadata: FileMetadata = {
        endpoints: [],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = customGen.generateTestFile(testCases, metadata);

      expect(code).not.toMatch(/import.*;\s*$/m);
    });

    it('should skip comments when configured', () => {
      const customGen = new CodeGenerator({ addComments: false });
      const testCases: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test',
          description: 'A test description',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/test',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: [],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];
      const metadata: FileMetadata = {
        endpoints: [],
        testTypes: ['happy-path'],
        testCount: 1,
        tags: [],
        generatedAt: new Date().toISOString(),
      };

      const code = customGen.generateTestFile(testCases, metadata);

      expect(code).not.toContain('/**');
      expect(code).not.toContain('//');
    });
  });
});
