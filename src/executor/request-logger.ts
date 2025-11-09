/**
 * Request Logger
 * Comprehensive HTTP traffic logging with Playwright integration and sensitive data redaction
 */

import type { Request, Response } from '@playwright/test';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { LoggerConfig, LogLevel } from '../config/logger.js';
import { DEFAULT_LOGGER_CONFIG, shouldLog } from '../config/logger.js';
import type { SensitiveDataFilterConfig } from '../utils/sensitive-data-filter.js';
import {
  DEFAULT_FILTER_CONFIG,
  redactHeaders,
  redactObject,
} from '../utils/sensitive-data-filter.js';
import {
  createRequestLogData,
  createResponseLogData,
  formatRequestConsole,
  formatRequestJSON,
  formatResponseConsole,
  formatResponseJSON,
  truncateBody,
  formatLogMessage,
} from '../utils/log-formatter.js';

/**
 * HTTP request/response pair for logging
 */
export interface HttpTransaction {
  request: {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    body?: unknown;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    body?: unknown;
  };
  timestamp: string;
  duration?: number;
  testId?: string;
  testName?: string;
}


/**
 * Request Logger Options
 */
export interface RequestLoggerOptions {
  /** Logger configuration */
  config?: Partial<LoggerConfig>;
  /** Sensitive data filter configuration */
  filterConfig?: Partial<SensitiveDataFilterConfig>;
  /** Test context for associating logs */
  testContext?: {
    testId: string;
    testName: string;
  };
}

/**
 * Request Logger - Logs HTTP requests and responses with redaction
 */
export class RequestLogger {
  private config: LoggerConfig;
  private filterConfig: SensitiveDataFilterConfig;
  private transactions: HttpTransaction[] = [];
  private logBuffer: string[] = [];
  private testContext?: { testId: string; testName: string };

