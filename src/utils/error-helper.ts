/**
 * Error Helper - Utilities for detecting and generating error scenarios
 * Analyzes OpenAPI specs to identify error responses and generate test cases
 */

import type { ApiEndpoint, SchemaObject, ReferenceObject } from '../types/openapi-types.js';
import type { TestRequest } from '../types/test-generator-types.js';

/**
 * Error response information
 */
export interface ErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Error description */
  description: string;
  /** Response schema if available */
  schema?: SchemaObject;
  /** Example error response */
  example?: unknown;
}

/**
 * Error scenario for test generation
 */
export interface ErrorScenario {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Expected status code */
  statusCode: number;
  /** Request modifications to trigger error */
  request: TestRequest;
  /** Why this triggers the error */
  reason: string;
}

/**
 * Detect error responses from endpoint specification
 */
export function detectErrorResponses(endpoint: ApiEndpoint): ErrorResponse[] {
  const errorResponses: ErrorResponse[] = [];

  // Iterate through all responses
  for (const [statusKey, response] of endpoint.responses.entries()) {
    const status = typeof statusKey === 'string' ? parseInt(statusKey, 10) : statusKey;

    // Skip success responses (2xx) and default
    if (statusKey === 'default' || (status >= 200 && status < 300)) {
      continue;
    }

    // Extract schema if available
    let schema: SchemaObject | undefined;
    let example: unknown;

    if (response.content) {
      const jsonContent = response.content['application/json'];
      if (jsonContent?.schema) {
        schema = jsonContent.schema as SchemaObject;
        example = jsonContent.example;
      }
    }

    errorResponses.push({
      statusCode: status,
      description: response.description,
      schema,
      example,
    });
  }

  return errorResponses;
}

/**
 * Generate error scenario for specific error type
 */
export function generateErrorScenario(
  endpoint: ApiEndpoint,
  errorType: '400' | '401' | '403' | '404' | '405' | '422'
): ErrorScenario | null {
  switch (errorType) {
    case '400':
      return generate400Scenario(endpoint);
    case '401':
      return generate401Scenario(endpoint);
    case '403':
      return generate403Scenario(endpoint);
    case '404':
      return generate404Scenario(endpoint);
    case '405':
      return generate405Scenario(endpoint);
    case '422':
      return generate422Scenario(endpoint);
    default:
      return null;
  }
}

/**
 * Generate 400 Bad Request scenario (missing required field)
 */
function generate400Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  // Find a required field we can omit
  if (endpoint.requestBody?.required && endpoint.requestBody.content?.['application/json']) {
    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.required && schema.required.length > 0) {
      const requiredField = schema.required[0];

      return {
        name: `${endpoint.method.toUpperCase()} ${endpoint.path} - missing required field (400)`,
        description: `Test that omitting required field '${requiredField}' returns 400`,
        statusCode: 400,
        request: {
          body: {
            contentType: 'application/json',
            data: {}, // Empty body missing required field
            generated: true,
          },
        },
        reason: `Missing required field: ${requiredField}`,
      };
    }
  }

  // Try required parameters
  const requiredParam = endpoint.parameters.find(p => p.required);
  if (requiredParam) {
    return {
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - missing required parameter (400)`,
      description: `Test that omitting required parameter '${requiredParam.name}' returns 400`,
      statusCode: 400,
      request: {
        queryParams: requiredParam.in === 'query' ? {} : undefined,
        pathParams: requiredParam.in === 'path' ? {} : undefined,
      },
      reason: `Missing required parameter: ${requiredParam.name}`,
    };
  }

  return null;
}

/**
 * Generate 401 Unauthorized scenario
 */
function generate401Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  // Check if endpoint requires authentication
  const requiresAuth = endpoint.security.length > 0;

  if (!requiresAuth) {
    return null;
  }

  return {
    name: `${endpoint.method.toUpperCase()} ${endpoint.path} - no authentication (401)`,
    description: 'Test that request without authentication returns 401',
    statusCode: 401,
    request: {
      headers: {}, // No auth headers
    },
    reason: 'Missing authentication credentials',
  };
}

/**
 * Generate 403 Forbidden scenario
 */
function generate403Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  // Check if endpoint has specific permissions/scopes
  const requiresAuth = endpoint.security.length > 0;

  if (!requiresAuth) {
    return null;
  }

  return {
    name: `${endpoint.method.toUpperCase()} ${endpoint.path} - insufficient permissions (403)`,
    description: 'Test that valid auth with insufficient permissions returns 403',
    statusCode: 403,
    request: {
      headers: {
        'Authorization': 'Bearer invalid-or-limited-scope-token',
      },
    },
    reason: 'Valid authentication but insufficient permissions',
  };
}

/**
 * Generate 404 Not Found scenario
 */
function generate404Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  // Find path parameters (typically IDs)
  const pathParam = endpoint.parameters.find(p => p.in === 'path');

  if (!pathParam) {
    return null;
  }

  // Generate non-existent ID
  const schema = pathParam.schema;
  let nonExistentId: string | number = 99999999;

  if (schema && !isReference(schema)) {
    nonExistentId = schema.type === 'string'
      ? 'nonexistent-id-99999999'
      : 99999999;
  }

  return {
    name: `${endpoint.method.toUpperCase()} ${endpoint.path} - resource not found (404)`,
    description: `Test that requesting non-existent ${pathParam.name} returns 404`,
    statusCode: 404,
    request: {
      pathParams: {
        [pathParam.name]: {
          value: nonExistentId,
          description: 'Non-existent resource ID',
          generated: true,
        },
      },
    },
    reason: `Resource not found: ${pathParam.name} = ${nonExistentId}`,
  };
}

/**
 * Generate 405 Method Not Allowed scenario
 */
function generate405Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  // This would require knowing what methods are NOT supported
  // We can suggest testing an unsupported method
  const unsupportedMethod = endpoint.method === 'get' ? 'POST' : 'GET';

  return {
    name: `${unsupportedMethod} ${endpoint.path} - method not allowed (405)`,
    description: `Test that ${unsupportedMethod} method returns 405`,
    statusCode: 405,
    request: {},
    reason: `HTTP method ${unsupportedMethod} not supported for this endpoint`,
  };
}

/**
 * Generate 422 Unprocessable Entity scenario (validation failure)
 */
function generate422Scenario(endpoint: ApiEndpoint): ErrorScenario | null {
  if (!endpoint.requestBody?.content?.['application/json']) {
    return null;
  }

  const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

  // Find a field with validation constraints we can violate
  if (schema.properties) {
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      // Skip reference objects
      if (isReference(fieldSchema)) {
        continue;
      }

      const field = fieldSchema as SchemaObject;

      // String with pattern or format
      if (field.type === 'string' && (field.pattern || field.format === 'email')) {
        const invalidValue = field.format === 'email' ? 'not-an-email' : 'invalid!@#$';

        return {
          name: `${endpoint.method.toUpperCase()} ${endpoint.path} - invalid ${fieldName} format (422)`,
          description: `Test that invalid ${fieldName} format returns 422`,
          statusCode: 422,
          request: {
            body: {
              contentType: 'application/json',
              data: {
                [fieldName]: invalidValue,
              },
              generated: true,
            },
          },
          reason: `Invalid format for field: ${fieldName}`,
        };
      }

      // Number with min/max constraints
      if ((field.type === 'number' || field.type === 'integer') && field.minimum !== undefined) {
        return {
          name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} below minimum (422)`,
          description: `Test that ${fieldName} below minimum returns 422`,
          statusCode: 422,
          request: {
            body: {
              contentType: 'application/json',
              data: {
                [fieldName]: field.minimum - 10,
              },
              generated: true,
            },
          },
          reason: `Value below minimum for field: ${fieldName}`,
        };
      }
    }
  }

  return null;
}

