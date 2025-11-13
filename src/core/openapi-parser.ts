/**
 * OpenAPI/Swagger parser implementation
 * Supports OpenAPI 3.0, 3.1, and Swagger 2.0
 */

import SwaggerParser from '@apidevtools/swagger-parser';
import type {
  OpenAPISpec,
  SwaggerSpec,
  ParsedApiSpec,
  ApiEndpoint,
  AuthScheme,
  ServerConfig,
  PathItemObject,
  OperationObject,
  HttpMethod,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  ComponentsObject,
  ReferenceObject,
} from '../types/openapi-types.js';
import { ParseError, ValidationError, UnsupportedVersionError } from '../types/errors.js';
import { loadSpec } from '../utils/file-loader.js';

const SUPPORTED_OPENAPI_VERSIONS = ['3.0.0', '3.0.1', '3.0.2', '3.0.3'];
const SUPPORTED_SWAGGER_VERSIONS = ['2.0'];

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
];

/**
 * Main OpenAPI/Swagger parser class
 */
export class OpenAPIParser {
  private spec: OpenAPISpec | SwaggerSpec | null = null;
  private dereferencedSpec: OpenAPISpec | SwaggerSpec | null = null;

  /**
   * Parse an OpenAPI/Swagger specification from a file
   * @param filePath - Path to the specification file
   * @returns Parsed and normalized API specification
   */
  async parseFromFile(filePath: string): Promise<ParsedApiSpec> {
    const rawSpec = await loadSpec(filePath);
    return this.parse(rawSpec);
  }

