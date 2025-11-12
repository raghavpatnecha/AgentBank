/**
 * Pipeline Orchestrator - The 3-Agent System
 *
 * Orchestrates the complete test automation pipeline:
 * 1. Test Generator (AI Agent) - Plans & generates tests from OpenAPI
 * 2. Test Executor (Playwright) - Executes tests, captures failures
 * 3. Self-Healing Engine (AI) - Analyzes failures, regenerates tests
 *
 * This is triggered automatically when @api-test-agent is mentioned in a GitHub PR.
 */

import { parseOpenAPIFile } from './openapi-parser.js';
import { TestGenerator } from './test-generator.js';
import { PlaywrightExecutor } from './playwright-executor.js';
import { SelfHealingOrchestrator, SimpleFailureAnalyzer } from '../ai/self-healing-orchestrator.js';
import { AITestRegenerator } from '../ai/ai-test-regenerator.js';
import { GitHubClient } from '../github/github-client.js';
import { DataFactory } from '../utils/data-factory.js';
import { RequestBodyGenerator } from '../generators/request-body-generator.js';
import { HappyPathGenerator } from '../generators/happy-path-generator.js';
import { ErrorCaseGenerator } from '../generators/error-case-generator.js';
import { EdgeCaseGenerator } from '../generators/edge-case-generator.js';
import { AITestGenerator } from '../generators/ai-test-generator.js';
import { TestOrganizer } from '../generators/test-organizer.js';
import { CodeGenerator } from '../utils/code-generator.js';
import type { TestResult, ExecutionSummary } from '../types/executor-types.js';
import type { HealingReport } from '../types/self-healing-types.js';
import type { ParsedApiSpec } from '../types/openapi-types.js';
import type { TestGenerationResult, GenerationConfig } from '../types/test-generator-types.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Path to OpenAPI spec */
  specPath: string;

  /** Output directory for generated tests */
  outputDir: string;

  /** Base URL for API testing */
  baseUrl?: string;

  /** Enable AI-powered test generation */
  useAI?: boolean;

  /** Enable self-healing */
  enableHealing?: boolean;

  /** GitHub repository (owner/repo) */
  repository?: string;

  /** Pull request number */
  prNumber?: number;

  /** GitHub token for posting results */
  githubToken?: string;

  /** OpenAI API key for AI features */
  openaiApiKey?: string;

  /** Verbose output */
  verbose?: boolean;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  /** Parse stage result */
  spec: ParsedApiSpec;

  /** Generation stage result */
  generation: TestGenerationResult;

  /** Execution stage result */
  execution: ExecutionSummary;

  /** Self-healing stage result (if enabled) */
  healing?: HealingReport;

  /** Overall success */
  success: boolean;

  /** Total duration in milliseconds */
  duration: number;

  /** Pipeline metadata */
  metadata: {
    timestamp: Date;
    config: PipelineConfig;
    steps: StepResult[];
  };
}

/**
 * Individual step result
 */
interface StepResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

/**
 * Main Pipeline Orchestrator
 *
 * This is the "brain" that coordinates the 3-agent system:
 * - Agent 1: Test Generator (plans and creates tests)
 * - Agent 2: Test Executor (runs tests and collects failures)
 * - Agent 3: Self-Healer (analyzes and fixes broken tests)
 */
export class PipelineOrchestrator {
  private config: PipelineConfig;
  private githubClient?: GitHubClient;
  private steps: StepResult[] = [];
  private startTime: number = 0;

  constructor(config: PipelineConfig) {
    this.config = config;

    // Initialize GitHub client if credentials provided
    if (config.githubToken && config.repository) {
      this.githubClient = new GitHubClient({
        token: config.githubToken,
        owner: config.repository.split('/')[0]!,
        repo: config.repository.split('/')[1]!,
      });
    }
  }

