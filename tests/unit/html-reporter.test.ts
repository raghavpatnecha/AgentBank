/**
 * Unit Tests for HTML Reporter - Feature 6, Task 6.2
 * Comprehensive test coverage for HTML report generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  HTMLReporter,
  HTMLReporterConfig,
  TestReport,
  PerformanceMetrics,
  EnvironmentInfo,
} from '../../src/reporting/html-reporter';
import {
  TestResult,
  TestStatus,
  ExecutionSummary,
  ErrorType,
} from '../../src/types/executor-types';
import {
  HealingAttempt,
  HealingStrategy,
  FailureType,
} from '../../src/types/self-healing-types';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe('HTMLReporter', () => {
  let reporter: HTMLReporter;
  let config: HTMLReporterConfig;
  let mockTestReport: TestReport;

  beforeEach(() => {
    config = {
      outputDir: '/tmp/test-reports',
      title: 'Test Report',
      includeCharts: true,
      includeDetails: true,
      includeFailedTests: true,
      includeHealedTests: true,
      includePerformance: true,
      includeEnvironment: true,
    };

    reporter = new HTMLReporter(config);

    // Create mock test data
    mockTestReport = createMockTestReport();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config values', () => {
      const minimalConfig: HTMLReporterConfig = {
        outputDir: '/tmp/reports',
      };
      const reporter = new HTMLReporter(minimalConfig);
      expect(reporter).toBeDefined();
    });

    it('should use provided config values', () => {
      const customConfig: HTMLReporterConfig = {
        outputDir: '/custom/path',
        title: 'Custom Report',
        darkMode: true,
        customCSS: '.custom { color: red; }',
      };
      const reporter = new HTMLReporter(customConfig);
      expect(reporter).toBeDefined();
    });

    it('should set default values for optional config', () => {
      const reporter = new HTMLReporter({ outputDir: '/tmp' });
      expect(reporter).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate HTML report successfully', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const filepath = await reporter.generateReport(mockTestReport);

      expect(filepath).toContain('/tmp/test-reports');
      expect(filepath).toMatch(/test-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.html/);
      expect(mockMkdir).toHaveBeenCalledWith('/tmp/test-reports', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should create output directory if it does not exist', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await reporter.generateReport(mockTestReport);

      expect(mockMkdir).toHaveBeenCalledWith('/tmp/test-reports', { recursive: true });
    });

    it('should throw error if directory creation fails', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(reporter.generateReport(mockTestReport)).rejects.toThrow(
        'Failed to generate HTML report'
      );
    });

    it('should throw error if file write fails', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      await expect(reporter.generateReport(mockTestReport)).rejects.toThrow(
        'Failed to generate HTML report'
      );
    });

    it('should include timestamp in filename', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const filepath = await reporter.generateReport(mockTestReport);
      const filename = path.basename(filepath);

      expect(filename).toMatch(/test-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.html/);
    });
  });

  describe('generateHTML', () => {
    it('should generate valid HTML structure', () => {
      const html = reporter.generateHTML(mockTestReport);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('should include report title', () => {
      const html = reporter.generateHTML(mockTestReport);
      expect(html).toContain('Test Report');
    });

    it('should include Chart.js script when charts enabled', () => {
      const html = reporter.generateHTML(mockTestReport);
      expect(html).toContain('chart.js');
    });

    it('should not include Chart.js when charts disabled', () => {
      const noChartsConfig: HTMLReporterConfig = {
        ...config,
        includeCharts: false,
      };
      const noChartsReporter = new HTMLReporter(noChartsConfig);
      const html = noChartsReporter.generateHTML(mockTestReport);

      expect(html).not.toContain('chart.js');
    });

    it('should include all sections when enabled', () => {
      const html = reporter.generateHTML(mockTestReport);

      expect(html).toContain('summary-dashboard');
      expect(html).toContain('charts-section');
      expect(html).toContain('test-results-section');
      expect(html).toContain('failed-tests-section');
      expect(html).toContain('healed-tests-section');
      expect(html).toContain('performance-section');
      expect(html).toContain('environment-section');
    });

    it('should exclude sections when disabled', () => {
      const minimalConfig: HTMLReporterConfig = {
        outputDir: '/tmp',
        includeCharts: false,
        includeDetails: false,
        includeFailedTests: false,
        includeHealedTests: false,
        includePerformance: false,
        includeEnvironment: false,
      };
      const minimalReporter = new HTMLReporter(minimalConfig);
      const html = minimalReporter.generateHTML(mockTestReport);

      expect(html).not.toContain('<section class="charts-section">');
      expect(html).not.toContain('<section class="test-results-section">');
      expect(html).not.toContain('<section class="failed-tests-section">');
      expect(html).not.toContain('<section class="performance-section">');
      expect(html).not.toContain('<section class="environment-section">');
    });

    it('should apply dark mode class when enabled', () => {
      const darkModeConfig: HTMLReporterConfig = {
        ...config,
        darkMode: true,
      };
      const darkModeReporter = new HTMLReporter(darkModeConfig);
      const html = darkModeReporter.generateHTML(mockTestReport);

      expect(html).toContain('dark-mode');
    });

    it('should include custom CSS when provided', () => {
      const customCSSConfig: HTMLReporterConfig = {
        ...config,
        customCSS: '.custom-class { color: blue; }',
      };
      const customCSSReporter = new HTMLReporter(customCSSConfig);
      const html = customCSSReporter.generateHTML(mockTestReport);

      expect(html).toContain('.custom-class { color: blue; }');
    });

    it('should include logo when URL provided', () => {
      const logoConfig: HTMLReporterConfig = {
        ...config,
        logoUrl: 'https://example.com/logo.png',
      };
      const logoReporter = new HTMLReporter(logoConfig);
      const html = logoReporter.generateHTML(mockTestReport);

      expect(html).toContain('https://example.com/logo.png');
      expect(html).toContain('class="logo"');
    });
  });

  describe('generateSummarySection', () => {
    it('should generate summary dashboard', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('summary-dashboard');
      expect(html).toContain('summary-card');
    });

    it('should display total tests count', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Total Tests');
      expect(html).toContain(String(summary.totalTests));
    });

    it('should display passed tests count', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Passed');
      expect(html).toContain(String(summary.passed));
    });

    it('should display failed tests count', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Failed');
      expect(html).toContain(String(summary.failed));
    });

    it('should display success rate as percentage', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Success Rate');
      expect(html).toMatch(/\d+\.\d%/);
    });

    it('should display duration in seconds', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Duration');
      expect(html).toMatch(/\d+\.\d{2}s/);
    });

    it('should display average duration in milliseconds', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Avg Duration');
      expect(html).toContain('ms');
    });

    it('should display total retries', () => {
      const summary = mockTestReport.summary;
      const html = reporter.generateSummarySection(summary);

      expect(html).toContain('Total Retries');
      expect(html).toContain(String(summary.totalRetries));
    });
  });

  describe('generateChartsSection', () => {
    it('should generate charts section with canvas elements', () => {
      const html = reporter.generateChartsSection(mockTestReport);

      expect(html).toContain('charts-section');
      expect(html).toContain('passFailChart');
      expect(html).toContain('durationChart');
    });

    it('should include chart titles', () => {
      const html = reporter.generateChartsSection(mockTestReport);

      expect(html).toContain('Test Results Distribution');
      expect(html).toContain('Duration by Test Suite');
    });
  });

  describe('generateTestResultsSection', () => {
    it('should generate test results table', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('test-results-section');
      expect(html).toContain('test-results-table');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
    });

    it('should include filter controls', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('filter-controls');
      expect(html).toContain('filter-passed');
      expect(html).toContain('filter-failed');
      expect(html).toContain('filter-skipped');
    });

    it('should include search input', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('search-tests');
      expect(html).toContain('Search tests...');
    });

    it('should include table headers', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('<th>Status</th>');
      expect(html).toContain('<th>Test Name</th>');
      expect(html).toContain('<th>File</th>');
      expect(html).toContain('<th>Duration</th>');
      expect(html).toContain('<th>Retries</th>');
      expect(html).toContain('<th>Actions</th>');
    });

    it('should generate row for each test', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      mockTestReport.tests.forEach((test) => {
        expect(html).toContain(test.name);
      });
    });

    it('should include details button for each test', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('btn-details');
      expect(html).toContain('Details');
    });

    it('should include filter and search JavaScript functions', () => {
      const html = reporter.generateTestResultsSection(mockTestReport.tests);

      expect(html).toContain('function toggleDetails');
      expect(html).toContain('function filterTests');
      expect(html).toContain('function searchTests');
    });
  });

  describe('formatTestDetails', () => {
    it('should format test information', () => {
      const test = mockTestReport.tests[0];
      const html = reporter.formatTestDetails(test);

      expect(html).toContain('test-details-content');
      expect(html).toContain(test.id);
      expect(html).toContain(test.filePath);
    });

    it('should include error section for failed tests', () => {
      const failedTest = mockTestReport.failedTests[0];
      const html = reporter.formatTestDetails(failedTest);

      expect(html).toContain('Error Information');
      expect(html).toContain('error-message');
    });

    it('should include stack trace when available', () => {
      const failedTest = mockTestReport.failedTests[0];
      const html = reporter.formatTestDetails(failedTest);

      if (failedTest.error?.stack) {
        expect(html).toContain('stack-trace');
        expect(html).toContain(failedTest.error.stack);
      }
    });

    it('should include comparison for assertion errors', () => {
      const testWithComparison = createTestWithComparison();
      const html = reporter.formatTestDetails(testWithComparison);

      expect(html).toContain('comparison');
      expect(html).toContain('Expected');
      expect(html).toContain('Actual');
    });

    it('should include metadata when present', () => {
      const testWithMetadata = createTestWithMetadata();
      const html = reporter.formatTestDetails(testWithMetadata);

      expect(html).toContain('Metadata');
      expect(html).toContain('metadata');
    });

    it('should include tags when present', () => {
      const testWithTags = createTestWithTags();
      const html = reporter.formatTestDetails(testWithTags);

      expect(html).toContain('Tags');
    });
  });

  describe('generateFailedTestsSection', () => {
    it('should generate failed tests section', () => {
      const html = reporter.generateFailedTestsSection(mockTestReport.failedTests);

      expect(html).toContain('failed-tests-section');
      expect(html).toContain('Failed Tests');
    });

    it('should show count of failed tests', () => {
      const html = reporter.generateFailedTestsSection(mockTestReport.failedTests);

      expect(html).toContain(`(${mockTestReport.failedTests.length})`);
    });

    it('should include card for each failed test', () => {
      const html = reporter.generateFailedTestsSection(mockTestReport.failedTests);

      mockTestReport.failedTests.forEach((test) => {
        expect(html).toContain(test.name);
      });
      expect(html).toContain('failed-test-card');
    });

    it('should include error details for each failed test', () => {
      const html = reporter.generateFailedTestsSection(mockTestReport.failedTests);

      expect(html).toContain('error-message');
    });
  });

  describe('generateHealedTestsSection', () => {
    it('should generate healed tests section', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('healed-tests-section');
      expect(html).toContain('Self-Healed Tests');
    });

    it('should include auto-fixed badge', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('🤖 Auto-Fixed');
      expect(html).toContain('badge-healed');
    });

    it('should show healing strategy', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('Strategy');
    });

    it('should show healing duration', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('Duration');
    });

    it('should show healing cost', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('Cost');
    });

    it('should show cache hit badge when applicable', () => {
      const healedTests = createHealedTestsWithCache();
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('Cache Hit');
    });

    it('should show generated fix when available', () => {
      const healedTests = mockTestReport.healedTests || [];
      const html = reporter.generateHealedTestsSection(healedTests);

      expect(html).toContain('Generated Fix');
    });
  });

  describe('generatePerformanceSection', () => {
    it('should generate performance section', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('performance-section');
      expect(html).toContain('Performance Metrics');
    });

    it('should show total duration', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('Total Duration');
    });

    it('should show average duration', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('Average Duration');
    });

    it('should show tests per second', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('Tests/Second');
    });

    it('should include slowest tests table', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('Slowest Tests');
      metrics.slowestTests.forEach((test) => {
        expect(html).toContain(test.name);
      });
    });

    it('should include fastest tests table', () => {
      const metrics = mockTestReport.performanceMetrics!;
      const html = reporter.generatePerformanceSection(metrics);

      expect(html).toContain('Fastest Tests');
      metrics.fastestTests.forEach((test) => {
        expect(html).toContain(test.name);
      });
    });

    it('should show memory usage when available', () => {
      const metricsWithMemory = createPerformanceMetricsWithMemory();
      const html = reporter.generatePerformanceSection(metricsWithMemory);

      expect(html).toContain('Peak Memory');
    });
  });

  describe('generateEnvironmentSection', () => {
    it('should generate environment section', () => {
      const env = mockTestReport.environment!;
      const html = reporter.generateEnvironmentSection(env);

      expect(html).toContain('environment-section');
      expect(html).toContain('Environment Information');
    });

    it('should show OS information', () => {
      const env = mockTestReport.environment!;
      const html = reporter.generateEnvironmentSection(env);

      expect(html).toContain('OS');
      expect(html).toContain(env.os);
    });

    it('should show Node.js version', () => {
      const env = mockTestReport.environment!;
      const html = reporter.generateEnvironmentSection(env);

      expect(html).toContain('Node.js');
      expect(html).toContain(env.nodeVersion);
    });

    it('should show Playwright version when available', () => {
      const env = mockTestReport.environment!;
      const html = reporter.generateEnvironmentSection(env);

      if (env.playwrightVersion) {
        expect(html).toContain('Playwright');
        expect(html).toContain(env.playwrightVersion);
      }
    });

    it('should show CI information when available', () => {
      const envWithCI = createEnvironmentWithCI();
      const html = reporter.generateEnvironmentSection(envWithCI);

      expect(html).toContain('CI/CD Environment');
      expect(html).toContain('CI Name');
    });

    it('should show browser versions when available', () => {
      const envWithBrowsers = createEnvironmentWithBrowsers();
      const html = reporter.generateEnvironmentSection(envWithBrowsers);

      expect(html).toContain('Browsers');
    });
  });

  describe('escapeHTML', () => {
    it('should escape ampersand', () => {
      const escaped = reporter.escapeHTML('A & B');
      expect(escaped).toBe('A &amp; B');
    });

    it('should escape less than', () => {
      const escaped = reporter.escapeHTML('A < B');
      expect(escaped).toBe('A &lt; B');
    });

    it('should escape greater than', () => {
      const escaped = reporter.escapeHTML('A > B');
      expect(escaped).toBe('A &gt; B');
    });

    it('should escape double quotes', () => {
      const escaped = reporter.escapeHTML('Say "Hello"');
      expect(escaped).toBe('Say &quot;Hello&quot;');
    });

    it('should escape single quotes', () => {
      const escaped = reporter.escapeHTML("It's working");
      expect(escaped).toBe('It&#039;s working');
    });

    it('should escape all special characters', () => {
      const escaped = reporter.escapeHTML('<script>alert("XSS")</script>');
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should not modify text without special characters', () => {
      const escaped = reporter.escapeHTML('Normal text');
      expect(escaped).toBe('Normal text');
    });

    it('should handle empty string', () => {
      const escaped = reporter.escapeHTML('');
      expect(escaped).toBe('');
    });
  });

  describe('saveToFile', () => {
    it('should save HTML to file', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      const html = '<html></html>';
      const filepath = '/tmp/report.html';

      await reporter.saveToFile(html, filepath);

      expect(mockWriteFile).toHaveBeenCalledWith(filepath, html, 'utf-8');
    });

    it('should throw error if file write fails', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const html = '<html></html>';
      const filepath = '/tmp/report.html';

      await expect(reporter.saveToFile(html, filepath)).rejects.toThrow(
        'Failed to save HTML report'
      );
    });
  });

  describe('XSS Prevention', () => {
    it('should escape test names to prevent XSS', () => {
      const maliciousTest: TestResult = {
        ...createMockTestResult(),
        name: '<script>alert("XSS")</script>',
      };
      const html = reporter.generateHTML({
        ...mockTestReport,
        tests: [maliciousTest],
      });

      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape error messages to prevent XSS', () => {
      const maliciousTest: TestResult = {
        ...createMockTestResult(),
        status: TestStatus.FAILED,
        error: {
          message: '<img src=x onerror=alert(1)>',
          type: ErrorType.ASSERTION,
        },
      };
      const html = reporter.generateHTML({
        ...mockTestReport,
        tests: [maliciousTest],
        failedTests: [maliciousTest],
      });

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');
    });

    it('should escape file paths to prevent XSS', () => {
      const maliciousTest: TestResult = {
        ...createMockTestResult(),
        filePath: '</td><script>alert(1)</script><td>',
      };
      const html = reporter.generateHTML({
        ...mockTestReport,
        tests: [maliciousTest],
      });

      expect(html).not.toContain('</td><script>');
      expect(html).toContain('&lt;/td&gt;');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty test list', () => {
      const emptyReport: TestReport = {
        ...mockTestReport,
        tests: [],
        failedTests: [],
      };
      const html = reporter.generateHTML(emptyReport);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Results (0)');
    });

    it('should handle report with no failed tests', () => {
      const allPassedReport: TestReport = {
        ...mockTestReport,
        failedTests: [],
      };
      const html = reporter.generateHTML(allPassedReport);

      expect(html).not.toContain('<section class="failed-tests-section">');
    });

    it('should handle report with no healed tests', () => {
      const noHealedReport: TestReport = {
        ...mockTestReport,
        healedTests: [],
      };
      const html = reporter.generateHTML(noHealedReport);

      expect(html).not.toContain('<section class="healed-tests-section">');
    });

    it('should handle test with no error stack', () => {
      const testNoStack: TestResult = {
        ...createMockTestResult(),
        status: TestStatus.FAILED,
        error: {
          message: 'Error without stack',
          type: ErrorType.UNKNOWN,
        },
      };
      const html = reporter.formatTestDetails(testNoStack);

      expect(html).toContain('Error without stack');
      expect(html).not.toContain('stack-trace');
    });

    it('should handle test with no metadata', () => {
      const testNoMetadata: TestResult = {
        ...createMockTestResult(),
        metadata: undefined,
      };
      const html = reporter.formatTestDetails(testNoMetadata);

      expect(html).not.toContain('Metadata');
    });

    it('should handle test with no tags', () => {
      const testNoTags: TestResult = {
        ...createMockTestResult(),
        tags: undefined,
      };
      const html = reporter.formatTestDetails(testNoTags);

      expect(html).not.toContain('Tags');
    });

    it('should handle very long test names', () => {
      const longNameTest: TestResult = {
        ...createMockTestResult(),
        name: 'A'.repeat(500),
      };
      const html = reporter.generateHTML({
        ...mockTestReport,
        tests: [longNameTest],
      });

      expect(html).toContain('A'.repeat(500));
    });

    it('should handle special characters in test names', () => {
      const specialCharTest: TestResult = {
        ...createMockTestResult(),
        name: 'Test with "quotes" & <brackets>',
      };
      const html = reporter.generateHTML({
        ...mockTestReport,
        tests: [specialCharTest],
      });

      expect(html).toContain('&quot;quotes&quot;');
      expect(html).toContain('&lt;brackets&gt;');
    });
  });
});

// Helper functions to create mock data

function createMockTestReport(): TestReport {
  const now = new Date();
  const tests = [
    createMockTestResult('test-1', 'GET /api/users', TestStatus.PASSED, 150),
    createMockTestResult('test-2', 'POST /api/users', TestStatus.PASSED, 200),
    createMockTestResult('test-3', 'DELETE /api/users/:id', TestStatus.FAILED, 100),
    createMockTestResult('test-4', 'PUT /api/users/:id', TestStatus.SKIPPED, 0),
  ];

  const failedTests = tests.filter((t) => t.status === TestStatus.FAILED);

  const summary: ExecutionSummary = {
    totalTests: tests.length,
    passed: tests.filter((t) => t.status === TestStatus.PASSED).length,
    failed: failedTests.length,
    skipped: tests.filter((t) => t.status === TestStatus.SKIPPED).length,
    timeout: 0,
    error: 0,
    duration: 450,
    startTime: now,
    endTime: new Date(now.getTime() + 450),
    successRate: 0.5,
    averageDuration: 112.5,
    filesExecuted: ['api-tests.spec.ts'],
    totalRetries: 2,
    byFile: {
      'api-tests.spec.ts': {
        filePath: 'api-tests.spec.ts',
        testCount: 4,
        passed: 2,
        failed: 1,
        skipped: 1,
        duration: 450,
      },
    },
  };

  const healedTests = [
    {
      test: tests[0],
      attempt: createMockHealingAttempt(),
    },
  ];

  const performanceMetrics: PerformanceMetrics = {
    totalDuration: 450,
    averageDuration: 112.5,
    slowestTests: [
      { name: 'POST /api/users', duration: 200 },
      { name: 'GET /api/users', duration: 150 },
    ],
    fastestTests: [
      { name: 'DELETE /api/users/:id', duration: 100 },
      { name: 'PUT /api/users/:id', duration: 0 },
    ],
    testsPerSecond: 8.89,
  };

  const environment: EnvironmentInfo = {
    os: 'Linux 5.10.0',
    nodeVersion: 'v18.16.0',
    playwrightVersion: '1.40.0',
  };

  return {
    summary,
    tests,
    failedTests,
    healedTests,
    performanceMetrics,
    environment,
    timestamp: now,
  };
}

function createMockTestResult(
  id = 'test-1',
  name = 'Sample Test',
  status = TestStatus.PASSED,
  duration = 100
): TestResult {
  const now = new Date();
  return {
    id,
    name,
    filePath: '/tests/api-tests.spec.ts',
    status,
    duration,
    retries: 0,
    startTime: now,
    endTime: new Date(now.getTime() + duration),
    ...(status === TestStatus.FAILED && {
      error: {
        message: 'Expected 200 but got 404',
        type: ErrorType.ASSERTION,
        stack: 'Error: Expected 200 but got 404\n    at test.spec.ts:10:5',
      },
    }),
  };
}

function createMockHealingAttempt(): HealingAttempt {
  return {
    id: 'heal-1',
    test: createMockTestResult('test-1', 'Sample Test', TestStatus.FAILED),
    strategy: HealingStrategy.AI_POWERED,
    startTime: new Date(),
    endTime: new Date(),
    duration: 5000,
    success: true,
    tokensUsed: 1500,
    estimatedCost: 0.0045,
    generatedFix: 'await expect(response.status).toBe(200);',
    cacheHit: false,
  };
}

function createTestWithComparison(): TestResult {
  return {
    ...createMockTestResult(),
    status: TestStatus.FAILED,
    error: {
      message: 'Assertion failed',
      type: ErrorType.ASSERTION,
      comparison: {
        expected: { status: 200, body: { success: true } },
        actual: { status: 404, body: { error: 'Not found' } },
      },
    },
  };
}

function createTestWithMetadata(): TestResult {
  return {
    ...createMockTestResult(),
    metadata: {
      apiVersion: '2.0',
      endpoint: '/api/users',
      method: 'GET',
    },
  };
}

function createTestWithTags(): TestResult {
  return {
    ...createMockTestResult(),
    tags: ['api', 'critical', 'smoke'],
  };
}

function createHealedTestsWithCache(): Array<{ test: TestResult; attempt: HealingAttempt }> {
  return [
    {
      test: createMockTestResult(),
      attempt: {
        ...createMockHealingAttempt(),
        cacheHit: true,
      },
    },
  ];
}

function createPerformanceMetricsWithMemory(): PerformanceMetrics {
  return {
    totalDuration: 450,
    averageDuration: 112.5,
    slowestTests: [{ name: 'Slow Test', duration: 200 }],
    fastestTests: [{ name: 'Fast Test', duration: 50 }],
    testsPerSecond: 8.89,
    memoryUsage: {
      peak: 157286400,
      average: 134217728,
    },
    cpuUsage: {
      average: 45.5,
    },
  };
}

function createEnvironmentWithCI(): EnvironmentInfo {
  return {
    os: 'Linux 5.10.0',
    nodeVersion: 'v18.16.0',
    playwrightVersion: '1.40.0',
    ci: {
      name: 'GitHub Actions',
      buildNumber: '123',
      branch: 'main',
      commit: 'abc123def456',
    },
  };
}

function createEnvironmentWithBrowsers(): EnvironmentInfo {
  return {
    os: 'Linux 5.10.0',
    nodeVersion: 'v18.16.0',
    playwrightVersion: '1.40.0',
    browsers: {
      chromium: '119.0.6045.9',
      firefox: '119.0',
      webkit: '17.4',
    },
  };
}
