/**
 * Test Data Manager
 * Main orchestrator for fixtures, factories, and seeding
 */

import { FixtureLoader } from './fixture-loader.js';
import { FactoryRegistry, EntityFactory } from './entity-factory.js';
import { DataSeeder } from './data-seeder.js';
import {
  TestDataManagerConfig,
  CleanupStrategy,
  CleanupResult,
  DataSnapshot,
  SnapshotType,
  SnapshotData,
  Fixture,
  EntityDefinition,
} from '../types/test-data-types.js';

/**
 * Test Data Manager - Central hub for test data operations
 */
export class TestDataManager {
  private config: TestDataManagerConfig;
  private fixtureLoader: FixtureLoader;
  private factoryRegistry: FactoryRegistry;
  private seeder: DataSeeder;
  private snapshots: Map<string, DataSnapshot> = new Map();
  private createdEntities: Map<string, any[]> = new Map();
  private transactionStack: string[] = [];

  constructor(config: TestDataManagerConfig = {}) {
    this.config = {
      cleanupAfterTests: CleanupStrategy.DELETE,
      useTransactions: true,
      snapshots: {
        enabled: true,
        directory: './test-snapshots',
        autoCreate: false,
      },
      ...config,
    };

    this.fixtureLoader = new FixtureLoader(config.fixtures);
    this.factoryRegistry = new FactoryRegistry(config.entities);
    this.seeder = new DataSeeder(config.seed);
  }

  /**
   * Register an entity factory
   */
  registerFactory<T>(definition: EntityDefinition<T>): void {
    this.factoryRegistry.register(definition);
  }

  /**
   * Get factory for entity type
   */
  factory<T>(type: string): EntityFactory<T> {
    return this.factoryRegistry.get<T>(type);
  }

  /**
   * Build entity without persisting
   */
  async build<T = any>(type: string, overrides: Partial<T> = {}): Promise<T> {
    const factory = this.factoryRegistry.get<T>(type);
    return factory.build(overrides as any) as Promise<T>;
  }

  /**
   * Build and persist entity
   */
  async create<T = any>(type: string, overrides: Partial<T> = {}): Promise<T> {
    const factory = this.factoryRegistry.get<T>(type);
    const entity = await factory.create(overrides as any) as T;

    // Track created entity for cleanup
    this.trackEntity(type, entity);

    return entity;
  }

  /**
   * Build multiple entities
   */
  async buildMany<T = any>(
    type: string,
    count: number,
    overrides: Partial<T> = {}
  ): Promise<T[]> {
    const factory = this.factoryRegistry.get<T>(type);
    return factory.buildMany(count, overrides as any) as Promise<T[]>;
  }

  /**
   * Create multiple entities
   */
  async createMany<T = any>(
    type: string,
    count: number,
    overrides: Partial<T> = {}
  ): Promise<T[]> {
    const factory = this.factoryRegistry.get<T>(type);
    const entities = await factory.createMany(count, overrides as any) as T[];

    // Track created entities
    entities.forEach(entity => this.trackEntity(type, entity));

    return entities;
  }