/**
 * Get all common error scenarios for an endpoint
 */
export function getAllErrorScenarios(endpoint: ApiEndpoint): ErrorScenario[] {
  const scenarios: ErrorScenario[] = [];
  const errorTypes: Array<'400' | '401' | '403' | '404' | '405' | '422'> =
    ['400', '401', '403', '404', '405', '422'];

  for (const errorType of errorTypes) {
    const scenario = generateErrorScenario(endpoint, errorType);
    if (scenario) {
      scenarios.push(scenario);
    }
  }

  return scenarios;
}

/**
 * Check if endpoint is likely to support a specific error code
 */
export function supportsErrorCode(endpoint: ApiEndpoint, statusCode: number): boolean {
  // Check if explicitly defined in responses
  for (const [key] of endpoint.responses.entries()) {
    const code = typeof key === 'string' ? parseInt(key, 10) : key;
    if (code === statusCode) {
      return true;
    }
  }

  // Infer support based on endpoint characteristics
  switch (statusCode) {
    case 400:
      // Endpoints with request bodies or required params likely support 400
      return !!endpoint.requestBody || endpoint.parameters.some(p => p.required);

    case 401:
    case 403:
      // Endpoints with security requirements likely support 401/403
      return endpoint.security.length > 0;

    case 404:
      // Endpoints with path parameters likely support 404
      return endpoint.parameters.some(p => p.in === 'path');

    case 422:
      // Endpoints with validated request bodies likely support 422
      return !!endpoint.requestBody;

    default:
      return false;
  }
}

/**
 * Check if object is a ReferenceObject
 */
function isReference(obj: unknown): obj is ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}

/**
 * Generate invalid value for a schema
 */
export function generateInvalidValue(schema: SchemaObject): unknown {
  switch (schema.type) {
    case 'string':
      if (schema.format === 'email') return 'not-an-email';
      if (schema.format === 'uuid') return 'not-a-uuid';
      if (schema.format === 'uri' || schema.format === 'url') return 'not a url';
      if (schema.minLength) return ''; // Too short
      return 123; // Wrong type

    case 'number':
    case 'integer':
      if (schema.minimum !== undefined) return schema.minimum - 1;
      return 'not-a-number'; // Wrong type

    case 'boolean':
      return 'not-a-boolean'; // Wrong type

    case 'array':
      return 'not-an-array'; // Wrong type

    case 'object':
      return 'not-an-object'; // Wrong type

    default:
      return null;
  }
}

/**
 * Get validation rules from schema
 */
export function getValidationRules(schema: SchemaObject): string[] {
  const rules: string[] = [];

  if (schema.required && schema.required.length > 0) {
    rules.push(`Required fields: ${schema.required.join(', ')}`);
  }

  if (schema.minLength !== undefined) {
    rules.push(`Minimum length: ${schema.minLength}`);
  }

  if (schema.maxLength !== undefined) {
    rules.push(`Maximum length: ${schema.maxLength}`);
  }

  if (schema.minimum !== undefined) {
    rules.push(`Minimum value: ${schema.minimum}`);
  }

  if (schema.maximum !== undefined) {
    rules.push(`Maximum value: ${schema.maximum}`);
  }

  if (schema.pattern) {
    rules.push(`Pattern: ${schema.pattern}`);
  }

  if (schema.format) {
    rules.push(`Format: ${schema.format}`);
  }

  if (schema.enum) {
    rules.push(`Allowed values: ${schema.enum.join(', ')}`);
  }

  return rules;
}
