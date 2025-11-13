/**
 * Generate Command - CLI implementation for test generation
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { parseOpenAPIFile } from '../core/openapi-parser.js';
import { TestGenerator } from '../core/test-generator.js';
import { loadConfig } from './config-loader.js';
import { ProgressReporter } from './progress-reporter.js';
import type { OrganizationStrategy } from '../types/test-generator-types.js';
import { DataFactory } from '../utils/data-factory.js';
import { RequestBodyGenerator } from '../generators/request-body-generator.js';
import { HappyPathGenerator } from '../generators/happy-path-generator.js';
import { ErrorCaseGenerator } from '../generators/error-case-generator.js';
import { EdgeCaseGenerator } from '../generators/edge-case-generator.js';
import { TestOrganizer } from '../generators/test-organizer.js';
import { CodeGenerator } from '../utils/code-generator.js';
import { AITestGenerator } from '../generators/ai-test-generator.js';
import { PerformanceTestGenerator } from '../generators/performance-test-generator.js';

/**
 * Command line options interface
 */
interface GenerateCommandOptions {
  spec?: string;
  output?: string;
  config?: string;
  auth?: boolean;
  errors?: boolean;
  edgeCases?: boolean;
  flows?: boolean;
  aiTests?: boolean;
  performance?: boolean;
  loadUsers?: number;
  duration?: number;
  organization?: OrganizationStrategy;
  baseUrl?: string;
  verbose?: boolean;
  incremental?: boolean;
  forceAll?: boolean;
  dryRun?: boolean;
}

/**
 * Create the 'generate' command
 *
 * @returns Commander command instance
 */
export function createGenerateCommand(): Command {
  const command = new Command('generate');

  command
    .description('Generate Playwright API tests from OpenAPI specification')
    .requiredOption('-s, --spec <path>', 'Path to OpenAPI spec file')
    .option('-o, --output <dir>', 'Output directory for generated tests', './tests/generated')
    .option('-c, --config <path>', 'Path to config file (JSON or JS)')
    .option('--no-auth', 'Skip authentication tests')
    .option('--no-errors', 'Skip error case tests')
    .option('--no-edge-cases', 'Skip edge case tests')
    .option('--no-flows', 'Skip workflow tests')
    .option('--ai-tests', 'Force enable AI-powered test generation (auto-enabled if OPENAI_API_KEY is set)')
    .option('--no-ai-tests', 'Disable AI-powered test generation even if OPENAI_API_KEY is set')
    .option('--performance', 'Generate performance/load tests')
    .option('--load-users <number>', 'Number of virtual users for load tests', '10')
    .option('--duration <seconds>', 'Duration for performance tests in seconds', '60')
    .option(
      '--organization <strategy>',
      'Organization strategy: by-tag, by-endpoint, by-type, by-method, flat',
      'by-tag'
    )
    .option('--base-url <url>', 'Base URL for API (overrides spec servers)')
    .option('--no-incremental', 'Disable incremental mode (regenerate all tests)')
    .option('--force-all', 'Force regenerate all tests even if unchanged')
    .option('--dry-run', 'Show what would change without making changes')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: GenerateCommandOptions) => {
      await executeGenerate(options);
    });

  return command;
}

/**
 * Execute the generate command
 *
 * @param options - Command line options
 */
