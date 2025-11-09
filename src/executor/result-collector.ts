/**
 * Test Result Collector
 * Collects, aggregates, and exports test results
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TestResult,
  ExecutionSummary,
  TestStatus,
  FileSummary,
  TagSummary,
  ExportFormat,
  ExportOptions,
} from '../types/executor-types.js';

/**
 * Result Collector Implementation
 * Manages test results and generates reports
 */
export class ResultCollector {
  private results: TestResult[] = [];
  private startTime: Date | null = null;
  private endTime: Date | null = null;

  /**
   * Add a test result
   */
  addResult(result: TestResult): void {
    this.results.push(result);

    // Track execution time window
    if (!this.startTime || result.startTime < this.startTime) {
      this.startTime = result.startTime;
    }
    if (!this.endTime || result.endTime > this.endTime) {
      this.endTime = result.endTime;
    }
  }

  /**
   * Get all collected results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Get execution summary with statistics
   */
  getSummary(): ExecutionSummary {
    const totalTests = this.results.length;

    // Count by status
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const skipped = this.results.filter(r => r.status === TestStatus.SKIPPED).length;
    const timeout = this.results.filter(r => r.status === TestStatus.TIMEOUT).length;
    const error = this.results.filter(r => r.status === TestStatus.ERROR).length;

    // Calculate durations
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    // Calculate success rate
    const successRate = totalTests > 0 ? passed / totalTests : 0;

    // Get unique files
    const filesExecuted = [...new Set(this.results.map(r => r.filePath))];

    // Count total retries
    const totalRetries = this.results.reduce((sum, r) => sum + r.retries, 0);

    // Calculate execution time
    const start = this.startTime || new Date();
    const end = this.endTime || new Date();
    const duration = end.getTime() - start.getTime();

    // Generate by-file statistics
    const byFile = this.generateFileStatistics();

    // Generate by-tag statistics
    const byTag = this.generateTagStatistics();

    return {
      totalTests,
      passed,
      failed,
      skipped,
      timeout,
      error,
      duration,
      startTime: start,
      endTime: end,
      successRate,
      averageDuration,
      filesExecuted,
      totalRetries,
      byFile,
      byTag,
    };
  }

  /**
   * Generate file-level statistics
   */
  private generateFileStatistics(): Record<string, FileSummary> {
    const byFile: Record<string, FileSummary> = {};

    for (const result of this.results) {
      const filePath = result.filePath;

      if (!byFile[filePath]) {
        byFile[filePath] = {
          filePath,
          testCount: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
        };
      }

      const summary = byFile[filePath];
      summary.testCount++;
      summary.duration += result.duration;

      switch (result.status) {
        case TestStatus.PASSED:
          summary.passed++;
          break;
        case TestStatus.FAILED:
        case TestStatus.TIMEOUT:
        case TestStatus.ERROR:
          summary.failed++;
          break;
        case TestStatus.SKIPPED:
          summary.skipped++;
          break;
      }
    }

    return byFile;
  }

  /**
   * Generate tag-level statistics
   */
  private generateTagStatistics(): Record<string, TagSummary> {
    const byTag: Record<string, TagSummary> = {};

    for (const result of this.results) {
      const tags = result.tags || [];

      for (const tag of tags) {
        if (!byTag[tag]) {
          byTag[tag] = {
            tag,
            testCount: 0,
            passed: 0,
            failed: 0,
            successRate: 0,
          };
        }

        const summary = byTag[tag];
        summary.testCount++;

        if (result.status === TestStatus.PASSED) {
          summary.passed++;
        } else if (
          result.status === TestStatus.FAILED ||
          result.status === TestStatus.TIMEOUT ||
          result.status === TestStatus.ERROR
        ) {
          summary.failed++;
        }
      }
    }

    // Calculate success rates
    for (const tag in byTag) {
      const summary = byTag[tag];
      if (summary) {
        summary.successRate = summary.testCount > 0
          ? summary.passed / summary.testCount
          : 0;
      }
    }

    return byTag;
  }

  /**
   * Export results in specified format
   */
  async exportResults(format: ExportFormat): Promise<void> {
    const options = format.options || {};

    switch (format.format) {
      case 'json':
        await this.exportJSON(format.outputPath, options);
        break;
      case 'junit':
        await this.exportJUnit(format.outputPath, options);
        break;
      case 'html':
        await this.exportHTML(format.outputPath, options);
        break;
      case 'csv':
        await this.exportCSV(format.outputPath, options);
        break;
      case 'markdown':
        await this.exportMarkdown(format.outputPath, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format.format}`);
    }
  }

  /**
   * Export as JSON
   */
  private async exportJSON(outputPath: string, options: ExportOptions): Promise<void> {
    const data = {
      summary: this.getSummary(),
      results: options.includeDetails ? this.results : undefined,
      timestamp: options.includeTimestamp ? new Date().toISOString() : undefined,
      environment: options.includeEnvironment ? this.getEnvironmentInfo() : undefined,
      metadata: options.metadata,
    };

    const json = options.prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);

    await this.ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, json, 'utf-8');
  }

  /**
   * Export as JUnit XML
   */
  private async exportJUnit(outputPath: string, options: ExportOptions): Promise<void> {
    const summary = this.getSummary();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites tests="${summary.totalTests}" failures="${summary.failed}" `;
    xml += `errors="${summary.error}" time="${summary.duration / 1000}">\n`;

    // Group by file
    for (const [filePath, fileSummary] of Object.entries(summary.byFile)) {
      xml += `  <testsuite name="${this.escapeXml(filePath)}" `;
      xml += `tests="${fileSummary.testCount}" failures="${fileSummary.failed}" `;
      xml += `skipped="${fileSummary.skipped}" time="${fileSummary.duration / 1000}">\n`;

      // Add test cases for this file
      const fileTests = this.results.filter(r => r.filePath === filePath);
      for (const test of fileTests) {
        xml += `    <testcase name="${this.escapeXml(test.name)}" `;
        xml += `classname="${this.escapeXml(filePath)}" `;
        xml += `time="${test.duration / 1000}">\n`;

        if (test.status === TestStatus.FAILED || test.status === TestStatus.ERROR) {
          xml += `      <failure message="${this.escapeXml(test.error?.message || 'Test failed')}">\n`;
          if (options.includeStackTraces && test.error?.stack) {
            xml += this.escapeXml(test.error.stack);
          }
          xml += '\n      </failure>\n';
        } else if (test.status === TestStatus.SKIPPED) {
          xml += '      <skipped/>\n';
        }

        xml += '    </testcase>\n';
      }

      xml += '  </testsuite>\n';
    }

    xml += '</testsuites>\n';

    await this.ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, xml, 'utf-8');
  }

