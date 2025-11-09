/**
 * Cache Manager for OpenAI responses
 *
 * Features:
 * - In-memory caching with TTL
 * - LRU eviction policy
 * - Cache statistics
 * - Automatic cleanup
 * - Persistence support (optional)
 */

import { createHash } from 'crypto';

/**
 * Cached response data
 */
export interface CachedResponse {
  key: string;
  value: any;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  expirations: number;
  totalMemoryBytes: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
  enableStats?: boolean;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  value: any;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  size: number; // Approximate size in bytes
}

/**
 * Cache manager with TTL and LRU eviction
 */
export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private config: Required<CacheConfig>;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    expirations: number;
  };
  private cleanupTimer: NodeJS.Timeout | null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 3600000, // 1 hour
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
      enableStats: config.enableStats ?? true,
    };

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };

    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<CachedResponse | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.stats.expirations++;
        this.stats.misses++;
      }
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return {
      key,
      value: entry.value,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      accessCount: entry.accessCount,
      lastAccessedAt: entry.lastAccessedAt,
    };
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.config.defaultTTL);
    const size = this.estimateSize(value);

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessedAt: now,
      size,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Invalidate multiple keys matching pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<number> {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    const missRate = total > 0 ? this.stats.misses / total : 0;

    let totalMemoryBytes = 0;
    for (const entry of this.cache.values()) {
      totalMemoryBytes += entry.size;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      missRate,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      totalMemoryBytes,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (this.config.enableStats) {
      this.stats.expirations += expiredCount;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccessTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestAccessTime) {
        oldestAccessTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.config.enableStats) {
        this.stats.evictions++;
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanExpired();
    }, this.config.cleanupInterval);

    // Don't prevent process from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    try {
      // Rough estimation
      const json = JSON.stringify(value);
      return json.length * 2; // UTF-16 characters are 2 bytes
    } catch {
      return 0;
    }
  }

  /**
   * Get all keys in cache
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all entries in cache
   */
  getAll(): CachedResponse[] {
    const now = Date.now();
    const results: CachedResponse[] = [];

    for (const [key, entry] of this.cache.entries()) {
      // Skip expired entries
      if (now > entry.expiresAt) {
        continue;
      }

      results.push({
        key,
        value: entry.value,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt,
        accessCount: entry.accessCount,
        lastAccessedAt: entry.lastAccessedAt,
      });
    }

    return results;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get TTL for key (milliseconds remaining)
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.expiresAt - now;
  }

  /**
   * Update TTL for existing key
   */
  async updateTTL(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    entry.expiresAt = Date.now() + ttl;
    return true;
  }

  /**
   * Generate cache key from data
   */
  static generateKey(data: any): string {
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(json).digest('hex');
  }

  /**
   * Generate cache key with prefix
   */
  static generateKeyWithPrefix(prefix: string, data: any): string {
    const key = CacheManager.generateKey(data);
    return `${prefix}:${key}`;
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }
}
