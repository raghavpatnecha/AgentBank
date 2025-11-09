/**
 * Authentication Helper Utilities
 * Provides utilities for generating auth headers and setup code
 */

import type { AuthScheme } from '../types/openapi-types.js';

/**
 * Auth configuration for test generation
 */
export interface AuthConfig {
  /** Auth type */
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'openIdConnect';
  /** Location for API key auth */
  location?: 'header' | 'query' | 'cookie';
  /** Name/key for API key */
  name?: string;
  /** HTTP scheme for http auth */
  scheme?: string;
  /** Bearer format hint */
  bearerFormat?: string;
}

/**
 * Generate authentication header from config and token
 */
export function generateAuthHeader(config: AuthConfig, token: string): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (config.type) {
    case 'apiKey':
      if (config.location === 'header' && config.name) {
        headers[config.name] = token;
      }
      // Query and cookie params are handled differently in Playwright
      break;

    case 'bearer':
      headers['Authorization'] = `Bearer ${token}`;
      break;

    case 'basic':
      // For basic auth, token should be base64-encoded "username:password"
      headers['Authorization'] = `Basic ${token}`;
      break;

    case 'oauth2':
      // OAuth2 typically uses Bearer token
      headers['Authorization'] = `Bearer ${token}`;
      break;

    case 'openIdConnect':
      // OpenID Connect also uses Bearer token
      headers['Authorization'] = `Bearer ${token}`;
      break;

    default:
      throw new Error(`Unsupported auth type: ${config.type}`);
  }

  return headers;
}

/**
 * Generate query parameters for API key in query
 */
export function generateAuthQuery(config: AuthConfig, token: string): Record<string, string> {
  const query: Record<string, string> = {};

  if (config.type === 'apiKey' && config.location === 'query' && config.name) {
    query[config.name] = token;
  }

  return query;
}

/**
 * Generate cookies for API key in cookie
 */
export function generateAuthCookie(
  config: AuthConfig,
  token: string
): Array<{ name: string; value: string }> {
  const cookies: Array<{ name: string; value: string }> = [];

  if (config.type === 'apiKey' && config.location === 'cookie' && config.name) {
    cookies.push({ name: config.name, value: token });
  }

  return cookies;
}

/**
 * Convert AuthScheme to AuthConfig
 */
export function authSchemeToConfig(scheme: AuthScheme): AuthConfig {
  const config = scheme.config;

  switch (config.type) {
    case 'apiKey':
      return {
        type: 'apiKey',
        location: config.in,
        name: config.name,
      };

    case 'http':
      if (config.scheme === 'bearer') {
        return {
          type: 'bearer',
          scheme: 'bearer',
          bearerFormat: config.bearerFormat,
        };
      } else if (config.scheme === 'basic') {
        return {
          type: 'basic',
          scheme: 'basic',
        };
      }
      throw new Error(`Unsupported HTTP scheme: ${config.scheme}`);

    case 'oauth2':
      return {
        type: 'oauth2',
      };

    case 'openIdConnect':
      return {
        type: 'openIdConnect',
      };

    default:
      throw new Error(`Unsupported security scheme type: ${config.type}`);
  }
}

/**
 * Generate auth setup code for test fixtures
 */
export function generateAuthSetupCode(schemes: AuthScheme[]): string {
  const setupLines: string[] = [];

  for (const scheme of schemes) {
    const config = authSchemeToConfig(scheme);
    const envVarName = getEnvVarName(scheme);

    switch (config.type) {
      case 'apiKey':
        setupLines.push(
          `  // API Key: ${scheme.name}`,
          `  const ${camelCase(scheme.name)} = process.env.${envVarName} || 'test-api-key-${scheme.name}';`
        );
        break;

      case 'bearer':
        setupLines.push(
          `  // Bearer Token: ${scheme.name}`,
          `  const ${camelCase(scheme.name)} = process.env.${envVarName} || 'test-bearer-token';`
        );
        break;

      case 'basic':
        setupLines.push(
          `  // Basic Auth: ${scheme.name}`,
          `  const ${camelCase(scheme.name)}Username = process.env.${envVarName}_USERNAME || 'test-user';`,
          `  const ${camelCase(scheme.name)}Password = process.env.${envVarName}_PASSWORD || 'test-pass';`,
          `  const ${camelCase(scheme.name)} = Buffer.from(\`\${${camelCase(scheme.name)}Username}:\${${camelCase(scheme.name)}Password}\`).toString('base64');`
        );
        break;

      case 'oauth2':
        setupLines.push(
          `  // OAuth2: ${scheme.name}`,
          `  const ${camelCase(scheme.name)} = process.env.${envVarName} || 'test-oauth2-token';`
        );
        break;

      case 'openIdConnect':
        setupLines.push(
          `  // OpenID Connect: ${scheme.name}`,
          `  const ${camelCase(scheme.name)} = process.env.${envVarName} || 'test-oidc-token';`
        );
        break;
    }
  }

  return setupLines.join('\n');
}

/**
 * Get environment variable name for auth scheme
 */
