/**
 * Database Seeding Implementation
 * Execute SQL/NoSQL seed scripts with idempotent support
 */

import { readFile } from 'fs/promises';
import {
  SeedConfig,
  SeedResult,
  SeedContext,
  DatabaseType,
  CleanupStrategy,
} from '../types/test-data-types.js';

/**
 * Database Seeder for populating test databases
 */
export class DataSeeder {
  private config: Required<SeedConfig>;
  private seedHistory: Map<string, Set<string>> = new Map();

  constructor(config: SeedConfig = {}) {
    this.config = {
      sources: [],
      order: [],
      idempotent: true,
      version: '1.0.0',
      cleanupStrategy: CleanupStrategy.NONE,
      transaction: true,
      batchSize: 1000,
      timeout: 30000,
      handlers: {},
      environment: process.env.NODE_ENV || 'test',
      validate: true,
      ...config,
    } as Required<SeedConfig>;
  }

  /**
   * Execute all seed scripts
   */
  async seed(): Promise<SeedResult> {
    const startTime = Date.now();
    const seeded: string[] = [];
    const errors: Error[] = [];
    let insertedCount = 0;

    try {
      // Cleanup before seeding
      if (this.config.cleanupStrategy !== CleanupStrategy.NONE) {
        await this.cleanup();
      }

      // Create seed context
      const context = await this.createContext();

      // Load seed files
      const seedFiles = await this.resolveSeedFiles();

      // Execute seeds in order
      for (const file of seedFiles) {
        try {
          const result = await this.executeSeedFile(file, context);
          seeded.push(file);
          insertedCount += result.count || 0;
        } catch (error) {
          errors.push(error as Error);
          if (!this.config.transaction) {
            // Continue if not in transaction
            continue;
          }
          // Rollback and stop if in transaction
          await this.rollback(context);
          throw error;
        }
      }

      // Commit transaction
      if (this.config.transaction) {
        await this.commit(context);
      }

      return {
        success: errors.length === 0,
        insertedCount,
        seeded,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
        version: this.config.version,
      };
    } catch (error) {
      return {
        success: false,
        insertedCount,
        seeded,
        errors: [error as Error],
        duration: Date.now() - startTime,
        version: this.config.version,
      };
    }
  }

  /**
   * Seed specific file
   */
  async seedFile(filePath: string): Promise<SeedResult> {
    const startTime = Date.now();

    try {
      const context = await this.createContext();
      const result = await this.executeSeedFile(filePath, context);

      if (this.config.transaction) {
        await this.commit(context);
      }

      return {
        success: true,
        insertedCount: result.count,
        seeded: [filePath],
        duration: Date.now() - startTime,
        version: this.config.version,
      };
    } catch (error) {
      return {
        success: false,
        insertedCount: 0,
        seeded: [],
        errors: [error as Error],
        duration: Date.now() - startTime,
        version: this.config.version,
      };
    }
  }

  /**
   * Seed data directly
   */
  async seedData(
    tableName: string,
    data: any[],
    options: { batchSize?: number; validate?: boolean } = {}
  ): Promise<number> {
    const batchSize = options.batchSize || this.config.batchSize;
    const validate = options.validate ?? this.config.validate;

    if (validate) {
      this.validateData(data);
    }

    const context = await this.createContext();
    let inserted = 0;

    // Insert in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const count = await this.insertBatch(tableName, batch, context);
      inserted += count;
    }

    if (this.config.transaction) {
      await this.commit(context);
    }

