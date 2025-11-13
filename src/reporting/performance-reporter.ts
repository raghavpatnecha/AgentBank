/**
 * Performance Reporter
 * Generates performance test reports with charts, SLA compliance, and trend analysis
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  PerformanceReport,
  PerformanceMetrics,
  PerformanceSummary,
  LoadTestConfig,
  EndpointMetrics,
  BaselineComparison,
  MetricChange,
  ReportExportOptions,
  TimeSeriesData,
} from '../types/performance-types.js';

/**
 * Performance Reporter Configuration
 */
export interface PerformanceReporterConfig {
  /** Output directory */
  outputDir?: string;

  /** Include ASCII charts */
  includeCharts?: boolean;

  /** Baseline file for comparison */
  baselineFile?: string;

  /** Regression threshold (percentage) */
  regressionThreshold?: number;
}

/**
 * Performance Reporter
 * Generates comprehensive performance test reports
 */
export class PerformanceReporter {
  private config: Required<PerformanceReporterConfig>;

  constructor(config: PerformanceReporterConfig = {}) {
    this.config = {
      outputDir: config.outputDir || './reports/performance',
      includeCharts: config.includeCharts ?? true,
      baselineFile: config.baselineFile || '',
      regressionThreshold: config.regressionThreshold ?? 10, // 10% regression threshold
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(
    testConfig: LoadTestConfig,
    metrics: PerformanceMetrics
  ): Promise<PerformanceReport> {
    const summary = this.createSummary(metrics);
    const byEndpoint = this.groupMetricsByEndpoint(testConfig, metrics);
    const comparison = this.config.baselineFile
      ? await this.compareWithBaseline(metrics)
      : undefined;

    const report: PerformanceReport = {
      version: '1.0.0',
      config: testConfig,
      summary,
      metrics,
      byEndpoint,
      comparison,
      generatedAt: new Date(),
      duration: Date.now(),
    };

    return report;
  }

  /**
   * Create performance summary
   */
  private createSummary(metrics: PerformanceMetrics): PerformanceSummary {
    const now = new Date();
    const duration = metrics.timeSeries && metrics.timeSeries.length > 0
      ? ((metrics.timeSeries[metrics.timeSeries.length - 1]?.timestamp ?? 0) -
          (metrics.timeSeries[0]?.timestamp ?? 0)) /
        1000
      : 0;

    const successRate = metrics.totalRequests > 0
      ? metrics.successfulRequests / metrics.totalRequests
      : 0;

    const failedAssertions = metrics.assertions.filter((a) => !a.passed).length;
    const slaCompliance = failedAssertions === 0;

    return {
      startTime: new Date(now.getTime() - duration * 1000),
      endTime: now,
      duration,
      totalRequests: metrics.totalRequests,
      successRate,
      avgThroughput: metrics.throughput,
      avgResponseTime: metrics.responseTime.mean,
      slaCompliance,
      failedAssertions,
    };
  }

  /**
   * Group metrics by endpoint
   */
  private groupMetricsByEndpoint(
    config: LoadTestConfig,
    metrics: PerformanceMetrics
  ): Map<string, EndpointMetrics> {
    const endpointMap = new Map<string, EndpointMetrics>();

    // Group by test endpoints
    for (const test of config.tests) {
      const key = `${test.method} ${test.endpoint}`;

      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          endpoint: test.endpoint,
          method: test.method,
          requestCount: 0,
          successCount: 0,
          responseTime: {
            min: 0,
            max: 0,
            mean: 0,
            median: 0,
            p90: 0,
            p95: 0,
            p99: 0,
            stdDev: 0,
          },
          throughput: 0,
          errorRate: 0,
        });
      }
    }

    // For this implementation, we'll use aggregate metrics
    // In a real implementation, you'd track per-endpoint metrics
    for (const endpointMetric of endpointMap.values()) {
      endpointMetric.requestCount = metrics.totalRequests;
      endpointMetric.successCount = metrics.successfulRequests;
      endpointMetric.responseTime = metrics.responseTime;
      endpointMetric.throughput = metrics.throughput;
      endpointMetric.errorRate = metrics.errorRate;
    }

