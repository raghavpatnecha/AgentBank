/**
 * Entity Factory Pattern Implementation
 * Build complex objects with relationships, traits, and sequences
 */

import {
  EntityDefinition,
  EntityContext,
  DataBuilder,
  SequenceDefinition,
  EntityFactoryConfig,
  RelationType,
} from '../types/test-data-types.js';

/**
 * Entity Factory for creating test data with relationships
 */
export class EntityFactory<T = any> implements DataBuilder<T> {
  private definition: EntityDefinition<T>;
  private config: EntityFactoryConfig;
  private currentTraits: string[] = [];
  private relationshipData: Map<string, any> = new Map();
  private context: EntityContext;

  constructor(definition: EntityDefinition<T>, config: EntityFactoryConfig = {}) {
    this.definition = definition;
    this.config = {
      maxDepth: 5,
      cache: true,
      autoCreateRelationships: true,
      defaultLoading: 'lazy',
      validate: true,
      ...config,
    };
    this.context = this.initializeContext();
  }

  /**
   * Build a single entity without persisting
   */
  async build(overrides: Partial<T> = {}): Promise<T> {
    const ctx = { ...this.context, depth: (this.context.depth || 0) + 1 };

    // Check max depth
    if (ctx.depth > this.config.maxDepth!) {
      throw new Error(
        `Max build depth ${this.config.maxDepth} exceeded for entity ${this.definition.type}`
      );
    }

    // Check cache
    const cacheKey = this.getCacheKey(overrides);
    if (this.config.cache && ctx.cache?.has(cacheKey)) {
      return ctx.cache.get(cacheKey);
    }

    // Build base entity
    let entity = await this.buildBaseEntity(overrides, ctx);

    // Apply traits
    entity = await this.applyTraits(entity, ctx);

    // Build relationships
    entity = await this.buildRelationships(entity, ctx);

    // Run afterBuild hook
    if (this.definition.afterBuild) {
      entity = await this.definition.afterBuild(entity, ctx);
    }

    // Validate
    if (this.config.validate && this.definition.schema) {
      await this.validateEntity(entity);
    }

    // Cache result
    if (this.config.cache) {
      ctx.cache?.set(cacheKey, entity);
    }

    return entity;
  }

  /**
   * Build multiple entities
   */
  async buildMany(count: number, overrides: Partial<T> = {}): Promise<T[]> {
    const entities: T[] = [];
    for (let i = 0; i < count; i++) {
      const entity = await this.build(overrides);
      entities.push(entity);
    }
    return entities;
  }

  /**
   * Build and persist entity
   */
  async create(overrides: Partial<T> = {}): Promise<T> {
    let entity = await this.build(overrides);

    // Run beforePersist hook
    if (this.definition.beforePersist) {
      entity = await this.definition.beforePersist(entity, this.context);
    }

    // TODO: Integrate with actual persistence layer
    // This would be implemented by the TestDataManager
    return entity;
  }

  /**
   * Build and persist multiple entities
   */
  async createMany(count: number, overrides: Partial<T> = {}): Promise<T[]> {
    const entities: T[] = [];
    for (let i = 0; i < count; i++) {
      const entity = await this.create(overrides);
      entities.push(entity);
    }
    return entities;
  }

  /**
   * Apply a trait
   */
  trait(name: string): this {
    const trait = this.definition.traits?.[name];
    if (!trait) {
      throw new Error(`Trait '${name}' not found for entity ${this.definition.type}`);
    }
    this.currentTraits.push(name);
    return this;
  }

  /**
   * Apply multiple traits
   */
  traits(...names: string[]): this {
    names.forEach((name) => this.trait(name));
    return this;
  }

  /**
   * Set relationship data
   */
  with(relation: string, data: any): this {
    this.relationshipData.set(relation, data);
    return this;
  }

  /**
   * Reset factory state
   */
  reset(): this {
    this.currentTraits = [];
    this.relationshipData.clear();
    this.context = this.initializeContext();
    return this;
  }

