/**
 * Authentication Test Generator
 * Generates authentication tests for API endpoints
 */

import type { AuthScheme, ApiEndpoint, SecurityRequirement } from '../types/openapi-types.js';
import type { TestCase } from '../types/test-generator-types.js';
import {
  authSchemeToConfig,
  generateAuthTestDescription,
  getAuthFixtureName,
  isAuthOptional,
  extractAuthSchemes,
  requiresMultipleAuth,
} from '../utils/auth-helper.js';
import { generateAuthFixture } from '../utils/auth-fixture-generator.js';

/**
 * Options for auth test generation
 */
export interface AuthTestGeneratorOptions {
  /** Test unauthorized access (401) */
  testUnauthorized?: boolean;
  /** Test invalid credentials (401) */
  testInvalidCredentials?: boolean;
  /** Test expired tokens (if applicable) */
  testExpiredTokens?: boolean;
  /** Generate auth fixtures */
  generateFixtures?: boolean;
}

/**
 * Authentication Test Generator
 * Generates comprehensive authentication tests
 */
export class AuthTestGenerator {
  private options: AuthTestGeneratorOptions;
  private allSchemes: Map<string, AuthScheme>;

  constructor(allSchemes: AuthScheme[] = [], options: AuthTestGeneratorOptions = {}) {
    this.options = {
      testUnauthorized: true,
      testInvalidCredentials: true,
      testExpiredTokens: false,
      generateFixtures: true,
      ...options,
    };

    // Convert array to map for easy lookup
    this.allSchemes = new Map(allSchemes.map((scheme) => [scheme.name, scheme]));
  }

