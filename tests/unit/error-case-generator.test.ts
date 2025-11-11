/**
 * Unit tests for Error Case Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorCaseGenerator } from '../../src/generators/error-case-generator.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import type { ApiEndpoint, SchemaObject, ResponseObject } from '../../src/types/openapi-types.js';

describe('ErrorCaseGenerator', () => {
  let generator: ErrorCaseGenerator;

  beforeEach(() => {
    const bodyGenerator = new RequestBodyGenerator();
    generator = new ErrorCaseGenerator(bodyGenerator);
  });

  describe('generateTests', () => {
    it('should generate error tests for endpoint', () => {
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
                required: ['email', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
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

      expect(tests.length).toBeGreaterThan(0);
      expect(tests.length).toBeLessThanOrEqual(5);
      tests.forEach((test) => {
        expect(test.type).toBe('error-case');
      });
    });

    it('should limit to 5 error tests per endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'put',
        operationId: 'updateUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [{ bearerAuth: [] }],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      expect(tests.length).toBeLessThanOrEqual(5);
    });
  });

  describe('400 Bad Request tests', () => {
    it('should generate test for missing required field', () => {
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
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
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

      const test400 = tests.find((t) => t.name.includes('400'));
      expect(test400).toBeDefined();
      expect(test400?.expectedResponse.status).toBe(400);
      expect(test400?.metadata.tags).toContain('400');
    });

    it('should generate test for invalid data type', () => {
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
                  age: { type: 'number' },
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

      const invalidTypeTest = tests.find((t) => t.name.includes('invalid type'));
      expect(invalidTypeTest).toBeDefined();
    });

    it('should generate test for missing required parameter', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [{ name: 'status', in: 'query', required: true, schema: { type: 'string' } }],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const missingParamTest = tests.find((t) => t.name.includes('missing required parameter'));
      expect(missingParamTest).toBeDefined();
      expect(missingParamTest?.request.queryParams).toBeDefined();
    });
  });

  describe('401 Unauthorized tests', () => {
    it('should generate test for missing authentication', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        operationId: 'listUsers',
        parameters: [],
        responses: new Map(),
        security: [{ bearerAuth: [] }],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test401 = tests.find((t) => t.name.includes('401'));
      expect(test401).toBeDefined();
      expect(test401?.expectedResponse.status).toBe(401);
      expect(test401?.metadata.tags).toContain('401');
      expect(test401?.metadata.tags).toContain('auth');
    });

    it('should generate test for invalid authentication token', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [{ apiKey: [] }],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const invalidTokenTest = tests.find((t) => t.name.includes('invalid'));
      expect(invalidTokenTest).toBeDefined();
      if (invalidTokenTest) {
        expect(invalidTokenTest.request.headers?.['Authorization']).toContain('Bearer');
      }
    });

    it('should not generate 401 test for public endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/public',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test401 = tests.find((t) => t.expectedResponse.status === 401);
      expect(test401).toBeUndefined();
    });
  });

  describe('403 Forbidden tests', () => {
    it('should generate test for insufficient permissions', () => {
      const endpoint: ApiEndpoint = {
        path: '/admin/users',
        method: 'delete',
        parameters: [],
        responses: new Map(),
        security: [{ oauth2: ['admin:write'] }],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test403 = tests.find((t) => t.name.includes('403'));
      expect(test403).toBeDefined();
      expect(test403?.metadata.tags).toContain('permissions');
    });
  });

  describe('404 Not Found tests', () => {
    it('should generate test for non-existent resource with integer ID', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'get',
        operationId: 'getUser',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test404 = tests.find((t) => t.name.includes('404'));
      expect(test404).toBeDefined();
      expect(test404?.expectedResponse.status).toBe(404);
      expect(test404?.request.pathParams?.['id']).toBeDefined();
      expect(typeof test404?.request.pathParams?.['id']?.value).toBe('number');
    });

    it('should generate test for non-existent resource with string ID', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{userId}',
        method: 'get',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test404 = tests.find((t) => t.name.includes('404'));
      expect(test404).toBeDefined();
      expect(typeof test404?.request.pathParams?.['userId']?.value).toBe('string');
    });

    it('should not generate 404 test for endpoints without path parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const test404 = tests.find((t) => t.expectedResponse.status === 404);
      expect(test404).toBeUndefined();
    });
  });

  describe('422 Unprocessable Entity tests', () => {
    it('should generate test for invalid email format', () => {
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

      const emailTest = tests.find((t) => t.name.includes('email'));
      expect(emailTest).toBeDefined();
      if (emailTest?.request.body?.data) {
        const data = emailTest.request.body.data as Record<string, unknown>;
        // Generator currently uses 'not-an-email' from error-helper.ts
        expect(data.email).toMatch(/not-.*-?.*email/i);
      }
    });

    it('should generate test for value below minimum', () => {
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
                  price: { type: 'number', minimum: 0 },
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

      const minTest = tests.find((t) => t.name.includes('minimum'));
      expect(minTest).toBeDefined();
      if (minTest?.request.body?.data) {
        const data = minTest.request.body.data as Record<string, unknown>;
        expect(data.price).toBe(-10);
      }
    });

    it('should generate test for string too short', () => {
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
                  username: { type: 'string', minLength: 3 },
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

      const minLengthTest = tests.find((t) => t.name.includes('too short'));
      expect(minLengthTest).toBeDefined();
    });

    it('should accept both 400 and 422 for validation errors', () => {
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

      const validationTest = tests.find((t) => t.metadata.tags.includes('validation'));
      if (validationTest) {
        expect(Array.isArray(validationTest.expectedResponse.status)).toBe(true);
        const statuses = validationTest.expectedResponse.status as number[];
        expect(statuses).toContain(400);
        expect(statuses).toContain(422);
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
                required: ['email'],
                properties: {
                  email: { type: 'string' },
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

      tests.forEach((test) => {
        expect(test.metadata.tags).toContain('error');
        expect(test.metadata.tags.length).toBeGreaterThan(1);
      });
    });

    it('should set high priority for critical errors', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [{ bearerAuth: [] }],
        tags: [],
        servers: [],
      };

      const tests = generator.generateTests(endpoint);

      const authTest = tests.find((t) => t.metadata.tags.includes('auth'));
      if (authTest) {
        expect(authTest.metadata.priority).toBe('critical');
      }
    });

    it('should include operationId in metadata', () => {
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
                properties: { name: { type: 'string' } },
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

      tests.forEach((test) => {
        expect(test.metadata.operationId).toBe('createUser');
      });
    });
  });
});
