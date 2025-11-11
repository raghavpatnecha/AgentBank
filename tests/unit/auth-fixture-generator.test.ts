/**
 * Unit tests for Authentication Fixture Generator
 */

import { describe, test, expect } from 'vitest';
import type { AuthScheme } from '../../src/types/openapi-types.js';
import {
  generateAuthFixture,
  generateFixtureFile,
  generateEnvDocumentation,
  generateCompleteFixtureFile,
} from '../../src/utils/auth-fixture-generator.js';

describe('auth-fixture-generator', () => {
  const bearerScheme: AuthScheme = {
    name: 'bearerAuth',
    type: 'http',
    config: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  };

  const apiKeyScheme: AuthScheme = {
    name: 'apiKeyHeader',
    type: 'apiKey',
    config: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    },
  };

  const basicAuthScheme: AuthScheme = {
    name: 'basicAuth',
    type: 'http',
    config: {
      type: 'http',
      scheme: 'basic',
    },
  };

  const oauth2Scheme: AuthScheme = {
    name: 'oauth2',
    type: 'oauth2',
    config: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            read: 'Read access',
            write: 'Write access',
          },
        },
      },
    },
  };

  describe('generateAuthFixture', () => {
    test('generates fixture with default options', () => {
      const fixture = generateAuthFixture([bearerScheme]);

      expect(fixture).toContain("import { test as base } from '@playwright/test'");
      expect(fixture).toContain('type AuthFixtures');
      expect(fixture).toContain('bearerAuth: string');
      expect(fixture).toContain('export const test = base.extend');
    });

    test('generates fixture for bearer token', () => {
      const fixture = generateAuthFixture([bearerScheme]);

      expect(fixture).toContain('bearerAuth');
      expect(fixture).toContain('process.env.BEARER_TOKEN_BEARER_AUTH');
      expect(fixture).toContain('test-bearer-token');
      expect(fixture).toContain('await use(token)');
    });

    test('generates fixture for API key', () => {
      const fixture = generateAuthFixture([apiKeyScheme]);

      expect(fixture).toContain('apiKeyHeader');
      expect(fixture).toContain('process.env.API_KEY_API_KEY_HEADER');
      expect(fixture).toContain('test-api-key-apiKeyHeader');
    });

    test('generates fixture for basic auth', () => {
      const fixture = generateAuthFixture([basicAuthScheme]);

      expect(fixture).toContain('basicAuth');
      expect(fixture).toContain('USERNAME');
      expect(fixture).toContain('PASSWORD');
      expect(fixture).toContain('Buffer.from');
      expect(fixture).toContain("toString('base64')");
    });

    test('generates fixture for OAuth2', () => {
      const fixture = generateAuthFixture([oauth2Scheme]);

      expect(fixture).toContain('oauth2');
      expect(fixture).toContain('process.env.OAUTH2_TOKEN_OAUTH2');
      expect(fixture).toContain('test-oauth2-token');
      expect(fixture).toContain('TODO: Implement OAuth2 flow');
    });

    test('generates fixtures for multiple schemes', () => {
      const fixture = generateAuthFixture([bearerScheme, apiKeyScheme, basicAuthScheme]);

      expect(fixture).toContain('bearerAuth');
      expect(fixture).toContain('apiKeyHeader');
      expect(fixture).toContain('basicAuth');
      expect(fixture).toContain('type AuthFixtures');
    });

    test('includes comments when addComments is true', () => {
      const fixture = generateAuthFixture([bearerScheme], { addComments: true });

      expect(fixture).toContain('/**');
      expect(fixture).toContain('* Authentication Fixtures');
      expect(fixture).toContain('// bearerAuth');
    });

    test('excludes comments when addComments is false', () => {
      const fixture = generateAuthFixture([bearerScheme], { addComments: false });

      expect(fixture).not.toContain('/**');
      expect(fixture).not.toContain('// bearerAuth');
    });

    test('excludes types when includeTypes is false', () => {
      const fixture = generateAuthFixture([bearerScheme], { includeTypes: false });

      expect(fixture).not.toContain('type AuthFixtures');
      expect(fixture).not.toContain('<AuthFixtures>');
    });

    test('uses ESM imports by default', () => {
      const fixture = generateAuthFixture([bearerScheme], { useESM: true });

      expect(fixture).toContain('import { test as base }');
      expect(fixture).toContain('export { expect }');
    });

    test('uses CommonJS when useESM is false', () => {
      const fixture = generateAuthFixture([bearerScheme], { useESM: false });

      expect(fixture).toContain('const { test: base } = require');
      expect(fixture).toContain('exports.expect = require');
    });
  });

  describe('generateFixtureFile', () => {
    test('generates complete fixture file', () => {
      const file = generateFixtureFile([bearerScheme, apiKeyScheme]);

      expect(file).toContain('import { test as base }');
      expect(file).toContain('bearerAuth');
      expect(file).toContain('apiKeyHeader');
      expect(file).toContain('export { expect }');
    });
  });

  describe('generateEnvDocumentation', () => {
    test('generates env documentation for bearer token', () => {
      const doc = generateEnvDocumentation([bearerScheme]);

      expect(doc).toContain('# Authentication Environment Variables');
      expect(doc).toContain('bearerAuth');
      expect(doc).toContain('BEARER_TOKEN_BEARER_AUTH');
      expect(doc).toContain('Bearer token');
      expect(doc).toContain('Format: JWT');
    });

    test('generates env documentation for API key', () => {
      const doc = generateEnvDocumentation([apiKeyScheme]);

      expect(doc).toContain('apiKeyHeader');
      expect(doc).toContain('API_KEY_API_KEY_HEADER');
      expect(doc).toContain('API key value');
      expect(doc).toContain('Location: header');
      expect(doc).toContain('Parameter name: X-API-Key');
    });

    test('generates env documentation for basic auth', () => {
      const doc = generateEnvDocumentation([basicAuthScheme]);

      expect(doc).toContain('basicAuth');
      expect(doc).toContain('BASIC_AUTH_BASIC_AUTH_USERNAME');
      expect(doc).toContain('BASIC_AUTH_BASIC_AUTH_PASSWORD');
      expect(doc).toContain('Username for basic auth');
      expect(doc).toContain('Password for basic auth');
    });

    test('generates env documentation for OAuth2', () => {
      const doc = generateEnvDocumentation([oauth2Scheme]);

      expect(doc).toContain('oauth2');
      expect(doc).toContain('OAUTH2_TOKEN_OAUTH2');
      expect(doc).toContain('OAuth2 access token');
      expect(doc).toContain('OAuth2 client credentials');
    });

    test('includes example .env file', () => {
      const doc = generateEnvDocumentation([bearerScheme, apiKeyScheme]);

      expect(doc).toContain('## Example .env file');
      expect(doc).toContain('```');
      expect(doc).toContain('BEARER_TOKEN_BEARER_AUTH=');
      expect(doc).toContain('API_KEY_API_KEY_HEADER=');
    });

    test('handles multiple schemes in documentation', () => {
      const doc = generateEnvDocumentation([
        bearerScheme,
        apiKeyScheme,
        basicAuthScheme,
        oauth2Scheme,
      ]);

      expect(doc).toContain('bearerAuth');
      expect(doc).toContain('apiKeyHeader');
      expect(doc).toContain('basicAuth');
      expect(doc).toContain('oauth2');
    });
  });

  describe('generateCompleteFixtureFile', () => {
    test('returns both fixture and env documentation', () => {
      const result = generateCompleteFixtureFile([bearerScheme, apiKeyScheme]);

      expect(result).toHaveProperty('fixtureFile');
      expect(result).toHaveProperty('envDoc');
      expect(result.fixtureFile).toContain('export const test');
      expect(result.envDoc).toContain('# Authentication Environment Variables');
    });

    test('generates complete fixture with all schemes', () => {
      const result = generateCompleteFixtureFile([
        bearerScheme,
        apiKeyScheme,
        basicAuthScheme,
        oauth2Scheme,
      ]);

      // Check fixture file
      expect(result.fixtureFile).toContain('bearerAuth');
      expect(result.fixtureFile).toContain('apiKeyHeader');
      expect(result.fixtureFile).toContain('basicAuth');
      expect(result.fixtureFile).toContain('oauth2');

      // Check env documentation
      expect(result.envDoc).toContain('BEARER_TOKEN_BEARER_AUTH');
      expect(result.envDoc).toContain('API_KEY_API_KEY_HEADER');
      expect(result.envDoc).toContain('BASIC_AUTH_BASIC_AUTH_USERNAME');
      expect(result.envDoc).toContain('OAUTH2_TOKEN_OAUTH2');
    });
  });
});
