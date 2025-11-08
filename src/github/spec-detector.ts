/**
 * OpenAPI Specification File Detector
 * Automatically detects and validates OpenAPI/Swagger spec files in repositories
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * Represents a detected specification file
 */
export interface SpecFile {
  /**
   * Absolute path to the spec file
   */
  path: string;

  /**
   * Relative path from repository root
   */
  relativePath: string;

  /**
   * File format (yaml or json)
   */
  format: 'yaml' | 'json';

  /**
   * Specification type
   */
  type: 'openapi-3.0' | 'openapi-3.1' | 'swagger-2.0' | 'unknown';

  /**
   * Specification version string
   */
  version: string;

  /**
   * API title from spec
   */
  title?: string;

  /**
   * API description from spec
   */
  description?: string;

  /**
   * Priority score for ranking (higher is better)
   */
  priority: number;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Whether the spec file is valid
   */
  isValid: boolean;

  /**
   * Validation errors if any
   */
  validationErrors: string[];
}

/**
 * Options for spec detection
 */
export interface DetectionOptions {
  /**
   * Repository root path
   */
  repoPath: string;

  /**
   * Maximum search depth
   */
  maxDepth?: number;

  /**
   * Whether to use cached results
   */
  useCache?: boolean;

  /**
   * Include invalid spec files
   */
  includeInvalid?: boolean;

  /**
   * Custom search paths
   */
  customPaths?: string[];
}

/**
 * Cache entry for spec detection
 */
interface CacheEntry {
  repoPath: string;
  specs: SpecFile[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Common locations where OpenAPI specs are typically found
 */
const COMMON_SPEC_PATHS = [
  'openapi.yaml',
  'openapi.json',
  'swagger.yaml',
  'swagger.json',
  'api.yaml',
  'api.json',
  'api-spec.yaml',
  'api-spec.json',
  'openapi-spec.yaml',
  'openapi-spec.json',
];

/**
 * Common directories to search for specs
 */
const SEARCH_DIRECTORIES = [
  '.',
  'api',
  'apis',
  'docs',
  'documentation',
  'spec',
  'specs',
  'openapi',
  'swagger',
  'schema',
  'schemas',
  '.openapi',
  'public',
];

/**
 * File patterns to match spec files
 */
const SPEC_FILE_PATTERNS = [
  /^openapi\.(ya?ml|json)$/i,
  /^swagger\.(ya?ml|json)$/i,
  /^api(-spec)?\.(ya?ml|json)$/i,
  /openapi.*\.(ya?ml|json)$/i,
  /swagger.*\.(ya?ml|json)$/i,
  /-openapi\.(ya?ml|json)$/i,
  /-swagger\.(ya?ml|json)$/i,
];

/**
 * Directories to exclude from search
 */
const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'test-results',
  'playwright-report',
  '.next',
  '.nuxt',
  'out',
  'target',
  'bin',
  'obj',
  'vendor',
  'tmp',
  'temp',
  '.cache',
];

/**
 * Cache duration in milliseconds (5 minutes)
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * OpenAPI Specification Detector
 */
export class SpecDetector {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Detect all OpenAPI spec files in a repository
   * @param options Detection options
   * @returns Array of detected spec files, sorted by priority
   */
  async detectSpecFiles(options: DetectionOptions): Promise<SpecFile[]> {
    const { repoPath, maxDepth = 5, useCache = true, includeInvalid = false } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getCachedSpecs(repoPath);
      if (cached) {
        return includeInvalid ? cached : cached.filter((s) => s.isValid);
      }
    }

    // Search for spec files
    const specs: SpecFile[] = [];

    // 1. Check common locations first
    const commonSpecs = await this.searchCommonLocations(repoPath);
    specs.push(...commonSpecs);

    // 2. Check custom paths if provided
    if (options.customPaths && options.customPaths.length > 0) {
      const customSpecs = await this.searchCustomPaths(repoPath, options.customPaths);
      specs.push(...customSpecs);
    }

    // 3. Search common directories
    const directorySpecs = await this.searchDirectories(repoPath, maxDepth);
    specs.push(...directorySpecs);

