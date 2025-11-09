/**
 * Sensitive Data Filter
 * Redacts sensitive information from HTTP requests/responses
 */

const REDACTED_PLACEHOLDER = '[REDACTED]';

/**
 * Configuration for sensitive data filtering
 */
export interface SensitiveDataFilterConfig {
  /** Headers to redact (case-insensitive) */
  sensitiveHeaders: string[];
  /** Field names to redact (case-insensitive) */
  sensitiveFields: string[];
  /** Custom regex patterns to redact */
  customPatterns: RegExp[];
  /** Whether to redact email addresses */
  redactEmails: boolean;
  /** Whether to redact credit card numbers */
  redactCreditCards: boolean;
  /** Whether to redact phone numbers */
  redactPhoneNumbers: boolean;
}

/**
 * Default sensitive data filter configuration
 */
export const DEFAULT_FILTER_CONFIG: SensitiveDataFilterConfig = {
  sensitiveHeaders: [
    'authorization',
    'api-key',
    'x-api-key',
    'apikey',
    'api_key',
    'x-auth-token',
    'auth-token',
    'cookie',
    'set-cookie',
    'x-csrf-token',
    'x-access-token',
    'access-token',
  ],
  sensitiveFields: [
    'password',
    'passwd',
    'pwd',
    'token',
    'secret',
    'key',
    'apikey',
    'api_key',
    'apiKey',
    'accesstoken',
    'access_token',
    'accessToken',
    'refreshtoken',
    'refresh_token',
    'refreshToken',
    'privatekey',
    'private_key',
    'privateKey',
    'clientsecret',
    'client_secret',
    'clientSecret',
    'creditcard',
    'credit_card',
    'creditCard',
    'cardnumber',
    'card_number',
    'cardNumber',
    'cvv',
    'cvc',
    'ssn',
    'socialsecurity',
    'social_security',
  ],
  customPatterns: [],
  redactEmails: false, // Optional by default
  redactCreditCards: true,
  redactPhoneNumbers: false, // Optional by default
};

/**
 * Common regex patterns for sensitive data
 */
export const SENSITIVE_PATTERNS = {
  // Credit card patterns (Visa, MasterCard, Amex, Discover)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // Email pattern
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // US Phone number patterns
  phoneUS: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,

  // JWT token pattern
  jwt: /\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,

  // API key pattern (common formats)
  apiKey: /\b[a-zA-Z0-9_-]{32,}\b/g,

  // SSN pattern
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

/**
 * Redact sensitive data from headers
 */
export function redactHeaders(
  headers: Record<string, string | string[]>,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): Record<string, string | string[]> {
  const redacted: Record<string, string | string[]> = {};
  const sensitiveHeadersLower = config.sensitiveHeaders.map(h => h.toLowerCase());

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeadersLower.includes(key.toLowerCase())) {
      redacted[key] = REDACTED_PLACEHOLDER;
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact sensitive data from object (body data)
 */
export function redactObject(
  data: unknown,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return redactString(String(data), config);
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactObject(item, config));
  }

  // Handle objects
  const redacted: Record<string, unknown> = {};
  const sensitiveFieldsLower = config.sensitiveFields.map(f => f.toLowerCase());

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Check if field name is sensitive
    if (sensitiveFieldsLower.includes(key.toLowerCase())) {
      redacted[key] = REDACTED_PLACEHOLDER;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects/arrays
      redacted[key] = redactObject(value, config);
    } else if (typeof value === 'string') {
      // Redact string values
      redacted[key] = redactString(value, config);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redact sensitive patterns from string
 */
export function redactString(
  text: string,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): string {
  let redacted = text;

  // Redact credit cards
  if (config.redactCreditCards) {
    redacted = redacted.replace(SENSITIVE_PATTERNS.creditCard, REDACTED_PLACEHOLDER);
  }

  // Redact emails
  if (config.redactEmails) {
    redacted = redacted.replace(SENSITIVE_PATTERNS.email, REDACTED_PLACEHOLDER);
  }

  // Redact phone numbers
  if (config.redactPhoneNumbers) {
    redacted = redacted.replace(SENSITIVE_PATTERNS.phoneUS, REDACTED_PLACEHOLDER);
  }

  // Redact JWT tokens
  redacted = redacted.replace(SENSITIVE_PATTERNS.jwt, REDACTED_PLACEHOLDER);

  // Redact SSN
  redacted = redacted.replace(SENSITIVE_PATTERNS.ssn, REDACTED_PLACEHOLDER);

  // Apply custom patterns
  for (const pattern of config.customPatterns) {
    redacted = redacted.replace(pattern, REDACTED_PLACEHOLDER);
  }

  return redacted;
}

/**
 * Redact sensitive data from request
 */
export interface RedactedRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  body?: unknown;
}

export function redactRequest(
  request: RedactedRequest,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): RedactedRequest {
  return {
    method: request.method,
    url: request.url,
    headers: redactHeaders(request.headers, config),
    body: request.body ? redactObject(request.body, config) : undefined,
  };
}

/**
 * Redact sensitive data from response
 */
export interface RedactedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body?: unknown;
}

export function redactResponse(
  response: RedactedResponse,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): RedactedResponse {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: redactHeaders(response.headers, config),
    body: response.body ? redactObject(response.body, config) : undefined,
  };
}

/**
 * Add custom pattern to configuration
 */
export function addCustomPattern(
  config: SensitiveDataFilterConfig,
  pattern: RegExp
): SensitiveDataFilterConfig {
  return {
    ...config,
    customPatterns: [...config.customPatterns, pattern],
  };
}

/**
 * Add sensitive field to configuration
 */
export function addSensitiveField(
  config: SensitiveDataFilterConfig,
  fieldName: string
): SensitiveDataFilterConfig {
  return {
    ...config,
    sensitiveFields: [...config.sensitiveFields, fieldName.toLowerCase()],
  };
}

/**
 * Add sensitive header to configuration
 */
export function addSensitiveHeader(
  config: SensitiveDataFilterConfig,
  headerName: string
): SensitiveDataFilterConfig {
  return {
    ...config,
    sensitiveHeaders: [...config.sensitiveHeaders, headerName.toLowerCase()],
  };
}

/**
 * Check if a string contains sensitive data
 */
export function containsSensitiveData(
  text: string,
  config: SensitiveDataFilterConfig = DEFAULT_FILTER_CONFIG
): boolean {
  if (config.redactCreditCards && SENSITIVE_PATTERNS.creditCard.test(text)) {
    return true;
  }
  if (config.redactEmails && SENSITIVE_PATTERNS.email.test(text)) {
    return true;
  }
  if (config.redactPhoneNumbers && SENSITIVE_PATTERNS.phoneUS.test(text)) {
    return true;
  }
  if (SENSITIVE_PATTERNS.jwt.test(text)) {
    return true;
  }
  if (SENSITIVE_PATTERNS.ssn.test(text)) {
    return true;
  }
  for (const pattern of config.customPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}