  /**
   * Generate next sequence value
   */
  sequence(name: string): any {
    const seq = this.definition.sequences?.[name];
    if (!seq) {
      throw new Error(`Sequence '${name}' not found for entity ${this.definition.type}`);
    }

    const value = seq.generator(seq.current);
    seq.current += seq.step || 1;
    return value;
  }

  /**
   * Reset a sequence
   */
  resetSequence(name: string): void {
    const seq = this.definition.sequences?.[name];
    if (seq) {
      seq.current = seq.start || 0;
    }
  }

  /**
   * Initialize entity context
   */
  private initializeContext(): EntityContext {
    return {
      depth: 0,
      maxDepth: this.config.maxDepth,
      cache: this.config.cache ? new Map() : undefined,
      transactionId: this.generateTransactionId(),
      metadata: {},
    };
  }

  /**
   * Build base entity from factory function
   */
  private async buildBaseEntity(overrides: Partial<T>, ctx: EntityContext): Promise<T> {
    const defaults = this.definition.defaults || {};
    const baseData = { ...defaults, ...overrides };

    const entity = await this.definition.factory(baseData, ctx);
    return { ...entity, ...overrides };
  }

  /**
   * Apply all queued traits to entity
   */
  private async applyTraits(entity: T, _ctx: EntityContext): Promise<T> {
    let result = entity;

    for (const traitName of this.currentTraits) {
      const trait = this.definition.traits?.[traitName];
      if (!trait) continue;

      // Check trait dependencies
      if (trait.requires) {
        for (const required of trait.requires) {
          if (!this.currentTraits.includes(required)) {
            throw new Error(
              `Trait '${traitName}' requires trait '${required}' to be applied first`
            );
          }
        }
      }

      // Apply trait attributes
      const attributes =
        typeof trait.attributes === 'function' ? trait.attributes(result) : trait.attributes;

      result = { ...result, ...attributes };
    }

    return result;
  }

  /**
   * Build entity relationships
   */
  private async buildRelationships(entity: T, ctx: EntityContext): Promise<T> {
    if (!this.definition.relationships || !this.config.autoCreateRelationships) {
      return entity;
    }

    const result = { ...entity };

    for (const rel of this.definition.relationships) {
      // Skip if relationship data was explicitly provided
      if (this.relationshipData.has(rel.name)) {
        (result as any)[rel.name] = this.relationshipData.get(rel.name);
        continue;
      }

      // Skip lazy loading in build phase
      if (rel.cascade?.create === false || this.config.defaultLoading === 'lazy') {
        continue;
      }

      // Build relationship
      const relData = await this.buildRelationship(rel, entity, ctx);
      if (relData !== undefined) {
        (result as any)[rel.name] = relData;
      }
    }

    return result;
  }

  /**
   * Build a specific relationship
   */
  private async buildRelationship(rel: any, parent: T, ctx: EntityContext): Promise<any> {
    if (!rel.autoCreate) {
      return undefined;
    }

    // Get relationship factory
    const factory = typeof rel.factory === 'string' ? rel.factory : rel.factory?.(parent);

    if (!factory) {
      return undefined;
    }

    // Build based on relationship type
    switch (rel.type) {
      case RelationType.ONE_TO_ONE:
      case RelationType.BELONGS_TO:
      case RelationType.HAS_ONE:
        return await this.buildSingleRelation(factory, parent, ctx);

      case RelationType.ONE_TO_MANY:
      case RelationType.HAS_MANY:
        return await this.buildManyRelation(factory, parent, rel, ctx);

      case RelationType.MANY_TO_MANY:
        return await this.buildManyToManyRelation(factory, parent, rel, ctx);

      default:
        return undefined;
    }
  }

  /**
   * Build single relationship (one-to-one, belongs-to, has-one)
   */
  private async buildSingleRelation(_factory: any, _parent: T, _ctx: EntityContext): Promise<any> {
    // TODO: Get factory from registry and build
    return { id: this.generateId() };
  }

