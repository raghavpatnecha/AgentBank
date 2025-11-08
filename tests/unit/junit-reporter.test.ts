/**
 * Tests for JUnit XML Reporter (Feature 6, Task 6.4)
 * Comprehensive test suite with 35+ test cases
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { JUnitReporter, createJUnitReporter } from '../../src/reporting/junit-reporter';
import { TestReport } from '../../src/types/reporting-types';

describe('JUnitReporter', () => {
  let reporter: JUnitReporter;
  let testReport: TestReport;
  const testOutputDir = path.join(__dirname, '../../test-output/junit-reports');

  beforeEach(async () => {
    // Clean up test output directory
    await fs.rm(testOutputDir, { recursive: true, force: true });

    // Create test report data
    testReport = createMockTestReport();

    // Create reporter with test output path
    reporter = new JUnitReporter({
      outputPath: path.join(testOutputDir, 'junit-report.xml'),
    });
  });

  afterEach(async () => {
    // Clean up test output directory
    await fs.rm(testOutputDir, { recursive: true, force: true });
  });

  describe('Constructor and Configuration', () => {
    it('should create reporter with default configuration', () => {
      const defaultReporter = new JUnitReporter();
      const config = defaultReporter.getConfig();

      expect(config.outputPath).toBe('./reports/junit-report.xml');
      expect(config.suiteName).toBe('API Tests');
      expect(config.includeSystemOut).toBe(true);
      expect(config.includeSystemErr).toBe(true);
      expect(config.includeProperties).toBe(true);
      expect(config.validateXML).toBe(true);
    });

    it('should create reporter with custom configuration', () => {
      const customReporter = new JUnitReporter({
        outputPath: '/custom/path/report.xml',
        suiteName: 'Custom Test Suite',
        includeSystemOut: false,
        includeSystemErr: false,
      });

      const config = customReporter.getConfig();
      expect(config.outputPath).toBe('/custom/path/report.xml');
      expect(config.suiteName).toBe('Custom Test Suite');
      expect(config.includeSystemOut).toBe(false);
      expect(config.includeSystemErr).toBe(false);
    });

    it('should create reporter using factory function', () => {
      const factoryReporter = createJUnitReporter({ suiteName: 'Factory Tests' });
      expect(factoryReporter).toBeInstanceOf(JUnitReporter);
      expect(factoryReporter.getConfig().suiteName).toBe('Factory Tests');
    });

    it('should update configuration dynamically', () => {
      reporter.updateConfig({ suiteName: 'Updated Suite', includeSystemOut: false });
      const config = reporter.getConfig();

      expect(config.suiteName).toBe('Updated Suite');
      expect(config.includeSystemOut).toBe(false);
    });

    it('should set hostname from OS by default', () => {
      const config = reporter.getConfig();
      expect(config.hostname).toBeDefined();
      expect(config.hostname.length).toBeGreaterThan(0);
    });

    it('should allow custom hostname', () => {
      const customReporter = new JUnitReporter({ hostname: 'custom-host' });
      expect(customReporter.getConfig().hostname).toBe('custom-host');
    });
  });

  describe('XML Generation', () => {
    it('should generate valid XML report', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<testsuites');
      expect(xml).toContain('</testsuites>');
    });

    it('should include XML declaration', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });

    it('should include testsuites root element', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<testsuites');
      expect(xml).toContain('name="API Tests"');
      expect(xml).toContain('tests="5"');
      expect(xml).toContain('failures="1"');
    });

    it('should include testsuite elements', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<testsuite');
      expect(xml).toContain('name="Users API"');
      expect(xml).toContain('name="Orders API"');
    });

    it('should include testcase elements', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<testcase');
      expect(xml).toContain('name="GET /users - Retrieve all users"');
      expect(xml).toContain('classname="Users API"');
    });

    it('should calculate total statistics correctly', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('tests="5"');
      expect(xml).toContain('failures="1"');
      expect(xml).toContain('errors="0"');
      expect(xml).toContain('skipped="0"');
    });

    it('should convert duration to seconds', async () => {
      const xml = await reporter.generateReport(testReport);

      // 125ms should be 0.125 seconds
      expect(xml).toContain('time="0.125"');
    });

    it('should include timestamp in ISO format', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('timestamp="2025-01-08T10:29:00.000Z"');
    });
  });

  describe('Test Suite Structure', () => {
    it('should group tests by suite name', async () => {
      const xml = await reporter.generateReport(testReport);

      // Should have separate suites for Users API and Orders API
      const usersSuiteMatch = xml.match(/<testsuite name="Users API".*?<\/testsuite>/s);
      const ordersSuiteMatch = xml.match(/<testsuite name="Orders API".*?<\/testsuite>/s);

      expect(usersSuiteMatch).toBeTruthy();
      expect(ordersSuiteMatch).toBeTruthy();
    });

    it('should calculate suite-level statistics', async () => {
      const xml = await reporter.generateReport(testReport);

      // Users API has 2 tests, both passed
      expect(xml).toMatch(/<testsuite name="Users API"[^>]*tests="2"/);
      expect(xml).toMatch(/<testsuite name="Users API"[^>]*failures="0"/);
    });

    it('should include hostname in testsuite', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toMatch(/<testsuite[^>]*hostname="[^"]+"/);
    });
  });

  describe('Test Case Formatting', () => {
    it('should format test case with name and classname', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('name="GET /users - Retrieve all users"');
      expect(xml).toContain('classname="Users API"');
    });

    it('should include test duration in seconds', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toMatch(/time="\d+\.\d{3}"/);
    });

    it('should mark failed tests with failure element', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<failure');
      expect(xml).toContain('message="Expected status 400 but got 422"');
      expect(xml).toContain('type="AssertionError"');
    });

    it('should include failure details', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('Expected: 400');
      expect(xml).toContain('Actual: 422');
    });

    it('should mark skipped tests correctly', async () => {
      const reportWithSkipped = {
        ...testReport,
        tests: [
          ...testReport.tests,
          {
            id: 'test-skip',
            name: 'Skipped test',
            suite: 'System',
            status: 'skipped' as const,
            duration: 0,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithSkipped);

      expect(xml).toContain('<skipped/>');
    });
  });

  describe('Properties Element', () => {
    it('should include properties element when enabled', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<properties>');
      expect(xml).toContain('</properties>');
    });

    it('should include environment properties', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<property name="baseUrl"');
      expect(xml).toContain('<property name="environment"');
      expect(xml).toContain('<property name="nodeVersion"');
      expect(xml).toContain('<property name="osInfo"');
    });

    it('should include CI properties when available', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<property name="ci.provider"');
      expect(xml).toContain('<property name="ci.buildNumber"');
      expect(xml).toContain('<property name="ci.branch"');
      expect(xml).toContain('<property name="ci.commit"');
    });

    it('should include custom properties from config', async () => {
      reporter.updateConfig({
        properties: {
          customKey: 'customValue',
          anotherKey: 'anotherValue',
        },
      });

      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<property name="customKey" value="customValue"');
      expect(xml).toContain('<property name="anotherKey" value="anotherValue"');
    });

    it('should exclude properties when disabled', async () => {
      reporter.updateConfig({ includeProperties: false });
      const xml = await reporter.generateReport(testReport);

      expect(xml).not.toContain('<properties>');
    });
  });

  describe('System Output', () => {
    it('should include system-out element when enabled', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<system-out>');
      expect(xml).toContain('</system-out>');
    });

    it('should include test execution summary in system-out', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('Test Execution Summary');
      expect(xml).toContain('Total Tests: 5');
      expect(xml).toContain('Passed: 4');
      expect(xml).toContain('Failed: 1');
    });

    it('should include self-healing stats in system-out when available', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('Self-Healing Statistics');
      expect(xml).toContain('Total Attempts: 2');
      expect(xml).toContain('Successful: 2');
    });

    it('should include request/response in test-level system-out', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('Request: GET /users');
      expect(xml).toContain('Response Status: 200');
    });

    it('should exclude system-out when disabled', async () => {
      reporter.updateConfig({ includeSystemOut: false });
      const xml = await reporter.generateReport(testReport);

      expect(xml).not.toContain('<system-out>');
    });
  });

  describe('System Error Output', () => {
    it('should include system-err for failed tests when enabled', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('<system-err>');
      expect(xml).toContain('Failed Tests');
    });

    it('should list failed test details in system-err', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toContain('Test: POST /orders - Create order with invalid quantity');
      expect(xml).toContain('Error: Expected status 400 but got 422');
    });

    it('should exclude system-err when disabled', async () => {
      reporter.updateConfig({ includeSystemErr: false });
      const xml = await reporter.generateReport(testReport);

      expect(xml).not.toContain('<system-err>');
    });

    it('should not include system-err when no tests failed', async () => {
      const passingReport = {
        ...testReport,
        tests: testReport.tests.filter((t) => t.status === 'passed'),
        summary: {
          ...testReport.summary,
          failed: 0,
        },
      };

      const xml = await reporter.generateReport(passingReport);

      // system-err should be empty or only contain CDATA wrapper
      const systemErrMatch = xml.match(/<system-err><!\[CDATA\[(.*?)\]\]><\/system-err>/s);
      if (systemErrMatch) {
        expect(systemErrMatch[1].trim()).toBe('');
      }
    });
  });

  describe('XML Escaping', () => {
    it('should escape XML special characters', () => {
      const escaped = reporter.escapeXML('Test with <brackets> & "quotes" and \'apostrophes\'');

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&apos;');
    });

    it('should escape ampersands in test names', async () => {
      const reportWithAmpersand = {
        ...testReport,
        tests: [
          {
            id: 'test-amp',
            name: 'Test with & ampersand',
            suite: 'Special Chars',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithAmpersand);

      expect(xml).toContain('&amp;');
      expect(xml).not.toMatch(/[^&]&[^a#]/); // Should not have unescaped &
    });

    it('should escape brackets in test names', async () => {
      const reportWithBrackets = {
        ...testReport,
        tests: [
          {
            id: 'test-brackets',
            name: 'Test with <xml> tags',
            suite: 'Special Chars',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithBrackets);

      expect(xml).toContain('&lt;xml&gt;');
    });

    it('should escape quotes in attribute values', async () => {
      const reportWithQuotes = {
        ...testReport,
        tests: [
          {
            id: 'test-quotes',
            name: 'Test with "quoted" text',
            suite: 'Special Chars',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithQuotes);

      expect(xml).toContain('&quot;');
    });
  });

  describe('XML Validation', () => {
    it('should validate well-formed XML', () => {
      const validXML = '<?xml version="1.0"?><testsuites><testsuite/></testsuites>';

      expect(reporter.validateXML(validXML)).toBe(true);
    });

    it('should validate XML with self-closing tags', () => {
      const validXML = '<?xml version="1.0"?><testsuites><testcase name="test"/></testsuites>';

      expect(reporter.validateXML(validXML)).toBe(true);
    });

    it('should reject XML without declaration', () => {
      const invalidXML = '<testsuites></testsuites>';

      expect(reporter.validateXML(invalidXML)).toBe(false);
    });

    it('should reject XML without testsuites element', () => {
      const invalidXML = '<?xml version="1.0"?><root></root>';

      expect(reporter.validateXML(invalidXML)).toBe(false);
    });

    it('should validate generated XML by default', async () => {
      // Should not throw
      await expect(reporter.generateReport(testReport)).resolves.toBeDefined();
    });

    it('should skip validation when disabled', async () => {
      reporter.updateConfig({ validateXML: false });

      // Should not throw even if XML is potentially invalid
      await expect(reporter.generateReport(testReport)).resolves.toBeDefined();
    });
  });

  describe('File Operations', () => {
    it('should save XML to file', async () => {
      const xml = await reporter.generateReport(testReport);
      await reporter.saveToFile(xml);

      const outputPath = path.join(testOutputDir, 'junit-report.xml');
      const content = await fs.readFile(outputPath, 'utf-8');

      expect(content).toBe(xml);
    });

    it('should create output directory if it does not exist', async () => {
      const xml = await reporter.generateReport(testReport);
      await reporter.saveToFile(xml);

      const outputPath = path.join(testOutputDir, 'junit-report.xml');
      const stats = await fs.stat(outputPath);

      expect(stats.isFile()).toBe(true);
    });

    it('should save to custom file path', async () => {
      const customPath = path.join(testOutputDir, 'custom-junit.xml');
      const xml = await reporter.generateReport(testReport);
      await reporter.saveToFile(xml, customPath);

      const content = await fs.readFile(customPath, 'utf-8');
      expect(content).toBe(xml);
    });

    it('should generate and save in one operation', async () => {
      const outputPath = await reporter.generateAndSave(testReport);

      expect(outputPath).toBe(path.join(testOutputDir, 'junit-report.xml'));

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<?xml version="1.0"');
    });

    it('should throw error when saving to invalid path', async () => {
      const invalidReporter = new JUnitReporter({
        outputPath: '/invalid/path/that/does/not/exist/and/cannot/be/created/\0/report.xml',
      });

      const xml = await invalidReporter.generateReport(testReport);

      await expect(invalidReporter.saveToFile(xml)).rejects.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty test array', async () => {
      const emptyReport = {
        ...testReport,
        tests: [],
        summary: {
          ...testReport.summary,
          total: 0,
          passed: 0,
          failed: 0,
        },
      };

      const xml = await reporter.generateReport(emptyReport);

      expect(xml).toContain('tests="0"');
      expect(xml).toContain('<testsuites');
    });

    it('should handle tests without suite name', async () => {
      const reportWithoutSuite = {
        ...testReport,
        tests: [
          {
            id: 'test-no-suite',
            name: 'Test without suite',
            suite: '',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithoutSuite);

      // Should use "Uncategorized" as default suite
      expect(xml).toContain('name="Uncategorized"');
    });

    it('should handle very long test names', async () => {
      const longName = 'A'.repeat(1000);
      const reportWithLongName = {
        ...testReport,
        tests: [
          {
            id: 'test-long',
            name: longName,
            suite: 'Suite',
            status: 'passed' as const,
            duration: 100,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithLongName);

      expect(xml).toContain(longName);
    });

    it('should handle tests with zero duration', async () => {
      const reportWithZeroDuration = {
        ...testReport,
        tests: [
          {
            id: 'test-zero',
            name: 'Instant test',
            suite: 'Fast',
            status: 'passed' as const,
            duration: 0,
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithZeroDuration);

      expect(xml).toContain('time="0.000"');
    });

    it('should handle tests with error status', async () => {
      const reportWithError = {
        ...testReport,
        tests: [
          {
            id: 'test-error',
            name: 'Test with error',
            suite: 'Errors',
            status: 'error' as const,
            duration: 100,
            error: {
              message: 'Runtime error occurred',
              type: 'RuntimeError',
              stack: 'Error stack trace here',
            },
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithError);

      expect(xml).toContain('<error');
      expect(xml).toContain('type="RuntimeError"');
    });

    it('should handle missing error details gracefully', async () => {
      const reportWithMinimalError = {
        ...testReport,
        tests: [
          {
            id: 'test-minimal-error',
            name: 'Test with minimal error',
            suite: 'Errors',
            status: 'failed' as const,
            duration: 100,
            error: {
              message: 'Something went wrong',
              type: 'Error',
            },
          },
        ],
      };

      const xml = await reporter.generateReport(reportWithMinimalError);

      expect(xml).toContain('<failure');
      expect(xml).toContain('Something went wrong');
    });
  });

  describe('CDATA Handling', () => {
    it('should wrap system-out in CDATA', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toMatch(/<system-out><!\[CDATA\[[\s\S]*?\]\]><\/system-out>/);
    });

    it('should wrap system-err in CDATA', async () => {
      const xml = await reporter.generateReport(testReport);

      expect(xml).toMatch(/<system-err><!\[CDATA\[[\s\S]*?\]\]><\/system-err>/);
    });

    it('should wrap failure content properly', async () => {
      const xml = await reporter.generateReport(testReport);

      // Failure content should be between opening and closing tags
      expect(xml).toMatch(/<failure[^>]*>[\s\S]*?<\/failure>/);
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
      total: 5,
      passed: 4,
      failed: 1,
      skipped: 0,
      selfHealed: 1,
      duration: 2571,
      successRate: 80,
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
          stack: 'AssertionError: Expected status 400 but got 422\n    at Test.assert (test.js:123:45)',
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
        duration: 1400,
        request: {
          method: 'GET',
          url: '/orders',
        },
        response: {
          status: 200,
          responseTime: 1400,
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
      averageResponseTime: 514.2,
      medianResponseTime: 234,
      p95ResponseTime: 1400,
      slowestTest: {
        name: 'GET /orders - Retrieve orders',
        duration: 1400,
      },
      fastestTest: {
        name: 'GET /health - Health check',
        duration: 12,
      },
      testsPerSecond: 1.94,
    },
  };
}
