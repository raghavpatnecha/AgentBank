/**
 * Unit tests for Flow Generator
 * Tests workflow detection and multi-step test generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowGenerator, type WorkflowFlow, type FlowStep } from '../../src/generators/flow-generator.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import type { ApiEndpoint, HttpMethod, SchemaObject } from '../../src/types/openapi-types.js';

// Helper to create mock endpoint
function createEndpoint(
  path: string,
  method: HttpMethod,
  operationId?: string,
  tags: string[] = [],
  requestBody?: any
): ApiEndpoint {
  return {
    path,
    method,
    operationId,
    summary: `${method.toUpperCase()} ${path}`,
    description: `Test endpoint for ${path}`,
    parameters: path.includes('{id}') || path.includes('{userId}')
      ? [{ name: path.includes('{userId}') ? 'userId' : 'id', in: 'path', required: true }]
      : [],
    requestBody,
    responses: new Map([[200, { description: 'Success' }], [201, { description: 'Created' }]]),
    security: [],
    tags,
    servers: [],
  };
}

describe('FlowGenerator', () => {
  let generator: FlowGenerator;
  let bodyGenerator: RequestBodyGenerator;

  beforeEach(() => {
    bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
    generator = new FlowGenerator(bodyGenerator);
  });

  describe('Constructor', () => {
    it('should create generator with default options', () => {
      expect(generator).toBeDefined();
    });

    it('should create generator with custom options', () => {
      const customGen = new FlowGenerator(bodyGenerator, {
        includeCRUD: false,
        includeCreateRead: true,
        minSteps: 3,
      });
      expect(customGen).toBeDefined();
    });
  });

  describe('detectFlows', () => {
    it('should detect CRUD workflow', () => {
      const endpoints = [
        createEndpoint('/users', 'post', 'createUser', ['users']),
        createEndpoint('/users/{id}', 'get', 'getUser', ['users']),
        createEndpoint('/users/{id}', 'put', 'updateUser', ['users']),
        createEndpoint('/users/{id}', 'delete', 'deleteUser', ['users']),
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(0);
      const crudFlow = flows.find((f) => f.type === 'crud');
      expect(crudFlow).toBeDefined();
      expect(crudFlow?.steps.length).toBeGreaterThanOrEqual(4);
    });

    it('should detect create-read workflow', () => {
      const endpoints = [
        createEndpoint('/products', 'post', 'createProduct', ['products']),
        createEndpoint('/products/{id}', 'get', 'getProduct', ['products']),
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(0);
      const createReadFlow = flows.find((f) => f.type === 'create-read');
      expect(createReadFlow).toBeDefined();
      expect(createReadFlow?.steps).toHaveLength(2);
    });

    it('should detect list-filter workflow', () => {
      const endpoints = [
        createEndpoint('/users', 'get', 'listUsers', ['users']),
      ];
      // Add query parameters for filtering
      endpoints[0]!.parameters.push(
        { name: 'status', in: 'query', required: false },
        { name: 'role', in: 'query', required: false }
      );

      const flows = generator.detectFlows(endpoints);

      const listFilterFlow = flows.find((f) => f.type === 'list-filter');
      expect(listFilterFlow).toBeDefined();
    });

    it('should filter flows by minimum steps', () => {
      const customGen = new FlowGenerator(bodyGenerator, { minSteps: 5 });
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users/{id}', 'get'),
      ];

      const flows = customGen.detectFlows(endpoints);

      // Create-read only has 2 steps, should be filtered out
      expect(flows.every((f) => f.steps.length >= 5)).toBe(true);
    });

    it('should handle empty endpoint list', () => {
      const flows = generator.detectFlows([]);
      expect(flows).toHaveLength(0);
    });

    it('should detect multiple workflows from same endpoints', () => {
      const endpoints = [
        createEndpoint('/users', 'post', 'createUser', ['users']),
        createEndpoint('/users/{id}', 'get', 'getUser', ['users']),
        createEndpoint('/users/{id}', 'put', 'updateUser', ['users']),
        createEndpoint('/users/{id}', 'delete', 'deleteUser', ['users']),
        createEndpoint('/users', 'get', 'listUsers', ['users']),
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(1);
      expect(flows.some((f) => f.type === 'crud')).toBe(true);
      expect(flows.some((f) => f.type === 'create-read')).toBe(true);
    });

    it('should handle partial CRUD sets', () => {
      const endpoints = [
        createEndpoint('/products', 'post'),
        createEndpoint('/products/{id}', 'get'),
        createEndpoint('/products/{id}', 'put'),
        // No delete endpoint
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(0);
      const crudFlow = flows.find((f) => f.type === 'crud' && f.resource === 'products');
      expect(crudFlow).toBeDefined();
    });
  });

  describe('CRUD Flow Detection', () => {
    it('should create full CRUD flow with all operations', () => {
      const endpoints = [
        createEndpoint('/items', 'post', 'createItem', ['items']),
        createEndpoint('/items/{id}', 'get', 'getItem', ['items']),
        createEndpoint('/items/{id}', 'put', 'updateItem', ['items']),
        createEndpoint('/items/{id}', 'delete', 'deleteItem', ['items']),
      ];

      const flows = generator.detectFlows(endpoints);
      const crudFlow = flows.find((f) => f.type === 'crud' && f.name.includes('CRUD'));

      expect(crudFlow).toBeDefined();
      expect(crudFlow?.steps).toHaveLength(5); // Create, Read, Update, Delete, Verify
      expect(crudFlow?.steps[0]?.description).toContain('Create');
      expect(crudFlow?.steps[1]?.description).toContain('Read');
      expect(crudFlow?.steps[2]?.description).toContain('Update');
      expect(crudFlow?.steps[3]?.description).toContain('Delete');
      expect(crudFlow?.steps[4]?.description).toContain('Verify');
    });

    it('should handle PATCH for update operation', () => {
      const endpoints = [
        createEndpoint('/items', 'post'),
        createEndpoint('/items/{id}', 'get'),
        createEndpoint('/items/{id}', 'patch'), // PATCH instead of PUT
        createEndpoint('/items/{id}', 'delete'),
      ];

      const flows = generator.detectFlows(endpoints);
      const crudFlow = flows.find((f) => f.type === 'crud');

      expect(crudFlow).toBeDefined();
      expect(crudFlow?.steps.some((s) => s.endpoint.method === 'patch')).toBe(true);
    });

    it('should set correct expected status codes', () => {
      const endpoints = [
        createEndpoint('/items', 'post'),
        createEndpoint('/items/{id}', 'get'),
        createEndpoint('/items/{id}', 'put'),
        createEndpoint('/items/{id}', 'delete'),
      ];

      const flows = generator.detectFlows(endpoints);
      const crudFlow = flows.find((f) => f.type === 'crud' && f.name.includes('CRUD'));

      expect(crudFlow).toBeDefined();
      // Create should be 201
      expect(crudFlow?.steps[0]?.expectedStatus).toBeGreaterThanOrEqual(200);
      // Read should be 200
      expect(crudFlow?.steps[1]?.expectedStatus).toBe(200);
      // Verify deleted should be 404
      expect(crudFlow?.steps[4]?.expectedStatus).toBe(404);
    });
  });

  describe('generateFlowTest', () => {
    it('should generate test case from flow', () => {
      const flow: WorkflowFlow = {
        name: 'User CRUD workflow',
        type: 'crud',
        description: 'Complete CRUD workflow for users',
        steps: [
          {
            endpoint: createEndpoint('/users', 'post'),
            description: 'Create user',
            dataPass: 'userId',
            expectedStatus: 201,
            order: 1,
          },
          {
            endpoint: createEndpoint('/users/{id}', 'get'),
            description: 'Read user',
            expectedStatus: 200,
            order: 2,
          },
        ],
        resource: 'users',
        tags: ['users'],
      };

      const testCase = generator.generateFlowTest(flow);

      expect(testCase.id).toContain('flow');
      expect(testCase.name).toBe(flow.name);
      expect(testCase.description).toBe(flow.description);
      expect(testCase.type).toBe('flow');
      expect(testCase.metadata.tags).toContain('workflow');
      expect(testCase.metadata.tags).toContain('crud');
    });

    it('should set workflow method type', () => {
      const flow: WorkflowFlow = {
        name: 'Test flow',
        type: 'create-read',
        description: 'Test',
        steps: [],
        resource: 'test',
        tags: [],
      };

      const testCase = generator.generateFlowTest(flow);

      expect(testCase.method).toBe('WORKFLOW');
    });
  });

  describe('generateFlowTestCode', () => {
    it('should generate Playwright test code for CRUD flow', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const requestBody = {
        description: 'User data',
        content: {
          'application/json': {
            schema,
          },
        },
        required: true,
      };

      const flow: WorkflowFlow = {
        name: 'User CRUD workflow',
        type: 'crud',
        description: 'Complete CRUD workflow for users',
        steps: [
          {
            endpoint: createEndpoint('/users', 'post', 'createUser', ['users'], requestBody),
            description: 'Create a new user',
            dataPass: 'userId',
            expectedStatus: 201,
            order: 1,
          },
          {
            endpoint: createEndpoint('/users/{id}', 'get', 'getUser', ['users']),
            description: 'Read the created user',
            expectedStatus: 200,
            order: 2,
          },
        ],
        resource: 'users',
        tags: ['users'],
      };

      const code = generator.generateFlowTestCode(flow);

      expect(code).toContain("test('User CRUD workflow'");
      expect(code).toContain('await request.post');
      expect(code).toContain('await request.get');
      expect(code).toContain('expect');
      expect(code).toContain('.toBe(201)');
      expect(code).toContain('.toBe(200)');
    });

    it('should handle data passing between steps', () => {
      const flow: WorkflowFlow = {
        name: 'Create-Read flow',
        type: 'create-read',
        description: 'Create then read',
        steps: [
          {
            endpoint: createEndpoint('/items', 'post'),
            description: 'Create item',
            dataPass: 'itemId',
            expectedStatus: 201,
            order: 1,
          },
          {
            endpoint: createEndpoint('/items/{id}', 'get'),
            description: 'Read item',
            expectedStatus: 200,
            order: 2,
          },
        ],
        resource: 'items',
        tags: [],
      };

      const code = generator.generateFlowTestCode(flow);

      expect(code).toContain('const itemId');
      expect(code).toContain('${itemId}');
    });
  });

  describe('Edge Cases', () => {
    it('should handle endpoints with no tags', () => {
      const endpoints = [
        createEndpoint('/items', 'post'),
        createEndpoint('/items/{id}', 'get'),
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(0);
      flows.forEach((flow) => {
        expect(Array.isArray(flow.tags)).toBe(true);
      });
    });

    it('should handle endpoints with multiple ID parameters', () => {
      const endpoint = createEndpoint('/users/{userId}/posts/{postId}', 'get');
      const flows = generator.detectFlows([endpoint]);

      // Should not crash
      expect(Array.isArray(flows)).toBe(true);
    });

    it('should handle missing operation IDs', () => {
      const endpoints = [
        createEndpoint('/data', 'post'),
        createEndpoint('/data/{id}', 'get'),
      ];

      const flows = generator.detectFlows(endpoints);

      expect(flows.length).toBeGreaterThan(0);
    });
  });
});
