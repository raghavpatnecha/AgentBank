/**
 * Tests for JSON Reporter (Feature 6, Task 6.3)
 * Comprehensive test suite with 30+ test cases
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { JSONReporter, createJSONReporter } from '../../src/reporting/json-reporter';
import { TestReport, TestReportEntry } from '../../src/types/reporting-types';

describe('JSONReporter', () => {
  let reporter: JSONReporter;
  let testReport: TestReport;
  const testOutputDir = path.join(__dirname, '../../test-output/json-reports');

  beforeEach(async () => {
    // Clean up test output directory
    await fs.rm(testOutputDir, { recursive: true, force: true });

    // Create test report data
    testReport = createMockTestReport();

    // Create reporter with test output path
    reporter = new JSONReporter({
      outputPath: path.join(testOutputDir, 'test-report.json'),
      validateSchema: false, // Disable for most tests to avoid schema loading issues
    });
  });

  afterEach(async () => {
    // Clean up test output directory
    await fs.rm(testOutputDir, { recursive: true, force: true });
  });

  describe('Constructor and Configuration', () => {
    it('should create reporter with default configuration', () => {
      const defaultReporter = new JSONReporter();
      const config = defaultReporter.getConfig();

      expect(config.outputPath).toBe('./reports/test-report.json');
      expect(config.pretty).toBe(false);
      expect(config.indent).toBe(2);
      expect(config.validateSchema).toBe(true);
      expect(config.compress).toBe(false);
    });

    it('should create reporter with custom configuration', () => {
      const customReporter = new JSONReporter({
        outputPath: '/custom/path/report.json',
        pretty: true,
        indent: 4,
        compress: true,
      });

      const config = customReporter.getConfig();
      expect(config.outputPath).toBe('/custom/path/report.json');
      expect(config.pretty).toBe(true);
      expect(config.indent).toBe(4);
      expect(config.compress).toBe(true);
    });

    it('should create reporter using factory function', () => {
      const factoryReporter = createJSONReporter({ pretty: true });
      expect(factoryReporter).toBeInstanceOf(JSONReporter);
      expect(factoryReporter.getConfig().pretty).toBe(true);
    });

    it('should update configuration dynamically', () => {
      reporter.updateConfig({ pretty: true, indent: 4 });
      const config = reporter.getConfig();

      expect(config.pretty).toBe(true);
      expect(config.indent).toBe(4);
    });
  });

  describe('JSON Generation', () => {
    it('should generate valid JSON report', async () => {
      const json = await reporter.generateReport(testReport);

      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should generate minified JSON by default', async () => {
      const json = await reporter.generateReport(testReport);

      // Minified JSON should not contain newlines (except in strings)
      const parsedAndStringified = JSON.stringify(JSON.parse(json));
      expect(json).toBe(parsedAndStringified);
    });

    it('should generate pretty-printed JSON when configured', async () => {
      reporter.updateConfig({ pretty: true });
      const json = await reporter.generateReport(testReport);

      // Pretty JSON should contain newlines and indentation
      expect(json).toContain('\n');
      expect(json).toContain('  '); // 2-space indent
    });

    it('should use custom indent size for pretty printing', async () => {
      reporter.updateConfig({ pretty: true, indent: 4 });
      const json = await reporter.generateReport(testReport);

      expect(json).toContain('\n');
      expect(json).toContain('    '); // 4-space indent
    });

    it('should include version field', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0.0');
    });

    it('should include generatedAt timestamp', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.generatedAt).toBeDefined();
      expect(new Date(parsed.generatedAt).toISOString()).toBe(parsed.generatedAt);
    });

    it('should include summary statistics', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.total).toBe(50);
      expect(parsed.summary.passed).toBe(45);
      expect(parsed.summary.failed).toBe(3);
      expect(parsed.summary.skipped).toBe(2);
      expect(parsed.summary.duration).toBe(45200);
      expect(parsed.summary.successRate).toBe(90);
    });

    it('should include environment information', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.environment).toBeDefined();
      expect(parsed.environment.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(parsed.environment.osInfo).toBeDefined();
    });

    it('should include test results array', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.tests).toBeDefined();
      expect(Array.isArray(parsed.tests)).toBe(true);
      expect(parsed.tests.length).toBeGreaterThan(0);
    });

    it('should include self-healing statistics when available', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.selfHealing).toBeDefined();
      expect(parsed.selfHealing.totalAttempts).toBe(2);
      expect(parsed.selfHealing.successful).toBe(2);
      expect(parsed.selfHealing.successRate).toBe(100);
    });

    it('should include performance metrics when available', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.performance).toBeDefined();
      expect(parsed.performance.averageResponseTime).toBeDefined();
      expect(parsed.performance.slowestTest).toBeDefined();
      expect(parsed.performance.fastestTest).toBeDefined();
    });

    it('should exclude environment when configured', async () => {
      reporter.updateConfig({ includeEnvironment: false });
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.environment).toBeUndefined();
    });

    it('should exclude self-healing when configured', async () => {
      reporter.updateConfig({ includeSelfHealing: false });
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.selfHealing).toBeUndefined();
    });

    it('should exclude performance when configured', async () => {
      reporter.updateConfig({ includePerformance: false });
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.performance).toBeUndefined();
    });
  });

  describe('Test Entry Formatting', () => {
    it('should format test entries correctly', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const firstTest = parsed.tests[0];

      expect(firstTest.id).toBeDefined();
      expect(firstTest.name).toBeDefined();
      expect(firstTest.suite).toBeDefined();
      expect(firstTest.status).toMatch(/^(passed|failed|skipped|timeout|error)$/);
      expect(firstTest.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include request information for API tests', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const testWithRequest = parsed.tests.find((t: any) => t.request);

      expect(testWithRequest).toBeDefined();
      expect(testWithRequest.request.method).toBeDefined();
      expect(testWithRequest.request.url).toBeDefined();
    });

    it('should include response information for API tests', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const testWithResponse = parsed.tests.find((t: any) => t.response);

      expect(testWithResponse).toBeDefined();
      expect(testWithResponse.response.status).toBeDefined();
    });

    it('should include error information for failed tests', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const failedTest = parsed.tests.find((t: any) => t.status === 'failed');

      expect(failedTest).toBeDefined();
      expect(failedTest.error).toBeDefined();
      expect(failedTest.error.message).toBeDefined();
      expect(failedTest.error.type).toBeDefined();
    });

    it('should include retry information when available', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const testWithRetries = parsed.tests.find((t: any) => t.retries > 0);

      expect(testWithRetries).toBeDefined();
      expect(testWithRetries.retries).toBeGreaterThan(0);
    });

    it('should include self-healed flag when applicable', async () => {
      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);
      const healedTest = parsed.tests.find((t: any) => t.selfHealed);

      expect(healedTest).toBeDefined();
      expect(healedTest.selfHealed).toBe(true);
    });
  });

  describe('File Operations', () => {
    it('should save JSON to file', async () => {
      const json = await reporter.generateReport(testReport);
      await reporter.saveToFile(json);

      const outputPath = path.join(testOutputDir, 'test-report.json');
      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toBe(json);
    });

    it('should create output directory if it does not exist', async () => {
      const json = await reporter.generateReport(testReport);
      await reporter.saveToFile(json);

      const outputPath = path.join(testOutputDir, 'test-report.json');
      const stats = await fs.stat(outputPath);

      expect(stats.isFile()).toBe(true);
    });

    it('should save to custom file path', async () => {
      const customPath = path.join(testOutputDir, 'custom-report.json');
      const json = await reporter.generateReport(testReport);
      await reporter.saveToFile(json, customPath);

      const content = await fs.readFile(customPath, 'utf-8');
      expect(content).toBe(json);
    });

    it('should generate and save in one operation', async () => {
      const outputPath = await reporter.generateAndSave(testReport);

      expect(outputPath).toBe(path.join(testOutputDir, 'test-report.json'));

      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.version).toBe('1.0.0');
    });

    it('should parse JSON from file', async () => {
      await reporter.generateAndSave(testReport);

      const outputPath = path.join(testOutputDir, 'test-report.json');
      const parsed = await reporter.parseFromFile(outputPath);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.summary.total).toBe(50);
    });
  });

  describe('Compression', () => {
    it('should compress JSON data', async () => {
      const json = await reporter.generateReport(testReport);
      const compressed = await reporter.compress(json);

      expect(compressed).toBeInstanceOf(Buffer);
      expect(compressed.length).toBeLessThan(Buffer.from(json).length);
    });

    it('should save compressed file when configured', async () => {
      reporter.updateConfig({ compress: true });
      const outputPath = await reporter.generateAndSave(testReport);

      expect(outputPath).toBe(path.join(testOutputDir, 'test-report.json.gz'));

      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('JSON Formatting', () => {
    it('should format JSON with default settings', () => {
      const data = { test: 'value', nested: { key: 123 } };
      const json = reporter.formatJSON(data, false);

      expect(json).toBe('{"test":"value","nested":{"key":123}}');
    });

    it('should format pretty JSON with 2-space indent', () => {
      const data = { test: 'value', nested: { key: 123 } };
      reporter.updateConfig({ indent: 2 });
      const json = reporter.formatJSON(data, true);

      expect(json).toContain('\n');
      expect(json).toContain('  "test"');
    });

    it('should format pretty JSON with 4-space indent', () => {
      const data = { test: 'value' };
      reporter.updateConfig({ indent: 4 });
      const json = reporter.formatJSON(data, true);

      expect(json).toContain('    "test"');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty test array', async () => {
      const emptyReport = { ...testReport, tests: [] };
      const json = await reporter.generateReport(emptyReport);
      const parsed = JSON.parse(json);

      expect(parsed.tests).toEqual([]);
    });

    it('should handle missing optional fields', async () => {
      const minimalReport: TestReport = {
        version: '1.0.0',
        generatedAt: new Date(),
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          successRate: 0,
        },
        environment: {
          timestamp: new Date(),
          nodeVersion: 'v20.0.0',
          osInfo: 'Test OS',
        },
        tests: [],
      };

      const json = await reporter.generateReport(minimalReport);
      const parsed = JSON.parse(json);

      expect(parsed).toBeDefined();
      expect(parsed.selfHealing).toBeUndefined();
      expect(parsed.performance).toBeUndefined();
    });

    it('should handle special characters in test names', async () => {
      const reportWithSpecialChars = {
        ...testReport,
        tests: [
          {
            id: 'test-1',
            name: 'Test with "quotes" and \\backslashes\\ and <brackets>',
            suite: 'Special Characters',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const json = await reporter.generateReport(reportWithSpecialChars);
      const parsed = JSON.parse(json);

      expect(parsed.tests[0].name).toContain('quotes');
      expect(parsed.tests[0].name).toContain('backslashes');
    });

    it('should round decimal numbers in summary', async () => {
      const reportWithDecimals = {
        ...testReport,
        summary: {
          ...testReport.summary,
          successRate: 90.123456,
        },
      };

      const json = await reporter.generateReport(reportWithDecimals);
      const parsed = JSON.parse(json);

      expect(parsed.summary.successRate).toBe(90.12);
    });

    it('should handle very large test reports', async () => {
      const largeReport = {
        ...testReport,
        tests: Array.from({ length: 1000 }, (_, i) => ({
          id: `test-${i}`,
          name: `Test ${i}`,
          suite: 'Large Suite',
          status: 'passed' as const,
          duration: Math.random() * 1000,
        })),
      };

      const json = await reporter.generateReport(largeReport);
      const parsed = JSON.parse(json);

      expect(parsed.tests.length).toBe(1000);
    });

    it('should throw error when saving to invalid path', async () => {
      const invalidReporter = new JSONReporter({
        outputPath: '/invalid/path/that/does/not/exist/and/cannot/be/created/\0/report.json',
      });

      const json = await invalidReporter.generateReport(testReport);

      await expect(invalidReporter.saveToFile(json)).rejects.toThrow();
    });
  });

  describe('Metadata Handling', () => {
    it('should include custom metadata from config', async () => {
      reporter.updateConfig({
        metadata: {
          customField: 'customValue',
          buildNumber: '123',
        },
      });

      const json = await reporter.generateReport(testReport);
      const parsed = JSON.parse(json);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.customField).toBe('customValue');
      expect(parsed.metadata.buildNumber).toBe('123');
    });

    it('should merge report metadata with config metadata', async () => {
      reporter.updateConfig({
        metadata: { configKey: 'configValue' },
      });

      const reportWithMetadata = {
        ...testReport,
        metadata: { reportKey: 'reportValue' },
      };

      const json = await reporter.generateReport(reportWithMetadata);
      const parsed = JSON.parse(json);

      expect(parsed.metadata.configKey).toBe('configValue');
      expect(parsed.metadata.reportKey).toBe('reportValue');
    });
  });
});

/**
 * Create a mock test report for testing
 */
