/**
 * TypeScript type definitions for Email Delivery (Feature 6 - Task 6.5)
 * Defines interfaces for email configuration, sending, and reporting
 */

import { ExecutionSummary } from './executor-types.js';
import { HealingMetricsSummary } from './self-healing-types.js';

/**
 * Email provider types
 */
export type EmailProvider = 'gmail' | 'sendgrid' | 'ses' | 'smtp' | 'custom';

/**
 * SMTP configuration
 */
export interface SMTPConfig {
  /** SMTP host */
  host: string;

  /** SMTP port (587, 465, 25) */
  port: number;

  /** Use secure connection (TLS) */
  secure: boolean;

  /** Authentication credentials */
  auth: {
    /** Username or email */
    user: string;

    /** Password or API key */
    pass: string;
  };

  /** Connection timeout in milliseconds */
  connectionTimeout?: number;

  /** Greeting timeout in milliseconds */
  greetingTimeout?: number;

  /** Socket timeout in milliseconds */
  socketTimeout?: number;

  /** TLS options */
  tls?: {
    /** Reject unauthorized certificates */
    rejectUnauthorized?: boolean;

    /** Minimum TLS version */
    minVersion?: string;
  };

  /** Pool configuration */
  pool?: boolean;

  /** Max connections in pool */
  maxConnections?: number;

  /** Max messages per connection */
  maxMessages?: number;

  /** Rate limit (messages per second) */
  rateDelta?: number;

  /** Rate limit (number of messages) */
  rateLimit?: number;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  /** SMTP configuration */
  smtp: SMTPConfig;

  /** From address */
  from: string;

  /** From name (optional) */
  fromName?: string;

  /** To addresses (multiple recipients) */
  to: string[];

  /** CC addresses (optional) */
  cc?: string[];

  /** BCC addresses (optional) */
  bcc?: string[];

  /** Reply-to address (optional) */
  replyTo?: string;

  /** Attach HTML report as file */
  attachReport: boolean;

  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Initial retry delay in milliseconds */
  retryDelay: number;

  /** Use exponential backoff for retries */
  exponentialBackoff?: boolean;

  /** Custom subject prefix */
  subjectPrefix?: string;

  /** Include environment in subject */
  includeEnvironmentInSubject?: boolean;

  /** Include timestamp in subject */
  includeTimestampInSubject?: boolean;

  /** Enable email delivery */
  enabled?: boolean;

  /** Test mode (don't actually send) */
  testMode?: boolean;

  /** Email provider type */
  provider?: EmailProvider;

  /** Custom headers */
  headers?: Record<string, string>;

  /** Email priority */
  priority?: 'high' | 'normal' | 'low';

  /** Request delivery receipt */
  requestDeliveryReceipt?: boolean;

  /** Request read receipt */
  requestReadReceipt?: boolean;

  /** Compress large attachments */
  compressAttachments?: boolean;

  /** Maximum attachment size in bytes (10MB default) */
  maxAttachmentSize?: number;
}

/**
 * Email attachment
 */
export interface Attachment {
  /** Attachment filename */
  filename: string;

  /** Attachment content */
  content: string | Buffer;

  /** Content type (MIME type) */
  contentType: string;

  /** Content encoding */
  encoding?: string;

  /** Content disposition (attachment or inline) */
  contentDisposition?: 'attachment' | 'inline';

  /** Content ID for inline images */
  cid?: string;

  /** File size in bytes */
  size?: number;
}

/**
 * Email options for sending
 */
export interface EmailOptions {
  /** From address */
  from: string;

  /** To addresses */
  to: string | string[];

  /** CC addresses */
  cc?: string | string[];

  /** BCC addresses */
  bcc?: string | string[];

  /** Reply-to address */
  replyTo?: string;

  /** Email subject */
  subject: string;

  /** Plain text body */
  text?: string;

  /** HTML body */
  html?: string;

  /** Email attachments */
  attachments?: Attachment[];

  /** Email headers */
  headers?: Record<string, string>;

  /** Email priority */
  priority?: 'high' | 'normal' | 'low';

  /** Message ID */
  messageId?: string;

  /** In-reply-to header */
  inReplyTo?: string;

  /** References header */
  references?: string[];
}

/**
 * Email send result
 */
export interface EmailResult {
  /** Whether email was sent successfully */
  success: boolean;

  /** Message ID from server */
  messageId?: string;

  /** Server response */
  response?: string;

  /** Number of accepted recipients */
  accepted?: string[];

  /** Number of rejected recipients */
  rejected?: string[];

  /** Error information if failed */
  error?: EmailError;

  /** Number of retry attempts */
  retryAttempts?: number;

  /** Total send time in milliseconds */
  sendTime?: number;

  /** Email size in bytes */
  emailSize?: number;

  /** Whether email was sent in test mode */
  testMode?: boolean;
}

/**
 * Email error
 */
export interface EmailError {
  /** Error message */
  message: string;

  /** Error code */
  code?: string;

  /** Error type */
  type: EmailErrorType;

  /** Stack trace */
  stack?: string;

  /** SMTP response code */
  responseCode?: number;

  /** SMTP command that failed */
  command?: string;

  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Email error types
 */
export enum EmailErrorType {
  /** Connection error */
  CONNECTION = 'connection',

  /** Authentication error */
  AUTHENTICATION = 'authentication',

  /** Invalid recipient */
  INVALID_RECIPIENT = 'invalid_recipient',

