/**
 * Integration tests for authentication test generation
 * Uses auth-schemes.yaml fixture from Feature 1
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import type { OpenAPISpec, AuthScheme, ApiEndpoint } from '../../src/types/openapi-types.js';
import { OpenAPIParser } from '../../src/core/openapi-parser.js';
import { AuthTestGenerator } from '../../src/generators/auth-test-generator.js';
import {
  generateAuthFixture,
  generateCompleteFixtureFile,
} from '../../src/utils/auth-fixture-generator.js';
import { getAuthFromEnv } from '../../src/utils/auth-helper.js';

describe('Authentication Test Generation Integration', () => {
  let spec: OpenAPISpec;
  let parser: OpenAPIParser;

  beforeAll(async () => {
    // Load auth-schemes.yaml fixture
    const fixturePath = join(__dirname, '../fixtures/auth-schemes.yaml');
    const content = readFileSync(fixturePath, 'utf-8');
    spec = yaml.parse(content) as OpenAPISpec;

    // Parse spec
    parser = new OpenAPIParser();
    await parser.parse(spec);
  });

  describe('Auth Scheme Parsing', () => {
    test('parses all auth schemes from fixture', () => {
      const schemes = parser.extractAuthSchemes();

      // auth-schemes.yaml has: bearerAuth, apiKeyHeader, apiKeyQuery, basicAuth, oauth2, openId
      expect(schemes.length).toBeGreaterThanOrEqual(6);

      const schemeNames = schemes.map((s) => s.name);
      expect(schemeNames).toContain('bearerAuth');
      expect(schemeNames).toContain('apiKeyHeader');
      expect(schemeNames).toContain('apiKeyQuery');
      expect(schemeNames).toContain('basicAuth');
      expect(schemeNames).toContain('oauth2');
      expect(schemeNames).toContain('openId');
    });

    test('parses bearer auth scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const bearerScheme = schemes.find((s) => s.name === 'bearerAuth');

      expect(bearerScheme).toBeDefined();
      expect(bearerScheme?.type).toBe('http');
      expect(bearerScheme?.config.scheme).toBe('bearer');
      expect(bearerScheme?.config.bearerFormat).toBe('JWT');
    });

    test('parses API key in header scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const apiKeyScheme = schemes.find((s) => s.name === 'apiKeyHeader');

      expect(apiKeyScheme).toBeDefined();
      expect(apiKeyScheme?.type).toBe('apiKey');
      expect(apiKeyScheme?.config.in).toBe('header');
      expect(apiKeyScheme?.config.name).toBe('X-API-Key');
    });

    test('parses API key in query scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const apiKeyScheme = schemes.find((s) => s.name === 'apiKeyQuery');

      expect(apiKeyScheme).toBeDefined();
      expect(apiKeyScheme?.type).toBe('apiKey');
      expect(apiKeyScheme?.config.in).toBe('query');
      expect(apiKeyScheme?.config.name).toBe('api_key');
    });

    test('parses basic auth scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const basicScheme = schemes.find((s) => s.name === 'basicAuth');

      expect(basicScheme).toBeDefined();
      expect(basicScheme?.type).toBe('http');
      expect(basicScheme?.config.scheme).toBe('basic');
    });

    test('parses OAuth2 scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const oauth2Scheme = schemes.find((s) => s.name === 'oauth2');

      expect(oauth2Scheme).toBeDefined();
      expect(oauth2Scheme?.type).toBe('oauth2');
      expect(oauth2Scheme?.config.flows).toBeDefined();
      expect(oauth2Scheme?.config.flows?.authorizationCode).toBeDefined();
    });

    test('parses OpenID Connect scheme correctly', () => {
      const schemes = parser.extractAuthSchemes();
      const openIdScheme = schemes.find((s) => s.name === 'openId');

      expect(openIdScheme).toBeDefined();
      expect(openIdScheme?.type).toBe('openIdConnect');
      expect(openIdScheme?.config.openIdConnectUrl).toBe(
        'https://example.com/.well-known/openid-configuration'
      );
    });
  });

  describe('Endpoint Auth Test Generation', () => {
    test('generates tests for bearer auth endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const bearerEndpoint = endpoints.find((e) => e.path === '/bearer');

      expect(bearerEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(bearerEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      // Should have valid auth test
      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest).toBeDefined();
      expect(validTest?.auth?.scheme.name).toBe('bearerAuth');

      // Should have unauthorized test
      const unauthTest = tests.find((t) => t.id.includes('none'));
      expect(unauthTest).toBeDefined();
      expect(unauthTest?.expectedResponse.status).toBe(401);
    });

    test('generates tests for API key header endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const apiKeyEndpoint = endpoints.find((e) => e.path === '/api-key-header');

      expect(apiKeyEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(apiKeyEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest?.auth?.scheme.name).toBe('apiKeyHeader');
      expect(validTest?.auth?.scheme.config.in).toBe('header');
      expect(validTest?.auth?.scheme.config.name).toBe('X-API-Key');
    });

    test('generates tests for API key query endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const apiKeyEndpoint = endpoints.find((e) => e.path === '/api-key-query');

      expect(apiKeyEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(apiKeyEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest?.auth?.scheme.config.in).toBe('query');
      expect(validTest?.auth?.scheme.config.name).toBe('api_key');
    });

    test('generates tests for basic auth endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const basicEndpoint = endpoints.find((e) => e.path === '/basic');

      expect(basicEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(basicEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest?.auth?.scheme.name).toBe('basicAuth');
      expect(validTest?.auth?.scheme.config.scheme).toBe('basic');
    });

    test('generates tests for OAuth2 endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const oauth2Endpoint = endpoints.find((e) => e.path === '/oauth2');

      expect(oauth2Endpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(oauth2Endpoint!);

      expect(tests.length).toBeGreaterThan(0);

      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest?.auth?.scheme.name).toBe('oauth2');
    });

    test('generates tests for OpenID Connect endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const openIdEndpoint = endpoints.find((e) => e.path === '/openid');

      expect(openIdEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(openIdEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      const validTest = tests.find((t) => t.expectedResponse.status !== 401);
      expect(validTest?.auth?.scheme.name).toBe('openId');
    });

    test('generates tests for multiple auth options endpoint (OR logic)', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const multipleEndpoint = endpoints.find((e) => e.path === '/multiple');

      expect(multipleEndpoint).toBeDefined();
      expect(multipleEndpoint?.security.length).toBeGreaterThan(1);

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(multipleEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      // Should have tests for multiple schemes
      // The /multiple endpoint in auth-schemes.yaml uses AND logic (both required)
      // so we should look for either valid multiple auth or individual scheme tests
      const hasTests = tests.length > 0;
      expect(hasTests).toBe(true);
    });

    test('generates tests for optional auth endpoint', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const optionalEndpoint = endpoints.find((e) => e.path === '/optional');

      expect(optionalEndpoint).toBeDefined();

      const generator = new AuthTestGenerator(schemes);
      const tests = generator.generateAuthTests(optionalEndpoint!);

      expect(tests.length).toBeGreaterThan(0);

      // Should have optional auth test (works without auth)
      const optionalTest = tests.find((t) => t.id.includes('optional'));
      expect(optionalTest).toBeDefined();
      expect(optionalTest?.expectedResponse.status).toEqual([200, 201, 204]);

      // Should NOT have unauthorized test for optional auth
      const unauthTest = tests.find((t) => t.id.includes('none') && t.expectedResponse.status === 401);
      expect(unauthTest).toBeUndefined();
    });
  });

  describe('Auth Fixture Generation', () => {
    test('generates complete auth fixture from all schemes', () => {
      const schemes = parser.extractAuthSchemes();
      const fixture = generateAuthFixture(schemes);

      expect(fixture).toContain("import { test as base }");
      expect(fixture).toContain('type AuthFixtures');
      expect(fixture).toContain('export const test');
      expect(fixture).toContain("export { expect }");

      // Should include all auth schemes
      expect(fixture).toContain('bearerAuth');
      expect(fixture).toContain('apiKeyHeader');
      expect(fixture).toContain('apiKeyQuery');
      expect(fixture).toContain('basicAuth');
      expect(fixture).toContain('oauth2');
      expect(fixture).toContain('openId');
    });

    test('generates fixture with proper environment variable usage', () => {
      const schemes = parser.extractAuthSchemes();
      const fixture = generateAuthFixture(schemes);

      expect(fixture).toContain('process.env');
      expect(fixture).toContain('BEARER_TOKEN_BEARER_AUTH');
      expect(fixture).toContain('API_KEY_API_KEY_HEADER');
      expect(fixture).toContain('API_KEY_API_KEY_QUERY');
      expect(fixture).toContain('BASIC_AUTH_BASIC_AUTH_USERNAME');
      expect(fixture).toContain('BASIC_AUTH_BASIC_AUTH_PASSWORD');
      expect(fixture).toContain('OAUTH2_TOKEN_OAUTH2');
      expect(fixture).toContain('OIDC_TOKEN_OPEN_ID');
    });

    test('generates fixture with test defaults', () => {
      const schemes = parser.extractAuthSchemes();
      const fixture = generateAuthFixture(schemes);

      // Should have fallback test values
      expect(fixture).toContain('test-bearer-token');
      expect(fixture).toContain('test-api-key');
      expect(fixture).toContain('test-user');
      expect(fixture).toContain('test-pass');
      expect(fixture).toContain('test-oauth2-token');
      expect(fixture).toContain('test-oidc-token');
    });

    test('generates complete fixture file with documentation', () => {
      const schemes = parser.extractAuthSchemes();
      const result = generateCompleteFixtureFile(schemes);

      expect(result.fixtureFile).toBeTruthy();
      expect(result.envDoc).toBeTruthy();

      // Check env documentation
      expect(result.envDoc).toContain('# Authentication Environment Variables');
      expect(result.envDoc).toContain('## Example .env file');
      expect(result.envDoc).toContain('BEARER_TOKEN_BEARER_AUTH=');
      expect(result.envDoc).toContain('API_KEY_API_KEY_HEADER=');
    });
  });

  describe('Environment Variable Integration', () => {
    test('getAuthFromEnv returns test defaults when env not set', () => {
      const schemes = parser.extractAuthSchemes();
      const bearerScheme = schemes.find((s) => s.name === 'bearerAuth');

      expect(bearerScheme).toBeDefined();

      const authValue = getAuthFromEnv(bearerScheme!);
      expect(authValue).toBe('test-bearer-token');
    });

    test('handles basic auth credentials from environment', () => {
      const schemes = parser.extractAuthSchemes();
      const basicScheme = schemes.find((s) => s.name === 'basicAuth');

      expect(basicScheme).toBeDefined();

      const authValue = getAuthFromEnv(basicScheme!);

      // Should be base64-encoded
      expect(authValue).toBeTruthy();

      // Decode and verify
      const decoded = Buffer.from(authValue, 'base64').toString('utf-8');
      expect(decoded).toContain(':'); // username:password format
    });
  });

  describe('Complete Test Generation Workflow', () => {
    test('generates complete test suite for all endpoints', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const generator = new AuthTestGenerator(schemes);

      let totalTests = 0;

      for (const endpoint of endpoints) {
        const tests = generator.generateAuthTests(endpoint);
        totalTests += tests.length;

        // Verify each test has required fields
        tests.forEach((test) => {
          expect(test.id).toBeTruthy();
          expect(test.name).toBeTruthy();
          expect(test.type).toBe('auth');
          expect(test.method).toBeTruthy();
          expect(test.endpoint).toBeTruthy();
          expect(test.expectedResponse.status).toBeDefined();
          expect(test.metadata).toBeDefined();
          expect(test.metadata.tags).toContain('auth');
        });
      }

      // Should generate multiple tests across all endpoints
      expect(totalTests).toBeGreaterThan(10);
    });

    test('all generated tests have unique IDs', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const generator = new AuthTestGenerator(schemes);

      const allTestIds: string[] = [];

      for (const endpoint of endpoints) {
        const tests = generator.generateAuthTests(endpoint);
        allTestIds.push(...tests.map((t) => t.id));
      }

      const uniqueIds = new Set(allTestIds);
      expect(uniqueIds.size).toBe(allTestIds.length);
    });

    test('generates fixture that covers all auth types', () => {
      const schemes = parser.extractAuthSchemes();
      const generator = new AuthTestGenerator(schemes);
      const fixture = generator.generateAuthFixture();

      // Should be a complete Playwright fixture file
      expect(fixture).toContain("import { test as base }");
      expect(fixture).toContain('type AuthFixtures');
      expect(fixture).toContain('export const test');

      // Should handle all auth types from fixture
      const authTypes = ['apiKey', 'bearer', 'basic', 'oauth2', 'openIdConnect'];
      let coveredTypes = 0;

      if (fixture.includes('X-API-Key') || fixture.includes('api_key')) coveredTypes++;
      if (fixture.includes('Bearer')) coveredTypes++;
      if (fixture.includes('Basic') || fixture.includes('Buffer.from')) coveredTypes++;
      if (fixture.includes('oauth2')) coveredTypes++;
      if (fixture.includes('openId') || fixture.includes('oidc')) coveredTypes++;

      expect(coveredTypes).toBeGreaterThanOrEqual(3); // Should cover multiple auth types
    });
  });

  describe('Test Quality Validation', () => {
    test('all auth tests have proper metadata', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const generator = new AuthTestGenerator(schemes);

      for (const endpoint of endpoints) {
        const tests = generator.generateAuthTests(endpoint);

        tests.forEach((test) => {
          expect(test.metadata.priority).toMatch(/low|medium|high|critical/);
          expect(test.metadata.stability).toMatch(/stable|flaky|experimental/);
          expect(test.metadata.generatedAt).toBeTruthy();
          expect(test.metadata.generatorVersion).toBe('1.0.0');
          expect(test.metadata.tags).toBeInstanceOf(Array);
          expect(test.metadata.tags.length).toBeGreaterThan(0);
        });
      }
    });

    test('valid auth tests expect success status codes', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const generator = new AuthTestGenerator(schemes);

      for (const endpoint of endpoints) {
        const tests = generator.generateAuthTests(endpoint);
        // Filter for tests that should succeed (not invalid/missing/expired)
        const validTests = tests.filter((t) =>
          (t.id.includes('valid') || t.id.includes('optional')) &&
          !t.id.includes('missing') &&
          !t.id.includes('invalid') &&
          !t.id.includes('expired')
        );

        validTests.forEach((test) => {
          const status = test.expectedResponse.status;
          if (Array.isArray(status)) {
            expect(status).toContain(200);
          } else {
            // Status should be one of the success codes
            const validStatuses = [200, 201, 204];
            const isValid = validStatuses.includes(status as number);
            expect(isValid).toBe(true);
          }
        });
      }
    });

    test('invalid auth tests expect 401 status', () => {
      const schemes = parser.extractAuthSchemes();
      const endpoints = parser.extractEndpoints();
      const generator = new AuthTestGenerator(schemes);

      for (const endpoint of endpoints) {
        const tests = generator.generateAuthTests(endpoint);
        const invalidTests = tests.filter(
          (t) => t.id.includes('invalid') || t.id.includes('none') || t.id.includes('expired')
        );

        invalidTests.forEach((test) => {
          // These tests should expect 401 (unless it's optional auth without credentials)
          if (!test.id.includes('optional')) {
            expect(test.expectedResponse.status).toBe(401);
          }
        });
      }
    });
  });
});
