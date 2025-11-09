/**
 * Integration tests for OpenAPI parser
 * Tests with real-world specifications and fixtures
 */

import { describe, it, expect } from 'vitest';
import { parseOpenAPIFile, OpenAPIParser } from '../../src/index.js';
import { ValidationError, FileNotFoundError } from '../../src/types/errors.js';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');
const REAL_WORLD_DIR = path.join(FIXTURES_DIR, 'real-world-specs');

describe('Parser Integration Tests', () => {
  describe('OpenAPI 3.0 Full Workflow', () => {
    it('should parse valid OpenAPI 3.0 spec from file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-openapi-3.0.yaml');
      const parsed = await parseOpenAPIFile(filePath);

      expect(parsed.version).toBe('3.0.3');
      expect(parsed.type).toBe('openapi-3.0');
      expect(parsed.info.title).toBe('Sample API');
      expect(parsed.servers).toHaveLength(2);
      expect(parsed.servers[0]?.url).toBe('https://api.example.com/v1');
    });

    it('should extract all endpoints from OpenAPI 3.0 spec', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-openapi-3.0.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const endpoints = parser.extractEndpoints();

      expect(endpoints.length).toBeGreaterThan(0);

      const getUsersEndpoint = endpoints.find((e) => e.path === '/users' && e.method === 'get');
      expect(getUsersEndpoint).toBeDefined();
      expect(getUsersEndpoint?.operationId).toBe('listUsers');
      expect(getUsersEndpoint?.parameters).toHaveLength(2);
      expect(getUsersEndpoint?.security).toHaveLength(1);
    });

    it('should extract authentication schemes', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-openapi-3.0.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const authSchemes = parser.extractAuthSchemes();

      expect(authSchemes).toHaveLength(1);
      expect(authSchemes[0]?.name).toBe('bearerAuth');
      expect(authSchemes[0]?.type).toBe('http');
      expect(authSchemes[0]?.config.scheme).toBe('bearer');
    });
  });

  describe('Swagger 2.0 Full Workflow', () => {
    it('should parse valid Swagger 2.0 spec from file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-swagger-2.0.yaml');
      const parsed = await parseOpenAPIFile(filePath);

      expect(parsed.version).toBe('2.0');
      expect(parsed.type).toBe('swagger-2.0');
      expect(parsed.info.title).toBe('Sample Swagger API');
      expect(parsed.servers).toHaveLength(1);
      expect(parsed.servers[0]?.url).toBe('https://api.example.com/v1');
    });

    it('should extract endpoints from Swagger 2.0 spec', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-swagger-2.0.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const endpoints = parser.extractEndpoints();

      expect(endpoints.length).toBeGreaterThan(0);

      const createUserEndpoint = endpoints.find((e) => e.path === '/users' && e.method === 'post');
      expect(createUserEndpoint).toBeDefined();
      expect(createUserEndpoint?.operationId).toBe('createUser');
    });

    it('should extract Swagger 2.0 authentication schemes', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-swagger-2.0.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const authSchemes = parser.extractAuthSchemes();

      expect(authSchemes).toHaveLength(1);
      expect(authSchemes[0]?.name).toBe('apiKey');
      expect(authSchemes[0]?.type).toBe('apiKey');
      expect(authSchemes[0]?.config.in).toBe('header');
      expect(authSchemes[0]?.config.name).toBe('X-API-Key');
    });
  });

  describe('Complex Schemas', () => {
    it('should handle complex nested schemas', async () => {
      const filePath = path.join(FIXTURES_DIR, 'complex-schemas.yaml');
      const parser = new OpenAPIParser();
      const parsed = await parser.parseFromFile(filePath);

      expect(parsed.components?.schemas).toBeDefined();
      expect(parsed.components?.schemas?.ComplexObject).toBeDefined();
      expect(parsed.components?.schemas?.NestedObject).toBeDefined();
    });

    it('should handle composition schemas (oneOf, allOf, anyOf)', async () => {
      const filePath = path.join(FIXTURES_DIR, 'complex-schemas.yaml');
      const parsed = await parseOpenAPIFile(filePath);

      expect(parsed.components?.schemas?.AllOfExample).toBeDefined();
      expect(parsed.components?.schemas?.AnyOfExample).toBeDefined();
    });
  });

  describe('Authentication Schemes', () => {
    it('should extract all authentication types', async () => {
      const filePath = path.join(FIXTURES_DIR, 'auth-schemes.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const authSchemes = parser.extractAuthSchemes();

      expect(authSchemes).toHaveLength(6);

      const authTypes = authSchemes.map((scheme) => scheme.type);
      expect(authTypes).toContain('http'); // bearer and basic
      expect(authTypes).toContain('apiKey');
      expect(authTypes).toContain('oauth2');
      expect(authTypes).toContain('openIdConnect');
    });

    it('should handle multiple security requirements', async () => {
      const filePath = path.join(FIXTURES_DIR, 'auth-schemes.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const endpoints = parser.extractEndpoints();

      const multipleAuthEndpoint = endpoints.find((e) => e.path === '/multiple');
      expect(multipleAuthEndpoint).toBeDefined();
      expect(multipleAuthEndpoint?.security.length).toBeGreaterThan(0);
    });

    it('should handle optional authentication', async () => {
      const filePath = path.join(FIXTURES_DIR, 'auth-schemes.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const endpoints = parser.extractEndpoints();

      const optionalAuthEndpoint = endpoints.find((e) => e.path === '/optional');
      expect(optionalAuthEndpoint).toBeDefined();
      expect(optionalAuthEndpoint?.security).toHaveLength(2);
    });
  });

  describe('Real-World Specifications', () => {
    it('should parse Petstore API (official example)', async () => {
      const filePath = path.join(REAL_WORLD_DIR, 'petstore.yaml');
      const parser = new OpenAPIParser();
      await parser.parseFromFile(filePath);
      const endpoints = parser.extractEndpoints();

      expect(endpoints.length).toBeGreaterThan(5);

      const findByStatusEndpoint = endpoints.find((e) => e.path === '/pet/findByStatus');
      expect(findByStatusEndpoint).toBeDefined();
      expect(findByStatusEndpoint?.parameters.length).toBeGreaterThan(0);

      const authSchemes = parser.extractAuthSchemes();
      expect(authSchemes.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw FileNotFoundError for missing file', async () => {
      const filePath = path.join(FIXTURES_DIR, 'nonexistent.yaml');

      await expect(parseOpenAPIFile(filePath)).rejects.toThrow(FileNotFoundError);
    });

    it('should throw ValidationError for invalid spec', async () => {
      const filePath = path.join(FIXTURES_DIR, 'invalid-spec.yaml');
      const parser = new OpenAPIParser();

      await expect(parser.parseFromFile(filePath)).rejects.toThrow(ValidationError);
    });
  });

  describe('Performance Tests', () => {
    it('should parse large spec in under 5 seconds', async () => {
      const filePath = path.join(REAL_WORLD_DIR, 'petstore.yaml');
      const startTime = Date.now();

      await parseOpenAPIFile(filePath);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple parses efficiently', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-openapi-3.0.yaml');
      const startTime = Date.now();

      await Promise.all([
        parseOpenAPIFile(filePath),
        parseOpenAPIFile(filePath),
        parseOpenAPIFile(filePath),
        parseOpenAPIFile(filePath),
        parseOpenAPIFile(filePath),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full parse workflow from file to endpoint extraction', async () => {
      const filePath = path.join(FIXTURES_DIR, 'valid-openapi-3.0.yaml');

      // Step 1: Parse from file
      const parser = new OpenAPIParser();
      const parsed = await parser.parseFromFile(filePath);

      // Step 2: Verify parsed structure
      expect(parsed.version).toBeDefined();
      expect(parsed.info).toBeDefined();
      expect(parsed.paths).toBeDefined();

      // Step 3: Extract endpoints
      const endpoints = parser.extractEndpoints();
      expect(endpoints.length).toBeGreaterThan(0);

      // Step 4: Extract auth schemes
      const authSchemes = parser.extractAuthSchemes();
      expect(authSchemes).toBeDefined();

      // Step 5: Verify endpoint details
      const getUsersEndpoint = endpoints.find((e) => e.path === '/users' && e.method === 'get');
      expect(getUsersEndpoint).toBeDefined();
      expect(getUsersEndpoint?.parameters).toBeDefined();
      expect(getUsersEndpoint?.responses).toBeDefined();
      expect(getUsersEndpoint?.security).toBeDefined();
      expect(getUsersEndpoint?.servers).toBeDefined();

      // Step 6: Verify parameter extraction
      const limitParam = getUsersEndpoint?.parameters.find((p) => p.name === 'limit');
      expect(limitParam).toBeDefined();
      expect(limitParam?.in).toBe('query');
      expect(limitParam?.required).toBe(false);
    });
  });
});