function createMockTestReport(): TestReport {
  return {
    version: '1.0.0',
    generatedAt: new Date('2025-01-08T10:30:00.000Z'),
    summary: {
      total: 50,
      passed: 45,
      failed: 3,
      skipped: 2,
      selfHealed: 2,
      duration: 45200,
      successRate: 90,
      startTime: new Date('2025-01-08T10:29:00.000Z'),
      endTime: new Date('2025-01-08T10:30:00.000Z'),
    },
    environment: {
      baseUrl: 'https://api.staging.example.com',
      environment: 'staging',
      timestamp: new Date('2025-01-08T10:30:00.000Z'),
      nodeVersion: 'v20.10.0',
      osInfo: 'Linux 5.15.0',
      platform: 'linux',
      architecture: 'x64',
      ci: {
        isCI: true,
        provider: 'github',
        buildNumber: '123',
        branch: 'main',
        commit: 'abc123def456',
        pullRequest: '42',
      },
    },
    tests: [
      {
        id: 'test-1',
        name: 'GET /users - Retrieve all users',
        suite: 'Users API',
        status: 'passed',
        duration: 125,
        startTime: new Date('2025-01-08T10:29:00.000Z'),
        endTime: new Date('2025-01-08T10:29:00.125Z'),
        request: {
          method: 'GET',
          url: '/users',
        },
        response: {
          status: 200,
          responseTime: 125,
        },
      },
      {
        id: 'test-2',
        name: 'POST /users - Create new user',
        suite: 'Users API',
        status: 'passed',
        duration: 234,
        request: {
          method: 'POST',
          url: '/users',
          body: { name: 'John Doe', email: 'john@example.com' },
        },
        response: {
          status: 201,
          responseTime: 234,
        },
      },
      {
        id: 'test-3',
        name: 'POST /orders - Create order with invalid quantity',
        suite: 'Orders API',
        status: 'failed',
        duration: 800,
        retries: 1,
        selfHealed: true,
        request: {
          method: 'POST',
          url: '/orders',
          body: { quantity: -1 },
        },
        response: {
          status: 422,
          body: { error: 'Unprocessable entity' },
        },
        error: {
          message: 'Expected status 400 but got 422',
          type: 'AssertionError',
          expected: 400,
          actual: 422,
        },
      },
      {
        id: 'test-4',
        name: 'GET /health - Health check',
        suite: 'System',
        status: 'passed',
        duration: 12,
        request: {
          method: 'GET',
          url: '/health',
        },
        response: {
          status: 200,
          responseTime: 12,
        },
      },
      {
        id: 'test-5',
        name: 'GET /orders - Retrieve orders',
        suite: 'Orders API',
        status: 'passed',
        duration: 1200,
        request: {
          method: 'GET',
          url: '/orders',
        },
        response: {
          status: 200,
          responseTime: 1200,
        },
      },
    ],
    selfHealing: {
      totalAttempts: 2,
      successful: 2,
      failed: 0,
      successRate: 100,
      byFailureType: {
        assertion: 2,
      },
      totalCost: 0.05,
    },
    performance: {
      averageResponseTime: 314.2,
      medianResponseTime: 234,
      p95ResponseTime: 1200,
      slowestTest: {
        name: 'GET /orders - Retrieve orders',
        duration: 1200,
      },
      fastestTest: {
        name: 'GET /health - Health check',
        duration: 12,
      },
      testsPerSecond: 1.11,
    },
  };
}
