/**
 * API Test Agent - OpenAPI Parser
 * Main entry point for the OpenAPI parser module
 */

// Core parser
export { OpenAPIParser, parseOpenAPIFile, parseOpenAPISpec } from './core/openapi-parser.js';

// Types
export type {
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
  SecuritySchemeObject,
  ReferenceObject,
  InfoObject,
  ContactObject,
  LicenseObject,
  SchemaObject,
  DiscriminatorObject,
  XmlObject,
  ExampleObject,
  MediaTypeObject,
  EncodingObject,
  HeaderObject,
  CallbackObject,
  LinkObject,
  OAuthFlowsObject,
  OAuthFlowObject,
  SecurityRequirement,
  TagObject,
  ExternalDocsObject,
  SchemaInfo,
  ServerVariable,
} from './types/openapi-types.js';

// Errors
export {
  ApiTestAgentError,
  FileNotFoundError,
  ParseError,
  ValidationError,
  UnsupportedVersionError,
  CircularReferenceError,
} from './types/errors.js';

// File utilities
export { loadFile, loadSpec, detectFormat, parseContent } from './utils/file-loader.js';
export type { FileFormat, LoadOptions } from './utils/file-loader.js';
