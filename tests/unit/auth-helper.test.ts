/**
 * Unit tests for Authentication Helper Utilities
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import type { AuthScheme } from '../../src/types/openapi-types.js';
import {
  generateAuthHeader,
  generateAuthQuery,
  generateAuthCookie,
  authSchemeToConfig,
  generateAuthSetupCode,
  getEnvVarName,
  getAuthFromEnv,
  generateAuthRequestOptions,
  getAuthFixtureName,
  getInvalidToken,
  isAuthOptional,
  extractAuthSchemes,
  requiresMultipleAuth,
  generateAuthTestDescription,
} from '../../src/utils/auth-helper.js';

describe('auth-helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment after each test
    process.env = originalEnv;
  });

  describe('generateAuthHeader', () => {
    test('generates API key header', () => {
      const config = {
        type: 'apiKey' as const,
        location: 'header' as const,
        name: 'X-API-Key',
      };

      const headers = generateAuthHeader(config, 'test-key-123');

      expect(headers).toEqual({
        'X-API-Key': 'test-key-123',
      });
    });

    test('generates bearer token header', () => {
      const config = {
        type: 'bearer' as const,
      };

      const headers = generateAuthHeader(config, 'token-abc');

      expect(headers).toEqual({
        Authorization: 'Bearer token-abc',
      });
    });

    test('generates basic auth header', () => {
      const config = {
        type: 'basic' as const,
      };

      const credentials = Buffer.from('user:pass').toString('base64');
      const headers = generateAuthHeader(config, credentials);

      expect(headers).toEqual({
        Authorization: `Basic ${credentials}`,
      });
    });

    test('generates OAuth2 header', () => {
      const config = {
        type: 'oauth2' as const,
      };

      const headers = generateAuthHeader(config, 'oauth-token');

      expect(headers).toEqual({
        Authorization: 'Bearer oauth-token',
      });
    });

    test('generates OpenID Connect header', () => {
      const config = {
        type: 'openIdConnect' as const,
      };

      const headers = generateAuthHeader(config, 'oidc-token');

      expect(headers).toEqual({
        Authorization: 'Bearer oidc-token',
      });
    });

    test('returns empty headers for API key in query', () => {
      const config = {
        type: 'apiKey' as const,
        location: 'query' as const,
        name: 'api_key',
      };

      const headers = generateAuthHeader(config, 'test-key');

      expect(headers).toEqual({});
    });
  });

  describe('generateAuthQuery', () => {
    test('generates API key query parameter', () => {
      const config = {
        type: 'apiKey' as const,
        location: 'query' as const,
        name: 'api_key',
      };

      const query = generateAuthQuery(config, 'test-key-123');

      expect(query).toEqual({
        api_key: 'test-key-123',
      });
    });

    test('returns empty for non-query auth types', () => {
      const config = {
        type: 'bearer' as const,
      };

      const query = generateAuthQuery(config, 'token');

      expect(query).toEqual({});
    });

    test('returns empty for API key in header', () => {
      const config = {
        type: 'apiKey' as const,
        location: 'header' as const,
        name: 'X-API-Key',
      };

      const query = generateAuthQuery(config, 'test-key');

      expect(query).toEqual({});
    });
  });

  describe('generateAuthCookie', () => {
    test('generates API key cookie', () => {
      const config = {
        type: 'apiKey' as const,
        location: 'cookie' as const,
        name: 'auth_token',
      };

      const cookies = generateAuthCookie(config, 'cookie-value');

      expect(cookies).toEqual([
        { name: 'auth_token', value: 'cookie-value' },
      ]);
    });

    test('returns empty for non-cookie auth types', () => {
      const config = {
        type: 'bearer' as const,
      };

      const cookies = generateAuthCookie(config, 'token');

      expect(cookies).toEqual([]);
    });
  });

  describe('authSchemeToConfig', () => {
    test('converts API key scheme', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      };

      const config = authSchemeToConfig(scheme);

      expect(config).toEqual({
        type: 'apiKey',
        location: 'header',
        name: 'X-API-Key',
      });
    });

    test('converts bearer token scheme', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      };

      const config = authSchemeToConfig(scheme);

      expect(config).toEqual({
        type: 'bearer',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
    });

    test('converts basic auth scheme', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: {
          type: 'http',
          scheme: 'basic',
        },
      };

      const config = authSchemeToConfig(scheme);

      expect(config).toEqual({
        type: 'basic',
        scheme: 'basic',
      });
    });

    test('converts OAuth2 scheme', () => {
      const scheme: AuthScheme = {
        name: 'oauth2',
        type: 'oauth2',
        config: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access' },
            },
          },
        },
      };

      const config = authSchemeToConfig(scheme);

      expect(config).toEqual({
        type: 'oauth2',
      });
    });

    test('converts OpenID Connect scheme', () => {
      const scheme: AuthScheme = {
        name: 'openId',
        type: 'openIdConnect',
        config: {
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        },
      };

      const config = authSchemeToConfig(scheme);

      expect(config).toEqual({
        type: 'openIdConnect',
      });
    });
  });

  describe('getEnvVarName', () => {
    test('generates env var name for API key', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const envVar = getEnvVarName(scheme);

      expect(envVar).toBe('API_KEY_API_KEY_HEADER');
    });

    test('generates env var name for bearer token', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const envVar = getEnvVarName(scheme);

      expect(envVar).toBe('BEARER_TOKEN_BEARER_AUTH');
    });

    test('generates env var name for basic auth', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: { type: 'http', scheme: 'basic' },
      };

      const envVar = getEnvVarName(scheme);

      expect(envVar).toBe('BASIC_AUTH_BASIC_AUTH');
    });

    test('handles camelCase names', () => {
      const scheme: AuthScheme = {
        name: 'myCustomAuth',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-Auth' },
      };

      const envVar = getEnvVarName(scheme);

      expect(envVar).toBe('API_KEY_MY_CUSTOM_AUTH');
    });
  });

  describe('getAuthFromEnv', () => {
    test('returns env value when set', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      process.env.API_KEY_API_KEY_HEADER = 'real-api-key';

      const value = getAuthFromEnv(scheme);

      expect(value).toBe('real-api-key');
    });

    test('returns default for API key when env not set', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const value = getAuthFromEnv(scheme);

      expect(value).toBe('test-api-key-apiKeyHeader');
    });

    test('returns default for bearer token', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const value = getAuthFromEnv(scheme);

      expect(value).toBe('test-bearer-token');
    });

    test('returns encoded credentials for basic auth', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: { type: 'http', scheme: 'basic' },
      };

      const value = getAuthFromEnv(scheme);
      const decoded = Buffer.from(value, 'base64').toString('utf-8');

      expect(decoded).toBe('test-user:test-pass');
    });

    test('uses env vars for basic auth username and password', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: { type: 'http', scheme: 'basic' },
      };

      process.env.BASIC_AUTH_BASIC_AUTH_USERNAME = 'myuser';
      process.env.BASIC_AUTH_BASIC_AUTH_PASSWORD = 'mypass';

      const value = getAuthFromEnv(scheme);
      const decoded = Buffer.from(value, 'base64').toString('utf-8');

      expect(decoded).toBe('myuser:mypass');
    });
  });

  describe('getAuthFixtureName', () => {
    test('converts scheme name to camelCase', () => {
      const scheme: AuthScheme = {
        name: 'api-key-header',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const fixtureName = getAuthFixtureName(scheme);

      expect(fixtureName).toBe('apiKeyHeader');
    });

    test('handles already camelCase names', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const fixtureName = getAuthFixtureName(scheme);

      expect(fixtureName).toBe('bearerAuth');
    });
  });

  describe('getInvalidToken', () => {
    test('returns invalid token for API key', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const token = getInvalidToken(scheme);

      expect(token).toBe('invalid-api-key');
    });

    test('returns invalid token for bearer', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const token = getInvalidToken(scheme);

      expect(token).toBe('invalid-bearer-token');
    });

    test('returns invalid credentials for basic auth', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: { type: 'http', scheme: 'basic' },
      };

      const token = getInvalidToken(scheme);
      const decoded = Buffer.from(token, 'base64').toString('utf-8');

      expect(decoded).toBe('invalid:credentials');
    });
  });

  describe('isAuthOptional', () => {
    test('returns true when empty requirement exists', () => {
      const requirements = [
        { bearerAuth: [] },
        {}, // Empty requirement means optional
      ];

      const result = isAuthOptional(requirements);

      expect(result).toBe(true);
    });

    test('returns false when all requirements have schemes', () => {
      const requirements = [
        { bearerAuth: [] },
        { apiKeyHeader: [] },
      ];

      const result = isAuthOptional(requirements);

      expect(result).toBe(false);
    });

    test('returns false for empty array', () => {
      const result = isAuthOptional([]);

      expect(result).toBe(false);
    });
  });

  describe('extractAuthSchemes', () => {
    test('extracts schemes from requirements', () => {
      const scheme1: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };
      const scheme2: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const allSchemes = new Map([
        ['bearerAuth', scheme1],
        ['apiKeyHeader', scheme2],
      ]);

      const requirements = [
        { bearerAuth: [] },
        { apiKeyHeader: [] },
      ];

      const extracted = extractAuthSchemes(requirements, allSchemes);

      expect(extracted).toHaveLength(2);
      expect(extracted).toContainEqual(scheme1);
      expect(extracted).toContainEqual(scheme2);
    });

    test('handles empty requirements', () => {
      const allSchemes = new Map();

      const extracted = extractAuthSchemes([{}], allSchemes);

      expect(extracted).toHaveLength(0);
    });

    test('deduplicates scheme names', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const allSchemes = new Map([['bearerAuth', scheme]]);

      const requirements = [
        { bearerAuth: [] },
        { bearerAuth: [] }, // Duplicate
      ];

      const extracted = extractAuthSchemes(requirements, allSchemes);

      expect(extracted).toHaveLength(1);
    });
  });

  describe('requiresMultipleAuth', () => {
    test('returns true for multiple schemes', () => {
      const requirement = {
        bearerAuth: [],
        apiKeyHeader: [],
      };

      const result = requiresMultipleAuth(requirement);

      expect(result).toBe(true);
    });

    test('returns false for single scheme', () => {
      const requirement = {
        bearerAuth: [],
      };

      const result = requiresMultipleAuth(requirement);

      expect(result).toBe(false);
    });

    test('returns false for empty requirement', () => {
      const requirement = {};

      const result = requiresMultipleAuth(requirement);

      expect(result).toBe(false);
    });
  });

  describe('generateAuthTestDescription', () => {
    test('generates description for valid API key', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const desc = generateAuthTestDescription(scheme, true, '/users', 'GET');

      expect(desc).toBe('GET /users - with valid API key (apiKeyHeader)');
    });

    test('generates description for invalid bearer token', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const desc = generateAuthTestDescription(scheme, false, '/posts', 'POST');

      expect(desc).toBe('POST /posts - with invalid bearer token');
    });

    test('generates description for valid basic auth', () => {
      const scheme: AuthScheme = {
        name: 'basicAuth',
        type: 'http',
        config: { type: 'http', scheme: 'basic' },
      };

      const desc = generateAuthTestDescription(scheme, true, '/admin', 'DELETE');

      expect(desc).toBe('DELETE /admin - with valid basic auth');
    });
  });

  describe('generateAuthRequestOptions', () => {
    test('generates headers for bearer token', () => {
      const scheme: AuthScheme = {
        name: 'bearerAuth',
        type: 'http',
        config: { type: 'http', scheme: 'bearer' },
      };

      const options = generateAuthRequestOptions(scheme, 'my-token');

      expect(options).toEqual({
        headers: {
          Authorization: 'Bearer my-token',
        },
      });
    });

    test('generates params for API key in query', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyQuery',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'query', name: 'api_key' },
      };

      const options = generateAuthRequestOptions(scheme, 'my-key');

      expect(options).toEqual({
        params: {
          api_key: 'my-key',
        },
      });
    });

    test('generates headers for API key in header', () => {
      const scheme: AuthScheme = {
        name: 'apiKeyHeader',
        type: 'apiKey',
        config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      };

      const options = generateAuthRequestOptions(scheme, 'my-key');

      expect(options).toEqual({
        headers: {
          'X-API-Key': 'my-key',
        },
      });
    });
  });

  describe('generateAuthSetupCode', () => {
    test('generates setup code for multiple schemes', () => {
      const schemes: AuthScheme[] = [
        {
          name: 'bearerAuth',
          type: 'http',
          config: { type: 'http', scheme: 'bearer' },
        },
        {
          name: 'apiKeyHeader',
          type: 'apiKey',
          config: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      ];

      const code = generateAuthSetupCode(schemes);

      expect(code).toContain('bearerAuth');
      expect(code).toContain('apiKeyHeader');
      expect(code).toContain('process.env');
    });

    test('generates basic auth with username and password', () => {
      const schemes: AuthScheme[] = [
        {
          name: 'basicAuth',
          type: 'http',
          config: { type: 'http', scheme: 'basic' },
        },
      ];

      const code = generateAuthSetupCode(schemes);

      expect(code).toContain('Username');
      expect(code).toContain('Password');
      expect(code).toContain('Buffer.from');
      expect(code).toContain('toString(\'base64\')');
    });
  });
});