  /**
   * Build many relationship (one-to-many, has-many)
   */
  private async buildManyRelation(
    _factory: any,
    parent: T,
    rel: any,
    _ctx: EntityContext
  ): Promise<any[]> {
    const count = typeof rel.count === 'function' ? rel.count(parent) : rel.count || 3;

    const items: any[] = [];
    for (let i = 0; i < count; i++) {
      // TODO: Get factory from registry and build
      items.push({ id: this.generateId() });
    }
    return items;
  }

  /**
   * Build many-to-many relationship
   */
  private async buildManyToManyRelation(
    _factory: any,
    parent: T,
    rel: any,
    ctx: EntityContext
  ): Promise<any[]> {
    return this.buildManyRelation(_factory, parent, rel, ctx);
  }

  /**
   * Validate entity against schema
   */
  private async validateEntity(entity: T): Promise<void> {
    if (this.definition.schema?.parse) {
      // Zod schema
      this.definition.schema.parse(entity);
    } else if (this.definition.schema?.validate) {
      // Joi schema
      const result = this.definition.schema.validate(entity);
      if (result.error) {
        throw result.error;
      }
    } else if (typeof this.definition.schema === 'function') {
      // Custom validator
      const valid = await this.definition.schema(entity);
      if (!valid) {
        throw new Error(`Validation failed for entity ${this.definition.type}`);
      }
    }
  }

  /**
   * Generate cache key for entity
   */
  private getCacheKey(overrides: Partial<T>): string {
    return `${this.definition.type}:${JSON.stringify(overrides)}:${this.currentTraits.join(',')}`;
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory registry for managing multiple entity factories
 */
export class FactoryRegistry {
  private factories: Map<string, EntityFactory> = new Map();
  private definitions: Map<string, EntityDefinition> = new Map();
  private config: EntityFactoryConfig;

  constructor(config: EntityFactoryConfig = {}) {
    this.config = config;
  }

  /**
   * Register an entity definition
   */
  register<T>(definition: EntityDefinition<T>): void {
    this.definitions.set(definition.type, definition);
  }

  /**
   * Get factory for entity type
   */
  get<T>(type: string): EntityFactory<T> {
    if (!this.factories.has(type)) {
      const definition = this.definitions.get(type);
      if (!definition) {
        throw new Error(`Entity definition not found for type: ${type}`);
      }
      this.factories.set(type, new EntityFactory(definition, this.config));
    }
    return this.factories.get(type) as EntityFactory<T>;
  }

  /**
   * Check if factory exists
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Get all registered types
   */
  getTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Reset all factories
   */
  resetAll(): void {
    this.factories.forEach((factory) => factory.reset());
  }

  /**
   * Clear registry
   */
  clear(): void {
    this.factories.clear();
    this.definitions.clear();
  }
}

/**
 * Helper to define sequences
 */
export function sequence(
  generator: (n: number) => any,
  options: { start?: number; step?: number } = {}
): SequenceDefinition {
  return {
    current: options.start || 0,
    generator,
    start: options.start || 0,
    step: options.step || 1,
  };
}

/**
 * Common sequence generators
 */
export const sequences = {
  /**
   * Incrementing integer sequence
   */
  integer: (start = 1, step = 1) => sequence((n) => n, { start, step }),

  /**
   * Email sequence
   */
  email: (domain = 'example.com', prefix = 'user') => sequence((n) => `${prefix}${n}@${domain}`),

  /**
   * Username sequence
   */
  username: (prefix = 'user') => sequence((n) => `${prefix}${n}`),

  /**
   * UUID sequence (simple incrementing)
   */
  uuid: () => sequence((n) => `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`),

  /**
   * Date sequence
   */
  date: (startDate = new Date(), increment = 86400000) =>
    sequence((n) => new Date(startDate.getTime() + n * increment)),
};
