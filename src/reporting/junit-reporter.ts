/**
 * JUnit XML Report Generator (Feature 6, Task 6.4)
 * Generates JUnit XML format reports for CI/CD tools
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  TestReport,
  JUnitReporterConfig,
  Reporter,
  TestReportEntry,
} from '../types/reporting-types';

/**
 * JUnit XML Reporter for generating CI/CD compatible test reports
 */
export class JUnitReporter implements Reporter {
  private config: Required<JUnitReporterConfig>;

  /**
   * Create a new JUnit reporter
   * @param config - Reporter configuration
   */
  constructor(config: JUnitReporterConfig = {}) {
    this.config = {
      outputPath: config.outputPath || './reports/junit-report.xml',
      suiteName: config.suiteName || 'API Tests',
      includeSystemOut: config.includeSystemOut ?? true,
      includeSystemErr: config.includeSystemErr ?? true,
      includeProperties: config.includeProperties ?? true,
      validateXML: config.validateXML ?? true,
      properties: config.properties || {},
      hostname: config.hostname || os.hostname(),
    };
  }

  /**
   * Generate JUnit XML report from test data
   * @param data - Test report data
   * @returns XML string
   */
  async generateReport(data: TestReport): Promise<string> {
    // Group tests by suite
    const testSuites = this.groupTestsBySuite(data);

    // Build XML
    const xml = this.buildXML(data, testSuites);

    // Validate if enabled
    if (this.config.validateXML && !this.validateXML(xml)) {
      throw new Error('Generated XML is not valid');
    }

    return xml;
  }

  /**
   * Group tests by suite name
   * @param data - Test report data
   * @returns Map of suite name to test entries
   */
  private groupTestsBySuite(data: TestReport): Map<string, TestReportEntry[]> {
    const suites = new Map<string, TestReportEntry[]>();

    for (const test of data.tests) {
      const suiteName = test.suite || 'Uncategorized';
      if (!suites.has(suiteName)) {
        suites.set(suiteName, []);
      }
      suites.get(suiteName)!.push(test);
    }

    return suites;
  }

  /**
   * Build complete XML document
   * @param data - Test report data
   * @param testSuites - Grouped test suites
   * @returns XML string
   */
  buildXML(data: TestReport, testSuites: Map<string, TestReportEntry[]>): string {
    const lines: string[] = [];

    // XML declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    // Calculate total statistics
    const totalTests = data.summary.total;
    const totalFailures = data.summary.failed;
    const totalErrors = 0; // We don't distinguish errors from failures
    const totalSkipped = data.summary.skipped;
    const totalTime = this.millisecondsToSeconds(data.summary.duration);

    // Root testsuites element
    lines.push(
      `<testsuites name="${this.escapeXML(this.config.suiteName)}" ` +
        `tests="${totalTests}" ` +
        `failures="${totalFailures}" ` +
        `errors="${totalErrors}" ` +
        `skipped="${totalSkipped}" ` +
        `time="${totalTime}">`
    );

    // Build each test suite
    for (const [suiteName, tests] of testSuites) {
      lines.push(this.buildTestSuite(suiteName, tests, data));
    }

    // Close testsuites
    lines.push('</testsuites>');

    return lines.join('\n');
  }

