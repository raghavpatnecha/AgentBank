/**
 * PR Comment Formatter (Feature 5, Task 5.5)
 * Generates rich, formatted comments with test results for GitHub PRs
 */

import { TestResult, TestStatus, ExecutionSummary } from '../types/executor-types.js';

/**
 * Test results for comment formatting
 */
export interface FormattedTestResults {
  /** Execution summary */
  summary: ExecutionSummary;

  /** All test results */
  tests: TestResult[];

  /** Failed tests with details */
  failedTests: TestResult[];

  /** Self-healed tests */
  healedTests: HealedTest[];

  /** Performance metrics */
  metrics?: PerformanceMetrics;

  /** Report link */
  reportUrl?: string;

  /** Artifact download URL */
  artifactUrl?: string;

  /** CI/CD run ID */
  runId?: string;
}

/**
 * Self-healed test information
 */
export interface HealedTest {
  /** Original test result */
  test: TestResult;

  /** What was healed */
  healingDescription: string;

  /** Healing strategy used */
  strategy: 'ai-powered' | 'rule-based' | 'hybrid';

  /** Whether healing was successful */
  success: boolean;
}

/**
 * Performance metrics for tests
 */
export interface PerformanceMetrics {
  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Slowest endpoint */
  slowestEndpoint?: {
    name: string;
    duration: number;
  };

  /** Fastest endpoint */
  fastestEndpoint?: {
    name: string;
    duration: number;
  };

  /** Total requests made */
  totalRequests: number;

  /** Requests per second */
  requestsPerSecond: number;

  /** Code coverage percentage */
  coverage?: number;
}

/**
 * Comment formatter class for generating GitHub PR comments
 */
export class CommentFormatter {
  private readonly maxCommentLength: number = 65536; // GitHub's max comment length
  private readonly version: string = '1.0.0';

  /**
   * Format complete test results into a GitHub comment
   * @param results - Test results to format
   * @returns Formatted markdown comment
   */
  formatTestResults(results: FormattedTestResults): string {
    const sections: string[] = [];

    // Header
    sections.push(this.formatHeader());

    // Summary section
    sections.push(this.formatSummary(results));

    // Divider
    sections.push('---\n');

    // Passed tests section (collapsed if many)
    if (results.summary.passed > 0) {
      const passedTests = results.tests.filter((t) => t.status === TestStatus.PASSED);
      sections.push(this.formatPassedTests(passedTests));
      sections.push('---\n');
    }

    // Failed tests section (detailed)
    if (results.failedTests.length > 0) {
      sections.push(this.formatFailedTests(results.failedTests, true));
      sections.push('---\n');
    }

    // Self-healed tests section
    if (results.healedTests && results.healedTests.length > 0) {
      sections.push(this.formatHealedTests(results.healedTests));
      sections.push('---\n');
    }

    // Skipped tests section
    if (results.summary.skipped > 0) {
      const skippedTests = results.tests.filter((t) => t.status === TestStatus.SKIPPED);
      sections.push(this.formatSkippedTests(skippedTests));
      sections.push('---\n');
    }

    // Performance metrics
    if (results.metrics) {
      sections.push(this.formatPerformanceMetrics(results.metrics));
      sections.push('---\n');
    }

    // Links section
    sections.push(this.formatLinks(results));

    // Footer
    sections.push(this.formatFooter());

    const comment = sections.join('\n');

    // Truncate if needed
    return this.truncateIfNeeded(comment, this.maxCommentLength);
  }

  /**
   * Format comment header
   * @returns Formatted header
   */
  private formatHeader(): string {
    return '## 🧪 API Test Results\n';
  }

