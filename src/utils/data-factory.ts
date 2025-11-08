/**
 * Data Factory - Generates realistic fake data based on schema types
 * Uses faker.js for realistic data generation
 */

import { faker } from '@faker-js/faker';
import type { SchemaObject } from '../types/openapi-types.js';

/**
 * Configuration options for data generation
 */
export interface DataFactoryOptions {
  /** Number of array items to generate (default: 1-3) */
  arrayItemCount?: number;
  /** Maximum recursion depth for nested objects (default: 5) */
  maxDepth?: number;
  /** Seed for reproducible data generation */
  seed?: number;
}

/**
 * Data Factory for generating realistic fake data based on OpenAPI schemas
 */
export class DataFactory {
  private options: Required<DataFactoryOptions>;
  private currentDepth: number = 0;

  constructor(options: DataFactoryOptions = {}) {
    this.options = {
      arrayItemCount: options.arrayItemCount ?? Math.floor(Math.random() * 3) + 1,
      maxDepth: options.maxDepth ?? 5,
      seed: options.seed ?? Date.now(),
    };

    if (options.seed !== undefined) {
      faker.seed(options.seed);
    }
  }

  /**
   * Generate data based on schema type and format
   */
  generate(schema: SchemaObject): unknown {
    // Handle enum first
    if (schema.enum && schema.enum.length > 0) {
      return this.generateEnum(schema.enum);
    }

    // Handle type-based generation
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (type) {
      case 'string':
        return this.generateString(schema);
      case 'number':
        return this.generateNumber(schema);
      case 'integer':
        return this.generateInteger(schema);
      case 'boolean':
        return this.generateBoolean();
      case 'array':
        return this.generateArray(schema);
      case 'object':
        return this.generateObject(schema);
      case 'null':
        return null;
      default:
        // If no type specified but has properties, treat as object
        if (schema.properties) {
          return this.generateObject(schema);
        }
        // If no type specified but has items, treat as array
        if (schema.items) {
          return this.generateArray(schema);
        }
        // Default to string
        return this.generateString(schema);
    }
  }

  /**
   * Generate string based on format constraints
   */
  private generateString(schema: SchemaObject): string {
    // Check for format constraints
    switch (schema.format) {
      case 'email':
        return faker.internet.email();
      case 'uuid':
        return faker.string.uuid();
      case 'uri':
      case 'url':
        return faker.internet.url();
      case 'date':
        return faker.date.recent().toISOString().split('T')[0] ?? '2024-01-01';
      case 'date-time':
        return faker.date.recent().toISOString();
      case 'time':
        return faker.date.recent().toISOString().split('T')[1] ?? '00:00:00.000Z';
      case 'hostname':
        return faker.internet.domainName() ?? 'example.com';
      case 'ipv4':
        return faker.internet.ipv4();
      case 'ipv6':
        return faker.internet.ipv6();
      case 'password':
        return faker.internet.password({ length: 16 });
      case 'byte':
        return Buffer.from(faker.string.alphanumeric(10)).toString('base64');
      case 'binary':
        return faker.string.binary({ length: 8 });
      default:
        return this.generateStringWithConstraints(schema);
    }
  }

  /**
   * Generate string respecting length constraints
   */
  private generateStringWithConstraints(schema: SchemaObject): string {
    const minLength = schema.minLength ?? 1;
    const maxLength = schema.maxLength ?? 50;

    // Ensure min is not greater than max
    const min = Math.min(minLength, maxLength);
    const max = Math.max(minLength, maxLength);

    // Generate string with appropriate length
    if (schema.pattern) {
      // For patterns, generate a simple string (pattern matching would require regex generation)
      const length = Math.floor(Math.random() * (max - min + 1)) + min;
      return faker.string.alphanumeric(length);
    }

    // Generate realistic text
    const text = faker.lorem.sentence();

    if (text.length < min) {
      return text.padEnd(min, faker.string.alpha(1));
    }

    if (text.length > max) {
      return text.substring(0, max);
    }

    return text;
  }

  /**
   * Generate number respecting constraints
   */
  private generateNumber(schema: SchemaObject): number {
    const min = schema.minimum ?? (schema.exclusiveMinimum ? schema.exclusiveMinimum + 0.01 : 0);
    const max = schema.maximum ?? (schema.exclusiveMaximum ? schema.exclusiveMaximum - 0.01 : 1000);

    let value = faker.number.float({ min, max, fractionDigits: 2 });

    // Handle exclusive bounds
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      value = schema.exclusiveMinimum + 0.01;
    }
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      value = schema.exclusiveMaximum - 0.01;
    }

    // Handle multipleOf
    if (schema.multipleOf) {
      value = Math.round(value / schema.multipleOf) * schema.multipleOf;
    }

    return value;
  }

  /**
   * Generate integer respecting constraints
   */
  private generateInteger(schema: SchemaObject): number {
    const min = schema.minimum ?? (schema.exclusiveMinimum ? schema.exclusiveMinimum + 1 : 0);
    const max = schema.maximum ?? (schema.exclusiveMaximum ? schema.exclusiveMaximum - 1 : 1000);

    let value = faker.number.int({ min: Math.ceil(min), max: Math.floor(max) });

    // Handle exclusive bounds
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      value = Math.ceil(schema.exclusiveMinimum) + 1;
    }
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      value = Math.floor(schema.exclusiveMaximum) - 1;
    }

    // Handle multipleOf
    if (schema.multipleOf) {
      value = Math.round(value / schema.multipleOf) * schema.multipleOf;
    }

    return value;
  }

  /**
   * Generate boolean
   */
  private generateBoolean(): boolean {
    return faker.datatype.boolean();
  }

  /**
   * Generate array respecting constraints
   */
  private generateArray(schema: SchemaObject): unknown[] {
    if (!schema.items) {
      return [];
    }

    const minItems = schema.minItems ?? 1;
    const maxItems = schema.maxItems ?? this.options.arrayItemCount;
    const count = Math.max(minItems, Math.min(maxItems, this.options.arrayItemCount));

    const items: unknown[] = [];
    const itemSchema = schema.items as SchemaObject;

    for (let i = 0; i < count; i++) {
      items.push(this.generate(itemSchema));
    }

    return items;
  }

  /**
   * Generate object respecting constraints and required fields
   */
  private generateObject(schema: SchemaObject): Record<string, unknown> {
    // Prevent infinite recursion
    if (this.currentDepth >= this.options.maxDepth) {
      return {};
    }

    this.currentDepth++;

    const obj: Record<string, unknown> = {};
    const properties = schema.properties ?? {};
    const required = schema.required ?? [];

    // Generate required fields
    for (const key of required) {
      const propSchema = properties[key] as SchemaObject;
      if (propSchema) {
        obj[key] = this.generate(propSchema);
      }
    }

    // Optionally generate some non-required fields (50% chance for each)
    for (const key in properties) {
      if (!required.includes(key) && Math.random() > 0.5) {
        const propSchema = properties[key] as SchemaObject;
        obj[key] = this.generate(propSchema);
      }
    }

    this.currentDepth--;

    return obj;
  }

  /**
   * Generate enum value
   */
  private generateEnum(enumValues: unknown[]): unknown {
    const index = Math.floor(Math.random() * enumValues.length);
    return enumValues[index];
  }

  /**
   * Reset depth counter (useful when reusing factory)
   */
  public resetDepth(): void {
    this.currentDepth = 0;
  }
}

/**
 * Convenience function to generate data from schema
 */
export function generateData(schema: SchemaObject, options?: DataFactoryOptions): unknown {
  const factory = new DataFactory(options);
  return factory.generate(schema);
}