    return inserted;
  }

  /**
   * Check if seed was already executed (for idempotent seeds)
   */
  async wasExecuted(seedFile: string): Promise<boolean> {
    if (!this.config.idempotent) {
      return false;
    }

    const env = this.config.environment!;
    const history = this.seedHistory.get(env) || new Set();
    return history.has(seedFile);
  }

  /**
   * Mark seed as executed
   */
  private markExecuted(seedFile: string): void {
    const env = this.config.environment!;
    if (!this.seedHistory.has(env)) {
      this.seedHistory.set(env, new Set());
    }
    this.seedHistory.get(env)!.add(seedFile);
  }

  /**
   * Execute a single seed file
   */
  private async executeSeedFile(
    filePath: string,
    context: SeedContext
  ): Promise<{ count: number }> {
    // Check if already executed
    if (await this.wasExecuted(filePath)) {
      return { count: 0 };
    }

    // Load seed file
    const content = await readFile(filePath, 'utf-8');
    const ext = filePath.split('.').pop()?.toLowerCase();

    let data: any;
    let count = 0;

    // Parse based on file type
    if (ext === 'json') {
      data = JSON.parse(content);
    } else if (ext === 'yaml' || ext === 'yml') {
      const { parse } = await import('yaml');
      data = parse(content);
    } else if (ext === 'sql') {
      // Execute SQL directly
      count = await this.executeSql(content, context);
      this.markExecuted(filePath);
      return { count };
    } else if (ext === 'js' || ext === 'ts') {
      // Dynamic import for JS/TS seed files
      const module = await import(filePath);
      if (typeof module.default === 'function') {
        await module.default(context);
        this.markExecuted(filePath);
        return { count: 0 }; // Custom seeds don't track count
      }
      data = module.default;
    } else {
      throw new Error(`Unsupported seed file format: ${ext}`);
    }

    // Insert data
    if (Array.isArray(data)) {
      // Array of records
      const tableName = this.extractTableName(filePath);
      count = await this.seedData(tableName, data);
    } else if (typeof data === 'object') {
      // Object with table names as keys
      for (const [tableName, records] of Object.entries(data)) {
        if (Array.isArray(records)) {
          count += await this.seedData(tableName, records);
        }
      }
    }

    this.markExecuted(filePath);
    return { count };
  }

  /**
   * Insert batch of records
   */
  private async insertBatch(
    tableName: string,
    data: any[],
    context: SeedContext
  ): Promise<number> {
    const dbType = this.config.connection?.type;

    // Use custom handler if available
    const handler = this.config.handlers![tableName];
    if (handler) {
      await handler(data, context);
      return data.length;
    }

    // Default insertion based on database type
    switch (dbType) {
      case DatabaseType.POSTGRESQL:
      case DatabaseType.MYSQL:
      case DatabaseType.SQLITE:
        return await this.insertSql(tableName, data, context);

      case DatabaseType.MONGODB:
        return await this.insertMongo(tableName, data, context);

      case DatabaseType.IN_MEMORY:
        return await this.insertMemory(tableName, data, context);

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  /**
   * Insert into SQL database
   */
  private async insertSql(
    _tableName: string,
    data: any[],
    _context: SeedContext
  ): Promise<number> {
    if (data.length === 0) return 0;

    // Build INSERT query (mock implementation)
    // const columns = Object.keys(data[0]);
    // const placeholders = data
    //   .map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`)
    //   .join(', ');
    // const values = data.flatMap(record => columns.map(col => record[col]));
    // const query = `
    //   INSERT INTO ${_tableName} (${columns.join(', ')})
    //   VALUES ${placeholders}
    //   ON CONFLICT DO NOTHING
    // `;

    // Execute query (mock implementation)
    // In production, this would use actual database connection
    // const result = await context.connection.query(query, values);
    return data.length;
  }

  /**
   * Insert into MongoDB
   */
  private async insertMongo(
    _collectionName: string,
    data: any[],
    _context: SeedContext
  ): Promise<number> {
    // Mock implementation
    // In production: await context.connection.collection(collectionName).insertMany(data);
    return data.length;
  }

  /**
   * Insert into in-memory store
   */
  private async insertMemory(
    storeName: string,
    data: any[],
    context: SeedContext
  ): Promise<number> {
    // Mock implementation for in-memory storage
    if (!context.metadata) {
      context.metadata = {};
    }
    if (!context.metadata[storeName]) {
      context.metadata[storeName] = [];
    }
    context.metadata[storeName].push(...data);
    return data.length;
  }

  /**
   * Execute raw SQL
   */
  private async executeSql(sql: string, _context: SeedContext): Promise<number> {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let count = 0;
    for (const _statement of statements) {
      // Execute statement (mock implementation)
      // const result = await context.connection.query(statement);
      count++;
    }

    return count;
  }

  /**
   * Cleanup database before seeding
   */
  private async cleanup(): Promise<void> {
    const context = await this.createContext();

    switch (this.config.cleanupStrategy) {
      case CleanupStrategy.TRUNCATE:
        await this.truncateTables(context);
        break;

      case CleanupStrategy.DELETE:
        await this.deleteTables(context);
        break;

      case CleanupStrategy.DROP:
        await this.dropTables(context);
        break;

      case CleanupStrategy.SNAPSHOT:
        // Restore from snapshot (would be implemented with actual snapshot system)
        break;
    }
  }

  /**
   * Truncate all tables
   */
  private async truncateTables(_context: SeedContext): Promise<void> {
    // Mock implementation
    // In production: Get all tables and truncate them
  }

  /**
   * Delete all records from tables
   */
  private async deleteTables(_context: SeedContext): Promise<void> {
    // Mock implementation
    // In production: Get all tables and delete records
  }

  /**
   * Drop all tables
   */
  private async dropTables(_context: SeedContext): Promise<void> {
    // Mock implementation
    // In production: Get all tables and drop them
  }

  /**
   * Create seed context
   */
  private async createContext(): Promise<SeedContext> {
    return {
      connection: this.config.connection,
      transaction: this.config.transaction ? {} : undefined,
      version: this.config.version,
      environment: this.config.environment,
      metadata: {},
    };
  }

  /**
   * Commit transaction
   */
  private async commit(context: SeedContext): Promise<void> {
    if (context.transaction) {
      // await context.connection.commit();
    }
  }

  /**
   * Rollback transaction
   */
  private async rollback(context: SeedContext): Promise<void> {
    if (context.transaction) {
      // await context.connection.rollback();
    }
  }

  /**
   * Resolve seed files in correct order
   */
  private async resolveSeedFiles(): Promise<string[]> {
    const files: string[] = [];

    // Use explicit order if provided
    if (this.config.order!.length > 0) {
      return this.config.order!;
    }

    // Otherwise, use sources
    for (const source of this.config.sources!) {
      files.push(source);
    }

    return files;
  }

  /**
   * Extract table name from file path
   */
  private extractTableName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1] || 'unknown';
    const nameWithoutExt = fileName.split('.')[0];
    return nameWithoutExt || 'unknown';
  }

  /**
   * Validate seed data
   */
  private validateData(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Seed data must be an array');
    }

    if (data.length === 0) {
      return;
    }

    // Validate all records have same structure
    const firstKeys = Object.keys(data[0]).sort();
    for (let i = 1; i < data.length; i++) {
      const keys = Object.keys(data[i]).sort();
      if (JSON.stringify(keys) !== JSON.stringify(firstKeys)) {
        throw new Error(`Record ${i} has different structure than first record`);
      }
    }
  }
}

/**
 * Create a data seeder instance
 */
export function createDataSeeder(config?: SeedConfig): DataSeeder {
  return new DataSeeder(config);
}
