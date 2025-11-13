/**
 * Test Generator - Core Module
 * Generates Playwright API tests from OpenAPI specifications
 */

import type { ParsedApiSpec, ApiEndpoint, InfoObject } from '../types/openapi-types.js';
import type {
  TestCase,
  GeneratedTestFile,
  TestGenerationResult,
  GenerationStatistics,
  OrganizationStrategy,
} from '../types/test-generator-types.js';
import type {
  TestGeneratorInterface,
  TestOrganizerInterface,
  CodeGeneratorInterface,
  OrganizedTests,
} from '../types/generator-interfaces.js';
import { IncrementalGenerator } from './incremental-generator.js';
import { GenerationMetadataManager } from './generation-metadata.js';
import type { GenerationOptionsSnapshot } from '../types/incremental-types.js';

/**
 * Options for test generation
 */
export interface TestGeneratorOptions {
  /** Include authentication tests */
  includeAuth?: boolean;

  /** Include validation tests for request/response schemas */
  includeValidation?: boolean;

  /** Include edge case tests (boundary values, error cases) */
  includeEdgeCases?: boolean;

  /** Include error case tests (4xx, 5xx responses) */
  includeErrors?: boolean;

  /** Include workflow/flow tests */
  includeFlows?: boolean;

  /** Include performance tests */
  includePerformance?: boolean;

  /** Base URL for the API (overrides spec servers) */
  baseUrl?: string;

  /** Output directory for generated tests */
  outputDir?: string;

  /** Organization strategy */
  organizationStrategy?: OrganizationStrategy;

  /** Test framework specific options */
  framework?: {
    /** Use fixtures for common setup */
    useFixtures?: boolean;

    /** Generate before/after hooks */
    useHooks?: boolean;
  };

  /** Incremental generation options */
  incremental?: {
    /** Enable incremental mode (default: true) */
    enabled?: boolean;

    /** Force regenerate all tests */
    forceAll?: boolean;

    /** Dry run - show what would change */
    dryRun?: boolean;

    /** Path to OpenAPI spec file (needed for incremental mode) */
    specPath?: string;
  };
}

/**
 * Main Test Generator Class - Complete Implementation
 *
 * Responsibilities:
 * - Orchestrate all test generators (HappyPath, ErrorCase, EdgeCase, Auth, Flow)
 * - Extract endpoints from OpenAPI specification
 * - Coordinate test organization
 * - Generate final test files
 * - Provide statistics and reporting
 *
 * Design decisions:
 * - Uses Playwright's request fixture for API testing
 * - Generates TypeScript for type safety
 * - Modular architecture with specialized generators
 * - Pluggable organization strategies
 */
export class TestGenerator {
  private spec: ParsedApiSpec;
  private options: TestGeneratorOptions;
  private generators: Map<string, TestGeneratorInterface>;
  private organizer: TestOrganizerInterface | null;
  private codeGenerator: CodeGeneratorInterface | null;
  private incrementalGenerator: IncrementalGenerator | null;
  private metadataManager: GenerationMetadataManager | null;

  /**
   * Creates a new test generator instance
   *
   * @param spec - Parsed OpenAPI specification from Feature 1
   * @param options - Generation options
   */
  constructor(spec: ParsedApiSpec, options: TestGeneratorOptions = {}) {
    this.spec = spec;
    this.options = {
      includeAuth: true,
      includeValidation: true,
      includeEdgeCases: true,
      includeErrors: true,
      includeFlows: true,
      includePerformance: false,
      outputDir: 'tests/generated',
      organizationStrategy: 'by-tag',
      framework: {
        useFixtures: true,
        useHooks: true,
      },
      incremental: {
        enabled: true,
        forceAll: false,
        dryRun: false,
      },
      ...options,
    };

    // Initialize generators map (will be populated by setGenerator)
    this.generators = new Map();
    this.organizer = null;
    this.codeGenerator = null;
    this.incrementalGenerator = null;
    this.metadataManager = null;

    // Initialize incremental generation if enabled
    if (this.options.incremental?.enabled !== false) {
      this.metadataManager = new GenerationMetadataManager();
      this.incrementalGenerator = new IncrementalGenerator(this.metadataManager, {
        forceAll: this.options.incremental?.forceAll ?? false,
        dryRun: this.options.incremental?.dryRun ?? false,
      });
    }
  }

  /**
   * Set a test generator for a specific type
   * @param type - Test type
   * @param generator - Generator implementation
   */
  setGenerator(type: string, generator: TestGeneratorInterface): void {
    this.generators.set(type, generator);
  }

  /**
   * Set the test organizer
   * @param organizer - Organizer implementation
   */
  setOrganizer(organizer: TestOrganizerInterface): void {
    this.organizer = organizer;
  }