  /**
   * Execute the complete pipeline
   *
   * This runs all 3 agents in sequence:
   * 1. Generate tests from OpenAPI spec
   * 2. Execute tests with Playwright
   * 3. Self-heal any failures (if enabled)
   */
  async execute(): Promise<PipelineResult> {
    this.startTime = Date.now();

    try {
      // Post initial status to GitHub
      await this.postGitHubStatus('pending', 'Starting API test pipeline...');

      // Step 1: Parse OpenAPI Specification
      const spec = await this.parseSpecification();

      // Step 2: Generate Tests (Agent 1: Test Generator)
      const generation = await this.generateTests(spec);

      // Step 3: Execute Tests (Agent 2: Test Executor)
      const execution = await this.executeTests(generation);

      // Step 4: Self-Heal Failures (Agent 3: Self-Healer)
      let healing: HealingReport | undefined;
      if (this.config.enableHealing && execution.failed > 0) {
        healing = await this.healFailures(execution);
      }

      // Calculate final results
      const finalPassed = execution.passed + (healing?.successfullyHealed || 0);
      const finalFailed = execution.failed - (healing?.successfullyHealed || 0);
      const success = finalFailed === 0;

      const result: PipelineResult = {
        spec,
        generation,
        execution,
        healing,
        success,
        duration: Date.now() - this.startTime,
        metadata: {
          timestamp: new Date(),
          config: this.config,
          steps: this.steps,
        },
      };

      // Post final results to GitHub
      await this.postResults(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Post failure status to GitHub
      await this.postGitHubStatus('failure', `Pipeline failed: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Step 1: Parse OpenAPI Specification
   */
  private async parseSpecification(): Promise<ParsedApiSpec> {
    const stepStart = Date.now();
    this.log('📋 Step 1: Parsing OpenAPI specification...');

    try {
      // Check file size for optimization
      const stats = await fs.stat(this.config.specPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      const isLargeSpec = fileSizeMB > 2;

      if (isLargeSpec) {
        this.log(`⚡ Large spec detected (${fileSizeMB.toFixed(1)}MB) - using fast mode`);
      }

      const spec = await parseOpenAPIFile(this.config.specPath, {
        skipDereference: isLargeSpec,
        skipValidation: isLargeSpec,
      });

      const duration = Date.now() - stepStart;
      this.log(`✅ Parsed ${spec.paths.length} endpoints in ${duration}ms`);

      this.steps.push({
        name: 'parse-specification',
        status: 'success',
        duration,
      });

      return spec;
    } catch (error) {
      const duration = Date.now() - stepStart;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.steps.push({
        name: 'parse-specification',
        status: 'failed',
        duration,
        error: errorMessage,
      });

      throw new Error(`Failed to parse specification: ${errorMessage}`);
    }
  }

  /**
   * Step 2: Generate Tests (Agent 1: Test Generator)
   *
   * This agent analyzes the OpenAPI spec and creates comprehensive tests.
   * Uses AI if OPENAI_API_KEY is set, otherwise uses rule-based generators.
   */
  private async generateTests(spec: ParsedApiSpec): Promise<TestGenerationResult> {
    const stepStart = Date.now();
    this.log('🤖 Step 2: Generating tests (Agent 1: Test Generator)...');

    try {
      const config: GenerationConfig = {
        output: this.config.outputDir,
        organization: 'by-tag',
        includeAuth: true,
        includeErrors: true,
        includeEdgeCases: true,
        includeFlows: false,
      };

      const generator = new TestGenerator(spec, config);

      // Initialize rule-based generators
      const dataFactory = new DataFactory();
      const bodyGenerator = new RequestBodyGenerator();

      const happyPathGen = new HappyPathGenerator(dataFactory, bodyGenerator);
      generator.setGenerator('happy-path', happyPathGen);

      const errorGen = new ErrorCaseGenerator(bodyGenerator);
      generator.setGenerator('error-case', {
        generateTests: (endpoints) => endpoints.flatMap(ep => errorGen.generateTests(ep))
      });

      const edgeGen = new EdgeCaseGenerator(dataFactory);
      generator.setGenerator('edge-case', {
        generateTests: (endpoints) => endpoints.flatMap(ep => edgeGen.generateTests(ep))
      });

      // Set up test organizer and code generator
      const organizer = new TestOrganizer();
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

      const codeGen = new CodeGenerator();
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

      // Extract endpoints
      const endpoints = generator.extractEndpoints();

      // Generate standard tests
      const result = await generator.generateTests();

      // Add AI-generated tests if enabled and API key is present
      const shouldUseAI = this.config.useAI === undefined
        ? !!(this.config.openaiApiKey || process.env.OPENAI_API_KEY)
        : this.config.useAI;

      if (shouldUseAI) {
        this.log('✨ Generating AI-powered intelligent tests...');

        const aiGen = new AITestGenerator({
          apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
          testsPerEndpoint: 3,
          focus: ['business-logic', 'security', 'workflows', 'edge-cases'],
          verbose: this.config.verbose
        });

        if (aiGen.isEnabled()) {
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

            // Generate AI test files
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

            if (!result.statistics.testsByType.validation) {
              result.statistics.testsByType.validation = 0;
            }
            result.statistics.testsByType.validation += aiTests.length;

            this.log(`✅ Generated ${aiTests.length} AI-powered tests`);
          }
        }
      }

      // Write test files to disk
      await fs.mkdir(this.config.outputDir, { recursive: true });

      for (const file of result.files) {
        const filePath = path.join(this.config.outputDir, file.filePath);
        const fileDir = path.dirname(filePath);
        await fs.mkdir(fileDir, { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf-8');
      }

      const duration = Date.now() - stepStart;
      this.log(`✅ Generated ${result.totalTests} tests in ${result.files.length} files (${duration}ms)`);

      this.steps.push({
        name: 'generate-tests',
        status: 'success',
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - stepStart;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.steps.push({
        name: 'generate-tests',
        status: 'failed',
        duration,
        error: errorMessage,
      });

      throw new Error(`Failed to generate tests: ${errorMessage}`);
    }
  }

  /**
   * Step 3: Execute Tests (Agent 2: Test Executor)
   *
   * This agent runs all generated tests and captures failures for the healer.
   */
  private async executeTests(generation: TestGenerationResult): Promise<ExecutionSummary> {
    const stepStart = Date.now();
    this.log('🧪 Step 3: Executing tests (Agent 2: Test Executor)...');

    try {
      const executor = new PlaywrightExecutor({
        outputDir: this.config.outputDir,
        baseUrl: this.config.baseUrl,
        workers: 4,
        timeout: 30000,
        retries: 2,
      });

      const summary = await executor.runAll();

      const duration = Date.now() - stepStart;
      this.log(`✅ Execution complete: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped (${duration}ms)`);

      this.steps.push({
        name: 'execute-tests',
        status: summary.failed > 0 ? 'failed' : 'success',
        duration,
      });

      return summary;
    } catch (error) {
      const duration = Date.now() - stepStart;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.steps.push({
        name: 'execute-tests',
        status: 'failed',
        duration,
        error: errorMessage,
      });

      throw new Error(`Failed to execute tests: ${errorMessage}`);
    }
  }

  /**
   * Step 4: Self-Heal Failures (Agent 3: Self-Healer)
   *
   * This agent analyzes test failures and uses AI to regenerate broken tests.
   */
  private async healFailures(execution: ExecutionSummary): Promise<HealingReport> {
    const stepStart = Date.now();
    this.log(`🔧 Step 4: Self-healing failures (Agent 3: Self-Healer)...`);
    this.log(`   Found ${execution.failed} failures to analyze`);

    try {
      const healer = new SelfHealingOrchestrator(
        {
          failureAnalyzer: new SimpleFailureAnalyzer(),
          testRegenerator: new AITestRegenerator({
            apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
            model: 'gpt-4',
          }),
        },
        {
          maxAttemptsPerTest: 2,
          maxTotalTime: 300000, // 5 minutes
          minConfidence: 0.6,
          autoRetry: true,
          aiConfig: {
            apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY || '',
            model: 'gpt-4',
            timeout: 30000,
            maxRetries: 3,
          },
        }
      );

      // Get failed test results
      const failedResults: TestResult[] = []; // Would come from executor

      const healingReport = await healer.healFailedTests(failedResults);

      const duration = Date.now() - stepStart;
      this.log(`✅ Healing complete: ${healingReport.successfullyHealed} fixed, ${healingReport.failedHealing} failed (${duration}ms)`);

      this.steps.push({
        name: 'self-heal',
        status: 'success',
        duration,
      });

      return healingReport;
    } catch (error) {
      const duration = Date.now() - stepStart;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.steps.push({
        name: 'self-heal',
        status: 'failed',
        duration,
        error: errorMessage,
      });

      throw new Error(`Failed to heal tests: ${errorMessage}`);
    }
  }

  /**
   * Post results to GitHub PR
   */
  private async postResults(result: PipelineResult): Promise<void> {
    if (!this.githubClient || !this.config.prNumber) {
      return;
    }

    try {
      const finalPassed = result.execution.passed + (result.healing?.successfullyHealed || 0);
      const finalFailed = result.execution.failed - (result.healing?.successfullyHealed || 0);

      const comment = this.formatResultsComment(result, finalPassed, finalFailed);

      await this.githubClient.createComment(this.config.prNumber, comment);

      // Update GitHub status
      const status = finalFailed === 0 ? 'success' : 'failure';
      const description = `${finalPassed} passed, ${finalFailed} failed`;
      await this.postGitHubStatus(status, description);

      this.log('✅ Posted results to GitHub PR');
    } catch (error) {
      this.log(`⚠️  Failed to post to GitHub: ${error}`);
    }
  }

  /**
   * Format pipeline results as GitHub comment
   */
  private formatResultsComment(result: PipelineResult, finalPassed: number, finalFailed: number): string {
    const { generation, execution, healing } = result;

    let comment = '## 🤖 API Test Agent Results\n\n';

    // Overall status
    const status = finalFailed === 0 ? '✅ All tests passed!' : `⚠️ ${finalFailed} test(s) failed`;
    comment += `### ${status}\n\n`;

    // Summary table
    comment += '| Stage | Result |\n';
    comment += '|-------|--------|\n';
    comment += `| 📋 Specification | Parsed ${Object.keys(result.spec.paths).length} endpoints |\n`;
    comment += `| 🤖 Test Generation | Generated ${generation.totalTests} tests in ${generation.files.length} files |\n`;
    comment += `| 🧪 Test Execution | ${execution.passed} passed, ${execution.failed} failed, ${execution.skipped} skipped |\n`;

    if (healing) {
      comment += `| 🔧 Self-Healing | Fixed ${healing.successfullyHealed} of ${healing.failedTests} failures |\n`;
    }

    comment += `| ⏱️ Total Duration | ${(result.duration / 1000).toFixed(2)}s |\n\n`;

    // Healing details
    if (healing && healing.successfullyHealed > 0) {
      comment += '### 🔧 Self-Healing Results\n\n';
      comment += `The AI successfully healed **${healing.successfullyHealed}** failing test(s)!\n\n`;
      comment += `- Attempts: ${healing.healingAttempts}\n`;
      comment += `- Success Rate: ${((healing.successfullyHealed / healing.healingAttempts) * 100).toFixed(1)}%\n`;
      comment += `- Time Spent: ${(healing.totalTime / 1000).toFixed(2)}s\n\n`;
    }

    // Final summary
    comment += '### 📊 Final Results\n\n';
    comment += `- ✅ **${finalPassed}** tests passing\n`;
    comment += `- ❌ **${finalFailed}** tests failing\n`;
    comment += `- ⏭️ **${execution.skipped}** tests skipped\n`;

    return comment;
  }

  /**
   * Post status to GitHub commit/PR
   */
  private async postGitHubStatus(
    status: 'pending' | 'success' | 'failure',
    description: string
  ): Promise<void> {
    if (!this.githubClient) {
      return;
    }

    try {
      // In a real implementation, this would update the commit status
      this.log(`📝 GitHub Status: ${status} - ${description}`);
    } catch (error) {
      this.log(`⚠️  Failed to update GitHub status: ${error}`);
    }
  }

  /**
   * Log message (respects verbose flag)
   */
  private log(message: string): void {
    if (this.config.verbose !== false) {
      console.log(message);
    }
  }
}