export function getEnvVarName(scheme: AuthScheme): string {
  // Convert scheme name to SCREAMING_SNAKE_CASE
  const baseName = scheme.name
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');

  switch (scheme.config.type) {
    case 'apiKey':
      return `API_KEY_${baseName}`;
    case 'http':
      if (scheme.config.scheme === 'bearer') {
        return `BEARER_TOKEN_${baseName}`;
      }
      return `BASIC_AUTH_${baseName}`;
    case 'oauth2':
      return `OAUTH2_TOKEN_${baseName}`;
    case 'openIdConnect':
      return `OIDC_TOKEN_${baseName}`;
    default:
      return `AUTH_${baseName}`;
  }
}

/**
 * Get auth value from environment or return default
 */
export function getAuthFromEnv(scheme: AuthScheme): string {
  const envVarName = getEnvVarName(scheme);
  const envValue = process.env[envVarName];

  if (envValue) {
    return envValue;
  }

  // Return test defaults
  const config = authSchemeToConfig(scheme);
  switch (config.type) {
    case 'apiKey':
      return `test-api-key-${scheme.name}`;
    case 'bearer':
      return 'test-bearer-token';
    case 'basic':
      // For basic auth, we need to encode username:password
      const username = process.env[`${envVarName}_USERNAME`] || 'test-user';
      const password = process.env[`${envVarName}_PASSWORD`] || 'test-pass';
      return Buffer.from(`${username}:${password}`).toString('base64');
    case 'oauth2':
      return 'test-oauth2-token';
    case 'openIdConnect':
      return 'test-oidc-token';
    default:
      return 'test-token';
  }
}

/**
 * Convert string to camelCase
 */
function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/**
 * Generate auth request options for Playwright
 */
export function generateAuthRequestOptions(
  scheme: AuthScheme,
  token: string
): {
  headers?: Record<string, string>;
  params?: Record<string, string>;
} {
  const config = authSchemeToConfig(scheme);
  const options: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
  } = {};

  // Generate headers
  const headers = generateAuthHeader(config, token);
  if (Object.keys(headers).length > 0) {
    options.headers = headers;
  }

  // Generate query params
  const query = generateAuthQuery(config, token);
  if (Object.keys(query).length > 0) {
    options.params = query;
  }

  return options;
}

/**
 * Get auth fixture variable name
 */
export function getAuthFixtureName(scheme: AuthScheme): string {
  return camelCase(scheme.name);
}

/**
 * Get invalid token for testing unauthorized access
 */
export function getInvalidToken(scheme: AuthScheme): string {
  const config = authSchemeToConfig(scheme);

  switch (config.type) {
    case 'apiKey':
      return 'invalid-api-key';
    case 'bearer':
      return 'invalid-bearer-token';
    case 'basic':
      return Buffer.from('invalid:credentials').toString('base64');
    case 'oauth2':
      return 'invalid-oauth2-token';
    case 'openIdConnect':
      return 'invalid-oidc-token';
    default:
      return 'invalid-token';
  }
}

/**
 * Check if auth scheme is optional (endpoint allows unauthenticated access)
 */
export function isAuthOptional(securityRequirements: Array<Record<string, string[]>>): boolean {
  // Empty security requirement {} means optional auth
  return securityRequirements.some((req) => Object.keys(req).length === 0);
}

/**
 * Extract auth schemes from security requirements
 */
export function extractAuthSchemes(
  securityRequirements: Array<Record<string, string[]>>,
  allSchemes: Map<string, AuthScheme>
): AuthScheme[] {
  const schemes: AuthScheme[] = [];
  const seenNames = new Set<string>();

  for (const requirement of securityRequirements) {
    for (const schemeName of Object.keys(requirement)) {
      if (!seenNames.has(schemeName)) {
        const scheme = allSchemes.get(schemeName);
        if (scheme) {
          schemes.push(scheme);
          seenNames.add(schemeName);
        }
      }
    }
  }

  return schemes;
}

/**
 * Check if security requirements use AND logic (multiple schemes in one requirement)
 */
export function requiresMultipleAuth(requirement: Record<string, string[]>): boolean {
  return Object.keys(requirement).length > 1;
}

/**
 * Generate description for auth test
 */
export function generateAuthTestDescription(
  scheme: AuthScheme,
  isValid: boolean,
  endpoint: string,
  method: string
): string {
  const config = authSchemeToConfig(scheme);
  const validity = isValid ? 'valid' : 'invalid';

  switch (config.type) {
    case 'apiKey':
      return `${method} ${endpoint} - with ${validity} API key (${scheme.name})`;
    case 'bearer':
      return `${method} ${endpoint} - with ${validity} bearer token`;
    case 'basic':
      return `${method} ${endpoint} - with ${validity} basic auth`;
    case 'oauth2':
      return `${method} ${endpoint} - with ${validity} OAuth2 token`;
    case 'openIdConnect':
      return `${method} ${endpoint} - with ${validity} OpenID Connect token`;
    default:
      return `${method} ${endpoint} - with ${validity} auth`;
  }
}
