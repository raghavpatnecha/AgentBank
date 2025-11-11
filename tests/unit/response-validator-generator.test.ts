/**
 * Unit tests for ResponseValidatorGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseValidatorGenerator } from '../../src/generators/response-validator-generator.js';
import type { SchemaObject, ResponseObject } from '../../src/types/openapi-types.js';

describe('ResponseValidatorGenerator', () => {
  let generator: ResponseValidatorGenerator;

  beforeEach(() => {
    generator = new ResponseValidatorGenerator();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(generator).toBeInstanceOf(ResponseValidatorGenerator);
    });

    it('should accept custom options', () => {
      const customGen = new ResponseValidatorGenerator({
        bodyVarName: 'data',
        includeTypeChecks: false,
        strictValidation: true,
        addComments: false,
      });

      expect(customGen).toBeInstanceOf(ResponseValidatorGenerator);
    });
  });

  describe('generateValidation', () => {
    it('should generate validation for string field', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain("expect(typeof body).toBe('object')");
      expect(code).toContain("expect(body).toHaveProperty('name')");
      expect(code).toContain("expect(typeof body.name).toBe('string')");
    });

    it('should generate validation for number field', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain("expect(typeof body.age).toBe('number')");
    });

    it('should generate validation for integer field', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          count: { type: 'integer' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain("expect(typeof body.count).toBe('number')");
    });

    it('should generate validation for boolean field', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain("expect(typeof body.active).toBe('boolean')");
    });

    it('should generate validation for array field', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          type: 'string',
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('expect(Array.isArray(body)).toBe(true)');
    });

    it('should validate required fields', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['id', 'name'],
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain("expect(body).toHaveProperty('id')");
      expect(code).toContain("expect(body).toHaveProperty('name')");
    });

    it('should validate email format', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toMatch(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)');
    });

    it('should validate UUID format', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain(
        'toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)'
      );
    });

    it('should validate URL format', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          website: { type: 'string', format: 'url' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toMatch(/^https?:\\/\\/.+/)');
    });

    it('should validate date format', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          birthDate: { type: 'string', format: 'date' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toMatch(/^\\d{4}-\\d{2}-\\d{2}$/)');
    });

    it('should validate date-time format', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          createdAt: { type: 'string', format: 'date-time' },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toMatch(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/)');
    });

    it('should validate enum values', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
          },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toContain(body.status)');
    });

    it('should validate string length constraints', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
          },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toBeGreaterThanOrEqual(3)');
      expect(code).toContain('toBeLessThanOrEqual(50)');
    });

    it('should validate number range constraints', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
          },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toBeGreaterThanOrEqual(0)');
      expect(code).toContain('toBeLessThanOrEqual(150)');
    });

    it('should validate array item constraints', () => {
      const schema: SchemaObject = {
        type: 'array',
        minItems: 1,
        maxItems: 10,
        items: { type: 'string' },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('toBeGreaterThanOrEqual(1)');
      expect(code).toContain('toBeLessThanOrEqual(10)');
    });

    it('should validate nested objects', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name'],
          },
        },
      };

      const code = generator.generateValidation(schema);

      expect(code).toContain('body.user');
    });
  });

  describe('generateStatusValidation', () => {
    it('should generate validation for single status code', () => {
      const code = generator.generateStatusValidation(200);

      expect(code).toBe('expect(response.status()).toBe(200);');
    });

    it('should generate validation for multiple status codes', () => {
      const code = generator.generateStatusValidation([200, 201]);

      expect(code).toContain('[200, 201]');
      expect(code).toContain('toContain(response.status())');
    });
  });

  describe('generateHeaderValidation', () => {
    it('should generate validation for header string value', () => {
      const code = generator.generateHeaderValidation('Content-Type', 'application/json');

      expect(code).toContain("expect(response.headers()['Content-Type'])");
      expect(code).toContain('.toBe(');
    });

    it('should generate validation for header regex pattern', () => {
      const code = generator.generateHeaderValidation('ETag', /^"[a-f0-9]+"$/);

      expect(code).toContain("expect(response.headers()['ETag'])");
      expect(code).toContain('.toMatch(');
    });
  });

  describe('generateCompleteValidation', () => {
    it('should generate complete validation with status and body', () => {
      const response: ResponseObject = {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
              required: ['id', 'name'],
            },
          },
        },
      };

      const code = generator.generateCompleteValidation(response, 200);

      expect(code).toContain('expect(response.status()).toBe(200)');
      expect(code).toContain('const body = await response.json()');
      expect(code).toContain("expect(body).toHaveProperty('id')");
      expect(code).toContain("expect(body).toHaveProperty('name')");
    });

    it('should handle response without body', () => {
      const response: ResponseObject = {
        description: 'No content',
      };

      const code = generator.generateCompleteValidation(response, 204);

      expect(code).toContain('expect(response.status()).toBe(204)');
      expect(code).not.toContain('const body = await response.json()');
    });
  });

  describe('options', () => {
    it('should respect bodyVarName option', () => {
      const customGen = new ResponseValidatorGenerator({
        bodyVarName: 'data',
      });

      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const code = customGen.generateValidation(schema);

      expect(code).toContain('data');
      expect(code).not.toContain('body.');
    });

    it('should skip type checks when disabled', () => {
      const customGen = new ResponseValidatorGenerator({
        includeTypeChecks: false,
      });

      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const code = customGen.generateValidation(schema);

      expect(code).not.toContain('expect(typeof');
    });

    it('should skip comments when disabled', () => {
      const customGen = new ResponseValidatorGenerator({
        addComments: false,
      });

      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const code = customGen.generateValidation(schema);

      expect(code).not.toContain('//');
    });
  });
});
