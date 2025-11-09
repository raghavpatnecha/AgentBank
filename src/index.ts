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

// Test Generator (Feature 2)
export { TestGenerator } from './core/test-generator.js';
export type { TestGeneratorOptions } from './core/test-generator.js';

// Generators
export { RequestBodyGenerator } from './generators/request-body-generator.js';
export { FlowGenerator } from './generators/flow-generator.js';
export { TestOrganizer } from './generators/test-organizer.js';

// Utils
export {
  analyzeEndpointDependencies,
  findCRUDSets,
  findCreateReadPairs,
  groupByResource,
  extractResourceName,
  hasIdParameter,
  isListEndpoint,
  isDetailEndpoint,
  isCreateEndpoint,
  isUpdateEndpoint,
  isDeleteEndpoint,
  getCRUDOperation,
} from './utils/dependency-analyzer.js';
export {
  generateFileStructure,
  generateIndexFile,
  generateTestSuite,
  visualizeStructure,
} from './utils/file-structure-generator.js';

// Test Generator Types
export type {
  TestCase,
  TestType,
  TestRequest,
  TestValue,
  TestRequestBody,
  ExpectedResponse,
  ResponseBodyValidation,
  ValidationRule,
  TestAuth,
  TestCredentials,
  OAuth2Config,
  TestHooks,
  TestMetadata,
  GeneratedTestFile,
  FileMetadata,
  TestGeneratorConfig,
  OrganizationStrategy,
  AuthConfig,
  DataGenerationOptions,
  DataGenerator,
  GenerationContext,
  CodeGenerationOptions,
  CodeStyle,
  ValidationOptions,
  TestGenerationOptions,
  TestGenerationResult,
  GenerationStatistics,
  GenerationWarning,
  GenerationError,
  TestSuite,
  PlaywrightConfigOptions,
  DataFactory as IDataFactory,
  ResponseValidator,
  TestOrganizer as ITestOrganizer,
  FileStructure,
  AdditionalFile,
} from './types/test-generator-types.js';

// Flow Generator Types
export type {
  FlowType,
  FlowStep,
  WorkflowFlow,
  FlowGeneratorOptions,
} from './generators/flow-generator.js';

// Dependency Analyzer Types
export type { CRUDSet, DependencyGraph } from './utils/dependency-analyzer.js';

// Test Organizer Types
export type { OrganizedTests } from './generators/test-organizer.js';
