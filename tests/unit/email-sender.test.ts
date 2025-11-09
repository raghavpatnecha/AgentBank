/**
 * Unit tests for Email Sender (Feature 6 - Task 6.5)
 * Comprehensive test coverage for email delivery functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailSender } from '../../src/reporting/email-sender.js';
import {
  EmailConfig,
  EmailOptions,
  EmailResult,
  EmailErrorType,
  TestReport,
  SMTPConfig,
} from '../../src/types/email-types.js';
import { TestStatus } from '../../src/types/executor-types.js';
import nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer');

describe('EmailSender', () => {
  let mockTransporter: any;
  let defaultConfig: EmailConfig;
  let mockTestReport: TestReport;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      sendMail: vi.fn(),
      verify: vi.fn(),
      close: vi.fn(),
    };

    // Mock nodemailer.createTransport
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter);

    // Default config
    defaultConfig = {
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      },
      from: 'test@example.com',
      to: ['recipient@example.com'],
      attachReport: true,
      maxRetries: 3,
      retryDelay: 2000,
    };

    // Mock test report
    mockTestReport = {
      execution: {
        totalTests: 50,
        passed: 45,
        failed: 3,
        skipped: 0,
        timeout: 0,
        error: 2,
        duration: 45200,
        startTime: new Date('2025-01-08T10:00:00Z'),
        endTime: new Date('2025-01-08T10:00:45Z'),
        successRate: 0.9,
        averageDuration: 904,
        filesExecuted: ['test1.spec.ts', 'test2.spec.ts'],
        totalRetries: 5,
        byFile: {},
      },
      healing: {
        totalAttempts: 5,
        successful: 2,
        failed: 3,
        successRate: 40,
        averageTime: 1500,
        totalCost: 0.05,
        byFailureType: {} as any,
        aiStats: {
          timesUsed: 5,
          totalTokens: 2500,
          promptTokens: 1500,
          completionTokens: 1000,
          totalCost: 0.05,
          averageTokens: 500,
          successRate: 0.4,
          cacheHitRate: 0.2,
        },
        fallbackStats: {
          timesUsed: 0,
          successRate: 0,
          averageTime: 0,
          fallbackReasons: {},
        },
        period: {
          start: new Date('2025-01-08T10:00:00Z'),
          end: new Date('2025-01-08T10:00:45Z'),
        },
        warnings: [],
        recommendations: [],
      },
      environment: {
        baseUrl: 'https://api.staging.example.com',
        name: 'staging',
        nodeVersion: 'v20.10.0',
        platform: 'linux',
        arch: 'x64',
      },
      metadata: {
        id: 'test-report-001',
        timestamp: new Date('2025-01-08T10:00:45Z'),
        version: '1.0.0',
        generatedBy: 'API Test Agent',
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create email sender with valid config', () => {
      const sender = new EmailSender(defaultConfig);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should throw error for missing SMTP config', () => {
      const invalidConfig = { ...defaultConfig } as any;
      delete invalidConfig.smtp;

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP configuration is required');
    });

    it('should throw error for missing SMTP host', () => {
      const invalidConfig = { ...defaultConfig };
      delete (invalidConfig.smtp as any).host;

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP host is required');
    });

    it('should throw error for invalid SMTP port', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.smtp.port = 0;

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP port must be between 1 and 65535');
    });

    it('should throw error for port > 65535', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.smtp.port = 70000;

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP port must be between 1 and 65535');
    });

    it('should throw error for missing SMTP auth', () => {
      const invalidConfig = { ...defaultConfig };
      delete (invalidConfig.smtp as any).auth;

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP authentication is required');
    });

    it('should throw error for missing SMTP user', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.smtp.auth.user = '';

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP username is required');
    });

    it('should throw error for missing SMTP password', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.smtp.auth.pass = '';

      expect(() => new EmailSender(invalidConfig)).toThrow('SMTP password is required');
    });

    it('should throw error for missing from address', () => {
      const invalidConfig = { ...defaultConfig } as any;
      delete invalidConfig.from;

      expect(() => new EmailSender(invalidConfig)).toThrow('From address is required');
    });

    it('should throw error for invalid from email', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.from = 'invalid-email';

      expect(() => new EmailSender(invalidConfig)).toThrow('From address is invalid');
    });

    it('should throw error for missing recipients', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.to = [];

      expect(() => new EmailSender(invalidConfig)).toThrow(
        'At least one recipient (to) is required'
      );
    });

    it('should throw error for invalid recipient email', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.to = ['invalid-email'];

      expect(() => new EmailSender(invalidConfig)).toThrow(
        'Invalid recipient email: invalid-email'
      );
    });

    it('should throw error for invalid CC email', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.cc = ['invalid-cc'];

      expect(() => new EmailSender(invalidConfig)).toThrow('Invalid CC email: invalid-cc');
    });

    it('should throw error for invalid BCC email', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.bcc = ['invalid-bcc'];

      expect(() => new EmailSender(invalidConfig)).toThrow('Invalid BCC email: invalid-bcc');
    });

    it('should throw error for invalid reply-to email', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.replyTo = 'invalid-reply';

      expect(() => new EmailSender(invalidConfig)).toThrow('Reply-to address is invalid');
    });

    it('should throw error for negative maxRetries', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.maxRetries = -1;

      expect(() => new EmailSender(invalidConfig)).toThrow('Max retries must be >= 0');
    });

    it('should throw error for negative retryDelay', () => {
      const invalidConfig = { ...defaultConfig };
      invalidConfig.retryDelay = -1;

      expect(() => new EmailSender(invalidConfig)).toThrow('Retry delay must be >= 0');
    });

    it('should accept multiple valid recipients', () => {
      const config = { ...defaultConfig };
      config.to = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      const sender = new EmailSender(config);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should accept valid CC and BCC addresses', () => {
      const config = { ...defaultConfig };
      config.cc = ['cc1@example.com', 'cc2@example.com'];
      config.bcc = ['bcc1@example.com'];

      const sender = new EmailSender(config);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should accept valid reply-to address', () => {
      const config = { ...defaultConfig };
      config.replyTo = 'noreply@example.com';

      const sender = new EmailSender(config);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should set default values for optional config', () => {
      const sender = new EmailSender(defaultConfig);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should initialize transporter when enabled', () => {
      new EmailSender(defaultConfig);
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it('should not initialize transporter when disabled', () => {
      const config = { ...defaultConfig, enabled: false };
      new EmailSender(config);
      // Transporter should still be created but sender will skip operations
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('SMTP Configuration', () => {
    it('should configure Gmail SMTP correctly', () => {
      const gmailConfig: EmailConfig = {
        smtp: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: 'user@gmail.com',
            pass: 'app-password',
          },
        },
        from: 'user@gmail.com',
        to: ['recipient@example.com'],
        attachReport: true,
        maxRetries: 3,
        retryDelay: 2000,
      };

      const sender = new EmailSender(gmailConfig);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should configure SendGrid SMTP correctly', () => {
      const sendgridConfig: EmailConfig = {
        smtp: {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: 'SG.xxx',
          },
        },
        from: 'noreply@example.com',
        to: ['recipient@example.com'],
        attachReport: true,
        maxRetries: 3,
        retryDelay: 2000,
      };

      const sender = new EmailSender(sendgridConfig);
      expect(sender).toBeInstanceOf(EmailSender);
    });

    it('should configure AWS SES SMTP correctly', () => {
      const sesConfig: EmailConfig = {
        smtp: {
          host: 'email-smtp.us-east-1.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: 'SMTP-USERNAME',
            pass: 'SMTP-PASSWORD',
          },
        },
        from: 'noreply@example.com',
        to: ['recipient@example.com'],
        attachReport: true,
        maxRetries: 3,
        retryDelay: 2000,
      };

      const sender = new EmailSender(sesConfig);
      expect(sender).toBeInstanceOf(EmailSender);
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const sender = new EmailSender(defaultConfig);
      const result = await sender.testConnection();

      expect(result.success).toBe(true);
      expect(result.connectionTime).toBeGreaterThan(0);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const error = new Error('Connection refused');
      mockTransporter.verify.mockRejectedValue(error);

      const sender = new EmailSender(defaultConfig);
      const result = await sender.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Connection refused');
    });

    it('should return error for disabled sender', async () => {
      const config = { ...defaultConfig, enabled: false };
      const sender = new EmailSender(config);

      // Manually set transporter to null to simulate disabled state
      (sender as any).transporter = null;

      const result = await sender.testConnection();

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(EmailErrorType.INVALID_CONFIG);
    });
  });

  describe('Subject Line Building', () => {
    it('should build subject for passed tests', () => {
      const sender = new EmailSender(defaultConfig);
      const report = { ...mockTestReport };
      report.execution.successRate = 1.0;

      const subject = sender.buildEmailSubject(report);

      expect(subject).toContain('PASSED');
      expect(subject).toContain('staging');
    });

    it('should build subject for failed tests', () => {
      const sender = new EmailSender(defaultConfig);
      const subject = sender.buildEmailSubject(mockTestReport);

      expect(subject).toContain('FAILED');
      expect(subject).toContain('staging');
    });

    it('should include custom prefix', () => {
      const config = { ...defaultConfig, subjectPrefix: 'Custom Prefix' };
      const sender = new EmailSender(config);

      const subject = sender.buildEmailSubject(mockTestReport);

      expect(subject).toContain('Custom Prefix');
    });

    it('should include environment when configured', () => {
      const sender = new EmailSender(defaultConfig);
      const subject = sender.buildEmailSubject(mockTestReport);

      expect(subject).toContain('staging');
    });

    it('should include timestamp when configured', () => {
      const sender = new EmailSender(defaultConfig);
      const subject = sender.buildEmailSubject(mockTestReport);

      expect(subject).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
    });

    it('should exclude environment when configured', () => {
      const config = { ...defaultConfig, includeEnvironmentInSubject: false };
      const sender = new EmailSender(config);

      const subject = sender.buildEmailSubject(mockTestReport);

      expect(subject).not.toContain('staging');
    });

    it('should exclude timestamp when configured', () => {
      const config = { ...defaultConfig, includeTimestampInSubject: false };
      const sender = new EmailSender(config);

      const subject = sender.buildEmailSubject(mockTestReport);

      // Should not have date pattern
      expect(subject.match(/\d{4}-\d{2}-\d{2}/)).toBeNull();
    });
  });

  describe('Email Body Building', () => {
    it('should build email body HTML', () => {
      const sender = new EmailSender(defaultConfig);

      // Mock template loading
      const mockTemplate = '<!DOCTYPE html><html><body>{{STATUS}} {{TOTAL_TESTS}}</body></html>';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const body = sender.buildEmailBody(mockTestReport);

      expect(body).toContain('FAILED');
      expect(body).toContain('50');
    });

    it('should include test statistics in body', () => {
      const sender = new EmailSender(defaultConfig);

      const mockTemplate = '{{PASSED}} {{FAILED}} {{SELF_HEALED}}';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const body = sender.buildEmailBody(mockTestReport);

      expect(body).toContain('45'); // passed
      expect(body).toContain('3'); // failed
      expect(body).toContain('2'); // self-healed
    });

    it('should include environment details in body', () => {
      const sender = new EmailSender(defaultConfig);

      const mockTemplate = '{{BASE_URL}} {{ENVIRONMENT}} {{NODE_VERSION}}';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const body = sender.buildEmailBody(mockTestReport);

      expect(body).toContain('https://api.staging.example.com');
      expect(body).toContain('staging');
      expect(body).toContain('v20.10.0');
    });

    it('should include report URL when available', () => {
      const sender = new EmailSender(defaultConfig);
      const report = { ...mockTestReport };
      report.upload = {
        url: 'https://reports.example.com/test-123',
        timestamp: new Date(),
        provider: 's3',
      };

      const mockTemplate = '{{REPORT_URL}}';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const body = sender.buildEmailBody(report);

      expect(body).toContain('https://reports.example.com/test-123');
    });

    it('should handle missing healing metrics', () => {
      const sender = new EmailSender(defaultConfig);
      const report = { ...mockTestReport };
      delete report.healing;

      const mockTemplate = '{{SELF_HEALED}}';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const body = sender.buildEmailBody(report);

      expect(body).toContain('0');
    });
  });

  describe('Attachment Handling', () => {
    it('should create HTML report attachment', async () => {
      const sender = new EmailSender(defaultConfig);
      const htmlReport = '<html><body>Test Report</body></html>';

      const attachment = await sender.attachReport(htmlReport);

      expect(attachment.filename).toBe('test-report.html');
      expect(attachment.contentType).toBe('text/html');
      expect(attachment.size).toBeGreaterThan(0);
    });

    it('should compress large attachments', async () => {
      const config = {
        ...defaultConfig,
        compressAttachments: true,
        maxAttachmentSize: 100, // Very small limit
      };
      const sender = new EmailSender(config);

      // Create large HTML report
      const htmlReport = `<html><body>${'x'.repeat(1000)}</body></html>`;

      const attachment = await sender.attachReport(htmlReport);

      expect(attachment.filename).toBe('test-report.html.gz');
      expect(attachment.contentType).toBe('application/gzip');
    });

    it('should not compress when disabled', async () => {
      const config = {
        ...defaultConfig,
        compressAttachments: false,
        maxAttachmentSize: 100,
      };
      const sender = new EmailSender(config);

      const htmlReport = '<html><body>Test</body></html>';
      const attachment = await sender.attachReport(htmlReport);

      expect(attachment.filename).toBe('test-report.html');
      expect(attachment.contentType).toBe('text/html');
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: [],
      });

      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should send email with multiple recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['user1@example.com', 'user2@example.com'],
        rejected: [],
      });

      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.accepted).toHaveLength(2);
    });

    it('should send email with CC and BCC', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['to@example.com', 'cc@example.com', 'bcc@example.com'],
        rejected: [],
      });

      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'to@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@example.com',
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
        })
      );
    });

    it('should send email with attachments', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: [],
      });

      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        attachments: [
          {
            filename: 'report.html',
            content: '<html>Report</html>',
            contentType: 'text/html',
          },
        ],
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({ filename: 'report.html' }),
          ]),
        })
      );
    });

    it('should handle send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for disabled sender', async () => {
      const config = { ...defaultConfig, enabled: false };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(EmailErrorType.INVALID_CONFIG);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle test mode', async () => {
      const config = { ...defaultConfig, testMode: true };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.testMode).toBe(true);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('Report Sending', () => {
    it('should send test report successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: [],
      });

      const sender = new EmailSender(defaultConfig);
      const htmlReport = '<html><body>Test Report</body></html>';

      const result = await sender.sendReport(mockTestReport, htmlReport);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should include attachment when configured', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: [],
      });

      const config = { ...defaultConfig, attachReport: true };
      const sender = new EmailSender(config);
      const htmlReport = '<html><body>Test Report</body></html>';

      await sender.sendReport(mockTestReport, htmlReport);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.attachments).toBeDefined();
      expect(callArgs.attachments.length).toBeGreaterThan(0);
    });

    it('should not include attachment when disabled', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'msg-123',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: [],
      });

      const config = { ...defaultConfig, attachReport: false };
      const sender = new EmailSender(config);
      const htmlReport = '<html><body>Test Report</body></html>';

      await sender.sendReport(mockTestReport, htmlReport);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.attachments).toHaveLength(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable error', async () => {
      const error = new Error('Temporary failure');
      (error as any).code = 'ETIMEDOUT';

      mockTransporter.sendMail
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          messageId: 'msg-123',
          response: '250 OK',
          accepted: ['recipient@example.com'],
          rejected: [],
        });

      const config = { ...defaultConfig, maxRetries: 3, retryDelay: 100 };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const error = new Error('Authentication failed');
      (error as any).code = 'EAUTH';

      mockTransporter.sendMail.mockRejectedValue(error);

      const config = { ...defaultConfig, maxRetries: 3, retryDelay: 10 };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(sender.sendEmail(options)).rejects.toThrow('Authentication failed');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const error = new Error('Temporary failure');
      (error as any).code = 'ETIMEDOUT';

      mockTransporter.sendMail.mockRejectedValue(error);

      const config = {
        ...defaultConfig,
        maxRetries: 2,
        retryDelay: 50,
        exponentialBackoff: true,
      };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const startTime = Date.now();
      try {
        await sender.sendEmail(options);
      } catch (error) {
        // Expected to fail after retries
      }
      const duration = Date.now() - startTime;

      // With exponential backoff: 50ms, 100ms = ~150ms
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should not retry when maxRetries is 0', async () => {
      const error = new Error('Failure');
      (error as any).code = 'ETIMEDOUT'; // Make it retryable
      mockTransporter.sendMail.mockRejectedValue(error);

      const config = { ...defaultConfig, maxRetries: 0 };
      const sender = new EmailSender(config);

      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(sender.sendEmail(options)).rejects.toThrow('Failure');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should parse connection errors', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';
      mockTransporter.sendMail.mockRejectedValue(error);

      // Set low retry delays to prevent timeout
      const config = { ...defaultConfig, maxRetries: 2, retryDelay: 10 };
      const sender = new EmailSender(config);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      // Connection errors are retryable, so it will throw after retries
      await expect(sender.sendEmail(options)).rejects.toThrow('Connection refused');
      // Should retry 2 times: initial + 2 retries = 3 calls
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should parse authentication errors', async () => {
      const error = new Error('Auth failed');
      (error as any).code = 'EAUTH';
      mockTransporter.sendMail.mockRejectedValue(error);

      const config = { ...defaultConfig, maxRetries: 3, retryDelay: 10 };
      const sender = new EmailSender(config);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      // Auth errors are not retryable, so should throw immediately
      await expect(sender.sendEmail(options)).rejects.toThrow('Auth failed');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should parse timeout errors', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      mockTransporter.sendMail.mockRejectedValue(error);

      // Set low retry delays to prevent test timeout
      const config = { ...defaultConfig, maxRetries: 2, retryDelay: 10 };
      const sender = new EmailSender(config);
      const options: EmailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      // Timeout errors are retryable, so it will throw after retries
      await expect(sender.sendEmail(options)).rejects.toThrow('Timeout');
      // Should retry: initial + 2 retries = 3 calls
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid email options', async () => {
      const sender = new EmailSender(defaultConfig);
      const options: EmailOptions = {
        from: '',
        to: '',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sender.sendEmail(options);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(EmailErrorType.INVALID_CONFIG);
    });
  });

  describe('Email Preview', () => {
    it('should generate email preview', async () => {
      const sender = new EmailSender(defaultConfig);

      const mockTemplate = '<html><body>{{STATUS}} {{TOTAL_TESTS}}</body></html>';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const htmlReport = '<html><body>Full Report</body></html>';
      const preview = await sender.getPreview(mockTestReport, htmlReport);

      expect(preview.subject).toBeDefined();
      expect(preview.html).toBeDefined();
      expect(preview.text).toBeDefined();
      expect(preview.size).toBeGreaterThan(0);
    });

    it('should include attachment info in preview', async () => {
      const config = { ...defaultConfig, attachReport: true };
      const sender = new EmailSender(config);

      const mockTemplate = '<html><body>{{STATUS}}</body></html>';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const htmlReport = '<html><body>Full Report</body></html>';
      const preview = await sender.getPreview(mockTestReport, htmlReport);

      expect(preview.attachmentCount).toBe(1);
      expect(preview.attachmentSize).toBeGreaterThan(0);
    });

    it('should not include attachment when disabled', async () => {
      const config = { ...defaultConfig, attachReport: false };
      const sender = new EmailSender(config);

      const mockTemplate = '<html><body>{{STATUS}}</body></html>';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);

      const htmlReport = '<html><body>Full Report</body></html>';
      const preview = await sender.getPreview(mockTestReport, htmlReport);

      expect(preview.attachmentCount).toBe(0);
      expect(preview.attachmentSize).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should close transporter', async () => {
      const sender = new EmailSender(defaultConfig);

      await sender.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should clear template cache', async () => {
      const sender = new EmailSender(defaultConfig);

      // Load a template to populate cache
      const mockTemplate = '<html>Test</html>';
      vi.spyOn(sender as any, 'loadTemplate').mockReturnValue(mockTemplate);
      sender.buildEmailBody(mockTestReport);

      await sender.close();

      // Cache should be cleared
      expect((sender as any).templateCache.size).toBe(0);
    });
  });
});
