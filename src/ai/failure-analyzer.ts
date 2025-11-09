/**
 * Playwright Test Failure Analyzer
 * Feature 4: Self-Healing Agent - Task 4.2
 *
 * Analyzes test failures to identify patterns and root causes
 */

import {
  FailureAnalysis,
  FailureType,
  ParsedError,
  TestResult,
  AssertionFailure,
  NetworkError,
  TimeoutError,
  AuthError,
  SelectorError,
  NavigationError,
  ValidationError,
  FailureContext,
  Fix,
  FailurePattern,
  AssertionErrorType,
  NetworkErrorType,
  AnalysisOptions,
} from '../types/failure-types.js';

/**
 * Default analysis options
 */
const DEFAULT_OPTIONS: AnalysisOptions = {
  includeContext: true,
  includeSuggestions: true,
  includeRelatedFailures: false,
  maxRelatedFailures: 5,
  confidenceThreshold: 0.6,
  enablePatternLearning: false,
};

/**
 * Failure patterns for detecting specific error types
 */
const FAILURE_PATTERNS: FailurePattern[] = [
  // Assertion failures
  {
    type: FailureType.ASSERTION,
    regex:
      /expect.*?(?:toBe|toEqual|toContain|toHaveText|toBeVisible|toHaveAttribute)\((.*?)\).*?(?:Received|but got|actual):\s*(.+)/is,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.ASSERTION,
      expectedValue: match[1]?.trim(),
      actualValue: match[2]?.trim(),
    }),
  },
  {
    type: FailureType.ASSERTION,
    regex: /Expected.*?'(.+?)'.*?Received.*?'(.+?)'/is,
    priority: 9,
    extractor: (match) => ({
      type: FailureType.ASSERTION,
      expectedValue: match[1]?.trim(),
      actualValue: match[2]?.trim(),
    }),
  },
  {
    type: FailureType.ASSERTION,
    regex: /Assertion failed.*?expected.*?'(.+?)'.*?to.*?'(.+?)'/is,
    priority: 8,
    extractor: (match) => ({
      type: FailureType.ASSERTION,
      expectedValue: match[1]?.trim(),
      actualValue: match[2]?.trim(),
    }),
  },

  // Network errors
  {
    type: FailureType.NETWORK,
    regex: /(?:HTTP|Network).*?(\d{3})\s+(.+?)(?:\n|$)/i,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.NETWORK,
      httpStatus: parseInt(match[1] || '0', 10),
      cleanMessage: match[2]?.trim(),
    }),
  },
  {
    type: FailureType.NETWORK,
    regex: /(?:Request failed|Network error).*?(?:at|for)\s+(.+?)(?:\n|$)/i,
    priority: 9,
    extractor: (match) => ({
      type: FailureType.NETWORK,
      url: match[1]?.trim(),
    }),
  },
  {
    type: FailureType.NETWORK,
    regex: /ECONNREFUSED|Connection refused/i,
    priority: 8,
    extractor: () => ({
      type: FailureType.NETWORK,
      cleanMessage: 'Connection refused',
    }),
  },

  // Timeout errors
  {
    type: FailureType.TIMEOUT,
    regex: /Timeout.*?(\d+)ms.*?(?:waiting for|exceeded)/i,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.TIMEOUT,
      timeout: parseInt(match[1] || '0', 10),
    }),
  },
  {
    type: FailureType.TIMEOUT,
    regex: /Timeout of (\d+)ms exceeded/i,
    priority: 9,
    extractor: (match) => ({
      type: FailureType.TIMEOUT,
      timeout: parseInt(match[1] || '0', 10),
    }),
  },

  // Auth errors
  {
    type: FailureType.AUTH,
    regex: /(?:401|Unauthorized|Authentication failed)/i,
    priority: 10,
    extractor: () => ({
      type: FailureType.AUTH,
      httpStatus: 401,
    }),
  },
  {
    type: FailureType.AUTH,
    regex: /(?:403|Forbidden|Access denied)/i,
    priority: 9,
    extractor: () => ({
      type: FailureType.AUTH,
      httpStatus: 403,
    }),
  },

  // Selector errors
  {
    type: FailureType.SELECTOR,
    regex:
      /(?:Selector|locator)\s+['"](.+?)['"].*?(?:not found|could not be found|did not match any elements)/i,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.SELECTOR,
      selector: match[1]?.trim(),
    }),
  },
  {
    type: FailureType.SELECTOR,
    regex: /Element.*?['"](.+?)['"].*?(?:hidden|not visible|detached)/i,
    priority: 9,
    extractor: (match) => ({
      type: FailureType.SELECTOR,
      selector: match[1]?.trim(),
    }),
  },

  // Navigation errors
  {
    type: FailureType.NAVIGATION,
    regex: /Navigation.*?(?:failed|timeout).*?(?:to|at)\s+(.+?)(?:\n|$)/i,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.NAVIGATION,
      url: match[1]?.trim(),
    }),
  },

  // Validation errors
  {
    type: FailureType.VALIDATION,
    regex: /Validation.*?failed.*?(?:field|property)\s+['"](.+?)['"].*?expected\s+(.+?)(?:\n|$)/i,
    priority: 10,
    extractor: (match) => ({
      type: FailureType.VALIDATION,
      fieldName: match[1]?.trim(),
      expectedValue: match[2]?.trim(),
    }),
  },
];

