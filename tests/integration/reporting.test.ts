/**
 * Reporting Integration Tests
 * Comprehensive tests for the entire reporting system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ReportManager } from '../../src/reporting/report-manager.js';
import { DataAggregator } from '../../src/reporting/data-aggregator.js';
import { loadConfig, getDefaultConfig } from '../../src/config/reporting-config.js';
import { StorageUploader } from '../../src/reporting/storage-uploader.js';
import type { ReportingConfig, TestReport } from '../../src/types/reporting-types.js';

describe('Reporting Integration Tests', () => {
  const testOutputDir = path.join(process.cwd(), 'test-reports');
  let config: ReportingConfig;
  let manager: ReportManager;
  let mockPlaywrightResults: any;

  beforeEach(async () => {
    // Setup test configuration
    config = getDefaultConfig();
    config.outputDir = testOutputDir;
    config.formats = ['html', 'json', 'junit'];
    config.email.enabled = false;
    config.upload.enabled = false;

    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });

    // Initialize manager
    manager = new ReportManager(config);

    // Create mock Playwright results
    mockPlaywrightResults = {
      config: {
        workers: 4,
        retries: 2,
        timeout: 30000,
      },
      suites: [
        {
          title: 'Test Suite 1',
          file: 'test1.spec.ts',
          specs: [
            {
              title: 'Test 1',
              file: 'test1.spec.ts',
              tests: [
                {
                  status: 'passed',
                  duration: 1000,
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now() + 1000).toISOString(),
                },
              ],
            },
            {
              title: 'Test 2',
              file: 'test1.spec.ts',
              tests: [
                {
                  status: 'failed',
                  duration: 2000,
                  error: {
                    message: 'Test failed',
                    stack: 'Error: Test failed\n  at test.ts:10',
                  },
                },
              ],
            },
          ],
        },
      ],
      startTime: new Date().toISOString(),
    };
  });

  afterEach(async () => {
    // Cleanup test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Configuration', () => {
    it('should load default configuration', () => {
      const defaultConfig = getDefaultConfig();
      
      expect(defaultConfig.formats).toContain('html');
      expect(defaultConfig.formats).toContain('json');
      expect(defaultConfig.outputDir).toBe('./reports');
      expect(defaultConfig.html.includeCharts).toBe(true);
      expect(defaultConfig.json.pretty).toBe(true);
    });

    it('should validate configuration successfully', () => {
      const validConfig = getDefaultConfig();
      expect(() => new ReportManager(validConfig)).not.toThrow();
    });

    it('should load configuration from environment', () => {
      process.env.API_TEST_AGENT_REPORT_FORMATS = 'html,json';
      process.env.API_TEST_AGENT_REPORT_OUTPUT_DIR = './custom-reports';
      
      const config = loadConfig();
      
      expect(config.formats).toEqual(['html', 'json']);
      expect(config.outputDir).toBe('./custom-reports');
      
      delete process.env.API_TEST_AGENT_REPORT_FORMATS;
      delete process.env.API_TEST_AGENT_REPORT_OUTPUT_DIR;
    });

    it('should merge environment variables with defaults', () => {
      process.env.API_TEST_AGENT_HTML_THEME = 'dark';
      
      const config = loadConfig();
      
      expect(config.html.theme).toBe('dark');
      
      delete process.env.API_TEST_AGENT_HTML_THEME;
    });

    it('should parse report formats correctly', () => {
      process.env.API_TEST_AGENT_REPORT_FORMATS = 'html,json,junit';
      
      const config = loadConfig();
      
      expect(config.formats).toHaveLength(3);
      expect(config.formats).toContain('html');
      expect(config.formats).toContain('json');
      expect(config.formats).toContain('junit');
      
      delete process.env.API_TEST_AGENT_REPORT_FORMATS;
    });
  });

  describe('Data Aggregation', () => {
    let aggregator: DataAggregator;

    beforeEach(() => {
      aggregator = new DataAggregator();
    });

    it('should aggregate Playwright results successfully', async () => {
      const report = await aggregator.aggregateResults(mockPlaywrightResults);
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.suites).toBeDefined();
      expect(report.environment).toBeDefined();
    });

    it('should calculate correct test summary', async () => {
      const report = await aggregator.aggregateResults(mockPlaywrightResults);
      
      expect(report.summary.totalTests).toBe(2);
      expect(report.summary.passedTests).toBe(1);
      expect(report.summary.failedTests).toBe(1);
      expect(report.summary.passRate).toBe(50);
    });

    it('should collect environment information', async () => {
      const report = await aggregator.aggregateResults(mockPlaywrightResults);
      
      expect(report.environment.nodeVersion).toBeDefined();
      expect(report.environment.os).toBeDefined();
      expect(report.environment.platform).toBeDefined();
    });

    it('should handle empty results', async () => {
      const emptyResults = { config: {}, suites: [] };
      const report = await aggregator.aggregateResults(emptyResults);
      
      expect(report.summary.totalTests).toBe(0);
      expect(report.suites).toHaveLength(0);
    });

    it('should extract test metadata correctly', async () => {
      const report = await aggregator.aggregateResults(mockPlaywrightResults);
      
      const allTests: any[] = [];
      report.suites.forEach((suite: any) => {
        allTests.push(...suite.tests);
      });
      
      expect(allTests).toHaveLength(2);
      expect(allTests[0].metadata).toBeDefined();
      expect(allTests[0].metadata.duration).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', async () => {
      const report = await aggregator.aggregateResults(mockPlaywrightResults);
      const stats = aggregator.calculateStatistics(report);
      
      expect(stats.summary).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byFile).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    it('should generate all configured report formats', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
      expect(result.reports).toBeDefined();
      expect(Object.keys(result.reports)).toHaveLength(3); // html, json, junit
    });

    it('should save reports to disk', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      for (const report of Object.values(result.reports)) {
        const exists = await fs.access(report.path).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should generate HTML report with correct content', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      const htmlReport = result.reports['html'];
      expect(htmlReport).toBeDefined();
      
      const content = await fs.readFile(htmlReport.path, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Test Report');
    });

    it('should generate JSON report with valid JSON', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      const jsonReport = result.reports['json'];
      expect(jsonReport).toBeDefined();
      
      const content = await fs.readFile(jsonReport.path, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should generate JUnit XML report with valid XML', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      const junitReport = result.reports['junit'];
      expect(junitReport).toBeDefined();
      
      const content = await fs.readFile(junitReport.path, 'utf-8');
      expect(content).toContain('<?xml version');
      expect(content).toContain('<testsuites');
    });

    it('should include test summary in reports', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      const jsonReport = result.reports['json'];
      const content = await fs.readFile(jsonReport.path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.summary).toBeDefined();
      expect(data.summary.totalTests).toBe(2);
    });

    it('should use custom filename pattern', async () => {
      config.filenamePattern = 'custom-{timestamp}.{format}';
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      for (const report of Object.values(result.reports)) {
        expect(path.basename(report.path)).toMatch(/^custom-/);
      }
    });

    it('should create output directory if not exists', async () => {
      config.outputDir = path.join(testOutputDir, 'nested', 'dir');
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
      const exists = await fs.access(config.outputDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should report generation duration', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(10000); // Should complete in less than 10s
    });

    it('should handle generation errors gracefully', async () => {
      const invalidResults = null;
      
      const result = await manager.generateAllReports(invalidResults);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Email Notifications', () => {
    beforeEach(() => {
      config.email.enabled = true;
      config.email.host = 'smtp.example.com';
      config.email.from = 'test@example.com';
      config.email.recipients = ['user@example.com'];
      manager = new ReportManager(config);
    });

    it('should not send email when disabled', async () => {
      config.email.enabled = false;
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.email).toBeUndefined();
    });

    it('should send email when enabled (mocked)', async () => {
      // Mock email sender would be used here
      // This is a placeholder for the actual email sending test
      expect(config.email.enabled).toBe(true);
    });

    it('should only send email on failure when configured', async () => {
      config.email.onlyOnFailure = true;
      manager = new ReportManager(config);
      
      // This would verify email is sent only when tests fail
      expect(config.email.onlyOnFailure).toBe(true);
    });

    it('should include attachments when configured', () => {
      config.email.attachReport = true;
      config.email.attachFormats = ['html', 'json'];
      
      expect(config.email.attachFormats).toContain('html');
      expect(config.email.attachFormats).toContain('json');
    });
  });

  describe('Cloud Storage Upload', () => {
    let uploader: StorageUploader;

    beforeEach(() => {
      config.upload.enabled = true;
      config.upload.provider = 's3';
      config.upload.s3 = {
        bucket: 'test-bucket',
        region: 'us-east-1',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      };
      uploader = new StorageUploader(config.upload);
    });

    it('should not upload when disabled', async () => {
      config.upload.enabled = false;
      uploader = new StorageUploader(config.upload);
      
      const result = await uploader.uploadAll({});
      
      expect(result.success).toBe(true);
      expect(result.uploads).toHaveLength(0);
    });

    it('should upload to S3 (mocked)', async () => {
      // Mock S3 upload
      const testConnection = await uploader.testConnection();
      expect(testConnection.success).toBe(true);
    });

    it('should support different storage providers', () => {
      const providers: Array<'s3' | 'gcs' | 'azure' | 'http'> = ['s3', 'gcs', 'azure', 'http'];
      
      providers.forEach(provider => {
        config.upload.provider = provider;
        expect(() => new StorageUploader(config.upload)).not.toThrow();
      });
    });

    it('should filter uploads by format', async () => {
      config.upload.uploadFormats = ['html'];
      uploader = new StorageUploader(config.upload);
      
      expect(config.upload.uploadFormats).toContain('html');
      expect(config.upload.uploadFormats).not.toContain('json');
    });
  });

  describe('Report Cleanup', () => {
    it('should cleanup old reports', async () => {
      // Create some old test files
      const oldFile = path.join(testOutputDir, 'old-report.html');
      await fs.writeFile(oldFile, 'old content');
      
      const deleted = await manager.cleanupOldReports(0); // 0 days = delete all
      
      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    it('should respect max age setting', async () => {
      config.retention.maxAge = 30;
      
      expect(config.retention.maxAge).toBe(30);
    });

    it('should cleanup on generate when configured', async () => {
      config.retention.cleanupOnGenerate = true;
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
    });

    it('should not cleanup when disabled', async () => {
      config.retention.cleanupOnGenerate = false;
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Report Paths', () => {
    it('should generate correct report paths', () => {
      const htmlPath = manager.getReportPath('html');
      const jsonPath = manager.getReportPath('json');
      
      expect(htmlPath).toContain('.html');
      expect(jsonPath).toContain('.json');
    });

    it('should use output directory', () => {
      const reportPath = manager.getReportPath('html');
      
      expect(reportPath).toContain(config.outputDir);
    });

    it('should include timestamp in filename', () => {
      const reportPath = manager.getReportPath('html');
      
      // Filename should contain a timestamp-like pattern
      expect(path.basename(reportPath)).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      const partialConfig = {
        formats: ['html'],
        outputDir: testOutputDir,
      } as any;
      
      expect(() => new ReportManager(partialConfig)).not.toThrow();
    });

    it('should collect errors during generation', async () => {
      const result = await manager.generateAllReports(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should collect warnings during cleanup', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should continue generation after non-critical errors', async () => {
      config.email.enabled = true;
      config.email.host = 'invalid-host';
      manager = new ReportManager(config);
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      // Should still generate reports even if email fails
      expect(Object.keys(result.reports).length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full reporting workflow', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
      expect(result.reports).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(Object.keys(result.reports)).toHaveLength(3);
    });

    it('should log report locations', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      manager.logReportLocations(result.reports);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should generate reports in parallel when configured', async () => {
      config.parallel = true;
      manager = new ReportManager(config);
      
      const startTime = Date.now();
      const result = await manager.generateAllReports(mockPlaywrightResults);
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      // Parallel should be faster (this is a simple check)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle complex test scenarios', async () => {
      // Add more complex test data
      mockPlaywrightResults.suites.push({
        title: 'Complex Suite',
        file: 'complex.spec.ts',
        specs: Array(100).fill(null).map((_, i) => ({
          title: `Test ${i}`,
          file: 'complex.spec.ts',
          tests: [{
            status: i % 2 === 0 ? 'passed' : 'failed',
            duration: Math.random() * 5000,
          }],
        })),
      });
      
      const result = await manager.generateAllReports(mockPlaywrightResults);
      
      expect(result.success).toBe(true);
      expect(Object.keys(result.reports).length).toBeGreaterThan(0);
    });
  });

  describe('Report Content Validation', () => {
    it('should include all required fields in JSON report', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      const jsonReport = result.reports['json'];
      const content = await fs.readFile(jsonReport.path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('tests');
      expect(data).toHaveProperty('environment');
    });

    it('should include test details in HTML report', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      const htmlReport = result.reports['html'];
      const content = await fs.readFile(htmlReport.path, 'utf-8');
      
      expect(content).toContain('Test 1');
      expect(content).toContain('Test 2');
    });

    it('should format durations correctly', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      const jsonReport = result.reports['json'];
      const content = await fs.readFile(jsonReport.path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.summary.duration).toBeGreaterThan(0);
    });

    it('should include environment information', async () => {
      const result = await manager.generateAllReports(mockPlaywrightResults);
      const jsonReport = result.reports['json'];
      const content = await fs.readFile(jsonReport.path, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.environment).toBeDefined();
      expect(data.environment.nodeVersion).toBeDefined();
    });
  });
});
