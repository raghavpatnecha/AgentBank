/**
 * Unit tests for Request Body Generator
 * Tests all primitive types, formats, compositions, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RequestBodyGenerator,
  generateRequestBody,
} from '../../src/generators/request-body-generator.js';
import { DataFactory } from '../../src/utils/data-factory.js';
import type { SchemaObject } from '../../src/types/openapi-types.js';

describe('RequestBodyGenerator', () => {
  let generator: RequestBodyGenerator;

  beforeEach(() => {
    generator = new RequestBodyGenerator({ seed: 12345 });
  });

  describe('Primitive Types', () => {
    it('should generate string values', () => {
      const schema: SchemaObject = { type: 'string' };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('string');
    });

    it('should generate number values', () => {
      const schema: SchemaObject = { type: 'number' };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('number');
    });

    it('should generate integer values', () => {
      const schema: SchemaObject = { type: 'integer' };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should generate boolean values', () => {
      const schema: SchemaObject = { type: 'boolean' };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('boolean');
    });

    it('should generate null values', () => {
      const schema: SchemaObject = { type: 'null' };
      const result = generator.generateBody(schema);
      expect(result).toBe(null);
    });
  });

  describe('Format Constraints', () => {
    it('should generate email format', () => {
      const schema: SchemaObject = { type: 'string', format: 'email' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should generate uuid format', () => {
      const schema: SchemaObject = { type: 'string', format: 'uuid' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate date format', () => {
      const schema: SchemaObject = { type: 'string', format: 'date' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should generate date-time format', () => {
      const schema: SchemaObject = { type: 'string', format: 'date-time' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should generate uri format', () => {
      const schema: SchemaObject = { type: 'string', format: 'uri' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^https?:\/\//);
    });

    it('should generate url format', () => {
      const schema: SchemaObject = { type: 'string', format: 'url' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^https?:\/\//);
    });

    it('should generate ipv4 format', () => {
      const schema: SchemaObject = { type: 'string', format: 'ipv4' };
      const result = generator.generateBody(schema) as string;
      expect(result).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe('String Constraints', () => {
    it('should respect minLength constraint', () => {
      const schema: SchemaObject = { type: 'string', minLength: 10 };
      const result = generator.generateBody(schema) as string;
      expect(result.length).toBeGreaterThanOrEqual(10);
    });

    it('should respect maxLength constraint', () => {
      const schema: SchemaObject = { type: 'string', maxLength: 5 };
      const result = generator.generateBody(schema) as string;
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should respect both minLength and maxLength', () => {
      const schema: SchemaObject = { type: 'string', minLength: 5, maxLength: 10 };
      const result = generator.generateBody(schema) as string;
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Number Constraints', () => {
    it('should respect minimum constraint', () => {
      const schema: SchemaObject = { type: 'number', minimum: 10 };
      const result = generator.generateBody(schema) as number;
      expect(result).toBeGreaterThanOrEqual(10);
    });

    it('should respect maximum constraint', () => {
      const schema: SchemaObject = { type: 'number', maximum: 100 };
      const result = generator.generateBody(schema) as number;
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should respect both minimum and maximum', () => {
      const schema: SchemaObject = { type: 'number', minimum: 10, maximum: 20 };
      const result = generator.generateBody(schema) as number;
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(20);
    });

    it('should respect exclusiveMinimum', () => {
      const schema: SchemaObject = { type: 'number', exclusiveMinimum: 10 };
      const result = generator.generateBody(schema) as number;
      expect(result).toBeGreaterThan(10);
    });

    it('should respect exclusiveMaximum', () => {
      const schema: SchemaObject = { type: 'number', exclusiveMaximum: 100 };
      const result = generator.generateBody(schema) as number;
      expect(result).toBeLessThan(100);
    });

    it('should respect multipleOf constraint', () => {
      const schema: SchemaObject = { type: 'integer', minimum: 0, maximum: 100, multipleOf: 5 };
      const result = generator.generateBody(schema) as number;
      expect(result % 5).toBe(0);
    });
  });

  describe('Enum Values', () => {
    it('should pick from enum values', () => {
      const schema: SchemaObject = { type: 'string', enum: ['red', 'green', 'blue'] };
      const result = generator.generateBody(schema);
      expect(['red', 'green', 'blue']).toContain(result);
    });

    it('should handle number enums', () => {
      const schema: SchemaObject = { type: 'integer', enum: [1, 2, 3, 4, 5] };
      const result = generator.generateBody(schema);
      expect([1, 2, 3, 4, 5]).toContain(result);
    });

    it('should handle mixed type enums', () => {
      const schema: SchemaObject = { enum: ['active', 1, true, null] };
      const result = generator.generateBody(schema);
      expect(['active', 1, true, null]).toContain(result);
    });
  });

  describe('Arrays', () => {
    it('should generate arrays with items', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      };
      const result = generator.generateBody(schema) as unknown[];
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((item) => expect(typeof item).toBe('string'));
    });

    it('should respect minItems constraint', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'number' },
        minItems: 5,
      };
      const result = generator.generateBody(schema) as unknown[];
      expect(result.length).toBeGreaterThanOrEqual(5);
    });

    it('should respect maxItems constraint', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'number' },
        maxItems: 2,
      };
      const result = generator.generateBody(schema) as unknown[];
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should generate arrays of objects', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
        },
      };
      const result = generator.generateBody(schema) as Record<string, unknown>[];
      expect(Array.isArray(result)).toBe(true);
      result.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
      });
    });
  });

  describe('Objects', () => {
    it('should generate simple objects', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      };
      const result = generator.generateBody(schema) as Record<string, unknown>;
      expect(typeof result).toBe('object');
    });

    it('should include required fields', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer' },
        },
      };
      const result = generator.generateBody(schema) as Record<string, unknown>;
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('should validate required fields', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      };
      const result = generator.generateBody(schema);
      expect(generator.validateRequiredFields(result, schema)).toBe(true);
    });

    it('should handle nested objects', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['user'],
        properties: {
          user: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                },
              },
            },
          },
        },
      };
      const result = generator.generateBody(schema) as Record<string, unknown>;
      expect(result).toHaveProperty('user');
      const user = result.user as Record<string, unknown>;
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });
  });

  describe('Schema Compositions', () => {
    describe('allOf', () => {
      it('should merge all schemas', () => {
        const schema: SchemaObject = {
          allOf: [
            {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
          ],
        };
        const result = generator.generateBody(schema) as Record<string, unknown>;
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('email');
      });

      it('should merge required fields from all schemas', () => {
        const schema: SchemaObject = {
          allOf: [
            {
              type: 'object',
              required: ['id'],
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
              },
            },
          ],
        };
        const result = generator.generateBody(schema) as Record<string, unknown>;
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
      });
    });

    describe('oneOf', () => {
      it('should select one schema from oneOf', () => {
        const schema: SchemaObject = {
          oneOf: [
            {
              type: 'object',
              required: ['type', 'cardNumber'],
              properties: {
                type: { type: 'string', enum: ['credit'] },
                cardNumber: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['type', 'accountNumber'],
              properties: {
                type: { type: 'string', enum: ['debit'] },
                accountNumber: { type: 'string' },
              },
            },
          ],
        };
        const result = generator.generateBody(schema) as Record<string, unknown>;
        expect(result).toHaveProperty('type');
        // Should have either cardNumber or accountNumber
        const hasCardNumber = 'cardNumber' in result;
        const hasAccountNumber = 'accountNumber' in result;
        expect(hasCardNumber || hasAccountNumber).toBe(true);
      });
    });

    describe('anyOf', () => {
      it('should select one schema from anyOf', () => {
        const schema: SchemaObject = {
          anyOf: [
            {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                id: { type: 'integer' },
              },
            },
          ],
        };
        const result = generator.generateBody(schema);
        expect(typeof result).toBe('object');
        expect(result).not.toBe(null);
      });
    });
  });

  describe('Default and Example Values', () => {
    it('should use default value when provided', () => {
      const schema: SchemaObject = {
        type: 'string',
        default: 'default-value',
      };
      const result = generator.generateBody(schema);
      expect(result).toBe('default-value');
    });

    it('should use example when preferExamples is enabled', () => {
      const generatorWithExamples = new RequestBodyGenerator({ preferExamples: true });
      const schema: SchemaObject = {
        type: 'object',
        example: { name: 'John Doe', age: 30 },
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      };
      const result = generatorWithExamples.generateBody(schema);
      expect(result).toEqual({ name: 'John Doe', age: 30 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object schema', () => {
      const schema: SchemaObject = { type: 'object' };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('object');
    });

    it('should handle schema without type but with properties', () => {
      const schema: SchemaObject = {
        properties: {
          name: { type: 'string' },
        },
      };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('object');
    });

    it('should handle array type schema', () => {
      const schema: SchemaObject = {
        type: ['string', 'null'] as unknown as string,
      };
      const result = generator.generateBody(schema);
      expect(typeof result === 'string' || result === null).toBe(true);
    });

    it('should prevent infinite recursion on deep nesting', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          child: {
            type: 'object',
            properties: {
              child: {
                type: 'object',
                properties: {
                  child: {
                    type: 'object',
                    properties: {
                      child: {
                        type: 'object',
                        properties: {
                          child: {
                            type: 'object',
                            properties: {
                              value: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const result = generator.generateBody(schema);
      expect(typeof result).toBe('object');
      // Should not throw stack overflow
    });
  });

  describe('generateExamples', () => {
    it('should generate multiple examples', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      };
      const examples = generator.generateExamples(schema, 5);
      expect(examples).toHaveLength(5);
      examples.forEach((example) => {
        expect(typeof example).toBe('object');
        expect(example).toHaveProperty('name');
      });
    });
  });

  describe('Convenience Function', () => {
    it('should work with generateRequestBody function', () => {
      const schema: SchemaObject = {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      };
      const result = generateRequestBody(schema, { seed: 12345 });
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });
  });
});

describe('DataFactory', () => {
  let factory: DataFactory;

  beforeEach(() => {
    factory = new DataFactory({ seed: 12345 });
  });

  describe('Basic Generation', () => {
    it('should generate data with seed option', () => {
      const schema: SchemaObject = { type: 'integer', minimum: 1, maximum: 100 };
      const factoryWithSeed = new DataFactory({ seed: 42 });

      const result = factoryWithSeed.generate(schema);

      // Should generate a valid number within constraints
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle password format', () => {
      const schema: SchemaObject = { type: 'string', format: 'password' };
      const result = factory.generate(schema) as string;
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThanOrEqual(16);
    });

    it('should handle hostname format', () => {
      const schema: SchemaObject = { type: 'string', format: 'hostname' };
      const result = factory.generate(schema) as string;
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\./); // Should contain dots
    });

    it('should handle byte format', () => {
      const schema: SchemaObject = { type: 'string', format: 'byte' };
      const result = factory.generate(schema) as string;
      expect(typeof result).toBe('string');
      // Base64 encoded string
    });
  });

  describe('Array Generation', () => {
    it('should respect arrayItemCount option', () => {
      const customFactory = new DataFactory({ arrayItemCount: 5, seed: 12345 });
      const schema: SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      };
      const result = customFactory.generate(schema) as unknown[];
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Depth Management', () => {
    it('should reset depth', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      factory.generate(schema);
      factory.resetDepth();
      const result = factory.generate(schema);
      expect(typeof result).toBe('object');
    });
  });
});
