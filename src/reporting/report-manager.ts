/**
 * Report Manager
 * Main orchestrator that integrates all reporting components
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ReportingConfig,
  GeneratedReports,
  SavedReports,
  ReportGenerationResult,
  EmailResult,
  UploadResults,
  ReportFormat,
  TestReport,
  ReportSummary,
  EnvironmentInfo,
  TestReportEntry,
  PerformanceMetrics,
  SelfHealingStats,
} from '../types/reporting-types.js';
import { DataAggregator } from './data-aggregator.js';
import { HTMLReporter } from './html-reporter.js';
import { JSONReporter } from './json-reporter.js';
import { JUnitReporter } from './junit-reporter.js';
import { EmailSender } from './email-sender.js';
import { StorageUploader } from './storage-uploader.js';

export class ReportManager {
  private aggregator: DataAggregator;
  private htmlReporter?: HTMLReporter;
  private jsonReporter?: JSONReporter;
  private junitReporter?: JUnitReporter;
  private emailSender?: EmailSender;
  private storageUploader?: StorageUploader;

  constructor(private config: ReportingConfig) {
    this.aggregator = new DataAggregator();
    
    if (this.config.formats.includes('html')) {
      this.htmlReporter = new HTMLReporter(this.convertHtmlConfig());
    }
    
    if (this.config.formats.includes('json')) {
      this.jsonReporter = new JSONReporter(this.config.json);
    }
    
    if (this.config.formats.includes('junit')) {
      this.junitReporter = new JUnitReporter(this.config.junit);
    }

    if (this.config.email.enabled) {
      this.emailSender = new EmailSender(this.convertEmailConfig());
    }

    if (this.config.upload.enabled) {
      this.storageUploader = new StorageUploader(this.config.upload);
    }
  }

  async generateAllReports(playwrightResults: any): Promise<ReportGenerationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('[ReportManager] Aggregating test results...');
      const aggregatedData = await this.aggregator.aggregateResults(playwrightResults);
      const reportData = this.convertToTestReport(aggregatedData);

      console.log('[ReportManager] Generating reports...');
      const reports = await this.generateReports(reportData);

      console.log('[ReportManager] Saving reports to disk...');
      const savedReports = await this.saveReports(reports);

      let emailResult: EmailResult | undefined;
      if (this.shouldSendEmail(reportData)) {
        console.log('[ReportManager] Sending email notification...');
        try {
          emailResult = await this.sendEmailReport(reportData, reports.html?.content);
        } catch (error) {
          const errorMsg = `Email sending failed: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`[ReportManager] ${errorMsg}`);
        }
      }

      let uploadResults: UploadResults | undefined;
      if (this.config.upload.enabled && this.storageUploader) {
        console.log('[ReportManager] Uploading reports to cloud storage...');
        try {
          const filesToUpload: Record<string, string> = {};
          for (const [format, report] of Object.entries(savedReports)) {
            filesToUpload[format] = report.path;
          }
          uploadResults = await this.storageUploader.uploadAll(filesToUpload);
        } catch (error) {
          const errorMsg = `Upload failed: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`[ReportManager] ${errorMsg}`);
        }
      }

      if (this.config.retention.cleanupOnGenerate) {
        console.log('[ReportManager] Cleaning up old reports...');
        try {
          await this.cleanupOldReports(this.config.retention.maxAge);
        } catch (error) {
          const errorMsg = `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
          warnings.push(errorMsg);
          console.warn(`[ReportManager] ${errorMsg}`);
        }
      }

      this.logReportLocations(savedReports);

      return {
        success: errors.length === 0,
        reports: savedReports,
        email: emailResult,
        upload: uploadResults,
        duration: Date.now() - startTime,
        errors,
        warnings,
      };
    } catch (error) {
      const errorMsg = `Report generation failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`[ReportManager] ${errorMsg}`);
      
      return {
        success: false,
        reports: {},
        duration: Date.now() - startTime,
        errors,
        warnings,
      };
    }
  }

  async generateReport(format: ReportFormat, data: TestReport): Promise<string> {
    switch (format) {
      case 'html':
        if (!this.htmlReporter) {
          throw new Error('HTML reporter not initialized');
        }
        return await this.htmlReporter.generateReport(this.convertToHTMLFormat(data));

      case 'json':
        if (!this.jsonReporter) {
          throw new Error('JSON reporter not initialized');
        }
        return await this.jsonReporter.generateReport(data);

      case 'junit':
        if (!this.junitReporter) {
          throw new Error('JUnit reporter not initialized');
        }
        return await this.junitReporter.generateReport(data);

      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  async saveReports(reports: GeneratedReports): Promise<SavedReports> {
    await fs.promises.mkdir(this.config.outputDir, { recursive: true });

    const savedReports: SavedReports = {};

    for (const [format, report] of Object.entries(reports)) {
      const filename = this.generateFilename(format as ReportFormat);
      const filepath = path.join(this.config.outputDir, filename);

      await fs.promises.writeFile(filepath, report.content, 'utf-8');

      savedReports[format] = {
        format: report.format,
        path: filepath,
        size: report.size,
        savedAt: new Date(),
      };
    }

    return savedReports;
  }

  async sendEmailReport(report: TestReport, htmlReport?: string): Promise<EmailResult> {
    if (!this.emailSender) {
      throw new Error('Email sender not initialized');
    }

    try {
      const subject = this.generateEmailSubject(report);
      const html = htmlReport || this.generateEmailBody(report);

      const result = await this.emailSender.sendEmail({
        from: this.config.email.from,
        to: this.config.email.recipients,
        cc: this.config.email.cc,
        bcc: this.config.email.bcc,
        subject,
        html,
        attachments: this.config.email.attachReport ? [] : [],
      });

      return {
        success: true,
        messageId: result.messageId,
        recipients: this.config.email.recipients,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        recipients: this.config.email.recipients,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async uploadReports(reports: GeneratedReports): Promise<UploadResults> {
    if (!this.storageUploader) {
      throw new Error('Storage uploader not initialized');
    }

    const files: Record<string, string> = {};
    for (const [format, report] of Object.entries(reports)) {
      if (report.path) {
        files[format] = report.path;
      }
    }

    return await this.storageUploader.uploadAll(files);
  }

  getReportPath(format: ReportFormat): string {
    const filename = this.generateFilename(format);
    return path.join(this.config.outputDir, filename);
  }

  logReportLocations(savedReports: SavedReports): void {
    console.log('\n========================================');
    console.log('📊 Reports Generated Successfully!');
    console.log('========================================\n');

    for (const [format, report] of Object.entries(savedReports)) {
      const sizeKb = (report.size / 1024).toFixed(2);
      console.log(`  ${format.toUpperCase()}: ${report.path} (${sizeKb} KB)`);
    }

    console.log('\n========================================\n');
  }

  async cleanupOldReports(maxAge: number): Promise<number> {
    try {
      const files = await fs.promises.readdir(this.config.outputDir);
      const now = Date.now();
      const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.outputDir, file);
        const stats = await fs.promises.stat(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`[ReportManager] Cleaned up ${deletedCount} old report(s)`);
      return deletedCount;
    } catch (error) {
      console.error(`[ReportManager] Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
      return 0;
    }
  }

  private async generateReports(data: TestReport): Promise<GeneratedReports> {
    const reports: GeneratedReports = {};

    if (this.config.parallel) {
      const generators = await Promise.all(
        this.config.formats.map(async (format: ReportFormat) => ({
          format,
          content: await this.generateReport(format, data),
        }))
      );

      for (const { format, content } of generators) {
        reports[format] = {
          format,
          content,
          size: Buffer.byteLength(content, 'utf-8'),
          generatedAt: new Date(),
        };
      }
    } else {
      for (const format of this.config.formats) {
        const content = await this.generateReport(format, data);
        reports[format] = {
          format,
          content,
          size: Buffer.byteLength(content, 'utf-8'),
          generatedAt: new Date(),
        };
      }
    }

    return reports;
  }

  private convertToTestReport(aggregatedData: any): TestReport {
    const tests: TestReportEntry[] = [];
    
    const collectTests = (suite: any): void => {
      if (suite.tests) {
        suite.tests.forEach((test: any) => {
          tests.push({
            id: test.id,
            name: test.title,
            suite: suite.title || suite.file,
            status: test.status === 'timedOut' ? 'timeout' : test.status,
            duration: test.duration,
            startTime: test.metadata?.startTime,
            endTime: test.metadata?.endTime,
            retries: test.retries,
            error: test.metadata?.error ? {
              message: test.metadata.error.message,
              type: test.metadata.error.name || 'Error',
              stack: test.metadata.error.stack,
            } : undefined,
          });
        });
      }
      if (suite.suites) {
        suite.suites.forEach(collectTests);
      }
    };

    aggregatedData.suites.forEach(collectTests);

    const summary: ReportSummary = {
      total: aggregatedData.summary.totalTests,
      passed: aggregatedData.summary.passedTests,
      failed: aggregatedData.summary.failedTests,
      skipped: aggregatedData.summary.skippedTests,
      duration: aggregatedData.summary.totalDuration,
      successRate: aggregatedData.summary.passRate,
      startTime: aggregatedData.summary.startTime,
      endTime: aggregatedData.summary.endTime,
    };

    const environment: EnvironmentInfo = {
      nodeVersion: aggregatedData.environment.nodeVersion,
      osInfo: aggregatedData.environment.os,
      platform: aggregatedData.environment.platform,
      architecture: aggregatedData.environment.arch,
      timestamp: new Date(),
      ci: aggregatedData.environment.ci ? {
        isCI: true,
        provider: aggregatedData.environment.ciProvider,
        branch: aggregatedData.environment.branch,
        commit: aggregatedData.environment.commit,
      } : undefined,
    };

    const performance: PerformanceMetrics = {
      averageResponseTime: aggregatedData.summary.avgDuration,
    };

    const selfHealing: SelfHealingStats = {
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
    };

    return {
      version: '1.0.0',
      generatedAt: new Date(),
      summary,
      environment,
      tests,
      selfHealing,
      performance,
    };
  }

  private convertToHTMLFormat(data: TestReport): any {
    return {
      summary: {
        totalTests: data.summary.total,
        passedTests: data.summary.passed,
        failedTests: data.summary.failed,
        skippedTests: data.summary.skipped,
        duration: data.summary.duration,
        startTime: data.summary.startTime || new Date(),
        endTime: data.summary.endTime || new Date(),
        passRate: data.summary.successRate,
      },
      tests: data.tests.map(test => ({
        id: test.id,
        name: test.name,
        status: test.status,
        duration: test.duration,
        error: test.error,
        retries: test.retries || 0,
      })),
      environment: {
        os: data.environment.osInfo,
        platform: data.environment.platform || 'unknown',
        node: data.environment.nodeVersion,
        ci: data.environment.ci?.isCI || false,
      },
      healingStats: data.selfHealing || { attempts: [], metricsHistory: [] },
    };
  }

  private shouldSendEmail(report: TestReport): boolean {
    if (!this.config.email.enabled || !this.emailSender) {
      return false;
    }

    if (this.config.email.onlyOnFailure) {
      return report.summary.failed > 0;
    }

    return true;
  }

  private generateFilename(format: ReportFormat): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace(/T/, '_')
      .substring(0, 19);

    const pattern = this.config.filenamePattern || 'test-report-{timestamp}.{format}';
    return pattern
      .replace('{timestamp}', timestamp)
      .replace('{format}', format);
  }

  private generateEmailSubject(report: TestReport): string {
    const { passed, failed, total } = report.summary;
    const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
    return `${status} - Test Report: ${passed}/${total} tests passed`;
  }

  private generateEmailBody(report: TestReport): string {
    const s = report.summary;
    return `
      <h1>Test Report</h1>
      <h2>Summary</h2>
      <ul>
        <li>Total Tests: ${s.total}</li>
        <li>Passed: ${s.passed}</li>
        <li>Failed: ${s.failed}</li>
        <li>Skipped: ${s.skipped}</li>
        <li>Success Rate: ${s.successRate.toFixed(1)}%</li>
        <li>Duration: ${(s.duration / 1000).toFixed(2)}s</li>
      </ul>
    `;
  }

  private convertHtmlConfig(): any {
    return {
      outputDir: this.config.outputDir,
      title: this.config.html.title,
      includeCharts: this.config.html.includeCharts,
      darkMode: this.config.html.theme === 'dark',
    };
  }

  private convertEmailConfig(): any {
    return {
      enabled: this.config.email.enabled,
      smtp: {
        host: this.config.email.host,
        port: this.config.email.port,
        secure: this.config.email.secure,
        auth: this.config.email.auth,
      },
      from: this.config.email.from,
      testMode: false,
    };
  }
}
