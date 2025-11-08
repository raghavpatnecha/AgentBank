/**
 * Edge Case Generator - Generates edge case and boundary value tests
 * Covers empty values, boundaries, special characters, large payloads, etc.
 */

import { DataFactory } from '../utils/data-factory.js';
import type { ApiEndpoint, SchemaObject } from '../types/openapi-types.js';
import type { TestCase } from '../types/test-generator-types.js';

/**
 * Edge Case Generator
 * Generates 2-4 edge case tests per endpoint
 */
export class EdgeCaseGenerator {
  private dataFactory: DataFactory;

  constructor(dataFactory: DataFactory) {
    this.dataFactory = dataFactory;
  }

  /**
   * Generate all edge case tests for an endpoint
   */
  generateTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // Generate boundary value tests
    tests.push(...this.generateBoundaryTests(endpoint));

    // Generate special character tests
    tests.push(...this.generateSpecialCharacterTests(endpoint));

    // Generate empty/null value tests
    tests.push(...this.generateEmptyValueTests(endpoint));

    // Generate large payload tests
    tests.push(...this.generateLargePayloadTests(endpoint));

    // Limit to 2-4 tests per endpoint
    return tests.slice(0, 4);
  }

  /**
   * Generate boundary value test cases
   */
  private generateBoundaryTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    if (!endpoint.requestBody?.content?.['application/json']) {
      return tests;
    }

    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = fieldSchema as SchemaObject;

        // Test: Maximum length for strings
        if (field.type === 'string' && field.maxLength !== undefined) {
          const maxLengthString = 'a'.repeat(field.maxLength);

          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-max-length`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} at maximum length`,
            description: `Test ${fieldName} with exactly maxLength (${field.maxLength}) characters`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: maxLengthString }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204], // Should succeed at boundary
            },
            metadata: {
              tags: ['edge-case', 'boundary', 'maxLength'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break; // One boundary test is enough
        }

        // Test: Minimum value for numbers
        if ((field.type === 'number' || field.type === 'integer') && field.minimum !== undefined) {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-min-value`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} at minimum value`,
            description: `Test ${fieldName} with exactly minimum value (${field.minimum})`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: field.minimum }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204],
            },
            metadata: {
              tags: ['edge-case', 'boundary', 'minimum'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }

        // Test: Maximum value for numbers
        if ((field.type === 'number' || field.type === 'integer') && field.maximum !== undefined) {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-max-value`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} at maximum value`,
            description: `Test ${fieldName} with exactly maximum value (${field.maximum})`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: field.maximum }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204],
            },
            metadata: {
              tags: ['edge-case', 'boundary', 'maximum'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }
      }
    }

    return tests;
  }

  /**
   * Generate special character test cases
   */
  private generateSpecialCharacterTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    if (!endpoint.requestBody?.content?.['application/json']) {
      return tests;
    }

    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.properties) {
      // Find first string field for special character testing
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = fieldSchema as SchemaObject;

        if (field.type === 'string' && field.format !== 'email' && field.format !== 'uuid') {
          // Test: Special characters including potential XSS/SQL injection
          const specialChars = "O'Brien-Smith <script>alert('XSS')</script> & DROP TABLE users;";

          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-special-chars`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} with special characters`,
            description: `Test ${fieldName} with special characters, potential XSS and SQL injection patterns`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: specialChars }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400], // May accept or reject
            },
            metadata: {
              tags: ['edge-case', 'special-characters', 'security', 'xss', 'sql-injection'],
              priority: 'high',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });

          // Test: Unicode characters
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-unicode`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} with Unicode characters`,
            description: `Test ${fieldName} with various Unicode characters (emoji, CJK, etc.)`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, {
                  [fieldName]: '你好世界 🌍 Привет Мир café ñoño',
                }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400],
            },
            metadata: {
              tags: ['edge-case', 'unicode', 'internationalization'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });

          break; // Only test first suitable string field
        }
      }
    }

    return tests;
  }

  /**
   * Generate empty/null value test cases
   */
  private generateEmptyValueTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    if (!endpoint.requestBody?.content?.['application/json']) {
      return tests;
    }

    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.properties) {
      // Find an optional field to test with empty value
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = fieldSchema as SchemaObject;
        const isRequired = schema.required?.includes(fieldName);

        // Test empty string for optional string fields
        if (!isRequired && field.type === 'string') {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-empty-string`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} as empty string`,
            description: `Test optional ${fieldName} with empty string value`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: '' }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400], // May accept or reject
            },
            metadata: {
              tags: ['edge-case', 'empty-value'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }

        // Test empty array for optional array fields
        if (!isRequired && field.type === 'array') {
          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-empty-array`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} as empty array`,
            description: `Test optional ${fieldName} with empty array`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: [] }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400],
            },
            metadata: {
              tags: ['edge-case', 'empty-array'],
              priority: 'medium',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }
      }
    }

    return tests;
  }

  /**
   * Generate large payload test cases
   */
  private generateLargePayloadTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    if (!endpoint.requestBody?.content?.['application/json']) {
      return tests;
    }

    const schema = endpoint.requestBody.content['application/json'].schema as SchemaObject;

    if (schema.properties) {
      // Find a string field to test with very long value
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const field = fieldSchema as SchemaObject;

        if (field.type === 'string' && !field.maxLength) {
          // Generate a very long string (10KB)
          const largeString = 'a'.repeat(10000);

          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-large-string`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} with very long value`,
            description: `Test ${fieldName} with large string value (10KB)`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: largeString }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400, 413], // 413 Payload Too Large
            },
            metadata: {
              tags: ['edge-case', 'large-payload'],
              priority: 'low',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }

        // Test array with many items
        if (field.type === 'array' && !field.maxItems) {
          const largeArray = Array(100).fill(this.dataFactory.generate(field.items as SchemaObject));

          tests.push({
            id: `${endpoint.operationId || endpoint.path}-edge-large-array`,
            name: `${endpoint.method.toUpperCase()} ${endpoint.path} - ${fieldName} with many items`,
            description: `Test ${fieldName} with large array (100 items)`,
            type: 'edge-case',
            method: endpoint.method,
            endpoint: endpoint.path,
            request: {
              body: {
                contentType: 'application/json',
                data: this.generateValidBody(schema, { [fieldName]: largeArray }),
                schema,
                generated: true,
              },
            },
            expectedResponse: {
              status: [200, 201, 204, 400, 413],
            },
            metadata: {
              tags: ['edge-case', 'large-array'],
              priority: 'low',
              stability: 'stable',
              operationId: endpoint.operationId,
              generatedAt: new Date().toISOString(),
              generatorVersion: '2.0.0',
            },
          });
          break;
        }
      }
    }

    return tests;
  }

  /**
   * Generate a valid request body with specific field overrides
   */
  private generateValidBody(schema: SchemaObject, overrides: Record<string, unknown>): Record<string, unknown> {
    const baseBody = this.dataFactory.generate(schema) as Record<string, unknown>;

    // Merge overrides
    return {
      ...baseBody,
      ...overrides,
    };
  }

}
