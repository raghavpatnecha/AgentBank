/**
 * Unit tests for HappyPathGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HappyPathGenerator } from '../../src/generators/happy-path-generator.js';
import { DataFactory } from '../../src/utils/data-factory.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import type { ApiEndpoint } from '../../src/types/openapi-types.js';

describe('HappyPathGenerator', () => {
  let generator: HappyPathGenerator;
  let dataFactory: DataFactory;
  let bodyGenerator: RequestBodyGenerator;

  beforeEach(() => {
    dataFactory = new DataFactory();
    bodyGenerator = new RequestBodyGenerator();
    generator = new HappyPathGenerator(dataFactory, bodyGenerator);
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(generator).toBeInstanceOf(HappyPathGenerator);
    });

    it('should accept custom options', () => {
      const customGenerator = new HappyPathGenerator(dataFactory, bodyGenerator, {
        useRealisticData: false,
        generateMultiple: true,
        includeOptionalParams: true,
      });
      expect(customGenerator).toBeInstanceOf(HappyPathGenerator);
    });
  });

  describe('generateTest', () => {
    it('should generate test for GET endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        summary: 'Get all users',
        description: 'Returns a list of users',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: ['users'],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test).toBeDefined();
      expect(test.type).toBe('happy-path');
      expect(test.method).toBe('GET');
      expect(test.endpoint).toBe('/users');
      expect(test.name).toContain('GET');
      expect(test.name).toContain('/users');
      expect(test.metadata.tags).toContain('users');
    });

    it('should generate test for POST endpoint with request body', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'post',
        summary: 'Create user',
        description: 'Creates a new user',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
                required: ['name', 'email'],
              },
            },
          },
        },
        responses: new Map([[201, { description: 'Created' }]]),
        security: [],
        tags: ['users'],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.method).toBe('POST');
      expect(test.request.body).toBeDefined();
      expect(test.request.body?.contentType).toBe('application/json');
      expect(test.request.body?.data).toBeDefined();
      expect(test.request.body?.generated).toBe(true);
    });

    it('should generate test for PUT endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'put',
        summary: 'Update user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: new Map([[200, { description: 'Updated' }]]),
        security: [],
        tags: ['users'],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.method).toBe('PUT');
      expect(test.request.pathParams).toBeDefined();
      expect(test.request.pathParams?.id).toBeDefined();
      expect(test.request.body).toBeDefined();
    });

    it('should generate test for PATCH endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'patch',
        summary: 'Partial update user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: new Map([[200, { description: 'Patched' }]]),
        security: [],
        tags: ['users'],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.method).toBe('PATCH');
      expect(test.request.pathParams?.id).toBeDefined();
    });

    it('should generate test for DELETE endpoint', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{id}',
        method: 'delete',
        summary: 'Delete user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: new Map([[204, { description: 'Deleted' }]]),
        security: [],
        tags: ['users'],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.method).toBe('DELETE');
      expect(test.request.pathParams?.id).toBeDefined();
      // Status can be a single number or array
      const status = test.expectedResponse.status;
      if (Array.isArray(status)) {
        expect(status).toContain(204);
      } else {
        expect(status).toBe(204);
      }
    });

    it('should handle query parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: true,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.request.queryParams).toBeDefined();
      expect(test.request.queryParams?.limit).toBeDefined();
    });

    it('should handle header parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [
          {
            name: 'X-API-Version',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.request.headers).toBeDefined();
      expect(test.request.headers?.['X-API-Version']).toBeDefined();
    });

    it('should generate unique test IDs', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test1 = generator.generateTest(endpoint);
      const test2 = generator.generateTest(endpoint);

      expect(test1.id).not.toBe(test2.id);
    });

    it('should use operationId in metadata', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        operationId: 'getTest',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.metadata.operationId).toBe('getTest');
    });

    it('should set high priority for happy path tests', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.metadata.priority).toBe('high');
      expect(test.metadata.stability).toBe('stable');
    });
  });

  describe('generateTests', () => {
    it('should generate tests for multiple endpoints', () => {
      const endpoints: ApiEndpoint[] = [
        {
          path: '/users',
          method: 'get',
          parameters: [],
          responses: new Map([[200, { description: 'Success' }]]),
          security: [],
          tags: [],
          servers: [],
        },
        {
          path: '/posts',
          method: 'get',
          parameters: [],
          responses: new Map([[200, { description: 'Success' }]]),
          security: [],
          tags: [],
          servers: [],
        },
      ];

      const tests = generator.generateTests(endpoints);

      expect(tests).toHaveLength(2);
      expect(tests[0]?.endpoint).toBe('/users');
      expect(tests[1]?.endpoint).toBe('/posts');
    });

    it('should generate multiple tests per endpoint when configured', () => {
      const customGen = new HappyPathGenerator(dataFactory, bodyGenerator, {
        generateMultiple: true,
      });

      const endpoints: ApiEndpoint[] = [
        {
          path: '/users',
          method: 'get',
          parameters: [],
          responses: new Map([[200, { description: 'Success' }]]),
          security: [],
          tags: [],
          servers: [],
        },
      ];

      const tests = customGen.generateTests(endpoints);

      expect(tests.length).toBeGreaterThan(1);
    });

    it('should handle empty endpoints array', () => {
      const tests = generator.generateTests([]);

      expect(tests).toHaveLength(0);
    });
  });

  describe('response validation', () => {
    it('should expect 2xx status codes for success', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'post',
        parameters: [],
        responses: new Map([[201, { description: 'Created' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      // Status can be a single number or array
      const status = test.expectedResponse.status;
      if (Array.isArray(status)) {
        expect(status).toContain(201);
      } else {
        expect(status).toBe(201);
      }
    });

    it('should include response schema when available', () => {
      const endpoint: ApiEndpoint = {
        path: '/users',
        method: 'get',
        parameters: [],
        responses: new Map([
          [
            200,
            {
              description: 'Success',
              content: {
                'application/json': {
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
            },
          ],
        ]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.expectedResponse.body?.schema).toBeDefined();
      expect(test.expectedResponse.body?.schema?.type).toBe('array');
    });

    it('should default to 200 status when no success status found', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        parameters: [],
        responses: new Map([[404, { description: 'Not found' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      // Status can be a single number or array
      const status = test.expectedResponse.status;
      if (Array.isArray(status)) {
        expect(status).toContain(200);
      } else {
        expect(status).toBe(200);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle endpoint with no summary', () => {
      const endpoint: ApiEndpoint = {
        path: '/test/{id}',
        method: 'get',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.name).toBeDefined();
      expect(test.description).toBeDefined();
    });

    it('should handle endpoint with no tags', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.metadata.tags).toEqual([]);
    });

    it('should handle endpoint with no request body', () => {
      const endpoint: ApiEndpoint = {
        path: '/test',
        method: 'get',
        parameters: [],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.request.body).toBeUndefined();
    });

    it('should handle complex path parameters', () => {
      const endpoint: ApiEndpoint = {
        path: '/users/{userId}/posts/{postId}',
        method: 'get',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: new Map([[200, { description: 'Success' }]]),
        security: [],
        tags: [],
        servers: [],
      };

      const test = generator.generateTest(endpoint);

      expect(test.request.pathParams?.userId).toBeDefined();
      expect(test.request.pathParams?.postId).toBeDefined();
    });
  });
});