/**
 * Main class for analyzing test failures
 */
export class FailureAnalyzer {
  private options: AnalysisOptions;

  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze a test failure and determine root cause
   */
  analyzeFailure(testResult: TestResult): FailureAnalysis {
    if (!testResult.error) {
      throw new Error('Cannot analyze test without error information');
    }

    // Parse the error message
    const parsedError = this.parseErrorMessage(testResult.error.message);

    // Extract context
    const context = this.options.includeContext
      ? this.extractContext(testResult)
      : this.createMinimalContext(testResult);

    // Detect specific error type
    let specificError: any;
    let rootCause = '';
    let potentialFixes: Fix[] = [];
    let confidence = 0.5;

    switch (parsedError.type) {
      case FailureType.ASSERTION:
        specificError = this.detectAssertionFailures(parsedError, testResult);
        rootCause = this.analyzeAssertionFailure(specificError);
        potentialFixes = this.suggestAssertionFixes(specificError, context);
        confidence = 0.85;
        break;

      case FailureType.NETWORK:
        specificError = this.detectNetworkErrors(parsedError, testResult);
        rootCause = this.analyzeNetworkError(specificError);
        potentialFixes = this.suggestNetworkFixes(specificError, context);
        confidence = 0.8;
        break;

      case FailureType.TIMEOUT:
        specificError = this.detectTimeoutErrors(parsedError, testResult);
        rootCause = this.analyzeTimeoutError(specificError);
        potentialFixes = this.suggestTimeoutFixes(specificError, context);
        confidence = 0.75;
        break;

      case FailureType.AUTH:
        specificError = this.detectAuthErrors(parsedError, testResult);
        rootCause = this.analyzeAuthError(specificError);
        potentialFixes = this.suggestAuthFixes(specificError, context);
        confidence = 0.9;
        break;

      case FailureType.SELECTOR:
        specificError = this.detectSelectorErrors(parsedError, testResult);
        rootCause = this.analyzeSelectorError(specificError);
        potentialFixes = this.suggestSelectorFixes(specificError, context);
        confidence = 0.7;
        break;

      case FailureType.NAVIGATION:
        specificError = this.detectNavigationErrors(parsedError, testResult);
        rootCause = this.analyzeNavigationError(specificError);
        potentialFixes = this.suggestNavigationFixes(specificError, context);
        confidence = 0.75;
        break;

      case FailureType.VALIDATION:
        specificError = this.detectValidationErrors(parsedError, testResult);
        rootCause = this.analyzeValidationError(specificError);
        potentialFixes = this.suggestValidationFixes(specificError, context);
        confidence = 0.8;
        break;

      default:
        rootCause = 'Unknown failure type';
        confidence = 0.3;
    }

    return {
      testResult,
      failureType: parsedError.type,
      parsedError,
      context,
      specificError,
      rootCause,
      potentialFixes: this.options.includeSuggestions ? potentialFixes : [],
      confidence,
    };
  }

