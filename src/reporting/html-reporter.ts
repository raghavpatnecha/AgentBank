/**
 * HTML Reporter - Feature 6, Task 6.2
 * Generates professional, interactive HTML reports with charts and detailed test information
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  TestResult,
  TestStatus,
  ExecutionSummary,
  TestError,
} from '../types/executor-types';
import {
  HealingAttempt,
  HealingMetricsSummary,
} from '../types/self-healing-types';

/**
 * HTML Reporter Configuration
 */
export interface HTMLReporterConfig {
  /** Output directory for HTML reports */
  outputDir: string;

  /** Report title */
  title?: string;

  /** Include charts in report */
  includeCharts?: boolean;

  /** Include detailed test information */
  includeDetails?: boolean;

  /** Include failed tests section */
  includeFailedTests?: boolean;

  /** Include healed tests section */
  includeHealedTests?: boolean;

  /** Include performance metrics */
  includePerformance?: boolean;

  /** Include environment information */
  includeEnvironment?: boolean;

  /** Enable dark mode */
  darkMode?: boolean;

  /** Custom CSS to inject */
  customCSS?: string;

  /** Logo URL */
  logoUrl?: string;

  /** Report metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Test Report Data
 */
export interface TestReport {
  /** Execution summary */
  summary: ExecutionSummary;

  /** All test results */
  tests: TestResult[];

  /** Failed tests */
  failedTests: TestResult[];

  /** Healed tests (self-healing info) */
  healedTests?: Array<{
    test: TestResult;
    attempt: HealingAttempt;
  }>;

  /** Healing metrics */
  healingMetrics?: HealingMetricsSummary;

  /** Performance metrics */
  performanceMetrics?: PerformanceMetrics;

  /** Environment information */
  environment?: EnvironmentInfo;

  /** Report timestamp */
  timestamp: Date;

  /** Report metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /** Total execution time in ms */
  totalDuration: number;

  /** Average test duration in ms */
  averageDuration: number;

  /** Slowest tests */
  slowestTests: Array<{
    name: string;
    duration: number;
  }>;

  /** Fastest tests */
  fastestTests: Array<{
    name: string;
    duration: number;
  }>;

  /** Tests per second */
  testsPerSecond: number;

  /** Memory usage (if available) */
  memoryUsage?: {
    peak: number;
    average: number;
  };

  /** CPU usage (if available) */
  cpuUsage?: {
    average: number;
  };
}

/**
 * Environment Information
 */
export interface EnvironmentInfo {
  /** Operating system */
  os: string;

  /** Node.js version */
  nodeVersion: string;

  /** Playwright version */
  playwrightVersion?: string;

  /** Browser versions */
  browsers?: Record<string, string>;

  /** CI environment */
  ci?: {
    name: string;
    buildNumber?: string;
    branch?: string;
    commit?: string;
  };

  /** Custom environment variables */
  custom?: Record<string, string>;
}

/**
 * Chart Data for Chart.js
 */
interface ChartData {
  passFailPieChart: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  durationBarChart: {
    labels: string[];
    data: number[];
  };
  timelineChart?: {
    labels: string[];
    data: number[];
  };
}

/**
 * HTML Reporter Class
 */
export class HTMLReporter {
  private config: Required<HTMLReporterConfig>;

  constructor(config: HTMLReporterConfig) {
    this.config = {
      outputDir: config.outputDir,
      title: config.title || 'API Test Report',
      includeCharts: config.includeCharts !== false,
      includeDetails: config.includeDetails !== false,
      includeFailedTests: config.includeFailedTests !== false,
      includeHealedTests: config.includeHealedTests !== false,
      includePerformance: config.includePerformance !== false,
      includeEnvironment: config.includeEnvironment !== false,
      darkMode: config.darkMode || false,
      customCSS: config.customCSS || '',
      logoUrl: config.logoUrl || '',
      metadata: config.metadata || {},
    };
  }

