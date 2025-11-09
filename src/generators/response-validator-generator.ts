/**
 * Response Validator Generator - Generates validation code for API responses
 * Creates TypeScript/Playwright assertion code for response validation
 */

import type { SchemaObject, ResponseObject } from '../types/openapi-types.js';

/**
 * Options for validation code generation
 */
export interface ValidationGeneratorOptions {
  /** Variable name for response body */
  bodyVarName?: string;
  /** Include type checking */
  includeTypeChecks?: boolean;
  /** Strict validation (fail on extra fields) */
  strictValidation?: boolean;
  /** Add descriptive comments */
  addComments?: boolean;
}

/**
 * Response Validator Generator
 * Generates Playwright assertion code for response validation
 */
export class ResponseValidatorGenerator {
  private options: Required<ValidationGeneratorOptions>;

  constructor(options: ValidationGeneratorOptions = {}) {
    this.options = {
      bodyVarName: options.bodyVarName ?? 'body',
      includeTypeChecks: options.includeTypeChecks ?? true,
      strictValidation: options.strictValidation ?? false,
      addComments: options.addComments ?? true,
    };
  }

  /**
   * Generate validation code for a response object
   */
  generateValidation(responseSchema: SchemaObject, statusCode?: number): string {
    const lines: string[] = [];

    if (statusCode !== undefined && this.options.addComments) {
      lines.push(`// Validate ${statusCode} response`);
    }

    lines.push(...this.generateSchemaValidation(responseSchema, this.options.bodyVarName));

    return lines.join('\n');
  }

  /**
   * Generate schema validation code
   */
  generateSchemaValidation(schema: SchemaObject, varName: string, depth: number = 0): string[] {
    const lines: string[] = [];
    const indent = '  '.repeat(depth);

    // Handle array type
    if (schema.type === 'array') {
      if (this.options.addComments) {
        lines.push(`${indent}// Validate array response`);
      }
      lines.push(`${indent}expect(Array.isArray(${varName})).toBe(true);`);

      if (schema.minItems !== undefined) {
        lines.push(
          `${indent}expect(${varName}.length).toBeGreaterThanOrEqual(${schema.minItems});`
        );
      }

      if (schema.maxItems !== undefined) {
        lines.push(`${indent}expect(${varName}.length).toBeLessThanOrEqual(${schema.maxItems});`);
      }

      // Validate array items
      if (schema.items) {
        const itemSchema = schema.items as SchemaObject;
        if (this.options.addComments) {
          lines.push(`${indent}// Validate array items`);
        }
        lines.push(`${indent}if (${varName}.length > 0) {`);
        const itemValidation = this.generateSchemaValidation(
          itemSchema,
          `${varName}[0]`,
          depth + 1
        );
        lines.push(...itemValidation);
        lines.push(`${indent}}`);
      }

      return lines;
    }

    // Handle object type
    if (schema.type === 'object' || schema.properties) {
      if (this.options.includeTypeChecks) {
        lines.push(`${indent}expect(typeof ${varName}).toBe('object');`);
        lines.push(`${indent}expect(${varName}).not.toBeNull();`);
      }

      // Validate required fields
      if (schema.required && schema.required.length > 0) {
        if (this.options.addComments) {
          lines.push(`${indent}// Validate required fields`);
        }
        for (const field of schema.required) {
          lines.push(`${indent}expect(${varName}).toHaveProperty('${field}');`);
        }
      }

      // Validate properties
      if (schema.properties) {
        if (this.options.addComments && Object.keys(schema.properties).length > 0) {
          lines.push(`${indent}// Validate field types and formats`);
        }

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propSchemaObj = propSchema as SchemaObject;
          const fieldVar = `${varName}.${propName}`;
          const isRequired = schema.required?.includes(propName);

          if (!isRequired) {
            lines.push(`${indent}if (${fieldVar} !== undefined) {`);
            lines.push(...this.generateFieldValidation(propSchemaObj, fieldVar, depth + 1));
            lines.push(`${indent}}`);
          } else {
            lines.push(...this.generateFieldValidation(propSchemaObj, fieldVar, depth));
          }
        }
      }

      return lines;
    }