  constructor(options: RequestLoggerOptions = {}) {
    this.config = {
      ...DEFAULT_LOGGER_CONFIG,
      ...options.config,
    };
    this.filterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      ...options.filterConfig,
    };
    this.testContext = options.testContext;
  }

  /**
   * Log a request
   */
  async logRequest(
    method: string,
    url: string,
    headers: Record<string, string | string[]>,
    body?: unknown,
    level: LogLevel = 'info'
  ): Promise<void> {
    if (!shouldLog(this.config.level, level)) {
      return;
    }

    // Redact sensitive data
    const redactedHeaders = this.config.redactSensitiveData
      ? redactHeaders(headers, this.filterConfig)
      : headers;
    const redactedBody = this.config.redactSensitiveData && body
      ? redactObject(body, this.filterConfig)
      : body;

    // Truncate body if needed
    const truncatedBody = truncateBody(redactedBody, this.config.maxBodySize);

    // Create log data
    const logData = createRequestLogData(
      method,
      url,
      redactedHeaders,
      truncatedBody,
      this.testContext?.testId,
      this.testContext?.testName
    );

    // Format and output
    await this.output(level, () => {
      if (this.config.prettyPrint && this.config.console) {
        return formatRequestConsole(logData, level);
      } else {
        return formatRequestJSON(logData, level);
      }
    });

    // Store transaction
    this.transactions.push({
      request: {
        method,
        url,
        headers: redactedHeaders,
        body: truncatedBody,
      },
      timestamp: logData.timestamp,
      testId: this.testContext?.testId,
      testName: this.testContext?.testName,
    });
  }

  /**
   * Log a response
   */
  async logResponse(
    status: number,
    statusText: string,
    headers: Record<string, string | string[]>,
    body?: unknown,
    duration?: number,
    level?: LogLevel
  ): Promise<void> {
    // Auto-detect level based on status code if not provided
    const responseLevel = level || this.getLogLevelFromStatus(status);

    if (!shouldLog(this.config.level, responseLevel)) {
      return;
    }

    // Redact sensitive data
    const redactedHeaders = this.config.redactSensitiveData
      ? redactHeaders(headers, this.filterConfig)
      : headers;
    const redactedBody = this.config.redactSensitiveData && body
      ? redactObject(body, this.filterConfig)
      : body;

    // Truncate body if needed
    const truncatedBody = truncateBody(redactedBody, this.config.maxBodySize);

    // Create log data
    const logData = createResponseLogData(
      status,
      statusText,
      redactedHeaders,
      truncatedBody,
      duration,
      this.testContext?.testId,
      this.testContext?.testName
    );

    // Format and output
    await this.output(responseLevel, () => {
      if (this.config.prettyPrint && this.config.console) {
        return formatResponseConsole(logData, responseLevel);
      } else {
        return formatResponseJSON(logData, responseLevel);
      }
    });

    // Update last transaction with response or create new one
    const lastTransaction = this.transactions[this.transactions.length - 1];
    if (lastTransaction && !lastTransaction.response) {
      lastTransaction.response = {
        status,
        statusText,
        headers: redactedHeaders,
        body: truncatedBody,
      };
      lastTransaction.duration = duration;
    } else {
      // No request logged, create transaction with response only
      this.transactions.push({
        request: {
          method: 'UNKNOWN',
          url: 'UNKNOWN',
          headers: {},
        },
        response: {
          status,
          statusText,
          headers: redactedHeaders,
          body: truncatedBody,
        },
        timestamp: logData.timestamp,
        duration,
        testId: this.testContext?.testId,
        testName: this.testContext?.testName,
      });
    }
  }

  /**
   * Log a Playwright Request
   */
  async logPlaywrightRequest(request: Request, level: LogLevel = 'info'): Promise<void> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers())) {
      headers[key] = value;
    }

    let body: unknown;
    try {
      const postData = request.postData();
      if (postData) {
        try {
          body = JSON.parse(postData);
        } catch {
          body = postData;
        }
      }
    } catch {
      // Ignore if body can't be read
    }

    await this.logRequest(request.method(), request.url(), headers, body, level);
  }

  /**
   * Log a Playwright Response
   */
  async logPlaywrightResponse(
    response: Response,
    startTime?: number,
    level?: LogLevel
  ): Promise<void> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers())) {
      headers[key] = value;
    }

    let body: unknown;
    try {
      const bodyText = await response.text();
      if (bodyText) {
        try {
          body = JSON.parse(bodyText);
        } catch {
          body = bodyText;
        }
      }
    } catch {
      // Ignore if body can't be read
    }

    const duration = startTime ? Date.now() - startTime : undefined;

    await this.logResponse(
      response.status(),
      response.statusText(),
      headers,
      body,
      duration,
      level
    );
  }

  /**
   * Log a generic message
   */
  async log(level: LogLevel, message: string, data?: unknown): Promise<void> {
    if (!shouldLog(this.config.level, level)) {
      return;
    }

    await this.output(level, () => {
      return formatLogMessage(level, message, data, this.config.prettyPrint && this.config.console);
    });
  }

  /**
   * Log debug message
   */
  async debug(message: string, data?: unknown): Promise<void> {
    await this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  async info(message: string, data?: unknown): Promise<void> {
    await this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  async warn(message: string, data?: unknown): Promise<void> {
    await this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  async error(message: string, data?: unknown): Promise<void> {
    await this.log('error', message, data);
  }

  /**
   * Get all logged transactions
   */
  getTransactions(): HttpTransaction[] {
    return [...this.transactions];
  }

  /**
   * Get transactions for specific test
   */
  getTransactionsByTest(testId: string): HttpTransaction[] {
    return this.transactions.filter(t => t.testId === testId);
  }

  /**
   * Clear all transactions
   */
  clearTransactions(): void {
    this.transactions = [];
  }

  /**
   * Export logs to file
   */
  async exportToFile(filePath: string): Promise<void> {
    await this.ensureDirectoryExists(filePath);

    const logEntries = this.transactions.map(transaction => ({
      timestamp: transaction.timestamp,
      testId: transaction.testId,
      testName: transaction.testName,
      request: transaction.request,
      response: transaction.response,
      duration: transaction.duration,
    }));

    await fs.writeFile(filePath, JSON.stringify(logEntries, null, 2), 'utf-8');
  }

  /**
   * Flush buffered logs to file
   */
  async flush(): Promise<void> {
    if (!this.config.file || !this.config.filePath || this.logBuffer.length === 0) {
      return;
    }

    await this.ensureDirectoryExists(this.config.filePath);

    // Check file size and rotate if needed
    await this.rotateIfNeeded();

    // Append logs
    const content = this.logBuffer.join('\n') + '\n';
    await fs.appendFile(this.config.filePath, content, 'utf-8');
    this.logBuffer = [];
  }

  /**
   * Set test context
   */
  setTestContext(testId: string, testName: string): void {
    this.testContext = { testId, testName };
  }

  /**
   * Clear test context
   */
  clearTestContext(): void {
    this.testContext = undefined;
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update filter configuration
   */
  updateFilterConfig(config: Partial<SensitiveDataFilterConfig>): void {
    this.filterConfig = { ...this.filterConfig, ...config };
  }

  /**
   * Output log message to configured destinations
   */
  private async output(level: LogLevel, formatter: () => string): Promise<void> {
    const formatted = formatter();

    // Console output
    if (this.config.console) {
      this.writeToConsole(level, formatted);
    }

    // File output (buffered)
    if (this.config.file && this.config.filePath) {
      this.logBuffer.push(formatted);

      // Flush if buffer is large
      if (this.logBuffer.length >= 100) {
        await this.flush();
      }
    }
  }

  /**
   * Write to console with appropriate level
   */
  private writeToConsole(level: LogLevel, message: string): void {
    switch (level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }

  /**
   * Get log level from HTTP status code
   */
  private getLogLevelFromStatus(status: number): LogLevel {
    if (status >= 500) {
      return 'error';
    } else if (status >= 400) {
      return 'warn';
    } else {
      return 'info';
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }
  }

  /**
   * Rotate log file if needed
   */
  private async rotateIfNeeded(): Promise<void> {
    if (!this.config.filePath || !this.config.rotation) {
      return;
    }

    try {
      const stats = await fs.stat(this.config.filePath);
      if (stats.size >= this.config.rotation.maxFileSize) {
        // Rotate files
        for (let i = this.config.rotation.maxFiles - 1; i > 0; i--) {
          const oldPath = `${this.config.filePath}.${i}`;
          const newPath = `${this.config.filePath}.${i + 1}`;
          try {
            await fs.rename(oldPath, newPath);
          } catch {
            // File might not exist, continue
          }
        }

        // Move current log to .1
        await fs.rename(this.config.filePath, `${this.config.filePath}.1`);
      }
    } catch {
      // File doesn't exist yet, no need to rotate
    }
  }
}

/**
 * Create a request logger with Playwright integration
 */
export function createRequestLogger(options: RequestLoggerOptions = {}): RequestLogger {
  return new RequestLogger(options);
}

/**
 * Attach request logger to Playwright page
 */
export async function attachLoggerToPage(
  page: {
    on(event: 'request', listener: (request: Request) => void): void;
    on(event: 'response', listener: (response: Response) => void): void;
  },
  logger: RequestLogger
): Promise<void> {
  const requestTimes = new Map<string, number>();

  page.on('request', (request: Request) => {
    requestTimes.set(request.url(), Date.now());
    logger.logPlaywrightRequest(request).catch(err => {
      console.error('Failed to log request:', err);
    });
  });

  page.on('response', (response: Response) => {
    const startTime = requestTimes.get(response.url());
    requestTimes.delete(response.url());
    logger.logPlaywrightResponse(response, startTime).catch(err => {
      console.error('Failed to log response:', err);
    });
  });
}