  /**
   * Build a test suite element
   * @param suiteName - Name of the suite
   * @param tests - Tests in the suite
   * @param data - Full test report data
   * @returns XML string for test suite
   */
  buildTestSuite(suiteName: string, tests: TestReportEntry[], data: TestReport): string {
    const lines: string[] = [];

    // Calculate suite statistics
    const suiteTests = tests.length;
    const suiteFailures = tests.filter((t) => t.status === 'failed').length;
    const suiteErrors = tests.filter((t) => t.status === 'error').length;
    const suiteSkipped = tests.filter((t) => t.status === 'skipped').length;
    const suiteTime = this.millisecondsToSeconds(tests.reduce((sum, t) => sum + t.duration, 0));

    // Get timestamp from first test or report
    const timestamp = tests[0]?.startTime || data.generatedAt;

    // Open testsuite element
    lines.push(
      `  <testsuite name="${this.escapeXML(suiteName)}" ` +
        `tests="${suiteTests}" ` +
        `failures="${suiteFailures}" ` +
        `errors="${suiteErrors}" ` +
        `skipped="${suiteSkipped}" ` +
        `time="${suiteTime}" ` +
        `timestamp="${this.formatTimestamp(timestamp)}" ` +
        `hostname="${this.escapeXML(this.config.hostname)}">`
    );

    // Add properties if enabled
    if (this.config.includeProperties) {
      lines.push(this.buildProperties(data));
    }

    // Add test cases
    for (const test of tests) {
      lines.push(this.buildTestCase(test));
    }

    // Add system-out if enabled
    if (this.config.includeSystemOut) {
      const systemOut = this.buildSystemOut(tests, data);
      if (systemOut) {
        lines.push(`    <system-out><![CDATA[${systemOut}]]></system-out>`);
      }
    }

    // Add system-err if enabled
    if (this.config.includeSystemErr) {
      const systemErr = this.buildSystemErr(tests);
      if (systemErr) {
        lines.push(`    <system-err><![CDATA[${systemErr}]]></system-err>`);
      }
    }

    // Close testsuite
    lines.push('  </testsuite>');

    return lines.join('\n');
  }

  /**
   * Build properties element
   * @param data - Test report data
   * @returns XML string for properties
   */
  buildProperties(data: TestReport): string {
    const lines: string[] = [];
    lines.push('    <properties>');

    // Add environment properties
    if (data.environment) {
      if (data.environment.baseUrl) {
        lines.push(
          `      <property name="baseUrl" value="${this.escapeXML(data.environment.baseUrl)}"/>`
        );
      }
      if (data.environment.environment) {
        lines.push(
          `      <property name="environment" value="${this.escapeXML(data.environment.environment)}"/>`
        );
      }
      lines.push(
        `      <property name="nodeVersion" value="${this.escapeXML(data.environment.nodeVersion)}"/>`
      );
      lines.push(
        `      <property name="osInfo" value="${this.escapeXML(data.environment.osInfo)}"/>`
      );

      // Add CI properties
      if (data.environment.ci) {
        const ci = data.environment.ci;
        if (ci.provider) {
          lines.push(`      <property name="ci.provider" value="${this.escapeXML(ci.provider)}"/>`);
        }
        if (ci.buildNumber) {
          lines.push(
            `      <property name="ci.buildNumber" value="${this.escapeXML(ci.buildNumber)}"/>`
          );
        }
        if (ci.branch) {
          lines.push(`      <property name="ci.branch" value="${this.escapeXML(ci.branch)}"/>`);
        }
        if (ci.commit) {
          lines.push(`      <property name="ci.commit" value="${this.escapeXML(ci.commit)}"/>`);
        }
      }
    }

    // Add custom properties
    for (const [key, value] of Object.entries(this.config.properties)) {
      lines.push(
        `      <property name="${this.escapeXML(key)}" value="${this.escapeXML(value)}"/>`
      );
    }

    lines.push('    </properties>');
    return lines.join('\n');
  }

  /**
   * Build a test case element
   * @param test - Test report entry
   * @returns XML string for test case
   */
  buildTestCase(test: TestReportEntry): string {
    const lines: string[] = [];

    const time = this.millisecondsToSeconds(test.duration);
    const classname = this.escapeXML(test.suite);
    const name = this.escapeXML(test.name);

    // Open testcase element
    lines.push(`    <testcase name="${name}" classname="${classname}" time="${time}">`);

    // Add failure/error element if test failed
    if (test.status === 'failed' && test.error) {
      lines.push(this.buildFailureElement(test));
    } else if (test.status === 'error' && test.error) {
      lines.push(this.buildErrorElement(test));
    } else if (test.status === 'skipped') {
      lines.push('      <skipped/>');
    }

    // Add system-out for individual test if available
    if (this.config.includeSystemOut && test.request) {
      const testOutput = this.buildTestSystemOut(test);
      if (testOutput) {
        lines.push(`      <system-out><![CDATA[${testOutput}]]></system-out>`);
      }
    }

    // Close testcase
    lines.push('    </testcase>');

    return lines.join('\n');
  }