    // Handle primitive types
    return this.generateFieldValidation(schema, varName, depth);
  }

  /**
   * Generate validation code for a field
   */
  private generateFieldValidation(schema: SchemaObject, varName: string, depth: number): string[] {
    const lines: string[] = [];
    const indent = '  '.repeat(depth);

    // Type validation
    if (this.options.includeTypeChecks && schema.type) {
      const jsType = this.getJavaScriptType(schema.type as string);
      if (jsType === 'array') {
        lines.push(`${indent}expect(Array.isArray(${varName})).toBe(true);`);
      } else if (jsType) {
        lines.push(`${indent}expect(typeof ${varName}).toBe('${jsType}');`);
      }
    }

    // Format validation
    if (schema.format) {
      const formatValidation = this.generateFormatValidation(schema.format, varName, indent);
      if (formatValidation) {
        lines.push(formatValidation);
      }
    }

    // Enum validation
    if (schema.enum && schema.enum.length > 0) {
      const enumValues = schema.enum.map((v) => JSON.stringify(v)).join(', ');
      lines.push(`${indent}expect([${enumValues}]).toContain(${varName});`);
    }

    // String constraints
    if (schema.type === 'string') {
      if (schema.minLength !== undefined) {
        lines.push(
          `${indent}expect(${varName}.length).toBeGreaterThanOrEqual(${schema.minLength});`
        );
      }
      if (schema.maxLength !== undefined) {
        lines.push(`${indent}expect(${varName}.length).toBeLessThanOrEqual(${schema.maxLength});`);
      }
      if (schema.pattern) {
        const pattern = schema.pattern.replace(/\\/g, '\\\\');
        lines.push(`${indent}expect(${varName}).toMatch(/${pattern}/);`);
      }
    }

    // Number constraints
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined) {
        const operator = schema.exclusiveMinimum ? 'toBeGreaterThan' : 'toBeGreaterThanOrEqual';
        lines.push(`${indent}expect(${varName}).${operator}(${schema.minimum});`);
      }
      if (schema.maximum !== undefined) {
        const operator = schema.exclusiveMaximum ? 'toBeLessThan' : 'toBeLessThanOrEqual';
        lines.push(`${indent}expect(${varName}).${operator}(${schema.maximum});`);
      }
      if (schema.multipleOf !== undefined) {
        lines.push(`${indent}expect(${varName} % ${schema.multipleOf}).toBe(0);`);
      }
    }

    // Nested object
    if (schema.type === 'object' && schema.properties) {
      lines.push(...this.generateSchemaValidation(schema, varName, depth));
    }

    // Array items
    if (schema.type === 'array' && schema.items) {
      lines.push(...this.generateSchemaValidation(schema, varName, depth));
    }

    return lines;
  }

  /**
   * Generate format-specific validation
   */
  private generateFormatValidation(format: string, varName: string, indent: string): string | null {
    switch (format) {
      case 'email':
        return `${indent}expect(${varName}).toMatch(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/);`;
      case 'uuid':
        return `${indent}expect(${varName}).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);`;
      case 'uri':
      case 'url':
        return `${indent}expect(${varName}).toMatch(/^https?:\\/\\/.+/);`;
      case 'date':
        return `${indent}expect(${varName}).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/);`;
      case 'date-time':
        return `${indent}expect(${varName}).toMatch(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/);`;
      case 'ipv4':
        return `${indent}expect(${varName}).toMatch(/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/);`;
      case 'ipv6':
        return `${indent}expect(${varName}).toMatch(/^[0-9a-f:]+$/i);`;
      default:
        return null;
    }
  }

  /**
   * Get JavaScript type from JSON Schema type
   */
  private getJavaScriptType(schemaType: string): string | null {
    switch (schemaType) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      case 'null':
        return 'object'; // typeof null === 'object'
      default:
        return null;
    }
  }

  /**
   * Generate status code validation
   */
  generateStatusValidation(statusCode: number | number[]): string {
    if (Array.isArray(statusCode)) {
      const codes = statusCode.join(', ');
      return `expect([${codes}]).toContain(response.status());`;
    }
    return `expect(response.status()).toBe(${statusCode});`;
  }

  /**
   * Generate header validation
   */
  generateHeaderValidation(headerName: string, expectedValue: string | RegExp): string {
    if (expectedValue instanceof RegExp) {
      const pattern = expectedValue.source.replace(/\\/g, '\\\\');
      return `expect(response.headers()['${headerName}']).toMatch(/${pattern}/);`;
    }
    return `expect(response.headers()['${headerName}']).toBe('${expectedValue}');`;
  }

  /**
   * Generate complete response validation code
   */
  generateCompleteValidation(response: ResponseObject, statusCode: number): string {
    const lines: string[] = [];

    // Status validation
    lines.push(this.generateStatusValidation(statusCode));
    lines.push('');

    // Body validation
    if (response.content) {
      const jsonContent = response.content['application/json'];
      if (jsonContent?.schema) {
        lines.push('const body = await response.json();');
        lines.push('');
        lines.push(this.generateValidation(jsonContent.schema as SchemaObject, statusCode));
      }
    }

    return lines.join('\n');
  }
}

/**
 * Convenience function to generate validation code
 */
export function generateValidationCode(
  schema: SchemaObject,
  options?: ValidationGeneratorOptions
): string {
  const generator = new ResponseValidatorGenerator(options);
  return generator.generateValidation(schema);
}
