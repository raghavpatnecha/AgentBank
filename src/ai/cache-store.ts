/**
 * Cache Store (Feature 4, Task 4.9)
 * Intelligent caching for OpenAI API responses to optimize costs
 */

import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import type {
  CachedItem,
  CacheConfig,
  CacheKeyContext,
  CacheStatistics,
  HealingContext,
} from '../types/self-healing-types.js';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 86400, // 24 hours
  maxSize: 1000,
  evictionPolicy: 'lru',
  persistToDisk: false,
  enableCompression: false,
};

/**
 * LRU Cache Node
 */
interface CacheNode {
  key: string;
  item: CachedItem;
  prev: CacheNode | null;
  next: CacheNode | null;
}

/**
 * Cache Store
 * In-memory cache with LRU eviction, TTL, and optional disk persistence
 */
export class CacheStore {
  private cache: Map<string, CacheNode> = new Map();
  private config: CacheConfig;
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get cached item
   */
  async get(key: string): Promise<CachedItem | null> {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(node.item)) {
      await this.delete(key);
      this.misses++;
      return null;
    }

    // Update access time and count
    node.item.lastAccessedAt = new Date();
    node.item.accessCount++;

    // Move to front (most recently used)
    this.moveToFront(node);

    this.hits++;
    return { ...node.item };
  }

  /**
   * Set cached item
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const itemTTL = ttl ?? this.config.defaultTTL;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + itemTTL * 1000);

    const item: CachedItem = {
      key,
      value,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      ttl: itemTTL,
      expiresAt,
      size: this.estimateSize(value),
    };

    // Check if key already exists
    const existingNode = this.cache.get(key);
    if (existingNode) {
      // Update existing
      existingNode.item = item;
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode = {
      key,
      item,
      prev: null,
      next: null,
    };

    // Add to cache
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Check size limit and evict if necessary
    if (this.cache.size > this.config.maxSize) {
      await this.evictLRU();
    }

    // Persist if enabled
    if (this.config.persistToDisk && this.config.diskPath) {
      await this.persistCache();
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const item = await this.get(key);
    return item !== null;
  }

  /**
   * Delete cached item
   */
  async delete(key: string): Promise<void> {
    const node = this.cache.get(key);
    if (!node) return;

    this.removeNode(node);
    this.cache.delete(key);

    if (this.config.persistToDisk && this.config.diskPath) {
      await this.persistCache();
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;

    if (this.config.persistToDisk && this.config.diskPath) {
      await this.persistCache();
    }
  }

  /**
   * Clean up expired items
   */
  async cleanup(): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (this.isExpired(node.item)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Generate cache key from healing context
   */
  generateCacheKey(context: CacheKeyContext): string {
    // Create a deterministic hash from the context
    const data = JSON.stringify({
      failureType: context.failureType,
      specDiffHash: context.specDiffHash,
      testCodeHash: context.testCodeHash,
      extra: context.extra || {},
    });

    return this.hashCode(data);
  }

  /**
   * Generate cache key from healing context (alternative method)
   */
  generateCacheKeyFromContext(context: HealingContext): string {
    const specDiffHash = this.hashCode(JSON.stringify(context.specDiff));
    const testCodeHash = this.hashCode(context.testCode.substring(0, 500));

    return this.generateCacheKey({
      failureType: context.failureType,
      specDiffHash,
      testCodeHash,
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStatistics {
    const items = Array.from(this.cache.values()).map((node) => node.item);
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const averageSize = items.length > 0 ? totalSize / items.length : 0;

    // Find oldest entry
    let oldestEntryAge = 0;
    if (items.length > 0) {
      const oldest = items.reduce((oldest, item) =>
        item.createdAt < oldest.createdAt ? item : oldest
      );
      oldestEntryAge = (Date.now() - oldest.createdAt.getTime()) / 1000;
    }

    // Count expired items
    const expired = items.filter((item) => this.isExpired(item)).length;

    // Calculate effectiveness (hit rate weighted by recency)
    const effectiveness = this.calculateEffectiveness();

    return {
      totalEntries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.calculateHitRate(),
      totalSize,
      averageSize,
      oldestEntryAge,
      evictions: this.evictions,
      expired,
      effectiveness,
    };
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return this.hits / total;
  }

  /**
   * Export cache to file
   */
  async exportCache(filepath: string): Promise<void> {
    const items = Array.from(this.cache.values()).map((node) => node.item);

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      config: this.config,
      items,
      stats: {
        hits: this.hits,
        misses: this.misses,
        evictions: this.evictions,
      },
    };

    try {
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to export cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import cache from file
   */
  async importCache(filepath: string): Promise<void> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);

      // Clear existing cache
      await this.clear();

      // Import items
      for (const item of data.items) {
        // Reconstruct dates
        item.createdAt = new Date(item.createdAt);
        item.lastAccessedAt = new Date(item.lastAccessedAt);
        item.expiresAt = new Date(item.expiresAt);

        // Skip expired items
        if (!this.isExpired(item)) {
          const node: CacheNode = {
            key: item.key,
            item,
            prev: null,
            next: null,
          };

          this.cache.set(item.key, node);
          this.addToFront(node);
        }
      }

      // Restore stats
      if (data.stats) {
        this.hits = data.stats.hits || 0;
        this.misses = data.stats.misses || 0;
        this.evictions = data.stats.evictions || 0;
      }
    } catch (error) {
      throw new Error(
        `Failed to import cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all cache entries (for testing/debugging)
   */
  getAll(): CachedItem[] {
    return Array.from(this.cache.values()).map((node) => ({ ...node.item }));
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if item is expired
   */
  private isExpired(item: CachedItem): boolean {
    return new Date() > item.expiresAt;
  }

  /**
   * Evict least recently used item
   */
  private async evictLRU(): Promise<void> {
    if (!this.tail) return;

    const key = this.tail.key;
    this.removeNode(this.tail);
    this.cache.delete(key);
    this.evictions++;
  }

  /**
   * Add node to front of LRU list
   */
  private addToFront(node: CacheNode): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Move node to front of LRU list
   */
  private moveToFront(node: CacheNode): void {
    if (node === this.head) return;

    this.removeNode(node);
    this.addToFront(node);
  }

  /**
   * Remove node from LRU list
   */
  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: unknown): number {
    const json = JSON.stringify(value);
    return Buffer.byteLength(json, 'utf-8');
  }

  /**
   * Calculate cache effectiveness score
   */
  private calculateEffectiveness(): number {
    const hitRate = this.calculateHitRate();
    if (hitRate === 0) return 0;

    // Factor in recency of hits
    const items = Array.from(this.cache.values()).map((node) => node.item);
    if (items.length === 0) return hitRate * 100;

    const recentlyAccessed = items.filter((item) => {
      const hoursSinceAccess = (Date.now() - item.lastAccessedAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceAccess < 1;
    }).length;

    const recencyScore = items.length > 0 ? recentlyAccessed / items.length : 0;

    // Weighted score: 70% hit rate, 30% recency
    return (hitRate * 0.7 + recencyScore * 0.3) * 100;
  }

  /**
   * Hash function for generating cache keys
   */
  private hashCode(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Persist cache to disk
   */
  private async persistCache(): Promise<void> {
    if (!this.config.diskPath) return;

    try {
      await this.exportCache(this.config.diskPath);
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }
}