  /** Message too large */
  MESSAGE_TOO_LARGE = 'message_too_large',

  /** Rate limit exceeded */
  RATE_LIMIT = 'rate_limit',

  /** Timeout */
  TIMEOUT = 'timeout',

  /** Invalid configuration */
  INVALID_CONFIG = 'invalid_config',

  /** Server error */
  SERVER_ERROR = 'server_error',

  /** Unknown error */
  UNKNOWN = 'unknown',
}

/**
 * Test report for email
 */
export interface TestReport {
  /** Test execution summary */
  execution: ExecutionSummary;

  /** Self-healing metrics (if available) */
  healing?: HealingMetricsSummary;

  /** Environment information */
  environment: {
    /** Base URL */
    baseUrl: string;

    /** Environment name (staging, production, etc) */
    name: string;

    /** Node version */
    nodeVersion: string;

    /** Platform (linux, darwin, win32) */
    platform: string;

    /** Architecture (x64, arm64) */
    arch: string;

    /** Hostname */
    hostname?: string;

    /** Additional environment variables */
    variables?: Record<string, string>;
  };

  /** Report metadata */
  metadata: {
    /** Report ID */
    id: string;

    /** Generation timestamp */
    timestamp: Date;

    /** Report version */
    version: string;

    /** Generated by */
    generatedBy: string;

    /** Custom tags */
    tags?: string[];

    /** Additional metadata */
    extra?: Record<string, unknown>;
  };

  /** Upload information (if report was uploaded) */
  upload?: {
    /** Upload URL */
    url: string;

    /** Upload timestamp */
    timestamp: Date;

    /** Storage provider */
    provider: string;

    /** Expiration date (if any) */
    expiresAt?: Date;
  };
}

/**
 * Email template data
 */
export interface EmailTemplateData {
  /** Test report */
  report: TestReport;

  /** Subject line */
  subject: string;

  /** Report URL (if uploaded) */
  reportUrl?: string;

  /** Company/project name */
  projectName?: string;

  /** Custom branding */
  branding?: {
    /** Logo URL */
    logoUrl?: string;

    /** Company name */
    companyName?: string;

    /** Support email */
    supportEmail?: string;

    /** Website URL */
    websiteUrl?: string;
  };
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  /** Whether email is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}

/**
 * Email preview
 */
export interface EmailPreview {
  /** Email subject */
  subject: string;

  /** Plain text preview */
  text: string;

  /** HTML preview */
  html: string;

  /** Email size in bytes */
  size: number;

  /** Number of attachments */
  attachmentCount: number;

  /** Total attachment size in bytes */
  attachmentSize: number;

  /** Estimated send time */
  estimatedSendTime?: number;
}

/**
 * Email queue item
 */
export interface EmailQueueItem {
  /** Queue item ID */
  id: string;

  /** Email options */
  email: EmailOptions;

  /** Number of attempts */
  attempts: number;

  /** Maximum attempts */
  maxAttempts: number;

  /** Next retry time */
  nextRetry?: Date;

  /** Created timestamp */
  createdAt: Date;

  /** Last attempt timestamp */
  lastAttemptAt?: Date;

  /** Item priority */
  priority: number;

  /** Item status */
  status: 'pending' | 'sending' | 'sent' | 'failed';

  /** Error information */
  error?: EmailError;
}

/**
 * Email delivery statistics
 */
export interface EmailStatistics {
  /** Total emails sent */
  totalSent: number;

  /** Successfully delivered */
  successful: number;

  /** Failed deliveries */
  failed: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average send time in milliseconds */
  averageSendTime: number;

  /** Total retries */
  totalRetries: number;

  /** Average retries per email */
  averageRetries: number;

  /** Errors by type */
  errorsByType: Record<EmailErrorType, number>;

  /** Sent by day */
  sentByDay?: Record<string, number>;

  /** Time period */
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * SMTP connection test result
 */
export interface ConnectionTestResult {
  /** Whether connection was successful */
  success: boolean;

  /** Connection time in milliseconds */
  connectionTime?: number;

  /** Server greeting */
  greeting?: string;

  /** Server capabilities */
  capabilities?: string[];

  /** Error information if failed */
  error?: EmailError;

  /** Server information */
  serverInfo?: {
    /** Server name */
    name?: string;

    /** Server version */
    version?: string;
  };
}

/**
 * Email rate limiter configuration
 */
export interface RateLimiterConfig {
  /** Maximum emails per time window */
  maxEmails: number;

  /** Time window in milliseconds */
  windowMs: number;

  /** Whether to queue excess emails */
  queueExcess: boolean;

  /** Maximum queue size */
  maxQueueSize?: number;
}

/**
 * Email batch send options
 */
export interface BatchSendOptions {
  /** Emails to send */
  emails: EmailOptions[];

  /** Batch size */
  batchSize?: number;

  /** Delay between batches in milliseconds */
  batchDelay?: number;

  /** Parallel sending */
  parallel?: boolean;

  /** Stop on first error */
  stopOnError?: boolean;

  /** Progress callback */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Email batch send result
 */
export interface BatchSendResult {
  /** Total emails in batch */
  total: number;

  /** Successfully sent */
  successful: number;

  /** Failed to send */
  failed: number;

  /** Individual results */
  results: EmailResult[];

  /** Total batch time in milliseconds */
  totalTime: number;

  /** Average time per email */
  averageTime: number;
}
