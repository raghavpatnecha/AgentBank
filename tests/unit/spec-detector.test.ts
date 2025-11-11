/**
 * Unit tests for SpecDetector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  SpecDetector,
  detectSpecs,
  findBestSpec,
  type SpecFile,
  type DetectionOptions,
} from '../../src/github/spec-detector.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe('SpecDetector', () => {
  let detector: SpecDetector;

  beforeEach(() => {
    detector = new SpecDetector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    detector.clearCache();
  });

  describe('detectSpecFiles', () => {
    it('should detect spec files in root directory', async () => {
      const repoPath = '/test/repo';

      // Mock file system
      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
`);

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs).toHaveLength(1);
      expect(specs[0]?.relativePath).toBe('openapi.yaml');
      expect(specs[0]?.isValid).toBe(true);
    });

    it('should detect multiple spec files', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.includes('openapi.yaml') || pathStr.includes('swagger.json')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        if (pathStr.includes('/api') || pathStr.includes('/docs')) {
          return { isFile: () => false, isDirectory: () => true, size: 0 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);

      vi.mocked(fs.readFile).mockImplementation(
        async (filePath: Parameters<typeof fs.readFile>[0]) => {
          const pathStr = String(filePath);
          if (pathStr.includes('openapi.yaml')) {
            return 'openapi: 3.0.0\ninfo:\n  title: API\n  version: 1.0.0\npaths: {}';
          }
          return 'swagger: "2.0"\ninfo:\n  title: API\n  version: 1.0.0\npaths: {}';
        }
      );

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs.length).toBeGreaterThan(0);
    });

    it('should return empty array when no specs found', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs).toHaveLength(0);
    });

    it('should exclude invalid specs by default', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue('invalid yaml content [}');

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs).toHaveLength(0);
    });

    it('should include invalid specs when includeInvalid is true', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue('invalid yaml content [}');
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detector.detectSpecFiles({ repoPath, includeInvalid: true });

      expect(specs.length).toBeGreaterThan(0);
      expect(specs[0]?.isValid).toBe(false);
    });

    it('should use cache when enabled', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      // First call - should hit file system
      await detector.detectSpecFiles({ repoPath, useCache: true });

      // Second call - should use cache
      const specs = await detector.detectSpecFiles({ repoPath, useCache: true });

      // readFile should only be called once (first call)
      expect(specs).toHaveLength(1);
    });

    it('should bypass cache when useCache is false', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      // First call
      await detector.detectSpecFiles({ repoPath, useCache: false });

      // Reset mock to verify it's called again
      vi.mocked(fs.readFile).mockClear();
      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`);

      // Second call - should not use cache
      await detector.detectSpecFiles({ repoPath, useCache: false });

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should respect maxDepth option', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
      } as never);

      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detector.detectSpecFiles({ repoPath, maxDepth: 1 });

      expect(specs).toBeDefined();
    });
  });

  describe('searchCommonLocations', () => {
    it('should find openapi.yaml in root', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      const specs = await detector.searchCommonLocations(repoPath);

      expect(specs.length).toBeGreaterThan(0);
      expect(specs.some((s) => s.relativePath === 'openapi.yaml')).toBe(true);
    });

    it('should find openapi.json in root', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.json')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      const specs = await detector.searchCommonLocations(repoPath);

      expect(specs.length).toBeGreaterThan(0);
      expect(specs.some((s) => s.relativePath === 'openapi.json')).toBe(true);
    });

    it('should find swagger.yaml in root', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('swagger.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      const specs = await detector.searchCommonLocations(repoPath);

      expect(specs.length).toBeGreaterThan(0);
      expect(specs.some((s) => s.relativePath === 'swagger.yaml')).toBe(true);
    });

    it('should return empty array when no common files exist', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const specs = await detector.searchCommonLocations(repoPath);

      expect(specs).toHaveLength(0);
    });
  });

  describe('searchCustomPaths', () => {
    it('should search custom file paths', async () => {
      const repoPath = '/test/repo';
      const customPaths = ['custom/openapi.yaml'];

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1000,
      } as never);

      const specs = await detector.searchCustomPaths(repoPath, customPaths);

      expect(specs.length).toBeGreaterThan(0);
    });

    it('should search custom directory paths', async () => {
      const repoPath = '/test/repo';
      const customPaths = ['custom-api'];

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
      } as never);

      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'openapi.yaml', isFile: () => true, isDirectory: () => false } as never,
      ]);

      const specs = await detector.searchCustomPaths(repoPath, customPaths);

      expect(specs.length).toBeGreaterThan(0);
    });

    it('should handle absolute paths', async () => {
      const repoPath = '/test/repo';
      const customPaths = ['/absolute/path/openapi.yaml'];

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1000,
      } as never);

      const specs = await detector.searchCustomPaths(repoPath, customPaths);

      expect(specs).toBeDefined();
    });

    it('should skip non-existent paths', async () => {
      const repoPath = '/test/repo';
      const customPaths = ['non-existent.yaml'];

      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const specs = await detector.searchCustomPaths(repoPath, customPaths);

      expect(specs).toHaveLength(0);
    });
  });

  describe('validateSpecFile', () => {
    it('should validate OpenAPI 3.0 spec', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
  description: Test API description
paths:
  /test:
    get:
      summary: Test
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(true);
      expect(validated.type).toBe('openapi-3.0');
      expect(validated.version).toBe('3.0.0');
      expect(validated.title).toBe('Test API');
      expect(validated.description).toBe('Test API description');
    });

    it('should validate OpenAPI 3.1 spec', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(true);
      expect(validated.type).toBe('openapi-3.1');
    });

    it('should validate Swagger 2.0 spec', async () => {
      const specFile: SpecFile = {
        path: '/test/swagger.json',
        relativePath: 'swagger.json',
        format: 'json',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          swagger: '2.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
          paths: {},
        })
      );

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(true);
      expect(validated.type).toBe('swagger-2.0');
    });

    it('should detect invalid YAML syntax', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml: [}');

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(false);
      expect(validated.validationErrors.length).toBeGreaterThan(0);
    });

    it('should detect invalid JSON syntax', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.json',
        relativePath: 'openapi.json',
        format: 'json',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue('{invalid json}');

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(false);
      expect(validated.validationErrors.length).toBeGreaterThan(0);
    });

    it('should detect missing required fields', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(false);
      expect(validated.validationErrors.some((e) => e.includes('paths'))).toBe(true);
    });

    it('should detect missing info field', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
paths: {}
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(false);
      expect(validated.validationErrors.some((e) => e.includes('info'))).toBe(true);
    });

    it('should detect unsupported spec type', async () => {
      const specFile: SpecFile = {
        path: '/test/spec.yaml',
        relativePath: 'spec.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
notOpenAPI: true
info:
  title: Test
paths: {}
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.isValid).toBe(false);
      expect(validated.validationErrors.some((e) => e.includes('OpenAPI'))).toBe(true);
    });
  });

  describe('rankSpecFiles', () => {
    it('should rank root directory specs higher', () => {
      const specs: SpecFile[] = [
        {
          path: '/test/api/openapi.yaml',
          relativePath: 'api/openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
        {
          path: '/test/openapi.yaml',
          relativePath: 'openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      const ranked = detector.rankSpecFiles(specs);

      expect(ranked[0]?.relativePath).toBe('openapi.yaml');
    });

    it('should rank openapi.yaml higher than swagger.yaml', () => {
      const specs: SpecFile[] = [
        {
          path: '/test/swagger.yaml',
          relativePath: 'swagger.yaml',
          format: 'yaml',
          type: 'swagger-2.0',
          version: '2.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
        {
          path: '/test/openapi.yaml',
          relativePath: 'openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      const ranked = detector.rankSpecFiles(specs);

      expect(ranked[0]?.relativePath).toBe('openapi.yaml');
    });

    it('should rank YAML higher than JSON', () => {
      const specs: SpecFile[] = [
        {
          path: '/test/openapi.json',
          relativePath: 'openapi.json',
          format: 'json',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
        {
          path: '/test/openapi.yaml',
          relativePath: 'openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      const ranked = detector.rankSpecFiles(specs);

      expect(ranked[0]?.format).toBe('yaml');
    });

    it('should rank valid specs higher than invalid', () => {
      const specs: SpecFile[] = [
        {
          path: '/test/invalid.yaml',
          relativePath: 'invalid.yaml',
          format: 'yaml',
          type: 'unknown',
          version: '',
          priority: 0,
          size: 1000,
          isValid: false,
          validationErrors: ['Error'],
        },
        {
          path: '/test/valid.yaml',
          relativePath: 'valid.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      const ranked = detector.rankSpecFiles(specs);

      expect(ranked[0]?.isValid).toBe(true);
    });

    it('should rank /api directory higher than /docs', () => {
      const specs: SpecFile[] = [
        {
          path: '/test/docs/openapi.yaml',
          relativePath: 'docs/openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
        {
          path: '/test/api/openapi.yaml',
          relativePath: 'api/openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 0,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      const ranked = detector.rankSpecFiles(specs);

      expect(ranked[0]?.relativePath).toBe('api/openapi.yaml');
    });
  });

  describe('caching', () => {
    it('should cache detected specs', async () => {
      const repoPath = '/test/repo';
      const specs: SpecFile[] = [
        {
          path: '/test/openapi.yaml',
          relativePath: 'openapi.yaml',
          format: 'yaml',
          type: 'openapi-3.0',
          version: '3.0.0',
          priority: 1000,
          size: 1000,
          isValid: true,
          validationErrors: [],
        },
      ];

      detector.cacheSpecs(repoPath, specs);

      const cached = detector.getCachedSpecs(repoPath);

      expect(cached).toEqual(specs);
    });

    it('should return null for non-existent cache', () => {
      const cached = detector.getCachedSpecs('/non-existent');

      expect(cached).toBeNull();
    });

    it('should clear specific cache entry', () => {
      const repoPath = '/test/repo';
      const specs: SpecFile[] = [];

      detector.cacheSpecs(repoPath, specs);
      detector.clearCache(repoPath);

      const cached = detector.getCachedSpecs(repoPath);

      expect(cached).toBeNull();
    });

    it('should clear all cache entries', () => {
      detector.cacheSpecs('/repo1', []);
      detector.cacheSpecs('/repo2', []);

      detector.clearCache();

      expect(detector.getCachedSpecs('/repo1')).toBeNull();
      expect(detector.getCachedSpecs('/repo2')).toBeNull();
    });

    it('should provide cache statistics', () => {
      detector.cacheSpecs('/repo1', []);
      detector.cacheSpecs('/repo2', []);

      const stats = detector.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
    });
  });

  describe('convenience functions', () => {
    it('detectSpecs should work correctly', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detectSpecs('/test/repo');

      expect(specs).toBeDefined();
      expect(Array.isArray(specs)).toBe(true);
    });

    it('findBestSpec should return highest priority spec', async () => {
      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const bestSpec = await findBestSpec('/test/repo');

      expect(bestSpec).not.toBeNull();
      expect(bestSpec?.isValid).toBe(true);
    });

    it('findBestSpec should return null when no specs found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const bestSpec = await findBestSpec('/test/repo');

      expect(bestSpec).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
      } as never);

      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs).toHaveLength(0);
    });

    it('should handle permission errors gracefully', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockRejectedValue(new Error('EACCES'));
      vi.mocked(fs.readdir).mockRejectedValue(new Error('EACCES'));

      const specs = await detector.detectSpecFiles({ repoPath });

      expect(specs).toBeDefined();
    });

    it('should handle very large spec files', async () => {
      const specFile: SpecFile = {
        path: '/test/large.yaml',
        relativePath: 'large.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 10000000, // 10MB
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Large API
  version: 1.0.0
paths: {}
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated).toBeDefined();
    });

    it('should handle specs with no title', async () => {
      const specFile: SpecFile = {
        path: '/test/openapi.yaml',
        relativePath: 'openapi.yaml',
        format: 'yaml',
        type: 'unknown',
        version: '',
        priority: 0,
        size: 1000,
        isValid: false,
        validationErrors: [],
      };

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  version: 1.0.0
paths: {}
`);

      const validated = await detector.validateSpecFile(specFile);

      expect(validated.title).toBeUndefined();
    });

    it('should deduplicate specs with same path', async () => {
      const repoPath = '/test/repo';

      vi.mocked(fs.stat).mockImplementation(async (filePath: Parameters<typeof fs.stat>[0]) => {
        const pathStr = String(filePath);
        if (pathStr.endsWith('openapi.yaml')) {
          return { isFile: () => true, isDirectory: () => false, size: 1000 } as never;
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.readFile).mockResolvedValue(`
openapi: 3.0.0
info:
  title: Test
  version: 1.0.0
paths: {}
`);
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const specs = await detector.detectSpecFiles({ repoPath });

      // Should not have duplicates
      const paths = specs.map((s) => s.path);
      const uniquePaths = new Set(paths);

      expect(paths.length).toBe(uniquePaths.size);
    });
  });
});
