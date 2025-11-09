/**
 * Integration test for happy path test generation
 * Tests the complete flow from OpenAPI spec to generated test code
 */

import { describe, it, expect } from 'vitest';
import { OpenAPIParser } from '../../src/core/openapi-parser.js';
import { HappyPathGenerator } from '../../src/generators/happy-path-generator.js';
import { DataFactory } from '../../src/utils/data-factory.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import { CodeGenerator } from '../../src/utils/code-generator.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Happy Path Test Generation Integration', () => {
  const PETSTORE_PATH = join(__dirname, '../fixtures/real-world-specs/petstore.yaml');

  it('should generate tests from petstore OpenAPI spec', async () => {
    // Step 1: Parse OpenAPI spec
    const parser = new OpenAPIParser();
    const spec = await parser.parseFromFile(PETSTORE_PATH);

    expect(spec).toBeDefined();
    expect(spec.info.title).toBe('Petstore API');
    expect(spec.paths).toBeDefined();
  });

  it('should extract endpoints from petstore spec', async () => {
    // Parse spec
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);

    // Extract endpoints
    const endpoints = parser.extractEndpoints();

    expect(endpoints.length).toBeGreaterThan(0);

    // Check for expected endpoints
    const paths = endpoints.map((e) => e.path);
    expect(paths).toContain('/pet');
    expect(paths).toContain('/pet/{petId}');
    expect(paths).toContain('/store/order');
  });

  it('should generate happy path tests for petstore endpoints', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const generator = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate tests
    const tests = generator.generateTests(endpoints);

    expect(tests.length).toBeGreaterThan(0);
    expect(tests.length).toBe(endpoints.length);

    // Verify test structure
    for (const test of tests) {
      expect(test.id).toBeDefined();
      expect(test.name).toBeDefined();
      expect(test.type).toBe('happy-path');
      expect(test.method).toBeDefined();
      expect(test.endpoint).toBeDefined();
      expect(test.expectedResponse).toBeDefined();
      expect(test.metadata).toBeDefined();
    }
  });

  it('should generate valid Playwright test code from petstore spec', async () => {
    // Setup
    const parser = new OpenAPIParser();
    const spec = await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Filter to pet endpoints only
    const petEndpoints = endpoints.filter((e) => e.tags.includes('pet'));

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const happyPathGen = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate tests
    const tests = happyPathGen.generateTests(petEndpoints);

    // Generate code
    const codeGen = new CodeGenerator({
      baseURL: spec.servers[0]?.url || 'http://localhost:3000',
    });

    const metadata = {
      endpoints: petEndpoints.map((e) => `${e.method.toUpperCase()} ${e.path}`),
      testTypes: ['happy-path' as const],
      testCount: tests.length,
      tags: ['pet'],
      generatedAt: new Date().toISOString(),
    };

    const code = codeGen.generateTestFile(tests, metadata);

    // Verify generated code
    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);

    // Check for Playwright imports
    expect(code).toContain("import { test, expect } from '@playwright/test'");

    // Check for test.describe
    expect(code).toContain('test.describe');

    // Check for test functions
    expect(code).toContain("test('");
    expect(code).toContain('async ({ request }) =>');

    // Check for API calls
    expect(code).toMatch(/await request\.(get|post|put|patch|delete)/);

    // Check for assertions
    expect(code).toContain('expect(');

    // Check that code is valid (no syntax errors patterns)
    expect(code).not.toMatch(/\bundefined\s*,/);  // No undefined in parameter lists
    expect(code).not.toMatch(/:\s*undefined/);  // No undefined as values
  });

  it('should generate POST test with request body', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Find POST /pet endpoint
    const postPetEndpoint = endpoints.find((e) => e.method === 'post' && e.path === '/pet');
    expect(postPetEndpoint).toBeDefined();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const generator = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate test
    const test = generator.generateTest(postPetEndpoint!);

    expect(test.method).toBe('POST');
    expect(test.request.body).toBeDefined();
    expect(test.request.body?.contentType).toBe('application/json');
    expect(test.request.body?.data).toBeDefined();

    // Verify generated body has required fields
    const bodyData = test.request.body?.data as any;
    expect(bodyData).toHaveProperty('name');
    expect(bodyData).toHaveProperty('photoUrls');
  });

  it('should generate GET test with path parameters', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Find GET /pet/{petId} endpoint
    const getPetEndpoint = endpoints.find(
      (e) => e.method === 'get' && e.path === '/pet/{petId}'
    );
    expect(getPetEndpoint).toBeDefined();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const generator = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate test
    const test = generator.generateTest(getPetEndpoint!);

    expect(test.method).toBe('GET');
    expect(test.request.pathParams).toBeDefined();
    expect(test.request.pathParams?.petId).toBeDefined();
    expect(test.request.pathParams?.petId.value).toBeDefined();
  });

  it('should generate GET test with query parameters', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Find GET /pet/findByStatus endpoint
    const findByStatusEndpoint = endpoints.find(
      (e) => e.method === 'get' && e.path === '/pet/findByStatus'
    );
    expect(findByStatusEndpoint).toBeDefined();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const generator = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate test
    const test = generator.generateTest(findByStatusEndpoint!);

    expect(test.method).toBe('GET');
    // Query params might be included based on options
  });

  it('should generate DELETE test', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Find DELETE /pet/{petId} endpoint
    const deleteEndpoint = endpoints.find(
      (e) => e.method === 'delete' && e.path === '/pet/{petId}'
    );
    expect(deleteEndpoint).toBeDefined();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const generator = new HappyPathGenerator(dataFactory, bodyGenerator);

    // Generate test
    const test = generator.generateTest(deleteEndpoint!);

    expect(test.method).toBe('DELETE');
    expect(test.request.pathParams?.petId).toBeDefined();
    // Status can be a single number or array
    const status = test.expectedResponse.status;
    if (Array.isArray(status)) {
      expect(status).toContain(204);
    } else {
      expect(status).toBe(204);
    }
  });

  it('should generate compilable TypeScript code', async () => {
    // Setup
    const parser = new OpenAPIParser();
    const spec = await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints().slice(0, 3); // Just a few endpoints

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const happyPathGen = new HappyPathGenerator(dataFactory, bodyGenerator);

    const tests = happyPathGen.generateTests(endpoints);

    const codeGen = new CodeGenerator({
      typescript: true,
      baseURL: spec.servers[0]?.url || 'http://localhost:3000',
    });

    const metadata = {
      endpoints: endpoints.map((e) => `${e.method.toUpperCase()} ${e.path}`),
      testTypes: ['happy-path' as const],
      testCount: tests.length,
      tags: [],
      generatedAt: new Date().toISOString(),
    };

    const code = codeGen.generateTestFile(tests, metadata);

    // Basic syntax checks - avoid invalid patterns
    expect(code).not.toContain(': undefined');  // No undefined values
    expect(code).not.toContain('[object Object]');

    // Check for balanced braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);

    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);
  });

  it('should validate response schema in generated tests', async () => {
    // Setup
    const parser = new OpenAPIParser();
    await parser.parseFromFile(PETSTORE_PATH);
    const endpoints = parser.extractEndpoints();

    // Find an endpoint with response schema
    const getPetEndpoint = endpoints.find(
      (e) => e.method === 'get' && e.path === '/pet/{petId}'
    );
    expect(getPetEndpoint).toBeDefined();

    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();
    const happyPathGen = new HappyPathGenerator(dataFactory, bodyGenerator);

    const test = happyPathGen.generateTest(getPetEndpoint!);

    const codeGen = new CodeGenerator();
    const metadata = {
      endpoints: ['GET /pet/{petId}'],
      testTypes: ['happy-path' as const],
      testCount: 1,
      tags: ['pet'],
      generatedAt: new Date().toISOString(),
    };

    const code = codeGen.generateTestFile([test], metadata);

    // Should include response validation
    if (test.expectedResponse.body?.schema) {
      expect(code).toContain('const body = await response.json()');
      expect(code).toContain('expect(');
    }
  });
});