  /**
   * Format summary section
   * @param results - Test results
   * @returns Formatted summary
   */
  formatSummary(results: FormattedTestResults): string {
    const { summary } = results;
    const sections: string[] = [];

    sections.push('### Summary\n');

    // Status line with emojis
    const statusParts: string[] = [];

    if (summary.passed > 0) {
      statusParts.push(`✅ **${summary.passed} passed**`);
    }

    if (summary.failed > 0) {
      statusParts.push(`❌ **${summary.failed} failed**`);
    }

    if (summary.skipped > 0) {
      statusParts.push(`⏭️ **${summary.skipped} skipped**`);
    }

    if (results.healedTests && results.healedTests.length > 0) {
      const successfulHeals = results.healedTests.filter((h) => h.success).length;
      if (successfulHeals > 0) {
        statusParts.push(`🔧 **${successfulHeals} self-healed**`);
      }
    }

    sections.push(statusParts.join(' | '));

    // Duration and coverage
    const duration = this.formatDuration(summary.duration);
    const coverageStr = results.metrics?.coverage
      ? ` | 📊 Coverage: ${results.metrics.coverage.toFixed(1)}%`
      : '';

    sections.push(`⏱️ Duration: ${duration}${coverageStr}\n`);

    // Success rate bar
    const successBar = this.createProgressBar(summary.successRate, 20);
    const successRatePercent = (summary.successRate * 100).toFixed(1);
    sections.push(`**Success Rate:** ${successRatePercent}% ${successBar}\n`);

    return sections.join('\n');
  }

  /**
   * Format passed tests list
   * @param tests - Passed test results
   * @returns Formatted passed tests section
   */
  formatPassedTests(tests: TestResult[]): string {
    const sections: string[] = [];

    sections.push(`### ✅ Passed Tests (${tests.length})\n`);

    if (tests.length === 0) {
      return sections.join('\n');
    }

    // Show first 5 tests
    const displayCount = Math.min(5, tests.length);
    for (let i = 0; i < displayCount; i++) {
      const test = tests[i];
      if (test) {
        const duration = this.formatDuration(test.duration);
        sections.push(`- \`${test.name}\` (${duration})`);
      }
    }

    // Collapse remaining tests
    if (tests.length > displayCount) {
      const remaining = tests.slice(displayCount);
      const remainingList = remaining
        .map((t) => `- \`${t.name}\` (${this.formatDuration(t.duration)})`)
        .join('\n');

      sections.push(
        this.createCollapsibleSection(
          `Show ${remaining.length} more passed tests`,
          remainingList
        )
      );
    }

    sections.push('');
    return sections.join('\n');
  }

  /**
   * Format failed tests with details
   * @param tests - Failed test results
   * @param detailed - Whether to include detailed error information
   * @returns Formatted failed tests section
   */
  formatFailedTests(tests: TestResult[], detailed: boolean = true): string {
    const sections: string[] = [];

    sections.push(`### ❌ Failed Tests (${tests.length})\n`);

    if (tests.length === 0) {
      return sections.join('\n');
    }

    for (const test of tests) {
      if (detailed) {
        sections.push(this.formatFailedTestDetail(test));
      } else {
        sections.push(`- \`${test.name}\``);
      }
    }

    sections.push('');
    return sections.join('\n');
  }

  /**
   * Format detailed information for a failed test
   * @param test - Failed test result
   * @returns Formatted test detail
   */
  private formatFailedTestDetail(test: TestResult): string {
    const title = `**${test.name}**`;

    const details: string[] = [];

    // Error message
    if (test.error?.message) {
      details.push(`**Error**: ${this.escapeMarkdown(test.error.message)}\n`);
    }

    // Error type
    if (test.error?.type) {
      details.push(`**Error Type**: \`${test.error.type}\`\n`);
    }

    // Comparison (expected vs actual)
    if (test.error?.comparison) {
      details.push('**Expected vs Actual**:\n');
      details.push('```json');
      details.push('Expected:');
      details.push(JSON.stringify(test.error.comparison.expected, null, 2));
      details.push('\nActual:');
      details.push(JSON.stringify(test.error.comparison.actual, null, 2));
      details.push('```\n');
    }

    // Stack trace
    if (test.error?.stack) {
      const stackLines = test.error.stack.split('\n').slice(0, 10); // Limit to 10 lines
      details.push('**Stack Trace**:\n```\n' + stackLines.join('\n') + '\n```\n');
    }

    // Location
    if (test.error?.location) {
      details.push(
        `**Location**: \`${test.error.location.file}:${test.error.location.line}:${test.error.location.column}\`\n`
      );
    }

    // Duration and retries
    details.push(`**Duration**: ${this.formatDuration(test.duration)}`);
    if (test.retries > 0) {
      details.push(` | **Retries**: ${test.retries}`);
    }
    details.push('\n');

    return this.createCollapsibleSection(title, details.join('\n'));
  }

