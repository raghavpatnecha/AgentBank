/**
 * JSON Report Generator (Feature 6, Task 6.3)
 * Generates machine-readable JSON reports for CI/CD integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  TestReport,
  JSONReporterConfig,
  Reporter,
  ReportSummary,
  EnvironmentInfo,
  PerformanceMetrics,
  SelfHealingStats,
} from '../types/reporting-types';

const gzip = promisify(zlib.gzip);

/**
 * JSON Reporter for generating machine-readable test reports
 */
export class JSONReporter implements Reporter {
  private config: Required<JSONReporterConfig>;
  private validator?: ValidateFunction;
  private ajv: Ajv;

  /**
   * Create a new JSON reporter
   * @param config - Reporter configuration
   */
  constructor(config: JSONReporterConfig = {}) {
    this.config = {
      outputPath: config.outputPath || './reports/test-report.json',
      pretty: config.pretty ?? false,
      indent: config.indent ?? 2,
      validateSchema: config.validateSchema ?? true,
      compress: config.compress ?? false,
      includeEnvironment: config.includeEnvironment ?? true,
      includeSelfHealing: config.includeSelfHealing ?? true,
      includePerformance: config.includePerformance ?? true,
      metadata: config.metadata || {},
    };

    // Initialize Ajv for JSON Schema validation
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);

