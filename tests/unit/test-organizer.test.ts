/**
 * Unit tests for Test Organizer
 * Tests organization strategies and file generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestOrganizer, type OrganizedTests } from '../../src/generators/test-organizer.js';
import type { TestCase, OrganizationStrategy } from '../../src/types/test-generator-types.js';

// Helper to create mock test case
function createTestCase(
  endpoint: string,
  method: string,
  type: string = 'happy-path',
  tags: string[] = []
): TestCase {
  return {
    id: `test-${endpoint}-${method}`,
    name: `Test ${method} ${endpoint}`,
    description: `Test for ${method} ${endpoint}`,
    type: type as any,
    method,
    endpoint,
    request: {
      pathParams: {},
      queryParams: {},
      headers: {},
    },
    expectedResponse: {
      status: 200,
    },
    metadata: {
      tags,
      priority: 'medium',
      stability: 'stable',
      generatedAt: new Date().toISOString(),
      generatorVersion: '1.0.0',
    },
  };
}

describe('TestOrganizer', () => {
  let organizer: TestOrganizer;

  beforeEach(() => {
    organizer = new TestOrganizer();
  });

  describe('Constructor', () => {
    it('should create organizer instance', () => {
      expect(organizer).toBeDefined();
    });
  });

  describe('organize - by-tag strategy', () => {
    it('should organize tests by primary tag', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users']),
        createTestCase('/users/{id}', 'GET', 'happy-path', ['users']),
        createTestCase('/products', 'GET', 'happy-path', ['products']),
        createTestCase('/products/{id}', 'GET', 'happy-path', ['products']),
      ];

      const organized = organizer.organize(tests, 'by-tag');

      expect(organized.strategy).toBe('by-tag');
      expect(organized.totalTests).toBe(4);
      expect(organized.files.size).toBe(2);
      expect(organized.files.has('users.spec.ts')).toBe(true);
      expect(organized.files.has('products.spec.ts')).toBe(true);
      expect(organized.files.get('users.spec.ts')).toHaveLength(2);
      expect(organized.files.get('products.spec.ts')).toHaveLength(2);
    });

    it('should handle tests with no tags', () => {
      const tests = [
        createTestCase('/api/data', 'GET', 'happy-path', []),
      ];

      const organized = organizer.organize(tests, 'by-tag');

      expect(organized.files.has('untagged.spec.ts')).toBe(true);
    });

    it('should use first tag when multiple tags exist', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users', 'admin']),
      ];

      const organized = organizer.organize(tests, 'by-tag');

      expect(organized.files.has('users.spec.ts')).toBe(true);
    });
  });

  describe('organize - by-endpoint strategy', () => {
    it('should organize tests by endpoint path', () => {
      const tests = [
        createTestCase('/users', 'GET'),
        createTestCase('/users', 'POST'),
        createTestCase('/users/{id}', 'GET'),
        createTestCase('/products', 'GET'),
      ];

      const organized = organizer.organize(tests, 'by-endpoint');

      expect(organized.strategy).toBe('by-endpoint');
      expect(organized.files.size).toBe(2);
      expect(Array.from(organized.files.keys()).some(k => k.includes('users'))).toBe(true);
      expect(Array.from(organized.files.keys()).some(k => k.includes('products'))).toBe(true);
    });

    it('should group endpoints with and without IDs together', () => {
      const tests = [
        createTestCase('/users', 'GET'),
        createTestCase('/users/{id}', 'GET'),
        createTestCase('/users/{id}', 'PUT'),
      ];

      const organized = organizer.organize(tests, 'by-endpoint');

      // All /users endpoints should be in same file
      expect(organized.files.size).toBe(1);
    });
  });

  describe('organize - by-type strategy', () => {
    it('should organize tests by test type', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path'),
        createTestCase('/users', 'POST', 'happy-path'),
        createTestCase('/users/{id}', 'GET', 'error-case'),
        createTestCase('/users/{id}', 'DELETE', 'error-case'),
        createTestCase('/login', 'POST', 'auth'),
      ];

      const organized = organizer.organize(tests, 'by-type');

      expect(organized.strategy).toBe('by-type');
      expect(organized.files.size).toBe(3);
      expect(organized.files.has('happy-path.spec.ts')).toBe(true);
      expect(organized.files.has('error-case.spec.ts')).toBe(true);
      expect(organized.files.has('auth.spec.ts')).toBe(true);
      expect(organized.files.get('happy-path.spec.ts')).toHaveLength(2);
      expect(organized.files.get('error-case.spec.ts')).toHaveLength(2);
      expect(organized.files.get('auth.spec.ts')).toHaveLength(1);
    });
  });

  describe('organize - by-method strategy', () => {
    it('should organize tests by HTTP method', () => {
      const tests = [
        createTestCase('/users', 'GET'),
        createTestCase('/products', 'GET'),
        createTestCase('/users', 'POST'),
        createTestCase('/users/{id}', 'PUT'),
        createTestCase('/users/{id}', 'DELETE'),
      ];

      const organized = organizer.organize(tests, 'by-method');

      expect(organized.strategy).toBe('by-method');
      expect(organized.files.size).toBe(4);
      expect(organized.files.has('get-tests.spec.ts')).toBe(true);
      expect(organized.files.has('post-tests.spec.ts')).toBe(true);
      expect(organized.files.has('put-tests.spec.ts')).toBe(true);
      expect(organized.files.has('delete-tests.spec.ts')).toBe(true);
      expect(organized.files.get('get-tests.spec.ts')).toHaveLength(2);
    });

    it('should handle case-insensitive methods', () => {
      const tests = [
        createTestCase('/users', 'GET'),
        createTestCase('/users', 'get'),
      ];

      const organized = organizer.organize(tests, 'by-method');

      expect(organized.files.get('get-tests.spec.ts')).toHaveLength(2);
    });
  });

  describe('organize - flat strategy', () => {
    it('should put all tests in one file', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users']),
        createTestCase('/products', 'POST', 'error-case', ['products']),
        createTestCase('/orders', 'DELETE', 'auth', ['orders']),
      ];

      const organized = organizer.organize(tests, 'flat');

      expect(organized.strategy).toBe('flat');
      expect(organized.files.size).toBe(1);
      expect(organized.files.has('all-tests.spec.ts')).toBe(true);
      expect(organized.files.get('all-tests.spec.ts')).toHaveLength(3);
    });
  });

  describe('generateTestFiles', () => {
    it('should generate test files from organized tests', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users']),
        createTestCase('/products', 'GET', 'happy-path', ['products']),
      ];

      const organized = organizer.organize(tests, 'by-tag');
      const files = organizer.generateTestFiles(organized);

      expect(files).toHaveLength(2);
      expect(files[0]?.fileName).toMatch(/\.spec\.ts$/);
      expect(files[0]?.content).toContain("import { test, expect } from '@playwright/test'");
      expect(files[0]?.tests.length).toBeGreaterThan(0);
    });

    it('should include proper imports in generated files', () => {
      const tests = [createTestCase('/users', 'GET')];
      const organized = organizer.organize(tests, 'flat');
      const files = organizer.generateTestFiles(organized);

      expect(files[0]?.content).toContain("import { test, expect }");
    });

    it('should generate valid Playwright test code', () => {
      const tests = [createTestCase('/users', 'GET')];
      const organized = organizer.organize(tests, 'flat');
      const files = organizer.generateTestFiles(organized);

      const content = files[0]?.content ?? '';
      expect(content).toContain("describe('");
      expect(content).toContain("test('");
      expect(content).toContain('async ({ request })');
      expect(content).toContain('await request.get');
      expect(content).toContain('expect(');
    });

    it('should set correct file metadata', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users']),
        createTestCase('/users/{id}', 'POST', 'error-case', ['users']),
      ];

      const organized = organizer.organize(tests, 'by-tag');
      const files = organizer.generateTestFiles(organized);

      const userFile = files.find((f) => f.fileName === 'users.spec.ts');
      expect(userFile).toBeDefined();
      expect(userFile?.metadata.testCount).toBe(2);
      expect(userFile?.metadata.endpoints).toContain('/users');
      expect(userFile?.metadata.testTypes).toContain('happy-path');
      expect(userFile?.metadata.testTypes).toContain('error-case');
      expect(userFile?.metadata.tags).toContain('users');
    });
  });

  describe('getFilePath', () => {
    it('should return correct path for by-tag strategy', () => {
      const test = createTestCase('/users', 'GET', 'happy-path', ['users']);
      const path = organizer.getFilePath(test, 'by-tag');
      expect(path).toBe('users.spec.ts');
    });

    it('should return correct path for by-endpoint strategy', () => {
      const test = createTestCase('/users/{id}', 'GET');
      const path = organizer.getFilePath(test, 'by-endpoint');
      expect(path).toContain('users');
      expect(path).toContain('.spec.ts');
    });

    it('should return correct path for by-type strategy', () => {
      const test = createTestCase('/users', 'GET', 'happy-path');
      const path = organizer.getFilePath(test, 'by-type');
      expect(path).toBe('happy-path.spec.ts');
    });

    it('should return correct path for by-method strategy', () => {
      const test = createTestCase('/users', 'POST');
      const path = organizer.getFilePath(test, 'by-method');
      expect(path).toBe('post-tests.spec.ts');
    });

    it('should return correct path for flat strategy', () => {
      const test = createTestCase('/users', 'GET');
      const path = organizer.getFilePath(test, 'flat');
      expect(path).toBe('all-tests.spec.ts');
    });
  });

  describe('getRecommendedStrategy', () => {
    it('should recommend by-tag for many tags', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path', ['users']),
        createTestCase('/products', 'GET', 'happy-path', ['products']),
        createTestCase('/orders', 'GET', 'happy-path', ['orders']),
        createTestCase('/payments', 'GET', 'happy-path', ['payments']),
        createTestCase('/shipping', 'GET', 'happy-path', ['shipping']),
        createTestCase('/inventory', 'GET', 'happy-path', ['inventory']),
      ];

      const strategy = organizer.getRecommendedStrategy(tests);
      expect(strategy).toBe('by-tag');
    });

    it('should recommend by-endpoint for many endpoints', () => {
      const tests = Array.from({ length: 15 }, (_, i) =>
        createTestCase(`/endpoint${i}`, 'GET')
      );

      const strategy = organizer.getRecommendedStrategy(tests);
      expect(strategy).toBe('by-endpoint');
    });

    it('should recommend by-type for diverse test types', () => {
      const tests = [
        createTestCase('/users', 'GET', 'happy-path'),
        createTestCase('/users', 'POST', 'error-case'),
        createTestCase('/users', 'PUT', 'auth'),
        createTestCase('/users', 'DELETE', 'edge-case'),
      ];

      const strategy = organizer.getRecommendedStrategy(tests);
      expect(strategy).toBe('by-type');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty test array', () => {
      const organized = organizer.organize([], 'by-tag');
      expect(organized.totalTests).toBe(0);
      expect(organized.files.size).toBe(0);
    });

    it('should handle unknown strategy gracefully', () => {
      const tests = [createTestCase('/users', 'GET')];
      expect(() => {
        organizer.organize(tests, 'unknown' as OrganizationStrategy);
      }).toThrow();
    });

    it('should sanitize filenames with special characters', () => {
      const tests = [
        createTestCase('/api/v1/users', 'GET', 'happy-path', ['API V1']),
      ];

      const organized = organizer.organize(tests, 'by-tag');
      const filenames = Array.from(organized.files.keys());
      expect(filenames[0]).toMatch(/^[a-z0-9-]+\.spec\.ts$/);
    });

    it('should handle very long endpoint paths', () => {
      const longPath = '/api/v1/users/{userId}/posts/{postId}/comments/{commentId}/replies';
      const tests = [createTestCase(longPath, 'GET')];

      const organized = organizer.organize(tests, 'by-endpoint');
      expect(organized.files.size).toBeGreaterThan(0);
    });
  });
});
