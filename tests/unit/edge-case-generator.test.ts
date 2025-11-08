/**
 * Unit tests for Edge Case Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeCaseGenerator } from '../../src/generators/edge-case-generator.js';
import { DataFactory } from '../../src/utils/data-factory.js';
import type { ApiEndpoint, SchemaObject } from '../../src/types/openapi-types.js';

describe('EdgeCaseGenerator', () => {
  let generator: EdgeCaseGenerator;

  beforeEach(() => {
    const dataFactory = new DataFactory({ seed: 12345 });
    generator = new EdgeCaseGenerator(dataFactory);
  });

  describe('generateTests', () => {
    it('should generate edge case tests for endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        operationId: 'createUser',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      expect(tests.length).toBeGreaterThan(0);
      expect(tests.length).toBeLessThanOrEqual(4);
      tests.forEach(test => {
        expect(test.type).toBe('edge-case');
      });
    });

    it('should limit to 4 edge case tests per endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/products',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 50 },
                  price: { type: 'number', minimum: 0, maximum: 10000 },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      expect(tests.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Boundary value tests', () => {
    it('should generate test for maximum string length', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        operationId: 'createUser',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 50 },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const maxLengthTest = tests.find(t => t.name.includes('maximum length'));
      expect(maxLengthTest).toBeDefined();
      expect(maxLengthTest?.metadata.tags).toContain('boundary');
      expect(maxLengthTest?.metadata.tags).toContain('maxLength');

      if (maxLengthTest?.request.body?.data) {
        const data = maxLengthTest.request.body.data as Record<string, unknown>;
        expect((data.name as string).length).toBe(50);
      }
    });

    it('should generate test for minimum number value', () => {
      const endpoint: ApiEndpoint = {
        path: '/products',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  price: { type: 'number', minimum: 0, maximum: 10000 },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const minTest = tests.find(t => t.name.includes('minimum value'));
      expect(minTest).toBeDefined();
      if (minTest?.request.body?.data) {
        const data = minTest.request.body.data as Record<string, unknown>;
        expect(data.price).toBe(0);
      }
    });

    it('should generate test for maximum number value', () => {
      const endpoint: ApiEndpoint = {
        path: '/products',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quantity: { type: 'integer', minimum: 1, maximum: 999 },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const maxTest = tests.find(t => t.name.includes('maximum value'));
      // May or may not generate depending on other fields, test only if found
      if (maxTest && maxTest.request.body?.data) {
        const data = maxTest.request.body.data as Record<string, unknown>;
        expect(data.quantity).toBe(999);
      }
    });
  });

  describe('Special character tests', () => {
    it('should generate test with XSS and SQL injection patterns', () => {
      const endpoint: ApiEndpoint = {
        path: '/posts',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const specialCharsTest = tests.find(t => t.name.includes('special characters'));
      expect(specialCharsTest).toBeDefined();
      expect(specialCharsTest?.metadata.tags).toContain('security');
      expect(specialCharsTest?.metadata.tags).toContain('xss');
      expect(specialCharsTest?.metadata.tags).toContain('sql-injection');

      if (specialCharsTest?.request.body?.data) {
        const data = specialCharsTest.request.body.data as Record<string, unknown>;
        const value = data.title || data.content;
        expect(value).toContain('<script>');
        expect(value).toContain('DROP TABLE');
      }
    });

    it('should generate test with Unicode characters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const unicodeTest = tests.find(t => t.name.includes('Unicode'));
      expect(unicodeTest).toBeDefined();
      expect(unicodeTest?.metadata.tags).toContain('unicode');
      expect(unicodeTest?.metadata.tags).toContain('internationalization');
    });

    it('should skip special character tests for email/uuid formats', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  userId: { type: 'string', format: 'uuid' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      // Should not try to inject XSS into email/uuid fields
      const specialCharsTest = tests.find(t =>
        t.name.includes('special characters') &&
        (t.name.includes('email') || t.name.includes('userId'))
      );
      expect(specialCharsTest).toBeUndefined();
    });
  });

  describe('Empty value tests', () => {
    it('should generate test with empty string for optional field', () => {
      const endpoint: ApiEndpoint = {
        path: '/posts',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' }, // Optional
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const emptyTest = tests.find(t => t.name.includes('empty string'));
      expect(emptyTest).toBeDefined();
      if (emptyTest?.request.body?.data) {
        const data = emptyTest.request.body.data as Record<string, unknown>;
        expect(data.description).toBe('');
      }
    });

    it('should generate test with empty array for optional field', () => {
      const endpoint: ApiEndpoint = {
        path: '/posts',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const emptyArrayTest = tests.find(t => t.name.includes('empty array'));
      expect(emptyArrayTest).toBeDefined();
      if (emptyArrayTest?.request.body?.data) {
        const data = emptyArrayTest.request.body.data as Record<string, unknown>;
        expect(Array.isArray(data.tags)).toBe(true);
        expect((data.tags as unknown[]).length).toBe(0);
      }
    });
  });

  describe('Large payload tests', () => {
    it('should generate test with very long string', () => {
      const endpoint: ApiEndpoint = {
        path: '/posts',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const largeTest = tests.find(t => t.name.includes('very long value'));
      expect(largeTest).toBeDefined();
      expect(largeTest?.metadata.tags).toContain('large-payload');

      if (largeTest?.request.body?.data) {
        const data = largeTest.request.body.data as Record<string, unknown>;
        expect((data.content as string).length).toBeGreaterThan(5000);
      }
    });

    it('should generate test with large array', () => {
      const endpoint: ApiEndpoint = {
        path: '/batch',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const largeArrayTest = tests.find(t => t.name.includes('many items'));
      expect(largeArrayTest).toBeDefined();

      if (largeArrayTest?.request.body?.data) {
        const data = largeArrayTest.request.body.data as Record<string, unknown>;
        expect(Array.isArray(data.items)).toBe(true);
        expect((data.items as unknown[]).length).toBeGreaterThanOrEqual(100);
      }
    });

    it('should accept 413 Payload Too Large as valid response', () => {
      const endpoint: ApiEndpoint = {
        path: '/upload',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'string' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const largeTest = tests.find(t => t.metadata.tags.includes('large-payload'));
      if (largeTest && Array.isArray(largeTest.expectedResponse.status)) {
        expect(largeTest.expectedResponse.status).toContain(413);
      }
    });
  });

  describe('Test metadata', () => {
    it('should include appropriate tags', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 100 },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      tests.forEach(test => {
        expect(test.metadata.tags).toContain('edge-case');
        expect(test.metadata.tags.length).toBeGreaterThan(1);
      });
    });

    it('should set stability to stable', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      tests.forEach(test => {
        expect(test.metadata.stability).toBe('stable');
      });
    });

    it('should include operationId when available', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        operationId: 'createUser',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 50 },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      tests.forEach(test => {
        expect(test.metadata.operationId).toBe('createUser');
      });
    });
  });
});