  /**
   * Generate HTML report from test data
   */
  async generateReport(data: TestReport): Promise<string> {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Generate HTML content
      const html = this.generateHTML(data);

      // Generate filename with timestamp
      const filename = `test-report-${this.formatTimestamp(data.timestamp)}.html`;
      const filepath = path.join(this.config.outputDir, filename);

      // Save to file
      await this.saveToFile(html, filepath);

      return filepath;
    } catch (error) {
      throw new Error(
        `Failed to generate HTML report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate complete HTML document
   */
  generateHTML(data: TestReport): string {
    const styles = this.generateStyles();
    const chartScript = this.config.includeCharts ? this.generateChartScript(data) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(this.config.title)} - ${this.formatDate(data.timestamp)}</title>
  <style>${styles}</style>
  ${this.config.includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>' : ''}
</head>
<body${this.config.darkMode ? ' class="dark-mode"' : ''}>
  <div class="container">
    ${this.generateHeader(data)}
    ${this.generateSummarySection(data.summary)}
    ${this.config.includeCharts ? this.generateChartsSection(data) : ''}
    ${this.config.includeDetails ? this.generateTestResultsSection(data.tests) : ''}
    ${this.config.includeFailedTests && data.failedTests.length > 0 ? this.generateFailedTestsSection(data.failedTests) : ''}
    ${this.config.includeHealedTests && data.healedTests && data.healedTests.length > 0 ? this.generateHealedTestsSection(data.healedTests) : ''}
    ${this.config.includePerformance && data.performanceMetrics ? this.generatePerformanceSection(data.performanceMetrics) : ''}
    ${this.config.includeEnvironment && data.environment ? this.generateEnvironmentSection(data.environment) : ''}
    ${this.generateFooter(data)}
  </div>
  ${chartScript}
</body>
</html>`;
  }

  /**
   * Generate header section
   */
  private generateHeader(data: TestReport): string {
    const logo = this.config.logoUrl
      ? `<img src="${this.escapeHTML(this.config.logoUrl)}" alt="Logo" class="logo" />`
      : '';

    return `
    <header class="header">
      ${logo}
      <h1>${this.escapeHTML(this.config.title)}</h1>
      <div class="timestamp">Generated on ${this.formatDate(data.timestamp)}</div>
    </header>`;
  }

  /**
   * Generate summary dashboard section
   */
  generateSummarySection(summary: ExecutionSummary): string {
    const successRate = (summary.successRate * 100).toFixed(1);
    const duration = (summary.duration / 1000).toFixed(2);
    const avgDuration = summary.averageDuration.toFixed(0);

    return `
    <section class="summary-dashboard">
      <div class="summary-card total">
        <div class="card-header">Total Tests</div>
        <div class="card-value">${summary.totalTests}</div>
      </div>
      <div class="summary-card passed">
        <div class="card-header">Passed</div>
        <div class="card-value">${summary.passed}</div>
      </div>
      <div class="summary-card failed">
        <div class="card-header">Failed</div>
        <div class="card-value">${summary.failed}</div>
      </div>
      <div class="summary-card skipped">
        <div class="card-header">Skipped</div>
        <div class="card-value">${summary.skipped}</div>
      </div>
      <div class="summary-card success-rate">
        <div class="card-header">Success Rate</div>
        <div class="card-value">${successRate}%</div>
      </div>
      <div class="summary-card duration">
        <div class="card-header">Duration</div>
        <div class="card-value">${duration}s</div>
      </div>
      <div class="summary-card avg-duration">
        <div class="card-header">Avg Duration</div>
        <div class="card-value">${avgDuration}ms</div>
      </div>
      <div class="summary-card retries">
        <div class="card-header">Total Retries</div>
        <div class="card-value">${summary.totalRetries}</div>
      </div>
    </section>`;
  }

  /**
   * Generate charts section
   */
  generateChartsSection(_data: TestReport): string {
    return `
    <section class="charts-section">
      <h2>Test Statistics</h2>
      <div class="charts-container">
        <div class="chart-wrapper">
          <h3>Test Results Distribution</h3>
          <canvas id="passFailChart"></canvas>
        </div>
        <div class="chart-wrapper">
          <h3>Duration by Test Suite</h3>
          <canvas id="durationChart"></canvas>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate test results section
   */
  generateTestResultsSection(tests: TestResult[]): string {
    const testRows = tests
      .map((test, index) => this.generateTestRow(test, index))
      .join('');

    return `
    <section class="test-results-section">
      <h2>Test Results (${tests.length})</h2>
      <div class="filter-controls">
        <label>
          <input type="checkbox" id="filter-passed" checked onchange="filterTests()"> Passed
        </label>
        <label>
          <input type="checkbox" id="filter-failed" checked onchange="filterTests()"> Failed
        </label>
        <label>
          <input type="checkbox" id="filter-skipped" checked onchange="filterTests()"> Skipped
        </label>
        <input type="text" id="search-tests" placeholder="Search tests..." oninput="searchTests()">
      </div>
      <div class="table-container">
        <table class="test-results-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Test Name</th>
              <th>File</th>
              <th>Duration</th>
              <th>Retries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${testRows}
          </tbody>
        </table>
      </div>
    </section>
    <script>
      function toggleDetails(index) {
        const details = document.getElementById('details-' + index);
        if (details) {
          details.style.display = details.style.display === 'none' ? 'table-row' : 'none';
        }
      }

      function filterTests() {
        const showPassed = document.getElementById('filter-passed').checked;
        const showFailed = document.getElementById('filter-failed').checked;
        const showSkipped = document.getElementById('filter-skipped').checked;
        const rows = document.querySelectorAll('.test-row');

        rows.forEach(row => {
          const status = row.dataset.status;
          const show = (status === 'passed' && showPassed) ||
                      (status === 'failed' && showFailed) ||
                      (status === 'skipped' && showSkipped) ||
                      (status === 'timeout' && showFailed) ||
                      (status === 'error' && showFailed);
          row.style.display = show ? '' : 'none';
          const detailsId = row.id.replace('row-', 'details-');
          const details = document.getElementById(detailsId);
          if (details) details.style.display = 'none';
        });
      }

      function searchTests() {
        const search = document.getElementById('search-tests').value.toLowerCase();
        const rows = document.querySelectorAll('.test-row');

        rows.forEach(row => {
          const testName = row.querySelector('.test-name').textContent.toLowerCase();
          const filePath = row.querySelector('.test-file').textContent.toLowerCase();
          const match = testName.includes(search) || filePath.includes(search);
          if (!match) {
            row.style.display = 'none';
            const detailsId = row.id.replace('row-', 'details-');
            const details = document.getElementById(detailsId);
            if (details) details.style.display = 'none';
          } else {
            filterTests(); // Re-apply filters
          }
        });
      }
    </script>`;
  }

  /**
   * Generate a single test row
   */
  private generateTestRow(test: TestResult, index: number): string {
    const statusClass = this.getStatusClass(test.status);
    const statusIcon = this.getStatusIcon(test.status);
    const duration = test.duration.toFixed(0);
    const fileName = path.basename(test.filePath);

    return `
    <tr class="test-row ${statusClass}" id="row-${index}" data-status="${test.status}">
      <td class="status-cell">
        <span class="status-badge ${statusClass}">${statusIcon} ${test.status}</span>
      </td>
      <td class="test-name">${this.escapeHTML(test.name)}</td>
      <td class="test-file">${this.escapeHTML(fileName)}</td>
      <td>${duration}ms</td>
      <td>${test.retries}</td>
      <td>
        <button class="btn-details" onclick="toggleDetails(${index})">Details</button>
      </td>
    </tr>
    <tr class="test-details" id="details-${index}" style="display: none;">
      <td colspan="6">
        ${this.formatTestDetails(test)}
      </td>
    </tr>`;
  }

  /**
   * Format detailed test information
   */
  formatTestDetails(test: TestResult): string {
    const startTime = this.formatDate(test.startTime);
    const endTime = this.formatDate(test.endTime);

    let errorSection = '';
    if (test.error) {
      errorSection = `
        <div class="detail-section">
          <h4>Error Information</h4>
          <div class="error-message">${this.escapeHTML(test.error.message)}</div>
          ${test.error.stack ? `<pre class="stack-trace">${this.escapeHTML(test.error.stack)}</pre>` : ''}
          ${test.error.comparison ? this.formatComparison(test.error.comparison) : ''}
        </div>`;
    }

    let metadataSection = '';
    if (test.metadata && Object.keys(test.metadata).length > 0) {
      metadataSection = `
        <div class="detail-section">
          <h4>Metadata</h4>
          <pre class="metadata">${this.escapeHTML(JSON.stringify(test.metadata, null, 2))}</pre>
        </div>`;
    }

    return `
      <div class="test-details-content">
        <div class="detail-section">
          <h4>Test Information</h4>
          <table class="info-table">
            <tr><td><strong>ID:</strong></td><td>${this.escapeHTML(test.id)}</td></tr>
            <tr><td><strong>File:</strong></td><td>${this.escapeHTML(test.filePath)}</td></tr>
            <tr><td><strong>Start Time:</strong></td><td>${startTime}</td></tr>
            <tr><td><strong>End Time:</strong></td><td>${endTime}</td></tr>
            <tr><td><strong>Duration:</strong></td><td>${test.duration}ms</td></tr>
            <tr><td><strong>Retries:</strong></td><td>${test.retries}</td></tr>
            ${test.tags ? `<tr><td><strong>Tags:</strong></td><td>${test.tags.join(', ')}</td></tr>` : ''}
          </table>
        </div>
        ${errorSection}
        ${metadataSection}
      </div>`;
  }

  /**
   * Format comparison data (expected vs actual)
   */
  private formatComparison(comparison: { expected: unknown; actual: unknown }): string {
    return `
      <div class="comparison">
        <div class="comparison-column">
          <h5>Expected</h5>
          <pre class="expected">${this.escapeHTML(JSON.stringify(comparison.expected, null, 2))}</pre>
        </div>
        <div class="comparison-column">
          <h5>Actual</h5>
          <pre class="actual">${this.escapeHTML(JSON.stringify(comparison.actual, null, 2))}</pre>
        </div>
      </div>`;
  }

  /**
   * Generate failed tests section
   */
  generateFailedTestsSection(tests: TestResult[]): string {
    const failedTestsHtml = tests
      .map((test) => this.formatFailedTest(test))
      .join('');

    return `
    <section class="failed-tests-section">
      <h2>Failed Tests (${tests.length})</h2>
      <div class="failed-tests-container">
        ${failedTestsHtml}
      </div>
    </section>`;
  }

  /**
   * Format a failed test
   */
  private formatFailedTest(test: TestResult): string {
    return `
    <div class="failed-test-card">
      <div class="failed-test-header">
        <h3>${this.escapeHTML(test.name)}</h3>
        <span class="status-badge failed">${this.getStatusIcon(test.status)} ${test.status}</span>
      </div>
      <div class="failed-test-body">
        <div class="test-file">File: ${this.escapeHTML(test.filePath)}</div>
        ${test.error ? this.formatRequest(test.error) : ''}
      </div>
    </div>`;
  }

  /**
   * Format request/error information
   */
  formatRequest(error: TestError): string {
    return `
    <div class="request-section">
      <h4>Error Details</h4>
      <div class="error-type">Type: ${error.type}</div>
      <div class="error-message">${this.escapeHTML(error.message)}</div>
      ${error.stack ? `<pre class="stack-trace">${this.escapeHTML(error.stack)}</pre>` : ''}
      ${error.comparison ? this.formatComparison(error.comparison) : ''}
      ${error.location ? `<div class="error-location">Location: ${error.location.file}:${error.location.line}:${error.location.column}</div>` : ''}
    </div>`;
  }

  /**
   * Format response information (placeholder for future use)
   */
  formatResponse(response: any): string {
    return `
    <div class="response-section">
      <h4>Response</h4>
      <pre class="response-data">${this.escapeHTML(JSON.stringify(response, null, 2))}</pre>
    </div>`;
  }

  /**
   * Generate healed tests section
   */
  generateHealedTestsSection(healedTests: Array<{ test: TestResult; attempt: HealingAttempt }>): string {
    const healedTestsHtml = healedTests
      .map((item) => this.formatHealedTest(item))
      .join('');

    return `
    <section class="healed-tests-section">
      <h2>Self-Healed Tests (${healedTests.length}) <span class="badge-healed">🤖 Auto-Fixed</span></h2>
      <div class="healed-tests-container">
        ${healedTestsHtml}
      </div>
    </section>`;
  }

  /**
   * Format a healed test
   */
  private formatHealedTest(item: { test: TestResult; attempt: HealingAttempt }): string {
    const { test, attempt } = item;
    const duration = attempt.duration ? `${attempt.duration}ms` : 'N/A';
    const cost = attempt.estimatedCost ? `$${attempt.estimatedCost.toFixed(4)}` : 'N/A';

    return `
    <div class="healed-test-card">
      <div class="healed-test-header">
        <h3>${this.escapeHTML(test.name)} <span class="badge-healed">🤖 Auto-Fixed</span></h3>
        <span class="status-badge passed">${this.getStatusIcon(TestStatus.PASSED)} healed</span>
      </div>
      <div class="healed-test-body">
        <div class="healing-info">
          <div class="info-row">
            <span class="label">Strategy:</span>
            <span class="value">${attempt.strategy}</span>
          </div>
          <div class="info-row">
            <span class="label">Duration:</span>
            <span class="value">${duration}</span>
          </div>
          <div class="info-row">
            <span class="label">Cost:</span>
            <span class="value">${cost}</span>
          </div>
          ${attempt.tokensUsed ? `
          <div class="info-row">
            <span class="label">Tokens Used:</span>
            <span class="value">${attempt.tokensUsed}</span>
          </div>` : ''}
          ${attempt.cacheHit ? `<div class="cache-badge">✓ Cache Hit</div>` : ''}
        </div>
        ${attempt.generatedFix ? `
        <div class="generated-fix">
          <h4>Generated Fix</h4>
          <pre class="code-block">${this.escapeHTML(attempt.generatedFix)}</pre>
        </div>` : ''}
      </div>
    </div>`;
  }

  /**
   * Generate performance section
   */
  generatePerformanceSection(metrics: PerformanceMetrics): string {
    const totalDuration = (metrics.totalDuration / 1000).toFixed(2);
    const avgDuration = metrics.averageDuration.toFixed(0);

    const slowestTests = metrics.slowestTests
      .map((test) => `
        <tr>
          <td>${this.escapeHTML(test.name)}</td>
          <td>${test.duration.toFixed(0)}ms</td>
        </tr>
      `)
      .join('');

    const fastestTests = metrics.fastestTests
      .map((test) => `
        <tr>
          <td>${this.escapeHTML(test.name)}</td>
          <td>${test.duration.toFixed(0)}ms</td>
        </tr>
      `)
      .join('');

    return `
    <section class="performance-section">
      <h2>Performance Metrics</h2>
      <div class="performance-cards">
        <div class="perf-card">
          <div class="perf-label">Total Duration</div>
          <div class="perf-value">${totalDuration}s</div>
        </div>
        <div class="perf-card">
          <div class="perf-label">Average Duration</div>
          <div class="perf-value">${avgDuration}ms</div>
        </div>
        <div class="perf-card">
          <div class="perf-label">Tests/Second</div>
          <div class="perf-value">${metrics.testsPerSecond.toFixed(2)}</div>
        </div>
        ${metrics.memoryUsage ? `
        <div class="perf-card">
          <div class="perf-label">Peak Memory</div>
          <div class="perf-value">${this.formatBytes(metrics.memoryUsage.peak)}</div>
        </div>` : ''}
      </div>
      <div class="performance-tables">
        <div class="perf-table-wrapper">
          <h3>Slowest Tests</h3>
          <table class="perf-table">
            <thead>
              <tr><th>Test Name</th><th>Duration</th></tr>
            </thead>
            <tbody>${slowestTests}</tbody>
          </table>
        </div>
        <div class="perf-table-wrapper">
          <h3>Fastest Tests</h3>
          <table class="perf-table">
            <thead>
              <tr><th>Test Name</th><th>Duration</th></tr>
            </thead>
            <tbody>${fastestTests}</tbody>
          </table>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate environment section
   */
  generateEnvironmentSection(env: EnvironmentInfo): string {
    let ciSection = '';
    if (env.ci) {
      ciSection = `
        <div class="env-section">
          <h3>CI/CD Environment</h3>
          <table class="env-table">
            <tr><td><strong>CI Name:</strong></td><td>${this.escapeHTML(env.ci.name)}</td></tr>
            ${env.ci.buildNumber ? `<tr><td><strong>Build:</strong></td><td>${this.escapeHTML(env.ci.buildNumber)}</td></tr>` : ''}
            ${env.ci.branch ? `<tr><td><strong>Branch:</strong></td><td>${this.escapeHTML(env.ci.branch)}</td></tr>` : ''}
            ${env.ci.commit ? `<tr><td><strong>Commit:</strong></td><td>${this.escapeHTML(env.ci.commit)}</td></tr>` : ''}
          </table>
        </div>`;
    }

    let browsersSection = '';
    if (env.browsers && Object.keys(env.browsers).length > 0) {
      const browserRows = Object.entries(env.browsers)
        .map(([name, version]) => `<tr><td>${this.escapeHTML(name)}</td><td>${this.escapeHTML(version)}</td></tr>`)
        .join('');
      browsersSection = `
        <div class="env-section">
          <h3>Browsers</h3>
          <table class="env-table">
            ${browserRows}
          </table>
        </div>`;
    }

    return `
    <section class="environment-section">
      <h2>Environment Information</h2>
      <div class="env-grid">
        <div class="env-section">
          <h3>System</h3>
          <table class="env-table">
            <tr><td><strong>OS:</strong></td><td>${this.escapeHTML(env.os)}</td></tr>
            <tr><td><strong>Node.js:</strong></td><td>${this.escapeHTML(env.nodeVersion)}</td></tr>
            ${env.playwrightVersion ? `<tr><td><strong>Playwright:</strong></td><td>${this.escapeHTML(env.playwrightVersion)}</td></tr>` : ''}
          </table>
        </div>
        ${ciSection}
        ${browsersSection}
      </div>
    </section>`;
  }

  /**
   * Generate footer
   */
  private generateFooter(data: TestReport): string {
    return `
    <footer class="footer">
      <p>Generated by API Test Reporter</p>
      <p>Report ID: ${data.timestamp.getTime()}</p>
    </footer>`;
  }

  /**
   * Generate Chart.js initialization script
   */
  private generateChartScript(data: TestReport): string {
    const chartData = this.prepareChartData(data);

    return `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Pass/Fail Pie Chart
        const passFailCtx = document.getElementById('passFailChart');
        if (passFailCtx) {
          new Chart(passFailCtx, {
            type: 'pie',
            data: {
              labels: ${JSON.stringify(chartData.passFailPieChart.labels)},
              datasets: [{
                data: ${JSON.stringify(chartData.passFailPieChart.data)},
                backgroundColor: ${JSON.stringify(chartData.passFailPieChart.colors)},
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return label + ': ' + value + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }
          });
        }

        // Duration Bar Chart
        const durationCtx = document.getElementById('durationChart');
        if (durationCtx) {
          new Chart(durationCtx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(chartData.durationBarChart.labels)},
              datasets: [{
                label: 'Duration (ms)',
                data: ${JSON.stringify(chartData.durationBarChart.data)},
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Duration (ms)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Test File'
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
        }
      });
    </script>`;
  }

  /**
   * Prepare data for charts
   */
  private prepareChartData(data: TestReport): ChartData {
    const { summary } = data;

    return {
      passFailPieChart: {
        labels: ['Passed', 'Failed', 'Skipped', 'Timeout', 'Error'],
        data: [
          summary.passed,
          summary.failed,
          summary.skipped,
          summary.timeout,
          summary.error,
        ],
        colors: ['#28a745', '#dc3545', '#6c757d', '#ffc107', '#fd7e14'],
      },
      durationBarChart: {
        labels: Object.keys(summary.byFile),
        data: Object.values(summary.byFile).map((file) => file.duration),
      },
    };
  }

  /**
   * Generate CSS styles
   */
  private generateStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
        padding: 20px;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        padding: 30px;
        text-align: center;
      }

      .header h1 {
        font-size: 2.5em;
        margin-bottom: 10px;
      }

      .timestamp {
        font-size: 1em;
        opacity: 0.9;
      }

      .logo {
        max-height: 60px;
        margin-bottom: 15px;
      }

      .summary-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 30px;
        background: #fafafa;
      }

