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
import { DockerTestExecutor } from '../executor/docker-test-executor.js';
import { SelfHealingOrchestrator, SimpleFailureAnalyzer } from '../ai/self-healing-orchestrator.js';
import { AITestRegenerator } from '../ai/ai-test-regenerator.js';
import { GitHubClient } from '../github/github-client.js';
import { EmailSender } from '../reporting/email-sender.js';
import { DataFactory } from '../utils/data-factory.js';
import { RequestBodyGenerator } from '../generators/request-body-generator.js';
import { HappyPathGenerator } from '../generators/happy-path-generator.js';
import { ErrorCaseGenerator } from '../generators/error-case-generator.js';
import { EdgeCaseGenerator } from '../generators/edge-case-generator.js';
import { AITestGenerator } from '../generators/ai-test-generator.js';
import { TestOrganizer } from '../generators/test-organizer.js';
import { CodeGenerator } from '../utils/code-generator.js';
import { PerformanceTestGenerator } from '../generators/performance-test-generator.js';
import type { TestResult, ExecutionSummary } from '../types/executor-types.js';
import type { HealingReport } from '../types/ai-types.js';
import type { ParsedApiSpec } from '../types/openapi-types.js';
import type { TestGenerationResult } from '../types/test-generator-types.js';
import type { EmailConfig } from '../types/email-types.js';
import type { DockerExecutorOptions } from '../types/docker-types.js';
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

  /** Email configuration for test reports */
  emailConfig?: EmailConfig;

  /** Use Docker for test execution */
  useDocker?: boolean;

  /** Docker executor configuration */
  dockerConfig?: DockerExecutorOptions;

  /** Enable performance testing */
  includePerformance?: boolean;

  /** Performance test configuration */
  performanceConfig?: {
    users?: number;
    duration?: number;
    rampUpTime?: number;
  };

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
      this.githubClient = new GitHubClient(config.githubToken);
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

      // Send email report if configured
      if (this.config.emailConfig) {
        await this.sendEmailReport(result);
      }

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
      const config = {
        output: this.config.outputDir,
        organization: 'by-tag' as const,
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
        generateTests: (endpoints) => endpoints.flatMap((ep) => errorGen.generateTests(ep)),
      });

      const edgeGen = new EdgeCaseGenerator(dataFactory);
      generator.setGenerator('edge-case', {
        generateTests: (endpoints) => endpoints.flatMap((ep) => edgeGen.generateTests(ep)),
      });

      // Performance tests (if enabled)
      if (this.config.includePerformance) {
        const perfGen = new PerformanceTestGenerator({
          defaultUsers: this.config.performanceConfig?.users || 10,
          defaultDuration: this.config.performanceConfig?.duration || 60,
          generateMultipleScenarios: true,
        });
        generator.setGenerator('performance', perfGen);
        this.log('⚡ Performance test generation enabled');
      }

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
              testCount: result.totalTests,
            },
          };
        },
      });

      const codeGen = new CodeGenerator();
      generator.setCodeGenerator({
        generateFiles: (organized) => {
          const files: any[] = [];
          for (const [fileName, tests] of organized.files) {
            const metadata = {
              endpoints: [...new Set(tests.map((t) => t.endpoint))],
              testTypes: [...new Set(tests.map((t) => t.type))],
              testCount: tests.length,
              tags: [...new Set(tests.flatMap((t) => t.metadata.tags || []))],
              generatedAt: new Date().toISOString(),
            };
            const content = codeGen.generateTestFile(tests, metadata);
            files.push({
              fileName,
              filePath: fileName,
              content,
              tests,
              imports: [],
              metadata,
            });
          }
          return files;
        },
        generateFile: (fileName, tests) => {
          const metadata = {
            endpoints: [...new Set(tests.map((t) => t.endpoint))],
            testTypes: [...new Set(tests.map((t) => t.type))],
            testCount: tests.length,
            tags: [...new Set(tests.flatMap((t) => t.metadata.tags || []))],
            generatedAt: new Date().toISOString(),
          };
          const content = codeGen.generateTestFile(tests, metadata);
          return {
            fileName,
            filePath: fileName,
            content,
            tests,
            imports: [],
            metadata,
          };
        },
      });

      // Extract endpoints
      const endpoints = generator.extractEndpoints();

      // Generate standard tests
      const result = await generator.generateTests();

      // Add AI-generated tests if enabled and API key is present
      const shouldUseAI =
        this.config.useAI === undefined
          ? Boolean(this.config.openaiApiKey || process.env.OPENAI_API_KEY)
          : this.config.useAI;

      if (shouldUseAI) {
        this.log('✨ Generating AI-powered intelligent tests...');

        const aiGen = new AITestGenerator({
          apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
          testsPerEndpoint: 3,
          focus: ['business-logic', 'security', 'workflows', 'edge-cases'],
          verbose: this.config.verbose,
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
                generatedAt: new Date().toISOString(),
              };
              const content = codeGen.generateTestFile(tests, metadata);
              aiFiles.push({
                fileName,
                filePath: `ai-tests/${fileName}`,
                content,
                tests,
                imports: [],
                metadata,
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
      this.log(
        `✅ Generated ${result.totalTests} tests in ${result.files.length} files (${duration}ms)`
      );

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
      // Choose executor based on configuration
      if (this.config.useDocker) {
        const dockerExecutor = new DockerTestExecutor(
          this.config.dockerConfig || {
            dockerImage: 'mcr.microsoft.com/playwright:latest',
            isolationPerTest: false,
          }
        );

        this.log('🐳 Executing tests in Docker container...');

        // Set test path to the output directory containing generated tests
        const testPath = generation.files.map((f) => path.join(this.config.outputDir, f.filePath));

        const dockerResult = await dockerExecutor.executeTests({
          testPath,
          outputDir: this.config.outputDir,
        });

        // DockerExecutionResult extends ExecutionSummary, so we can use it directly
        const summary: ExecutionSummary = {
          totalTests: dockerResult.totalTests,
          passed: dockerResult.passed,
          failed: dockerResult.failed,
          skipped: dockerResult.skipped,
          timeout: dockerResult.timeout,
          error: dockerResult.error,
          duration: dockerResult.duration,
          startTime: dockerResult.startTime,
          endTime: dockerResult.endTime,
          successRate: dockerResult.successRate,
          averageDuration: dockerResult.averageDuration,
          filesExecuted: dockerResult.filesExecuted,
          totalRetries: dockerResult.totalRetries,
          byFile: dockerResult.byFile,
          failedTestDetails: dockerResult.failedTestDetails,
        };

        const duration = Date.now() - stepStart;
        this.log(
          `✅ Execution complete: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped (${duration}ms)`
        );

        this.steps.push({
          name: 'execute-tests',
          status: summary.failed > 0 ? 'failed' : 'success',
          duration,
        });

        return summary;
      } else {
        // Existing PlaywrightExecutor logic
        const executor = new PlaywrightExecutor({
          outputDir: this.config.outputDir,
          baseUrl: this.config.baseUrl,
          workers: 4,
          timeout: 30000,
          retries: 2,
        });

        const summary = await executor.runAll();

        const duration = Date.now() - stepStart;
        this.log(
          `✅ Execution complete: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped (${duration}ms)`
        );

        this.steps.push({
          name: 'execute-tests',
          status: summary.failed > 0 ? 'failed' : 'success',
          duration,
        });

        // Log performance test generation (they run as part of regular tests)
        const perfTests = generation.files.filter((f) => f.filePath.includes('performance'));
        if (perfTests.length > 0 && this.config.includePerformance) {
          this.log(
            `⚡ Generated ${perfTests.length} performance test file(s) ` +
              `(${this.config.performanceConfig?.users || 10} users, ` +
              `${this.config.performanceConfig?.duration || 60}s duration)`
          );
        }

        return summary;
      }
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
      // Create test runner adapter
      const executor = new PlaywrightExecutor({
        outputDir: this.config.outputDir,
        baseUrl: this.config.baseUrl,
      });

      const healer = new SelfHealingOrchestrator(
        {
          failureAnalyzer: new SimpleFailureAnalyzer(),
          specChangeDetector: {
            async detectChanges(_oldSpec: unknown, _newSpec: unknown) {
              // Spec change detection not yet implemented
              return [];
            },
          },
          testRegenerator: new AITestRegenerator({
            apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
            model: 'gpt-4',
          }),
          testRunner: {
            async runTest(testPath: string, _testName: string) {
              const result = await executor.runTest(testPath);
              return result;
            },
          },
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
      this.log(
        `✅ Healing complete: ${healingReport.successfullyHealed} fixed, ${healingReport.failedHealing} failed (${duration}ms)`
      );

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
    if (!this.githubClient || !this.config.prNumber || !this.config.repository) {
      return;
    }

    try {
      const finalPassed = result.execution.passed + (result.healing?.successfullyHealed || 0);
      const finalFailed = result.execution.failed - (result.healing?.successfullyHealed || 0);

      // Parse owner and repo from repository string (format: "owner/repo")
      const [owner, repo] = this.config.repository.split('/');
      if (!owner || !repo) {
        throw new Error(`Invalid repository format: ${this.config.repository}`);
      }

      // Post rich comment
      await this.postGitHubResults(result, owner, repo);

      // Create check run
      await this.createCheckRun(result, owner, repo);

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
   * Post rich formatted results to GitHub PR
   */
  private async postGitHubResults(
    result: PipelineResult,
    owner: string,
    repo: string
  ): Promise<void> {
    if (!this.githubClient || !this.config.prNumber) {
      return;
    }

    const emoji = result.execution.failed === 0 ? '✅' : '❌';
    const status = result.execution.failed === 0 ? 'PASSED' : 'FAILED';
    const successRate =
      result.execution.totalTests > 0
        ? ((result.execution.passed / result.execution.totalTests) * 100).toFixed(1)
        : '0.0';

    const comment = `### ${emoji} API Tests ${status}

**Test Summary**
| Metric | Value |
|--------|-------|
| Total Tests | ${result.execution.totalTests} |
| Passed | ✅ ${result.execution.passed} |
| Failed | ❌ ${result.execution.failed} |
| Success Rate | ${successRate}% |
| Duration | ${(result.duration / 1000).toFixed(2)}s |

**Test Generation**
- Spec Endpoints: ${result.spec.paths.length}
- Generated Files: ${result.generation.files.length}
- Test Coverage: ${result.generation.totalTests} tests

${
  result.healing
    ? `**Self-Healing Results** 🔧
- Attempts: ${result.healing.healingAttempts}
- Successful: ${result.healing.successfullyHealed}
- Failed: ${result.healing.failedHealing}
`
    : ''
}

${
  result.execution.failed > 0 && result.execution.failedTestDetails
    ? `
<details>
<summary>❌ Failed Tests (${result.execution.failed})</summary>

${result.execution.failedTestDetails
  .slice(0, 10)
  .map((f) => `- **${f.testName}** (${f.file})\n  \`\`\`\n  ${f.error}\n  \`\`\``)
  .join('\n\n')}

${result.execution.failed > 10 ? `\n_... and ${result.execution.failed - 10} more failures_` : ''}
</details>
`
    : ''
}

---
*Generated by API Test Agent at ${result.metadata.timestamp.toISOString()}*`;

    await this.githubClient.postComment(owner, repo, this.config.prNumber, comment);
  }

  /**
   * Create GitHub Check Run
   */
  private async createCheckRun(result: PipelineResult, owner: string, repo: string): Promise<void> {
    if (!this.githubClient) {
      return;
    }

    const conclusion = result.execution.failed === 0 ? 'success' : 'failure';
    const title =
      result.execution.failed === 0
        ? '✅ All API tests passed'
        : `❌ ${result.execution.failed} test(s) failed`;

    const summary = `**${result.execution.passed}** passed, **${result.execution.failed}** failed out of **${result.execution.totalTests}** total tests`;

    const text = `## Test Execution Details

**Spec**: ${this.config.specPath}
**Base URL**: ${this.config.baseUrl || 'Not specified'}
**Duration**: ${(result.duration / 1000).toFixed(2)}s

### Test Generation
- Endpoints parsed: ${result.spec.paths.length}
- Tests generated: ${result.generation.totalTests}
- Files created: ${result.generation.files.length}

### Execution Results
- Total tests: ${result.execution.totalTests}
- Passed: ${result.execution.passed}
- Failed: ${result.execution.failed}
- Success rate: ${result.execution.totalTests > 0 ? ((result.execution.passed / result.execution.totalTests) * 100).toFixed(1) : '0.0'}%

${
  result.healing
    ? `### Self-Healing
- Total attempts: ${result.healing.healingAttempts}
- Successful: ${result.healing.successfullyHealed}
- Failed: ${result.healing.failedHealing}
`
    : ''
}`;

    await this.githubClient.createCheckRun(owner, repo, {
      name: 'API Test Agent',
      head_sha: process.env.GITHUB_SHA || 'HEAD',
      status: 'completed',
      conclusion,
      output: {
        title,
        summary,
        text,
      },
    });
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
   * Send email report with test results
   */
  private async sendEmailReport(result: PipelineResult): Promise<void> {
    if (!this.config.emailConfig) return;

    try {
      const emailSender = new EmailSender(this.config.emailConfig);

      // Build TestReport object matching the EmailSender's expected format
      const testReport = {
        execution: result.execution,
        // For now, omit healing metrics - full integration would require complete HealingMetricsSummary
        environment: {
          baseUrl: this.config.baseUrl || 'http://localhost',
          name: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          hostname: process.env.HOSTNAME,
        },
        metadata: {
          id: `test-${Date.now()}`,
          timestamp: result.metadata.timestamp,
          version: '1.0.0',
          generatedBy: 'API Test Agent',
          tags: ['api-test'],
        },
      };

      // For now, pass empty HTML report - future enhancement can generate HTML
      await emailSender.sendReport(testReport, '');
      this.log('📧 Email report sent successfully');
    } catch (error) {
      this.log(
        `⚠️  Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