  /**
   * Export as HTML report
   */
  private async exportHTML(outputPath: string, options: ExportOptions): Promise<void> {
    const summary = this.getSummary();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Execution Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; margin: 5px 0; }
    .stat-label { color: #666; font-size: 0.9em; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    tr:hover { background: #f8f9fa; }
    .status-badge { padding: 4px 8px; border-radius: 3px; font-size: 0.85em; font-weight: bold; }
    .status-passed { background: #d4edda; color: #155724; }
    .status-failed { background: #f8d7da; color: #721c24; }
    .status-skipped { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Test Execution Report</h1>
    ${options.includeTimestamp ? `<p>Generated: ${new Date().toLocaleString()}</p>` : ''}

    <div class="summary">
      <div class="stat">
        <div class="stat-value">${summary.totalTests}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat">
        <div class="stat-value passed">${summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value failed">${summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value skipped">${summary.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat">
        <div class="stat-value">${(summary.successRate * 100).toFixed(1)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
      <div class="stat">
        <div class="stat-value">${(summary.duration / 1000).toFixed(2)}s</div>
        <div class="stat-label">Duration</div>
      </div>
    </div>

    ${options.includeDetails ? this.generateHTMLTestTable() : ''}
  </div>
</body>
</html>`;

    await this.ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, html, 'utf-8');
  }

  /**
   * Generate HTML test table
   */
  private generateHTMLTestTable(): string {
    let html = '<h2>Test Results</h2><table><thead><tr>';
    html += '<th>Test Name</th><th>File</th><th>Status</th><th>Duration</th><th>Retries</th>';
    html += '</tr></thead><tbody>';

    for (const test of this.results) {
      const statusClass = `status-${test.status}`;
      html += '<tr>';
      html += `<td>${this.escapeHtml(test.name)}</td>`;
      html += `<td>${this.escapeHtml(test.filePath)}</td>`;
      html += `<td><span class="status-badge ${statusClass}">${test.status}</span></td>`;
      html += `<td>${(test.duration / 1000).toFixed(2)}s</td>`;
      html += `<td>${test.retries}</td>`;
      html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
  }

  /**
   * Export as CSV
   */
  private async exportCSV(outputPath: string, _options: ExportOptions): Promise<void> {
    const rows: string[] = [];

    // Header
    rows.push('Test Name,File,Status,Duration (ms),Retries,Error Message');

    // Data rows
    for (const test of this.results) {
      const row = [
        this.escapeCsv(test.name),
        this.escapeCsv(test.filePath),
        test.status,
        test.duration.toString(),
        test.retries.toString(),
        this.escapeCsv(test.error?.message || ''),
      ];
      rows.push(row.join(','));
    }

    const csv = rows.join('\n');
    await this.ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, csv, 'utf-8');
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(outputPath: string, options: ExportOptions): Promise<void> {
    const summary = this.getSummary();

    let md = '# Test Execution Report\n\n';

    if (options.includeTimestamp) {
      md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    }

    md += '## Summary\n\n';
    md += `- **Total Tests:** ${summary.totalTests}\n`;
    md += `- **Passed:** ${summary.passed} ✅\n`;
    md += `- **Failed:** ${summary.failed} ❌\n`;
    md += `- **Skipped:** ${summary.skipped} ⊘\n`;
    md += `- **Success Rate:** ${(summary.successRate * 100).toFixed(1)}%\n`;
    md += `- **Duration:** ${(summary.duration / 1000).toFixed(2)}s\n`;
    md += `- **Average Test Duration:** ${(summary.averageDuration / 1000).toFixed(2)}s\n\n`;

    if (options.includeDetails) {
      md += '## Test Results\n\n';
      md += '| Test Name | File | Status | Duration | Retries |\n';
      md += '|-----------|------|--------|----------|----------|\n';

      for (const test of this.results) {
        const statusIcon = test.status === TestStatus.PASSED ? '✅' :
                          test.status === TestStatus.FAILED ? '❌' :
                          test.status === TestStatus.SKIPPED ? '⊘' : '⚠️';
        md += `| ${test.name} | ${test.filePath} | ${statusIcon} ${test.status} | ${(test.duration / 1000).toFixed(2)}s | ${test.retries} |\n`;
      }
    }

    await this.ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, md, 'utf-8');
  }

  /**
   * Clear all collected results
   */
  clear(): void {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo(): Record<string, string> {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Escape CSV special characters
   */
  private escapeCsv(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
