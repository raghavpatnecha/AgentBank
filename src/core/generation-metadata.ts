/**
 * Generation Metadata Manager
 * Tracks what tests were generated and when, enabling incremental regeneration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  GenerationMetadata,
  EndpointChecksum,
  GenerationOptionsSnapshot,
  ChecksumOptions,
  FileModificationInfo,
} from '../types/incremental-types.js';
import type { ApiEndpoint } from '../types/openapi-types.js';

/**
 * Default path for metadata cache
 */
const DEFAULT_CACHE_DIR = '.agentbank-cache';
const METADATA_FILE = 'generation-metadata.json';
const METADATA_VERSION = '1.0';

/**
 * Default checksum options
 */
const DEFAULT_CHECKSUM_OPTIONS: ChecksumOptions = {
  includeRequest: true,
  includeResponse: true,
  includeParameters: true,
  includeSecurity: true,
  includeDescriptions: false, // Don't include descriptions to avoid regeneration on doc changes
};

/**
 * Manager for generation metadata
 */
export class GenerationMetadataManager {
  private cacheDir: string;
  private metadataPath: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || DEFAULT_CACHE_DIR;
    this.metadataPath = path.join(this.cacheDir, METADATA_FILE);
  }

  /**
   * Load existing metadata from cache
   * Returns null if no metadata exists
   */
  async loadMetadata(): Promise<GenerationMetadata | null> {
    try {
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      const metadata = JSON.parse(content) as GenerationMetadata;

      // Validate version
      if (metadata.version !== METADATA_VERSION) {
        console.warn(
          `Metadata version mismatch (expected ${METADATA_VERSION}, got ${metadata.version}). Ignoring cache.`
        );
        return null;
      }

      return metadata;
    } catch (error) {
      // File doesn't exist or can't be read
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save metadata to cache
   */
  async saveMetadata(metadata: GenerationMetadata): Promise<void> {
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });

    // Write metadata
    const content = JSON.stringify(metadata, null, 2);
    await fs.writeFile(this.metadataPath, content, 'utf-8');
  }

  /**
   * Calculate hash of entire spec file
   */
  async calculateSpecHash(specPath: string): Promise<string> {
    const content = await fs.readFile(specPath, 'utf-8');
    return this.hashString(content);
  }

  /**
   * Calculate checksum for a single endpoint
   * This determines if the endpoint definition has changed
   */
  calculateEndpointChecksum(
    endpoint: ApiEndpoint,
    options: Partial<ChecksumOptions> = {}
  ): string {
    const opts = { ...DEFAULT_CHECKSUM_OPTIONS, ...options };

    // Build a deterministic object representing the endpoint
    const checksumData: any = {
      path: endpoint.path,
      method: endpoint.method,
    };

    if (opts.includeParameters && endpoint.parameters) {
      checksumData.parameters = endpoint.parameters;
    }

    if (opts.includeRequest && endpoint.requestBody) {
      checksumData.requestBody = endpoint.requestBody;
    }

    if (opts.includeResponse && endpoint.responses) {
      // Convert Map to object for serialization
      checksumData.responses = Object.fromEntries(endpoint.responses);
    }

    if (opts.includeSecurity && endpoint.security) {
      checksumData.security = endpoint.security;
    }

    if (opts.includeDescriptions) {
      checksumData.summary = endpoint.summary;
      checksumData.description = endpoint.description;
    }

    // Serialize to JSON and hash
    const serialized = JSON.stringify(checksumData, this.sortObjectKeys);
    return this.hashString(serialized);
  }

  /**
   * Create endpoint key (method:path)
   */
  createEndpointKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  /**
   * Create endpoint checksum metadata
   */
  createEndpointChecksum(
    endpoint: ApiEndpoint,
    files: string[],
    testTypes: string[],
    testCount: number
  ): EndpointChecksum {
    const now = new Date().toISOString();

    return {
      checksum: this.calculateEndpointChecksum(endpoint),
      method: endpoint.method,
      path: endpoint.path,
      files,
      generatedAt: now,
      lastModified: now,
      testTypes,
      testCount,
    };
  }

  /**
   * Create new metadata object
   */
  createMetadata(
    specPath: string,
    specHash: string,
    outputDir: string,
    organizationStrategy: string,
    options: GenerationOptionsSnapshot
  ): GenerationMetadata {
    return {
      version: METADATA_VERSION,
      specHash,
      specPath,
      generatedAt: new Date().toISOString(),
      outputDir,
      organizationStrategy,
      endpoints: {},
      generationOptions: options,
    };
  }

  /**
   * Update metadata with new endpoint information
   */
  updateEndpointMetadata(
    metadata: GenerationMetadata,
    endpoint: ApiEndpoint,
    files: string[],
    testTypes: string[],
    testCount: number
  ): void {
    const key = this.createEndpointKey(endpoint.method, endpoint.path);
    const checksumData = this.createEndpointChecksum(endpoint, files, testTypes, testCount);

    metadata.endpoints[key] = checksumData;
  }

  /**
   * Remove endpoint from metadata
   */
  removeEndpointMetadata(metadata: GenerationMetadata, method: string, path: string): void {
    const key = this.createEndpointKey(method, path);
    delete metadata.endpoints[key];
  }

  /**
   * Check if file was modified since generation
   */
  async checkFileModification(
    filePath: string,
    recordedModTime: string
  ): Promise<FileModificationInfo> {
    try {
      const stats = await fs.stat(filePath);
      const modifiedAt = stats.mtime;
      const recordedAt = new Date(recordedModTime);

      // Compare times (with 1 second tolerance for filesystem precision)
      const wasModified = modifiedAt.getTime() - recordedAt.getTime() > 1000;

      return {
        path: filePath,
        modifiedAt,
        recordedAt,
        wasModified,
      };
    } catch (error) {
      // File doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          path: filePath,
          modifiedAt: new Date(0),
          recordedAt: new Date(recordedModTime),
          wasModified: false, // File was deleted, not modified
        };
      }
      throw error;
    }
  }

  /**
   * Get all files that were manually modified
   */
  async getManuallyModifiedFiles(
    metadata: GenerationMetadata,
    baseDir: string
  ): Promise<string[]> {
    const modifiedFiles: string[] = [];

    for (const endpoint of Object.values(metadata.endpoints)) {
      for (const file of endpoint.files) {
        const fullPath = path.join(baseDir, file);
        const info = await this.checkFileModification(fullPath, endpoint.lastModified);

        if (info.wasModified) {
          modifiedFiles.push(file);
        }
      }
    }

    return modifiedFiles;
  }

  /**
   * Clear all metadata (force fresh generation)
   */
  async clearMetadata(): Promise<void> {
    try {
      await fs.unlink(this.metadataPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get metadata file path
   */
  getMetadataPath(): string {
    return this.metadataPath;
  }

  /**
   * Check if metadata exists
   */
  async hasMetadata(): Promise<boolean> {
    try {
      await fs.access(this.metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hash a string using SHA-256
   */
  private hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Sort object keys for deterministic JSON serialization
   */
  private sortObjectKeys(_key: string, value: any): any {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: any, k: string) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  }
}

/**
 * Convenience function to create a metadata manager
 */
export function createMetadataManager(cacheDir?: string): GenerationMetadataManager {
  return new GenerationMetadataManager(cacheDir);
}