  /**
   * Parse an OpenAPI/Swagger specification from an object
   * @param spec - Specification object
   * @param options - Parsing options for performance tuning
   * @returns Parsed and normalized API specification
   */
  async parse(spec: unknown, options?: {
    skipDereference?: boolean;
    skipValidation?: boolean;
    timeout?: number;
  }): Promise<ParsedApiSpec> {
    if (!this.isValidSpec(spec)) {
      throw new ValidationError('Invalid specification format', [
        'Specification must have either "openapi" or "swagger" property',
      ]);
    }

    this.spec = spec;

    const version = this.getVersion(spec);
    this.validateVersion(version);

    try {
      // For large specs, use bundle instead of dereference (much faster)
      // Bundle resolves external refs but keeps internal refs intact
      if (options?.skipDereference) {
        console.log('⚡ Using fast bundle mode (skipping full dereferencing)...');
        this.dereferencedSpec = (await SwaggerParser.bundle(spec as never)) as
          | OpenAPISpec
          | SwaggerSpec;
      } else {
        // Full dereferencing (slower but complete for smaller specs)
        this.dereferencedSpec = (await SwaggerParser.dereference(spec as never)) as
          | OpenAPISpec
          | SwaggerSpec;
      }

      // Validation can be slow on large specs, make it optional
      if (!options?.skipValidation) {
        await SwaggerParser.validate(spec as never);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ValidationError('Specification validation failed', [errorMessage]);
    }

    return this.normalize(this.dereferencedSpec);
  }

  /**
   * Extract all API endpoints from the parsed specification
   * @returns Array of API endpoints
   */
  extractEndpoints(): ApiEndpoint[] {
    if (!this.dereferencedSpec) {
      throw new ParseError('No specification loaded', 'OpenAPIParser');
    }

    const endpoints: ApiEndpoint[] = [];
    const paths = this.dereferencedSpec.paths;

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      const servers = this.getServers(pathItem);

      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!operation) continue;

        endpoints.push(this.buildEndpoint(pathStr, method, operation, pathItem, servers));
      }
    }

    return endpoints;
  }

  /**
   * Extract authentication schemes from the specification
   * @returns Array of authentication schemes
   */
  extractAuthSchemes(): AuthScheme[] {
    if (!this.dereferencedSpec) {
      throw new ParseError('No specification loaded', 'OpenAPIParser');
    }

    const schemes: AuthScheme[] = [];

    if (this.isOpenAPISpec(this.dereferencedSpec)) {
      const components = this.dereferencedSpec.components;
      if (components?.securitySchemes) {
        for (const [name, scheme] of Object.entries(components.securitySchemes)) {
          if (!this.isReferenceObject(scheme)) {
            schemes.push({ name, type: scheme.type, config: scheme });
          }
        }
      }
    } else {
      const securityDefinitions = this.dereferencedSpec.securityDefinitions;
      if (securityDefinitions) {
        for (const [name, scheme] of Object.entries(securityDefinitions)) {
          if (!this.isReferenceObject(scheme)) {
            schemes.push({ name, type: scheme.type, config: scheme });
          }
        }
      }
    }

    return schemes;
  }

  /**
   * Get the specification version
   */
  getSpecVersion(): string | null {
    return this.spec ? this.getVersion(this.spec) : null;
  }

  /**
   * Get the specification type
   */
  getSpecType(): 'openapi-3.0' | 'openapi-3.1' | 'swagger-2.0' | null {
    if (!this.spec) return null;

    if (this.isOpenAPISpec(this.spec)) {
      return this.spec.openapi.startsWith('3.1') ? 'openapi-3.1' : 'openapi-3.0';
    }

    return 'swagger-2.0';
  }

  // Private helper methods

  private isValidSpec(spec: unknown): spec is OpenAPISpec | SwaggerSpec {
    return typeof spec === 'object' && spec !== null && ('openapi' in spec || 'swagger' in spec);
  }

  private isOpenAPISpec(spec: OpenAPISpec | SwaggerSpec): spec is OpenAPISpec {
    return 'openapi' in spec;
  }

  private getVersion(spec: OpenAPISpec | SwaggerSpec): string {
    return this.isOpenAPISpec(spec) ? spec.openapi : spec.swagger;
  }

  private validateVersion(version: string): void {
    const isSupported =
      SUPPORTED_OPENAPI_VERSIONS.some((v) => version.startsWith(v)) ||
      SUPPORTED_SWAGGER_VERSIONS.includes(version);

    if (!isSupported) {
      throw new UnsupportedVersionError(version, [
        ...SUPPORTED_OPENAPI_VERSIONS,
        ...SUPPORTED_SWAGGER_VERSIONS,
      ]);
    }
  }

  private normalize(spec: OpenAPISpec | SwaggerSpec): ParsedApiSpec {
    const servers = this.extractServers(spec);
    const version = this.getVersion(spec);
    const type = this.isOpenAPISpec(spec)
      ? version.startsWith('3.1')
        ? ('openapi-3.1' as const)
        : ('openapi-3.0' as const)
      : ('swagger-2.0' as const);

    return {
      version,
      type,
      info: spec.info,
      servers,
      paths: spec.paths,
      components: this.isOpenAPISpec(spec) ? spec.components : this.convertSwaggerComponents(spec),
      security: spec.security ?? [],
      tags: spec.tags ?? [],
    };
  }

  private extractServers(spec: OpenAPISpec | SwaggerSpec): ServerConfig[] {
    if (this.isOpenAPISpec(spec)) {
      return spec.servers ?? [{ url: '/' }];
    }

    const swagger = spec;
    const protocol = swagger.schemes?.[0] ?? 'https';
    const host = swagger.host ?? 'localhost';
    const basePath = swagger.basePath ?? '';
    const url = `${protocol}://${host}${basePath}`;

    return [{ url }];
  }

  private convertSwaggerComponents(swagger: SwaggerSpec): ComponentsObject | undefined {
    if (!swagger.definitions && !swagger.parameters && !swagger.responses) {
      return undefined;
    }

    return {
      schemas: swagger.definitions,
      parameters: swagger.parameters,
      responses: swagger.responses,
    };
  }

  private getServers(pathItem: PathItemObject): ServerConfig[] {
    if (!this.dereferencedSpec) return [];

    const pathServers = pathItem.servers;
    if (pathServers && pathServers.length > 0) {
      return pathServers;
    }

    if (this.isOpenAPISpec(this.dereferencedSpec)) {
      return this.dereferencedSpec.servers ?? [{ url: '/' }];
    }

    return this.extractServers(this.dereferencedSpec);
  }

  private buildEndpoint(
    path: string,
    method: HttpMethod,
    operation: OperationObject,
    pathItem: PathItemObject,
    servers: ServerConfig[]
  ): ApiEndpoint {
    const pathParameters = this.extractParameters(pathItem.parameters ?? []);
    const operationParameters = this.extractParameters(operation.parameters ?? []);
    const allParameters = [...pathParameters, ...operationParameters];

    const responses = new Map<number | 'default', ResponseObject>();
    for (const [status, response] of Object.entries(operation.responses)) {
      if (response && !this.isReferenceObject(response)) {
        const statusKey = status === 'default' ? 'default' : parseInt(status, 10);
        responses.set(statusKey, response);
      }
    }

    return {
      path,
      method,
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      parameters: allParameters,
      requestBody: this.extractRequestBody(operation.requestBody),
      responses,
      security: operation.security ?? [],
      tags: operation.tags ?? [],
      servers: operation.servers ?? servers,
    };
  }

  private extractParameters(parameters: (ParameterObject | ReferenceObject)[]): ParameterObject[] {
    return parameters.filter((p) => !this.isReferenceObject(p)) as ParameterObject[];
  }

  private extractRequestBody(
    requestBody: RequestBodyObject | ReferenceObject | undefined
  ): RequestBodyObject | undefined {
    if (!requestBody || this.isReferenceObject(requestBody)) {
      return undefined;
    }
    return requestBody;
  }

  private isReferenceObject(obj: unknown): obj is ReferenceObject {
    return typeof obj === 'object' && obj !== null && '$ref' in obj;
  }
}

/**
 * Convenience function to parse a specification file
 * @param filePath - Path to the specification file
 * @param options - Parsing options for performance tuning
 * @returns Parsed API specification
 */
export async function parseOpenAPIFile(
  filePath: string,
  options?: {
    skipDereference?: boolean;
    skipValidation?: boolean;
    timeout?: number;
  }
): Promise<ParsedApiSpec> {
  const parser = new OpenAPIParser();
  const rawSpec = await loadSpec(filePath);
  return parser.parse(rawSpec, options);
}

/**
 * Convenience function to parse a specification object
 * @param spec - Specification object
 * @param options - Parsing options for performance tuning
 * @returns Parsed API specification
 */
export async function parseOpenAPISpec(
  spec: unknown,
  options?: {
    skipDereference?: boolean;
    skipValidation?: boolean;
    timeout?: number;
  }
): Promise<ParsedApiSpec> {
  const parser = new OpenAPIParser();
  return parser.parse(spec, options);
}
