/**
 * Unit tests for Dependency Analyzer
 * Tests endpoint relationship detection and CRUD set identification
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeEndpointDependencies,
  findCRUDSets,
  findCreateReadPairs,
  groupByResource,
  extractResourceName,
  hasIdParameter,
  isListEndpoint,
  isDetailEndpoint,
  isCreateEndpoint,
  isUpdateEndpoint,
  isDeleteEndpoint,
  getCRUDOperation,
  type CRUDSet,
} from '../../src/utils/dependency-analyzer.js';
import type { ApiEndpoint, HttpMethod } from '../../src/types/openapi-types.js';

// Helper to create mock endpoint
function createEndpoint(
  path: string,
  method: HttpMethod,
  operationId?: string,
  tags: string[] = []
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
    responses: new Map([[200, { description: 'Success' }]]),
    security: [],
    tags,
    servers: [],
  };
}

describe('Dependency Analyzer', () => {
  describe('extractResourceName', () => {
    it('should extract resource from simple path', () => {
      const endpoint = createEndpoint('/users', 'get');
      expect(extractResourceName(endpoint)).toBe('users');
    });

    it('should extract resource from path with ID', () => {
      const endpoint = createEndpoint('/users/{id}', 'get');
      expect(extractResourceName(endpoint)).toBe('users');
    });

    it('should extract resource from nested path', () => {
      const endpoint = createEndpoint('/users/{userId}/posts', 'get');
      expect(extractResourceName(endpoint)).toBe('users');
    });

    it('should extract resource from operation ID', () => {
      const endpoint = createEndpoint('/api/v1/data', 'get', 'getUser');
      expect(extractResourceName(endpoint)).toBe('user');
    });

    it('should extract resource from tags when path is unclear', () => {
      const endpoint = createEndpoint('/api/v1/{id}', 'get', undefined, ['products']);
      expect(extractResourceName(endpoint)).toBe('products');
    });

    it('should return null for empty path', () => {
      const endpoint = createEndpoint('/', 'get');
      expect(extractResourceName(endpoint)).toBeNull();
    });
  });

  describe('hasIdParameter', () => {
    it('should detect {id} parameter', () => {
      const endpoint = createEndpoint('/users/{id}', 'get');
      expect(hasIdParameter(endpoint)).toBe(true);
    });

    it('should detect {userId} parameter', () => {
      const endpoint = createEndpoint('/users/{userId}', 'get');
      expect(hasIdParameter(endpoint)).toBe(true);
    });

    it('should detect {productId} parameter', () => {
      const endpoint = createEndpoint('/products/{productId}', 'get');
      expect(hasIdParameter(endpoint)).toBe(true);
    });

    it('should return false for no ID parameter', () => {
      const endpoint = createEndpoint('/users', 'get');
      expect(hasIdParameter(endpoint)).toBe(false);
    });

    it('should return false for non-ID parameters', () => {
      const endpoint = createEndpoint('/users/{name}', 'get');
      expect(hasIdParameter(endpoint)).toBe(false);
    });
  });

  describe('CRUD operation detection', () => {
    it('should detect list endpoint', () => {
      const endpoint = createEndpoint('/users', 'get');
      expect(isListEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('list');
    });

    it('should detect detail endpoint', () => {
      const endpoint = createEndpoint('/users/{id}', 'get');
      expect(isDetailEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('read');
    });

    it('should detect create endpoint', () => {
      const endpoint = createEndpoint('/users', 'post');
      expect(isCreateEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('create');
    });

    it('should detect update endpoint (PUT)', () => {
      const endpoint = createEndpoint('/users/{id}', 'put');
      expect(isUpdateEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('update');
    });

    it('should detect update endpoint (PATCH)', () => {
      const endpoint = createEndpoint('/users/{id}', 'patch');
      expect(isUpdateEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('update');
    });

    it('should detect delete endpoint', () => {
      const endpoint = createEndpoint('/users/{id}', 'delete');
      expect(isDeleteEndpoint(endpoint)).toBe(true);
      expect(getCRUDOperation(endpoint)).toBe('delete');
    });
  });

  describe('findCRUDSets', () => {
    it('should find complete CRUD set', () => {
      const endpoints = [
        createEndpoint('/users', 'post', 'createUser'),
        createEndpoint('/users/{id}', 'get', 'getUser'),
        createEndpoint('/users/{id}', 'put', 'updateUser'),
        createEndpoint('/users/{id}', 'delete', 'deleteUser'),
        createEndpoint('/users', 'get', 'listUser'), // Singular to match other operationIds
      ];

      const crudSets = findCRUDSets(endpoints);

      expect(crudSets).toHaveLength(1);
      expect(crudSets[0]?.resource).toBe('user'); // Extracted from operationId
      expect(crudSets[0]?.create).toBeDefined();
      expect(crudSets[0]?.read).toBeDefined();
      expect(crudSets[0]?.update).toBeDefined();
      expect(crudSets[0]?.delete).toBeDefined();
      expect(crudSets[0]?.list).toBeDefined();
    });

    it('should find partial CRUD set (no delete)', () => {
      const endpoints = [
        createEndpoint('/products', 'post'),
        createEndpoint('/products/{id}', 'get'),
        createEndpoint('/products/{id}', 'put'),
      ];

      const crudSets = findCRUDSets(endpoints);

      expect(crudSets).toHaveLength(1);
      expect(crudSets[0]?.create).toBeDefined();
      expect(crudSets[0]?.read).toBeDefined();
      expect(crudSets[0]?.update).toBeDefined();
      expect(crudSets[0]?.delete).toBeUndefined();
    });

    it('should find multiple CRUD sets', () => {
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users/{id}', 'get'),
        createEndpoint('/products', 'post'),
        createEndpoint('/products/{id}', 'get'),
      ];

      const crudSets = findCRUDSets(endpoints);

      expect(crudSets).toHaveLength(2);
      const resources = crudSets.map((s) => s.resource);
      expect(resources).toContain('users');
      expect(resources).toContain('products');
    });

    it('should handle empty endpoint list', () => {
      const crudSets = findCRUDSets([]);
      expect(crudSets).toHaveLength(0);
    });
  });

  describe('findCreateReadPairs', () => {
    it('should find create-read pair', () => {
      const endpoints = [
        createEndpoint('/users', 'post', 'createUser'),
        createEndpoint('/users/{id}', 'get', 'getUser'),
      ];

      const pairs = findCreateReadPairs(endpoints);

      expect(pairs).toHaveLength(1);
      expect(pairs[0]?.[0].method).toBe('post');
      expect(pairs[0]?.[1].method).toBe('get');
    });

    it('should find multiple create-read pairs', () => {
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users/{id}', 'get'),
        createEndpoint('/products', 'post'),
        createEndpoint('/products/{id}', 'get'),
      ];

      const pairs = findCreateReadPairs(endpoints);

      expect(pairs).toHaveLength(2);
    });

    it('should not find pairs when GET has no ID', () => {
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users', 'get'), // List endpoint, not detail
      ];

      const pairs = findCreateReadPairs(endpoints);

      expect(pairs).toHaveLength(0);
    });

    it('should handle empty endpoint list', () => {
      const pairs = findCreateReadPairs([]);
      expect(pairs).toHaveLength(0);
    });
  });

  describe('groupByResource', () => {
    it('should group endpoints by resource', () => {
      const endpoints = [
        createEndpoint('/users', 'get'),
        createEndpoint('/users/{id}', 'get'),
        createEndpoint('/products', 'get'),
        createEndpoint('/products/{id}', 'get'),
      ];

      const groups = groupByResource(endpoints);

      expect(groups.size).toBe(2);
      expect(groups.get('users')).toHaveLength(2);
      expect(groups.get('products')).toHaveLength(2);
    });

    it('should handle single resource', () => {
      const endpoints = [
        createEndpoint('/users', 'get'),
        createEndpoint('/users', 'post'),
      ];

      const groups = groupByResource(endpoints);

      expect(groups.size).toBe(1);
      expect(groups.get('users')).toHaveLength(2);
    });

    it('should handle empty endpoint list', () => {
      const groups = groupByResource([]);
      expect(groups.size).toBe(0);
    });
  });

  describe('analyzeEndpointDependencies', () => {
    it('should analyze complete dependency graph', () => {
      const endpoints = [
        createEndpoint('/users', 'post', 'createUser'),
        createEndpoint('/users/{id}', 'get', 'getUser'),
        createEndpoint('/users/{id}', 'put', 'updateUser'),
        createEndpoint('/users/{id}', 'delete', 'deleteUser'),
        createEndpoint('/users', 'get', 'listUsers'),
      ];

      const graph = analyzeEndpointDependencies(endpoints);

      expect(graph.crudSets).toHaveLength(1);
      expect(graph.createReadPairs).toHaveLength(1);
      expect(graph.resourceGroups.size).toBeGreaterThan(0);
      expect(graph.dependencies.size).toBeGreaterThan(0);
    });

    it('should detect dependencies for endpoints with IDs', () => {
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users/{id}', 'get'),
      ];

      const graph = analyzeEndpointDependencies(endpoints);

      // GET /users/{id} depends on POST /users
      expect(graph.dependencies.has('/users/{id}')).toBe(true);
      expect(graph.dependencies.get('/users/{id}')).toContain('/users');
    });

    it('should handle nested resources', () => {
      const endpoints = [
        createEndpoint('/users', 'post'),
        createEndpoint('/users/{userId}/posts', 'get'),
      ];

      const graph = analyzeEndpointDependencies(endpoints);

      // /users/{userId}/posts depends on /users
      expect(graph.dependencies.has('/users/{userId}/posts')).toBe(true);
    });
  });
});