    return endpointMap;
  }

  /**
   * Compare with baseline
   */
  private async compareWithBaseline(
    metrics: PerformanceMetrics
  ): Promise<BaselineComparison | undefined> {
    if (!this.config.baselineFile) {
      return undefined;
    }

    try {
      const baselineContent = await fs.readFile(this.config.baselineFile, 'utf-8');
      const baseline: PerformanceReport = JSON.parse(baselineContent);

      const changes: MetricChange[] = [];

      // Compare response times
      changes.push(
        this.compareMetric(
          'Response Time (mean)',
          baseline.metrics.responseTime.mean,
          metrics.responseTime.mean,
          false // Lower is better
        )
      );

      changes.push(
        this.compareMetric(
          'Response Time (p95)',
          baseline.metrics.responseTime.p95,
          metrics.responseTime.p95,
          false
        )
      );

      // Compare throughput
      changes.push(
        this.compareMetric(
          'Throughput (RPS)',
          baseline.metrics.throughput,
          metrics.throughput,
          true // Higher is better
        )
      );

      // Compare error rate
      changes.push(
        this.compareMetric(
          'Error Rate',
          baseline.metrics.errorRate,
          metrics.errorRate,
          false
        )
      );

      const hasRegression = changes.some(
        (c) => c.direction === 'regressed' && c.significant
      );
      const hasImprovement = changes.some(
        (c) => c.direction === 'improved' && c.significant
      );

      return {
        baselineFile: this.config.baselineFile,
        baselineDate: new Date(baseline.generatedAt),
        changes,
        hasRegression,
        hasImprovement,
      };
    } catch (error) {
      console.warn(`Failed to load baseline: ${error}`);
      return undefined;
    }
  }

  /**
   * Compare a metric with baseline
   */
  private compareMetric(
    metric: string,
    baselineValue: number,
    currentValue: number,
    higherIsBetter: boolean
  ): MetricChange {
    const percentChange = baselineValue > 0
      ? ((currentValue - baselineValue) / baselineValue) * 100
      : 0;

    const absChange = Math.abs(percentChange);
    const significant = absChange >= this.config.regressionThreshold;

    let direction: 'improved' | 'regressed' | 'stable';
    if (!significant) {
      direction = 'stable';
    } else if (higherIsBetter) {
      direction = percentChange > 0 ? 'improved' : 'regressed';
    } else {
      direction = percentChange < 0 ? 'improved' : 'regressed';
    }

    return {
      metric,
      baselineValue,
      currentValue,
      percentChange,
      direction,
      significant,
    };
  }

  /**
   * Export report to file
   */
  async exportReport(
    report: PerformanceReport,
    options: ReportExportOptions
  ): Promise<void> {
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });

    switch (options.format) {
      case 'json':
        await this.exportJSON(report, options.outputPath);
        break;
      case 'html':
        await this.exportHTML(report, options);
        break;
      case 'csv':
        await this.exportCSV(report, options.outputPath);
        break;
      case 'jmeter':
        await this.exportJMeterXML(report, options.outputPath);
        break;
      case 'markdown':
        await this.exportMarkdown(report, options.outputPath);
        break;
    }

    console.log(`✓ Report exported to: ${options.outputPath}`);
  }

  /**
   * Export as JSON
   */
  private async exportJSON(report: PerformanceReport, outputPath: string): Promise<void> {
    const json = JSON.stringify(report, null, 2);
    await fs.writeFile(outputPath, json, 'utf-8');
  }

  /**
   * Export as HTML
   */
  private async exportHTML(
    report: PerformanceReport,
    options: ReportExportOptions
  ): Promise<void> {
    const html = this.generateHTMLReport(report, options);
    await fs.writeFile(options.outputPath, html, 'utf-8');
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(
    report: PerformanceReport,
    options: ReportExportOptions
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .metric-card { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; margin-top: 5px; }
    .success { border-left-color: #28a745; }
    .warning { border-left-color: #ffc107; }
    .error { border-left-color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    tr:hover { background: #f8f9fa; }
    .chart { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }
    .assertion-passed { color: #28a745; }
    .assertion-failed { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Performance Test Report</h1>
    <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
    <p><strong>Duration:</strong> ${report.summary.duration.toFixed(1)}s</p>

    <h2>Summary</h2>
    <div class="summary">
      <div class="metric-card ${report.summary.slaCompliance ? 'success' : 'error'}">
        <div class="metric-label">SLA Compliance</div>
        <div class="metric-value">${report.summary.slaCompliance ? '✓ Pass' : '✗ Fail'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${report.metrics.totalRequests.toLocaleString()}</div>
      </div>
      <div class="metric-card ${report.summary.successRate >= 0.95 ? 'success' : 'warning'}">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value">${(report.summary.successRate * 100).toFixed(2)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Avg Response Time</div>
        <div class="metric-value">${report.metrics.responseTime.mean.toFixed(0)}ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Throughput</div>
        <div class="metric-value">${report.metrics.throughput.toFixed(1)} RPS</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Error Rate</div>
        <div class="metric-value">${(report.metrics.errorRate * 100).toFixed(2)}%</div>
      </div>
    </div>

    <h2>Response Time Statistics</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value (ms)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Minimum</td><td>${report.metrics.responseTime.min.toFixed(0)}</td></tr>
        <tr><td>Median (p50)</td><td>${report.metrics.responseTime.median.toFixed(0)}</td></tr>
        <tr><td>90th Percentile</td><td>${report.metrics.responseTime.p90.toFixed(0)}</td></tr>
        <tr><td>95th Percentile</td><td>${report.metrics.responseTime.p95.toFixed(0)}</td></tr>
        <tr><td>99th Percentile</td><td>${report.metrics.responseTime.p99.toFixed(0)}</td></tr>
        <tr><td>Maximum</td><td>${report.metrics.responseTime.max.toFixed(0)}</td></tr>
        <tr><td>Mean</td><td>${report.metrics.responseTime.mean.toFixed(0)}</td></tr>
        <tr><td>Std Dev</td><td>${report.metrics.responseTime.stdDev.toFixed(0)}</td></tr>
      </tbody>
    </table>

    ${this.generateAssertionsTable(report.metrics.assertions)}

    ${(options.includeTimeSeries ?? false) && report.metrics.timeSeries ? this.generateTimeSeriesChart(report.metrics.timeSeries) : ''}

    ${report.comparison ? this.generateComparisonSection(report.comparison) : ''}
  </div>
</body>
</html>`;
  }

  /**
   * Generate assertions table
   */
  private generateAssertionsTable(assertions: any[]): string {
    if (assertions.length === 0) {
      return '';
    }

    const rows = assertions
      .map(
        (a) => `
      <tr>
        <td class="${a.passed ? 'assertion-passed' : 'assertion-failed'}">${a.passed ? '✓' : '✗'}</td>
        <td>${a.name}</td>
        <td>${a.actualValue.toFixed(2)}</td>
        <td>${a.threshold}</td>
        <td>${a.severity}</td>
      </tr>
    `
      )
      .join('');

    return `
    <h2>Performance Assertions</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Assertion</th>
          <th>Actual</th>
          <th>Threshold</th>
          <th>Severity</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;
  }

  /**
   * Generate time series chart (ASCII)
   */
  private generateTimeSeriesChart(timeSeries: TimeSeriesData[]): string {
    const chart = this.createASCIIChart(
      timeSeries.map((d) => d.avgResponseTime),
      'Response Time Over Time'
    );

    return `
    <h2>Time Series Data</h2>
    <div class="chart">
      <pre>${chart}</pre>
    </div>
    `;
  }

  /**
   * Create ASCII chart
   */
  private createASCIIChart(data: number[], title: string): string {
    if (data.length === 0) {
      return 'No data';
    }

    const height = 20;
    const width = Math.min(data.length, 60);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    let chart = `${title}\n`;
    chart += `Max: ${max.toFixed(0)}\n`;

    // Draw chart
    for (let y = height; y >= 0; y--) {
      const threshold = min + (range * y) / height;
      let line = '';

      for (let x = 0; x < width; x++) {
        const index = Math.floor((x * data.length) / width);
        const value = data[index] || 0;
        line += value >= threshold ? '█' : ' ';
      }

      chart += line + '\n';
    }

    chart += `Min: ${min.toFixed(0)}\n`;
    chart += '─'.repeat(width) + '\n';
    chart += `Time →\n`;

    return chart;
  }

  /**
   * Generate comparison section
   */
  private generateComparisonSection(comparison: BaselineComparison): string {
    const rows = comparison.changes
      .map(
        (c) => `
      <tr>
        <td>${c.metric}</td>
        <td>${c.baselineValue.toFixed(2)}</td>
        <td>${c.currentValue.toFixed(2)}</td>
        <td class="${c.direction === 'improved' ? 'assertion-passed' : c.direction === 'regressed' ? 'assertion-failed' : ''}">${c.percentChange > 0 ? '+' : ''}${c.percentChange.toFixed(1)}%</td>
        <td>${c.direction}</td>
      </tr>
    `
      )
      .join('');

    return `
    <h2>Baseline Comparison</h2>
    <p><strong>Baseline:</strong> ${comparison.baselineDate.toISOString()}</p>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Baseline</th>
          <th>Current</th>
          <th>Change</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;
  }

  /**
   * Export as CSV
   */
  private async exportCSV(report: PerformanceReport, outputPath: string): Promise<void> {
    const lines = [
      'Metric,Value',
      `Total Requests,${report.metrics.totalRequests}`,
      `Successful Requests,${report.metrics.successfulRequests}`,
      `Failed Requests,${report.metrics.failedRequests}`,
      `Error Rate,${report.metrics.errorRate}`,
      `Throughput (RPS),${report.metrics.throughput}`,
      `Response Time Min (ms),${report.metrics.responseTime.min}`,
      `Response Time Max (ms),${report.metrics.responseTime.max}`,
      `Response Time Mean (ms),${report.metrics.responseTime.mean}`,
      `Response Time Median (ms),${report.metrics.responseTime.median}`,
      `Response Time P95 (ms),${report.metrics.responseTime.p95}`,
      `Response Time P99 (ms),${report.metrics.responseTime.p99}`,
    ];

    await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
  }

  /**
   * Export as JMeter XML
   */
  private async exportJMeterXML(
    report: PerformanceReport,
    outputPath: string
  ): Promise<void> {
    // Simplified JMeter XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testResults version="1.2">
  <httpSample t="${report.metrics.responseTime.mean.toFixed(0)}"
              lt="${report.metrics.responseTime.mean.toFixed(0)}"
              ts="${report.generatedAt.getTime()}"
              s="${report.metrics.successfulRequests > 0}"
              lb="Performance Test"
              rc="200"
              rm="OK"
              tn="Test 1-1"
              dt="text"
              by="${report.metrics.dataTransferred.bytesReceived}"
              ng="${report.metrics.peakConcurrentUsers}"
              na="${report.metrics.peakConcurrentUsers}">
  </httpSample>
</testResults>`;

    await fs.writeFile(outputPath, xml, 'utf-8');
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(
    report: PerformanceReport,
    outputPath: string
  ): Promise<void> {
    let md = `# Performance Test Report\n\n`;
    md += `**Generated:** ${report.generatedAt.toISOString()}\n\n`;
    md += `**Duration:** ${report.summary.duration.toFixed(1)}s\n\n`;

    md += `## Summary\n\n`;
    md += `- **SLA Compliance:** ${report.summary.slaCompliance ? '✓ Pass' : '✗ Fail'}\n`;
    md += `- **Total Requests:** ${report.metrics.totalRequests.toLocaleString()}\n`;
    md += `- **Success Rate:** ${(report.summary.successRate * 100).toFixed(2)}%\n`;
    md += `- **Avg Response Time:** ${report.metrics.responseTime.mean.toFixed(0)}ms\n`;
    md += `- **Throughput:** ${report.metrics.throughput.toFixed(1)} RPS\n`;
    md += `- **Error Rate:** ${(report.metrics.errorRate * 100).toFixed(2)}%\n\n`;

    md += `## Response Time Statistics\n\n`;
    md += `| Metric | Value (ms) |\n`;
    md += `|--------|------------|\n`;
    md += `| Minimum | ${report.metrics.responseTime.min.toFixed(0)} |\n`;
    md += `| Median (p50) | ${report.metrics.responseTime.median.toFixed(0)} |\n`;
    md += `| 95th Percentile | ${report.metrics.responseTime.p95.toFixed(0)} |\n`;
    md += `| 99th Percentile | ${report.metrics.responseTime.p99.toFixed(0)} |\n`;
    md += `| Maximum | ${report.metrics.responseTime.max.toFixed(0)} |\n`;
    md += `| Mean | ${report.metrics.responseTime.mean.toFixed(0)} |\n\n`;

    if (report.metrics.assertions.length > 0) {
      md += `## Performance Assertions\n\n`;
      md += `| Status | Assertion | Actual | Threshold | Severity |\n`;
      md += `|--------|-----------|--------|-----------|----------|\n`;
      for (const assertion of report.metrics.assertions) {
        md += `| ${assertion.passed ? '✓' : '✗'} | ${assertion.name} | ${assertion.actualValue.toFixed(2)} | ${assertion.threshold} | ${assertion.severity} |\n`;
      }
      md += `\n`;
    }

    await fs.writeFile(outputPath, md, 'utf-8');
  }

  /**
   * Print console summary
   */
  printSummary(report: PerformanceReport): void {
    console.log('\n📊 Performance Test Results\n');
    console.log('═'.repeat(60));
    console.log(
      `Total Requests:      ${report.metrics.totalRequests.toLocaleString()}`
    );
    console.log(
      `Success Rate:        ${(report.summary.successRate * 100).toFixed(2)}%`
    );
    console.log(
      `Error Rate:          ${(report.metrics.errorRate * 100).toFixed(2)}%`
    );
    console.log('─'.repeat(60));
    console.log(
      `Avg Response Time:   ${report.metrics.responseTime.mean.toFixed(0)}ms`
    );
    console.log(
      `P95 Response Time:   ${report.metrics.responseTime.p95.toFixed(0)}ms`
    );
    console.log(
      `P99 Response Time:   ${report.metrics.responseTime.p99.toFixed(0)}ms`
    );
    console.log('─'.repeat(60));
    console.log(`Throughput:          ${report.metrics.throughput.toFixed(1)} RPS`);
    console.log(
      `Peak Concurrent:     ${report.metrics.peakConcurrentUsers} users`
    );
    console.log('─'.repeat(60));
    console.log(
      `SLA Compliance:      ${report.summary.slaCompliance ? '✓ PASS' : '✗ FAIL'}`
    );
    console.log('═'.repeat(60));

    // Print failed assertions
    const failedAssertions = report.metrics.assertions.filter((a) => !a.passed);
    if (failedAssertions.length > 0) {
      console.log('\n⚠️  Failed Assertions:\n');
      for (const assertion of failedAssertions) {
        console.log(`  ✗ ${assertion.name}`);
        console.log(`    Expected: ${assertion.threshold}`);
        console.log(`    Actual: ${assertion.actualValue.toFixed(2)}`);
        console.log(`    Severity: ${assertion.severity}\n`);
      }
    }

    // Print comparison
    if (report.comparison) {
      console.log('\n📈 Baseline Comparison:\n');
      for (const change of report.comparison.changes) {
        const icon =
          change.direction === 'improved'
            ? '↑'
            : change.direction === 'regressed'
              ? '↓'
              : '→';
        console.log(
          `  ${icon} ${change.metric}: ${change.percentChange > 0 ? '+' : ''}${change.percentChange.toFixed(1)}% (${change.direction})`
        );
      }
    }

    console.log('');
  }
}
