/**
 * Type definitions for OpenAPI spec comparison and diff analysis
 * Feature 4: Self-Healing Agent - Task 4.1
 */

/**
 * Supported OpenAPI versions
 */
export type OpenAPIVersion = '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0';

/**
 * Change types for tracking modifications between specs
 */
export enum ChangeType {
  FIELD_RENAMED = 'field_renamed',
  TYPE_CHANGED = 'type_changed',
  FIELD_ADDED = 'field_added',
  FIELD_REMOVED = 'field_removed',
  VALUE_CHANGED = 'value_changed',
  REQUIRED_CHANGED = 'required_changed',
  DEPRECATED_CHANGED = 'deprecated_changed',
  ENUM_CHANGED = 'enum_changed'
}

/**
 * Severity levels for changes
 */
export enum ChangeSeverity {
  BREAKING = 'breaking',
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch'
}

/**
 * Individual change detected during comparison
 */
export interface Change {
  type: ChangeType;
  path: string;
  oldValue?: any;
  newValue?: any;
  severity: ChangeSeverity;
  description: string;
  affectedEndpoints?: string[];
  suggestedFix?: string;
}

/**
 * HTTP method types
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace';

/**
 * Endpoint change information
 */
export interface EndpointChange {
  method: HttpMethod;
  path: string;
  changeType: 'added' | 'removed' | 'modified';
  changes: Change[];
  oldOperation?: OpenAPIOperation;
  newOperation?: OpenAPIOperation;
}

/**
 * Collection of endpoint changes
 */
export interface EndpointChanges {
  added: EndpointChange[];
  removed: EndpointChange[];
  modified: EndpointChange[];
  total: number;
}

/**
 * Parameter location in request
 */
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

/**
 * Parameter change information
 */
export interface ParameterChange {
  endpoint: string;
  method: HttpMethod;
  parameterName: string;
  location: ParameterLocation;
  changeType: ChangeType;
  oldParameter?: OpenAPIParameter;
  newParameter?: OpenAPIParameter;
  changes: Change[];
}

/**
 * Collection of parameter changes
 */
export interface ParameterChanges {
  added: ParameterChange[];
  removed: ParameterChange[];
  modified: ParameterChange[];
  requiredChanged: ParameterChange[];
  typeChanged: ParameterChange[];
  total: number;
}

/**
 * Schema change information
 */
export interface SchemaChange {
  schemaName: string;
  path: string;
  changeType: ChangeType;
  oldSchema?: OpenAPISchema;
  newSchema?: OpenAPISchema;
  changes: Change[];
  affectedEndpoints: string[];
}

/**
 * Collection of schema changes
 */
export interface SchemaChanges {
  added: SchemaChange[];
  removed: SchemaChange[];
  modified: SchemaChange[];
  propertyChanges: SchemaChange[];
  typeChanges: SchemaChange[];
  total: number;
}

/**
 * Authentication scheme types
 */
export type AuthSchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

/**
 * Authentication change information
 */
export interface AuthChange {
  schemeName: string;
  changeType: 'added' | 'removed' | 'modified';
  schemeType?: AuthSchemeType;
  oldScheme?: OpenAPISecurityScheme;
  newScheme?: OpenAPISecurityScheme;
  changes: Change[];
  affectedEndpoints: string[];
}

/**
 * Collection of authentication changes
 */
export interface AuthChanges {
  added: AuthChange[];
  removed: AuthChange[];
  modified: AuthChange[];
  total: number;
}

/**
 * Complete diff result between two specs
 */
export interface SpecDiff {
  oldVersion: string;
  newVersion: string;
  openAPIVersion: OpenAPIVersion;
  timestamp: Date;
  summary: DiffSummary;
  endpoints: EndpointChanges;
  parameters: ParameterChanges;
  schemas: SchemaChanges;
  auth: AuthChanges;
  metadata: MetadataChanges;
  allChanges: Change[];
}

/**
 * Summary statistics for diff
 */
export interface DiffSummary {
  totalChanges: number;
  breakingChanges: number;
  majorChanges: number;
  minorChanges: number;
  patchChanges: number;
  endpointsAdded: number;
  endpointsRemoved: number;
  endpointsModified: number;
  schemasAdded: number;
  schemasRemoved: number;
  schemasModified: number;
  isBackwardCompatible: boolean;
}

/**
 * Metadata changes (title, description, version, etc.)
 */
export interface MetadataChanges {
  title?: Change;
  description?: Change;
  version?: Change;
  termsOfService?: Change;
  contact?: Change;
  license?: Change;
  servers?: Change;
  externalDocs?: Change;
}

/**
 * Diff report for human consumption
 */
export interface DiffReport {
  summary: string;
  breakingChanges: string[];
  majorChanges: string[];
  minorChanges: string[];
  recommendations: string[];
  migrationNotes: string[];
}