      .summary-card {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        text-align: center;
        transition: transform 0.2s;
      }

      .summary-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }

      .card-header {
        font-size: 0.9em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }

      .card-value {
        font-size: 2.5em;
        font-weight: bold;
        color: #333;
      }

      .summary-card.passed .card-value { color: #28a745; }
      .summary-card.failed .card-value { color: #dc3545; }
      .summary-card.skipped .card-value { color: #6c757d; }
      .summary-card.success-rate .card-value { color: #007bff; }
      .summary-card.duration .card-value { color: #17a2b8; }

      .charts-section {
        padding: 30px;
      }

      .charts-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #333;
      }

      .charts-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 30px;
      }

      .chart-wrapper {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .chart-wrapper h3 {
        font-size: 1.3em;
        margin-bottom: 15px;
        color: #555;
      }

      .test-results-section {
        padding: 30px;
        background: #fafafa;
      }

      .test-results-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #333;
      }

      .filter-controls {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        padding: 15px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        flex-wrap: wrap;
      }

      .filter-controls label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.95em;
      }

      #search-tests {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.95em;
        flex: 1;
        min-width: 200px;
      }

      .table-container {
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .test-results-table {
        width: 100%;
        border-collapse: collapse;
      }

      .test-results-table th {
        background: #667eea;
        color: #fff;
        padding: 15px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85em;
        letter-spacing: 1px;
      }

      .test-results-table td {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
      }

      .test-row:hover {
        background: #f8f9fa;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85em;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.passed {
        background: #d4edda;
        color: #155724;
      }

      .status-badge.failed {
        background: #f8d7da;
        color: #721c24;
      }

      .status-badge.skipped {
        background: #e2e3e5;
        color: #383d41;
      }

      .status-badge.timeout,
      .status-badge.error {
        background: #fff3cd;
        color: #856404;
      }

      .btn-details {
        padding: 6px 12px;
        background: #667eea;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
        transition: background 0.2s;
      }

      .btn-details:hover {
        background: #5568d3;
      }

      .test-details {
        background: #f8f9fa;
      }

      .test-details-content {
        padding: 20px;
      }

      .detail-section {
        margin-bottom: 20px;
      }

      .detail-section h4 {
        font-size: 1.1em;
        margin-bottom: 10px;
        color: #555;
      }

      .info-table {
        width: 100%;
        border-collapse: collapse;
      }

      .info-table td {
        padding: 5px 10px;
        border: none;
      }

      .error-message {
        padding: 15px;
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        border-radius: 4px;
        margin-bottom: 10px;
        font-family: monospace;
      }

      .stack-trace {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85em;
        line-height: 1.5;
        border: 1px solid #dee2e6;
      }

      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 10px;
      }

      .comparison-column h5 {
        margin-bottom: 10px;
        color: #555;
      }

      .expected,
      .actual {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85em;
        border: 1px solid #dee2e6;
      }

      .expected {
        border-left: 4px solid #28a745;
      }

      .actual {
        border-left: 4px solid #dc3545;
      }

      .metadata {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85em;
        border: 1px solid #dee2e6;
      }

      .failed-tests-section {
        padding: 30px;
      }

      .failed-tests-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #dc3545;
      }

