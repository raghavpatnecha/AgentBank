/**
 * Email Sender Implementation (Feature 6 - Task 6.5)
 * Handles email delivery for test reports using SMTP
 */

import * as nodemailer from 'nodemailer';
import type { Transporter, SentMessageInfo } from 'nodemailer';
import type * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  EmailConfig,
  EmailOptions,
  EmailResult,
  EmailError,
  EmailErrorType,
  Attachment,
  TestReport,
  EmailValidationResult,
  ConnectionTestResult,
  EmailPreview,
  EmailTemplateData,
} from '../types/email-types.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

/**
 * Email sender class for delivering test reports
 */
export class EmailSender {
  private config: EmailConfig;
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private templateCache: Map<string, string> = new Map();

  /**
   * Create email sender instance
   * @param config - Email configuration
   */
  constructor(config: EmailConfig) {
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      testMode: config.testMode ?? false,
      exponentialBackoff: config.exponentialBackoff ?? true,
      maxAttachmentSize: config.maxAttachmentSize ?? 10 * 1024 * 1024, // 10MB
      compressAttachments: config.compressAttachments ?? true,
      priority: config.priority ?? 'normal',
    };

    this.validateConfig();
    this.initializeTransporter();
  }

  /**
   * Validate email configuration
   * @throws Error if configuration is invalid
   */
  validateConfig(): void {
    const errors: string[] = [];

    // Validate SMTP config
    if (!this.config.smtp) {
      errors.push('SMTP configuration is required');
    } else {
      if (!this.config.smtp.host) {
        errors.push('SMTP host is required');
      }
      if (!this.config.smtp.port || this.config.smtp.port < 1 || this.config.smtp.port > 65535) {
        errors.push('SMTP port must be between 1 and 65535');
      }
      if (!this.config.smtp.auth) {
        errors.push('SMTP authentication is required');
      } else {
        if (!this.config.smtp.auth.user) {
          errors.push('SMTP username is required');
        }
        if (!this.config.smtp.auth.pass) {
          errors.push('SMTP password is required');
        }
      }
    }

    // Validate email addresses
    if (!this.config.from) {
      errors.push('From address is required');
    } else if (!this.isValidEmail(this.config.from)) {
      errors.push('From address is invalid');
    }

    if (!this.config.to || this.config.to.length === 0) {
      errors.push('At least one recipient (to) is required');
    } else {
      for (const email of this.config.to) {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid recipient email: ${email}`);
        }
      }
    }

    // Validate CC addresses
    if (this.config.cc) {
      for (const email of this.config.cc) {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid CC email: ${email}`);
        }
      }
    }

    // Validate BCC addresses
    if (this.config.bcc) {
      for (const email of this.config.bcc) {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid BCC email: ${email}`);
        }
      }
    }

    // Validate reply-to
    if (this.config.replyTo && !this.isValidEmail(this.config.replyTo)) {
      errors.push('Reply-to address is invalid');
    }

    // Validate retry config
    if (this.config.maxRetries < 0) {
      errors.push('Max retries must be >= 0');
    }
    if (this.config.retryDelay < 0) {
      errors.push('Retry delay must be >= 0');
    }

    if (errors.length > 0) {
      throw new Error(`Email configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter(): void {
    // Don't initialize transporter if disabled
    if (this.config.enabled === false) {
      this.transporter = null;
      return;
    }

    const transportOptions: SMTPTransport.Options = {
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: {
        user: this.config.smtp.auth.user,
        pass: this.config.smtp.auth.pass,
      },
      connectionTimeout: this.config.smtp.connectionTimeout ?? 60000,
      greetingTimeout: this.config.smtp.greetingTimeout ?? 30000,
      socketTimeout: this.config.smtp.socketTimeout ?? 60000,
    } as SMTPTransport.Options;

    // Add pool options if configured
    if (this.config.smtp.pool) {
      (transportOptions as any).pool = this.config.smtp.pool;
      (transportOptions as any).maxConnections = this.config.smtp.maxConnections ?? 5;
      (transportOptions as any).maxMessages = this.config.smtp.maxMessages ?? 100;
    }

    // Add TLS options if configured
    if (this.config.smtp.tls) {
      transportOptions.tls = this.config.smtp.tls as any;
    }

    // Note: Rate limiting is handled at application level
    // rateDelta and rateLimit are not standard nodemailer options

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  /**
   * Test SMTP connection
   * @returns Connection test result
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.transporter) {
      return {
        success: false,
        connectionTime: 0,
        error: {
          message: 'Email sender is disabled',
          type: EmailErrorType.INVALID_CONFIG,
          retryable: false,
        },
      };
    }

    const startTime = Date.now();

    try {
      const verified = await this.transporter.verify();
      const connectionTime = Date.now() - startTime;

      return {
        success: verified,
        connectionTime: connectionTime > 0 ? connectionTime : 1, // Ensure at least 1ms
        greeting: 'Connection verified successfully',
      };
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      return {
        success: false,
        connectionTime: connectionTime > 0 ? connectionTime : 1,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Send test report via email
   * @param report - Test report to send
   * @param htmlReport - HTML report content
   * @returns Email send result
   */
  async sendReport(report: TestReport, htmlReport: string): Promise<EmailResult> {
    const subject = this.buildEmailSubject(report);
    const body = this.buildEmailBody(report);
    const attachments: Attachment[] = [];

    // Add HTML report as attachment if configured
    if (this.config.attachReport && htmlReport) {
      const attachment = await this.attachReport(htmlReport);
      attachments.push(attachment);
    }

    const emailOptions: EmailOptions = {
      from: this.config.fromName
        ? `${this.config.fromName} <${this.config.from}>`
        : this.config.from,
      to: this.config.to,
      cc: this.config.cc,
      bcc: this.config.bcc,
      replyTo: this.config.replyTo,
      subject,
      html: body,
      attachments,
      priority: this.config.priority,
      headers: this.config.headers,
    };

    return this.sendEmail(emailOptions);
  }

  /**
   * Send email with options
   * @param options - Email options
   * @returns Email send result
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        error: {
          message: 'Email sender is disabled',
          type: EmailErrorType.INVALID_CONFIG,
          retryable: false,
        },
      };
    }

    if (this.config.testMode) {
      // In test mode, don't actually send email
      return {
        success: true,
        messageId: `test-${Date.now()}@test.com`,
        response: 'Test mode - email not actually sent',
        accepted: Array.isArray(options.to) ? options.to : [options.to],
        rejected: [],
        testMode: true,
      };
    }

    // Validate email options
    const validation = this.validateEmailOptions(options);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Email validation failed: ${validation.errors.join(', ')}`,
          type: EmailErrorType.INVALID_CONFIG,
          retryable: false,
        },
      };
    }

    // Send with retry logic
    return this.handleRetry(
      () => this.sendEmailInternal(options),
      this.config.maxRetries
    );
  }

  /**
   * Internal email send implementation
   * @param options - Email options
   * @returns Email send result
   */
  private async sendEmailInternal(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      throw new Error('Transporter not initialized');
    }

    const startTime = Date.now();

    try {
      const info: SentMessageInfo = await this.transporter.sendMail({
        from: options.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        headers: options.headers,
        priority: options.priority,
        messageId: options.messageId,
        inReplyTo: options.inReplyTo,
        references: options.references,
      });

      const sendTime = Date.now() - startTime;

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted as string[],
        rejected: info.rejected as string[],
        sendTime,
      };
    } catch (error) {
      const sendTime = Date.now() - startTime;
      return {
        success: false,
        error: this.parseError(error),
        sendTime,
      };
    }
  }

  /**
   * Build email subject line
   * @param report - Test report
   * @returns Email subject
   */
  buildEmailSubject(report: TestReport): string {
    const status = report.execution.successRate === 1 ? 'PASSED' : 'FAILED';
    const prefix = this.config.subjectPrefix || 'API Test Report';

    let subject = `${prefix} - ${status}`;

    if (this.config.includeEnvironmentInSubject ?? true) {
      subject += ` - ${report.environment.name}`;
    }

    if (this.config.includeTimestampInSubject ?? true) {
      const timestamp = new Date(report.metadata.timestamp).toISOString().replace('T', ' ').split('.')[0];
      subject += ` - ${timestamp}`;
    }

    return subject;
  }

  /**
   * Build email body HTML
   * @param report - Test report
   * @returns Email HTML body
   */
  buildEmailBody(report: TestReport): string {
    const template = this.loadTemplate('email-template.html');

    const data: EmailTemplateData = {
      report,
      subject: this.buildEmailSubject(report),
      reportUrl: report.upload?.url,
      projectName: 'API Test Agent',
      branding: {
        companyName: 'API Test Agent',
        supportEmail: this.config.replyTo || this.config.from,
      },
    };

    return this.renderTemplate(template, data);
  }

  /**
   * Attach HTML report
   * @param htmlReport - HTML report content
   * @returns Attachment object
   */
  async attachReport(htmlReport: string): Promise<Attachment> {
    const reportBuffer = Buffer.from(htmlReport, 'utf-8');
    const reportSize = reportBuffer.length;

    // Compress if needed and configured
    if (
      this.config.compressAttachments &&
      this.config.maxAttachmentSize &&
      reportSize > this.config.maxAttachmentSize
    ) {
      const compressed = await gzip(reportBuffer);
      return {
        filename: 'test-report.html.gz',
        content: compressed,
        contentType: 'application/gzip',
        encoding: 'base64',
        size: compressed.length,
      };
    }

    return {
      filename: 'test-report.html',
      content: reportBuffer,
      contentType: 'text/html',
      encoding: 'utf-8',
      size: reportSize,
    };
  }

  /**
   * Handle retry logic with exponential backoff
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retries
   * @param currentRetry - Current retry attempt
   * @returns Function result
   */
  async handleRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    currentRetry: number = 0
  ): Promise<T> {
    try {
      const result = await fn();

      // If result is EmailResult and failed, check if retryable
      if (this.isEmailResult(result) && !result.success) {
        if (result.error?.retryable && currentRetry < maxRetries) {
          const delay = this.calculateRetryDelay(currentRetry);
          await this.sleep(delay);
          return this.handleRetry(fn, maxRetries, currentRetry + 1);
        }
        // Add retry count to result
        (result as EmailResult).retryAttempts = currentRetry;
      }

      return result;
    } catch (error) {
      const emailError = this.parseError(error);

      // Retry on retryable errors if under max retries
      if (emailError.retryable && currentRetry < maxRetries) {
        const delay = this.calculateRetryDelay(currentRetry);
        await this.sleep(delay);
        return this.handleRetry(fn, maxRetries, currentRetry + 1);
      }

      // For non-retryable errors or max retries exceeded, throw
      throw error;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param retryCount - Current retry count
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(retryCount: number): number {
    if (this.config.exponentialBackoff) {
      // Exponential backoff: 2s, 4s, 8s, 16s...
      return this.config.retryDelay * Math.pow(2, retryCount);
    }
    return this.config.retryDelay;
  }

  /**
   * Sleep for specified duration
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Type guard for EmailResult
   */
  private isEmailResult(obj: any): obj is EmailResult {
    return obj && typeof obj === 'object' && 'success' in obj;
  }

  /**
   * Parse error into EmailError
   * @param error - Error object
   * @returns EmailError
   */
  private parseError(error: any): EmailError {
    const message = error.message || 'Unknown error';
    let type = EmailErrorType.UNKNOWN;
    let retryable = false;
    let code: string | undefined;
    let responseCode: number | undefined;
    let command: string | undefined;

    // Parse error type from code or message
    if (error.code) {
      code = String(error.code);

      // Connection errors
      if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH'].includes(code)) {
        type = EmailErrorType.CONNECTION;
        retryable = true;
      }
      // Authentication errors
      else if (code === 'EAUTH') {
        type = EmailErrorType.AUTHENTICATION;
        retryable = false;
      }
      // Timeout errors
      else if (code === 'ETIMEDOUT') {
        type = EmailErrorType.TIMEOUT;
        retryable = true;
      }
    }

    // Parse SMTP response code
    if (typeof error.responseCode === 'number') {
      const code = error.responseCode;
      responseCode = code;

      if (code >= 400 && code < 500) {
        // 4xx errors are usually retryable (temporary)
        retryable = true;

        if (code === 421 || code === 450 || code === 451) {
          type = EmailErrorType.RATE_LIMIT;
        } else if (code === 452) {
          type = EmailErrorType.MESSAGE_TOO_LARGE;
          retryable = false;
        } else if (code === 454) {
          type = EmailErrorType.AUTHENTICATION;
          retryable = false;
        }
      } else if (code >= 500 && code < 600) {
        // 5xx errors (server errors)
        type = EmailErrorType.SERVER_ERROR;
        retryable = true;

        if (code === 550 || code === 551 || code === 553) {
          type = EmailErrorType.INVALID_RECIPIENT;
          retryable = false;
        } else if (code === 552) {
          type = EmailErrorType.MESSAGE_TOO_LARGE;
          retryable = false;
        }
      }
    }

    if (error.command) {
      command = error.command;
    }

    return {
      message,
      code,
      type,
      stack: error.stack,
      responseCode,
      command,
      retryable,
    };
  }

  /**
   * Validate email options
   * @param options - Email options
   * @returns Validation result
   */
  private validateEmailOptions(options: EmailOptions): EmailValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.from) {
      errors.push('From address is required');
    } else {
      // Extract email from "Name <email@example.com>" format
      const emailMatch = options.from.match(/<(.+)>/);
      const emailToValidate = (emailMatch && emailMatch[1]) ? emailMatch[1] : options.from;
      if (!this.isValidEmail(emailToValidate)) {
        errors.push('From address is invalid');
      }
    }

    if (!options.to) {
      errors.push('To address is required');
    } else {
      const toEmails = Array.isArray(options.to) ? options.to : [options.to];
      if (toEmails.length === 0) {
        errors.push('At least one recipient is required');
      }
      for (const email of toEmails) {
        if (!this.isValidEmail(email)) {
          errors.push(`Invalid recipient email: ${email}`);
        }
      }
    }

    if (!options.subject) {
      warnings.push('Subject is empty');
    }

    if (!options.text && !options.html) {
      warnings.push('Email has no content (text or html)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate email address format
   * @param email - Email address
   * @returns Whether email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Load email template from file
   * @param templateName - Template filename
   * @returns Template content
   */
  private loadTemplate(templateName: string): string {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Get current file's directory using dynamic import.meta.url
      let templatePath: string;

      // Try to use import.meta.url if available
      if (typeof import.meta !== 'undefined' && import.meta.url) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        templatePath = join(__dirname, 'templates', templateName);
      } else {
        // Fallback for environments without import.meta
        templatePath = join(process.cwd(), 'dist', 'reporting', 'templates', templateName);
      }

      const template = readFileSync(templatePath, 'utf-8');

      // Cache template
      this.templateCache.set(templateName, template);

      return template;
    } catch (error) {
      throw new Error(`Failed to load email template '${templateName}': ${error}`);
    }
  }

  /**
   * Render template with data
   * @param template - Template string
   * @param data - Template data
   * @returns Rendered HTML
   */
  private renderTemplate(template: string, data: EmailTemplateData): string {
    const { report } = data;
    const { execution, healing, environment, metadata } = report;

    // Calculate statistics
    const totalTests = execution.totalTests;
    const passed = execution.passed;
    const failed = execution.failed;
    const selfHealed = healing?.successful || 0;
    const duration = (execution.duration / 1000).toFixed(1);
    const successRate = Math.round(execution.successRate * 100);

    // Determine status
    const status = successRate === 100 ? 'PASSED' : 'FAILED';
    const statusColor = successRate === 100 ? '#22c55e' : '#ef4444';
    const statusEmoji = successRate === 100 ? '✅' : '❌';

    // Format timestamp
    const timestamp = new Date(metadata.timestamp).toISOString().replace('T', ' ').split('.')[0] + ' UTC';

    // Replace template variables
    return template
      .replace(/\{\{STATUS\}\}/g, status)
      .replace(/\{\{STATUS_COLOR\}\}/g, statusColor)
      .replace(/\{\{STATUS_EMOJI\}\}/g, statusEmoji)
      .replace(/\{\{ENVIRONMENT\}\}/g, environment.name)
      .replace(/\{\{TOTAL_TESTS\}\}/g, String(totalTests))
      .replace(/\{\{PASSED\}\}/g, String(passed))
      .replace(/\{\{FAILED\}\}/g, String(failed))
      .replace(/\{\{SELF_HEALED\}\}/g, String(selfHealed))
      .replace(/\{\{SUCCESS_RATE\}\}/g, String(successRate))
      .replace(/\{\{DURATION\}\}/g, duration)
      .replace(/\{\{TIMESTAMP\}\}/g, timestamp)
      .replace(/\{\{BASE_URL\}\}/g, environment.baseUrl)
      .replace(/\{\{NODE_VERSION\}\}/g, environment.nodeVersion)
      .replace(/\{\{REPORT_URL\}\}/g, data.reportUrl || '#')
      .replace(/\{\{SHOW_REPORT_LINK\}\}/g, data.reportUrl ? 'block' : 'none')
      .replace(/\{\{PROJECT_NAME\}\}/g, data.projectName || 'API Test Agent')
      .replace(/\{\{SUPPORT_EMAIL\}\}/g, data.branding?.supportEmail || '');
  }

  /**
   * Get email preview without sending
   * @param report - Test report
   * @param htmlReport - HTML report
   * @returns Email preview
   */
  async getPreview(report: TestReport, htmlReport: string): Promise<EmailPreview> {
    const subject = this.buildEmailSubject(report);
    const html = this.buildEmailBody(report);
    const text = this.stripHtml(html);

    let attachmentCount = 0;
    let attachmentSize = 0;

    if (this.config.attachReport && htmlReport) {
      const attachment = await this.attachReport(htmlReport);
      attachmentCount = 1;
      attachmentSize = attachment.size || 0;
    }

    const size = Buffer.from(html, 'utf-8').length + attachmentSize;

    return {
      subject,
      text,
      html,
      size,
      attachmentCount,
      attachmentSize,
    };
  }

  /**
   * Strip HTML tags from string
   * @param html - HTML string
   * @returns Plain text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Close email sender and cleanup resources
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
    this.templateCache.clear();
  }
}
