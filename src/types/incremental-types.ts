/**
 * TypeScript type definitions for Incremental Test Generation
 * Defines interfaces for tracking generated tests and detecting changes
 */

/**
 * Metadata about a single generated endpoint's tests
 */
export interface EndpointChecksum {
  /** Unique checksum of the endpoint (path + method + schemas) */
  checksum: string;

  /** HTTP method (GET, POST, etc.) */
  method: string;

  /** API endpoint path */
  path: string;

  /** Generated test files for this endpoint */
  files: string[];

  /** When these tests were generated */
  generatedAt: string;

  /** Last modification time of generated files (ISO string) */
  lastModified: string;

  /** Test types that were generated for this endpoint */
  testTypes: string[];

  /** Number of tests generated */
  testCount: number;
}

/**
 * Complete generation metadata stored in cache
 */
export interface GenerationMetadata {
  /** Metadata format version */
  version: string;

  /** Hash of the entire OpenAPI spec file */
  specHash: string;

  /** Path to the OpenAPI spec file */
  specPath: string;

  /** When the spec was last processed */
  generatedAt: string;

  /** Output directory where tests were generated */
  outputDir: string;

  /** Organization strategy used */
  organizationStrategy: string;

  /** Map of endpoint key → metadata */
  endpoints: Record<string, EndpointChecksum>;

  /** Generation options used */
  generationOptions: GenerationOptionsSnapshot;
}

/**
 * Snapshot of generation options
 */
export interface GenerationOptionsSnapshot {
  includeAuth: boolean;
  includeErrors: boolean;
  includeEdgeCases: boolean;
  includeFlows: boolean;
  includePerformance: boolean;
  baseUrl?: string;
}

/**
 * Result of change detection between specs
 */
export interface ChangeDetectionResult {
  /** Endpoints that were added */
  added: EndpointIdentifier[];

  /** Endpoints that were removed */
  removed: EndpointIdentifier[];

  /** Endpoints that were modified */
  modified: EndpointIdentifier[];

  /** Endpoints that are unchanged */
  unchanged: EndpointIdentifier[];

  /** Whether the spec file itself changed */
  specChanged: boolean;

  /** Whether generation options changed */
  optionsChanged: boolean;

  /** Files that need to be deleted (for removed endpoints) */
  filesToDelete: string[];

  /** Files that were manually modified since generation */
  manuallyModifiedFiles: string[];
}

/**
 * Identifier for an endpoint
 */
export interface EndpointIdentifier {
  /** HTTP method */
  method: string;

  /** API path */
  path: string;

  /** Composite key (method:path) */
  key: string;

  /** Checksum of endpoint definition */
  checksum?: string;
}

/**
 * Strategy for regenerating tests
 */
export interface RegenerationStrategy {
  /** Endpoints to generate (new endpoints) */
  toGenerate: EndpointIdentifier[];

  /** Endpoints to regenerate (modified endpoints) */
  toRegenerate: EndpointIdentifier[];

  /** Endpoints to skip (unchanged) */
  toSkip: EndpointIdentifier[];

  /** Files to delete (removed endpoints) */
  toDelete: string[];

  /** Warnings to show to user */
  warnings: string[];

  /** Total operations count */
  totalOperations: number;

  /** Estimated time saved (in ms) */
  timeSaved: number;
}

/**
 * Options for incremental generation
 */
export interface IncrementalGenerationOptions {
  /** Force regenerate all tests regardless of changes */
  forceAll: boolean;

  /** Dry run mode - show what would change without making changes */
  dryRun: boolean;

  /** Skip confirmation prompts for deletions */
  skipConfirmation: boolean;

  /** Preserve manually modified tests */
  preserveManualChanges: boolean;

  /** Path to metadata cache file */
  metadataPath?: string;
}

/**
 * Result of incremental generation
 */
export interface IncrementalGenerationResult {
  /** Whether incremental mode was used */
  incrementalMode: boolean;

  /** Strategy that was applied */
  strategy: RegenerationStrategy;

  /** Number of tests that were regenerated */
  regeneratedTests: number;

  /** Number of tests that were skipped */
  skippedTests: number;

  /** Number of files deleted */
  deletedFiles: number;

  /** Time saved by using incremental mode (ms) */
  timeSaved: number;

  /** Files that were generated or modified */
  affectedFiles: string[];

  /** Updated metadata */
  metadata: GenerationMetadata;
}

/**
 * File modification info
 */
export interface FileModificationInfo {
  /** File path */
  path: string;

  /** Last modification time from filesystem */
  modifiedAt: Date;

  /** Modification time from metadata */
  recordedAt: Date;

  /** Whether file was modified since generation */
  wasModified: boolean;
}

/**
 * Checksum calculation options
 */
export interface ChecksumOptions {
  /** Include request schemas in checksum */
  includeRequest: boolean;

  /** Include response schemas in checksum */
  includeResponse: boolean;

  /** Include parameter definitions in checksum */
  includeParameters: boolean;

  /** Include security/auth definitions in checksum */
  includeSecurity: boolean;

  /** Include operation descriptions/summaries */
  includeDescriptions: boolean;
}