  /**
   * Build failure element for failed test
   * @param test - Failed test entry
   * @returns XML string for failure
   */
  buildFailureElement(test: TestReportEntry): string {
    const error = test.error!;
    const message = this.escapeXML(error.message);
    const type = this.escapeXML(error.type || 'AssertionError');

    const lines: string[] = [];
    lines.push(`      <failure message="${message}" type="${type}">`);

    // Build failure content
    const content: string[] = [];

    if (error.expected !== undefined && error.actual !== undefined) {
      content.push(`Expected: ${JSON.stringify(error.expected)}`);
      content.push(`Actual: ${JSON.stringify(error.actual)}`);
    }

    if (error.message) {
      content.push(`Message: ${error.message}`);
    }

    if (error.stack) {
      content.push('');
      content.push('Stack Trace:');
      content.push(error.stack);
    }

    lines.push(content.join('\n'));
    lines.push('      </failure>');

    return lines.join('\n');
  }

  /**
   * Build error element for errored test
   * @param test - Errored test entry
   * @returns XML string for error
   */
  buildErrorElement(test: TestReportEntry): string {
    const error = test.error!;
    const message = this.escapeXML(error.message);
    const type = this.escapeXML(error.type || 'Error');

    const lines: string[] = [];
    lines.push(`      <error message="${message}" type="${type}">`);

    // Build error content
    const content: string[] = [];
    content.push(error.message);

    if (error.stack) {
      content.push('');
      content.push(error.stack);
    }

    lines.push(content.join('\n'));
    lines.push('      </error>');

    return lines.join('\n');
  }

  /**
   * Build system-out content for test suite
   * @param tests - Tests in suite
   * @param data - Test report data
   * @returns System output string
   */
  buildSystemOut(_tests: TestReportEntry[], data: TestReport): string {
    const lines: string[] = [];

    // Add report summary
    lines.push('Test Execution Summary');
    lines.push('======================');
    lines.push(`Total Tests: ${data.summary.total}`);
    lines.push(`Passed: ${data.summary.passed}`);
    lines.push(`Failed: ${data.summary.failed}`);
    lines.push(`Skipped: ${data.summary.skipped}`);
    lines.push(`Success Rate: ${data.summary.successRate.toFixed(2)}%`);
    lines.push(`Duration: ${data.summary.duration}ms`);

    if (data.selfHealing && data.selfHealing.totalAttempts > 0) {
      lines.push('');
      lines.push('Self-Healing Statistics');
      lines.push('=======================');
      lines.push(`Total Attempts: ${data.selfHealing.totalAttempts}`);
      lines.push(`Successful: ${data.selfHealing.successful}`);
      lines.push(`Failed: ${data.selfHealing.failed}`);
      lines.push(`Success Rate: ${data.selfHealing.successRate.toFixed(2)}%`);
    }

    return lines.join('\n');
  }

  /**
   * Build system-out for individual test
   * @param test - Test entry
   * @returns Test output string
   */
  buildTestSystemOut(test: TestReportEntry): string {
    const lines: string[] = [];

    if (test.request) {
      lines.push(`Request: ${test.request.method} ${test.request.url}`);

      if (test.request.query && Object.keys(test.request.query).length > 0) {
        lines.push(`Query: ${JSON.stringify(test.request.query)}`);
      }

      if (test.request.body) {
        lines.push(`Body: ${JSON.stringify(test.request.body)}`);
      }
    }

    if (test.response) {
      lines.push(`Response Status: ${test.response.status}`);

      if (test.response.responseTime) {
        lines.push(`Response Time: ${test.response.responseTime}ms`);
      }

      if (test.response.body) {
        lines.push(`Response Body: ${JSON.stringify(test.response.body)}`);
      }
    }

    if (test.selfHealed) {
      lines.push('Note: This test was self-healed');
    }

    if (test.retries && test.retries > 0) {
      lines.push(`Retries: ${test.retries}`);
    }

    return lines.join('\n');
  }

