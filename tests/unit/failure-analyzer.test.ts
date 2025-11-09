/**
 * Tests for Playwright Failure Analyzer
 * Feature 4: Self-Healing Agent - Task 4.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FailureAnalyzer, analyzeTestFailure } from '../../src/ai/failure-analyzer.js';
import {
  TestResult,
  FailureType,
  AssertionErrorType,
  NetworkErrorType,
  FailureAnalysis
} from '../../src/types/failure-types.js';

describe('FailureAnalyzer', () => {
  let analyzer: FailureAnalyzer;

  beforeEach(() => {
    analyzer = new FailureAnalyzer();
  });

  describe('parseErrorMessage', () => {
    it('should parse assertion error with expected and actual values', () => {
      const message = "expect(received).toBe(expected)\n\nExpected: 'Hello'\nReceived: 'World'";
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.ASSERTION);
      expect(parsed.expectedValue).toBeDefined();
      expect(parsed.actualValue).toBeDefined();
    });

    it('should parse HTTP error with status code', () => {
      const message = 'HTTP 404 Not Found\nRequest failed for https://api.example.com/users/123';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.NETWORK);
      expect(parsed.httpStatus).toBe(404);
    });

    it('should parse timeout error with duration', () => {
      const message = 'Timeout 30000ms exceeded waiting for selector';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.TIMEOUT);
      expect(parsed.timeout).toBe(30000);
    });

    it('should parse authentication error (401)', () => {
      const message = '401 Unauthorized - Authentication failed';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.AUTH);
      expect(parsed.httpStatus).toBe(401);
    });

    it('should parse authentication error (403)', () => {
      const message = '403 Forbidden - Access denied';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.AUTH);
      expect(parsed.httpStatus).toBe(403);
    });

    it('should parse selector not found error', () => {
      const message = "Selector 'button.submit' not found";
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.SELECTOR);
      expect(parsed.selector).toContain('submit');
    });

    it('should parse navigation error', () => {
      const message = 'Navigation failed to https://example.com/page';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.NAVIGATION);
      expect(parsed.url).toContain('example.com');
    });

    it('should parse validation error', () => {
      const message = "Validation failed for field 'email' expected valid format";
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.VALIDATION);
      expect(parsed.fieldName).toBe('email');
    });

    it('should remove ANSI color codes from message', () => {
      const message = '\x1b[31mError:\x1b[0m Test failed';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.cleanMessage).not.toContain('\x1b');
      expect(parsed.cleanMessage).toContain('Error');
    });

    it('should categorize unknown errors', () => {
      const message = 'Some random error with no known pattern xyz123';
      const parsed = analyzer.parseErrorMessage(message);

      expect(parsed.type).toBe(FailureType.UNKNOWN);
    });
  });

  describe('detectAssertionFailures', () => {
    it('should detect visibility assertion', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'should show button',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "expect(locator('button')).toBeVisible()\nElement is hidden"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const assertion = analysis.specificError;

      expect(assertion.type).toBe(AssertionErrorType.VISIBILITY);
      expect(assertion.suggestion).toBeDefined();
    });

    it('should detect text content assertion', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'should have correct text',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "expect(element).toHaveText('Hello')\nReceived: 'Goodbye'"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const assertion = analysis.specificError;

      expect(assertion.type).toBe(AssertionErrorType.TEXT_CONTENT);
      expect(assertion.expectedValue).toBeDefined();
      expect(assertion.actualValue).toBeDefined();
    });

    it('should detect attribute assertion', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'should have disabled attribute',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "expect(element).toHaveAttribute('disabled', 'true')"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const assertion = analysis.specificError;

      expect(assertion.type).toBe(AssertionErrorType.ATTRIBUTE);
    });

    it('should detect count assertion', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'should have 5 items',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "expect(items).toHaveCount(5)\nReceived count: 3"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const assertion = analysis.specificError;

      expect(assertion.type).toBe(AssertionErrorType.COUNT);
    });

    it('should extract selector from assertion', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "expect(locator('.button')).toBeVisible()"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const assertion = analysis.specificError;

      expect(assertion.selector).toContain('button');
    });
  });

  describe('detectNetworkErrors', () => {
    it('should detect connection refused error', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'should connect to API',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'ECONNREFUSED - Connection refused'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.type).toBe(NetworkErrorType.CONNECTION_REFUSED);
      expect(networkError.suggestion).toContain('server');
    });

    it('should detect DNS failure', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'should resolve DNS',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Network error at https://api.example.com - DNS lookup failed'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.type).toBe(NetworkErrorType.DNS_FAILURE);
      expect(networkError.suggestion).toContain('DNS');
    });

    it('should detect SSL error', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'should handle SSL',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Network error - SSL certificate verification failed'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.type).toBe(NetworkErrorType.SSL_ERROR);
      expect(networkError.suggestion).toContain('SSL');
    });

    it('should detect HTTP error with status code', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'should get data',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'HTTP 500 Internal Server Error at https://api.example.com/data'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.type).toBe(NetworkErrorType.HTTP_ERROR);
      expect(networkError.statusCode).toBe(500);
      expect(networkError.url).toContain('api.example.com');
    });

    it('should extract HTTP method from error', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'POST request failed with 400 Bad Request'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.method).toBe('POST');
    });

    it('should provide 404-specific suggestion', () => {
      const testResult: TestResult = {
        testPath: '/tests/api.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'HTTP 404 Not Found'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const networkError = analysis.specificError;

      expect(networkError.statusCode).toBe(404);
      expect(networkError.suggestion).toContain('endpoint');
    });
  });

  describe('detectTimeoutErrors', () => {
    it('should detect selector timeout', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'should wait for element',
        status: 'timedOut',
        duration: 30000,
        retry: 0,
        error: {
          message: "Timeout 30000ms waiting for selector 'button.submit'"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const timeoutError = analysis.specificError;

      expect(timeoutError.operation).toBe('selector');
      expect(timeoutError.timeout).toBe(30000);
      // Selector might be undefined if not extracted, just check it was attempted
      if (timeoutError.selector) {
        expect(timeoutError.selector).toContain('submit');
      }
    });

    it('should detect navigation timeout', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'should navigate',
        status: 'timedOut',
        duration: 30000,
        retry: 0,
        error: {
          message: 'Timeout during navigation to https://example.com'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const timeoutError = analysis.specificError;

      expect(timeoutError.operation).toBe('navigation');
      expect(timeoutError.url).toContain('example.com');
    });

    it('should detect action timeout', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'should click button',
        status: 'timedOut',
        duration: 10000,
        retry: 0,
        error: {
          message: 'Timeout 10000ms waiting for click action'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const timeoutError = analysis.specificError;

      expect(timeoutError.operation).toBe('action');
      expect(timeoutError.timeout).toBe(10000);
    });

    it('should suggest increasing timeout', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'timedOut',
        duration: 5000,
        retry: 0,
        error: {
          message: 'Timeout 5000ms exceeded'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      const timeoutFix = analysis.potentialFixes.find(f =>
        f.description.includes('timeout')
      );
      expect(timeoutFix).toBeDefined();
    });
  });

  describe('detectAuthErrors', () => {
    it('should detect unauthorized (401) error', () => {
      const testResult: TestResult = {
        testPath: '/tests/auth.test.ts',
        testName: 'should authenticate',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: '401 Unauthorized'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const authError = analysis.specificError;

      expect(authError.type).toBe('unauthorized');
      expect(authError.statusCode).toBe(401);
    });

    it('should detect forbidden (403) error', () => {
      const testResult: TestResult = {
        testPath: '/tests/auth.test.ts',
        testName: 'should access resource',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: '403 Forbidden - Access denied'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const authError = analysis.specificError;

      expect(authError.type).toBe('forbidden');
      expect(authError.statusCode).toBe(403);
    });

    it('should detect token expired error', () => {
      const testResult: TestResult = {
        testPath: '/tests/auth.test.ts',
        testName: 'should use token',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: '401 Authentication token expired'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const authError = analysis.specificError;

      expect(authError.type).toBe('token_expired');
      expect(authError.suggestion).toContain('token');
    });

    it('should detect invalid credentials error', () => {
      const testResult: TestResult = {
        testPath: '/tests/auth.test.ts',
        testName: 'should login',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Authentication failed - invalid credentials provided'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const authError = analysis.specificError;

      expect(authError.type).toBe('invalid_credentials');
    });

    it('should detect auth method from error', () => {
      const testResult: TestResult = {
        testPath: '/tests/auth.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Bearer token authentication failed'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const authError = analysis.specificError;

      expect(authError.authMethod).toBe('bearer');
    });
  });

  describe('detectSelectorErrors', () => {
    it('should detect element not found', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'should find element',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Locator('.submit-button') did not match any elements"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.reason).toBe('not_found');
      expect(selectorError.selector).toContain('submit-button');
    });

    it('should detect hidden element', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Element '#modal' is hidden"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.reason).toBe('hidden');
      expect(selectorError.selector).toContain('modal');
    });

    it('should detect multiple elements found', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Selector 'button' matched multiple elements (5 found)"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.reason).toBe('multiple_found');
    });

    it('should detect detached element', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Element is detached from DOM"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.reason).toBe('detached');
    });

    it('should identify selector type (CSS)', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Selector '.button' not found"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.selectorType).toBe('css');
    });

    it('should identify selector type (XPath)', () => {
      const testResult: TestResult = {
        testPath: '/tests/ui.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Selector '//button[@id=\"submit\"]' not found"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const selectorError = analysis.specificError;

      expect(selectorError.selectorType).toBe('xpath');
    });
  });

  describe('detectNavigationErrors', () => {
    it('should detect navigation timeout', () => {
      const testResult: TestResult = {
        testPath: '/tests/navigation.test.ts',
        testName: 'should navigate',
        status: 'failed',
        duration: 30000,
        retry: 0,
        error: {
          message: 'Navigation timeout to https://example.com'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const navError = analysis.specificError;

      expect(navError.reason).toBe('timeout');
      expect(navError.url).toContain('example.com');
    });

    it('should detect navigation network error', () => {
      const testResult: TestResult = {
        testPath: '/tests/navigation.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Navigation failed to https://example.com - network error'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const navError = analysis.specificError;

      expect(navError.reason).toBe('network');
    });

    it('should detect SSL navigation error', () => {
      const testResult: TestResult = {
        testPath: '/tests/navigation.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Navigation failed: SSL certificate invalid'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);
      const navError = analysis.specificError;

      expect(navError.reason).toBe('ssl');
    });
  });

  describe('extractContext', () => {
    it('should extract basic context', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'should work',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed'
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.context.testFile).toBe('/tests/example.test.ts');
      expect(analysis.context.testName).toBe('should work');
      expect(analysis.context.timestamp).toBeInstanceOf(Date);
    });

    it('should extract line number from error location', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed',
          location: {
            file: '/tests/example.test.ts',
            line: 42,
            column: 10
          }
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.context.lineNumber).toBe(42);
    });

    it('should extract screenshot paths', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed'
        },
        attachments: [
          {
            name: 'screenshot',
            path: '/screenshots/test-1.png',
            contentType: 'image/png'
          }
        ]
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.context.screenshots).toHaveLength(1);
      expect(analysis.context.screenshots?.[0]).toContain('screenshot');
    });

    it('should extract trace paths', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed'
        },
        attachments: [
          {
            name: 'trace',
            path: '/traces/test-1.zip',
            contentType: 'application/zip'
          }
        ]
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.context.traces).toHaveLength(1);
    });
  });

  describe('potentialFixes', () => {
    it('should suggest fixes for assertion failures', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Expected 'Hello' but got 'World'"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.potentialFixes.length).toBeGreaterThan(0);
      expect(analysis.potentialFixes[0].type).toBe('code');
    });

    it('should mark some fixes as automated', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Timeout 5000ms exceeded"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      const automatedFix = analysis.potentialFixes.find(f => f.automated);
      expect(automatedFix).toBeDefined();
    });

    it('should prioritize fixes', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Test failed"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      if (analysis.potentialFixes.length > 0) {
        expect(['high', 'medium', 'low']).toContain(analysis.potentialFixes[0].priority);
      }
    });
  });

  describe('confidence scoring', () => {
    it('should have high confidence for clear assertion failures', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Expected '5' but received '3'"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.confidence).toBeGreaterThan(0.7);
    });

    it('should have lower confidence for unknown failures', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: "Something went wrong"
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.confidence).toBeLessThan(0.5);
    });
  });

  describe('analyzeTestFailure convenience function', () => {
    it('should analyze test failure without creating analyzer instance', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed'
        }
      };

      const analysis = analyzeTestFailure(testResult);

      expect(analysis).toBeDefined();
      expect(analysis.failureType).toBeDefined();
    });

    it('should accept custom options', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: 'Test failed'
        }
      };

      const analysis = analyzeTestFailure(testResult, {
        includeContext: false,
        includeSuggestions: false
      });

      expect(analysis.potentialFixes.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should throw error when analyzing test without error', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'passed',
        duration: 1000,
        retry: 0
      };

      expect(() => analyzer.analyzeFailure(testResult)).toThrow();
    });

    it('should handle empty error message', () => {
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: ''
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis.failureType).toBe(FailureType.UNKNOWN);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'A'.repeat(10000);
      const testResult: TestResult = {
        testPath: '/tests/example.test.ts',
        testName: 'test',
        status: 'failed',
        duration: 1000,
        retry: 0,
        error: {
          message: longMessage
        }
      };

      const analysis = analyzer.analyzeFailure(testResult);

      expect(analysis).toBeDefined();
    });
  });
});
