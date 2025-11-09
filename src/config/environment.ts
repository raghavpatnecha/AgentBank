/**
 * Environment Configuration Manager
 * Loads and manages environment variables with type safety and validation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { validateEnvironment } from './validator.js';

/**
 * Supported environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Log level types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Type-safe configuration interface
 */
export interface EnvironmentConfig {
  // Environment
  readonly environment: Environment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly isTest: boolean;

  // API Configuration
  readonly apiBaseUrl: string;
  readonly apiKey?: string;
  readonly authToken?: string;

  // OAuth2 Configuration
  readonly oauth?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  };

  // Basic Auth Configuration
  readonly basicAuth?: {
    username: string;
    password: string;
  };

  // Request Configuration
  readonly requestTimeout: number;
  readonly maxRetries: number;

  // Execution Configuration
  readonly parallelWorkers: number;
  readonly logLevel: LogLevel;

  // Test Configuration
  readonly ci: boolean;
  readonly playwrightWorkers?: number;
  readonly playwrightTimeout?: number;

  // Test Data Configuration
  readonly fakerSeed?: number;

  // Feature Flags
  readonly includeAuthTests: boolean;
  readonly includeValidationTests: boolean;
  readonly includeEdgeCaseTests: boolean;
  readonly includePerformanceTests: boolean;

  // Output Configuration
  readonly testOutputDir: string;
  readonly testReportDir: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  environment: 'development' as Environment,
  requestTimeout: 30000,
  maxRetries: 3,
  parallelWorkers: 4,
  logLevel: 'info' as LogLevel,
  ci: false,
  includeAuthTests: true,
  includeValidationTests: true,
  includeEdgeCaseTests: true,
  includePerformanceTests: false,
  testOutputDir: 'tests/generated',
  testReportDir: 'test-results',
};

/**
 * Loaded configuration instance
 */
let configInstance: EnvironmentConfig | null = null;

/**
 * Parse environment string to Environment type
 */
function parseEnvironment(env?: string): Environment {
  const normalizedEnv = env?.toLowerCase();

  switch (normalizedEnv) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'test':
    case 'testing':
      return 'test';
    case 'development':
    case 'dev':
    default:
      return 'development';
  }
}

/**
 * Parse log level string to LogLevel type
 */
function parseLogLevel(level?: string): LogLevel {
  const normalizedLevel = level?.toLowerCase();

  switch (normalizedLevel) {
    case 'debug':
      return 'debug';
    case 'info':
      return 'info';
    case 'warn':
    case 'warning':
      return 'warn';
    case 'error':
      return 'error';
    default:
      return DEFAULT_CONFIG.logLevel;
  }
}

/**
 * Parse boolean environment variable
 */
function parseBoolean(value?: string, defaultValue = false): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const normalized = value.toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Parse integer environment variable
 */
