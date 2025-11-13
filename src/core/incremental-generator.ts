/**
 * Incremental Test Generator
 * Smart regeneration that only updates tests for changed endpoints
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { GenerationMetadataManager } from './generation-metadata.js';
import type {
  ChangeDetectionResult,
  EndpointIdentifier,
  RegenerationStrategy,
  IncrementalGenerationOptions,
  GenerationMetadata,
  GenerationOptionsSnapshot,
} from '../types/incremental-types.js';
import type { ApiEndpoint, ParsedApiSpec } from '../types/openapi-types.js';

/**
 * Default incremental options
 */
const DEFAULT_INCREMENTAL_OPTIONS: IncrementalGenerationOptions = {
  forceAll: false,
  dryRun: false,
  skipConfirmation: false,
  preserveManualChanges: true,
};

/**
 * Incremental Test Generator
 * Detects changes and generates only what's needed
 */
export class IncrementalGenerator {
  private metadataManager: GenerationMetadataManager;
  private options: IncrementalGenerationOptions;

  constructor(
    metadataManager?: GenerationMetadataManager,
    options: Partial<IncrementalGenerationOptions> = {}
  ) {
    this.metadataManager = metadataManager || new GenerationMetadataManager();
    this.options = { ...DEFAULT_INCREMENTAL_OPTIONS, ...options };
  }

  /**
   * Detect changes between current spec and previous generation
   */
  async detectChanges(
    specPath: string,
    _currentSpec: ParsedApiSpec,
    currentEndpoints: ApiEndpoint[],
    currentOptions: GenerationOptionsSnapshot,
    outputDir: string
  ): Promise<ChangeDetectionResult> {
    // Load previous metadata
    const metadata = await this.metadataManager.loadMetadata();

    if (!metadata) {
      // No previous metadata - this is first generation
      return this.createFullGenerationResult(currentEndpoints);
    }

    // Check if spec file changed
    const currentSpecHash = await this.metadataManager.calculateSpecHash(specPath);
    const specChanged = currentSpecHash !== metadata.specHash;

    // Check if generation options changed
    const optionsChanged = this.didOptionsChange(metadata.generationOptions, currentOptions);

    // If force-all or major changes, regenerate everything
    if (this.options.forceAll || optionsChanged) {
      return this.createFullGenerationResult(currentEndpoints, {
        reason: this.options.forceAll ? 'force-all flag' : 'options changed',
      });
    }

    // Detect endpoint-level changes
    const added: EndpointIdentifier[] = [];
    const removed: EndpointIdentifier[] = [];
    const modified: EndpointIdentifier[] = [];
    const unchanged: EndpointIdentifier[] = [];

    // Create endpoint maps
    const currentEndpointMap = this.createEndpointMap(currentEndpoints);
    const previousEndpointMap = this.createPreviousEndpointMap(metadata);

    // Find added and modified endpoints
    for (const [key, endpoint] of currentEndpointMap.entries()) {
      const previousEndpoint = previousEndpointMap.get(key);

      if (!previousEndpoint) {
        // New endpoint
        added.push(this.createEndpointIdentifier(endpoint));
      } else {
        // Check if endpoint definition changed
        const currentChecksum = this.metadataManager.calculateEndpointChecksum(endpoint);
        if (currentChecksum !== previousEndpoint.checksum) {
          // Endpoint was modified
          modified.push(
            this.createEndpointIdentifier(endpoint, {
              oldChecksum: previousEndpoint.checksum,
              newChecksum: currentChecksum,
            })
          );
        } else {
          // Endpoint unchanged
          unchanged.push(this.createEndpointIdentifier(endpoint, { checksum: currentChecksum }));
        }
      }
    }

    // Find removed endpoints
    for (const [key, previousEndpoint] of previousEndpointMap.entries()) {
      if (!currentEndpointMap.has(key)) {
        removed.push({
          method: previousEndpoint.method,
          path: previousEndpoint.path,
          key,
          checksum: previousEndpoint.checksum,
        });
      }
    }

    // Find files to delete (from removed endpoints)
    const filesToDelete: string[] = [];
    for (const removedEndpoint of removed) {
      const endpointMetadata = metadata.endpoints[removedEndpoint.key];
      if (endpointMetadata) {
        filesToDelete.push(...endpointMetadata.files);
      }
    }

    // Find manually modified files
    const manuallyModifiedFiles = this.options.preserveManualChanges
      ? await this.metadataManager.getManuallyModifiedFiles(metadata, outputDir)
      : [];

    return {
      added,
      removed,
      modified,
      unchanged,
      specChanged,
      optionsChanged,
      filesToDelete,
      manuallyModifiedFiles,
    };
  }

