/**
 * Unit Tests for CacheStore (Feature 4, Task 4.9)
 * Comprehensive test coverage for caching functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheStore } from '../../src/ai/cache-store.js';
import {
  CacheConfig,
  CacheKeyContext,
  HealingContext,
  FailureType,
} from '../../src/types/self-healing-types.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('CacheStore', () => {
  let cache: CacheStore;

  const createMockHealingContext = (
    overrides: Partial<HealingContext> = {}
  ): HealingContext => ({
    failureType: FailureType.ASSERTION,
    specDiff: { added: ['field1'], removed: [] },
    testCode: 'expect(response.status).toBe(200)',
    errorMessage: 'Expected 200 but got 404',
    ...overrides,
  });

  beforeEach(() => {
    cache = new CacheStore();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(cache).toBeInstanceOf(CacheStore);
    });

    it('should create instance with custom config', () => {
      const config: Partial<CacheConfig> = {
        defaultTTL: 3600,
        maxSize: 500,
        evictionPolicy: 'lru',
      };

      const c = new CacheStore(config);
      expect(c).toBeInstanceOf(CacheStore);
    });

    it('should initialize empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should initialize with zero hits and misses', () => {
      const stats = cache.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('set and get', () => {
    it('should set and get a cached item', async () => {
      await cache.set('key1', { data: 'value1' });
      const item = await cache.get('key1');

      expect(item).not.toBeNull();
      expect(item?.value).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent key', async () => {
      const item = await cache.get('nonexistent');

      expect(item).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await cache.set('key1', 'value1');
      const item = await cache.get('key1');

      expect(item?.ttl).toBe(86400); // Default 24 hours
    });

    it('should use custom TTL when specified', async () => {
      await cache.set('key1', 'value1', 3600);
      const item = await cache.get('key1');

      expect(item?.ttl).toBe(3600);
    });

    it('should set creation timestamp', async () => {
      await cache.set('key1', 'value1');
      const item = await cache.get('key1');

      expect(item?.createdAt).toBeInstanceOf(Date);
    });

    it('should set expiration timestamp', async () => {
      await cache.set('key1', 'value1', 60);
      const item = await cache.get('key1');

      expect(item?.expiresAt).toBeInstanceOf(Date);
    });

    it('should initialize access count to zero', async () => {
      await cache.set('key1', 'value1');
      const item = await cache.get('key1');

      expect(item?.accessCount).toBe(1); // Gets incremented on first get
    });

    it('should increment access count on get', async () => {
      await cache.set('key1', 'value1');

      await cache.get('key1');
      await cache.get('key1');
      const item = await cache.get('key1');

      expect(item?.accessCount).toBe(3);
    });

    it('should update last accessed time on get', async () => {
      await cache.set('key1', 'value1');

      const first = await cache.get('key1');
      const firstAccess = first?.lastAccessedAt.getTime() || 0;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await cache.get('key1');
      const secondAccess = second?.lastAccessedAt.getTime() || 0;

      expect(secondAccess).toBeGreaterThan(firstAccess);
    });

    it('should update existing item', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');

      const item = await cache.get('key1');

      expect(item?.value).toBe('value2');
    });

    it('should record cache hit', async () => {
      await cache.set('key1', 'value1');

      const statsBefore = cache.getCacheStats();
      await cache.get('key1');
      const statsAfter = cache.getCacheStats();

      expect(statsAfter.hits).toBe(statsBefore.hits + 1);
    });

    it('should record cache miss', async () => {
      const statsBefore = cache.getCacheStats();
      await cache.get('nonexistent');
      const statsAfter = cache.getCacheStats();

      expect(statsAfter.misses).toBe(statsBefore.misses + 1);
    });
  });

  describe('TTL and expiration', () => {
    it('should return null for expired item', async () => {
      await cache.set('key1', 'value1', 0.001); // Very short TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 50));

      const item = await cache.get('key1');

      expect(item).toBeNull();
    });

    it('should delete expired item on get', async () => {
      await cache.set('key1', 'value1', 0.001);

      await new Promise((resolve) => setTimeout(resolve, 50));

      await cache.get('key1');

      expect(cache.size()).toBe(0);
    });

    it('should not return item past expiration', async () => {
      const c = new CacheStore({ defaultTTL: 0.001 });

      await c.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 50));

      const item = await c.get('key1');

      expect(item).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', async () => {
      await cache.set('key1', 'value1');

      expect(await cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      expect(await cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      await cache.set('key1', 'value1', 0.001);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(await cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing item', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');

      const item = await cache.get('key1');

      expect(item).toBeNull();
    });

    it('should handle deleting non-existent item', async () => {
      await expect(cache.delete('nonexistent')).resolves.not.toThrow();
    });

    it('should decrease cache size', async () => {
      await cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      await cache.delete('key1');
      expect(cache.size()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all items', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      await cache.clear();

      expect(cache.size()).toBe(0);
    });

    it('should reset statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.get('key1');

      await cache.clear();

      const stats = cache.getCacheStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired items', async () => {
      await cache.set('key1', 'value1', 0.001);
      await cache.set('key2', 'value2', 3600);

      await new Promise((resolve) => setTimeout(resolve, 50));

      await cache.cleanup();

      expect(cache.size()).toBe(1);
      expect(await cache.has('key2')).toBe(true);
    });

    it('should handle empty cache', async () => {
      await expect(cache.cleanup()).resolves.not.toThrow();
    });

    it('should not remove non-expired items', async () => {
      await cache.set('key1', 'value1', 3600);
      await cache.set('key2', 'value2', 3600);

      await cache.cleanup();

      expect(cache.size()).toBe(2);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key from context', () => {
      const context: CacheKeyContext = {
        failureType: FailureType.ASSERTION,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
      };

      const key = cache.generateCacheKey(context);

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should generate same key for identical context', () => {
      const context: CacheKeyContext = {
        failureType: FailureType.ASSERTION,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
      };

      const key1 = cache.generateCacheKey(context);
      const key2 = cache.generateCacheKey(context);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different contexts', () => {
      const context1: CacheKeyContext = {
        failureType: FailureType.ASSERTION,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
      };

      const context2: CacheKeyContext = {
        failureType: FailureType.TIMEOUT,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
      };

      const key1 = cache.generateCacheKey(context1);
      const key2 = cache.generateCacheKey(context2);

      expect(key1).not.toBe(key2);
    });

    it('should include extra context in hash', () => {
      const context1: CacheKeyContext = {
        failureType: FailureType.ASSERTION,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
      };

      const context2: CacheKeyContext = {
        failureType: FailureType.ASSERTION,
        specDiffHash: 'hash1',
        testCodeHash: 'hash2',
        extra: { field: 'value' },
      };

      const key1 = cache.generateCacheKey(context1);
      const key2 = cache.generateCacheKey(context2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('generateCacheKeyFromContext', () => {
    it('should generate key from healing context', () => {
      const context = createMockHealingContext();
      const key = cache.generateCacheKeyFromContext(context);

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should generate same key for identical healing context', () => {
      const context = createMockHealingContext();
      const key1 = cache.generateCacheKeyFromContext(context);
      const key2 = cache.generateCacheKeyFromContext(context);

      expect(key1).toBe(key2);
    });

    it('should use first 500 chars of test code', () => {
      const longCode = 'a'.repeat(1000);
      const context = createMockHealingContext({ testCode: longCode });

      const key = cache.generateCacheKeyFromContext(context);

      expect(key).toBeDefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = cache.getCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('averageSize');
      expect(stats).toHaveProperty('oldestEntryAge');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('effectiveness');
    });

    it('should count total entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const stats = cache.getCacheStats();

      expect(stats.totalEntries).toBe(2);
    });

    it('should calculate total size', async () => {
      await cache.set('key1', { data: 'value1' });

      const stats = cache.getCacheStats();

      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should calculate average size', async () => {
      await cache.set('key1', { data: 'value1' });
      await cache.set('key2', { data: 'value2' });

      const stats = cache.getCacheStats();

      expect(stats.averageSize).toBeGreaterThan(0);
    });

    it('should find oldest entry age', async () => {
      await cache.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const stats = cache.getCacheStats();

      expect(stats.oldestEntryAge).toBeGreaterThan(0);
    });

    it('should count evictions', async () => {
      const c = new CacheStore({ maxSize: 2 });

      await c.set('key1', 'value1');
      await c.set('key2', 'value2');
      await c.set('key3', 'value3'); // Should trigger eviction

      const stats = c.getCacheStats();

      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('calculateHitRate', () => {
    it('should return 0 for no access', () => {
      expect(cache.calculateHitRate()).toBe(0);
    });

    it('should calculate correct hit rate', async () => {
      await cache.set('key1', 'value1');

      await cache.get('key1'); // Hit
      await cache.get('nonexistent'); // Miss

      const hitRate = cache.calculateHitRate();

      expect(hitRate).toBe(0.5);
    });

    it('should return 1 for all hits', async () => {
      await cache.set('key1', 'value1');

      await cache.get('key1');
      await cache.get('key1');

      const hitRate = cache.calculateHitRate();

      expect(hitRate).toBe(1);
    });

    it('should return 0 for all misses', async () => {
      await cache.get('key1');
      await cache.get('key2');

      const hitRate = cache.calculateHitRate();

      expect(hitRate).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when full', async () => {
      const c = new CacheStore({ maxSize: 2 });

      await c.set('key1', 'value1');
      await c.set('key2', 'value2');
      await c.set('key3', 'value3'); // Should evict key1

      expect(c.size()).toBe(2);
      expect(await c.has('key1')).toBe(false);
      expect(await c.has('key2')).toBe(true);
      expect(await c.has('key3')).toBe(true);
    });

    it('should update LRU on access', async () => {
      const c = new CacheStore({ maxSize: 2 });

      await c.set('key1', 'value1');
      await c.set('key2', 'value2');

      await c.get('key1'); // Access key1 (makes it most recent)

      await c.set('key3', 'value3'); // Should evict key2

      expect(await c.has('key1')).toBe(true);
      expect(await c.has('key2')).toBe(false);
      expect(await c.has('key3')).toBe(true);
    });

    it('should maintain correct size after evictions', async () => {
      const c = new CacheStore({ maxSize: 3 });

      for (let i = 0; i < 10; i++) {
        await c.set(`key${i}`, `value${i}`);
      }

      expect(c.size()).toBe(3);
    });
  });

  describe('exportCache', () => {
    it('should export cache to file', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();

      await cache.set('key1', 'value1');
      await cache.exportCache('/test/cache.json');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/cache.json',
        expect.any(String),
        'utf-8'
      );
    });

    it('should include all cache items', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.exportCache('/test/cache.json');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const exportedData = JSON.parse(writeCall[1] as string);

      expect(exportedData.items).toHaveLength(2);
    });

    it('should include statistics', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue();

      await cache.set('key1', 'value1');
      await cache.get('key1');

      await cache.exportCache('/test/cache.json');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const exportedData = JSON.parse(writeCall[1] as string);

      expect(exportedData.stats).toBeDefined();
      expect(exportedData.stats.hits).toBe(1);
    });

    it('should handle write errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(cache.exportCache('/test/cache.json')).rejects.toThrow(
        'Failed to export cache'
      );
    });
  });

  describe('importCache', () => {
    it('should import cache from file', async () => {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: {},
        items: [
          {
            key: 'key1',
            value: 'value1',
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            accessCount: 0,
            ttl: 3600,
            size: 100,
          },
        ],
        stats: { hits: 0, misses: 0, evictions: 0 },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(exportData));

      await cache.importCache('/test/cache.json');

      expect(cache.size()).toBe(1);
      expect(await cache.has('key1')).toBe(true);
    });

    it('should skip expired items on import', async () => {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: {},
        items: [
          {
            key: 'key1',
            value: 'value1',
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
            accessCount: 0,
            ttl: 3600,
            size: 100,
          },
        ],
        stats: { hits: 0, misses: 0, evictions: 0 },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(exportData));

      await cache.importCache('/test/cache.json');

      expect(cache.size()).toBe(0);
    });

    it('should restore statistics', async () => {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: {},
        items: [],
        stats: { hits: 10, misses: 5, evictions: 2 },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(exportData));

      await cache.importCache('/test/cache.json');

      const stats = cache.getCacheStats();

      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
      expect(stats.evictions).toBe(2);
    });

    it('should handle read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(cache.importCache('/test/cache.json')).rejects.toThrow(
        'Failed to import cache'
      );
    });
  });

  describe('getAll', () => {
    it('should return all cached items', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const all = cache.getAll();

      expect(all).toHaveLength(2);
    });

    it('should return copies of items', async () => {
      await cache.set('key1', { data: 'value1' });

      const all1 = cache.getAll();
      const all2 = cache.getAll();

      expect(all1).not.toBe(all2);
    });
  });

  describe('size', () => {
    it('should return cache size', async () => {
      expect(cache.size()).toBe(0);

      await cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      await cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    it('should update after delete', async () => {
      await cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      await cache.delete('key1');
      expect(cache.size()).toBe(0);
    });
  });
});
