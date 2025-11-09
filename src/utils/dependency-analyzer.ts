/**
 * Dependency Analyzer - Analyzes endpoint relationships and dependencies
 * Detects CRUD sets, create-read pairs, and sequential dependencies
 */

import type { ApiEndpoint } from '../types/openapi-types.js';

/**
 * CRUD set representing a complete resource lifecycle
 */
export interface CRUDSet {
  /** Resource name (e.g., 'users', 'products') */
  resource: string;

  /** Create endpoint (POST) */
  create?: ApiEndpoint;

  /** Read endpoint (GET with ID parameter) */
  read?: ApiEndpoint;

  /** Update endpoint (PUT/PATCH with ID parameter) */
  update?: ApiEndpoint;

  /** Delete endpoint (DELETE with ID parameter) */
  delete?: ApiEndpoint;

  /** List endpoint (GET without ID parameter) */
  list?: ApiEndpoint;
}

/**
 * Dependency graph representing endpoint relationships
 */
export interface DependencyGraph {
  /** All detected CRUD sets */
  crudSets: CRUDSet[];

  /** Create-read pairs (POST followed by GET) */
  createReadPairs: Array<[ApiEndpoint, ApiEndpoint]>;

  /** Endpoints grouped by resource */
  resourceGroups: Map<string, ApiEndpoint[]>;

  /** Endpoints that require data from other endpoints */
  dependencies: Map<string, string[]>;
}

/**
 * Analyze endpoint dependencies and relationships
 */
export function analyzeEndpointDependencies(endpoints: ApiEndpoint[]): DependencyGraph {
  const crudSets = findCRUDSets(endpoints);
  const createReadPairs = findCreateReadPairs(endpoints);
  const resourceGroups = groupByResource(endpoints);
  const dependencies = analyzeDependencies(endpoints);

  return {
    crudSets,
    createReadPairs,
    resourceGroups,
    dependencies,
  };
}

/**
 * Find CRUD sets by analyzing endpoints
 */
export function findCRUDSets(endpoints: ApiEndpoint[]): CRUDSet[] {
  const resourceMap = new Map<string, CRUDSet>();

  for (const endpoint of endpoints) {
    const resource = extractResourceName(endpoint);
    if (!resource) continue;

    if (!resourceMap.has(resource)) {
      resourceMap.set(resource, { resource });
    }

    const crudSet = resourceMap.get(resource)!;
    const hasPathParam = hasIdParameter(endpoint);

    // Assign endpoint to appropriate CRUD operation
    switch (endpoint.method) {
      case 'post':
        if (!hasPathParam) {
          crudSet.create = endpoint;
        }
        break;

      case 'get':
        if (hasPathParam) {
          crudSet.read = endpoint;
        } else {
          crudSet.list = endpoint;
        }
        break;

      case 'put':
      case 'patch':
        if (hasPathParam) {
          crudSet.update = endpoint;
        }
        break;

      case 'delete':
        if (hasPathParam) {
          crudSet.delete = endpoint;
        }
        break;
    }
  }

  // Filter out incomplete CRUD sets (must have at least create and read)
  return Array.from(resourceMap.values()).filter(
    (set) => set.create || (set.read && set.list)
  );
}

/**
 * Find create-read pairs (POST followed by GET by ID)
 */
export function findCreateReadPairs(endpoints: ApiEndpoint[]): Array<[ApiEndpoint, ApiEndpoint]> {
  const pairs: Array<[ApiEndpoint, ApiEndpoint]> = [];
  const postEndpoints = endpoints.filter((e) => e.method === 'post');
  const getEndpoints = endpoints.filter((e) => e.method === 'get' && hasIdParameter(e));

  for (const postEndpoint of postEndpoints) {
    const resource = extractResourceName(postEndpoint);
    if (!resource) continue;

    // Find matching GET endpoint
    const getEndpoint = getEndpoints.find((get) => {
      const getResource = extractResourceName(get);
      return getResource === resource && hasIdParameter(get);
    });

    if (getEndpoint) {
      pairs.push([postEndpoint, getEndpoint]);
    }
  }

  return pairs;
}

/**
 * Group endpoints by resource name
 */
export function groupByResource(endpoints: ApiEndpoint[]): Map<string, ApiEndpoint[]> {
  const groups = new Map<string, ApiEndpoint[]>();

  for (const endpoint of endpoints) {
    const resource = extractResourceName(endpoint);
    if (!resource) continue;

    if (!groups.has(resource)) {
      groups.set(resource, []);
    }

    groups.get(resource)!.push(endpoint);
  }

  return groups;
}

