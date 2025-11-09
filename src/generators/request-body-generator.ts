/**
 * Request Body Generator - Generates request bodies from OpenAPI schemas
 * Handles compositions (oneOf, anyOf, allOf) and complex schemas
 */

import { DataFactory, type DataFactoryOptions } from '../utils/data-factory.js';
import type { SchemaObject, ReferenceObject } from '../types/openapi-types.js';

/**
 * Options for request body generation
 */
export interface RequestBodyGeneratorOptions extends DataFactoryOptions {
  /** Prefer examples over generated data when available */
  preferExamples?: boolean;
  /** Strategy for oneOf/anyOf selection */
  compositionStrategy?: 'first' | 'random';
}

/**
 * Request Body Generator
 * Generates realistic request bodies based on OpenAPI schemas
 */
export class RequestBodyGenerator {
  private dataFactory: DataFactory;
  private options: RequestBodyGeneratorOptions;

  constructor(options: RequestBodyGeneratorOptions = {}) {
    this.options = {
      preferExamples: options.preferExamples ?? false,
      compositionStrategy: options.compositionStrategy ?? 'first',
      ...options,
    };
    this.dataFactory = new DataFactory(options);
  }

  /**
   * Generate request body from schema
   */
  generateBody(schema: SchemaObject): unknown {
    // Reset depth for each new body generation
    this.dataFactory.resetDepth();

    // Check for example first if preferExamples is enabled
    if (this.options.preferExamples && schema.example !== undefined) {
      return schema.example;
    }

    // Handle schema compositions
    if (schema.allOf) {
      return this.handleAllOf(schema);
    }

    if (schema.oneOf) {
      return this.handleOneOf(schema);
    }

    if (schema.anyOf) {
      return this.handleAnyOf(schema);
    }

    // Handle not (negation) - we'll just generate from the main schema
    // as proper negation would require complex logic
    if (schema.not) {
      // Ignore 'not' and generate from the main schema
      const schemaWithoutNot = { ...schema };
      delete schemaWithoutNot.not;
      return this.dataFactory.generate(schemaWithoutNot);
    }

    // Handle default value
    if (schema.default !== undefined) {
      return schema.default;
    }

    // Standard generation
    return this.dataFactory.generate(schema);
  }

  /**
   * Handle allOf composition (merge all schemas)
   */
  private handleAllOf(schema: SchemaObject): unknown {
    const allOfSchemas = schema.allOf as SchemaObject[];
    if (!allOfSchemas || allOfSchemas.length === 0) {
      return {};
    }

    // Merge all schemas
    const merged = this.mergeSchemas(allOfSchemas);

    // Also merge with the parent schema properties
    const finalSchema: SchemaObject = {
      ...merged,
      ...schema,
      allOf: undefined, // Remove allOf to prevent recursion
    };

    return this.dataFactory.generate(finalSchema);
  }

  /**
   * Handle oneOf composition (choose one schema)
   */
  private handleOneOf(schema: SchemaObject): unknown {
    const oneOfSchemas = schema.oneOf as SchemaObject[];
    if (!oneOfSchemas || oneOfSchemas.length === 0) {
      return {};
    }

    // Select schema based on strategy
    const selectedSchema = this.selectSchema(oneOfSchemas);

    // Merge selected schema with parent properties
    const finalSchema: SchemaObject = {
      ...selectedSchema,
      ...this.excludeComposition(schema),
    };

    return this.dataFactory.generate(finalSchema);
  }

  /**
   * Handle anyOf composition (choose one or more schemas)
   */
  private handleAnyOf(schema: SchemaObject): unknown {
    const anyOfSchemas = schema.anyOf as SchemaObject[];
    if (!anyOfSchemas || anyOfSchemas.length === 0) {
      return {};
    }

    // For simplicity, we'll just select one schema (like oneOf)
    // In a more complex implementation, we could merge multiple schemas
    const selectedSchema = this.selectSchema(anyOfSchemas);

    // Merge selected schema with parent properties
    const finalSchema: SchemaObject = {
      ...selectedSchema,
      ...this.excludeComposition(schema),
    };

    return this.dataFactory.generate(finalSchema);
  }

  /**
   * Merge multiple schemas into one
   */
  private mergeSchemas(schemas: (SchemaObject | undefined)[]): SchemaObject {
    const merged: SchemaObject = {
      type: 'object',
      properties: {},
      required: [],
    };

    for (const schema of schemas) {
      // Skip undefined or reference objects (should be resolved before this point)
      if (!schema || this.isReference(schema)) {
        continue;
      }

      // Merge type
      if (schema.type) {
        merged.type = schema.type;
      }

      // Merge properties
      if (schema.properties) {
        merged.properties = {
          ...merged.properties,
          ...schema.properties,
        };
      }

      // Merge required fields
      if (schema.required) {
        merged.required = [...(merged.required ?? []), ...schema.required];
      }

      // Merge other constraints
      if (schema.minimum !== undefined) merged.minimum = schema.minimum;
      if (schema.maximum !== undefined) merged.maximum = schema.maximum;
      if (schema.minLength !== undefined) merged.minLength = schema.minLength;
      if (schema.maxLength !== undefined) merged.maxLength = schema.maxLength;
      if (schema.pattern !== undefined) merged.pattern = schema.pattern;
      if (schema.format !== undefined) merged.format = schema.format;
      if (schema.enum !== undefined) merged.enum = schema.enum;
      if (schema.items !== undefined) merged.items = schema.items;
    }

    // Remove duplicates from required
    if (merged.required) {
      merged.required = [...new Set(merged.required)];
    }

    return merged;
  }

  /**
   * Select a schema from array based on strategy
   */
  private selectSchema(schemas: (SchemaObject | undefined)[]): SchemaObject {
    if (schemas.length === 0) {
      return {};
    }

    if (this.options.compositionStrategy === 'random') {
      const index = Math.floor(Math.random() * schemas.length);
      return schemas[index] ?? {};
    }

    // Default to first schema
    return schemas[0] ?? {};
  }

  /**
   * Exclude composition keywords from schema
   */
  private excludeComposition(schema: SchemaObject): SchemaObject {
    const result = { ...schema };
    delete result.oneOf;
    delete result.anyOf;
    delete result.allOf;
    delete result.not;
    return result;
  }

  /**
   * Check if object is a reference
   */
  private isReference(obj: unknown): obj is ReferenceObject {
    return typeof obj === 'object' && obj !== null && '$ref' in obj;
  }

  /**
   * Generate multiple examples
   */
  generateExamples(schema: SchemaObject, count: number = 3): unknown[] {
    const examples: unknown[] = [];

    for (let i = 0; i < count; i++) {
      examples.push(this.generateBody(schema));
    }

    return examples;
  }

  /**
   * Validate that required fields are present in generated data
   */
  validateRequiredFields(data: unknown, schema: SchemaObject): boolean {
    if (!schema.required || schema.required.length === 0) {
      return true;
    }

    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const dataObj = data as Record<string, unknown>;

    return schema.required.every((field) => field in dataObj);
  }
}

/**
 * Convenience function to generate a request body
 */
export function generateRequestBody(
  schema: SchemaObject,
  options?: RequestBodyGeneratorOptions
): unknown {
  const generator = new RequestBodyGenerator(options);
  return generator.generateBody(schema);
}