  /**
   * Format self-healed tests
   * @param healedTests - Healed test information
   * @returns Formatted healed tests section
   */
  formatHealedTests(healedTests: HealedTest[]): string {
    const sections: string[] = [];

    const successfulHeals = healedTests.filter((h) => h.success);

    if (successfulHeals.length === 0) {
      return '';
    }

    sections.push(`### 🔧 Self-Healed Tests (${successfulHeals.length})\n`);

    for (const healed of successfulHeals) {
      const strategyEmoji = this.getStrategyEmoji(healed.strategy);
      sections.push(
        `- \`${healed.test.name}\` - ${healed.healingDescription} ${strategyEmoji} **(auto-fixed)**`
      );
    }

    sections.push('');
    return sections.join('\n');
  }

  /**
   * Format skipped tests
   * @param tests - Skipped test results
   * @returns Formatted skipped tests section
   */
  private formatSkippedTests(tests: TestResult[]): string {
    const lines: string[] = [];

    lines.push(`### ⏭️ Skipped Tests (${tests.length})\n`);

    // Show first 3, collapse rest
    const displayCount = Math.min(3, tests.length);
    for (let i = 0; i < displayCount; i++) {
      const test = tests[i];
      if (test) {
        lines.push(`- \`${test.name}\``);
      }
    }

    if (tests.length > displayCount) {
      const remaining = tests.slice(displayCount);
      const remainingList = remaining.map((t) => `- \`${t.name}\``).join('\n');
      lines.push(
        this.createCollapsibleSection(
          `Show ${remaining.length} more skipped tests`,
          remainingList
        )
      );
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Format performance metrics
   * @param metrics - Performance metrics
   * @returns Formatted metrics section
   */
  formatPerformanceMetrics(metrics: PerformanceMetrics): string {
    const sections: string[] = [];

    sections.push('### 📈 Performance Metrics\n');

    // Average response time
    sections.push(`- **Average Response Time**: ${this.formatDuration(metrics.averageResponseTime)}`);

    // Slowest endpoint
    if (metrics.slowestEndpoint) {
      sections.push(
        `- **Slowest Endpoint**: \`${metrics.slowestEndpoint.name}\` (${this.formatDuration(metrics.slowestEndpoint.duration)})`
      );
    }

    // Fastest endpoint
    if (metrics.fastestEndpoint) {
      sections.push(
        `- **Fastest Endpoint**: \`${metrics.fastestEndpoint.name}\` (${this.formatDuration(metrics.fastestEndpoint.duration)})`
      );
    }

    // Requests per second
    if (metrics.requestsPerSecond !== undefined) {
      sections.push(`- **Throughput**: ${metrics.requestsPerSecond.toFixed(2)} req/s`);
    }

    // Total requests
    if (metrics.totalRequests) {
      sections.push(`- **Total Requests**: ${metrics.totalRequests}`);
    }

    sections.push('');
    return sections.join('\n');
  }

  /**
   * Create collapsible section (using details/summary HTML)
   * @param title - Section title
   * @param content - Section content
   * @returns Formatted collapsible section
   */
  createCollapsibleSection(title: string, content: string): string {
    return `<details>\n<summary>${title}</summary>\n\n${content}\n</details>\n`;
  }

  /**
   * Add emojis to text based on keywords
   * @param text - Input text
   * @returns Text with emojis
   */
  addEmojis(text: string): string {
    let result = text;

    // Status emojis
    result = result.replace(/\b(passed|success|successful)\b/gi, '✅ $1');
    result = result.replace(/\b(failed|failure|error)\b/gi, '❌ $1');
    result = result.replace(/\b(warning|warn)\b/gi, '⚠️ $1');
    result = result.replace(/\b(skipped|skip)\b/gi, '⏭️ $1');
    result = result.replace(/\b(healed|fixed|repaired)\b/gi, '🔧 $1');

    // Time-related
    result = result.replace(/\b(duration|time|timeout)\b/gi, '⏱️ $1');
    result = result.replace(/\b(fast|quick|rapid)\b/gi, '⚡ $1');
    result = result.replace(/\b(slow|sluggish)\b/gi, '🐌 $1');

    return result;
  }

  /**
   * Truncate content if it exceeds maximum length
   * @param content - Content to truncate
   * @param maxLength - Maximum allowed length
   * @returns Truncated content
   */
  truncateIfNeeded(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    const truncated = content.substring(0, maxLength - 200);
    const lastNewline = truncated.lastIndexOf('\n');

    return (
      truncated.substring(0, lastNewline) +
      '\n\n---\n\n⚠️ **Comment truncated** - Content exceeded GitHub\'s maximum comment length. View full results in the [HTML report].\n'
    );
  }

  /**
   * Generate report link
   * @param reportId - Report identifier
   * @returns Report URL
   */
  generateReportLink(reportId: string): string {
    // This would typically point to a hosted report viewer
    return `https://api-test-reports.example.com/reports/${reportId}`;
  }

  /**
   * Format links section
   * @param results - Test results
   * @returns Formatted links section
   */
  private formatLinks(results: FormattedTestResults): string {
    const links: string[] = [];

    if (results.reportUrl) {
      links.push(`[📊 View Full HTML Report](${results.reportUrl})`);
    }

    if (results.artifactUrl) {
      links.push(`[📦 Download Artifacts](${results.artifactUrl})`);
    }

    if (results.runId) {
      links.push(`[🔗 CI/CD Run #${results.runId}](${results.artifactUrl || '#'})`);
    }

    if (links.length === 0) {
      return '';
    }

    return links.join(' | ') + '\n';
  }

  /**
   * Format footer
   * @returns Formatted footer
   */
  private formatFooter(): string {
    return `\n<sub>Generated by [API Test Agent](https://github.com/your-org/api-test-agent) v${this.version}</sub>\n`;
  }

  /**
   * Format duration in human-readable format
   * @param milliseconds - Duration in milliseconds
   * @returns Formatted duration string
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = milliseconds / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  /**
   * Create a text-based progress bar
   * @param progress - Progress value (0-1)
   * @param width - Bar width in characters
   * @returns Progress bar string
   */
  private createProgressBar(progress: number, width: number = 20): string {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Get emoji for healing strategy
   * @param strategy - Healing strategy
   * @returns Emoji representation
   */
  private getStrategyEmoji(strategy: string): string {
    switch (strategy) {
      case 'ai-powered':
        return '🤖';
      case 'rule-based':
        return '📏';
      case 'hybrid':
        return '🔀';
      default:
        return '✨';
    }
  }

  /**
   * Escape markdown special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Generate summary comment for quick overview
   * @param results - Test results
   * @returns Brief summary comment
   */
  generateSummaryComment(results: FormattedTestResults): string {
    const { summary } = results;
    const status = summary.failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed';
    const duration = this.formatDuration(summary.duration);

    return `${status} (${summary.passed}/${summary.totalTests} passed in ${duration})`;
  }

  /**
   * Generate compact comment (for comment updates/edits)
   * @param results - Test results
   * @returns Compact formatted comment
   */
  generateCompactComment(results: FormattedTestResults): string {
    const sections: string[] = [];

    sections.push(this.formatHeader());
    sections.push(this.formatSummary(results));

    if (results.failedTests.length > 0) {
      sections.push('\n---\n');
      sections.push(this.formatFailedTests(results.failedTests, false));
    }

    if (results.healedTests && results.healedTests.length > 0) {
      sections.push('\n---\n');
      sections.push(this.formatHealedTests(results.healedTests));
    }

    sections.push('\n' + this.formatLinks(results));
    sections.push(this.formatFooter());

    return sections.join('\n');
  }
}

/**
 * Create a default comment formatter instance
 * @returns CommentFormatter instance
 */
export function createCommentFormatter(): CommentFormatter {
  return new CommentFormatter();
}
