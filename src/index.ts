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

// Docker Test Executor (Feature 3.1)
export {
  DockerTestExecutor,
  createDockerExecutor,
  executeTestsInDocker,
} from './executor/docker-test-executor.js';
export { DockerConfig } from './config/docker-config.js';
export {
  DEFAULT_DOCKER_IMAGES,
  DEFAULT_RESOURCES,
  RESOURCE_PRESETS,
  DEFAULT_NETWORK,
  NETWORK_PRESETS,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_DOCKER_OPTIONS,
} from './config/docker-config.js';

// Docker Types
export type {
  DockerExecutorOptions,
  ContainerConfig,
  ContainerResources,
  NetworkConfig,
  VolumeMount,
  ContainerRetryConfig,
  ContainerExecutionResult,
  DockerExecutionResult,
  DockerExecutorStats,
  ContainerResourceUsage,
  ContainerError,
  ContainerLifecycleEvent,
  DockerTestRunner,
  ContainerEventCallback,
} from './types/docker-types.js';

export {
  NetworkMode,
  CleanupStrategy,
  ContainerStatus,
  ContainerErrorCode,
  ContainerLifecycleEventType,
} from './types/docker-types.js';

// Pipeline Orchestrator (Core - Feature 7)
export { PipelineOrchestrator } from './core/pipeline-orchestrator.js';
export type { PipelineConfig, PipelineResult } from './core/pipeline-orchestrator.js';

// Incremental Generator (Feature 1.1)
export { IncrementalGenerator, createIncrementalGenerator } from './core/incremental-generator.js';

// Email Reporting (Feature 6.3)
export { EmailSender } from './reporting/email-sender.js';
export type { EmailConfig, Attachment, TestReport } from './types/email-types.js';

// Performance Testing & Reporting (Feature 3.2)
export { PerformanceReporter } from './reporting/performance-reporter.js';
export type { PerformanceReporterConfig } from './reporting/performance-reporter.js';
export { PerformanceTestGenerator } from './generators/performance-test-generator.js';

// GitHub Integration (Feature 5)
export { WebhookServer, createDefaultConfig } from './github/webhook-server.js';
export { JobProcessor, JobWorker } from './github/job-processor.js';
export type { JobProcessorConfig } from './github/job-processor.js';
export { CommentParser, createCommentParser, parseComment, detectBotMention } from './github/comment-parser.js';
export { GitHubClient } from './github/github-client.js';
export type {
  TestJob,
  JobStatus,
  ParsedCommand,
  CommandArgs,
  CommandType,
  ValidationResult,
} from './types/webhook-types.js';

// Self-Healing (Feature 4)
export { SelfHealingOrchestrator } from './ai/self-healing-orchestrator.js';
export { AITestRegenerator } from './ai/ai-test-regenerator.js';
export { FailureAnalyzer } from './ai/failure-analyzer.js';
export { RuleBasedHealer } from './ai/rule-based-healer.js';
export { CostOptimizer } from './ai/cost-optimizer.js';

// AI Utilities
export { OpenAIClient } from './ai/openai-client.js';
export { CacheManager } from './ai/cache-manager.js';
export { PromptBuilder } from './ai/prompt-builder.js';

// Reporting
export { HTMLReporter } from './reporting/html-reporter.js';
export { JSONReporter } from './reporting/json-reporter.js';
export { JUnitReporter } from './reporting/junit-reporter.js';
export { ReportManager } from './reporting/report-manager.js';

// Test Data Management (Feature 6.2)
export { EntityFactory } from './data/entity-factory.js';

// Additional Generators
export { AuthTestGenerator } from './generators/auth-test-generator.js';
export { EdgeCaseGenerator } from './generators/edge-case-generator.js';

// Executor Types
export type {
  ExecutionOptions,
  ExecutionSummary,
} from './types/executor-types.js';
