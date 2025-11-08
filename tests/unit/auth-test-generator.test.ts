/**
 * Unit tests for Authentication Test Generator
 */

import { describe, test, expect } from 'vitest';
import type { AuthScheme, ApiEndpoint } from '../../src/types/openapi-types.js';
import { AuthTestGenerator } from '../../src/generators/auth-test-generator.js';

describe('AuthTestGenerator', () => {
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

  const openIdScheme: AuthScheme = {
    name: 'openId',
    type: 'openIdConnect',
    config: {
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  };

  const createEndpoint = (security: Array<Record<string, string[]>>): ApiEndpoint => ({
    path: '/test',
    method: 'get',
    operationId: 'getTest',
    summary: 'Test endpoint',
    parameters: [],
    responses: new Map([[200, { description: 'Success' }]]),
    security,
    tags: [],
    servers: [],
  });

  describe('constructor', () => {
    test('creates generator with default options', () => {
      const generator = new AuthTestGenerator([bearerScheme]);

      expect(generator).toBeInstanceOf(AuthTestGenerator);
      expect(generator.getAllSchemes()).toHaveLength(1);
    });

    test('creates generator with custom options', () => {
      const generator = new AuthTestGenerator([bearerScheme], {
        testUnauthorized: false,
        testInvalidCredentials: false,
        generateFixtures: false,
      });

      expect(generator).toBeInstanceOf(AuthTestGenerator);
    });

    test('handles multiple auth schemes', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme, basicAuthScheme]);

      expect(generator.getAllSchemes()).toHaveLength(3);
    });
  });

  describe('generateAuthSetup', () => {
    test('generates setup code for bearer auth', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const setup = generator.generateAuthSetup([bearerScheme]);

      expect(setup).toContain('Authentication setup');
      expect(setup).toContain('bearerAuth');
      expect(setup).toContain('Bearer token');
    });

    test('generates setup code for multiple schemes', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);
      const setup = generator.generateAuthSetup([bearerScheme, apiKeyScheme]);

      expect(setup).toContain('bearerAuth');
      expect(setup).toContain('apiKeyHeader');
    });

    test('returns empty string for no schemes', () => {
      const generator = new AuthTestGenerator([]);
      const setup = generator.generateAuthSetup([]);

      expect(setup).toBe('');
    });
  });

  describe('generateAuthTests', () => {
    test('generates no tests for endpoint without security', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([]);

      const tests = generator.generateAuthTests(endpoint);

      expect(tests).toHaveLength(0);
    });

    test('generates tests for bearer auth endpoint', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      // Should generate: valid auth, invalid auth, and unauthorized tests
      expect(tests.length).toBeGreaterThanOrEqual(3);

      // Check for valid auth test
      const validTest = tests.find((t) => t.id.includes('valid'));
      expect(validTest).toBeDefined();
      expect(validTest?.expectedResponse.status).toEqual([200, 201, 204]);

      // Check for invalid auth test
      const invalidTest = tests.find((t) => t.id.includes('invalid'));
      expect(invalidTest).toBeDefined();
      expect(invalidTest?.expectedResponse.status).toBe(401);

      // Check for unauthorized test
      const unauthTest = tests.find((t) => t.id.includes('none'));
      expect(unauthTest).toBeDefined();
      expect(unauthTest?.expectedResponse.status).toBe(401);
    });

    test('generates tests for API key auth', () => {
      const generator = new AuthTestGenerator([apiKeyScheme]);
      const endpoint = createEndpoint([{ apiKeyHeader: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      expect(tests.length).toBeGreaterThanOrEqual(2);

      const validTest = tests.find((t) => t.id.includes('valid'));
      expect(validTest?.type).toBe('auth');
      expect(validTest?.auth?.scheme.name).toBe('apiKeyHeader');
    });

    test('generates tests for basic auth', () => {
      const generator = new AuthTestGenerator([basicAuthScheme]);
      const endpoint = createEndpoint([{ basicAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      expect(tests.length).toBeGreaterThanOrEqual(2);

      const validTest = tests.find((t) => t.id.includes('valid'));
      expect(validTest?.auth?.scheme.config.scheme).toBe('basic');
    });

    test('generates tests for OAuth2', () => {
      const generator = new AuthTestGenerator([oauth2Scheme]);
      const endpoint = createEndpoint([{ oauth2: ['read'] }]);

      const tests = generator.generateAuthTests(endpoint);

      expect(tests.length).toBeGreaterThanOrEqual(2);

      const validTest = tests.find((t) => t.id.includes('valid'));
      expect(validTest?.auth?.scheme.type).toBe('oauth2');
    });

    test('generates tests for OpenID Connect', () => {
      const generator = new AuthTestGenerator([openIdScheme]);
      const endpoint = createEndpoint([{ openId: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      expect(tests.length).toBeGreaterThanOrEqual(2);
    });

    test('handles optional auth (empty security requirement)', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }, {}]); // {} means optional

      const tests = generator.generateAuthTests(endpoint);

      // Should include optional auth test
      const optionalTest = tests.find((t) => t.id.includes('optional'));
      expect(optionalTest).toBeDefined();
      expect(optionalTest?.expectedResponse.status).toEqual([200, 201, 204]);

      // Should NOT include unauthorized test for optional auth
      const unauthTest = tests.find((t) => t.id.includes('none'));
      expect(unauthTest).toBeUndefined();
    });

    test('generates tests for multiple auth options (OR logic)', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }, { apiKeyHeader: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      // Should generate tests for both auth types
      const bearerTest = tests.find((t) => t.auth?.scheme.name === 'bearerAuth');
      const apiKeyTest = tests.find((t) => t.auth?.scheme.name === 'apiKeyHeader');

      expect(bearerTest).toBeDefined();
      expect(apiKeyTest).toBeDefined();
    });

    test('generates tests for multiple required auth (AND logic)', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [], apiKeyHeader: [] }]); // AND logic

      const tests = generator.generateAuthTests(endpoint);

      // Should have tests for multiple auth
      const multipleValidTest = tests.find((t) => t.id.includes('multiple-valid'));
      expect(multipleValidTest).toBeDefined();

      // Should have tests for missing each auth
      const missingBearerTest = tests.find((t) => t.id.includes('missing-bearerAuth'));
      const missingApiKeyTest = tests.find((t) => t.id.includes('missing-apiKeyHeader'));

      expect(missingBearerTest).toBeDefined();
      expect(missingApiKeyTest).toBeDefined();
    });

    test('respects testInvalidCredentials option', () => {
      const generator = new AuthTestGenerator([bearerScheme], {
        testInvalidCredentials: false,
      });
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      const invalidTest = tests.find((t) => t.id.includes('invalid'));
      expect(invalidTest).toBeUndefined();
    });

    test('respects testUnauthorized option', () => {
      const generator = new AuthTestGenerator([bearerScheme], {
        testUnauthorized: false,
      });
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      const unauthTest = tests.find((t) => t.id.includes('none'));
      expect(unauthTest).toBeUndefined();
    });

    test('generates expired token tests for OAuth2 when enabled', () => {
      const generator = new AuthTestGenerator([oauth2Scheme], {
        testExpiredTokens: true,
      });
      const endpoint = createEndpoint([{ oauth2: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      const expiredTest = tests.find((t) => t.id.includes('expired'));
      expect(expiredTest).toBeDefined();
      expect(expiredTest?.expectedResponse.status).toBe(401);
    });

    test('generates expired token tests for OpenID Connect when enabled', () => {
      const generator = new AuthTestGenerator([openIdScheme], {
        testExpiredTokens: true,
      });
      const endpoint = createEndpoint([{ openId: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      const expiredTest = tests.find((t) => t.id.includes('expired'));
      expect(expiredTest).toBeDefined();
    });

    test('does not generate expired token tests for non-token auth', () => {
      const generator = new AuthTestGenerator([apiKeyScheme], {
        testExpiredTokens: true,
      });
      const endpoint = createEndpoint([{ apiKeyHeader: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      const expiredTest = tests.find((t) => t.id.includes('expired'));
      expect(expiredTest).toBeUndefined();
    });

    test('includes correct metadata in generated tests', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }]);
      endpoint.tags = ['users', 'protected'];

      const tests = generator.generateAuthTests(endpoint);

      const validTest = tests[0];
      expect(validTest?.metadata.tags).toContain('auth');
      expect(validTest?.metadata.tags).toContain('users');
      expect(validTest?.metadata.tags).toContain('protected');
      expect(validTest?.metadata.priority).toBe('high');
      expect(validTest?.metadata.stability).toBe('stable');
    });
  });

  describe('generateAuthFixture', () => {
    test('generates Playwright auth fixture', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);
      const fixture = generator.generateAuthFixture();

      expect(fixture).toContain("import { test as base }");
      expect(fixture).toContain('bearerAuth');
      expect(fixture).toContain('apiKeyHeader');
      expect(fixture).toContain('export const test');
    });

    test('returns empty string when generateFixtures is false', () => {
      const generator = new AuthTestGenerator([bearerScheme], {
        generateFixtures: false,
      });
      const fixture = generator.generateAuthFixture();

      expect(fixture).toBe('');
    });
  });

  describe('scheme management', () => {
    test('getAllSchemes returns all schemes', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);

      const schemes = generator.getAllSchemes();

      expect(schemes).toHaveLength(2);
      expect(schemes).toContainEqual(bearerScheme);
      expect(schemes).toContainEqual(apiKeyScheme);
    });

    test('addScheme adds new scheme', () => {
      const generator = new AuthTestGenerator([bearerScheme]);

      generator.addScheme(apiKeyScheme);

      const schemes = generator.getAllSchemes();
      expect(schemes).toHaveLength(2);
    });

    test('getScheme retrieves scheme by name', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);

      const scheme = generator.getScheme('bearerAuth');

      expect(scheme).toEqual(bearerScheme);
    });

    test('getScheme returns undefined for non-existent scheme', () => {
      const generator = new AuthTestGenerator([bearerScheme]);

      const scheme = generator.getScheme('nonExistent');

      expect(scheme).toBeUndefined();
    });
  });

  describe('test case validation', () => {
    test('valid auth test has correct structure', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);
      const validTest = tests.find((t) => t.id.includes('valid'));

      expect(validTest).toMatchObject({
        type: 'auth',
        method: 'get',
        endpoint: '/test',
        expectedResponse: {
          status: [200, 201, 204],
        },
      });
      expect(validTest?.auth?.testUnauthorized).toBe(false);
    });

    test('invalid auth test has correct structure', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);
      const invalidTest = tests.find((t) => t.id.includes('invalid'));

      expect(invalidTest).toMatchObject({
        type: 'auth',
        expectedResponse: {
          status: 401,
        },
      });
      expect(invalidTest?.auth?.testUnauthorized).toBe(true);
    });

    test('test IDs are unique', () => {
      const generator = new AuthTestGenerator([bearerScheme, apiKeyScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }, { apiKeyHeader: [] }]);

      const tests = generator.generateAuthTests(endpoint);
      const ids = tests.map((t) => t.id);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('test names are descriptive', () => {
      const generator = new AuthTestGenerator([bearerScheme]);
      const endpoint = createEndpoint([{ bearerAuth: [] }]);

      const tests = generator.generateAuthTests(endpoint);

      tests.forEach((test) => {
        expect(test.name).toContain(test.method.toUpperCase());
        expect(test.name).toContain(test.endpoint);
      });
    });
  });
});