  /**
   * Generate auth setup code for test files
   */
  generateAuthSetup(authSchemes: AuthScheme[]): string {
    if (authSchemes.length === 0) {
      return '';
    }

    const lines: string[] = [];

    lines.push('// Authentication setup');
    lines.push('// Configure these environment variables or use test defaults:');

    for (const scheme of authSchemes) {
      const config = authSchemeToConfig(scheme);
      const fixtureName = getAuthFixtureName(scheme);

      switch (config.type) {
        case 'apiKey':
          lines.push(`// - ${fixtureName}: API key for ${scheme.name}`);
          break;
        case 'bearer':
          lines.push(`// - ${fixtureName}: Bearer token`);
          break;
        case 'basic':
          lines.push(`// - ${fixtureName}: Base64-encoded credentials`);
          break;
        case 'oauth2':
          lines.push(`// - ${fixtureName}: OAuth2 access token`);
          break;
        case 'openIdConnect':
          lines.push(`// - ${fixtureName}: OpenID Connect token`);
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate auth tests for an endpoint
   */
  generateAuthTests(endpoint: ApiEndpoint): TestCase[] {
    const tests: TestCase[] = [];

    // No security requirements means no auth needed
    if (!endpoint.security || endpoint.security.length === 0) {
      return tests;
    }

    // Extract all auth schemes used by this endpoint
    // Note: We process each requirement separately below
    const optional = isAuthOptional(endpoint.security);

    // Generate tests for each security requirement
    for (const requirement of endpoint.security) {
      const requirementSchemes = extractAuthSchemes([requirement], this.allSchemes);

      if (requirementSchemes.length === 0) {
        // Empty requirement {} means optional auth
        continue;
      }

      // Check if this requirement uses multiple schemes (AND logic)
      if (requiresMultipleAuth(requirement)) {
        tests.push(...this.generateMultipleAuthTests(endpoint, requirementSchemes, requirement));
      } else {
        // Single scheme (OR logic with other requirements)
        for (const scheme of requirementSchemes) {
          tests.push(...this.generateSchemeTests(endpoint, scheme, optional));
        }
      }
    }

    // Generate unauthorized test if not optional
    if (!optional && this.options.testUnauthorized) {
      tests.push(this.generateUnauthorizedTest(endpoint));
    }

    // If optional, test that it works without auth
    if (optional) {
      tests.push(this.generateOptionalAuthTest(endpoint));
    }

    return tests;
  }

  /**
   * Generate tests for a single auth scheme
   */
  private generateSchemeTests(
    endpoint: ApiEndpoint,
    scheme: AuthScheme,
    _optional: boolean
  ): TestCase[] {
    const tests: TestCase[] = [];

    // Test with valid credentials
    tests.push(this.generateValidAuthTest(endpoint, scheme));

    // Test with invalid credentials
    if (this.options.testInvalidCredentials) {
      tests.push(this.generateInvalidAuthTest(endpoint, scheme));
    }

    // Test with expired token (for OAuth2/OIDC)
    if (this.options.testExpiredTokens) {
      const config = authSchemeToConfig(scheme);
      if (config.type === 'oauth2' || config.type === 'openIdConnect') {
        tests.push(this.generateExpiredTokenTest(endpoint, scheme));
      }
    }

    return tests;
  }

  /**
   * Generate test with valid authentication
   */
  private generateValidAuthTest(endpoint: ApiEndpoint, scheme: AuthScheme): TestCase {
    const config = authSchemeToConfig(scheme);

    return {
      id: `auth-valid-${scheme.name}-${endpoint.method}-${endpoint.path}`,
      name: generateAuthTestDescription(scheme, true, endpoint.path, endpoint.method.toUpperCase()),
      description: `Test endpoint with valid ${config.type} authentication`,
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {},
      },
      expectedResponse: {
        status: [200, 201, 204],
      },
      auth: {
        scheme,
        testUnauthorized: false,
      },
      metadata: {
        tags: ['auth', `auth-${config.type}`, ...endpoint.tags],
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate test with invalid authentication
   */
  private generateInvalidAuthTest(endpoint: ApiEndpoint, scheme: AuthScheme): TestCase {
    const config = authSchemeToConfig(scheme);

    return {
      id: `auth-invalid-${scheme.name}-${endpoint.method}-${endpoint.path}`,
      name: generateAuthTestDescription(
        scheme,
        false,
        endpoint.path,
        endpoint.method.toUpperCase()
      ),
      description: `Test endpoint with invalid ${config.type} credentials - expect 401`,
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {},
      },
      expectedResponse: {
        status: 401,
      },
      auth: {
        scheme,
        testUnauthorized: true,
      },
      metadata: {
        tags: ['auth', `auth-${config.type}`, 'error-case', ...endpoint.tags],
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate test without authentication
   */
  private generateUnauthorizedTest(endpoint: ApiEndpoint): TestCase {
    return {
      id: `auth-none-${endpoint.method}-${endpoint.path}`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - without authentication (401)`,
      description: 'Test endpoint without authentication - expect 401',
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {},
      expectedResponse: {
        status: 401,
      },
      metadata: {
        tags: ['auth', 'unauthorized', 'error-case', ...endpoint.tags],
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate test for optional authentication
   */
  private generateOptionalAuthTest(endpoint: ApiEndpoint): TestCase {
    return {
      id: `auth-optional-${endpoint.method}-${endpoint.path}`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - without authentication (optional)`,
      description: 'Test endpoint without authentication - should succeed as auth is optional',
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {},
      expectedResponse: {
        status: [200, 201, 204],
      },
      metadata: {
        tags: ['auth', 'optional-auth', ...endpoint.tags],
        priority: 'medium',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate test for expired token
   */
  private generateExpiredTokenTest(endpoint: ApiEndpoint, scheme: AuthScheme): TestCase {
    const config = authSchemeToConfig(scheme);

    return {
      id: `auth-expired-${scheme.name}-${endpoint.method}-${endpoint.path}`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - with expired ${config.type} token (401)`,
      description: `Test endpoint with expired ${config.type} token - expect 401`,
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {
        headers: {},
      },
      expectedResponse: {
        status: 401,
      },
      auth: {
        scheme,
        testUnauthorized: true,
      },
      metadata: {
        tags: ['auth', `auth-${config.type}`, 'expired-token', 'error-case', ...endpoint.tags],
        priority: 'medium',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate tests for endpoints requiring multiple auth schemes (AND logic)
   */
  private generateMultipleAuthTests(
    endpoint: ApiEndpoint,
    schemes: AuthScheme[],
    _requirement: SecurityRequirement
  ): TestCase[] {
    const tests: TestCase[] = [];

    // Test with all valid auth schemes
    tests.push({
      id: `auth-multiple-valid-${endpoint.method}-${endpoint.path}`,
      name: `${endpoint.method.toUpperCase()} ${endpoint.path} - with all required auth schemes`,
      description: `Test endpoint with multiple auth schemes (${schemes.map((s) => s.name).join(', ')})`,
      type: 'auth',
      method: endpoint.method,
      endpoint: endpoint.path,
      request: {},
      expectedResponse: {
        status: [200, 201, 204],
      },
      metadata: {
        tags: ['auth', 'multiple-auth', ...endpoint.tags],
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    });

    // Test with missing one of the required schemes
    for (const scheme of schemes) {
      tests.push({
        id: `auth-multiple-missing-${scheme.name}-${endpoint.method}-${endpoint.path}`,
        name: `${endpoint.method.toUpperCase()} ${endpoint.path} - missing ${scheme.name} auth (401)`,
        description: `Test endpoint missing required ${scheme.name} - expect 401`,
        type: 'auth',
        method: endpoint.method,
        endpoint: endpoint.path,
        request: {},
        expectedResponse: {
          status: 401,
        },
        metadata: {
          tags: ['auth', 'multiple-auth', 'error-case', ...endpoint.tags],
          priority: 'high',
          stability: 'stable',
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0',
        },
      });
    }

    return tests;
  }

  /**
   * Generate Playwright auth fixture
   */
  generateAuthFixture(): string {
    if (!this.options.generateFixtures) {
      return '';
    }

    const schemes = Array.from(this.allSchemes.values());
    return generateAuthFixture(schemes, {
      includeTypes: true,
      useESM: true,
      addComments: true,
    });
  }

  /**
   * Get all auth schemes
   */
  getAllSchemes(): AuthScheme[] {
    return Array.from(this.allSchemes.values());
  }

  /**
   * Add auth scheme to generator
   */
  addScheme(scheme: AuthScheme): void {
    this.allSchemes.set(scheme.name, scheme);
  }

  /**
   * Get auth scheme by name
   */
  getScheme(name: string): AuthScheme | undefined {
    return this.allSchemes.get(name);
  }
}
