/**
 * Test Data Management Type Definitions
 * Comprehensive types for fixture loading, entity factories, and data seeding
 */

/**
 * Fixture definition supporting multiple formats and composition
 */
export interface Fixture<T = any> {
  /** Unique identifier for the fixture */
  id: string;

  /** Fixture type/entity name (e.g., 'user', 'order', 'product') */
  type: string;

  /** The actual data for the fixture */
  data: T;

  /** Optional parent fixture to inherit from */
  extends?: string;

  /** Template variables to interpolate */
  vars?: Record<string, any>;

  /** Relationships to other fixtures */
  relationships?: DataRelationship[];

  /** Traits/states for variations */
  traits?: string[];

  /** Metadata for the fixture */
  metadata?: {
    description?: string;
    tags?: string[];
    createdAt?: Date;
    version?: string;
  };
}

/**
 * Entity definition for factory pattern
 */
export interface EntityDefinition<T = any> {
  /** Entity type name */
  type: string;

  /** Factory function to build the entity */
  factory: (overrides?: Partial<T>, context?: EntityContext) => T | Promise<T>;

  /** Default values */
  defaults?: Partial<T>;

  /** Available traits/states */
  traits?: Record<string, TraitDefinition<T>>;

  /** Relationships to other entities */
  relationships?: EntityRelationship[];

  /** Sequences for generating unique values */
  sequences?: Record<string, SequenceDefinition>;

  /** Validation schema */
  schema?: any; // Could be Zod, Joi, or custom validator

  /** Post-build hooks */
  afterBuild?: (entity: T, context?: EntityContext) => T | Promise<T>;

  /** Pre-persist hooks */
  beforePersist?: (entity: T, context?: EntityContext) => T | Promise<T>;
}

/**
 * Trait definition for entity variations
 */
export interface TraitDefinition<T = any> {
  /** Trait name */
  name: string;

  /** Trait modifications */
  attributes: Partial<T> | ((entity: T) => Partial<T>);

  /** Additional traits this trait depends on */
  requires?: string[];
}

/**
 * Sequence definition for unique value generation
 */
export interface SequenceDefinition {
  /** Current sequence value */
  current: number;

  /** Generator function */
  generator: (n: number) => any;

  /** Reset value */
  start?: number;

  /** Step increment */
  step?: number;
}

/**
 * Entity build context
 */
export interface EntityContext {
  /** Parent entity being built */
  parent?: any;

  /** Traits being applied */
  traits?: string[];

  /** Build depth for circular reference detection */
  depth?: number;

  /** Maximum build depth */
  maxDepth?: number;

  /** Cache for built entities */
  cache?: Map<string, any>;

  /** Transaction ID for cleanup */
  transactionId?: string;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Relationship between data entities
 */
export interface DataRelationship {
  /** Relationship type */
  type: RelationType;

  /** Target entity type */
  target: string;

  /** Target fixture ID(s) */
  targetId?: string | string[];

  /** Foreign key field name */
  foreignKey?: string;

  /** Relationship field name */
  field: string;

  /** Cascade options */
  cascade?: CascadeOptions;

  /** Loading strategy */
  loading?: 'eager' | 'lazy';

  /** Whether relationship is required */
  required?: boolean;
}

/**
 * Entity relationship definition
 */
export interface EntityRelationship {
  /** Relationship name */
  name: string;

  /** Relationship type */
  type: RelationType;

  /** Target entity type */
  target: string;

  /** Foreign key field */
  foreignKey?: string;

  /** Whether to auto-create related entities */
  autoCreate?: boolean;

  /** Factory for creating related entities */
  factory?: string | ((parent: any) => any);

  /** Count for has-many relationships */
  count?: number | ((parent: any) => number);

  /** Cascade options */
  cascade?: CascadeOptions;
}

/**
 * Relationship types
 */
export enum RelationType {
  ONE_TO_ONE = 'oneToOne',
  ONE_TO_MANY = 'oneToMany',
  MANY_TO_ONE = 'manyToOne',
  MANY_TO_MANY = 'manyToMany',
  BELONGS_TO = 'belongsTo',
  HAS_ONE = 'hasOne',
  HAS_MANY = 'hasMany',
}

/**
 * Cascade options for relationships
 */
export interface CascadeOptions {
  /** Cascade on create */
  create?: boolean;

  /** Cascade on update */
  update?: boolean;

  /** Cascade on delete */
  delete?: boolean;

  /** Cascade on all operations */
  all?: boolean;
}

/**
 * Seed configuration
 */
export interface SeedConfig {
  /** Database connection configuration */
  connection?: DatabaseConnection;

  /** Seed files or directories */
  sources?: string[];

  /** Seed execution order */
  order?: string[];

  /** Whether seeding is idempotent */
  idempotent?: boolean;

  /** Seed version/migration number */
  version?: string;

  /** Cleanup strategy before seeding */
  cleanupStrategy?: CleanupStrategy;

  /** Whether to run in transaction */
  transaction?: boolean;

  /** Batch size for bulk operations */
  batchSize?: number;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Custom seed handlers */
  handlers?: Record<string, SeedHandler>;

  /** Environment-specific seeds */
  environment?: string;

  /** Validation before seeding */
  validate?: boolean;
}

/**
 * Database connection configuration
 */
export interface DatabaseConnection {
  /** Database type */
  type: DatabaseType;

  /** Connection string or config object */
  connection: string | Record<string, any>;

  /** Database name */
  database?: string;

  /** Additional options */
  options?: Record<string, any>;
}

/**
 * Supported database types
 */
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  DYNAMODB = 'dynamodb',
  IN_MEMORY = 'in-memory',
}

/**
 * Cleanup strategies
 */
export enum CleanupStrategy {
  /** Drop and recreate tables */
  DROP = 'drop',

