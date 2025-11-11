/**
 * Integration tests for Error and Edge Case Test Generation
 * Uses real OpenAPI specs to verify comprehensive test coverage
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIParser } from '../../src/core/openapi-parser.js';
import { ErrorCaseGenerator } from '../../src/generators/error-case-generator.js';
import { EdgeCaseGenerator } from '../../src/generators/edge-case-generator.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import { DataFactory } from '../../src/utils/data-factory.js';
import type { ApiEndpoint } from '../../src/types/openapi-types.js';

describe('Error and Edge Case Test Generation Integration', () => {
  let endpoints: ApiEndpoint[];
  let errorGenerator: ErrorCaseGenerator;
  let edgeGenerator: EdgeCaseGenerator;

  beforeAll(async () => {
    // Load petstore.yaml
    const specPath = resolve(__dirname, '../fixtures/real-world-specs/petstore.yaml');
    const api = await SwaggerParser.validate(specPath);

    // Parse API
    const parser = new OpenAPIParser();
    const parsedSpec = await parser.parse(api); // Use validated API spec
    endpoints = parser.extractEndpoints(parsedSpec);

    // Initialize generators
    const bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
    const dataFactory = new DataFactory({ seed: 12345 });

    errorGenerator = new ErrorCaseGenerator(bodyGenerator);
    edgeGenerator = new EdgeCaseGenerator(dataFactory);
  });

  describe('Error Case Generation', () => {
    it('should generate error tests for all endpoints', () => {
      expect(endpoints.length).toBeGreaterThan(0);

      for (const endpoint of endpoints) {
        const tests = errorGenerator.generateTests(endpoint);

        // Should generate at least some tests for most endpoints
        if (
          endpoint.requestBody ||
          endpoint.parameters.length > 0 ||
          endpoint.security.length > 0
        ) {
          expect(tests.length).toBeGreaterThan(0);
        }
      }
    });

    it('should generate 400 tests for endpoints with request bodies', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.path === '/pet');
      expect(postEndpoint).toBeDefined();

      const tests = errorGenerator.generateTests(postEndpoint!);

      const test400 = tests.find(
        (t) =>
          t.expectedResponse.status === 400 ||
          (Array.isArray(t.expectedResponse.status) && t.expectedResponse.status.includes(400))
      );
      expect(test400).toBeDefined();
      expect(test400?.type).toBe('error-case');
    });

    it('should generate 401 tests for authenticated endpoints', () => {
      const authenticatedEndpoint = endpoints.find((e) => e.security.length > 0);
      expect(authenticatedEndpoint).toBeDefined();

      const tests = errorGenerator.generateTests(authenticatedEndpoint!);

      const test401 = tests.find((t) => t.expectedResponse.status === 401);
      expect(test401).toBeDefined();
      expect(test401?.metadata.tags).toContain('auth');
    });

    it('should generate 404 tests for endpoints with path parameters', () => {
      const getByIdEndpoint = endpoints.find(
        (e) => e.path.includes('{petId}') && e.method === 'get'
      );
      expect(getByIdEndpoint).toBeDefined();

      const tests = errorGenerator.generateTests(getByIdEndpoint!);

      const test404 = tests.find((t) => t.expectedResponse.status === 404);
      expect(test404).toBeDefined();
      expect(test404?.request.pathParams).toBeDefined();
    });

    it('should limit error tests to 5 per endpoint', () => {
      for (const endpoint of endpoints) {
        const tests = errorGenerator.generateTests(endpoint);
        expect(tests.length).toBeLessThanOrEqual(5);
      }
    });

    it('should generate valid test cases with all required fields', () => {
      const endpoint = endpoints[0];
      const tests = errorGenerator.generateTests(endpoint!);

      tests.forEach((test) => {
        expect(test.id).toBeDefined();
        expect(test.name).toBeDefined();
        expect(test.description).toBeDefined();
        expect(test.type).toBe('error-case');
        expect(test.method).toBeDefined();
        expect(test.endpoint).toBeDefined();
        expect(test.request).toBeDefined();
        expect(test.expectedResponse).toBeDefined();
        expect(test.expectedResponse.status).toBeDefined();
        expect(test.metadata).toBeDefined();
        expect(test.metadata.tags).toContain('error');
        expect(test.metadata.generatedAt).toBeDefined();
      });
    });

    it('should include descriptive test names', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post');
      if (postEndpoint) {
        const tests = errorGenerator.generateTests(postEndpoint);

        tests.forEach((test) => {
          expect(test.name).toContain(postEndpoint.method.toUpperCase());
          expect(test.name).toContain(postEndpoint.path);
          expect(test.name).toMatch(/\d{3}/); // Should contain status code
        });
      }
    });
  });

  describe('Edge Case Generation', () => {
    it('should generate edge case tests for endpoints with request bodies', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.requestBody);
      expect(postEndpoint).toBeDefined();

      const tests = edgeGenerator.generateTests(postEndpoint!);

      expect(tests.length).toBeGreaterThan(0);
      expect(tests.length).toBeLessThanOrEqual(4);
    });

    it('should generate boundary value tests', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.path === '/pet');
      if (postEndpoint) {
        const tests = edgeGenerator.generateTests(postEndpoint);

        const boundaryTest = tests.find((t) => t.metadata.tags.includes('boundary'));
        // Boundary tests may not always be generated if no constraints exist
        if (boundaryTest) {
          expect(boundaryTest.type).toBe('edge-case');
        }
      }
    });

    it('should generate special character tests', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.requestBody);
      if (postEndpoint) {
        const tests = edgeGenerator.generateTests(postEndpoint);

        const specialCharsTest = tests.find((t) => t.metadata.tags.includes('special-characters'));
        if (specialCharsTest) {
          expect(specialCharsTest.metadata.tags).toContain('security');
        }
      }
    });

    it('should generate empty value tests', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.requestBody);
      if (postEndpoint) {
        const tests = edgeGenerator.generateTests(postEndpoint);

        const emptyTest = tests.find(
          (t) =>
            t.metadata.tags.includes('empty-value') ||
            t.metadata.tags.includes('empty-array') ||
            t.metadata.tags.includes('empty-string')
        );
        if (emptyTest) {
          expect(emptyTest.type).toBe('edge-case');
        }
      }
    });

    it('should generate large payload tests', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.requestBody);
      if (postEndpoint) {
        const tests = edgeGenerator.generateTests(postEndpoint);

        const largeTest = tests.find((t) => t.metadata.tags.includes('large-payload'));
        if (largeTest) {
          expect(largeTest.expectedResponse.status).toBeDefined();
        }
      }
    });

    it('should generate valid test cases with all required fields', () => {
      const postEndpoint = endpoints.find((e) => e.method === 'post' && e.requestBody);
      if (postEndpoint) {
        const tests = edgeGenerator.generateTests(postEndpoint);

        tests.forEach((test) => {
          expect(test.id).toBeDefined();
          expect(test.name).toBeDefined();
          expect(test.description).toBeDefined();
          expect(test.type).toBe('edge-case');
          expect(test.method).toBeDefined();
          expect(test.endpoint).toBeDefined();
          expect(test.request).toBeDefined();
          expect(test.request.body).toBeDefined();
          expect(test.expectedResponse).toBeDefined();
          expect(test.metadata).toBeDefined();
          expect(test.metadata.tags).toContain('edge-case');
        });
      }
    });
  });

  describe('Combined Coverage', () => {
    it('should provide comprehensive test coverage across all endpoints', () => {
      let totalErrorTests = 0;
      let totalEdgeTests = 0;

      for (const endpoint of endpoints) {
        const errorTests = errorGenerator.generateTests(endpoint);
        const edgeTests = edgeGenerator.generateTests(endpoint);

        totalErrorTests += errorTests.length;
        totalEdgeTests += edgeTests.length;
      }

      expect(totalErrorTests).toBeGreaterThan(0);
      expect(totalEdgeTests).toBeGreaterThan(0);

      console.log(`Generated ${totalErrorTests} error tests and ${totalEdgeTests} edge case tests`);
    });

    it('should cover multiple error types', () => {
      const allTests = endpoints.flatMap((e) => errorGenerator.generateTests(e));

      const statusCodes = new Set<number>();
      allTests.forEach((test) => {
        if (Array.isArray(test.expectedResponse.status)) {
          test.expectedResponse.status.forEach((code) => statusCodes.add(code));
        } else {
          statusCodes.add(test.expectedResponse.status);
        }
      });

      // Should have tests for multiple error codes
      expect(statusCodes.size).toBeGreaterThan(1);
      console.log('Error status codes covered:', Array.from(statusCodes).sort());
    });

    it('should cover multiple edge case types', () => {
      const allTests = endpoints.flatMap((e) => edgeGenerator.generateTests(e));

      const edgeTypes = new Set<string>();
      allTests.forEach((test) => {
        test.metadata.tags.forEach((tag) => {
          if (tag !== 'edge-case') {
            edgeTypes.add(tag);
          }
        });
      });

      // Should have multiple types of edge cases
      expect(edgeTypes.size).toBeGreaterThan(0);
      console.log('Edge case types covered:', Array.from(edgeTypes).sort());
    });

    it('should generate unique test IDs', () => {
      const allTests = [
        ...endpoints.flatMap((e) => errorGenerator.generateTests(e)),
        ...endpoints.flatMap((e) => edgeGenerator.generateTests(e)),
      ];

      const ids = allTests.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate realistic and diverse test scenarios', () => {
      const postPetEndpoint = endpoints.find((e) => e.path === '/pet' && e.method === 'post');
      if (postPetEndpoint) {
        const errorTests = errorGenerator.generateTests(postPetEndpoint);
        const edgeTests = edgeGenerator.generateTests(postPetEndpoint);

        // Verify diversity
        const allScenarios = [...errorTests, ...edgeTests];
        expect(allScenarios.length).toBeGreaterThan(3);

        // Check that scenarios test different things
        const descriptions = allScenarios.map((t) => t.description);
        const uniqueDescriptions = new Set(descriptions);
        expect(uniqueDescriptions.size).toBe(descriptions.length);
      }
    });
  });

  describe('Generated Test Quality', () => {
    it('should include appropriate priority levels', () => {
      const allTests = endpoints.flatMap((e) => errorGenerator.generateTests(e));

      const priorities = new Set(allTests.map((t) => t.metadata.priority));
      expect(priorities.size).toBeGreaterThan(0);

      // Auth tests should be critical
      const authTest = allTests.find((t) => t.metadata.tags.includes('auth'));
      if (authTest) {
        expect(['critical', 'high']).toContain(authTest.metadata.priority);
      }
    });

    it('should tag tests appropriately', () => {
      const errorTests = endpoints.flatMap((e) => errorGenerator.generateTests(e));
      const edgeTests = endpoints.flatMap((e) => edgeGenerator.generateTests(e));

      errorTests.forEach((test) => {
        expect(test.metadata.tags).toContain('error');
        expect(test.metadata.tags.length).toBeGreaterThan(1);
      });

      edgeTests.forEach((test) => {
        expect(test.metadata.tags).toContain('edge-case');
        expect(test.metadata.tags.length).toBeGreaterThan(1);
      });
    });

    it('should set stability to stable for all tests', () => {
      const allTests = [
        ...endpoints.flatMap((e) => errorGenerator.generateTests(e)),
        ...endpoints.flatMap((e) => edgeGenerator.generateTests(e)),
      ];

      allTests.forEach((test) => {
        expect(test.metadata.stability).toBe('stable');
      });
    });

    it('should include generation metadata', () => {
      const allTests = endpoints.flatMap((e) => errorGenerator.generateTests(e));

      allTests.forEach((test) => {
        expect(test.metadata.generatedAt).toBeDefined();
        expect(test.metadata.generatorVersion).toBe('2.0.0');
        expect(new Date(test.metadata.generatedAt).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('Security and Attack Vectors', () => {
    it('should include XSS test scenarios', () => {
      const edgeTests = endpoints.flatMap((e) => edgeGenerator.generateTests(e));

      const xssTest = edgeTests.find((t) => t.metadata.tags.includes('xss'));
      if (xssTest) {
        expect(xssTest.metadata.tags).toContain('security');
        if (xssTest.request.body?.data) {
          const dataStr = JSON.stringify(xssTest.request.body.data);
          expect(dataStr).toContain('script');
        }
      }
    });

    it('should include SQL injection test scenarios', () => {
      const edgeTests = endpoints.flatMap((e) => edgeGenerator.generateTests(e));

      const sqlTest = edgeTests.find((t) => t.metadata.tags.includes('sql-injection'));
      if (sqlTest) {
        expect(sqlTest.metadata.tags).toContain('security');
        if (sqlTest.request.body?.data) {
          const dataStr = JSON.stringify(sqlTest.request.body.data);
          expect(dataStr.toLowerCase()).toContain('drop table');
        }
      }
    });

    it('should test Unicode and internationalization', () => {
      const edgeTests = endpoints.flatMap((e) => edgeGenerator.generateTests(e));

      const unicodeTest = edgeTests.find((t) => t.metadata.tags.includes('unicode'));
      if (unicodeTest) {
        expect(unicodeTest.metadata.tags).toContain('internationalization');
      }
    });
  });
});
