/**
 * Custom error classes for API Test Agent
 * Following pattern: specific error types with context
 */

export class ApiTestAgentError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FileNotFoundError extends ApiTestAgentError {
  constructor(
    public readonly filePath: string,
    context?: Record<string, unknown>
  ) {
    super(`File not found: ${filePath}`, { ...context, filePath });
    this.name = 'FileNotFoundError';
  }
}

export class ParseError extends ApiTestAgentError {
  constructor(
    message: string,
    public readonly source: string,
    context?: Record<string, unknown>
  ) {
    super(`Parse error in ${source}: ${message}`, { ...context, source });
    this.name = 'ParseError';
  }
}

export class ValidationError extends ApiTestAgentError {
  constructor(
    message: string,
    public readonly errors: string[],
    context?: Record<string, unknown>
  ) {
    super(`Validation failed: ${message}`, { ...context, errors });
    this.name = 'ValidationError';
  }
}

export class UnsupportedVersionError extends ApiTestAgentError {
  constructor(
    public readonly version: string,
    public readonly supportedVersions: string[],
    context?: Record<string, unknown>
  ) {
    super(`Unsupported OpenAPI version: ${version}. Supported: ${supportedVersions.join(', ')}`, {
      ...context,
      version,
      supportedVersions,
    });
    this.name = 'UnsupportedVersionError';
  }
}

export class CircularReferenceError extends ApiTestAgentError {
  constructor(
    public readonly referencePath: string,
    context?: Record<string, unknown>
  ) {
    super(`Circular reference detected: ${referencePath}`, { ...context, referencePath });
    this.name = 'CircularReferenceError';
  }
}