  /**
   * Parse error message to extract structured information
   */
  parseErrorMessage(message: string): ParsedError {
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '').trim();

    // Try to match against known patterns
    const sortedPatterns = [...FAILURE_PATTERNS].sort((a, b) => b.priority - a.priority);

    for (const pattern of sortedPatterns) {
      const match = cleanMessage.match(pattern.regex);
      if (match) {
        const extracted = pattern.extractor(match);
        return {
          type: pattern.type,
          rawMessage: message,
          cleanMessage,
          ...extracted,
        };
      }
    }

    // Fallback to categorization based on keywords
    const type = this.categorizeFailure(cleanMessage);

    return {
      type,
      rawMessage: message,
      cleanMessage,
    };
  }

  /**
   * Detect assertion failure details
   */
  detectAssertionFailures(parsedError: ParsedError, _testResult: TestResult): AssertionFailure {
    const message = parsedError.cleanMessage;

    // Determine assertion type
    let type = AssertionErrorType.EQUALITY;
    if (message.includes('toBeVisible') || message.includes('visible')) {
      type = AssertionErrorType.VISIBILITY;
    } else if (message.includes('toHaveText') || message.includes('text')) {
      type = AssertionErrorType.TEXT_CONTENT;
    } else if (message.includes('toHaveAttribute') || message.includes('attribute')) {
      type = AssertionErrorType.ATTRIBUTE;
    } else if (message.includes('toHaveCount') || message.includes('count')) {
      type = AssertionErrorType.COUNT;
    } else if (message.includes('toHaveValue') || message.includes('value')) {
      type = AssertionErrorType.VALUE;
    }

    // Extract selector if present
    const selectorMatch = message.match(/locator\(['"](.+?)['"]\)/);
    const selector = selectorMatch?.[1] || parsedError.selector;

    // Extract field name
    const fieldMatch = message.match(/field\s+['"](.+?)['"]/i);
    const fieldName = fieldMatch?.[1] || parsedError.fieldName;

    return {
      type,
      selector,
      expectedValue: parsedError.expectedValue,
      actualValue: parsedError.actualValue,
      fieldName,
      message: parsedError.cleanMessage,
      suggestion: this.generateAssertionSuggestion(type, parsedError),
    };
  }

  /**
   * Detect network error details
   */
  detectNetworkErrors(parsedError: ParsedError, _testResult: TestResult): NetworkError {
    const message = parsedError.cleanMessage;
    const statusCode = parsedError.httpStatus;

    // Determine network error type
    let type = NetworkErrorType.HTTP_ERROR;
    if (message.includes('ECONNREFUSED') || message.includes('Connection refused')) {
      type = NetworkErrorType.CONNECTION_REFUSED;
    } else if (message.includes('DNS') || message.includes('ENOTFOUND')) {
      type = NetworkErrorType.DNS_FAILURE;
    } else if (message.includes('SSL') || message.includes('certificate')) {
      type = NetworkErrorType.SSL_ERROR;
    } else if (message.includes('CORS')) {
      type = NetworkErrorType.CORS_ERROR;
    } else if (message.includes('timeout')) {
      type = NetworkErrorType.TIMEOUT;
    }

    // Extract URL
    const urlMatch = message.match(/(?:https?:\/\/[^\s]+)/i);
    const url = urlMatch?.[0] || parsedError.url || 'unknown';

    // Extract method
    const methodMatch = message.match(/(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)/i);
    const method = methodMatch?.[1];

    return {
      type,
      url,
      statusCode,
      method,
      message: parsedError.cleanMessage,
      suggestion: this.generateNetworkSuggestion(type, statusCode),
    };
  }

  /**
   * Detect timeout error details
   */
  detectTimeoutErrors(parsedError: ParsedError, _testResult: TestResult): TimeoutError {
    const message = parsedError.cleanMessage;

    // Determine timeout operation
    let operation: TimeoutError['operation'] = 'assertion';
    if (message.includes('navigation')) {
      operation = 'navigation';
    } else if (message.includes('selector') || message.includes('locator')) {
      operation = 'selector';
    } else if (
      message.includes('action') ||
      message.includes('click') ||
      message.includes('fill')
    ) {
      operation = 'action';
    } else if (message.includes('request') || message.includes('response')) {
      operation = 'network';
    }

    // Extract selector
    const selectorMatch = message.match(/locator\(['"](.+?)['"]\)/);
    const selector = selectorMatch?.[1] || parsedError.selector;

    // Extract URL
    const urlMatch = message.match(/(?:https?:\/\/[^\s]+)/i);
    const url = urlMatch?.[0] || parsedError.url;

    return {
      operation,
      timeout: parsedError.timeout || 30000,
      selector,
      url,
      message: parsedError.cleanMessage,
      suggestion: this.generateTimeoutSuggestion(operation),
    };
  }

  /**
   * Detect authentication error details
   */
  detectAuthErrors(parsedError: ParsedError, _testResult: TestResult): AuthError {
    const message = parsedError.cleanMessage;
    const statusCode = parsedError.httpStatus;

    // Determine auth error type
    let type: AuthError['type'] = 'unauthorized';
    if (statusCode === 403 || message.includes('Forbidden')) {
      type = 'forbidden';
    } else if (message.includes('token') && message.includes('expired')) {
      type = 'token_expired';
    } else if (
      message.includes('invalid') &&
      (message.includes('credentials') || message.includes('password'))
    ) {
      type = 'invalid_credentials';
    }

    // Extract endpoint
    const urlMatch = message.match(/(?:https?:\/\/[^\s]+)/i);
    const endpoint = urlMatch?.[0];

    // Detect auth method
    let authMethod: AuthError['authMethod'] = 'bearer';
    if (message.includes('Basic')) {
      authMethod = 'basic';
    } else if (message.includes('API key') || message.includes('apikey')) {
      authMethod = 'apiKey';
    } else if (message.includes('OAuth')) {
      authMethod = 'oauth2';
    }

    return {
      type,
      statusCode,
      endpoint,
      authMethod,
      message: parsedError.cleanMessage,
      suggestion: this.generateAuthSuggestion(type),
    };
  }

  /**
   * Detect selector error details
   */
  detectSelectorErrors(parsedError: ParsedError, _testResult: TestResult): SelectorError {
    const message = parsedError.cleanMessage;

    // Extract selector
    const selectorMatch = message.match(/(?:locator|selector)\s*\(['"](.+?)['"]\)/i);
    const selector = selectorMatch?.[1] || parsedError.selector || 'unknown';

    // Determine selector type
    let selectorType: SelectorError['selectorType'] = 'css';
    if (selector.startsWith('//')) {
      selectorType = 'xpath';
    } else if (selector.includes('text=')) {
      selectorType = 'text';
    } else if (selector.startsWith('#')) {
      selectorType = 'id';
    } else if (selector.includes('role=')) {
      selectorType = 'role';
    } else if (selector.includes('data-testid')) {
      selectorType = 'testId';
    }

    // Determine reason
    let reason: SelectorError['reason'] = 'not_found';
    if (message.includes('multiple') || message.includes('more than one')) {
      reason = 'multiple_found';
    } else if (message.includes('hidden') || message.includes('not visible')) {
      reason = 'hidden';
    } else if (message.includes('detached')) {
      reason = 'detached';
    } else if (message.includes('invalid')) {
      reason = 'invalid';
    }

    return {
      selector,
      selectorType,
      reason,
      message: parsedError.cleanMessage,
      suggestion: this.generateSelectorSuggestion(reason, selectorType),
    };
  }

  /**
   * Detect navigation error details
   */
  detectNavigationErrors(parsedError: ParsedError, _testResult: TestResult): NavigationError {
    const message = parsedError.cleanMessage;

    // Extract URL
    const urlMatch = message.match(/(?:https?:\/\/[^\s]+)/i);
    const url = urlMatch?.[0] || parsedError.url || 'unknown';

    // Determine reason
    let reason: NavigationError['reason'] = 'timeout';
    if (message.includes('network') || message.includes('ECONNREFUSED')) {
      reason = 'network';
    } else if (message.includes('SSL') || message.includes('certificate')) {
      reason = 'ssl';
    } else if (message.includes('DNS') || message.includes('ENOTFOUND')) {
      reason = 'dns';
    } else if (message.includes('redirect')) {
      reason = 'redirect';
    } else if (message.includes('blocked')) {
      reason = 'blocked';
    }

    return {
      url,
      reason,
      statusCode: parsedError.httpStatus,
      message: parsedError.cleanMessage,
      suggestion: this.generateNavigationSuggestion(reason),
    };
  }

  /**
   * Detect validation error details
   */
  detectValidationErrors(parsedError: ParsedError, _testResult: TestResult): ValidationError {
    const message = parsedError.cleanMessage;

    // Extract field name
    const fieldMatch = message.match(/(?:field|property)\s+['"](.+?)['"]/i);
    const fieldName = fieldMatch?.[1] || parsedError.fieldName || 'unknown';

    // Determine validation type
    let validationType: ValidationError['validationType'] = 'type';
    if (message.includes('required')) {
      validationType = 'required';
    } else if (message.includes('format')) {
      validationType = 'format';
    } else if (message.includes('range') || message.includes('min') || message.includes('max')) {
      validationType = 'range';
    } else if (message.includes('pattern')) {
      validationType = 'pattern';
    }

    return {
      fieldName,
      validationType,
      expectedFormat: parsedError.expectedValue?.toString(),
      actualValue: parsedError.actualValue,
      message: parsedError.cleanMessage,
      suggestion: this.generateValidationSuggestion(validationType, fieldName),
    };
  }

  /**
   * Categorize failure based on message keywords
   */
  categorizeFailure(message: string): FailureType {
    const lower = message.toLowerCase();

    if (lower.includes('expect') || lower.includes('assertion') || lower.includes('should')) {
      return FailureType.ASSERTION;
    }
    if (lower.includes('timeout') || lower.includes('exceeded')) {
      return FailureType.TIMEOUT;
    }
    if (
      lower.includes('401') ||
      lower.includes('403') ||
      lower.includes('unauthorized') ||
      lower.includes('forbidden')
    ) {
      return FailureType.AUTH;
    }
    if (lower.includes('network') || lower.includes('http') || lower.includes('request failed')) {
      return FailureType.NETWORK;
    }
    if (
      lower.includes('selector') ||
      lower.includes('locator') ||
      lower.includes('element') ||
      lower.includes('not found')
    ) {
      return FailureType.SELECTOR;
    }
    if (lower.includes('navigation') || lower.includes('navigate')) {
      return FailureType.NAVIGATION;
    }
    if (lower.includes('validation') || lower.includes('invalid')) {
      return FailureType.VALIDATION;
    }

    return FailureType.UNKNOWN;
  }

  /**
   * Extract context from test result
   */
  extractContext(testResult: TestResult): FailureContext {
    const location = testResult.error?.location;

    return {
      testFile: testResult.testPath,
      testName: testResult.testName,
      lineNumber: location?.line,
      codeSnippet: testResult.error?.snippet,
      timestamp: new Date(),
      screenshots:
        testResult.attachments?.filter((a) => a.contentType.includes('image')).map((a) => a.path) ||
        [],
      traces:
        testResult.attachments?.filter((a) => a.name.includes('trace')).map((a) => a.path) || [],
    };
  }

  /**
   * Create minimal context (when includeContext is false)
   */
  private createMinimalContext(testResult: TestResult): FailureContext {
    return {
      testFile: testResult.testPath,
      testName: testResult.testName,
      timestamp: new Date(),
    };
  }

  /**
   * Analysis helpers for specific error types
   */
  private analyzeAssertionFailure(failure: AssertionFailure): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return `Assertion failed: Expected ${failure.expectedValue}, but got ${failure.actualValue}`;
  }

  private analyzeNetworkError(error: NetworkError): string {
    if (error.statusCode) {
      return `Network request failed with status ${error.statusCode} for ${error.url}`;
    }
    return `Network error: ${error.type} for ${error.url}`;
  }

  private analyzeTimeoutError(error: TimeoutError): string {
    return `Timeout after ${error.timeout}ms during ${error.operation} operation`;
  }

  private analyzeAuthError(error: AuthError): string {
    return `Authentication error: ${error.type} (${error.statusCode || 'unknown status'})`;
  }

  private analyzeSelectorError(error: SelectorError): string {
    return `Selector '${error.selector}' ${error.reason.replace('_', ' ')}`;
  }

  private analyzeNavigationError(error: NavigationError): string {
    return `Navigation to ${error.url} failed: ${error.reason}`;
  }

  private analyzeValidationError(error: ValidationError): string {
    return `Validation failed for field '${error.fieldName}': ${error.validationType} error`;
  }

  /**
   * Suggestion generators
   */
  private generateAssertionSuggestion(type: AssertionErrorType, _error: ParsedError): string {
    switch (type) {
      case AssertionErrorType.VISIBILITY:
        return 'Ensure element is visible before asserting. Consider using waitForSelector.';
      case AssertionErrorType.TEXT_CONTENT:
        return 'Check if text content matches exactly, including whitespace and case.';
      default:
        return 'Review expected vs actual values and update assertion or fix implementation.';
    }
  }

  private generateNetworkSuggestion(type: NetworkErrorType, statusCode?: number): string {
    switch (type) {
      case NetworkErrorType.CONNECTION_REFUSED:
        return 'Ensure the server is running and accessible at the specified URL.';
      case NetworkErrorType.DNS_FAILURE:
        return 'Check DNS configuration and ensure the hostname is correct.';
      case NetworkErrorType.SSL_ERROR:
        return 'Verify SSL certificate is valid or configure to ignore SSL errors for testing.';
      case NetworkErrorType.CORS_ERROR:
        return 'Check CORS configuration on the server and ensure proper headers are set.';
      case NetworkErrorType.TIMEOUT:
        return 'Increase network timeout or check server responsiveness.';
      default:
        return statusCode === 404
          ? 'Verify the endpoint URL is correct.'
          : 'Check server logs and network configuration.';
    }
  }

  private generateTimeoutSuggestion(operation: TimeoutError['operation']): string {
    switch (operation) {
      case 'selector':
        return 'Increase timeout or verify selector is correct and element appears on page.';
      case 'navigation':
        return 'Check page load performance and increase navigation timeout if needed.';
      default:
        return 'Consider increasing timeout or optimizing the operation.';
    }
  }

  private generateAuthSuggestion(type: AuthError['type']): string {
    switch (type) {
      case 'token_expired':
        return 'Refresh authentication token before making the request.';
      case 'invalid_credentials':
        return 'Verify credentials are correct and properly configured.';
      default:
        return 'Check authentication headers and ensure proper authorization.';
    }
  }

  private generateSelectorSuggestion(
    reason: SelectorError['reason'],
    type: SelectorError['selectorType']
  ): string {
    switch (reason) {
      case 'not_found':
        return `Element not found. Verify ${type} selector is correct and element exists on page.`;
      case 'multiple_found':
        return 'Multiple elements match selector. Make selector more specific.';
      case 'hidden':
        return 'Element is hidden. Use waitForVisible or check page state.';
      default:
        return 'Review selector strategy and page DOM structure.';
    }
  }

  private generateNavigationSuggestion(reason: NavigationError['reason']): string {
    switch (reason) {
      case 'network':
        return 'Check network connectivity and server availability.';
      case 'ssl':
        return 'Verify SSL certificate is valid or configure to ignore SSL errors for testing.';
      default:
        return 'Review navigation target and ensure it is accessible.';
    }
  }

  private generateValidationSuggestion(
    type: ValidationError['validationType'],
    fieldName: string
  ): string {
    switch (type) {
      case 'required':
        return `Field '${fieldName}' is required. Ensure it is provided in the request.`;
      case 'format':
        return `Field '${fieldName}' has incorrect format. Check expected format and adjust input.`;
      default:
        return `Review validation rules for field '${fieldName}'.`;
    }
  }

  /**
   * Suggestion generators for fixes
   */
  private suggestAssertionFixes(failure: AssertionFailure, context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    fixes.push({
      type: 'code',
      description: `Update expected value to match actual: ${failure.actualValue}`,
      priority: 'high',
      effort: 'low',
      automated: true,
      file: context.testFile,
      line: context.lineNumber,
    });

    if (failure.type === AssertionErrorType.VISIBILITY) {
      fixes.push({
        type: 'code',
        description: 'Add waitForSelector before assertion',
        code: `await page.waitForSelector('${failure.selector}', { state: 'visible' });`,
        priority: 'medium',
        effort: 'low',
        automated: true,
      });
    }

    return fixes;
  }

  private suggestNetworkFixes(error: NetworkError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    if (error.type === NetworkErrorType.CONNECTION_REFUSED) {
      fixes.push({
        type: 'infrastructure',
        description: 'Start the server before running tests',
        priority: 'high',
        effort: 'low',
        automated: false,
      });
    }

    if (error.statusCode === 404) {
      fixes.push({
        type: 'code',
        description: 'Update endpoint URL to correct path',
        priority: 'high',
        effort: 'low',
        automated: false,
      });
    }

    return fixes;
  }

  private suggestTimeoutFixes(error: TimeoutError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    fixes.push({
      type: 'config',
      description: `Increase timeout from ${error.timeout}ms to ${error.timeout * 2}ms`,
      priority: 'medium',
      effort: 'low',
      automated: true,
    });

    return fixes;
  }

  private suggestAuthFixes(_error: AuthError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    fixes.push({
      type: 'code',
      description: 'Ensure authentication token is set before request',
      priority: 'high',
      effort: 'medium',
      automated: false,
    });

    return fixes;
  }

  private suggestSelectorFixes(error: SelectorError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    if (error.reason === 'not_found') {
      fixes.push({
        type: 'code',
        description: `Update selector or add waitFor: await page.waitForSelector('${error.selector}')`,
        priority: 'high',
        effort: 'low',
        automated: true,
      });
    }

    return fixes;
  }

  private suggestNavigationFixes(_error: NavigationError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    fixes.push({
      type: 'config',
      description: 'Verify URL configuration and server availability',
      priority: 'high',
      effort: 'medium',
      automated: false,
    });

    return fixes;
  }

  private suggestValidationFixes(error: ValidationError, _context: FailureContext): Fix[] {
    const fixes: Fix[] = [];

    fixes.push({
      type: 'data',
      description: `Update test data for field '${error.fieldName}' to meet validation requirements`,
      priority: 'high',
      effort: 'low',
      automated: false,
    });

    return fixes;
  }
}

/**
 * Convenience function to analyze a single test result
 */
export function analyzeTestFailure(
  testResult: TestResult,
  options?: Partial<AnalysisOptions>
): FailureAnalysis {
  const analyzer = new FailureAnalyzer(options);
  return analyzer.analyzeFailure(testResult);
}