      .failed-tests-container {
        display: grid;
        gap: 20px;
      }

      .failed-test-card {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #dc3545;
        overflow: hidden;
      }

      .failed-test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .failed-test-header h3 {
        font-size: 1.3em;
        color: #333;
      }

      .failed-test-body {
        padding: 20px;
      }

      .test-file {
        color: #666;
        font-size: 0.9em;
        margin-bottom: 15px;
      }

      .request-section {
        margin-top: 15px;
      }

      .request-section h4 {
        font-size: 1.1em;
        margin-bottom: 10px;
        color: #555;
      }

      .error-type {
        display: inline-block;
        padding: 4px 12px;
        background: #ffc107;
        color: #000;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .error-location {
        margin-top: 10px;
        padding: 10px;
        background: #e2e3e5;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
      }

      .healed-tests-section {
        padding: 30px;
        background: #f0f8ff;
      }

      .healed-tests-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #007bff;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .badge-healed {
        display: inline-block;
        padding: 4px 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-radius: 20px;
        font-size: 0.6em;
        font-weight: 600;
      }

      .healed-tests-container {
        display: grid;
        gap: 20px;
      }

      .healed-test-card {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #007bff;
        overflow: hidden;
      }

      .healed-test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .healed-test-header h3 {
        font-size: 1.3em;
        color: #333;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .healed-test-body {
        padding: 20px;
      }

      .healing-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #dee2e6;
      }

      .info-row:last-child {
        border-bottom: none;
      }

      .info-row .label {
        font-weight: 600;
        color: #555;
      }

      .info-row .value {
        color: #333;
      }

      .cache-badge {
        display: inline-block;
        padding: 4px 12px;
        background: #28a745;
        color: #fff;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: 600;
        margin-top: 10px;
      }

      .generated-fix {
        margin-top: 15px;
      }

      .generated-fix h4 {
        font-size: 1.1em;
        margin-bottom: 10px;
        color: #555;
      }

      .code-block {
        background: #282c34;
        color: #abb2bf;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85em;
        line-height: 1.5;
      }

      .performance-section {
        padding: 30px;
        background: #fafafa;
      }

      .performance-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #333;
      }

      .performance-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .perf-card {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .perf-label {
        font-size: 0.9em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }

      .perf-value {
        font-size: 2em;
        font-weight: bold;
        color: #17a2b8;
      }

      .performance-tables {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
      }

      .perf-table-wrapper {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .perf-table-wrapper h3 {
        font-size: 1.3em;
        margin-bottom: 15px;
        color: #555;
      }

      .perf-table {
        width: 100%;
        border-collapse: collapse;
      }

      .perf-table th {
        background: #f8f9fa;
        padding: 10px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
      }

      .perf-table td {
        padding: 10px;
        border-bottom: 1px solid #dee2e6;
      }

      .environment-section {
        padding: 30px;
      }

      .environment-section h2 {
        font-size: 2em;
        margin-bottom: 20px;
        color: #333;
      }

      .env-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .env-section {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .env-section h3 {
        font-size: 1.3em;
        margin-bottom: 15px;
        color: #555;
        border-bottom: 2px solid #667eea;
        padding-bottom: 10px;
      }

      .env-table {
        width: 100%;
        border-collapse: collapse;
      }

      .env-table td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }

      .env-table td:last-child {
        border-bottom: none;
      }

      .footer {
        background: #333;
        color: #fff;
        padding: 20px;
        text-align: center;
      }

      .footer p {
        margin: 5px 0;
        font-size: 0.9em;
      }

      @media print {
        body {
          background: #fff;
          padding: 0;
        }

        .container {
          box-shadow: none;
        }

        .btn-details {
          display: none;
        }

        .test-details {
          display: table-row !important;
        }

        .summary-card:hover {
          transform: none;
        }

        @page {
          margin: 2cm;
        }
      }

      @media (max-width: 768px) {
        .summary-dashboard {
          grid-template-columns: repeat(2, 1fr);
        }

        .charts-container {
          grid-template-columns: 1fr;
        }

        .comparison {
          grid-template-columns: 1fr;
        }

        .performance-tables {
          grid-template-columns: 1fr;
        }

        .env-grid {
          grid-template-columns: 1fr;
        }

        .header h1 {
          font-size: 1.8em;
        }

        .filter-controls {
          flex-direction: column;
        }

        #search-tests {
          min-width: 100%;
        }
      }

      ${this.config.customCSS}
    `;
  }

  /**
   * Save HTML content to file
   */
  async saveToFile(html: string, filepath: string): Promise<void> {
    try {
      await fs.writeFile(filepath, html, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to save HTML report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }

  /**
   * Get CSS class for test status
   */
  private getStatusClass(status: TestStatus): string {
    return status.toLowerCase();
  }

  /**
   * Get icon for test status
   */
  private getStatusIcon(status: TestStatus): string {
    const icons: Record<TestStatus, string> = {
      [TestStatus.PASSED]: '✓',
      [TestStatus.FAILED]: '✗',
      [TestStatus.SKIPPED]: '○',
      [TestStatus.TIMEOUT]: '⏱',
      [TestStatus.ERROR]: '⚠',
    };
    return icons[status] || '?';
  }

  /**
   * Format timestamp for filename
   */
  private formatTimestamp(date: Date): string {
    return date
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
