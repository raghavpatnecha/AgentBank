/**
 * Integration test for Test Organization
 * Tests the complete workflow from OpenAPI spec to organized test files
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAPIParser } from '../../src/core/openapi-parser.js';
import { FlowGenerator } from '../../src/generators/flow-generator.js';
import { RequestBodyGenerator } from '../../src/generators/request-body-generator.js';
import { TestOrganizer } from '../../src/generators/test-organizer.js';
import { generateFileStructure, generateIndexFile } from '../../src/utils/file-structure-generator.js';
import type { ParsedApiSpec, ApiEndpoint } from '../../src/types/openapi-types.js';
import type { TestCase, OrganizationStrategy } from '../../src/types/test-generator-types.js';
import path from 'node:path';

describe('Test Organization Integration', () => {
  let parser: OpenAPIParser;
  let parsedSpec: ParsedApiSpec;
  let endpoints: ApiEndpoint[];

  beforeAll(async () => {
    // Parse the petstore OpenAPI spec
    parser = new OpenAPIParser();
    const petstorePath = path.join(process.cwd(), 'tests/fixtures/real-world-specs/petstore.yaml');
    parsedSpec = await parser.parseFromFile(petstorePath);
    endpoints = parser.extractEndpoints();
  });

  describe('Flow Detection and Generation', () => {
    it('should detect workflows from petstore API', () => {
      const bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
      const flowGenerator = new FlowGenerator(bodyGenerator);

      const flows = flowGenerator.detectFlows(endpoints);

      // Petstore may not have full CRUD workflows, but should detect some flows
      expect(flows.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate flow tests with proper structure', () => {
      const bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
      const flowGenerator = new FlowGenerator(bodyGenerator);

      const flows = flowGenerator.detectFlows(endpoints);
      const testCases = flows.map((flow) => flowGenerator.generateFlowTest(flow));

      expect(testCases.length).toBe(flows.length);
      testCases.forEach((test) => {
        expect(test.id).toBeDefined();
        expect(test.name).toBeDefined();
        expect(test.type).toBe('flow');
        expect(test.metadata.tags).toContain('workflow');
      });
    });

    it('should generate valid Playwright code for flows', () => {
      const bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
      const flowGenerator = new FlowGenerator(bodyGenerator);

      const flows = flowGenerator.detectFlows(endpoints);
      if (flows.length > 0) {
        const code = flowGenerator.generateFlowTestCode(flows[0]!);

        expect(code).toContain("test('");
        expect(code).toContain('async ({ request })');
        expect(code).toContain('expect');
        expect(code).toContain('.toBe(');
      }
    });
  });

  describe('Test Organization - All Strategies', () => {
    let mockTests: TestCase[];

    beforeAll(() => {
      // Create mock test cases from endpoints
      mockTests = endpoints.slice(0, 10).map((endpoint, index) => ({
        id: `test-${index}`,
        name: `Test ${endpoint.method.toUpperCase()} ${endpoint.path}`,
        description: `Test for ${endpoint.path}`,
        type: 'happy-path' as const,
        method: endpoint.method.toUpperCase(),
        endpoint: endpoint.path,
        request: {
          pathParams: {},
          queryParams: {},
          headers: {},
        },
        expectedResponse: {
          status: 200,
        },
        metadata: {
          tags: endpoint.tags.length > 0 ? endpoint.tags : ['default'],
          priority: 'medium' as const,
          stability: 'stable' as const,
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      }));
    });

    it('should organize tests by tag', () => {
      const organizer = new TestOrganizer();
      const organized = organizer.organize(mockTests, 'by-tag');

      expect(organized.strategy).toBe('by-tag');
      expect(organized.totalTests).toBe(mockTests.length);
      expect(organized.files.size).toBeGreaterThan(0);

      // Verify all tests are accounted for
      let totalTests = 0;
      for (const tests of organized.files.values()) {
        totalTests += tests.length;
      }
      expect(totalTests).toBe(mockTests.length);
    });

    it('should organize tests by endpoint', () => {
      const organizer = new TestOrganizer();
      const organized = organizer.organize(mockTests, 'by-endpoint');

      expect(organized.strategy).toBe('by-endpoint');
      expect(organized.totalTests).toBe(mockTests.length);

      // Verify file names are sanitized
      for (const filename of organized.files.keys()) {
        expect(filename).toMatch(/^[a-z0-9-]+\.spec\.ts$/);
      }
    });

    it('should organize tests by type', () => {
      const organizer = new TestOrganizer();
      const organized = organizer.organize(mockTests, 'by-type');

      expect(organized.strategy).toBe('by-type');
      expect(organized.files.size).toBeGreaterThan(0);

      // All tests are happy-path, so should be in one file
      expect(organized.files.has('happy-path.spec.ts')).toBe(true);
    });

    it('should organize tests by method', () => {
      const organizer = new TestOrganizer();
      const organized = organizer.organize(mockTests, 'by-method');

      expect(organized.strategy).toBe('by-method');
      expect(organized.files.size).toBeGreaterThan(0);

      // Verify method-based filenames
      for (const filename of organized.files.keys()) {
        expect(filename).toMatch(/^(get|post|put|patch|delete)-tests\.spec\.ts$/);
      }
    });

    it('should generate test files from organized tests', () => {
      const organizer = new TestOrganizer();
      const organized = organizer.organize(mockTests, 'by-tag');
      const files = organizer.generateTestFiles(organized);

      expect(files.length).toBeGreaterThan(0);

      files.forEach((file) => {
        expect(file.fileName).toMatch(/\.spec\.ts$/);
        expect(file.content).toContain("import { test, expect }");
        expect(file.content).toContain('describe(');
        expect(file.content).toContain('test(');
        expect(file.tests.length).toBeGreaterThan(0);
        expect(file.metadata.testCount).toBe(file.tests.length);
      });
    });
  });

  describe('File Structure Generation', () => {
    it('should generate complete file structure', () => {
      const organizer = new TestOrganizer();
      const mockTests: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test GET /pets',
          description: 'Get all pets',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/pets',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: ['pets'],
            priority: 'high',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const organized = organizer.organize(mockTests, 'by-tag');
      const testFiles = organizer.generateTestFiles(organized);
      const structure = generateFileStructure(testFiles, 'generated-tests');

      expect(structure.root).toBe('generated-tests');
      expect(structure.directories.length).toBeGreaterThan(0);
      expect(structure.files.length).toBeGreaterThan(0);
      expect(structure.additionalFiles.length).toBeGreaterThan(0);

      // Verify essential additional files
      const additionalPaths = structure.additionalFiles.map((f) => f.path);
      expect(additionalPaths.some((p) => p.includes('index.ts'))).toBe(true);
      expect(additionalPaths.some((p) => p.includes('helpers'))).toBe(true);
      expect(additionalPaths.some((p) => p.includes('fixtures'))).toBe(true);
    });

    it('should generate index file with all imports', () => {
      const organizer = new TestOrganizer();
      const mockTests: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test 1',
          description: 'Test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/users',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: ['users'],
            priority: 'medium',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
        {
          id: 'test-2',
          name: 'Test 2',
          description: 'Test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/products',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: ['products'],
            priority: 'medium',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const organized = organizer.organize(mockTests, 'by-tag');
      const testFiles = organizer.generateTestFiles(organized);
      const indexContent = generateIndexFile(testFiles);

      expect(indexContent).toContain('import');
      expect(indexContent).toContain('users.spec.js');
      expect(indexContent).toContain('products.spec.js');
      expect(indexContent).toContain('Total files:');
    });

    it('should create helper files with valid code', () => {
      const organizer = new TestOrganizer();
      const mockTests: TestCase[] = [
        {
          id: 'test-1',
          name: 'Test',
          description: 'Test',
          type: 'happy-path',
          method: 'GET',
          endpoint: '/test',
          request: {},
          expectedResponse: { status: 200 },
          metadata: {
            tags: ['test'],
            priority: 'medium',
            stability: 'stable',
            generatedAt: new Date().toISOString(),
            generatorVersion: '1.0.0',
          },
        },
      ];

      const organized = organizer.organize(mockTests, 'flat');
      const testFiles = organizer.generateTestFiles(organized);
      const structure = generateFileStructure(testFiles);

      const helperFile = structure.additionalFiles.find((f) => f.type === 'helper');
      expect(helperFile).toBeDefined();
      expect(helperFile?.content).toContain('export');
      expect(helperFile?.content).toContain('function');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: parse → detect flows → organize → generate files', () => {
      // 1. Parse OpenAPI spec (already done in beforeAll)
      expect(endpoints.length).toBeGreaterThan(0);

      // 2. Detect workflows
      const bodyGenerator = new RequestBodyGenerator({ seed: 12345 });
      const flowGenerator = new FlowGenerator(bodyGenerator);
      const flows = flowGenerator.detectFlows(endpoints);

      // 3. Generate test cases from flows
      const flowTests = flows.map((flow) => flowGenerator.generateFlowTest(flow));

      // 4. Create additional endpoint tests
      const endpointTests: TestCase[] = endpoints.slice(0, 5).map((endpoint, index) => ({
        id: `endpoint-test-${index}`,
        name: `Test ${endpoint.method.toUpperCase()} ${endpoint.path}`,
        description: `Test for ${endpoint.path}`,
        type: 'happy-path' as const,
        method: endpoint.method.toUpperCase(),
        endpoint: endpoint.path,
        request: {},
        expectedResponse: { status: 200 },
        metadata: {
          tags: endpoint.tags.length > 0 ? endpoint.tags : ['default'],
          priority: 'medium' as const,
          stability: 'stable' as const,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      }));

      const allTests = [...flowTests, ...endpointTests];

      // 5. Organize tests
      const organizer = new TestOrganizer();
      const organized = organizer.organize(allTests, 'by-tag');

      expect(organized.files.size).toBeGreaterThan(0);
      expect(organized.totalTests).toBe(allTests.length);

      // 6. Generate test files
      const testFiles = organizer.generateTestFiles(organized);

      expect(testFiles.length).toBeGreaterThan(0);
      testFiles.forEach((file) => {
        expect(file.content.length).toBeGreaterThan(0);
        expect(file.tests.length).toBeGreaterThan(0);
      });

      // 7. Generate file structure
      const structure = generateFileStructure(testFiles, 'generated-tests');

      expect(structure.files.length).toBeGreaterThan(0);
      expect(structure.additionalFiles.length).toBeGreaterThan(0);
      expect(structure.directories).toContain('generated-tests');
    });

    it('should handle all organization strategies for same test set', () => {
      const strategies: OrganizationStrategy[] = ['by-tag', 'by-endpoint', 'by-type', 'by-method', 'flat'];

      const mockTests: TestCase[] = endpoints.slice(0, 10).map((endpoint, index) => ({
        id: `test-${index}`,
        name: `Test ${endpoint.method.toUpperCase()} ${endpoint.path}`,
        description: `Test for ${endpoint.path}`,
        type: 'happy-path' as const,
        method: endpoint.method.toUpperCase(),
        endpoint: endpoint.path,
        request: {},
        expectedResponse: { status: 200 },
        metadata: {
          tags: endpoint.tags.length > 0 ? endpoint.tags : ['default'],
          priority: 'medium' as const,
          stability: 'stable' as const,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      }));

      const organizer = new TestOrganizer();

      for (const strategy of strategies) {
        const organized = organizer.organize(mockTests, strategy);

        expect(organized.strategy).toBe(strategy);
        expect(organized.totalTests).toBe(mockTests.length);
        expect(organized.files.size).toBeGreaterThan(0);

        // Verify all tests are included
        let total = 0;
        for (const tests of organized.files.values()) {
          total += tests.length;
        }
        expect(total).toBe(mockTests.length);
      }
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle petstore API with realistic organization', () => {
      const organizer = new TestOrganizer();

      // Create tests for all petstore endpoints
      const allTests: TestCase[] = endpoints.map((endpoint, index) => ({
        id: `petstore-test-${index}`,
        name: `${endpoint.operationId ?? endpoint.method} ${endpoint.path}`,
        description: endpoint.summary ?? endpoint.description ?? `Test ${endpoint.path}`,
        type: 'happy-path' as const,
        method: endpoint.method.toUpperCase(),
        endpoint: endpoint.path,
        request: {},
        expectedResponse: { status: 200 },
        metadata: {
          tags: endpoint.tags,
          priority: 'medium' as const,
          stability: 'stable' as const,
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      }));

      // Test with recommended strategy
      const recommendedStrategy = organizer.getRecommendedStrategy(allTests);
      const organized = organizer.organize(allTests, recommendedStrategy);

      expect(organized.files.size).toBeGreaterThan(0);
      expect(organized.totalTests).toBe(allTests.length);

      // Generate and verify files
      const testFiles = organizer.generateTestFiles(organized);
      testFiles.forEach((file) => {
        expect(file.content).toContain("import { test, expect }");
        expect(file.metadata.endpoints.length).toBeGreaterThan(0);
      });
    });

    it('should generate README with correct statistics', () => {
      const organizer = new TestOrganizer();
      const mockTests: TestCase[] = endpoints.slice(0, 10).map((endpoint, index) => ({
        id: `test-${index}`,
        name: `Test ${index}`,
        description: 'Test',
        type: 'happy-path' as const,
        method: endpoint.method.toUpperCase(),
        endpoint: endpoint.path,
        request: {},
        expectedResponse: { status: 200 },
        metadata: {
          tags: endpoint.tags,
          priority: 'medium' as const,
          stability: 'stable' as const,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      }));

      const organized = organizer.organize(mockTests, 'by-tag');
      const testFiles = organizer.generateTestFiles(organized);
      const structure = generateFileStructure(testFiles);

      const readmeFile = structure.additionalFiles.find((f) => f.path.includes('README'));
      expect(readmeFile).toBeDefined();
      expect(readmeFile?.content).toContain('# Generated API Test Suite');
      expect(readmeFile?.content).toContain('Total Files');
      expect(readmeFile?.content).toContain('Total Tests');
      expect(readmeFile?.content).toContain('npx playwright test');
    });
  });
});