    // Remove duplicates
    const uniqueSpecs = this.deduplicateSpecs(specs);

    // Validate all spec files
    const validatedSpecs = await this.validateAllSpecs(uniqueSpecs);

    // Rank by priority
    const rankedSpecs = this.rankSpecFiles(validatedSpecs);

    // Cache results
    if (useCache) {
      this.cacheSpecs(repoPath, rankedSpecs);
    }

    return includeInvalid ? rankedSpecs : rankedSpecs.filter((s) => s.isValid);
  }

  /**
   * Search common spec file locations
   * @param repoPath Repository root path
   * @returns Array of found spec files
   */
  async searchCommonLocations(repoPath: string): Promise<SpecFile[]> {
    const specs: SpecFile[] = [];

    for (const specPath of COMMON_SPEC_PATHS) {
      const fullPath = path.join(repoPath, specPath);

      try {
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
          const spec = await this.createSpecFile(fullPath, repoPath);
          if (spec) {
            specs.push(spec);
          }
        }
      } catch (error) {
        // File doesn't exist, continue
        continue;
      }
    }

    return specs;
  }

  /**
   * Search custom paths for spec files
   * @param repoPath Repository root path
   * @param customPaths Custom paths to search
   * @returns Array of found spec files
   */
  async searchCustomPaths(repoPath: string, customPaths: string[]): Promise<SpecFile[]> {
    const specs: SpecFile[] = [];

    for (const customPath of customPaths) {
      const fullPath = path.isAbsolute(customPath)
        ? customPath
        : path.join(repoPath, customPath);

      try {
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
          const spec = await this.createSpecFile(fullPath, repoPath);
          if (spec) {
            specs.push(spec);
          }
        } else if (stats.isDirectory()) {
          // Search directory for specs
          const dirSpecs = await this.searchDirectory(fullPath, repoPath, 2);
          specs.push(...dirSpecs);
        }
      } catch (error) {
        // Path doesn't exist, continue
        continue;
      }
    }

    return specs;
  }

  /**
   * Search common directories for spec files
   * @param repoPath Repository root path
   * @param maxDepth Maximum search depth
   * @returns Array of found spec files
   */
  async searchDirectories(repoPath: string, maxDepth: number): Promise<SpecFile[]> {
    const specs: SpecFile[] = [];

    for (const dir of SEARCH_DIRECTORIES) {
      const dirPath = path.join(repoPath, dir);

      try {
        const stats = await fs.stat(dirPath);

        if (stats.isDirectory()) {
          const dirSpecs = await this.searchDirectory(dirPath, repoPath, maxDepth);
          specs.push(...dirSpecs);
        }
      } catch (error) {
        // Directory doesn't exist, continue
        continue;
      }
    }

    return specs;
  }

  /**
   * Recursively search a directory for spec files
   * @param dirPath Directory to search
   * @param repoPath Repository root path
   * @param depth Remaining search depth
   * @returns Array of found spec files
   */
  async searchDirectory(
    dirPath: string,
    repoPath: string,
    depth: number
  ): Promise<SpecFile[]> {
    if (depth <= 0) {
      return [];
    }

    const specs: SpecFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile()) {
          // Check if file matches spec patterns
          if (this.isSpecFile(entry.name)) {
            const spec = await this.createSpecFile(fullPath, repoPath);
            if (spec) {
              specs.push(spec);
            }
          }
        } else if (entry.isDirectory()) {
          // Skip excluded directories
          if (!this.isExcludedDirectory(entry.name)) {
            const subSpecs = await this.searchDirectory(fullPath, repoPath, depth - 1);
            specs.push(...subSpecs);
          }
        }
      }
    } catch (error) {
      // Can't read directory, skip
      return [];
    }

    return specs;
  }

  /**
   * Check if a filename matches spec file patterns
   * @param filename Filename to check
   * @returns True if filename matches spec patterns
   */
  private isSpecFile(filename: string): boolean {
    return SPEC_FILE_PATTERNS.some((pattern) => pattern.test(filename));
  }

  /**
   * Check if a directory should be excluded from search
   * @param dirname Directory name
   * @returns True if directory should be excluded
   */
  private isExcludedDirectory(dirname: string): boolean {
    return EXCLUDED_DIRECTORIES.includes(dirname) || dirname.startsWith('.');
  }

  /**
   * Create a SpecFile object from a file path
   * @param filePath Absolute file path
   * @param repoPath Repository root path
   * @returns SpecFile object or null if creation fails
   */
  async createSpecFile(filePath: string, repoPath: string): Promise<SpecFile | null> {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(repoPath, filePath);
      const format = this.detectFormat(filePath);

      const specFile: SpecFile = {
        path: filePath,
        relativePath,
        format,
        type: 'unknown',
        version: '',
        priority: 0,
        size: stats.size,
        isValid: false,
        validationErrors: [],
      };

      return specFile;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect file format from extension
   * @param filePath File path
   * @returns File format
   */
  private detectFormat(filePath: string): 'yaml' | 'json' {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
      return 'json';
    }

    return 'yaml';
  }

  /**
   * Validate a spec file
   * @param specFile Spec file to validate
   * @returns Updated spec file with validation results
   */
  async validateSpecFile(specFile: SpecFile): Promise<SpecFile> {
    const errors: string[] = [];

    try {
      const content = await fs.readFile(specFile.path, 'utf-8');

      // Parse content
      let parsed: unknown;

      try {
        if (specFile.format === 'json') {
          parsed = JSON.parse(content) as unknown;
        } else {
          parsed = parseYaml(content) as unknown;
        }
      } catch (error) {
        errors.push(`Failed to parse ${specFile.format.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`);
        return { ...specFile, isValid: false, validationErrors: errors };
      }

      // Check if it's a valid OpenAPI/Swagger spec
      if (typeof parsed !== 'object' || parsed === null) {
        errors.push('Spec file must be a valid object');
        return { ...specFile, isValid: false, validationErrors: errors };
      }

      const spec = parsed as Record<string, unknown>;

      // Detect spec type and version
      if ('openapi' in spec && typeof spec.openapi === 'string') {
        specFile.version = spec.openapi;

        if (spec.openapi.startsWith('3.1')) {
          specFile.type = 'openapi-3.1';
        } else if (spec.openapi.startsWith('3.0')) {
          specFile.type = 'openapi-3.0';
        } else {
          errors.push(`Unsupported OpenAPI version: ${spec.openapi}`);
        }
      } else if ('swagger' in spec && spec.swagger === '2.0') {
        specFile.version = '2.0';
        specFile.type = 'swagger-2.0';
      } else {
        errors.push('Not a valid OpenAPI or Swagger specification');
        return { ...specFile, isValid: false, validationErrors: errors };
      }

      // Extract info
      if ('info' in spec && typeof spec.info === 'object' && spec.info !== null) {
        const info = spec.info as Record<string, unknown>;

        if ('title' in info && typeof info.title === 'string') {
          specFile.title = info.title;
        }

        if ('description' in info && typeof info.description === 'string') {
          specFile.description = info.description;
        }
      }

      // Check for required fields
      if (!('paths' in spec)) {
        errors.push('Missing required "paths" field');
      }

      if (!('info' in spec)) {
        errors.push('Missing required "info" field');
      }

      // Spec is valid if no errors
      specFile.isValid = errors.length === 0;
      specFile.validationErrors = errors;

      return specFile;
    } catch (error) {
      errors.push(`Failed to read spec file: ${error instanceof Error ? error.message : String(error)}`);
      return { ...specFile, isValid: false, validationErrors: errors };
    }
  }

  /**
   * Validate all spec files
   * @param specs Array of spec files
   * @returns Array of validated spec files
   */
  async validateAllSpecs(specs: SpecFile[]): Promise<SpecFile[]> {
    const validatedSpecs = await Promise.all(
      specs.map((spec) => this.validateSpecFile(spec))
    );

    return validatedSpecs;
  }

  /**
   * Rank spec files by priority
   * Priority is based on:
   * 1. Location (root > api > docs > other)
   * 2. Filename (openapi > swagger > api-spec)
   * 3. Format (yaml > json)
   * 4. Size (larger files often more complete)
   *
   * @param specs Array of spec files
   * @returns Sorted array of spec files (highest priority first)
   */
  rankSpecFiles(specs: SpecFile[]): SpecFile[] {
    const rankedSpecs = specs.map((spec) => {
      let priority = 0;

      // Location priority
      const dir = path.dirname(spec.relativePath);

      if (dir === '.') {
        priority += 1000; // Root directory highest priority
      } else if (dir === 'api' || dir === 'apis') {
        priority += 900;
      } else if (dir === 'docs' || dir === 'documentation') {
        priority += 800;
      } else if (dir === 'spec' || dir === 'specs') {
        priority += 700;
      } else if (dir === 'openapi' || dir === 'swagger') {
        priority += 600;
      } else {
        priority += 500;
      }

      // Filename priority
      const basename = path.basename(spec.relativePath).toLowerCase();

      if (basename.startsWith('openapi.')) {
        priority += 100;
      } else if (basename.startsWith('swagger.')) {
        priority += 90;
      } else if (basename.startsWith('api.')) {
        priority += 80;
      } else if (basename.includes('openapi')) {
        priority += 70;
      } else if (basename.includes('swagger')) {
        priority += 60;
      }

      // Format priority
      if (spec.format === 'yaml') {
        priority += 10;
      } else {
        priority += 5;
      }

      // Size priority (normalized)
      priority += Math.min(spec.size / 1000, 50);

      // Valid specs get bonus
      if (spec.isValid) {
        priority += 500;
      }

      return { ...spec, priority };
    });

    // Sort by priority (highest first)
    return rankedSpecs.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove duplicate spec files (same path)
   * @param specs Array of spec files
   * @returns Array without duplicates
   */
  private deduplicateSpecs(specs: SpecFile[]): SpecFile[] {
    const seen = new Set<string>();
    const unique: SpecFile[] = [];

    for (const spec of specs) {
      if (!seen.has(spec.path)) {
        seen.add(spec.path);
        unique.push(spec);
      }
    }

    return unique;
  }

  /**
   * Get cached specs for a repository
   * @param repoPath Repository path
   * @returns Cached specs or null if not found/expired
   */
  getCachedSpecs(repoPath: string): SpecFile[] | null {
    const entry = this.cache.get(repoPath);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(repoPath);
      return null;
    }

    return entry.specs;
  }

  /**
   * Cache specs for a repository
   * @param repoPath Repository path
   * @param specs Spec files to cache
   */
  cacheSpecs(repoPath: string, specs: SpecFile[]): void {
    const now = Date.now();

    const entry: CacheEntry = {
      repoPath,
      specs,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    };

    this.cache.set(repoPath, entry);
  }

  /**
   * Clear cache for a specific repository or all
   * @param repoPath Optional repository path to clear (clears all if not provided)
   */
  clearCache(repoPath?: string): void {
    if (repoPath) {
      this.cache.delete(repoPath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ repoPath: string; specCount: number; expiresIn: number }> } {
    const now = Date.now();
    const entries: Array<{ repoPath: string; specCount: number; expiresIn: number }> = [];

    for (const [repoPath, entry] of this.cache.entries()) {
      entries.push({
        repoPath,
        specCount: entry.specs.length,
        expiresIn: Math.max(0, entry.expiresAt - now),
      });
    }

    return {
      size: this.cache.size,
      entries,
    };
  }
}

/**
 * Convenience function to detect specs in a repository
 * @param repoPath Repository root path
 * @param options Optional detection options
 * @returns Array of detected spec files
 */
export async function detectSpecs(
  repoPath: string,
  options: Partial<DetectionOptions> = {}
): Promise<SpecFile[]> {
  const detector = new SpecDetector();
  return detector.detectSpecFiles({ repoPath, ...options });
}

/**
 * Find the best (highest priority) spec file in a repository
 * @param repoPath Repository root path
 * @param options Optional detection options
 * @returns Best spec file or null if none found
 */
export async function findBestSpec(
  repoPath: string,
  options: Partial<DetectionOptions> = {}
): Promise<SpecFile | null> {
  const specs = await detectSpecs(repoPath, options);

  if (specs.length === 0) {
    return null;
  }

  return specs[0] ?? null; // Already sorted by priority
}
