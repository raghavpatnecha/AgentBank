/**
 * Unit tests for environment configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getConfig,
  resetConfig,
  loadEnvironment,
  getEnvironmentBaseUrl,
  hasAuthentication,
  getAuthHeaders,
  sanitizeConfig,
  type Environment,
  type EnvironmentConfig,
} from '../../src/config/environment.js';
import {
  validateEnvironment,
  validateField,
  isValid,
  CustomValidator,
  isValidationError,
} from '../../src/config/validator.js';
import { ValidationError } from '../../src/types/errors.js';

describe('environment', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset configuration before each test
    resetConfig();
    // Create a fresh copy of environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
    resetConfig();
  });

  describe('getConfig', () => {
    it('should return configuration object with all required fields', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.apiBaseUrl).toBe('http://localhost:3000');
      expect(config.environment).toBeDefined();
      expect(config.requestTimeout).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.parallelWorkers).toBeDefined();
      expect(config.logLevel).toBeDefined();
    });

    it('should cache configuration on subsequent calls', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2); // Same reference
    });

    it('should throw ValidationError for missing API_BASE_URL', () => {
      delete process.env.API_BASE_URL;

      try {
        getConfig();
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.some(e => e.includes('API_BASE_URL is required'))).toBe(true);
      }
    });

    it('should apply default values for optional configuration', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config = getConfig();

      expect(config.requestTimeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.parallelWorkers).toBe(4);
      expect(config.logLevel).toBe('info');
      expect(config.ci).toBe(false);
    });

    it('should parse environment from ENVIRONMENT variable', () => {
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.API_KEY = 'test-key';
      process.env.ENVIRONMENT = 'production';

      const config = getConfig();

      expect(config.environment).toBe('production');
      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isTest).toBe(false);
    });

    it('should parse environment from NODE_ENV if ENVIRONMENT not set', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.NODE_ENV = 'test';

      const config = getConfig();

      expect(config.environment).toBe('test');
      expect(config.isTest).toBe(true);
    });

    it('should normalize environment strings', () => {
      // Test 'prod' -> 'production' (use HTTPS for production)
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.ENVIRONMENT = 'prod';
      process.env.API_KEY = 'test-key';
      resetConfig();
      expect(getConfig().environment).toBe('production');

      // Test 'stage' -> 'staging'
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.ENVIRONMENT = 'stage';
      resetConfig();
      expect(getConfig().environment).toBe('staging');

      // Test 'dev' -> 'development'
      process.env.ENVIRONMENT = 'dev';
      delete process.env.API_KEY;
      resetConfig();
      expect(getConfig().environment).toBe('development');
    });
  });

  describe('configuration parsing', () => {
    it('should parse integer environment variables', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.MAX_RETRIES = '5';
      process.env.PARALLEL_WORKERS = '8';

      const config = getConfig();

      expect(config.requestTimeout).toBe(60000);
      expect(config.maxRetries).toBe(5);
      expect(config.parallelWorkers).toBe(8);
    });

    it('should use default values for invalid integer strings', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.REQUEST_TIMEOUT = 'invalid';
      process.env.MAX_RETRIES = 'not-a-number';

      const config = getConfig();

      expect(config.requestTimeout).toBe(30000);
      expect(config.maxRetries).toBe(3);
    });

    it('should parse boolean environment variables', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.CI = 'true';
      process.env.INCLUDE_AUTH_TESTS = 'false';
      process.env.INCLUDE_PERFORMANCE_TESTS = 'yes';

      const config = getConfig();

      expect(config.ci).toBe(true);
      expect(config.includeAuthTests).toBe(false);
      expect(config.includePerformanceTests).toBe(true);
    });

    it('should parse log level with normalization', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      // Test 'DEBUG'
      process.env.LOG_LEVEL = 'DEBUG';
      resetConfig();
      expect(getConfig().logLevel).toBe('debug');

      // Test 'warning' -> 'warn'
      process.env.LOG_LEVEL = 'warning';
      resetConfig();
      expect(getConfig().logLevel).toBe('warn');

      // Test invalid defaults to 'info'
      process.env.LOG_LEVEL = 'invalid';
      resetConfig();
      expect(getConfig().logLevel).toBe('info');
    });

    it('should parse optional integer values', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.PLAYWRIGHT_WORKERS = '6';
      process.env.PLAYWRIGHT_TIMEOUT = '45000';
      process.env.FAKER_SEED = '12345';

      const config = getConfig();

      expect(config.playwrightWorkers).toBe(6);
      expect(config.playwrightTimeout).toBe(45000);
      expect(config.fakerSeed).toBe(12345);
    });

    it('should leave optional values undefined when not set', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config = getConfig();

      expect(config.playwrightWorkers).toBeUndefined();
      expect(config.playwrightTimeout).toBeUndefined();
      expect(config.fakerSeed).toBeUndefined();
    });
  });

  describe('authentication configuration', () => {
    it('should load API key authentication', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_KEY = 'test-api-key';

      const config = getConfig();

      expect(config.apiKey).toBe('test-api-key');
    });

    it('should load bearer token authentication', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_TOKEN = 'test-bearer-token';

      const config = getConfig();

      expect(config.authToken).toBe('test-bearer-token');
    });

    it('should load OAuth2 configuration when all fields present', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.OAUTH_CLIENT_ID = 'client-id';
      process.env.OAUTH_CLIENT_SECRET = 'client-secret';
      process.env.OAUTH_TOKEN_URL = 'https://auth.example.com/token';

      const config = getConfig();

      expect(config.oauth).toBeDefined();
      expect(config.oauth?.clientId).toBe('client-id');
      expect(config.oauth?.clientSecret).toBe('client-secret');
      expect(config.oauth?.tokenUrl).toBe('https://auth.example.com/token');
    });

    it('should not load OAuth2 when fields are incomplete', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.OAUTH_CLIENT_ID = 'client-id';
      // Missing OAUTH_CLIENT_SECRET and OAUTH_TOKEN_URL

      expect(() => getConfig()).toThrow(ValidationError);
    });

    it('should load Basic Auth configuration when both fields present', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_USERNAME = 'testuser';
      process.env.API_PASSWORD = 'testpass';

      const config = getConfig();

      expect(config.basicAuth).toBeDefined();
      expect(config.basicAuth?.username).toBe('testuser');
      expect(config.basicAuth?.password).toBe('testpass');
    });

    it('should not load Basic Auth when fields are incomplete', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_USERNAME = 'testuser';
      // Missing API_PASSWORD

      expect(() => getConfig()).toThrow(ValidationError);
    });
  });

  describe('resetConfig', () => {
    it('should clear cached configuration', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config1 = getConfig();
      resetConfig();

      process.env.API_BASE_URL = 'http://localhost:4000';
      const config2 = getConfig();

      expect(config1.apiBaseUrl).toBe('http://localhost:3000');
      expect(config2.apiBaseUrl).toBe('http://localhost:4000');
    });
  });

  describe('getEnvironmentBaseUrl', () => {
    it('should return configured URL for current environment', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.ENVIRONMENT = 'development';

      const url = getEnvironmentBaseUrl('development');

      expect(url).toBe('http://localhost:3000');
    });

    it('should return environment-specific URL from env vars', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.ENVIRONMENT = 'development';
      process.env.API_BASE_URL_PRODUCTION = 'https://api.example.com';

      const url = getEnvironmentBaseUrl('production');

      expect(url).toBe('https://api.example.com');
    });

    it('should fallback to configured URL if environment-specific not found', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.ENVIRONMENT = 'development';

      const url = getEnvironmentBaseUrl('staging');

      expect(url).toBe('http://localhost:3000');
    });
  });

  describe('hasAuthentication', () => {
    it('should return true when API key is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_KEY = 'test-key';

      expect(hasAuthentication()).toBe(true);
    });

    it('should return true when bearer token is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_TOKEN = 'test-token';

      expect(hasAuthentication()).toBe(true);
    });

    it('should return true when OAuth2 is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.OAUTH_CLIENT_ID = 'client-id';
      process.env.OAUTH_CLIENT_SECRET = 'client-secret';
      process.env.OAUTH_TOKEN_URL = 'https://auth.example.com/token';

      expect(hasAuthentication()).toBe(true);
    });

    it('should return true when Basic Auth is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_USERNAME = 'user';
      process.env.API_PASSWORD = 'pass';

      expect(hasAuthentication()).toBe(true);
    });

    it('should return false when no authentication is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      expect(hasAuthentication()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return API key header', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_KEY = 'test-api-key';

      const headers = getAuthHeaders();

      expect(headers['X-API-Key']).toBe('test-api-key');
    });

    it('should return Bearer token header', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_TOKEN = 'test-token';

      const headers = getAuthHeaders();

      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should return Basic Auth header', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_USERNAME = 'testuser';
      process.env.API_PASSWORD = 'testpass';

      const headers = getAuthHeaders();

      expect(headers['Authorization']).toBeDefined();
      expect(headers['Authorization']).toMatch(/^Basic /);

      // Decode and verify
      const encodedCredentials = headers['Authorization']?.replace('Basic ', '');
      const decodedCredentials = Buffer.from(encodedCredentials || '', 'base64').toString();
      expect(decodedCredentials).toBe('testuser:testpass');
    });

    it('should return empty object when no authentication is configured', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const headers = getAuthHeaders();

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should prioritize Basic Auth over Bearer token', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_TOKEN = 'test-token';
      process.env.API_USERNAME = 'testuser';
      process.env.API_PASSWORD = 'testpass';

      const headers = getAuthHeaders();

      // Basic Auth should override Bearer token
      expect(headers['Authorization']).toMatch(/^Basic /);
    });
  });

  describe('sanitizeConfig', () => {
    it('should remove sensitive data from configuration', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      process.env.API_KEY = 'secret-key';
      process.env.API_TOKEN = 'secret-token';

      const config = getConfig();
      const sanitized = sanitizeConfig(config);

      expect(sanitized.apiBaseUrl).toBe('http://localhost:3000');
      expect(sanitized.apiKey).toBeUndefined();
      expect(sanitized.authToken).toBeUndefined();
      expect(sanitized.oauth).toBeUndefined();
      expect(sanitized.basicAuth).toBeUndefined();
    });

    it('should preserve non-sensitive configuration', () => {
      process.env.API_BASE_URL = 'https://api.example.com';
      process.env.ENVIRONMENT = 'production';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.API_KEY = 'test-key';

      const config = getConfig();
      const sanitized = sanitizeConfig(config);

      expect(sanitized.environment).toBe('production');
      expect(sanitized.requestTimeout).toBe(60000);
      expect(sanitized.logLevel).toBe('info');
    });
  });
});

describe('validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetConfig();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetConfig();
  });

  describe('validateEnvironment', () => {
    it('should pass validation for valid configuration', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';

      const config = getConfig();

      expect(() => validateEnvironment(config)).not.toThrow();
    });

    it('should throw ValidationError for missing API_BASE_URL', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: '',
        requestTimeout: 30000,
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      try {
        validateEnvironment(config);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.some(e => e.includes('API_BASE_URL is required'))).toBe(true);
      }
    });

    it('should throw ValidationError for invalid URL format', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: 'not-a-valid-url',
        requestTimeout: 30000,
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      try {
        validateEnvironment(config);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.some(e => e.includes('must be a valid URL'))).toBe(true);
      }
    });

    it('should warn about HTTP in production', () => {
      const config = {
        environment: 'production' as Environment,
        isProduction: true,
        isDevelopment: false,
        isTest: false,
        apiBaseUrl: 'http://api.example.com',
        apiKey: 'test-key',
        requestTimeout: 30000,
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      try {
        validateEnvironment(config);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.some(e => e.includes('should use HTTPS in production'))).toBe(true);
      }
    });

    it('should validate timeout ranges', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: 'http://localhost:3000',
        requestTimeout: 500, // Too small
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      try {
        validateEnvironment(config);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.some(e => e.includes('REQUEST_TIMEOUT should be between'))).toBe(true);
      }
    });

    it('should collect multiple validation errors', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: '',
        requestTimeout: -1,
        maxRetries: -1,
        parallelWorkers: 0,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: '',
        testReportDir: '',
      };

      try {
        validateEnvironment(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors.length).toBeGreaterThan(1);
      }
    });
  });

  describe('validateField', () => {
    it('should validate specific field', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      const config = getConfig();

      const errors = validateField(config, 'apiBaseUrl');

      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid field', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: '',
        requestTimeout: 30000,
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      const errors = validateField(config, 'apiBaseUrl');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('API_BASE_URL');
    });
  });

  describe('isValid', () => {
    it('should return true for valid configuration', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      const config = getConfig();

      expect(isValid(config)).toBe(true);
    });

    it('should return false for invalid configuration', () => {
      const config = {
        environment: 'development' as Environment,
        isProduction: false,
        isDevelopment: true,
        isTest: false,
        apiBaseUrl: '',
        requestTimeout: 30000,
        maxRetries: 3,
        parallelWorkers: 4,
        logLevel: 'info' as const,
        ci: false,
        includeAuthTests: true,
        includeValidationTests: true,
        includeEdgeCaseTests: true,
        includePerformanceTests: false,
        testOutputDir: 'tests/generated',
        testReportDir: 'test-results',
      };

      expect(isValid(config)).toBe(false);
    });
  });

  describe('CustomValidator', () => {
    it('should validate with custom rules', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      const config = getConfig();

      const validator = new CustomValidator();
      validator.addRule({
        field: 'custom',
        validate: () => true,
        errorMessage: 'Custom error',
      });

      expect(() => validator.validate(config)).not.toThrow();
    });

    it('should throw ValidationError for failing custom rules', () => {
      process.env.API_BASE_URL = 'http://localhost:3000';
      const config = getConfig();

      const validator = new CustomValidator();
      validator.addRule({
        field: 'custom',
        validate: () => false,
        errorMessage: 'Custom validation failed',
      });

      expect(() => validator.validate(config)).toThrow(ValidationError);
      expect(() => validator.validate(config)).toThrow('Custom validation failed');
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError', () => {
      const error = new ValidationError('Test error', ['error 1']);

      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other error types', () => {
      const error = new Error('Regular error');

      expect(isValidationError(error)).toBe(false);
    });
  });
});