    // Load and compile schema if validation is enabled
    if (this.config.validateSchema) {
      this.loadSchema();
    }
  }

  /**
   * Load and compile JSON Schema
   */
  private async loadSchema(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, 'schemas', 'report-schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      this.validator = this.ajv.compile(schema);
    } catch (error) {
      console.warn('Failed to load JSON schema, validation will be skipped:', error);
    }
  }

  /**
   * Generate JSON report from test data
   * @param data - Test report data
   * @returns JSON string
   */
  async generateReport(data: TestReport): Promise<string> {
    // Prepare report data
    const report = this.prepareReportData(data);

    // Format JSON
    const json = this.formatJSON(report, this.config.pretty);

    // Validate against schema
    if (this.config.validateSchema && !this.validateJSONSchema(json)) {
      throw new Error('Generated JSON does not conform to schema');
    }

    return json;
  }

  /**
   * Prepare report data with configuration options
   * @param data - Raw test report data
   * @returns Prepared report object
   */
  private prepareReportData(data: TestReport): Record<string, unknown> {
    const report: Record<string, unknown> = {
      version: data.version || '1.0.0',
      generatedAt: this.serializeDate(data.generatedAt),
      summary: this.prepareSummary(data.summary),
    };

    // Add environment if enabled
    if (this.config.includeEnvironment) {
      report.environment = this.prepareEnvironment(data.environment);
    }

    // Add tests
    report.tests = data.tests.map((test) => this.prepareTestEntry(test));

    // Add self-healing stats if enabled and available
    if (this.config.includeSelfHealing && data.selfHealing) {
      report.selfHealing = this.prepareSelfHealing(data.selfHealing);
    }

    // Add performance metrics if enabled and available
    if (this.config.includePerformance && data.performance) {
      report.performance = this.preparePerformance(data.performance);
    }

    // Add metadata
    if (data.metadata || Object.keys(this.config.metadata).length > 0) {
      report.metadata = {
        ...data.metadata,
        ...this.config.metadata,
      };
    }

    return report;
  }

  /**
   * Prepare summary statistics
   */
  private prepareSummary(summary: ReportSummary): Record<string, unknown> {
    const result: Record<string, unknown> = {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      duration: summary.duration,
      successRate: Math.round(summary.successRate * 100) / 100,
    };

    if (summary.selfHealed !== undefined) {
      result.selfHealed = summary.selfHealed;
    }

    if (summary.startTime) {
      result.startTime = this.serializeDate(summary.startTime);
    }

    if (summary.endTime) {
      result.endTime = this.serializeDate(summary.endTime);
    }

    return result;
  }

  /**
   * Prepare environment information
   */
  private prepareEnvironment(env: EnvironmentInfo): Record<string, unknown> {
    const result: Record<string, unknown> = {
      timestamp: this.serializeDate(env.timestamp),
      nodeVersion: env.nodeVersion,
      osInfo: env.osInfo,
    };

    if (env.baseUrl) {
      result.baseUrl = env.baseUrl;
    }

    if (env.environment) {
      result.environment = env.environment;
    }

    if (env.platform) {
      result.platform = env.platform;
    }

    if (env.architecture) {
      result.architecture = env.architecture;
    }

    if (env.ci) {
      result.ci = env.ci;
    }

    return result;
  }

  /**
   * Prepare test entry for JSON
   */
  private prepareTestEntry(test: any): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: test.id,
      name: test.name,
      suite: test.suite,
      status: test.status,
      duration: test.duration,
    };

    if (test.startTime) {
      result.startTime = this.serializeDate(test.startTime);
    }

    if (test.endTime) {
      result.endTime = this.serializeDate(test.endTime);
    }

    if (test.retries !== undefined) {
      result.retries = test.retries;
    }

    if (test.selfHealed !== undefined) {
      result.selfHealed = test.selfHealed;
    }

    if (test.request) {
      result.request = test.request;
    }

    if (test.response) {
      result.response = test.response;
    }

    if (test.error) {
      result.error = test.error;
    }

    if (test.tags && test.tags.length > 0) {
      result.tags = test.tags;
    }

    if (test.metadata) {
      result.metadata = test.metadata;
    }

    return result;
  }

  /**
   * Prepare self-healing statistics
   */
  private prepareSelfHealing(stats: SelfHealingStats): Record<string, unknown> {
    const result: Record<string, unknown> = {
      totalAttempts: stats.totalAttempts,
      successful: stats.successful,
      failed: stats.failed,
      successRate: Math.round(stats.successRate * 100) / 100,
    };

    if (stats.byFailureType) {
      result.byFailureType = stats.byFailureType;
    }

    if (stats.totalCost !== undefined) {
      result.totalCost = Math.round(stats.totalCost * 100) / 100;
    }

    return result;
  }

  /**
   * Prepare performance metrics
   */
  private preparePerformance(perf: PerformanceMetrics): Record<string, unknown> {
    const result: Record<string, unknown> = {
      averageResponseTime: Math.round(perf.averageResponseTime * 100) / 100,
    };

    if (perf.medianResponseTime !== undefined) {
      result.medianResponseTime = Math.round(perf.medianResponseTime * 100) / 100;
    }

    if (perf.p95ResponseTime !== undefined) {
      result.p95ResponseTime = Math.round(perf.p95ResponseTime * 100) / 100;
    }

    if (perf.slowestTest) {
      result.slowestTest = perf.slowestTest;
    }

    if (perf.fastestTest) {
      result.fastestTest = perf.fastestTest;
    }

    if (perf.testsPerSecond !== undefined) {
      result.testsPerSecond = Math.round(perf.testsPerSecond * 100) / 100;
    }

    return result;
  }

  /**
   * Serialize Date to ISO string
   */
  private serializeDate(date: Date): string {
    return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
  }

  /**
   * Format JSON output
   * @param data - Data to format
   * @param pretty - Whether to pretty-print
   * @returns Formatted JSON string
   */
  formatJSON(data: unknown, pretty: boolean): string {
    if (pretty) {
      return JSON.stringify(data, null, this.config.indent);
    }
    return JSON.stringify(data);
  }

  /**
   * Validate JSON against schema
   * @param json - JSON string to validate
   * @returns Whether JSON is valid
   */
  validateJSONSchema(json: string): boolean {
    if (!this.validator) {
      // Schema not loaded, skip validation
      return true;
    }

    try {
      const data = JSON.parse(json);
      const valid = this.validator(data);

      if (!valid && this.validator.errors) {
        console.error('JSON Schema validation errors:');
        this.validator.errors.forEach((error) => {
          const path = (error as any).instancePath || '';
          console.error(`  - ${path}: ${error.message}`);
        });
        return false;
      }

      return !!valid;
    } catch (error) {
      console.error('Failed to parse JSON for validation:', error);
      return false;
    }
  }

  /**
   * Validate report format (alias for validateJSONSchema)
   * @param content - JSON string to validate
   * @returns Whether JSON is valid
   */
  validate(content: string): boolean {
    return this.validateJSONSchema(content);
  }

  /**
   * Compress JSON using gzip
   * @param json - JSON string to compress
   * @returns Compressed buffer
   */
  async compress(json: string): Promise<Buffer> {
    try {
      const buffer = Buffer.from(json, 'utf-8');
      return await gzip(buffer);
    } catch (error) {
      throw new Error(`Failed to compress JSON: ${error}`);
    }
  }

  /**
   * Save report to file
   * @param json - JSON string to save
   * @param filepath - Output file path
   */
  async saveToFile(json: string, filepath?: string): Promise<void> {
    const outputPath = filepath || this.config.outputPath;

    try {
      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      if (this.config.compress) {
        // Save compressed file
        const compressed = await this.compress(json);
        await fs.writeFile(outputPath + '.gz', compressed);
      } else {
        // Save regular JSON file
        await fs.writeFile(outputPath, json, 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to save JSON report to ${outputPath}: ${error}`);
    }
  }

  /**
   * Generate and save report in one operation
   * @param data - Test report data
   * @param filepath - Optional output file path
   * @returns Path to saved file
   */
  async generateAndSave(data: TestReport, filepath?: string): Promise<string> {
    const json = await this.generateReport(data);
    await this.saveToFile(json, filepath);

    const outputPath = filepath || this.config.outputPath;
    return this.config.compress ? outputPath + '.gz' : outputPath;
  }

  /**
   * Parse JSON report from file
   * @param filepath - Path to JSON file
   * @returns Parsed test report
   */
  async parseFromFile(filepath: string): Promise<TestReport> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON report from ${filepath}: ${error}`);
    }
  }

  /**
   * Get configuration
   * @returns Reporter configuration
   */
  getConfig(): Required<JSONReporterConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<JSONReporterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Reload schema if validation setting changed
    if (config.validateSchema !== undefined && config.validateSchema && !this.validator) {
      this.loadSchema();
    }
  }
}

/**
 * Create a JSON reporter instance
 * @param config - Reporter configuration
 * @returns JSONReporter instance
 */
export function createJSONReporter(config?: JSONReporterConfig): JSONReporter {
  return new JSONReporter(config);
}

export default JSONReporter;
