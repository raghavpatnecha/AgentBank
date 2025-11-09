/**
 * Error Case Generator - Generates comprehensive error test cases
 * Covers 400, 401, 403, 404, 405, 422 status codes
 */

import type { RequestBodyGenerator } from './request-body-generator.js';
import {
  detectErrorResponses,
  supportsErrorCode,
  generateInvalidValue,
} from '../utils/error-helper.js';
import type { ApiEndpoint, SchemaObject } from '../types/openapi-types.js';
import type { TestCase } from '../types/test-generator-types.js';

/**
 * Error Case Generator
 * Generates 3-5 error test cases per endpoint
 */
export class ErrorCaseGenerator {
  // bodyGenerator reserved for future use in generating complex invalid request bodies
  // @ts-expect-error - Reserved for future use
  constructor(private _bodyGenerator: RequestBodyGenerator) {}

  /**
   * Generate all error test cases for an endpoint
   */
  generateTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Detect explicit error responses from spec
    const errorResponses = detectErrorResponses(endpoint);

    // Generate 400 Bad Request tests
    tests.push(...this.generate400Tests(endpoint));

    // Generate 401 Unauthorized tests
    if (supportsErrorCode(endpoint, 401)) {
      tests.push(...this.generate401Tests(endpoint));
    }

    // Generate 403 Forbidden tests
    if (supportsErrorCode(endpoint, 403)) {
      tests.push(...this.generate403Tests(endpoint));
    }

    // Generate 404 Not Found tests
    if (supportsErrorCode(endpoint, 404)) {
      tests.push(...this.generate404Tests(endpoint));
    }

    // Generate 405 Method Not Allowed tests (if explicitly in spec)
    if (errorResponses.some((r) => r.statusCode === 405)) {
      tests.push(...this.generate405Tests(endpoint));
    }

    // Generate 422 Unprocessable Entity tests
    if (supportsErrorCode(endpoint, 422) || endpoint.requestBody) {
      tests.push(...this.generate422Tests(endpoint));
    }

