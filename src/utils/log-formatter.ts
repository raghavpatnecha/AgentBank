/**
 * Log Formatter
 * Formats HTTP request/response logs for console and file output
 */

import type { LogLevel } from '../config/logger.js';

export interface RequestLogData {
  timestamp: string;
  testId?: string;
  testName?: string;
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  body?: unknown;
}

export interface ResponseLogData {
  timestamp: string;
  testId?: string;
  testName?: string;
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body?: unknown;
  duration?: number;
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
  testId?: string;
  testName?: string;
}

/**
 * Format request log for console output (pretty print)
 */
export function formatRequestConsole(request: RequestLogData, level: LogLevel = 'info'): string {
  const lines: string[] = [];

  // Header with test context
  const levelPrefix = getLevelPrefix(level);
  const testContext = request.testName ? ` [${request.testName}]` : '';
  lines.push(`${levelPrefix}${testContext} → ${request.method} ${request.url}`);

  // Timestamp
  lines.push(`  ⏰ ${request.timestamp}`);

  // Headers
  if (Object.keys(request.headers).length > 0) {
    lines.push('  📋 Headers:');
    for (const [key, value] of Object.entries(request.headers)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      lines.push(`     ${key}: ${displayValue}`);
    }
  }

  // Body
  if (request.body !== undefined) {
    lines.push('  📦 Body:');
    const bodyStr = formatBodyForConsole(request.body);
    lines.push(bodyStr.split('\n').map(line => `     ${line}`).join('\n'));
  }

  return lines.join('\n');
}

/**
 * Format response log for console output (pretty print)
 */
export function formatResponseConsole(response: ResponseLogData, level: LogLevel = 'info'): string {
  const lines: string[] = [];

  // Header with test context
  const levelPrefix = getLevelPrefix(level);
  const testContext = response.testName ? ` [${response.testName}]` : '';
  const statusIcon = getStatusIcon(response.status);
  const duration = response.duration ? ` (${response.duration}ms)` : '';
  lines.push(`${levelPrefix}${testContext} ← ${response.status} ${response.statusText}${statusIcon}${duration}`);

  // Timestamp
  lines.push(`  ⏰ ${response.timestamp}`);

  // Headers
  if (Object.keys(response.headers).length > 0) {
    lines.push('  📋 Headers:');
    for (const [key, value] of Object.entries(response.headers)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      lines.push(`     ${key}: ${displayValue}`);
    }
  }

  // Body
  if (response.body !== undefined) {
    lines.push('  📦 Body:');
    const bodyStr = formatBodyForConsole(response.body);
    lines.push(bodyStr.split('\n').map(line => `     ${line}`).join('\n'));
  }

  return lines.join('\n');
}

/**
 * Format request log as JSON
 */
export function formatRequestJSON(request: RequestLogData, level: LogLevel = 'info'): string {
  const entry: LogEntry = {
    level,
    timestamp: request.timestamp,
    message: `${request.method} ${request.url}`,
    testId: request.testId,
    testName: request.testName,
    data: {
      type: 'request',
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    },
  };

  return JSON.stringify(entry);
}

/**
 * Format response log as JSON
 */
export function formatResponseJSON(response: ResponseLogData, level: LogLevel = 'info'): string {
  const entry: LogEntry = {
    level,
    timestamp: response.timestamp,
    message: `${response.status} ${response.statusText}`,
    testId: response.testId,
    testName: response.testName,
    data: {
      type: 'response',
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body,
      duration: response.duration,
    },
  };

  return JSON.stringify(entry);
}

/**
 * Truncate body if it exceeds max size
 */
export function truncateBody(body: unknown, maxSize: number): unknown {
  if (body === undefined || body === null) {
    return body;
  }

  if (maxSize === 0) {
    return body; // No limit
  }

  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

  if (bodyStr.length <= maxSize) {
    return body;
  }

  // Truncate and add indicator
  const truncated = bodyStr.substring(0, maxSize);
  return `${truncated}... [truncated, original size: ${bodyStr.length} bytes]`;
}

/**
 * Format body for console display
 */
function formatBodyForConsole(body: unknown): string {
  if (body === undefined || body === null) {
    return String(body);
  }

  if (typeof body === 'string') {
    // Try to parse as JSON for pretty printing
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  // Pretty print objects/arrays
  return JSON.stringify(body, null, 2);
}

/**
 * Get log level prefix with color/icon
 */
function getLevelPrefix(level: LogLevel): string {
  switch (level) {
    case 'debug':
      return '🔍 DEBUG';
    case 'info':
      return 'ℹ️  INFO ';
    case 'warn':
      return '⚠️  WARN ';
    case 'error':
      return '❌ ERROR';
    default:
      return 'ℹ️  INFO ';
  }
}

/**
 * Get status icon based on HTTP status code
 */
function getStatusIcon(status: number): string {
  if (status >= 200 && status < 300) {
    return ' ✅';
  } else if (status >= 300 && status < 400) {
    return ' 🔄';
  } else if (status >= 400 && status < 500) {
    return ' ⚠️';
  } else if (status >= 500) {
    return ' ❌';
  }
  return '';
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format generic log message
 */
export function formatLogMessage(
  level: LogLevel,
  message: string,
  data?: unknown,
  prettyPrint = true
): string {
  const timestamp = getCurrentTimestamp();

  if (prettyPrint) {
    const prefix = getLevelPrefix(level);
    const dataStr = data ? `\n  ${JSON.stringify(data, null, 2)}` : '';
    return `${prefix} ${message}${dataStr}\n  ⏰ ${timestamp}`;
  } else {
    const entry: LogEntry = {
      level,
      timestamp,
      message,
      data,
    };
    return JSON.stringify(entry);
  }
}

/**
 * Create request log data
 */
export function createRequestLogData(
  method: string,
  url: string,
  headers: Record<string, string | string[]>,
  body?: unknown,
  testId?: string,
  testName?: string
): RequestLogData {
  return {
    timestamp: getCurrentTimestamp(),
    testId,
    testName,
    method,
    url,
    headers,
    body,
  };
}

/**
 * Create response log data
 */
export function createResponseLogData(
  status: number,
  statusText: string,
  headers: Record<string, string | string[]>,
  body?: unknown,
  duration?: number,
  testId?: string,
  testName?: string
): ResponseLogData {
  return {
    timestamp: getCurrentTimestamp(),
    testId,
    testName,
    status,
    statusText,
    headers,
    body,
    duration,
  };
}
