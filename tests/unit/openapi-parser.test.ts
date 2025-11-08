/**
 * Unit tests for OpenAPI parser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAPIParser, parseOpenAPISpec } from '../../src/core/openapi-parser.js';
import { ValidationError, UnsupportedVersionError } from '../../src/types/errors.js';
import type { OpenAPISpec, SwaggerSpec } from '../../src/types/openapi-types.js';

describe('OpenAPIParser', () => {
  let parser: OpenAPIParser;

  beforeEach(() => {
    parser = new OpenAPIParser();
  });

  describe('OpenAPI 3.0 parsing', () => {
    it('should parse valid OpenAPI 3.0.0 spec', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      const parsed = await parser.parse(spec);

      expect(parsed.version).toBe('3.0.0');
      expect(parsed.type).toBe('openapi-3.0');
      expect(parsed.info.title).toBe('Test API');
      expect(parsed.paths['/users']).toBeDefined();
    });

    it('should parse OpenAPI 3.0.3 spec', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      const parsed = await parser.parse(spec);
      expect(parsed.version).toBe('3.0.3');
      expect(parsed.type).toBe('openapi-3.0');
    });

    it('should extract servers from OpenAPI 3.0 spec', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://api.example.com/v1',
            description: 'Production server',
          },
          {
            url: 'https://staging.example.com/v1',
            description: 'Staging server',
          },
        ],
        paths: {},
      };

      const parsed = await parser.parse(spec);
      expect(parsed.servers).toHaveLength(2);
      expect(parsed.servers[0]?.url).toBe('https://api.example.com/v1');
      expect(parsed.servers[1]?.url).toBe('https://staging.example.com/v1');
    });
  });

  describe('OpenAPI 3.1 support', () => {
    it('should reject OpenAPI 3.1.0 spec (swagger-parser limitation)', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test API v3.1',
          version: '2.0.0',
        },
        paths: {},
      };

      await expect(parser.parse(spec)).rejects.toThrow(UnsupportedVersionError);
    });
  });

  describe('Swagger 2.0 parsing', () => {
    it('should parse valid Swagger 2.0 spec', async () => {
      const spec: SwaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      const parsed = await parser.parse(spec);
      expect(parsed.version).toBe('2.0');
      expect(parsed.type).toBe('swagger-2.0');
    });

    it('should construct server URL from Swagger 2.0 properties', async () => {
      const spec: SwaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        host: 'api.example.com',
        basePath: '/v1',
        schemes: ['https'],
        paths: {},
      };

      const parsed = await parser.parse(spec);
      expect(parsed.servers).toHaveLength(1);
      expect(parsed.servers[0]?.url).toBe('https://api.example.com/v1');
    });

    it('should convert Swagger definitions to components', async () => {
      const spec: SwaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        definitions: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
        },
      };

      const parsed = await parser.parse(spec);
      expect(parsed.components?.schemas?.User).toBeDefined();
      expect(parsed.components?.schemas?.User).toHaveProperty('type', 'object');
    });
  });

  describe('Endpoint extraction', () => {
    it('should extract endpoints from OpenAPI 3.0 spec', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              summary: 'Get all users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
            post: {
              operationId: 'createUser',
              summary: 'Create a user',
              responses: {
                '201': {
                  description: 'Created',
                },
              },
            },
          },
          '/users/{id}': {
            get: {
              operationId: 'getUserById',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      await parser.parse(spec);
      const endpoints = parser.extractEndpoints();

      expect(endpoints).toHaveLength(3);
      expect(endpoints[0]?.path).toBe('/users');
      expect(endpoints[0]?.method).toBe('get');
      expect(endpoints[0]?.operationId).toBe('getUsers');
      expect(endpoints[1]?.method).toBe('post');
      expect(endpoints[2]?.path).toBe('/users/{id}');
      expect(endpoints[2]?.parameters).toHaveLength(1);
    });

    it('should extract parameters from endpoints', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/search': {
            get: {
              parameters: [
                {
                  name: 'q',
                  in: 'query',
                  required: true,
                  schema: { type: 'string' },
                },
                {
                  name: 'limit',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer' },
                },
              ],
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      await parser.parse(spec);
      const endpoints = parser.extractEndpoints();

      expect(endpoints[0]?.parameters).toHaveLength(2);
      expect(endpoints[0]?.parameters[0]?.name).toBe('q');
      expect(endpoints[0]?.parameters[0]?.required).toBe(true);
      expect(endpoints[0]?.parameters[1]?.name).toBe('limit');
      expect(endpoints[0]?.parameters[1]?.required).toBe(false);
    });
  });

  describe('Authentication extraction', () => {
    it('should extract API key authentication', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
      };

      await parser.parse(spec);
      const schemes = parser.extractAuthSchemes();

      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.name).toBe('apiKey');
      expect(schemes[0]?.type).toBe('apiKey');
      expect(schemes[0]?.config.in).toBe('header');
      expect(schemes[0]?.config.name).toBe('X-API-Key');
    });

    it('should extract HTTP bearer authentication', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      };

      await parser.parse(spec);
      const schemes = parser.extractAuthSchemes();

      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.type).toBe('http');
      expect(schemes[0]?.config.scheme).toBe('bearer');
      expect(schemes[0]?.config.bearerFormat).toBe('JWT');
    });

    it('should extract OAuth2 authentication', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: {
                    'read:users': 'Read users',
                    'write:users': 'Write users',
                  },
                },
              },
            },
          },
        },
      };

      await parser.parse(spec);
      const schemes = parser.extractAuthSchemes();

      expect(schemes).toHaveLength(1);
      expect(schemes[0]?.type).toBe('oauth2');
      expect(schemes[0]?.config.flows?.authorizationCode).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw ValidationError for invalid spec', async () => {
      await expect(parser.parse({})).rejects.toThrow(ValidationError);
      await expect(parser.parse({ info: { title: 'Test' } })).rejects.toThrow(ValidationError);
    });

    it('should throw UnsupportedVersionError for unsupported version', async () => {
      const spec = {
        openapi: '2.5.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      await expect(parser.parse(spec)).rejects.toThrow(UnsupportedVersionError);
    });

    it('should throw ValidationError for malformed spec', async () => {
      const spec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              responses: 'invalid',
            },
          },
        },
      };

      await expect(parser.parse(spec)).rejects.toThrow(ValidationError);
    });
  });

  describe('Convenience functions', () => {
    it('should parse spec using convenience function', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      const parsed = await parseOpenAPISpec(spec);
      expect(parsed.info.title).toBe('Test API');
    });
  });

  describe('Version and type getters', () => {
    it('should return null for version and type before parsing', () => {
      expect(parser.getSpecVersion()).toBeNull();
      expect(parser.getSpecType()).toBeNull();
    });

    it('should return correct version and type after parsing OpenAPI 3.0', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      await parser.parse(spec);
      expect(parser.getSpecVersion()).toBe('3.0.3');
      expect(parser.getSpecType()).toBe('openapi-3.0');
    });

    it('should return correct type for OpenAPI 3.0', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      await parser.parse(spec);
      expect(parser.getSpecType()).toBe('openapi-3.0');
    });

    it('should return correct version and type for Swagger 2.0', async () => {
      const spec: SwaggerSpec = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      await parser.parse(spec);
      expect(parser.getSpecVersion()).toBe('2.0');
      expect(parser.getSpecType()).toBe('swagger-2.0');
    });
  });
});