  /**
   * Set the code generator
   * @param codeGenerator - Code generator implementation
   */
  setCodeGenerator(codeGenerator: CodeGeneratorInterface): void {
    this.codeGenerator = codeGenerator;
  }

  /**
   * Generates test files from the OpenAPI specification
   *
   * Strategy:
   * 1. Extract all endpoints from spec
   * 2. (Incremental) Detect changes and filter endpoints
   * 3. Generate test cases using all configured generators
   * 4. Organize tests by configured strategy
   * 5. Generate code files
   * 6. (Incremental) Update metadata and delete removed files
   * 7. Collect statistics
   *
   * @returns Test generation result with files and statistics
   */
  async generateTests(): Promise<TestGenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Extract endpoints
      const allEndpoints = this.extractEndpoints();

      if (allEndpoints.length === 0) {
        return {
          files: [],
          totalTests: 0,
          statistics: this.createEmptyStatistics(startTime),
          warnings: [
            {
              message: 'No endpoints found in OpenAPI specification',
              code: 'NO_ENDPOINTS',
              severity: 'high',
            },
          ],
          errors: [],
        };
      }

      // Step 2: Incremental mode - detect changes and filter endpoints
      let endpoints = allEndpoints;
      let incrementalStrategy = null;
      let skippedCount = 0;
      const warnings: any[] = [];

      if (this.incrementalGenerator && this.metadataManager && this.options.incremental?.specPath) {
        const currentOptions: GenerationOptionsSnapshot = {
          includeAuth: this.options.includeAuth ?? true,
          includeErrors: this.options.includeErrors ?? true,
          includeEdgeCases: this.options.includeEdgeCases ?? true,
          includeFlows: this.options.includeFlows ?? true,
          includePerformance: this.options.includePerformance ?? false,
          baseUrl: this.options.baseUrl,
        };

        const changes = await this.incrementalGenerator.detectChanges(
          this.options.incremental.specPath,
          this.spec,
          allEndpoints,
          currentOptions,
          this.options.outputDir || 'tests/generated'
        );

        incrementalStrategy = this.incrementalGenerator.createRegenerationStrategy(changes);

        // Print strategy summary
        if (!this.options.incremental.dryRun) {
          this.incrementalGenerator.printStrategySummary(incrementalStrategy);
        }

        // In dry run mode, print detailed summary and exit
        if (this.options.incremental.dryRun) {
          this.incrementalGenerator.printDryRunSummary(incrementalStrategy);
          return {
            files: [],
            totalTests: 0,
            statistics: this.createEmptyStatistics(startTime),
            warnings: [],
            errors: [],
          };
        }

        // Filter endpoints to only those that need generation
        if (incrementalStrategy.totalOperations < allEndpoints.length) {
          endpoints = this.incrementalGenerator.filterEndpointsForGeneration(
            allEndpoints,
            incrementalStrategy
          );
          skippedCount = incrementalStrategy.toSkip.length;

          // Add info about incremental mode
          if (skippedCount > 0) {
            console.log(
              `\n⚡ Incremental mode: Processing ${endpoints.length} endpoints, skipping ${skippedCount} unchanged\n`
            );
          }
        }

        // Delete files for removed endpoints
        if (incrementalStrategy.toDelete.length > 0) {
          await this.incrementalGenerator.deleteRemovedFiles(
            incrementalStrategy.toDelete,
            this.options.outputDir || 'tests/generated',
            this.options.incremental.dryRun
          );
        }
      }

      // If no endpoints to process (all skipped), return early
      if (endpoints.length === 0 && skippedCount > 0) {
        console.log('✅ All tests are up to date - nothing to generate!\n');
        return {
          files: [],
          totalTests: 0,
          statistics: this.createEmptyStatistics(startTime),
          warnings: [],
          errors: [],
        };
      }

      // Step 2: Generate test cases from all generators
      const allTests: TestCase[] = [];

      // Happy path tests (always included)
      if (this.generators.has('happy-path')) {
        const happyGen = this.generators.get('happy-path')!;
        allTests.push(...happyGen.generateTests(endpoints));
      }

      // Error case tests
      if (this.options.includeErrors && this.generators.has('error-case')) {
        const errorGen = this.generators.get('error-case')!;
        allTests.push(...errorGen.generateTests(endpoints));
      }

      // Edge case tests
      if (this.options.includeEdgeCases && this.generators.has('edge-case')) {
        const edgeGen = this.generators.get('edge-case')!;
        allTests.push(...edgeGen.generateTests(endpoints));
      }

      // Auth tests
      if (this.options.includeAuth && this.generators.has('auth')) {
        const authGen = this.generators.get('auth')!;
        allTests.push(...authGen.generateTests(endpoints));
      }