function parseInteger(value?: string, defaultValue?: number): number | undefined {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Load OAuth configuration if all required values are present
 */
function loadOAuthConfig(env: NodeJS.ProcessEnv): EnvironmentConfig['oauth'] {
  const clientId = env.OAUTH_CLIENT_ID;
  const clientSecret = env.OAUTH_CLIENT_SECRET;
  const tokenUrl = env.OAUTH_TOKEN_URL;

  if (clientId && clientSecret && tokenUrl) {
    return {
      clientId,
      clientSecret,
      tokenUrl,
    };
  }

  return undefined;
}

/**
 * Load Basic Auth configuration if all required values are present
 */
function loadBasicAuthConfig(env: NodeJS.ProcessEnv): EnvironmentConfig['basicAuth'] {
  const username = env.API_USERNAME;
  const password = env.API_PASSWORD;

  if (username && password) {
    return {
      username,
      password,
    };
  }

  return undefined;
}

/**
 * Load environment variables from .env file
 * @param envPath Optional path to .env file
 */
export function loadEnvironment(envPath?: string): void {
  // Load .env file if it exists
  const envFilePath = envPath || path.join(process.cwd(), '.env');
  dotenv.config({ path: envFilePath });

  // Also try to load environment-specific .env files
  const environment = parseEnvironment(process.env.ENVIRONMENT || process.env.NODE_ENV);
  const envSpecificPath = path.join(process.cwd(), `.env.${environment}`);
  dotenv.config({ path: envSpecificPath });
}

/**
 * Build configuration from environment variables
 */
function buildConfig(env: NodeJS.ProcessEnv): EnvironmentConfig {
  const environment = parseEnvironment(env.ENVIRONMENT || env.NODE_ENV);
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';
  const isTest = environment === 'test';

  const apiBaseUrl = env.API_BASE_URL || '';
  const apiKey = env.API_KEY;
  const authToken = env.API_TOKEN;

  const oauth = loadOAuthConfig(env);
  const basicAuth = loadBasicAuthConfig(env);

  const requestTimeout = parseInteger(env.REQUEST_TIMEOUT, DEFAULT_CONFIG.requestTimeout) ?? DEFAULT_CONFIG.requestTimeout;
  const maxRetries = parseInteger(env.MAX_RETRIES, DEFAULT_CONFIG.maxRetries) ?? DEFAULT_CONFIG.maxRetries;
  const parallelWorkers = parseInteger(env.PARALLEL_WORKERS, DEFAULT_CONFIG.parallelWorkers) ?? DEFAULT_CONFIG.parallelWorkers;

  const logLevel = parseLogLevel(env.LOG_LEVEL);
  const ci = parseBoolean(env.CI, DEFAULT_CONFIG.ci);

  const playwrightWorkers = parseInteger(env.PLAYWRIGHT_WORKERS);
  const playwrightTimeout = parseInteger(env.PLAYWRIGHT_TIMEOUT);
  const fakerSeed = parseInteger(env.FAKER_SEED);

  const includeAuthTests = parseBoolean(env.INCLUDE_AUTH_TESTS, DEFAULT_CONFIG.includeAuthTests);
  const includeValidationTests = parseBoolean(env.INCLUDE_VALIDATION_TESTS, DEFAULT_CONFIG.includeValidationTests);
  const includeEdgeCaseTests = parseBoolean(env.INCLUDE_EDGE_CASE_TESTS, DEFAULT_CONFIG.includeEdgeCaseTests);
  const includePerformanceTests = parseBoolean(env.INCLUDE_PERFORMANCE_TESTS, DEFAULT_CONFIG.includePerformanceTests);

  const testOutputDir = env.TEST_OUTPUT_DIR || DEFAULT_CONFIG.testOutputDir;
  const testReportDir = env.TEST_REPORT_DIR || DEFAULT_CONFIG.testReportDir;

  return {
    environment,
    isProduction,
    isDevelopment,
    isTest,
    apiBaseUrl,
    apiKey,
    authToken,
    oauth,
    basicAuth,
    requestTimeout,
    maxRetries,
    parallelWorkers,
    logLevel,
    ci,
    playwrightWorkers,
    playwrightTimeout,
    fakerSeed,
    includeAuthTests,
    includeValidationTests,
    includeEdgeCaseTests,
    includePerformanceTests,
    testOutputDir,
    testReportDir,
  };
}

/**
 * Get the current configuration
 * Loads and validates environment on first call
 * @returns Type-safe configuration object
 * @throws {ValidationError} If required environment variables are missing or invalid
 */
export function getConfig(): EnvironmentConfig {
  if (configInstance === null) {
    // Load environment if not already loaded
    if (!process.env.API_BASE_URL) {
      loadEnvironment();
    }

    // Build configuration from environment
    const config = buildConfig(process.env);

    // Validate configuration
    validateEnvironment(config);

    // Cache the validated configuration
    configInstance = config;
  }

  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}

/**
 * Get environment-specific base URL
 * @param environment Environment name
 * @returns Base URL for the environment
 */
export function getEnvironmentBaseUrl(environment: Environment): string {
  const config = getConfig();

  // If environment matches current, return configured URL
  if (environment === config.environment) {
    return config.apiBaseUrl;
  }

  // Try to get environment-specific URL from env vars
  const envKey = `API_BASE_URL_${environment.toUpperCase()}`;
  return process.env[envKey] || config.apiBaseUrl;
}

/**
 * Check if configuration has authentication
 */
export function hasAuthentication(): boolean {
  const config = getConfig();
  return !!(config.apiKey || config.authToken || config.oauth || config.basicAuth);
}

/**
 * Get authentication headers based on configuration
 */
export function getAuthHeaders(): Record<string, string> {
  const config = getConfig();
  const headers: Record<string, string> = {};

  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
  }

  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  if (config.basicAuth) {
    const credentials = Buffer.from(
      `${config.basicAuth.username}:${config.basicAuth.password}`
    ).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  return headers;
}

/**
 * Sanitize configuration for logging (remove sensitive data)
 */
export function sanitizeConfig(config: EnvironmentConfig): Partial<EnvironmentConfig> {
  return {
    environment: config.environment,
    isProduction: config.isProduction,
    isDevelopment: config.isDevelopment,
    isTest: config.isTest,
    apiBaseUrl: config.apiBaseUrl,
    requestTimeout: config.requestTimeout,
    maxRetries: config.maxRetries,
    parallelWorkers: config.parallelWorkers,
    logLevel: config.logLevel,
    ci: config.ci,
    playwrightWorkers: config.playwrightWorkers,
    playwrightTimeout: config.playwrightTimeout,
    includeAuthTests: config.includeAuthTests,
    includeValidationTests: config.includeValidationTests,
    includeEdgeCaseTests: config.includeEdgeCaseTests,
    includePerformanceTests: config.includePerformanceTests,
    testOutputDir: config.testOutputDir,
    testReportDir: config.testReportDir,
    // Exclude sensitive data:
    // - apiKey
    // - authToken
    // - oauth
    // - basicAuth
  };
}
