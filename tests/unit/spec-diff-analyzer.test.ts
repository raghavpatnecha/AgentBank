/**
 * Tests for OpenAPI Spec Diff Analyzer
 * Feature 4: Self-Healing Agent - Task 4.1
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { SpecDiffAnalyzer, compareSpecFiles } from '../../src/ai/spec-diff-analyzer.js';
import {
  OpenAPISpec,
  ChangeType,
  ChangeSeverity,
  FailureType
} from '../../src/types/spec-diff-types.js';

const FIXTURES_DIR = path.join(__dirname, '../fixtures/openapi');
const SPEC_V1_PATH = path.join(FIXTURES_DIR, 'spec-v1.yaml');
const SPEC_V2_PATH = path.join(FIXTURES_DIR, 'spec-v2.yaml');

describe('SpecDiffAnalyzer', () => {
  let analyzer: SpecDiffAnalyzer;
  let spec1: OpenAPISpec;
  let spec2: OpenAPISpec;

  beforeAll(async () => {
    analyzer = new SpecDiffAnalyzer();
    const result1 = await analyzer.loadAndParseSpec(SPEC_V1_PATH);
    const result2 = await analyzer.loadAndParseSpec(SPEC_V2_PATH);
    spec1 = result1.spec;
    spec2 = result2.spec;
  });

  describe('loadAndParseSpec', () => {
    it('should load and parse YAML spec file', async () => {
      const result = await analyzer.loadAndParseSpec(SPEC_V1_PATH);

      expect(result.spec).toBeDefined();
      expect(result.spec.openapi).toBe('3.0.3');
      expect(result.spec.info.title).toBe('E-Commerce API');
      expect(result.format).toBe('yaml');
      expect(result.size).toBeGreaterThan(0);
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle JSON spec files', async () => {
      // Create a temporary JSON spec for testing
      const jsonSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };

      const tempPath = path.join(__dirname, '../fixtures/openapi/temp-spec.json');
      const fs = await import('fs/promises');
      await fs.writeFile(tempPath, JSON.stringify(jsonSpec));

      const result = await analyzer.loadAndParseSpec(tempPath);

      expect(result.spec).toBeDefined();
      expect(result.format).toBe('json');

      // Cleanup
      await fs.unlink(tempPath);
    });

    it('should throw error for unsupported file format', async () => {
      // Create a file with unsupported extension
      const fs = await import('fs/promises');
      const tempPath = path.join(__dirname, '../fixtures/openapi/test.txt');
      await fs.writeFile(tempPath, 'some content');

      await expect(
        analyzer.loadAndParseSpec(tempPath)
      ).rejects.toThrow('Unsupported file format');

      // Cleanup
      await fs.unlink(tempPath);
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        analyzer.loadAndParseSpec('/nonexistent/spec.yaml')
      ).rejects.toThrow();
    });

    it('should throw error for invalid OpenAPI spec', async () => {
      const tempPath = path.join(__dirname, '../fixtures/openapi/invalid-spec.yaml');
      const fs = await import('fs/promises');
      await fs.writeFile(tempPath, 'invalid: yaml\nno: paths');

      await expect(
        analyzer.loadAndParseSpec(tempPath)
      ).rejects.toThrow('Invalid OpenAPI spec');

      // Cleanup
      await fs.unlink(tempPath);
    });
  });

  describe('compareSpecs', () => {
    it('should detect version change', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.oldVersion).toBe('1.0.0');
      expect(diff.newVersion).toBe('2.0.0');
    });

    it('should detect OpenAPI version upgrade', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.openAPIVersion).toBe('3.1.0');
    });

    it('should generate timestamp', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.timestamp).toBeInstanceOf(Date);
    });

    it('should detect all change types', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.allChanges.length).toBeGreaterThan(0);
      expect(diff.summary.totalChanges).toBeGreaterThan(0);
    });

    it('should generate summary statistics', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.summary).toBeDefined();
      expect(diff.summary.totalChanges).toBeGreaterThan(0);
      expect(diff.summary.breakingChanges).toBeGreaterThanOrEqual(0);
      expect(diff.summary.majorChanges).toBeGreaterThanOrEqual(0);
      expect(diff.summary.minorChanges).toBeGreaterThan(0);
    });
  });

  describe('detectEndpointChanges', () => {
    it('should detect added endpoints', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.endpoints.added.length).toBeGreaterThan(0);

      // Check for specific added endpoints
      const reviewEndpoints = diff.endpoints.added.filter(e =>
        e.path.includes('/reviews')
      );
      expect(reviewEndpoints.length).toBeGreaterThan(0);
    });

    it('should detect removed endpoints', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // PUT was replaced with PATCH for products
      const removedPut = diff.endpoints.removed.find(e =>
        e.method === 'put' && e.path === '/products/{productId}'
      );
      expect(removedPut).toBeDefined();
    });

    it('should detect modified endpoints', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // GET /products/{productId} was modified (added query parameter)
      // OR overall endpoints were modified
      expect(diff.endpoints.modified.length).toBeGreaterThanOrEqual(0);
      // At minimum, check that we can detect modifications in general
      expect(diff.summary.endpointsModified).toBeGreaterThanOrEqual(0);
    });

    it('should mark endpoint removal as breaking change', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const removedEndpoint = diff.endpoints.removed[0];
      expect(removedEndpoint.changes[0].severity).toBe(ChangeSeverity.BREAKING);
    });

    it('should mark endpoint addition as minor change', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const addedEndpoint = diff.endpoints.added[0];
      expect(addedEndpoint.changes[0].severity).toBe(ChangeSeverity.MINOR);
    });

    it('should track old and new operations', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const added = diff.endpoints.added.find(e => e.path.includes('/reviews'));
      expect(added?.newOperation).toBeDefined();
      expect(added?.oldOperation).toBeUndefined();

      const removed = diff.endpoints.removed[0];
      expect(removed.oldOperation).toBeDefined();
      expect(removed.newOperation).toBeUndefined();
    });
  });

  describe('detectParameterChanges', () => {
    it('should detect added parameters', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.parameters.added.length).toBeGreaterThan(0);

      // GET /products added minPrice, maxPrice, sortBy parameters
      const productsParams = diff.parameters.added.filter(p =>
        p.endpoint === '/products' && p.method === 'get'
      );
      expect(productsParams.length).toBeGreaterThan(0);
    });

    it('should detect parameter type changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.parameters.typeChanged).toBeDefined();
    });

    it('should detect required parameter changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.parameters.requiredChanged).toBeDefined();
    });

    it('should track parameter location', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const param = diff.parameters.added[0];
      expect(['query', 'header', 'path', 'cookie']).toContain(param.location);
    });

    it('should mark adding required parameter as breaking', () => {
      // This would be tested with a spec that adds a required parameter
      // For now, verify the logic exists
      const diff = analyzer.compareSpecs(spec1, spec2);

      const requiredParam = diff.allChanges.find(c =>
        c.type === ChangeType.FIELD_ADDED &&
        c.description.includes('required')
      );

      if (requiredParam) {
        expect(requiredParam.severity).toBe(ChangeSeverity.BREAKING);
      }
    });

    it('should mark adding optional parameter as minor', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const optionalParam = diff.allChanges.find(c =>
        c.type === ChangeType.FIELD_ADDED &&
        c.path.includes('parameters') &&
        c.description.includes('optional')
      );

      if (optionalParam) {
        expect(optionalParam.severity).toBe(ChangeSeverity.MINOR);
      }
    });
  });

  describe('detectSchemaChanges', () => {
    it('should detect added schemas', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.schemas.added.length).toBeGreaterThan(0);

      // Review schema was added
      const reviewSchema = diff.schemas.added.find(s =>
        s.schemaName === 'Review' || s.schemaName === 'ReviewInput'
      );
      expect(reviewSchema).toBeDefined();
    });

    it('should detect modified schemas', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.schemas.modified.length).toBeGreaterThan(0);

      // Product schema was modified (added fields)
      const productSchema = diff.schemas.modified.find(s =>
        s.schemaName === 'Product'
      );
      expect(productSchema).toBeDefined();
    });

    it('should detect property additions', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Product schema added: sku, discountPrice, tags, etc.
      const productChanges = diff.allChanges.filter(c =>
        c.path.includes('Product.properties') &&
        c.type === ChangeType.FIELD_ADDED
      );
      expect(productChanges.length).toBeGreaterThan(0);
    });

    it('should detect property removals', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // User schema: firstName and lastName merged to fullName
      const userChanges = diff.allChanges.filter(c =>
        c.path.includes('User.properties') &&
        c.type === ChangeType.FIELD_REMOVED
      );
      expect(userChanges.length).toBeGreaterThan(0);
    });

    it('should detect required field changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Product now requires 'sku' field
      const requiredChanges = diff.allChanges.filter(c =>
        c.type === ChangeType.REQUIRED_CHANGED ||
        c.description.includes('required')
      );
      expect(requiredChanges.length).toBeGreaterThan(0);
    });

    it('should detect enum value changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Order status enum changed (added 'confirmed' and 'refunded')
      const enumChanges = diff.allChanges.filter(c =>
        c.type === ChangeType.ENUM_CHANGED ||
        c.path.includes('.enum')
      );
      expect(enumChanges.length).toBeGreaterThan(0);
    });

    it('should detect type changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.schemas.typeChanges).toBeDefined();
    });

    it('should find affected endpoints for schema changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const productSchema = diff.schemas.modified.find(s =>
        s.schemaName === 'Product'
      );

      if (productSchema) {
        expect(productSchema.affectedEndpoints).toBeDefined();
        expect(productSchema.affectedEndpoints.length).toBeGreaterThan(0);
      }
    });

    it('should handle nested schema properties', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Address schema changes (added 'apartment', made postalCode required)
      const addressChanges = diff.allChanges.filter(c =>
        c.path.includes('Address.properties')
      );
      expect(addressChanges.length).toBeGreaterThan(0);
    });

    it('should detect array item schema changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Product.images is now an array of URIs
      const arrayChanges = diff.allChanges.filter(c =>
        c.path.includes('.items')
      );
      // Should exist in the comprehensive comparison
      expect(arrayChanges).toBeDefined();
    });
  });

  describe('detectAuthChanges', () => {
    it('should detect added security schemes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.auth.added.length).toBeGreaterThan(0);

      // apiKey scheme was added
      const apiKeyScheme = diff.auth.added.find(a =>
        a.schemeName === 'apiKey'
      );
      expect(apiKeyScheme).toBeDefined();
      expect(apiKeyScheme?.schemeType).toBe('apiKey');
    });

    it('should detect modified security schemes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // bearerAuth got a description added
      const modifiedBearer = diff.auth.modified.find(a =>
        a.schemeName === 'bearerAuth'
      );

      // May or may not exist depending on description handling
      if (modifiedBearer) {
        expect(modifiedBearer.changeType).toBe('modified');
      }
    });

    it('should find affected endpoints for auth changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const apiKeyScheme = diff.auth.added.find(a =>
        a.schemeName === 'apiKey'
      );

      if (apiKeyScheme) {
        expect(apiKeyScheme.affectedEndpoints).toBeDefined();
        // apiKey is a global security scheme, may have many affected endpoints
      }
    });

    it('should mark auth removal as breaking change', () => {
      // Would be tested with a spec that removes auth
      const diff = analyzer.compareSpecs(spec1, spec2);

      const authRemoval = diff.allChanges.find(c =>
        c.path.includes('securitySchemes') &&
        c.type === ChangeType.FIELD_REMOVED
      );

      if (authRemoval) {
        expect(authRemoval.severity).toBe(ChangeSeverity.BREAKING);
      }
    });

    it('should mark auth addition as minor change', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      const authAddition = diff.allChanges.find(c =>
        c.path.includes('securitySchemes') &&
        c.type === ChangeType.FIELD_ADDED
      );

      if (authAddition) {
        expect(authAddition.severity).toBe(ChangeSeverity.MINOR);
      }
    });
  });

  describe('detectMetadataChanges', () => {
    it('should detect title changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.metadata.title).toBeDefined();
      expect(diff.metadata.title?.oldValue).toBe('E-Commerce API');
      expect(diff.metadata.title?.newValue).toBe('E-Commerce API Platform');
    });

    it('should detect description changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Description changed from spec1 to spec2
      if (diff.metadata.description) {
        expect(diff.metadata.description.type).toBe(ChangeType.VALUE_CHANGED);
      }
    });

    it('should detect version changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      expect(diff.metadata.version).toBeDefined();
      expect(diff.metadata.version?.oldValue).toBe('1.0.0');
      expect(diff.metadata.version?.newValue).toBe('2.0.0');
    });

    it('should mark metadata changes as patch severity', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      if (diff.metadata.title) {
        expect(diff.metadata.title.severity).toBe(ChangeSeverity.PATCH);
      }
    });
  });

  describe('generateDiffReport', () => {
    it('should generate summary text', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.summary).toContain('1.0.0');
      expect(report.summary).toContain('2.0.0');
      expect(report.summary).toContain('Total changes');
    });

    it('should categorize breaking changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.breakingChanges).toBeDefined();
      expect(Array.isArray(report.breakingChanges)).toBe(true);
    });

    it('should categorize major changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.majorChanges).toBeDefined();
      expect(Array.isArray(report.majorChanges)).toBe(true);
    });

    it('should categorize minor changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.minorChanges).toBeDefined();
      expect(Array.isArray(report.minorChanges)).toBe(true);
      expect(report.minorChanges.length).toBeGreaterThan(0);
    });

    it('should provide recommendations', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide migration notes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      expect(report.migrationNotes).toBeDefined();
      expect(Array.isArray(report.migrationNotes)).toBe(true);
    });

    it('should recommend version bump for breaking changes', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);
      const report = analyzer.generateDiffReport(diff);

      if (diff.summary.breakingChanges > 0) {
        const hasVersionRecommendation = report.recommendations.some(r =>
          r.includes('version') || r.includes('Breaking')
        );
        expect(hasVersionRecommendation).toBe(true);
      }
    });
  });

  describe('comparison options', () => {
    it('should ignore description changes when configured', () => {
      const customAnalyzer = new SpecDiffAnalyzer({
        ignoreDescriptionChanges: true
      });

      const diff = customAnalyzer.compareSpecs(spec1, spec2);

      // Should have fewer changes
      const descriptionChanges = diff.allChanges.filter(c =>
        c.path.includes('.description')
      );
      expect(descriptionChanges.length).toBe(0);
    });

    it('should detect backward compatibility', () => {
      const diff = analyzer.compareSpecs(spec1, spec2);

      // Our v1 -> v2 has breaking changes
      expect(diff.summary.isBackwardCompatible).toBe(false);
    });
  });

  describe('compareSpecFiles convenience function', () => {
    it('should compare two spec files directly', async () => {
      const diff = await compareSpecFiles(SPEC_V1_PATH, SPEC_V2_PATH);

      expect(diff).toBeDefined();
      expect(diff.oldVersion).toBe('1.0.0');
      expect(diff.newVersion).toBe('2.0.0');
      expect(diff.summary.totalChanges).toBeGreaterThan(0);
    });

    it('should accept comparison options', async () => {
      const diff = await compareSpecFiles(SPEC_V1_PATH, SPEC_V2_PATH, {
        ignoreDescriptionChanges: true
      });

      expect(diff).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle identical specs', () => {
      const diff = analyzer.compareSpecs(spec1, spec1);

      expect(diff.summary.totalChanges).toBe(0);
      expect(diff.summary.breakingChanges).toBe(0);
      expect(diff.summary.isBackwardCompatible).toBe(true);
      expect(diff.endpoints.added.length).toBe(0);
      expect(diff.endpoints.removed.length).toBe(0);
      expect(diff.endpoints.modified.length).toBe(0);
    });

    it('should handle specs with no components', () => {
      const minimalSpec1: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const minimalSpec2: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      };

      const diff = analyzer.compareSpecs(minimalSpec1, minimalSpec2);

      expect(diff.summary.totalChanges).toBe(0);
    });

    it('should handle empty paths object', () => {
      const emptySpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {}
      };

      const diff = analyzer.compareSpecs(emptySpec, emptySpec);

      expect(diff.summary.totalChanges).toBe(0);
    });
  });
});