  /**
   * Build system-err content for test suite
   * @param tests - Tests in suite (unused if no failures)
   * @returns System error string
   */
  buildSystemErr(tests: TestReportEntry[]): string {
    const failedTests = tests.filter((t) => t.status === 'failed' || t.status === 'error');

    if (failedTests.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('Failed Tests');
    lines.push('============');

    for (const test of failedTests) {
      lines.push('');
      lines.push(`Test: ${test.name}`);

      if (test.error) {
        lines.push(`Error: ${test.error.message}`);

        if (test.error.stack) {
          lines.push(test.error.stack);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Escape XML special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  escapeXML(text: string): string {
    if (typeof text !== 'string') {
      text = String(text);
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Convert milliseconds to seconds
   * @param ms - Milliseconds
   * @returns Seconds with 3 decimal places
   */
  private millisecondsToSeconds(ms: number): string {
    return (ms / 1000).toFixed(3);
  }

  /**
   * Format timestamp for JUnit
   * @param date - Date to format
   * @returns ISO 8601 formatted string
   */
  private formatTimestamp(date: Date): string {
    return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
  }

  /**
   * Validate XML format
   * @param xml - XML string to validate
   * @returns Whether XML is valid
   */
  validateXML(xml: string): boolean {
    try {
      // Basic XML validation
      // Check for XML declaration
      if (!xml.startsWith('<?xml')) {
        console.error('XML validation failed: Missing XML declaration');
        return false;
      }

      // Check for balanced tags (basic check)
      const openTags = xml.match(/<[^/][^>]*>/g) || [];
      const closeTags = xml.match(/<\/[^>]*>/g) || [];

      // Self-closing tags don't need close tags
      const selfClosingTags = xml.match(/<[^/][^>]*\/>/g) || [];

      // Rough validation (not perfect but catches major issues)
      const expectedCloseTags = openTags.length - selfClosingTags.length;
      if (closeTags.length !== expectedCloseTags) {
        console.error('XML validation failed: Unbalanced tags');
        return false;
      }

      // Check for required JUnit elements
      if (!xml.includes('<testsuites') || !xml.includes('</testsuites>')) {
        console.error('XML validation failed: Missing testsuites element');
        return false;
      }

      return true;
    } catch (error) {
      console.error('XML validation error:', error);
      return false;
    }
  }

  /**
   * Validate report format (alias for validateXML)
   * @param content - XML string to validate
   * @returns Whether XML is valid
   */
  validate(content: string): boolean {
    return this.validateXML(content);
  }

  /**
   * Save report to file
   * @param xml - XML string to save
   * @param filepath - Output file path
   */
  async saveToFile(xml: string, filepath?: string): Promise<void> {
    const outputPath = filepath || this.config.outputPath;

    try {
      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Save XML file
      await fs.writeFile(outputPath, xml, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save JUnit XML report to ${outputPath}: ${error}`);
    }
  }

  /**
   * Generate and save report in one operation
   * @param data - Test report data
   * @param filepath - Optional output file path
   * @returns Path to saved file
   */
  async generateAndSave(data: TestReport, filepath?: string): Promise<string> {
    const xml = await this.generateReport(data);
    await this.saveToFile(xml, filepath);
    return filepath || this.config.outputPath;
  }

  /**
   * Get configuration
   * @returns Reporter configuration
   */
  getConfig(): Required<JUnitReporterConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<JUnitReporterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

/**
 * Create a JUnit reporter instance
 * @param config - Reporter configuration
 * @returns JUnitReporter instance
 */
export function createJUnitReporter(config?: JUnitReporterConfig): JUnitReporter {
  return new JUnitReporter(config);
}

export default JUnitReporter;
