/**
 * Unit tests for file loader
 */

import { describe, it, expect } from 'vitest';
import { detectFormat, parseContent } from '../../src/utils/file-loader.js';
import { ParseError } from '../../src/types/errors.js';

describe('file-loader', () => {
  describe('detectFormat', () => {
    it('should detect JSON format from .json extension', () => {
      expect(detectFormat('spec.json')).toBe('json');
      expect(detectFormat('/path/to/spec.json')).toBe('json');
      expect(detectFormat('SPEC.JSON')).toBe('json');
    });

    it('should detect YAML format from .yaml extension', () => {
      expect(detectFormat('spec.yaml')).toBe('yaml');
      expect(detectFormat('/path/to/spec.yaml')).toBe('yaml');
      expect(detectFormat('SPEC.YAML')).toBe('yaml');
    });

    it('should detect YAML format from .yml extension', () => {
      expect(detectFormat('spec.yml')).toBe('yaml');
      expect(detectFormat('/path/to/spec.yml')).toBe('yaml');
      expect(detectFormat('SPEC.YML')).toBe('yaml');
    });

    it('should default to JSON for unknown extensions', () => {
      expect(detectFormat('spec.txt')).toBe('json');
      expect(detectFormat('spec')).toBe('json');
      expect(detectFormat('spec.unknown')).toBe('json');
    });
  });

  describe('parseContent', () => {
    describe('JSON parsing', () => {
      it('should parse valid JSON', () => {
        const content = '{"name": "test", "value": 123}';
        const result = parseContent(content, 'json');

        expect(result).toEqual({ name: 'test', value: 123 });
      });

      it('should parse JSON arrays', () => {
        const content = '[1, 2, 3, "test"]';
        const result = parseContent(content, 'json');

        expect(result).toEqual([1, 2, 3, 'test']);
      });

      it('should throw ParseError for invalid JSON', () => {
        const content = '{ invalid json }';

        expect(() => parseContent(content, 'json')).toThrow(ParseError);
      });
    });

    describe('YAML parsing', () => {
      it('should parse valid YAML', () => {
        const content = `
name: test
value: 123
nested:
  key: value
`;
        const result = parseContent(content, 'yaml');

        expect(result).toEqual({
          name: 'test',
          value: 123,
          nested: { key: 'value' },
        });
      });

      it('should parse YAML arrays', () => {
        const content = `
- item1
- item2
- item3
`;
        const result = parseContent(content, 'yaml');

        expect(result).toEqual(['item1', 'item2', 'item3']);
      });

      it('should parse YAML with .yml extension', () => {
        const content = 'key: value';
        const result = parseContent(content, 'yml');

        expect(result).toEqual({ key: 'value' });
      });

      it('should handle YAML multiline strings', () => {
        const content = `
description: |
  This is a multiline
  string in YAML
`;
        const result = parseContent(content, 'yaml') as { description: string };

        expect(result.description).toContain('multiline');
      });
    });

    describe('Error handling', () => {
      it('should throw ParseError for unsupported format', () => {
        const content = 'some content';

        expect(() => parseContent(content, 'txt' as never)).toThrow(ParseError);
        expect(() => parseContent(content, 'txt' as never)).toThrow('Unsupported format: txt');
      });

      it('should include context in parse errors', () => {
        const content = '{ invalid }';

        try {
          parseContent(content, 'json');
        } catch (error) {
          expect(error).toBeInstanceOf(ParseError);
          const parseError = error as ParseError;
          expect(parseError.context).toHaveProperty('format', 'json');
        }
      });
    });

    describe('OpenAPI spec examples', () => {
      it('should parse minimal OpenAPI JSON spec', () => {
        const content = `{
          "openapi": "3.0.0",
          "info": {
            "title": "Test API",
            "version": "1.0.0"
          },
          "paths": {}
        }`;

        const result = parseContent(content, 'json') as {
          openapi: string;
          info: { title: string };
        };

        expect(result.openapi).toBe('3.0.0');
        expect(result.info.title).toBe('Test API');
      });

      it('should parse minimal OpenAPI YAML spec', () => {
        const content = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`;

        const result = parseContent(content, 'yaml') as {
          openapi: string;
          info: { title: string };
        };

        expect(result.openapi).toBe('3.0.0');
        expect(result.info.title).toBe('Test API');
      });

      it('should parse Swagger 2.0 JSON spec', () => {
        const content = `{
          "swagger": "2.0",
          "info": {
            "title": "Test API",
            "version": "1.0.0"
          },
          "paths": {}
        }`;

        const result = parseContent(content, 'json') as {
          swagger: string;
          info: { title: string };
        };

        expect(result.swagger).toBe('2.0');
        expect(result.info.title).toBe('Test API');
      });
    });
  });
});