  /** Truncate tables */
  TRUNCATE = 'truncate',

  /** Delete all records */
  DELETE = 'delete',

  /** Restore from snapshot */
  SNAPSHOT = 'snapshot',

  /** No cleanup */
  NONE = 'none',
}

/**
 * Seed handler function
 */
export type SeedHandler = (
  data: any,
  context: SeedContext
) => Promise<void> | void;

/**
 * Seed execution context
 */
export interface SeedContext {
  /** Database connection */
  connection?: any;

  /** Transaction (if enabled) */
  transaction?: any;

  /** Seed version */
  version?: string;

  /** Environment */
  environment?: string;

  /** Execution metadata */
  metadata?: Record<string, any>;
}

/**
 * Data snapshot for backup/restore
 */
export interface DataSnapshot {
  /** Snapshot ID */
  id: string;

  /** Snapshot timestamp */
  timestamp: Date;

  /** Snapshot type */
  type: SnapshotType;

  /** Snapshot data */
  data: SnapshotData;

  /** Snapshot metadata */
  metadata?: {
    description?: string;
    tags?: string[];
    version?: string;
    environment?: string;
  };
}

/**
 * Snapshot types
 */
export enum SnapshotType {
  /** Full database snapshot */
  FULL = 'full',

  /** Incremental snapshot */
  INCREMENTAL = 'incremental',

  /** Schema only */
  SCHEMA = 'schema',

  /** Data only */
  DATA = 'data',

  /** Custom snapshot */
  CUSTOM = 'custom',
}

/**
 * Snapshot data structure
 */
export interface SnapshotData {
  /** Database schema */
  schema?: any;

  /** Table data */
  tables?: Record<string, any[]>;

  /** Collections (for NoSQL) */
  collections?: Record<string, any[]>;

  /** Binary data */
  binary?: Buffer;

  /** File references */
  files?: string[];

  /** Custom data */
  custom?: any;
}

/**
 * Fixture loader configuration
 */
export interface FixtureLoaderConfig {
  /** Base directory for fixtures */
  baseDir?: string;

  /** Supported file formats */
  formats?: FixtureFormat[];

  /** Template engine */
  templateEngine?: 'handlebars' | 'mustache' | 'ejs' | 'none';

  /** Template variables */
  vars?: Record<string, any>;

  /** Whether to validate fixtures */
  validate?: boolean;

  /** Fixture composition strategy */
  compositionStrategy?: 'merge' | 'override' | 'extend';

  /** Cache fixtures */
  cache?: boolean;
}

/**
 * Supported fixture formats
 */
export enum FixtureFormat {
  JSON = 'json',
  YAML = 'yaml',
  YML = 'yml',
  JS = 'js',
  TS = 'ts',
  CSV = 'csv',
}

/**
 * Entity factory configuration
 */
export interface EntityFactoryConfig {
  /** Default max build depth */
  maxDepth?: number;

  /** Whether to cache built entities */
  cache?: boolean;

  /** Whether to auto-create relationships */
  autoCreateRelationships?: boolean;

  /** Default loading strategy */
  defaultLoading?: 'eager' | 'lazy';

  /** Whether to validate entities */
  validate?: boolean;

  /** Custom validators */
  validators?: Record<string, (entity: any) => boolean | Promise<boolean>>;
}

/**
 * Test data manager configuration
 */
export interface TestDataManagerConfig {
  /** Fixture loader config */
  fixtures?: FixtureLoaderConfig;

  /** Entity factory config */
  entities?: EntityFactoryConfig;

  /** Seed config */
  seed?: SeedConfig;

  /** Cleanup strategy after tests */
  cleanupAfterTests?: CleanupStrategy;

  /** Whether to use transactions */
  useTransactions?: boolean;

  /** Snapshot configuration */
  snapshots?: {
    enabled?: boolean;
    directory?: string;
    autoCreate?: boolean;
  };
}

/**
 * Data builder interface
 */
export interface DataBuilder<T = any> {
  /** Build a single entity */
  build(overrides?: Partial<T>): Promise<T>;

  /** Build multiple entities */
  buildMany(count: number, overrides?: Partial<T>): Promise<T[]>;

  /** Build and persist entity */
  create(overrides?: Partial<T>): Promise<T>;

  /** Build and persist multiple entities */
  createMany(count: number, overrides?: Partial<T>): Promise<T[]>;

  /** Apply trait */
  trait(name: string): DataBuilder<T>;

  /** Apply multiple traits */
  traits(...names: string[]): DataBuilder<T>;

  /** Set relationship */
  with(relation: string, data: any): DataBuilder<T>;
}

/**
 * Data cleanup result
 */
export interface CleanupResult {
  /** Whether cleanup was successful */
  success: boolean;

  /** Number of records deleted */
  deletedCount?: number;

  /** Tables/collections cleaned */
  cleaned?: string[];

  /** Errors encountered */
  errors?: Error[];

  /** Cleanup duration in ms */
  duration?: number;
}

/**
 * Seed execution result
 */
export interface SeedResult {
  /** Whether seeding was successful */
  success: boolean;

  /** Number of records inserted */
  insertedCount?: number;

  /** Tables/collections seeded */
  seeded?: string[];

  /** Errors encountered */
  errors?: Error[];

  /** Seed duration in ms */
  duration?: number;

  /** Seed version */
  version?: string;
}

/**
 * Fixture load result
 */
export interface FixtureLoadResult<T = any> {
  /** Loaded fixtures */
  fixtures: Fixture<T>[];

  /** Number of fixtures loaded */
  count: number;

  /** Fixture types */
  types: string[];

  /** Load errors */
  errors?: Error[];

  /** Load duration in ms */
  duration?: number;
}
