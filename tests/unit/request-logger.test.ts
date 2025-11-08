/**
 * Request Logger Tests
 * Comprehensive tests for HTTP traffic logging with sensitive data redaction
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RequestLogger, createRequestLogger, attachLoggerToPage } from '../../src/executor/request-logger.js';
import type { LoggerConfig } from '../../src/config/logger.js';
import { promises as fs } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    stat: vi.fn(),
    rename: vi.fn(),
  },
}));

describe('RequestLogger', () => {
  let logger: RequestLogger;
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    logger = new RequestLogger();

    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.debug.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Constructor and Configuration', () => {
    it('should create logger with default configuration', () => {
      const logger = new RequestLogger();
      expect(logger).toBeDefined();
      expect(logger.getTransactions()).toEqual([]);
    });

    it('should create logger with custom configuration', () => {
      const config: Partial<LoggerConfig> = {
        level: 'debug',
        console: false,
        file: true,
        filePath: '/tmp/test.log',
      };
      const logger = new RequestLogger({ config });
      expect(logger).toBeDefined();
    });

    it('should create logger with test context', () => {
      const logger = new RequestLogger({
        testContext: {
          testId: 'test-123',
          testName: 'Login Test',
        },
      });
      expect(logger).toBeDefined();
    });

    it('should create logger with custom filter config', () => {
      const logger = new RequestLogger({
        filterConfig: {
          sensitiveHeaders: ['x-custom-auth'],
          sensitiveFields: ['customPassword'],
          customPatterns: [/custom-pattern/g],
          redactEmails: true,
          redactCreditCards: true,
          redactPhoneNumbers: true,
        },
      });
      expect(logger).toBeDefined();
    });
  });

  describe('Request Logging', () => {
    it('should log basic GET request', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});

      expect(consoleSpy.info).toHaveBeenCalled();
      const transactions = logger.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.request.method).toBe('GET');
      expect(transactions[0]?.request.url).toBe('https://api.example.com/users');
    });

    it('should log POST request with body', async () => {
      const body = { username: 'test', password: 'secret123' };
      await logger.logRequest('POST', 'https://api.example.com/login', {}, body);

      const transactions = logger.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.request.method).toBe('POST');
      expect(transactions[0]?.request.body).toBeDefined();
    });

    it('should log request with headers', async () => {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'TestAgent/1.0',
      };
      await logger.logRequest('GET', 'https://api.example.com/data', headers);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.headers).toEqual(headers);
    });

    it('should redact sensitive headers', async () => {
      const headers = {
        'Authorization': 'Bearer secret-token',
        'Content-Type': 'application/json',
      };
      await logger.logRequest('GET', 'https://api.example.com/data', headers);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.headers['Authorization']).toBe('[REDACTED]');
      expect(transactions[0]?.request.headers['Content-Type']).toBe('application/json');
    });

    it('should redact sensitive body fields', async () => {
      const body = {
        username: 'testuser',
        password: 'secret123',
        token: 'abc-xyz',
      };
      await logger.logRequest('POST', 'https://api.example.com/login', {}, body);

      const transactions = logger.getTransactions();
      const loggedBody = transactions[0]?.request.body as Record<string, unknown>;
      expect(loggedBody.username).toBe('testuser');
      expect(loggedBody.password).toBe('[REDACTED]');
      expect(loggedBody.token).toBe('[REDACTED]');
    });

    it('should not log request below configured level', async () => {
      logger.updateConfig({ level: 'error' });
      await logger.logRequest('GET', 'https://api.example.com/data', {}, undefined, 'info');

      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should truncate large request body', async () => {
      logger.updateConfig({ maxBodySize: 50 });
      const largeBody = { data: 'x'.repeat(1000) };
      await logger.logRequest('POST', 'https://api.example.com/data', {}, largeBody);

      const transactions = logger.getTransactions();
      const loggedBody = transactions[0]?.request.body as string;
      expect(loggedBody).toContain('[truncated');
    });

    it('should associate request with test context', async () => {
      logger.setTestContext('test-456', 'API Test');
      await logger.logRequest('GET', 'https://api.example.com/data', {});

      const transactions = logger.getTransactions();
      expect(transactions[0]?.testId).toBe('test-456');
      expect(transactions[0]?.testName).toBe('API Test');
    });
  });

  describe('Response Logging', () => {
    it('should log successful response', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});
      await logger.logResponse(200, 'OK', {}, { users: [] });

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.status).toBe(200);
      expect(transactions[0]?.response?.statusText).toBe('OK');
    });

    it('should log error response', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});
      await logger.logResponse(404, 'Not Found', {}, { error: 'User not found' });

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.status).toBe(404);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log server error response', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});
      await logger.logResponse(500, 'Internal Server Error', {}, { error: 'Server error' });

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.status).toBe(500);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log response with duration', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});
      await logger.logResponse(200, 'OK', {}, { users: [] }, 150);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.duration).toBe(150);
    });

    it('should redact sensitive response headers', async () => {
      const headers = {
        'Set-Cookie': 'session=abc123',
        'Content-Type': 'application/json',
      };
      await logger.logResponse(200, 'OK', headers, {});

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.headers['Set-Cookie']).toBe('[REDACTED]');
      expect(transactions[0]?.response?.headers['Content-Type']).toBe('application/json');
    });

    it('should redact sensitive response body fields', async () => {
      const body = {
        userId: 123,
        accessToken: 'secret-token',
        refreshToken: 'refresh-secret',
      };
      await logger.logResponse(200, 'OK', {}, body);

      const transactions = logger.getTransactions();
      const loggedBody = transactions[0]?.response?.body as Record<string, unknown>;
      expect(loggedBody.userId).toBe(123);
      expect(loggedBody.accessToken).toBe('[REDACTED]');
      expect(loggedBody.refreshToken).toBe('[REDACTED]');
    });

    it('should auto-detect warn level for 4xx status', async () => {
      await logger.logResponse(401, 'Unauthorized', {}, {});
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should auto-detect error level for 5xx status', async () => {
      await logger.logResponse(503, 'Service Unavailable', {}, {});
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Playwright Integration', () => {
    it('should log Playwright request', async () => {
      const mockRequest = {
        method: () => 'GET',
        url: () => 'https://api.example.com/data',
        headers: () => ({ 'User-Agent': 'Playwright' }),
        postData: () => null,
      };

      await logger.logPlaywrightRequest(mockRequest as any);

      const transactions = logger.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.request.method).toBe('GET');
      expect(transactions[0]?.request.url).toBe('https://api.example.com/data');
    });

    it('should log Playwright request with POST data', async () => {
      const mockRequest = {
        method: () => 'POST',
        url: () => 'https://api.example.com/data',
        headers: () => ({ 'Content-Type': 'application/json' }),
        postData: () => JSON.stringify({ name: 'test' }),
      };

      await logger.logPlaywrightRequest(mockRequest as any);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.body).toEqual({ name: 'test' });
    });

    it('should log Playwright response', async () => {
      const mockResponse = {
        status: () => 200,
        statusText: () => 'OK',
        headers: () => ({ 'Content-Type': 'application/json' }),
        text: async () => JSON.stringify({ success: true }),
      };

      await logger.logPlaywrightResponse(mockResponse as any);

      const transactions = logger.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.response?.status).toBe(200);
    });

    it('should calculate response duration when start time provided', async () => {
      const startTime = Date.now() - 100;
      const mockResponse = {
        status: () => 200,
        statusText: () => 'OK',
        headers: () => ({}),
        text: async () => '{}',
      };

      await logger.logPlaywrightResponse(mockResponse as any, startTime);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.duration).toBeGreaterThanOrEqual(100);
    });

    it('should attach logger to page', async () => {
      const handlers: Record<string, (arg: any) => void> = {};
      const mockPage = {
        on: vi.fn((event: string, handler: (arg: any) => void) => {
          handlers[event] = handler;
        }),
      };

      await attachLoggerToPage(mockPage, logger);

      expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function));
      expect(mockPage.on).toHaveBeenCalledWith('response', expect.any(Function));
    });
  });

  describe('Generic Logging', () => {
    it('should log debug message', async () => {
      logger.updateConfig({ level: 'debug' }); // Enable debug level
      await logger.debug('Debug message', { extra: 'data' });
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info message', async () => {
      await logger.info('Info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warning message', async () => {
      await logger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error message', async () => {
      await logger.error('Error message', new Error('Test error'));
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should respect log level when logging messages', async () => {
      logger.updateConfig({ level: 'error' });
      await logger.info('This should not log');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Management', () => {
    it('should get all transactions', async () => {
      await logger.logRequest('GET', 'https://api.example.com/1', {});
      await logger.logRequest('POST', 'https://api.example.com/2', {});

      const transactions = logger.getTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should get transactions by test ID', async () => {
      logger.setTestContext('test-1', 'Test 1');
      await logger.logRequest('GET', 'https://api.example.com/1', {});

      logger.setTestContext('test-2', 'Test 2');
      await logger.logRequest('GET', 'https://api.example.com/2', {});

      const test1Transactions = logger.getTransactionsByTest('test-1');
      expect(test1Transactions).toHaveLength(1);
      expect(test1Transactions[0]?.testId).toBe('test-1');
    });

    it('should clear all transactions', async () => {
      await logger.logRequest('GET', 'https://api.example.com/1', {});
      await logger.logRequest('GET', 'https://api.example.com/2', {});

      logger.clearTransactions();
      expect(logger.getTransactions()).toHaveLength(0);
    });

    it('should clear test context', () => {
      logger.setTestContext('test-123', 'Test');
      logger.clearTestContext();

      // Verify by logging a request and checking it has no test context
      logger.logRequest('GET', 'https://api.example.com/test', {});
      const transactions = logger.getTransactions();
      expect(transactions[0]?.testId).toBeUndefined();
    });
  });

  describe('File Export', () => {
    it('should export logs to file', async () => {
      await logger.logRequest('GET', 'https://api.example.com/users', {});
      await logger.logResponse(200, 'OK', {}, { users: [] });

      await logger.exportToFile('/tmp/logs.json');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/tmp/logs.json',
        expect.stringContaining('GET'),
        'utf-8'
      );
    });

    it('should create directory when exporting to file', async () => {
      await logger.exportToFile('/tmp/logs/test.json');
      expect(fs.mkdir).toHaveBeenCalled();
    });

    it('should flush buffered logs to file', async () => {
      logger.updateConfig({ file: true, filePath: '/tmp/test.log' });
      await logger.info('Test message');

      await logger.flush();
      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should not flush when file logging is disabled', async () => {
      logger.updateConfig({ file: false });
      await logger.info('Test message');

      await logger.flush();
      expect(fs.appendFile).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update logger configuration', () => {
      logger.updateConfig({ level: 'debug', prettyPrint: false });

      // Verify by checking that debug logs now work
      logger.debug('Debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should update filter configuration', async () => {
      logger.updateFilterConfig({
        sensitiveFields: ['customSecret'],
      });

      await logger.logRequest('POST', 'https://api.example.com/data', {}, {
        customSecret: 'should-be-redacted',
      });

      const transactions = logger.getTransactions();
      const body = transactions[0]?.request.body as Record<string, unknown>;
      expect(body.customSecret).toBe('[REDACTED]');
    });

    it('should disable redaction when configured', async () => {
      logger.updateConfig({ redactSensitiveData: false });

      await logger.logRequest('POST', 'https://api.example.com/data', {}, {
        password: 'secret123',
      });

      const transactions = logger.getTransactions();
      const body = transactions[0]?.request.body as Record<string, unknown>;
      expect(body.password).toBe('secret123'); // Not redacted
    });
  });

  describe('Helper Functions', () => {
    it('should create logger with factory function', () => {
      const logger = createRequestLogger({
        config: { level: 'debug' },
      });

      expect(logger).toBeInstanceOf(RequestLogger);
    });

    it('should create logger without options', () => {
      const logger = createRequestLogger();
      expect(logger).toBeInstanceOf(RequestLogger);
    });
  });

  describe('Edge Cases', () => {
    it('should handle request with null body', async () => {
      await logger.logRequest('GET', 'https://api.example.com/data', {}, null);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.body).toBeNull();
    });

    it('should handle response with undefined body', async () => {
      await logger.logRequest('GET', 'https://api.example.com/data', {});
      await logger.logResponse(204, 'No Content', {}, undefined);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.body).toBeUndefined();
    });

    it('should handle headers as string arrays', async () => {
      const headers = {
        'Set-Cookie': ['cookie1=value1', 'cookie2=value2'],
      };

      await logger.logRequest('GET', 'https://api.example.com/data', headers);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.headers['Set-Cookie']).toBe('[REDACTED]');
    });

    it('should handle non-JSON response body', async () => {
      await logger.logRequest('GET', 'https://api.example.com/data', {});
      await logger.logResponse(200, 'OK', {}, 'Plain text response');

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.body).toBe('Plain text response');
    });

    it('should handle Playwright request with invalid POST data', async () => {
      const mockRequest = {
        method: () => 'POST',
        url: () => 'https://api.example.com/data',
        headers: () => ({}),
        postData: () => 'invalid-json{',
      };

      await logger.logPlaywrightRequest(mockRequest as any);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.request.body).toBe('invalid-json{');
    });

    it('should handle Playwright response with non-JSON text', async () => {
      // Log request first
      await logger.logRequest('GET', 'https://api.example.com/data', {});

      const mockResponse = {
        status: () => 200,
        statusText: () => 'OK',
        headers: () => ({}),
        text: async () => 'Plain text',
      };

      await logger.logPlaywrightResponse(mockResponse as any);

      const transactions = logger.getTransactions();
      expect(transactions[0]?.response?.body).toBe('Plain text');
    });
  });
});