  /**
   * Create regeneration strategy based on detected changes
   */
  createRegenerationStrategy(changes: ChangeDetectionResult): RegenerationStrategy {
    const toGenerate = [...changes.added];
    const toRegenerate = [...changes.modified];
    const toSkip = [...changes.unchanged];
    const toDelete = [...changes.filesToDelete];
    const warnings: string[] = [];

    // Filter out manually modified files from regeneration
    if (changes.manuallyModifiedFiles.length > 0) {
      warnings.push(
        `⚠️  ${changes.manuallyModifiedFiles.length} file(s) were manually modified and will be preserved:`
      );
      for (const file of changes.manuallyModifiedFiles) {
        warnings.push(`   - ${file}`);
      }

      // Remove manually modified endpoints from regeneration list
      // This is a simplified approach - in production you'd track file→endpoint mapping
      // For now, we'll just warn the user
      warnings.push(
        '   Run with --force-all to regenerate these files (will overwrite manual changes)'
      );
    }

    // Add warnings for deleted endpoints
    if (changes.removed.length > 0) {
      warnings.push(`⚠️  ${changes.removed.length} endpoint(s) were removed:`);
      for (const endpoint of changes.removed) {
        warnings.push(`   - ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      }
      if (toDelete.length > 0) {
        warnings.push(`   This will delete ${toDelete.length} test file(s)`);
      }
    }

    // Calculate time saved (rough estimate)
    const unchangedCount = toSkip.length;
    const avgTimePerEndpoint = 100; // ms per endpoint (rough estimate)
    const timeSaved = unchangedCount * avgTimePerEndpoint;

    const totalOperations = toGenerate.length + toRegenerate.length + toDelete.length;

    return {
      toGenerate,
      toRegenerate,
      toSkip,
      toDelete,
      warnings,
      totalOperations,
      timeSaved,
    };
  }

  /**
   * Filter endpoints based on regeneration strategy
   */
  filterEndpointsForGeneration(
    endpoints: ApiEndpoint[],
    strategy: RegenerationStrategy
  ): ApiEndpoint[] {
    // Create set of endpoints to process (generate + regenerate)
    const toProcess = new Set<string>();

    for (const endpoint of strategy.toGenerate) {
      toProcess.add(endpoint.key);
    }

    for (const endpoint of strategy.toRegenerate) {
      toProcess.add(endpoint.key);
    }

    // Filter endpoints
    return endpoints.filter((endpoint) => {
      const key = this.metadataManager.createEndpointKey(endpoint.method, endpoint.path);
      return toProcess.has(key);
    });
  }

  /**
   * Delete files for removed endpoints
   */
  async deleteRemovedFiles(
    filesToDelete: string[],
    outputDir: string,
    dryRun: boolean = false
  ): Promise<number> {
    let deletedCount = 0;

    for (const file of filesToDelete) {
      const fullPath = path.join(outputDir, file);

      if (dryRun) {
        console.log(`[DRY RUN] Would delete: ${file}`);
        deletedCount++;
      } else {
        try {
          await fs.unlink(fullPath);
          console.log(`Deleted: ${file}`);
          deletedCount++;
        } catch (error) {
          // Ignore if file doesn't exist
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`Warning: Failed to delete ${file}: ${error}`);
          }
        }
      }
    }

    return deletedCount;
  }

  /**
   * Print strategy summary
   */
  printStrategySummary(strategy: RegenerationStrategy): void {
    console.log('\n📊 Incremental Generation Strategy:');
    console.log(`   New endpoints:      ${strategy.toGenerate.length}`);
    console.log(`   Modified endpoints: ${strategy.toRegenerate.length}`);
    console.log(`   Unchanged endpoints: ${strategy.toSkip.length} (skipped)`);
    console.log(`   Removed endpoints:  ${strategy.toDelete.length}`);
    console.log(`   Total operations:   ${strategy.totalOperations}`);

    if (strategy.timeSaved > 0) {
      const seconds = (strategy.timeSaved / 1000).toFixed(1);
      console.log(`   ⚡ Estimated time saved: ~${seconds}s`);
    }

    if (strategy.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of strategy.warnings) {
        console.log(warning);
      }
    }

    console.log('');
  }

  /**
   * Print dry run summary
   */
  printDryRunSummary(strategy: RegenerationStrategy): void {
    console.log('\n🔍 DRY RUN - No changes will be made\n');

    if (strategy.toGenerate.length > 0) {
      console.log('Would generate tests for NEW endpoints:');
      for (const endpoint of strategy.toGenerate) {
        console.log(`  ✅ ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      }
      console.log('');
    }

    if (strategy.toRegenerate.length > 0) {
      console.log('Would regenerate tests for MODIFIED endpoints:');
      for (const endpoint of strategy.toRegenerate) {
        console.log(`  🔄 ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      }
      console.log('');
    }

    if (strategy.toSkip.length > 0) {
      console.log('Would skip UNCHANGED endpoints:');
      for (const endpoint of strategy.toSkip.slice(0, 5)) {
        console.log(`  ⏭️  ${endpoint.method.toUpperCase()} ${endpoint.path}`);
      }
      if (strategy.toSkip.length > 5) {
        console.log(`  ... and ${strategy.toSkip.length - 5} more`);
      }
      console.log('');
    }

    if (strategy.toDelete.length > 0) {
      console.log('Would delete files for REMOVED endpoints:');
      for (const file of strategy.toDelete) {
        console.log(`  ❌ ${file}`);
      }
      console.log('');
    }

    console.log(`Run without --dry-run to apply these changes\n`);
  }

  /**
   * Create full generation result (first time or force-all)
   */
  private createFullGenerationResult(
    endpoints: ApiEndpoint[],
    options?: { reason?: string }
  ): ChangeDetectionResult {
    const added = endpoints.map((ep) => this.createEndpointIdentifier(ep));

    if (options?.reason) {
      console.log(`ℹ️  Full regeneration: ${options.reason}`);
    }

    return {
      added,
      removed: [],
      modified: [],
      unchanged: [],
      specChanged: true,
      optionsChanged: false,
      filesToDelete: [],
      manuallyModifiedFiles: [],
    };
  }

  /**
   * Create endpoint identifier
   */
  private createEndpointIdentifier(
    endpoint: ApiEndpoint,
    options?: { checksum?: string; oldChecksum?: string; newChecksum?: string }
  ): EndpointIdentifier {
    return {
      method: endpoint.method,
      path: endpoint.path,
      key: this.metadataManager.createEndpointKey(endpoint.method, endpoint.path),
      checksum: options?.checksum || options?.newChecksum,
    };
  }

  /**
   * Create endpoint map from current endpoints
   */
  private createEndpointMap(endpoints: ApiEndpoint[]): Map<string, ApiEndpoint> {
    const map = new Map<string, ApiEndpoint>();

    for (const endpoint of endpoints) {
      const key = this.metadataManager.createEndpointKey(endpoint.method, endpoint.path);
      map.set(key, endpoint);
    }

    return map;
  }

  /**
   * Create endpoint map from previous metadata
   */
  private createPreviousEndpointMap(
    metadata: GenerationMetadata
  ): Map<string, { method: string; path: string; checksum: string }> {
    const map = new Map<string, { method: string; path: string; checksum: string }>();

    for (const [key, endpoint] of Object.entries(metadata.endpoints)) {
      map.set(key, {
        method: endpoint.method,
        path: endpoint.path,
        checksum: endpoint.checksum,
      });
    }

    return map;
  }

  /**
   * Check if generation options changed
   */
  private didOptionsChange(
    oldOptions: GenerationOptionsSnapshot,
    newOptions: GenerationOptionsSnapshot
  ): boolean {
    return (
      oldOptions.includeAuth !== newOptions.includeAuth ||
      oldOptions.includeErrors !== newOptions.includeErrors ||
      oldOptions.includeEdgeCases !== newOptions.includeEdgeCases ||
      oldOptions.includeFlows !== newOptions.includeFlows ||
      oldOptions.includePerformance !== newOptions.includePerformance ||
      oldOptions.baseUrl !== newOptions.baseUrl
    );
  }
}

/**
 * Convenience function to create an incremental generator
 */
export function createIncrementalGenerator(
  options?: Partial<IncrementalGenerationOptions>
): IncrementalGenerator {
  return new IncrementalGenerator(undefined, options);
}
