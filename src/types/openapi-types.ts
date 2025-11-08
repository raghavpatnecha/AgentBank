/**
 * TypeScript type definitions for OpenAPI 3.0, 3.1, and Swagger 2.0
 * Based on official OpenAPI specifications
 */

// Common types used across versions
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace';

export interface ServerConfig {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

// OpenAPI 3.x types
export interface OpenAPISpec {
  openapi: string;
  info: InfoObject;
  servers?: ServerConfig[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirement[];
  tags?: TagObject[];
  externalDocs?: ExternalDocsObject;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject | undefined;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
  servers?: ServerConfig[];
  parameters?: (ParameterObject | ReferenceObject)[];
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: ServerConfig[];
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: unknown;
  examples?: Record<string, ExampleObject | ReferenceObject>;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: unknown;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  encoding?: Record<string, EncodingObject>;
}

export interface EncodingObject {
  contentType?: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject | undefined;
  default?: ResponseObject | ReferenceObject;
}

export interface ResponseObject {
  description: string;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  content?: Record<string, MediaTypeObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
}

export interface HeaderObject extends Omit<ParameterObject, 'in' | 'name'> {
  // Header is similar to Parameter but without 'in' and 'name'
}

export interface CallbackObject {
  [expression: string]: PathItemObject | undefined;
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, unknown>;
  requestBody?: unknown;
  description?: string;
  server?: ServerConfig;
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

export interface SchemaObject {
  // JSON Schema core properties
  type?: string | string[];
  properties?: Record<string, SchemaObject | ReferenceObject>;
  items?: SchemaObject | ReferenceObject;
  required?: string[];
  enum?: unknown[];

  // JSON Schema validation
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;

  // Composition
  allOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  not?: SchemaObject | ReferenceObject;

  // Metadata
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  examples?: unknown[];

  // OpenAPI extensions
  nullable?: boolean;
  discriminator?: DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlObject;
  externalDocs?: ExternalDocsObject;
  deprecated?: boolean;

  // Additional properties
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
  format?: string;
}

export interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XmlObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface ReferenceObject {
  $ref: string;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject | ReferenceObject>;
  responses?: Record<string, ResponseObject | ReferenceObject>;
  parameters?: Record<string, ParameterObject | ReferenceObject>;
  examples?: Record<string, ExampleObject | ReferenceObject>;
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
  headers?: Record<string, HeaderObject | ReferenceObject>;
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
  links?: Record<string, LinkObject | ReferenceObject>;
  callbacks?: Record<string, CallbackObject | ReferenceObject>;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string; // for apiKey
  in?: 'query' | 'header' | 'cookie'; // for apiKey
  scheme?: string; // for http
  bearerFormat?: string; // for http bearer
  flows?: OAuthFlowsObject; // for oauth2
  openIdConnectUrl?: string; // for openIdConnect
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export type SecurityRequirement = Record<string, string[]>;

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocsObject;
}

export interface ExternalDocsObject {
  description?: string;
  url: string;
}

// Swagger 2.0 types
export interface SwaggerSpec {
  swagger: '2.0';
  info: InfoObject;
  host?: string;
  basePath?: string;
  schemes?: ('http' | 'https' | 'ws' | 'wss')[];
  consumes?: string[];
  produces?: string[];
  paths: PathsObject;
  definitions?: Record<string, SchemaObject>;
  parameters?: Record<string, ParameterObject>;
  responses?: Record<string, ResponseObject>;
  securityDefinitions?: Record<string, SecuritySchemeObject>;
  security?: SecurityRequirement[];
  tags?: TagObject[];
  externalDocs?: ExternalDocsObject;
}

// Parsed API specification (normalized format)
export interface ParsedApiSpec {
  version: string;
  type: 'openapi-3.0' | 'openapi-3.1' | 'swagger-2.0';
  info: InfoObject;
  servers: ServerConfig[];
  paths: PathsObject;
  components?: ComponentsObject;
  security: SecurityRequirement[];
  tags: TagObject[];
}

// Endpoint information extracted from spec
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Map<number | 'default', ResponseObject>;
  security: SecurityRequirement[];
  tags: string[];
  servers: ServerConfig[];
}

// Authentication scheme information
export interface AuthScheme {
  name: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  config: SecuritySchemeObject;
}

// Schema information for request/response bodies
export interface SchemaInfo {
  schema: SchemaObject;
  example?: unknown;
  examples?: Record<string, unknown>;
  required: boolean;
}