/**
 * OpenAPI specification structure (simplified)
 */
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, OpenAPIPath>;
  components?: OpenAPIComponents;
  security?: OpenAPISecurityRequirement[];
  tags?: OpenAPITag[];
  externalDocs?: OpenAPIExternalDocs;
}

/**
 * OpenAPI info object
 */
export interface OpenAPIInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenAPIContact;
  license?: OpenAPILicense;
  version: string;
}

/**
 * OpenAPI contact object
 */
export interface OpenAPIContact {
  name?: string;
  url?: string;
  email?: string;
}

/**
 * OpenAPI license object
 */
export interface OpenAPILicense {
  name: string;
  url?: string;
}

/**
 * OpenAPI server object
 */
export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPIServerVariable>;
}

/**
 * OpenAPI server variable
 */
export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

/**
 * OpenAPI path item
 */
export interface OpenAPIPath {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
  trace?: OpenAPIOperation;
  parameters?: OpenAPIParameter[];
}

/**
 * OpenAPI operation
 */
export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  security?: OpenAPISecurityRequirement[];
  deprecated?: boolean;
}

/**
 * OpenAPI parameter
 */
export interface OpenAPIParameter {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: OpenAPISchema;
  example?: any;
  examples?: Record<string, OpenAPIExample>;
}

/**
 * OpenAPI request body
 */
export interface OpenAPIRequestBody {
  description?: string;
  content: Record<string, OpenAPIMediaType>;
  required?: boolean;
}

/**
 * OpenAPI response
 */
export interface OpenAPIResponse {
  description: string;
  headers?: Record<string, OpenAPIHeader>;
  content?: Record<string, OpenAPIMediaType>;
  links?: Record<string, OpenAPILink>;
}

/**
 * OpenAPI media type
 */
export interface OpenAPIMediaType {
  schema?: OpenAPISchema;
  example?: any;
  examples?: Record<string, OpenAPIExample>;
  encoding?: Record<string, OpenAPIEncoding>;
}

/**
 * OpenAPI schema
 */
export interface OpenAPISchema {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  required?: string[];
  enum?: any[];
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  not?: OpenAPISchema;
  discriminator?: OpenAPIDiscriminator;
  example?: any;
  $ref?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | OpenAPISchema;
}

/**
 * OpenAPI discriminator
 */
export interface OpenAPIDiscriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

/**
 * OpenAPI components
 */
export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>;
  responses?: Record<string, OpenAPIResponse>;
  parameters?: Record<string, OpenAPIParameter>;
  examples?: Record<string, OpenAPIExample>;
  requestBodies?: Record<string, OpenAPIRequestBody>;
  headers?: Record<string, OpenAPIHeader>;
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
  links?: Record<string, OpenAPILink>;
  callbacks?: Record<string, OpenAPICallback>;
}

/**
 * OpenAPI example
 */
export interface OpenAPIExample {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

/**
 * OpenAPI header
 */
export interface OpenAPIHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: OpenAPISchema;
}

/**
 * OpenAPI security scheme
 */
export interface OpenAPISecurityScheme {
  type: AuthSchemeType;
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OpenAPIOAuthFlows;
  openIdConnectUrl?: string;
}

/**
 * OpenAPI OAuth flows
 */
export interface OpenAPIOAuthFlows {
  implicit?: OpenAPIOAuthFlow;
  password?: OpenAPIOAuthFlow;
  clientCredentials?: OpenAPIOAuthFlow;
  authorizationCode?: OpenAPIOAuthFlow;
}

/**
 * OpenAPI OAuth flow
 */
export interface OpenAPIOAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * OpenAPI security requirement
 */
export type OpenAPISecurityRequirement = Record<string, string[]>;

/**
 * OpenAPI link
 */
export interface OpenAPILink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
}

/**
 * OpenAPI callback
 */
export type OpenAPICallback = Record<string, OpenAPIPath>;

/**
 * OpenAPI encoding
 */
export interface OpenAPIEncoding {
  contentType?: string;
  headers?: Record<string, OpenAPIHeader>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

/**
 * OpenAPI tag
 */
export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocs;
}

/**
 * OpenAPI external documentation
 */
export interface OpenAPIExternalDocs {
  description?: string;
  url: string;
}

/**
 * Options for spec comparison
 */
export interface ComparisonOptions {
  ignoreDescriptionChanges?: boolean;
  ignoreExampleChanges?: boolean;
  ignoreDeprecated?: boolean;
  strictTypeChecking?: boolean;
  trackFieldRenames?: boolean;
  renameSimilarityThreshold?: number; // 0-1, default 0.8
}

/**
 * Result of loading and parsing a spec file
 */
export interface SpecLoadResult {
  spec: OpenAPISpec;
  filepath: string;
  format: 'json' | 'yaml';
  size: number;
  parseTime: number;
}
