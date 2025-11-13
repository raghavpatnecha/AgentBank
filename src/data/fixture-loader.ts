/**
 * Fixture Loader Implementation
 * Load fixtures from files with composition and templating support
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { parse as parseYaml } from 'yaml';
import {
  Fixture,
  FixtureLoaderConfig,
  FixtureFormat,
  FixtureLoadResult,
} from '../types/test-data-types.js';

/**
 * Fixture Loader for loading test data from files
 */
export class FixtureLoader {
  private config: Required<FixtureLoaderConfig>;
  private fixtureCache: Map<string, Fixture[]> = new Map();

  constructor(config: FixtureLoaderConfig = {}) {
    this.config = {
      baseDir: process.cwd(),
      formats: [
        FixtureFormat.JSON,
        FixtureFormat.YAML,
        FixtureFormat.YML,
        FixtureFormat.JS,
        FixtureFormat.TS,
      ],
      templateEngine: 'none',
      vars: {},
      validate: true,
      compositionStrategy: 'merge',
      cache: true,
      ...config,
    };
  }

  /**
   * Load fixtures from a file
   */
  async loadFile<T = any>(filePath: string): Promise<FixtureLoadResult<T>> {
    const startTime = Date.now();
    const absolutePath = this.resolveFilePath(filePath);

    // Check cache
    if (this.config.cache && this.fixtureCache.has(absolutePath)) {
      const fixtures = this.fixtureCache.get(absolutePath) as Fixture<T>[];
      return {
        fixtures,
        count: fixtures.length,
        types: [...new Set(fixtures.map(f => f.type))],
        duration: Date.now() - startTime,
      };
    }

    try {
      const content = await readFile(absolutePath, 'utf-8');
      const format = this.detectFormat(absolutePath);
      const rawData = await this.parseContent(content, format);

      const fixtures = await this.processFixtures<T>(rawData, absolutePath);

      // Cache fixtures
      if (this.config.cache) {
        this.fixtureCache.set(absolutePath, fixtures);
      }

      return {
        fixtures,
        count: fixtures.length,
        types: [...new Set(fixtures.map(f => f.type))],
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        fixtures: [],
        count: 0,
        types: [],
        errors: [error as Error],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Load fixtures from a directory
   */
  async loadDirectory<T = any>(dirPath: string): Promise<FixtureLoadResult<T>> {
    const startTime = Date.now();
    const absolutePath = this.resolveFilePath(dirPath);

    try {
      const files = await this.findFixtureFiles(absolutePath);
      const allFixtures: Fixture<T>[] = [];
      const errors: Error[] = [];

      for (const file of files) {
        const result = await this.loadFile<T>(file);
        allFixtures.push(...result.fixtures);
        if (result.errors) {
          errors.push(...result.errors);
        }
      }

      return {
        fixtures: allFixtures,
        count: allFixtures.length,
        types: [...new Set(allFixtures.map(f => f.type))],
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        fixtures: [],
        count: 0,
        types: [],
        errors: [error as Error],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Load fixtures by type
   */
  async loadByType<T = any>(type: string, dirPath?: string): Promise<Fixture<T>[]> {
    const path = dirPath || this.config.baseDir;
    const result = await this.loadDirectory<T>(path);
    return result.fixtures.filter(f => f.type === type);
  }

  /**
   * Get fixture by ID
   */
  async getFixture<T = any>(
    id: string,
    dirPath?: string
  ): Promise<Fixture<T> | undefined> {
    const path = dirPath || this.config.baseDir;
    const result = await this.loadDirectory<T>(path);
    return result.fixtures.find(f => f.id === id);
  }

  /**
   * Clear fixture cache
   */
  clearCache(): void {
    this.fixtureCache.clear();
  }

  /**
   * Process raw fixture data
   */
  private async processFixtures<T>(
    rawData: any,
    sourcePath: string
  ): Promise<Fixture<T>[]> {
    const fixtures: Fixture<T>[] = [];

    // Handle array of fixtures
    if (Array.isArray(rawData)) {
      for (const item of rawData) {
        const fixture = await this.processFixture<T>(item, sourcePath);
        if (fixture) {
          fixtures.push(fixture);
        }
      }
    }
    // Handle object with named fixtures
    else if (typeof rawData === 'object' && rawData !== null) {
      for (const [key, value] of Object.entries(rawData)) {
        const fixtureData = typeof value === 'object' && value !== null
          ? { id: key, ...value as object }
          : { id: key, data: value };
        const fixture = await this.processFixture<T>(
          fixtureData,
          sourcePath
        );
        if (fixture) {
          fixtures.push(fixture);
        }
      }
    }

    // Resolve fixture composition
    return this.resolveComposition(fixtures);
  }

  /**
   * Process a single fixture
   */
  private async processFixture<T>(
    raw: any,
    _sourcePath: string
  ): Promise<Fixture<T> | null> {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    // Apply template variables
    const processed = await this.applyTemplateVars(raw);

    const baseMetadata = processed.metadata && typeof processed.metadata === 'object'
      ? processed.metadata
      : {};

    const fixture: Fixture<T> = {
      id: processed.id || this.generateId(),
      type: processed.type || 'unknown',
      data: processed.data || processed,
      extends: processed.extends,
      vars: { ...this.config.vars, ...(processed.vars || {}) },
      relationships: processed.relationships,
      traits: processed.traits,
      metadata: {
        ...baseMetadata,
        createdAt: new Date(),
      },
    };

    // Validate fixture
    if (this.config.validate) {
      this.validateFixture(fixture);
    }

    return fixture;
  }

  /**
   * Resolve fixture composition (inheritance/extension)
   */
  private resolveComposition<T>(fixtures: Fixture<T>[]): Fixture<T>[] {
    const fixtureMap = new Map(fixtures.map(f => [f.id, f]));
    const resolved: Fixture<T>[] = [];

    for (const fixture of fixtures) {
      const resolvedFixture = this.resolveFixture(fixture, fixtureMap);
      resolved.push(resolvedFixture);
    }

    return resolved;
  }

  /**
   * Resolve a single fixture with inheritance
   */
  private resolveFixture<T>(
    fixture: Fixture<T>,
    fixtureMap: Map<string, Fixture<T>>,
    visited: Set<string> = new Set()
  ): Fixture<T> {
    // Check for circular inheritance
    if (visited.has(fixture.id)) {
      throw new Error(`Circular fixture inheritance detected: ${fixture.id}`);
    }
    visited.add(fixture.id);

    // No inheritance
    if (!fixture.extends) {
      return fixture;
    }

    // Get parent fixture
    const parent = fixtureMap.get(fixture.extends);
    if (!parent) {
      throw new Error(
        `Parent fixture not found: ${fixture.extends} for ${fixture.id}`
      );
    }

    // Resolve parent first
    const resolvedParent = this.resolveFixture(parent, fixtureMap, visited);

    // Merge based on composition strategy
    return this.mergeFixtures(resolvedParent, fixture);
  }

  /**
   * Merge parent and child fixtures
   */
  private mergeFixtures<T>(parent: Fixture<T>, child: Fixture<T>): Fixture<T> {
    switch (this.config.compositionStrategy) {
      case 'override':
        return { ...child };

      case 'extend':
        return {
          ...parent,
          ...child,
          data: { ...parent.data, ...child.data } as T,
          vars: { ...parent.vars, ...child.vars },
          traits: [...(parent.traits || []), ...(child.traits || [])],
          relationships: [
            ...(parent.relationships || []),
            ...(child.relationships || []),
          ],
        };

      case 'merge':
      default:
        return {
          ...parent,
          ...child,
          data: this.deepMerge(parent.data, child.data) as T,
          vars: { ...parent.vars, ...child.vars },
          traits: [...new Set([...(parent.traits || []), ...(child.traits || [])])],
          relationships: this.mergeRelationships(
            parent.relationships || [],
            child.relationships || []
          ),
        };
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    if (!this.isObject(target) || !this.isObject(source)) {
      return source;
    }

    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (this.isObject(source[key]) && this.isObject(target[key])) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Merge relationship arrays
   */
  private mergeRelationships(parent: any[], child: any[]): any[] {
    const merged = [...parent];

    for (const childRel of child) {
      const existingIndex = merged.findIndex(r => r.field === childRel.field);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...childRel };
      } else {
        merged.push(childRel);
      }
    }

    return merged;
  }

  /**
   * Apply template variables
   */
  private async applyTemplateVars(data: any): Promise<any> {
    if (this.config.templateEngine === 'none') {
      return data;
    }

    const jsonString = JSON.stringify(data);
    const processed = this.interpolateVars(jsonString, this.config.vars);
    return JSON.parse(processed);
  }

  /**
   * Simple variable interpolation
   */
  private interpolateVars(template: string, vars: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Parse file content based on format
   */
  private async parseContent(content: string, format: FixtureFormat): Promise<any> {
    switch (format) {
      case FixtureFormat.JSON:
        return JSON.parse(content);

      case FixtureFormat.YAML:
      case FixtureFormat.YML:
        return parseYaml(content);

      case FixtureFormat.JS:
      case FixtureFormat.TS:
        // Dynamic import for JS/TS files
        // This is a simplified version - production would need proper module loading
        return eval(`(${content})`);

      default:
        throw new Error(`Unsupported fixture format: ${format}`);
    }
  }

  /**
   * Detect file format from extension
   */
  private detectFormat(filePath: string): FixtureFormat {
    const ext = extname(filePath).substring(1).toLowerCase();

    if (ext === 'json') return FixtureFormat.JSON;
    if (ext === 'yaml' || ext === 'yml') return FixtureFormat.YAML;
    if (ext === 'js') return FixtureFormat.JS;
    if (ext === 'ts') return FixtureFormat.TS;

    throw new Error(`Unsupported file extension: ${ext}`);
  }

  /**
   * Find all fixture files in a directory
   */
  private async findFixtureFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.findFixtureFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).substring(1).toLowerCase();
        if (this.config.formats.includes(ext as FixtureFormat)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Resolve file path
   */
  private resolveFilePath(filePath: string): string {
    if (filePath.startsWith('/')) {
      return filePath;
    }
    return join(this.config.baseDir, filePath);
  }

  /**
   * Validate fixture structure
   */
  private validateFixture(fixture: Fixture): void {
    if (!fixture.id) {
      throw new Error('Fixture must have an id');
    }
    if (!fixture.type) {
      throw new Error(`Fixture ${fixture.id} must have a type`);
    }
    if (!fixture.data) {
      throw new Error(`Fixture ${fixture.id} must have data`);
    }
  }

  /**
   * Check if value is a plain object
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Generate unique fixture ID
   */
  private generateId(): string {
    return `fixture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a fixture loader instance
 */
export function createFixtureLoader(
  config?: FixtureLoaderConfig
): FixtureLoader {
  return new FixtureLoader(config);
}
