/**
 * Unit tests for Error Helper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  detectErrorResponses,
  generateErrorScenario,
  supportsErrorCode,
  generateInvalidValue,
  getValidationRules,
  getAllErrorScenarios,
} from '../../src/utils/error-helper.js';
import type { ApiEndpoint, ResponseObject, SchemaObject } from '../../src/types/openapi-types.js';

describe('Error Helper', () => {
  describe('detectErrorResponses', () => {
    it('should detect 4xx error responses', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        responses: new Map([
          [200, { description: 'Success', content: {} } as ResponseObject],
          [400, { description: 'Bad Request', content: {} } as ResponseObject],
          [401, { description: 'Unauthorized', content: {} } as ResponseObject],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      const errors = detectErrorResponses(endpoint);

      expect(errors).toHaveLength(2);
      expect(errors[0]?.statusCode).toBe(400);
      expect(errors[1]?.statusCode).toBe(401);
    });

    it('should detect 5xx error responses', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        responses: new Map([
          [200, { description: 'Success', content: {} } as ResponseObject],
          [500, { description: 'Server Error', content: {} } as ResponseObject],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      const errors = detectErrorResponses(endpoint);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.statusCode).toBe(500);
    });

    it('should skip 2xx success responses', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        responses: new Map([
          [200, { description: 'Success', content: {} } as ResponseObject],
          [201, { description: 'Created', content: {} } as ResponseObject],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      const errors = detectErrorResponses(endpoint);

      expect(errors).toHaveLength(0);
    });

    it('should extract schema from error responses', () => {
      const errorSchema: SchemaObject = {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      };

      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        responses: new Map([
          [400, {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          } as ResponseObject],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      const errors = detectErrorResponses(endpoint);

      expect(errors[0]?.schema).toBeDefined();
      expect(errors[0]?.schema?.type).toBe('object');
    });
  });

  describe('generateErrorScenario', () => {
    it('should generate 400 scenario for missing required field', () => {
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

      const scenario = generateErrorScenario(endpoint, '400');

      expect(scenario).not.toBeNull();
      expect(scenario?.statusCode).toBe(400);
      expect(scenario?.name).toContain('400');
      expect(scenario?.reason).toContain('email');
    });

    it('should generate 401 scenario for authenticated endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [{ 'bearerAuth': [] }],
        tags: [],
        servers: [],
      };

      const scenario = generateErrorScenario(endpoint, '401');

      expect(scenario).not.toBeNull();
      expect(scenario?.statusCode).toBe(401);
      expect(scenario?.reason).toContain('authentication');
    });

    it('should return null for 401 on public endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/public',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const scenario = generateErrorScenario(endpoint, '401');

      expect(scenario).toBeNull();
    });

    it('should generate 404 scenario for endpoint with path parameter', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'get',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const scenario = generateErrorScenario(endpoint, '404');

      expect(scenario).not.toBeNull();
      expect(scenario?.statusCode).toBe(404);
      expect(scenario?.request.pathParams).toBeDefined();
    });

    it('should return null for 404 on endpoint without path parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      const scenario = generateErrorScenario(endpoint, '404');

      expect(scenario).toBeNull();
    });

    it('should generate 422 scenario for validation constraints', () => {
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
                  age: { type: 'integer', minimum: 18 },
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

      const scenario = generateErrorScenario(endpoint, '422');

      expect(scenario).not.toBeNull();
      expect(scenario?.statusCode).toBe(422);
    });
  });

  describe('supportsErrorCode', () => {
    it('should return true for explicitly defined error codes', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        responses: new Map([
          [400, { description: 'Bad Request', content: {} } as ResponseObject],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      expect(supportsErrorCode(endpoint, 400)).toBe(true);
    });

    it('should infer 400 support from request body', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' } as SchemaObject,
            },
          },
        },
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      expect(supportsErrorCode(endpoint, 400)).toBe(true);
    });

    it('should infer 401 support from security requirements', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map(),
        security: [{ 'apiKey': [] }],
        tags: [],
        servers: [],
      };

      expect(supportsErrorCode(endpoint, 401)).toBe(true);
      expect(supportsErrorCode(endpoint, 403)).toBe(true);
    });

    it('should infer 404 support from path parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'get',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: new Map(),
        security: [],
        tags: [],
        servers: [],
      };

      expect(supportsErrorCode(endpoint, 404)).toBe(true);
    });
  });

  describe('generateInvalidValue', () => {
    it('should generate invalid email for email format', () => {
      const schema: SchemaObject = {
        type: 'string',
        format: 'email',
      };

      const invalid = generateInvalidValue(schema);

      expect(invalid).toBe('not-an-email');
    });

    it('should generate value below minimum for number', () => {
      const schema: SchemaObject = {
        type: 'number',
        minimum: 10,
      };

      const invalid = generateInvalidValue(schema);

      expect(invalid).toBe(9);
    });

    it('should generate wrong type for string', () => {
      const schema: SchemaObject = {
        type: 'string',
      };

      const invalid = generateInvalidValue(schema);

      expect(typeof invalid).toBe('number');
    });

    it('should generate wrong type for array', () => {
      const schema: SchemaObject = {
        type: 'array',
      };

      const invalid = generateInvalidValue(schema);

      expect(invalid).toBe('not-an-array');
    });
  });

  describe('getValidationRules', () => {
    it('should extract required fields', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['email', 'name'],
      };

      const rules = getValidationRules(schema);

      expect(rules).toContain('Required fields: email, name');
    });

    it('should extract string length constraints', () => {
      const schema: SchemaObject = {
        type: 'string',
        minLength: 5,
        maxLength: 50,
      };

      const rules = getValidationRules(schema);

      expect(rules).toContain('Minimum length: 5');
      expect(rules).toContain('Maximum length: 50');
    });

    it('should extract number constraints', () => {
      const schema: SchemaObject = {
        type: 'number',
        minimum: 0,
        maximum: 100,
      };

      const rules = getValidationRules(schema);

      expect(rules).toContain('Minimum value: 0');
      expect(rules).toContain('Maximum value: 100');
    });

    it('should extract format and pattern', () => {
      const schema: SchemaObject = {
        type: 'string',
        format: 'email',
        pattern: '^[a-z]+$',
      };

      const rules = getValidationRules(schema);

      expect(rules).toContain('Format: email');
      expect(rules).toContain('Pattern: ^[a-z]+$');
    });

    it('should extract enum values', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['active', 'pending', 'deleted'],
      };

      const rules = getValidationRules(schema);

      expect(rules).toContain('Allowed values: active, pending, deleted');
    });
  });

  describe('getAllErrorScenarios', () => {
    it('should generate multiple error scenarios', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'put',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
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
        security: [{ 'bearerAuth': [] }],
        tags: [],
        servers: [],
      };

      const scenarios = getAllErrorScenarios(endpoint);

      expect(scenarios.length).toBeGreaterThan(0);
      // Should have scenarios for 400, 401, 403, 404, 422
      const statusCodes = scenarios.map(s => s.statusCode);
      expect(statusCodes).toContain(400);
      expect(statusCodes).toContain(401);
      expect(statusCodes).toContain(404);
    });
  });
});
