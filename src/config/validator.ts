/**
 * Environment Configuration Validator
 * Validates environment variables with custom rules and clear error messages
 */

import { ValidationError } from '../types/errors.js';
import type { EnvironmentConfig } from './environment.js';

/**
 * Validation rule type
 */
type ValidationRule = {
  field: string;
  validate: (config: EnvironmentConfig) => boolean;
  errorMessage: string;
};

/**
 * Collection of validation rules
 */
const VALIDATION_RULES: ValidationRule[] = [
  // Required: API_BASE_URL
  {
    field: 'apiBaseUrl',
    validate: (config) => !!config.apiBaseUrl && config.apiBaseUrl.trim().length > 0,
    errorMessage: 'API_BASE_URL is required and cannot be empty',
  },

  // API_BASE_URL must be a valid URL
  {
    field: 'apiBaseUrl',
    validate: (config) => {
      if (!config.apiBaseUrl) return true; // Already checked by previous rule
      try {
        new URL(config.apiBaseUrl);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'API_BASE_URL must be a valid URL (e.g., http://localhost:3000 or https://api.example.com)',
  },

  // API_BASE_URL should use https in production
  {
    field: 'apiBaseUrl',
    validate: (config) => {
      if (!config.isProduction) return true;
      if (!config.apiBaseUrl) return true;
      try {
        const url = new URL(config.apiBaseUrl);
        return url.protocol === 'https:';
      } catch {
        return true; // Already validated by previous rule
      }
    },
    errorMessage: 'API_BASE_URL should use HTTPS in production environment',
  },

  // At least one authentication method should be configured in production
  {
    field: 'authentication',
    validate: (config) => {
      if (!config.isProduction) return true;
      return !!(config.apiKey || config.authToken || config.oauth || config.basicAuth);
    },
    errorMessage: 'At least one authentication method (API_KEY, API_TOKEN, OAuth2, or Basic Auth) should be configured in production',
  },

  // OAuth2: All OAuth fields required if any is set
  {
    field: 'oauth',
    validate: (config) => {
      const hasAnyOAuth = !!(
        process.env.OAUTH_CLIENT_ID ||
        process.env.OAUTH_CLIENT_SECRET ||
        process.env.OAUTH_TOKEN_URL
      );

      if (!hasAnyOAuth) return true; // No OAuth configured, that's fine

      // If any OAuth field is set, all must be set
      return !!(
        config.oauth?.clientId &&
        config.oauth?.clientSecret &&
        config.oauth?.tokenUrl
      );
    },
    errorMessage: 'OAuth2 configuration incomplete: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, and OAUTH_TOKEN_URL must all be set together',
  },

  // Basic Auth: Both username and password required if any is set
  {
    field: 'basicAuth',
    validate: (config) => {
      const hasAnyBasicAuth = !!(process.env.API_USERNAME || process.env.API_PASSWORD);

      if (!hasAnyBasicAuth) return true; // No Basic Auth configured, that's fine

      // If any Basic Auth field is set, both must be set
      return !!(config.basicAuth?.username && config.basicAuth?.password);
    },
    errorMessage: 'Basic Auth configuration incomplete: API_USERNAME and API_PASSWORD must both be set together',
  },

  // REQUEST_TIMEOUT must be positive
  {
    field: 'requestTimeout',
    validate: (config) => config.requestTimeout > 0,
    errorMessage: 'REQUEST_TIMEOUT must be a positive number (in milliseconds)',
  },

  // REQUEST_TIMEOUT should be reasonable (not too small, not too large)
  {
    field: 'requestTimeout',
    validate: (config) => config.requestTimeout >= 1000 && config.requestTimeout <= 300000,
    errorMessage: 'REQUEST_TIMEOUT should be between 1000ms (1s) and 300000ms (5min)',
  },

  // MAX_RETRIES must be non-negative
  {
    field: 'maxRetries',
    validate: (config) => config.maxRetries >= 0,
    errorMessage: 'MAX_RETRIES must be a non-negative number',
  },

  // MAX_RETRIES should be reasonable
  {
    field: 'maxRetries',
    validate: (config) => config.maxRetries <= 10,
    errorMessage: 'MAX_RETRIES should not exceed 10 to avoid excessive retry loops',
  },

  // PARALLEL_WORKERS must be positive
  {
    field: 'parallelWorkers',
    validate: (config) => config.parallelWorkers > 0,
    errorMessage: 'PARALLEL_WORKERS must be a positive number',
  },

  // PARALLEL_WORKERS should be reasonable
  {
    field: 'parallelWorkers',
    validate: (config) => config.parallelWorkers <= 50,
    errorMessage: 'PARALLEL_WORKERS should not exceed 50 to avoid resource exhaustion',
  },

  // PLAYWRIGHT_WORKERS must be positive if set
  {
    field: 'playwrightWorkers',
    validate: (config) => config.playwrightWorkers === undefined || config.playwrightWorkers > 0,
    errorMessage: 'PLAYWRIGHT_WORKERS must be a positive number if set',
  },

  // PLAYWRIGHT_TIMEOUT must be positive if set
  {
    field: 'playwrightTimeout',
    validate: (config) => config.playwrightTimeout === undefined || config.playwrightTimeout > 0,
    errorMessage: 'PLAYWRIGHT_TIMEOUT must be a positive number (in milliseconds) if set',
  },

  // FAKER_SEED must be positive if set
  {
    field: 'fakerSeed',
    validate: (config) => config.fakerSeed === undefined || config.fakerSeed >= 0,
    errorMessage: 'FAKER_SEED must be a non-negative number if set',
  },

  // TEST_OUTPUT_DIR must not be empty
  {
    field: 'testOutputDir',
    validate: (config) => config.testOutputDir.trim().length > 0,
    errorMessage: 'TEST_OUTPUT_DIR cannot be empty',
  },

  // TEST_REPORT_DIR must not be empty
  {
    field: 'testReportDir',
    validate: (config) => config.testReportDir.trim().length > 0,
    errorMessage: 'TEST_REPORT_DIR cannot be empty',
  },

  // OAuth token URL must be a valid URL
  {
    field: 'oauth.tokenUrl',
    validate: (config) => {
      if (!config.oauth?.tokenUrl) return true;
      try {
        new URL(config.oauth.tokenUrl);
        return true;
      } catch {
        return false;
      }
    },
    errorMessage: 'OAUTH_TOKEN_URL must be a valid URL',
  },
];

/**
 * Validate environment configuration
 * @param config Configuration to validate
 * @throws {ValidationError} If validation fails
 */
export function validateEnvironment(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // Run all validation rules
  for (const rule of VALIDATION_RULES) {
    try {
      const isValid = rule.validate(config);
      if (!isValid) {
        errors.push(`[${rule.field}] ${rule.errorMessage}`);
      }
    } catch (error) {
      // If validation itself throws, catch and add to errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`[${rule.field}] Validation error: ${errorMessage}`);
    }
  }

  // If there are errors, throw ValidationError with all collected errors
  if (errors.length > 0) {
    throw new ValidationError(
      'Environment configuration validation failed',
      errors,
      {
        configFields: Object.keys(config),
        errorCount: errors.length,
      }
    );
  }
}

/**
 * Validate specific configuration field
 * @param config Configuration to validate
 * @param field Field name to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateField(config: EnvironmentConfig, field: string): string[] {
  const errors: string[] = [];

  // Find and run validation rules for the specific field
  const fieldRules = VALIDATION_RULES.filter((rule) => rule.field === field);

  for (const rule of fieldRules) {
    try {
      const isValid = rule.validate(config);
      if (!isValid) {
        errors.push(rule.errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Validation error: ${errorMessage}`);
    }
  }

  return errors;
}

/**
 * Check if configuration is valid
 * @param config Configuration to check
 * @returns True if valid, false otherwise
 */
export function isValid(config: EnvironmentConfig): boolean {
  try {
    validateEnvironment(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all validation rules (useful for documentation/testing)
 */
export function getValidationRules(): ReadonlyArray<Readonly<ValidationRule>> {
  return VALIDATION_RULES;
}

/**
 * Custom validation for specific requirements
 */
export class CustomValidator {
  private rules: ValidationRule[] = [];

  /**
   * Add a custom validation rule
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Validate configuration with custom rules
   */
  validate(config: EnvironmentConfig): void {
    const errors: string[] = [];

    for (const rule of this.rules) {
      try {
        const isValid = rule.validate(config);
        if (!isValid) {
          errors.push(`[${rule.field}] ${rule.errorMessage}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`[${rule.field}] Validation error: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Custom validation failed', errors, {
        customRuleCount: this.rules.length,
      });
    }
  }
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