    // Limit to 3-5 tests per endpoint to avoid overwhelming test suites
    return tests.slice(0, 5);
  }

  /**
   * Generate 400 Bad Request test cases
   */
  private generate400Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Test 1: Missing required body field
    if (endpoint.requestBody?.required && endpoint.requestBody.content?.['application/json']) {
      const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

      if (schema.required && schema.required.length > 0) {
        const requiredField = schema.required[0];

        // Generate body with all fields except the first required one
        const incompleteData: Record<string, unknown> = {};

        tests.push({
          id: `${endpoint.operationId || endpoint.path}-400-missing-field`,
          name: `${endpoint.method.toUpperCase()} ${endpoint.path} - missing required field '${requiredField}' (400)`,
          description: `Verify that omitting required field '${requiredField}' returns 400 Bad Request`,
          type: 'error-case',
          method: endpoint.method,
          endpoint: endpoint.path,
          request: {
            body: {
              contentType: 'application/json',
              data: incompleteData,
              schema,
              generated: true,
            },
          },
          expectedResponse: {
            status: 400,
            body: {
              customRules: [
                {
                  name: 'error-message-contains-field',
                  path: '$.message',
                  type: 'pattern',
                  config: requiredField,
                  errorMessage: `Error message should mention missing field '${requiredField}'`,
                },
              ],
            },
          },
          metadata: {
            tags: ['error', '400', 'validation'],
            priority: 'high',
            stability: 'stable',
            operationId: endpoint.operationId,
            generatedAt: new Date().toISOString(),
            generatorVersion: '2.0.0',
          },
        });
      }
    }

    // Test 2: Invalid data type in body
    if (endpoint.requestBody?.content?.['application/json']) {
      const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

      if (schema.properties) {
        const firstProp = Object.entries(schema.properties)[0];
        if (firstProp) {
          const [fieldName, fieldSchema] = firstProp;
          const invalidValue = generateInvalidValue(fieldSchema as SchemaObject);

          tests.push({
            id: `${endpoint.operationId || endpoint.path}-400-invalid-type`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - invalid type for '${fieldName}' (400)`,
            description: `Verify that sending wrong data type for '${fieldName}' returns 400`,
            type: 'error-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: { [fieldName]: invalidValue },
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: 400,
            },
            metadata: {
              tags: ['error', '400', 'type-validation'],
              priority: 'high',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
        }
      }
    }

    // Test 3: Missing required query/path parameter
    const requiredParam = endpoint.parameters.find((p) => p.required);
    if (requiredParam) {
      tests.push({
        id: `${endpoint.operationId || endpoint.path}-400-missing-param`,
        name: `${endpoint.method.toUpperCase()} ${endpoint.path} - missing required parameter '${requiredParam.name}' (400)`,
        description: `Verify that omitting required parameter '${requiredParam.name}' returns 400`,
        type: 'error-case',
        method: endpoint.method,
        endpoint: endpoint.path,
        request: {
          queryParams: requiredParam.in === 'query' ? {} : undefined,
          pathParams: requiredParam.in === 'path' ? {} : undefined,
        },
        expectedResponse: {
          status: 400,
        },
        metadata: {
          tags: ['error', '400', 'parameters'],
          priority: 'high',
          stability: 'stable',
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '2.0.0',
        },
      });
    }

    return tests;
  }

  /**
   * Generate 401 Unauthorized test cases
   */
  private generate401Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Test: No authentication provided
    tests.push({
      id: `${endpoint.operationId || endpoint.path}-401-no-auth`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - no authentication (401)`,
      description: 'Verify that request without authentication credentials returns 401',
      type: 'error-case',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {}, // Explicitly no auth headers
      },
      expectedResponse: {
        status: 401,
        body: {
          customRules: [
            {
              name: 'has-error-message',
              path: '$.message',
              type: 'type',
              config: 'string',
            },
          ],
        },
      },
      metadata: {
        tags: ['error', '401', 'auth'],
        priority: 'critical',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
      },
    });

    // Test: Invalid authentication token
    tests.push({
      id: `${endpoint.operationId || endpoint.path}-401-invalid-token`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - invalid authentication token (401)`,
      description: 'Verify that request with invalid token returns 401',
      type: 'error-case',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      },
      expectedResponse: {
        status: 401,
      },
      metadata: {
        tags: ['error', '401', 'auth', 'invalid-token'],
        priority: 'critical',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
      },
    });

    return tests;
  }

  /**
   * Generate 403 Forbidden test cases
   */
  private generate403Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Test: Valid auth but insufficient permissions
    tests.push({
      id: `${endpoint.operationId || endpoint.path}-403-insufficient-perms`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - insufficient permissions (403)`,
      description: 'Verify that valid authentication with insufficient permissions returns 403',
      type: 'error-case',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {
          Authorization: 'Bearer valid-token-limited-scope',
        },
      },
      expectedResponse: {
        status: 403,
        body: {
          customRules: [
            {
              name: 'permission-denied-message',
              path: '$.message',
              type: 'type',
              config: 'string',
            },
          ],
        },
      },
      metadata: {
        tags: ['error', '403', 'auth', 'permissions'],
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
      },
    });

    return tests;
  }

  /**
   * Generate 404 Not Found test cases
   */
  private generate404Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Find path parameters (typically resource IDs)
    const pathParams = endpoint.parameters.filter((p) => p.in === 'path');

    for (const param of pathParams) {
      const schema = param.schema as SchemaObject;
      const nonExistentId =
        schema?.type === 'string'
          ? 'nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd'
          : 99999999;

      tests.push({
        id: `${endpoint.operationId || endpoint.path}-404-not-found`,
        name: `${endpoint.method.toUpperCase()} ${endpoint.path} - resource not found (404)`,
        description: `Verify that requesting non-existent ${param.name} returns 404`,
        type: 'error-case',
        method: endpoint.method,
        endpoint: endpoint.path,
        request: {
          pathParams: {
            [param.name]: {
              value: nonExistentId,
              description: 'Non-existent resource ID',
              generated: true,
            },
          },
        },
        expectedResponse: {
          status: 404,
          body: {
            customRules: [
              {
                name: 'not-found-message',
                path: '$.message',
                type: 'type',
                config: 'string',
              },
            ],
          },
        },
        metadata: {
          tags: ['error', '404', 'not-found'],
          priority: 'high',
          stability: 'stable',
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '2.0.0',
        },
      });
    }

    return tests;
  }

  /**
   * Generate 405 Method Not Allowed test cases
   */
  private generate405Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Suggest testing an unsupported method
    const unsupportedMethod = endpoint.method === 'get' ? 'POST' : 'GET';

    tests.push({
      id: `${endpoint.operationId || endpoint.path}-405-method-not-allowed`,
      name: `${unsupportedMethod} ${endpoint.path} - method not allowed (405)`,
      description: `Verify that ${unsupportedMethod} method returns 405 Method Not Allowed`,
      type: 'error-case',
      method: unsupportedMethod.toLowerCase() as any,
      endpoint: endpoint.path,
      request: {},
      expectedResponse: {
        status: 405,
        headers: {
          Allow: /GET|POST|PUT|DELETE|PATCH/i,
        },
      },
      metadata: {
        tags: ['error', '405', 'method'],
        priority: 'medium',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
      },
    });

    return tests;
  }

  /**
   * Generate 422 Unprocessable Entity test cases (validation failures)
   */
  private generate422Tests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    if (!endpoint.requestBody?.content?.['application/json']) {
      return tests;
    }

    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.properties) {
      // Test: Invalid email format
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = fieldSchema as SchemaObject;

        if (field.format === 'email') {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-422-invalid-email`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - invalid email format (422)`,
            description: `Verify that invalid email in '${fieldName}' returns 422`,
            type: 'error-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: {
                  [fieldName]: 'not-a-valid-email', // Match test expectation
                },
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [400, 422], // Some APIs use 400, some use 422
            },
            metadata: {
              tags: ['error', '422', 'validation', 'email'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break; // Only one email validation test
        }

        // Test: Value below minimum
        if ((field.type === 'number' || field.type === 'integer') && field.minimum !== undefined) {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-422-below-minimum`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} below minimum (422)`,
            description: `Verify that ${fieldName} below minimum value returns 422`,
            type: 'error-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: {
                  [fieldName]: field.minimum - 10,
                },
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [400, 422],
            },
            metadata: {
              tags: ['error', '422', 'validation', 'minimum'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break; // Only one minimum validation test
        }

        // Test: String too short
        if (field.type === 'string' && field.minLength !== undefined && field.minLength > 0) {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-422-string-too-short`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} too short (422)`,
            description: `Verify that ${fieldName} below minLength returns 422`,
            type: 'error-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: {
                  [fieldName]: '',
                },
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [400, 422],
            },
            metadata: {
              tags: ['error', '422', 'validation', 'minLength'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break; // Only one minLength validation test
        }
      }
    }

    return tests;
  }
}