      // Flow tests
      if (this.options.includeFlows && this.generators.has('flow')) {
        const flowGen = this.generators.get('flow')!;
        allTests.push(...flowGen.generateTests(endpoints));
      }

      // Step 3: Organize tests
      const organized = this.organizeTests(allTests);

      // Step 4: Generate code files
      const files = this.generateCodeFiles(organized);

      // Step 5: Collect statistics
      const statistics = this.collectStatistics(endpoints, allTests, files, startTime);

      // Step 6: Update metadata (incremental mode)
      if (
        this.metadataManager &&
        this.options.incremental?.specPath &&
        !this.options.incremental.dryRun
      ) {
        await this.saveGenerationMetadata(
          this.options.incremental.specPath,
          endpoints,
          files,
          allTests
        );
      }

      return {
        files,
        totalTests: allTests.length,
        statistics,
        warnings,
        errors: [],
      };
    } catch (error) {
      return {
        files: [],
        totalTests: 0,
        statistics: this.createEmptyStatistics(startTime),
        warnings: [],
        errors: [
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'GENERATION_ERROR',
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
      };
    }
  }

  /**
   * Save generation metadata for incremental mode
   */
  private async saveGenerationMetadata(
    specPath: string,
    endpoints: ApiEndpoint[],
    files: GeneratedTestFile[],
    allTests: TestCase[]
  ): Promise<void> {
    if (!this.metadataManager) return;

    try {
      // Calculate spec hash
      const specHash = await this.metadataManager.calculateSpecHash(specPath);

      // Create or load metadata
      let metadata = await this.metadataManager.loadMetadata();

      if (!metadata) {
        // Create new metadata
        const options: GenerationOptionsSnapshot = {
          includeAuth: this.options.includeAuth ?? true,
          includeErrors: this.options.includeErrors ?? true,
          includeEdgeCases: this.options.includeEdgeCases ?? true,
          includeFlows: this.options.includeFlows ?? true,
          includePerformance: this.options.includePerformance ?? false,
          baseUrl: this.options.baseUrl,
        };

        metadata = this.metadataManager.createMetadata(
          specPath,
          specHash,
          this.options.outputDir || 'tests/generated',
          this.options.organizationStrategy || 'by-tag',
          options
        );
      } else {
        // Update existing metadata
        metadata.specHash = specHash;
        metadata.generatedAt = new Date().toISOString();
        metadata.outputDir = this.options.outputDir || 'tests/generated';
        metadata.organizationStrategy = this.options.organizationStrategy || 'by-tag';
      }

      // Update endpoint metadata
      for (const endpoint of endpoints) {
        // Find files for this endpoint
        const endpointKey = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
        const endpointFiles = files
          .filter((file) => file.metadata.endpoints.includes(endpointKey))
          .map((file) => file.filePath);

        // Find tests for this endpoint
        const endpointTests = allTests.filter(
          (test) => test.method === endpoint.method && test.endpoint === endpoint.path
        );

        const testTypes = [...new Set(endpointTests.map((t) => t.type))];

        this.metadataManager.updateEndpointMetadata(
          metadata,
          endpoint,
          endpointFiles,
          testTypes,
          endpointTests.length
        );
      }

      // Save metadata
      await this.metadataManager.saveMetadata(metadata);
      console.log(`\n💾 Saved generation metadata to ${this.metadataManager.getMetadataPath()}\n`);
    } catch (error) {
      console.warn(`Warning: Failed to save generation metadata: ${error}`);
    }
  }

  /**
   * Extracts all API endpoints from the specification
   *
   * @returns Array of API endpoints
   */
  extractEndpoints(): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    // Iterate through all paths in the spec
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem) continue;

      // Extract each HTTP method operation
      const methods: Array<{ method: string; operation: any }> = [
        { method: 'get', operation: pathItem.get },
        { method: 'post', operation: pathItem.post },
        { method: 'put', operation: pathItem.put },
        { method: 'patch', operation: pathItem.patch },
        { method: 'delete', operation: pathItem.delete },
        { method: 'options', operation: pathItem.options },
        { method: 'head', operation: pathItem.head },
        { method: 'trace', operation: pathItem.trace },
      ];

      for (const { method, operation } of methods) {
        if (!operation) continue;

        // Build endpoint object
        const endpoint: ApiEndpoint = {
          path,
          method: method as any,
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          parameters: this.extractParameters(operation.parameters, pathItem.parameters),
          requestBody: operation.requestBody,
          responses: this.extractResponses(operation.responses),
          security: operation.security || this.spec.security || [],
          tags: operation.tags || [],
          servers: operation.servers || pathItem.servers || this.spec.servers || [],
        };

        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  /**
   * Extract and normalize parameters
   */
  private extractParameters(operationParams?: any[], pathParams?: any[]): any[] {
    const params = [];

    if (pathParams) {
      params.push(...pathParams);
    }

    if (operationParams) {
      params.push(...operationParams);
    }

    return params;
  }

  /**
   * Extract and normalize responses
   */
  private extractResponses(responses: any): Map<number | 'default', any> {
    const responseMap = new Map<number | 'default', any>();

    for (const [statusCode, response] of Object.entries(responses)) {
      if (statusCode === 'default') {
        responseMap.set('default', response);
      } else {
        const code = parseInt(statusCode, 10);
        if (!isNaN(code)) {
          responseMap.set(code, response);
        }
      }
    }

    return responseMap;
  }

  /**
   * Organize tests using the configured strategy
   */
  private organizeTests(tests: TestCase[]): OrganizedTests {
    if (this.organizer) {
      const strategy = this.options.organizationStrategy || 'by-tag';
      return this.organizer.organize(tests, strategy);
    }

    // Fallback: simple organization by test type
    const files = new Map<string, TestCase[]>();

    for (const test of tests) {
      const key = `${test.type}.spec.ts`;
      if (!files.has(key)) {
        files.set(key, []);
      }
      files.get(key)!.push(test);
    }

    return {
      files,
      metadata: {
        strategy: this.options.organizationStrategy || 'by-type',
        fileCount: files.size,
        testCount: tests.length,
      },
    };
  }

  /**
   * Generate code files from organized tests
   */
  private generateCodeFiles(organized: OrganizedTests): GeneratedTestFile[] {
    if (this.codeGenerator) {
      return this.codeGenerator.generateFiles(organized);
    }

    // Fallback: create basic test files structure
    const files: GeneratedTestFile[] = [];

    for (const [fileName, tests] of organized.files) {
      files.push({
        filePath: fileName,
        fileName,
        content: this.generateBasicTestContent(tests),
        tests,
        imports: ["import { test, expect } from '@playwright/test';"],
        metadata: {
          endpoints: tests.map((t) => t.endpoint),
          testTypes: [...new Set(tests.map((t) => t.type))],
          testCount: tests.length,
          tags: [...new Set(tests.flatMap((t) => t.metadata.tags))],
          generatedAt: new Date().toISOString(),
        },
      });
    }

    return files;
  }

  /**
   * Generate basic test content (fallback)
   */
  private generateBasicTestContent(tests: TestCase[]): string {
    let content = "import { test, expect } from '@playwright/test';\n\n";

    for (const testCase of tests) {
      content += `test('${testCase.name}', async ({ request }) => {\n`;
      content += `  // ${testCase.description}\n`;
      content += `  const response = await request.${testCase.method.toLowerCase()}('${testCase.endpoint}');\n`;
      content += `  expect(response.ok()).toBeTruthy();\n`;
      content += `});\n\n`;
    }

    return content;
  }

  /**
   * Collect generation statistics
   */
  private collectStatistics(
    endpoints: ApiEndpoint[],
    tests: TestCase[],
    files: GeneratedTestFile[],
    startTime: number
  ): GenerationStatistics {
    const testsByType: Record<string, number> = {};

    for (const test of tests) {
      testsByType[test.type] = (testsByType[test.type] || 0) + 1;
    }

    // Calculate total lines of code
    const linesOfCode = files.reduce((sum, file) => {
      return sum + file.content.split('\n').length;
    }, 0);

    return {
      endpointsProcessed: endpoints.length,
      testsByType: testsByType as any,
      filesGenerated: files.length,
      generationTime: Date.now() - startTime,
      linesOfCode,
    };
  }

  /**
   * Create empty statistics
   */
  private createEmptyStatistics(startTime: number): GenerationStatistics {
    return {
      endpointsProcessed: 0,
      testsByType: {} as any,
      filesGenerated: 0,
      generationTime: Date.now() - startTime,
      linesOfCode: 0,
    };
  }

  /**
   * Gets the base URL for API requests
   *
   * @returns Base URL string
   */
  getBaseUrl(): string {
    if (this.options.baseUrl) {
      return this.options.baseUrl;
    }

    // Use first server from spec if available
    if (this.spec.servers.length > 0 && this.spec.servers[0]) {
      return this.spec.servers[0].url;
    }

    // Fallback
    return 'http://localhost:3000';
  }

  /**
   * Gets API information from the specification
   *
   * @returns API info object
   */
  getApiInfo(): InfoObject {
    return this.spec.info;
  }

  /**
   * Get the number of registered generators
   */
  getGeneratorCount(): number {
    return this.generators.size;
  }

  /**
   * Check if a specific generator is registered
   */
  hasGenerator(type: string): boolean {
    return this.generators.has(type);
  }
}