async function executeGenerate(options: GenerateCommandOptions): Promise<void> {
  const reporter = new ProgressReporter(options.verbose || false);

  try {
    // Step 1: Load configuration
    reporter.start('Loading configuration...');

    const config = await loadConfig(options.config, {
      spec: options.spec || '',
      output: options.output || './tests/generated',
      includeAuth: options.auth !== false,
      includeErrors: options.errors !== false,
      includeEdgeCases: options.edgeCases !== false,
      includeFlows: options.flows !== false,
      includePerformance: options.performance ?? false,
      organizationStrategy: (options.organization as OrganizationStrategy) || 'by-tag',
      baseUrl: options.baseUrl,
      options: {
        verbose: options.verbose,
        loadUsers: typeof options.loadUsers === 'number' ? options.loadUsers : parseInt(String(options.loadUsers || '10'), 10),
        duration: typeof options.duration === 'number' ? options.duration : parseInt(String(options.duration || '60'), 10),
      },
    });

    reporter.success('Configuration loaded');
    if (options.verbose) {
      reporter.verbose(`Spec: ${config.spec}`);
      reporter.verbose(`Output: ${config.output}`);
      reporter.verbose(`Organization: ${config.organizationStrategy}`);
    }

    // Step 2: Parse OpenAPI specification
    reporter.start('Parsing OpenAPI specification...');

    const specPath = path.resolve(process.cwd(), config.spec);

    // Check file size to determine if we should use fast mode
    const stats = await fs.stat(specPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    const isLargeSpec = fileSizeMB > 2; // Files > 2MB use fast mode

    if (isLargeSpec) {
      reporter.update(`⚡ Large spec detected (${fileSizeMB.toFixed(1)}MB) - using fast mode`);
    }

    let spec;
    try {
      spec = await parseOpenAPIFile(specPath, {
        skipDereference: isLargeSpec, // Use bundle mode for large specs
        skipValidation: isLargeSpec,  // Skip validation for speed
      });
    } catch (error) {
      reporter.error(
        `Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }

    reporter.success(`Parsed: ${spec.info.title} v${spec.info.version}`);

    // Step 3: Initialize test generator
    reporter.start('Initializing test generator...');

    const generator = new TestGenerator(spec, {
      includeAuth: config.includeAuth,
      includeErrors: config.includeErrors,
      includeEdgeCases: config.includeEdgeCases,
      includeFlows: config.includeFlows,
      includePerformance: config.includePerformance,
      baseUrl: config.baseUrl,
      outputDir: config.output,
      organizationStrategy: config.organizationStrategy,
      framework: {
        useFixtures: config.options?.useFixtures ?? true,
        useHooks: config.options?.useHooks ?? true,
      },
      incremental: {
        enabled: options.incremental !== false, // Default to true, disabled with --no-incremental
        forceAll: options.forceAll ?? false,
        dryRun: options.dryRun ?? false,
        specPath: specPath, // Pass absolute spec path for metadata tracking
      },
    });

    // Initialize generator dependencies
    const dataFactory = new DataFactory();
    const bodyGenerator = new RequestBodyGenerator();

    // Create and register all test generators
    const happyPathGen = new HappyPathGenerator(dataFactory, bodyGenerator);
    generator.setGenerator('happy-path', happyPathGen);

    if (config.includeErrors) {
      const errorGen = new ErrorCaseGenerator(bodyGenerator);
      // Wrap to match interface
      generator.setGenerator('error-case', {
        generateTests: (endpoints) => endpoints.flatMap(ep => errorGen.generateTests(ep))
      });
    }

    if (config.includeEdgeCases) {
      const edgeGen = new EdgeCaseGenerator(dataFactory);
      // Wrap to match interface
      generator.setGenerator('edge-case', {
        generateTests: (endpoints) => endpoints.flatMap(ep => edgeGen.generateTests(ep))
      });
    }

    // Performance test generator
    if (config.includePerformance) {
      const perfGen = new PerformanceTestGenerator({
        defaultUsers: config.options?.loadUsers ?? 10,
        defaultDuration: config.options?.duration ?? 60,
        generateMultipleScenarios: true,
      });
      generator.setGenerator('performance', perfGen);

      if (options.verbose) {
        reporter.verbose(`Performance tests enabled: ${config.options?.loadUsers ?? 10} users, ${config.options?.duration ?? 60}s duration`);
      }
    }

    // TODO: Fix auth and flow generators - complex interface mismatches
    // if (config.includeAuth) {
    //   Auth generator needs proper integration
    // }

    // if (config.includeFlows) {
    //   Flow generator needs proper integration
    // }

    // Set up test organizer
    const organizer = new TestOrganizer();
    // Wrap to match interface
    generator.setOrganizer({
      organize: (tests, strategy) => {
        const result = organizer.organize(tests, strategy);
        return {
          files: result.files,
          metadata: {
            strategy: result.strategy,
            fileCount: result.files.size,
            testCount: result.totalTests
          }
        };
      }
    });

    // Set up code generator
    const codeGen = new CodeGenerator();
    // Wrap to match interface
    generator.setCodeGenerator({
      generateFiles: (organized) => {
        const files: any[] = [];
        for (const [fileName, tests] of organized.files) {
          const metadata = {
            endpoints: [...new Set(tests.map(t => t.endpoint))],
            testTypes: [...new Set(tests.map(t => t.type))],
            testCount: tests.length,
            tags: [...new Set(tests.flatMap(t => t.metadata.tags || []))],
            generatedAt: new Date().toISOString()
          };
          const content = codeGen.generateTestFile(tests, metadata);
          files.push({
            fileName,
            filePath: fileName,
            content,
            tests,
            imports: [],
            metadata
          });
        }
        return files;
      },
      generateFile: (fileName, tests) => {
        const metadata = {
          endpoints: [...new Set(tests.map(t => t.endpoint))],
          testTypes: [...new Set(tests.map(t => t.type))],
          testCount: tests.length,
          tags: [...new Set(tests.flatMap(t => t.metadata.tags || []))],
          generatedAt: new Date().toISOString()
        };
        const content = codeGen.generateTestFile(tests, metadata);
        return {
          fileName,
          filePath: fileName,
          content,
          tests,
          imports: [],
          metadata
        };
      }
    });

    // Extract endpoints first
    const endpoints = generator.extractEndpoints();
    reporter.success(`Found ${endpoints.length} endpoints`);

    // Step 4: Generate tests
    reporter.start('Generating tests...');

    const result = await generator.generateTests();

    // Step 4.5: AI-powered test generation
    // Smart default: auto-enable if OPENAI_API_KEY is set, unless explicitly disabled
    const shouldUseAI = options.aiTests === undefined
      ? !!process.env.OPENAI_API_KEY  // Auto-enable if API key is present
      : options.aiTests;               // Respect explicit user choice

    if (shouldUseAI) {
      const aiGen = new AITestGenerator({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL,
        testsPerEndpoint: 3,
        focus: ['business-logic', 'security', 'workflows', 'edge-cases'],
        verbose: options.verbose
      });

      if (aiGen.isEnabled()) {
        reporter.start('🤖 Generating AI-powered intelligent tests...');

        try {
          const aiTests = await aiGen.generateTests(endpoints);

          if (aiTests.length > 0) {
            // Organize AI tests by endpoint
            const aiTestsByEndpoint = new Map<string, typeof aiTests>();
            for (const test of aiTests) {
              const key = test.endpoint;
              if (!aiTestsByEndpoint.has(key)) {
                aiTestsByEndpoint.set(key, []);
              }
              aiTestsByEndpoint.get(key)!.push(test);
            }

            // Generate AI test files using the code generator
            const codeGen = new CodeGenerator();
            const aiFiles = [];
            for (const [endpoint, tests] of aiTestsByEndpoint) {
              const fileName = `ai-${endpoint.replace(/\//g, '-').replace(/^-/, '')}.spec.ts`;
              const metadata = {
                endpoints: [endpoint],
                testTypes: ['validation' as const],
                testCount: tests.length,
                tags: ['ai-generated'],
                generatedAt: new Date().toISOString()
              };
              const content = codeGen.generateTestFile(tests, metadata);
              aiFiles.push({
                fileName,
                filePath: `ai-tests/${fileName}`,
                content,
                tests,
                imports: [],
                metadata
              });
            }

            // Merge AI files with standard results
            result.files.push(...aiFiles);
            result.totalTests += aiTests.length;

            // Update statistics
            if (!result.statistics.testsByType.validation) {
              result.statistics.testsByType.validation = 0;
            }
            result.statistics.testsByType.validation += aiTests.length;

            reporter.success(`✨ Generated ${aiTests.length} AI-powered tests in ${aiFiles.length} files`);
          } else {
            reporter.warning('AI generation produced no tests');
          }
        } catch (error) {
          reporter.error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (options.verbose && error instanceof Error && error.stack) {
            console.error(error.stack);
          }
        }
      } else {
        reporter.warning('⚠️  AI test generation enabled but OPENAI_API_KEY not found');
        reporter.info('Set OPENAI_API_KEY environment variable or use --no-ai-tests to disable');
      }
    } else if (options.verbose && process.env.OPENAI_API_KEY) {
      reporter.info('AI test generation disabled (use --ai-tests to enable)');
    } else if (options.verbose) {
      reporter.info('AI test generation not available (set OPENAI_API_KEY to enable)');
    }

    // Check for errors
    if (result.errors.length > 0) {
      reporter.error('Errors occurred during generation:');
      for (const error of result.errors) {
        reporter.error(`  - ${error.message}`);
        if (error.stack && options.verbose) {
          console.error(error.stack);
        }
      }
    }

    // Check for warnings
    if (result.warnings.length > 0) {
      reporter.warning('Warnings during generation:');
      for (const warning of result.warnings) {
        reporter.warning(`  - ${warning.message}`);
      }
    }

    if (result.files.length === 0) {
      reporter.warning('No test files generated');
      process.exit(1);
    }

    reporter.success(`Generated ${result.totalTests} tests in ${result.files.length} files`);

    // Step 5: Organize and report test breakdown
    if (options.verbose) {
      reporter.update('Test breakdown:');
      for (const [type, count] of Object.entries(result.statistics.testsByType)) {
        reporter.verbose(`  ${type}: ${count}`);
      }
    }

    // Step 6: Write test files to disk
    reporter.start(`Writing test files to ${config.output}...`);

    const outputDir = path.resolve(process.cwd(), config.output);

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    let filesWritten = 0;
    for (const file of result.files) {
      const filePath = path.join(outputDir, file.filePath);

      // Create subdirectories if needed
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, file.content, 'utf-8');
      filesWritten++;

      if (options.verbose) {
        reporter.fileGenerated(file.fileName, file.tests.length);
      }
    }

    reporter.success(`Wrote ${filesWritten} test files to ${config.output}`);

    // Step 7: Display summary
    reporter.summary(result.statistics);

    // Step 8: Next steps
    reporter.info('Next steps:');
    console.warn('  1. Review generated tests');
    console.warn('  2. Add authentication credentials to .env file');
    console.warn('  3. Run tests with: npm run test:playwright');

    process.exit(0);
  } catch (error) {
    reporter.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    if (options.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}