/**
 * Analyze dependencies between endpoints
 */
export function analyzeDependencies(endpoints: ApiEndpoint[]): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();

  for (const endpoint of endpoints) {
    const deps: string[] = [];

    // Endpoints with path parameters depend on endpoints that create those resources
    if (hasIdParameter(endpoint)) {
      const resource = extractResourceName(endpoint);
      if (resource) {
        // Find the create endpoint for this resource
        const createEndpoint = endpoints.find(
          (e) => e.method === 'post' && extractResourceName(e) === resource
        );
        if (createEndpoint) {
          deps.push(createEndpoint.path);
        }
      }
    }

    // Check for nested resources (e.g., /users/{userId}/posts)
    const pathParts = endpoint.path.split('/');
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (pathParts[i]?.startsWith('{') && pathParts[i]?.endsWith('}')) {
        const parentResource = pathParts[i - 1];
        if (parentResource) {
          const parentCreatePath = `/${parentResource}`;
          deps.push(parentCreatePath);
        }
      }
    }

    if (deps.length > 0) {
      dependencies.set(endpoint.path, deps);
    }
  }

  return dependencies;
}

/**
 * Extract resource name from endpoint path
 */
export function extractResourceName(endpoint: ApiEndpoint): string | null {
  // Try operation ID first (most specific)
  if (endpoint.operationId) {
    // Extract resource from operationId (e.g., 'getUser' -> 'user')
    const match = endpoint.operationId.match(/(?:get|post|put|patch|delete|list|create|update|remove)(.+)/i);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  // Try tags (second most specific)
  if (endpoint.tags.length > 0) {
    return endpoint.tags[0]?.toLowerCase() ?? null;
  }

  // Fall back to path analysis
  const path = endpoint.path.replace(/^\/|\/$/g, '');
  const parts = path.split('/');

  // Common non-resource path segments to skip
  const skipSegments = ['api', 'v1', 'v2', 'v3', 'rest'];

  // Find the first meaningful non-parameter part
  for (const part of parts) {
    if (!part.startsWith('{') && !part.endsWith('}') &&
        part.length > 0 && !skipSegments.includes(part.toLowerCase())) {
      return part;
    }
  }

  // If all non-parameter parts were skipped, use the first non-parameter part
  for (const part of parts) {
    if (!part.startsWith('{') && !part.endsWith('}') && part.length > 0) {
      return part;
    }
  }

  return null;
}

/**
 * Check if endpoint has an ID parameter
 */
export function hasIdParameter(endpoint: ApiEndpoint): boolean {
  // Check path parameters
  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      const name = param.name.toLowerCase();
      if (name === 'id' || name.endsWith('id') || name === 'pk') {
        return true;
      }
    }
  }

  // Check path itself for parameter patterns
  const paramPattern = /\{[^}]*(id|pk)[^}]*\}/i;
  return paramPattern.test(endpoint.path);
}

/**
 * Check if endpoint is a list endpoint (GET without ID parameter)
 */
export function isListEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint.method === 'get' && !hasIdParameter(endpoint);
}

/**
 * Check if endpoint is a detail endpoint (GET with ID parameter)
 */
export function isDetailEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint.method === 'get' && hasIdParameter(endpoint);
}

/**
 * Check if endpoint is a create endpoint (POST)
 */
export function isCreateEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint.method === 'post' && !hasIdParameter(endpoint);
}

/**
 * Check if endpoint is an update endpoint (PUT/PATCH with ID)
 */
export function isUpdateEndpoint(endpoint: ApiEndpoint): boolean {
  return (endpoint.method === 'put' || endpoint.method === 'patch') && hasIdParameter(endpoint);
}

/**
 * Check if endpoint is a delete endpoint (DELETE with ID)
 */
export function isDeleteEndpoint(endpoint: ApiEndpoint): boolean {
  return endpoint.method === 'delete' && hasIdParameter(endpoint);
}

/**
 * Get CRUD operation type for endpoint
 */
export function getCRUDOperation(endpoint: ApiEndpoint): 'create' | 'read' | 'update' | 'delete' | 'list' | null {
  if (isCreateEndpoint(endpoint)) return 'create';
  if (isDetailEndpoint(endpoint)) return 'read';
  if (isUpdateEndpoint(endpoint)) return 'update';
  if (isDeleteEndpoint(endpoint)) return 'delete';
  if (isListEndpoint(endpoint)) return 'list';
  return null;
}