  /**
   * Load fixtures from file
   */
  async loadFixtures<T = any>(filePath: string): Promise<Fixture<T>[]> {
    const result = await this.fixtureLoader.loadFile<T>(filePath);
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Failed to load fixtures: ${result.errors.map(e => e.message).join(', ')}`
      );
    }
    return result.fixtures;
  }

  /**
   * Load fixtures from directory
   */
  async loadFixturesDirectory<T = any>(dirPath: string): Promise<Fixture<T>[]> {
    const result = await this.fixtureLoader.loadDirectory<T>(dirPath);
    return result.fixtures;
  }

  /**
   * Load and create entities from fixtures
   */
  async seedFixtures<T = any>(
    filePath: string,
    options: { persist?: boolean } = {}
  ): Promise<T[]> {
    const fixtures = await this.loadFixtures<T>(filePath);
    const entities: T[] = [];

    for (const fixture of fixtures) {
      if (options.persist) {
        const entity = await this.create<T>(fixture.type, fixture.data as Partial<T>);
        entities.push(entity);
      } else {
        const entity = await this.build<T>(fixture.type, fixture.data as Partial<T>);
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Seed database with data
   */
  async seed(sources?: string[]): Promise<void> {
    if (sources) {
      // Update seeder config with new sources
      this.seeder = new DataSeeder({
        ...this.config.seed,
        sources,
      });
    }

    const result = await this.seeder.seed();
    if (!result.success) {
      throw new Error(
        `Seeding failed: ${result.errors?.map(e => e.message).join(', ')}`
      );
    }
  }

  /**
   * Create a data snapshot
   */
  async createSnapshot(
    id: string,
    options: {
      type?: SnapshotType;
      description?: string;
      tags?: string[];
    } = {}
  ): Promise<DataSnapshot> {
    const snapshot: DataSnapshot = {
      id,
      timestamp: new Date(),
      type: options.type || SnapshotType.FULL,
      data: await this.captureSnapshotData(options.type),
      metadata: {
        description: options.description,
        tags: options.tags,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'test',
      },
    };

    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(id: string): Promise<void> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${id}`);
    }

    // Clear current data
    await this.cleanup();

    // Restore snapshot data
    await this.restoreSnapshotData(snapshot.data);
  }

  /**
   * List all snapshots
   */
  listSnapshots(): DataSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<string> {
    const txId = this.generateTransactionId();
    this.transactionStack.push(txId);

    if (this.config.snapshots?.autoCreate) {
      await this.createSnapshot(`tx_${txId}`);
    }

    return txId;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(): Promise<void> {
    const txId = this.transactionStack.pop();
    if (!txId) {
      throw new Error('No active transaction');
    }

    // Remove auto-created snapshot
    if (this.config.snapshots?.autoCreate) {
      this.deleteSnapshot(`tx_${txId}`);
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(): Promise<void> {
    const txId = this.transactionStack.pop();
    if (!txId) {
      throw new Error('No active transaction');
    }

    // Restore from auto-created snapshot
    if (this.config.snapshots?.autoCreate) {
      await this.restoreSnapshot(`tx_${txId}`);
      this.deleteSnapshot(`tx_${txId}`);
    } else {
      // Manual cleanup of entities created in this transaction
      await this.cleanupTransaction(txId);
    }
  }

  /**
   * Cleanup all test data
   */
  async cleanup(strategy?: CleanupStrategy): Promise<CleanupResult> {
    const startTime = Date.now();
    const cleanupStrategy = strategy || this.config.cleanupAfterTests!;

    try {
      let deletedCount = 0;
      const cleaned: string[] = [];

      switch (cleanupStrategy) {
        case CleanupStrategy.TRUNCATE:
        case CleanupStrategy.DELETE:
          // Delete tracked entities
          for (const [type, entities] of this.createdEntities.entries()) {
            deletedCount += entities.length;
            cleaned.push(type);
          }
          this.createdEntities.clear();
          break;

        case CleanupStrategy.SNAPSHOT:
          // Restore from initial snapshot
          if (this.snapshots.has('initial')) {
            await this.restoreSnapshot('initial');
          }
          break;

        case CleanupStrategy.DROP:
          // Drop all data
          this.createdEntities.clear();
          break;

        case CleanupStrategy.NONE:
          // No cleanup
          break;
      }

      // Reset factories
      this.factoryRegistry.resetAll();

      // Clear fixture cache
      this.fixtureLoader.clearCache();

      return {
        success: true,
        deletedCount,
        cleaned,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error as Error],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Track created entity for cleanup
   */
  private trackEntity(type: string, entity: any): void {
    if (!this.createdEntities.has(type)) {
      this.createdEntities.set(type, []);
    }
    this.createdEntities.get(type)!.push(entity);
  }

  /**
   * Cleanup entities from a specific transaction
   */
  private async cleanupTransaction(txId: string): Promise<void> {
    // Filter entities created in this transaction
    for (const [type, entities] of this.createdEntities.entries()) {
      const filtered = entities.filter(
        (e: any) => e.transactionId !== txId
      );
      this.createdEntities.set(type, filtered);
    }
  }

  /**
   * Capture snapshot data
   */
  private async captureSnapshotData(
    _type: SnapshotType = SnapshotType.FULL
  ): Promise<SnapshotData> {
    const data: SnapshotData = {
      tables: {},
    };

    // Capture all created entities
    for (const [entityType, entities] of this.createdEntities.entries()) {
      data.tables![entityType] = [...entities];
    }

    return data;
  }

  /**
   * Restore snapshot data
   */
  private async restoreSnapshotData(data: SnapshotData): Promise<void> {
    if (data.tables) {
      for (const [type, entities] of Object.entries(data.tables)) {
        this.createdEntities.set(type, [...entities]);
      }
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics about created entities
   */
  getStats(): {
    entityTypes: number;
    totalEntities: number;
    byType: Record<string, number>;
    snapshots: number;
    activeTransactions: number;
  } {
    const byType: Record<string, number> = {};
    let totalEntities = 0;

    for (const [type, entities] of this.createdEntities.entries()) {
      byType[type] = entities.length;
      totalEntities += entities.length;
    }

    return {
      entityTypes: this.createdEntities.size,
      totalEntities,
      byType,
      snapshots: this.snapshots.size,
      activeTransactions: this.transactionStack.length,
    };
  }
}

/**
 * Create a test data manager instance
 */
export function createTestDataManager(
  config?: TestDataManagerConfig
): TestDataManager {
  return new TestDataManager(config);
}

/**
 * Global test data manager instance
 */
let globalManager: TestDataManager | null = null;

/**
 * Get or create global test data manager
 */
export function getTestDataManager(
  config?: TestDataManagerConfig
): TestDataManager {
  if (!globalManager) {
    globalManager = new TestDataManager(config);
  }
  return globalManager;
}

/**
 * Reset global test data manager
 */
export function resetTestDataManager(): void {
  globalManager = null;
}
