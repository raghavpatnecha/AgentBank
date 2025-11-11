/**
 * Happy Path Generator - Generates test cases for successful API scenarios
 * Handles GET, POST, PUT, PATCH, DELETE operations with valid data
 */

import { DataFactory } from '../utils/data-factory.js';
import { RequestBodyGenerator } from './request-body-generator.js';
import type { ApiEndpoint, ParameterObject, SchemaObject } from '../types/openapi-types.js';
import type {
  TestCase,
  TestRequest,
  ExpectedResponse,
  TestValue,
} from '../types/test-generator-types.js';

/**
 * Options for happy path test generation
 */
export interface HappyPathGeneratorOptions {
  /** Use realistic data from faker */
  useRealisticData?: boolean;
  /** Generate multiple test cases per endpoint */
  generateMultiple?: boolean;
  /** Include optional parameters in tests */
  includeOptionalParams?: boolean;
}

/**
 * Happy Path Test Generator
 * Generates positive test cases that verify successful API behavior
 */
export class HappyPathGenerator {
  private dataFactory: DataFactory;
  private bodyGenerator: RequestBodyGenerator;
  private options: Required<HappyPathGeneratorOptions>;

  constructor(
    dataFactory: DataFactory,
    bodyGenerator: RequestBodyGenerator,
    options: HappyPathGeneratorOptions = {}
  ) {
    this.dataFactory = dataFactory;
    this.bodyGenerator = bodyGenerator;
    this.options = {
      useRealisticData: options.useRealisticData ?? true,
      generateMultiple: options.generateMultiple ?? false,
      includeOptionalParams: options.includeOptionalParams ?? false,
    };
  }

  /**
   * Generate a happy path test case for a single endpoint
   */
  generateTest(endpoint: ApiEndpoint): TestCase {
    const testId = this.generateTestId(endpoint);
    const testName = this.generateTestName(endpoint);
    const description = this.generateDescription(endpoint);
    const request = this.generateRequest(endpoint);
    const expectedResponse = this.generateExpectedResponse(endpoint);

    return {
      id: testId,
      name: testName,
      description,
      type: 'happy-path',
      method: endpoint.method.toUpperCase(),
      endpoint: endpoint.path,
      request,
      expectedResponse,
      metadata: {
        tags: endpoint.tags,
        priority: 'high',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate happy path test cases for multiple endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): TestCase[] {
    const tests: TestCase[] = [];

    for (const endpoint of endpoints) {
      if (this.options.generateMultiple) {
        // Generate 2-3 variations per endpoint
        const count = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < count; i++) {
          tests.push(this.generateTest(endpoint));
        }
      } else {
        tests.push(this.generateTest(endpoint));
      }
    }

    return tests;
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(endpoint: ApiEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathId = endpoint.path.replace(/[^a-zA-Z0-9]/g, '-');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${method}-${pathId}-${timestamp}-${random}`;
  }

  /**
   * Generate human-readable test name
   */
  private generateTestName(endpoint: ApiEndpoint): string {
    const method = endpoint.method.toUpperCase();
    const summary = endpoint.summary || this.generateSummaryFromPath(endpoint.path);
    return `${method} ${endpoint.path} - ${summary}`;
  }

  /**
   * Generate test description
   */
  private generateDescription(endpoint: ApiEndpoint): string {
    const method = endpoint.method.toUpperCase();
    const desc = endpoint.description || endpoint.summary || 'API operation';
    return `Happy path test for ${method} ${endpoint.path}: ${desc}`;
  }

  /**
   * Generate summary from path when not provided
   */
  private generateSummaryFromPath(path: string): string {
    // Convert /pet/{petId} to "pet by ID"
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'root endpoint';

    const resource = parts[parts.length - 1];
    if (resource && resource.startsWith('{')) {
      const parent = parts[parts.length - 2] || 'resource';
      return `${parent} by ID`;
    }

    return resource || 'resource operation';
  }

  /**
   * Generate request configuration
   */
  private generateRequest(endpoint: ApiEndpoint): TestRequest {
    const request: TestRequest = {};

    // Generate path parameters
    const pathParams = this.generatePathParams(endpoint.parameters);
    if (Object.keys(pathParams).length > 0) {
      request.pathParams = pathParams;
    }

    // Generate query parameters
    const queryParams = this.generateQueryParams(endpoint.parameters);
    if (Object.keys(queryParams).length > 0) {
      request.queryParams = queryParams;
    }

    // Generate request body for POST, PUT, PATCH
    if (endpoint.requestBody && ['post', 'put', 'patch'].includes(endpoint.method)) {
      request.body = this.generateRequestBody(endpoint);
    }

    // Generate headers
    const headers = this.generateHeaders(endpoint.parameters);
    if (Object.keys(headers).length > 0) {
      request.headers = headers;
    }

    return request;
  }

  /**
   * Generate path parameters
   */
  private generatePathParams(parameters: ParameterObject[]): Record<string, TestValue> {
    const pathParams: Record<string, TestValue> = {};

    for (const param of parameters) {
      if (param.in === 'path' && param.schema) {
        const value = this.dataFactory.generate(param.schema as SchemaObject);
        pathParams[param.name] = {
          value,
          description: param.description,
          generated: true,
          fakerMethod: this.getFakerMethod(param.schema as SchemaObject),
        };
      }
    }

    return pathParams;
  }

  /**
   * Generate query parameters
   */
  private generateQueryParams(parameters: ParameterObject[]): Record<string, TestValue> {
    const queryParams: Record<string, TestValue> = {};

    for (const param of parameters) {
      if (param.in === 'query') {
        // Include required params or optional params based on config
        if (param.required || this.options.includeOptionalParams) {
          const schema = param.schema as SchemaObject;
          const value = schema ? this.dataFactory.generate(schema) : undefined;

          queryParams[param.name] = {
            value,
            description: param.description,
            generated: true,
            fakerMethod: this.getFakerMethod(schema),
          };
        }
      }
    }

    return queryParams;
  }

  /**
   * Generate request body
   */
  private generateRequestBody(endpoint: ApiEndpoint): TestCase['request']['body'] | undefined {
    if (!endpoint.requestBody?.content) {
      return undefined;
    }

    // Get JSON content type (most common)
    const jsonContent = endpoint.requestBody.content['application/json'];
    if (!jsonContent?.schema) {
      return undefined;
    }

    const schema = jsonContent.schema as SchemaObject;
    const data = this.bodyGenerator.generateBody(schema);

    return {
      contentType: 'application/json',
      data,
      schema,
      generated: true,
    };
  }

  /**
   * Generate headers
   */
  private generateHeaders(parameters: ParameterObject[]): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const param of parameters) {
      if (param.in === 'header' && param.required) {
        const schema = param.schema as SchemaObject;
        const value = schema ? this.dataFactory.generate(schema) : '';
        headers[param.name] = String(value);
      }
    }

    return headers;
  }

  /**
   * Generate expected response validation
   */
  private generateExpectedResponse(endpoint: ApiEndpoint): ExpectedResponse {
    const successStatuses = this.getSuccessStatuses(endpoint);
    const firstStatus = successStatuses[0];
    const responseSchema =
      firstStatus !== undefined ? this.getResponseSchema(endpoint, firstStatus) : undefined;

    // Return the status array if there are multiple, otherwise the single status
    const status =
      successStatuses.length === 1 && firstStatus !== undefined ? firstStatus : successStatuses;

    const expectedResponse: ExpectedResponse = {
      status,
    };

    if (responseSchema) {
      expectedResponse.body = {
        contentType: 'application/json',
        schema: responseSchema,
      };
    }

    return expectedResponse;
  }

  /**
   * Get success status codes (2xx)
   */
  private getSuccessStatuses(endpoint: ApiEndpoint): number[] {
    const statuses: number[] = [];

    for (const [status] of endpoint.responses.entries()) {
      if (typeof status === 'number' && status >= 200 && status < 300) {
        statuses.push(status);
      }
    }

    // Default to 200 if no success status found
    return statuses.length > 0 ? statuses : [200];
  }

  /**
   * Get response schema for a status code
   */
  private getResponseSchema(
    endpoint: ApiEndpoint,
    statusCode: number | undefined
  ): SchemaObject | undefined {
    if (statusCode === undefined) {
      return undefined;
    }

    const response = endpoint.responses.get(statusCode);
    if (!response?.content) {
      return undefined;
    }

    const jsonContent = response.content['application/json'];
    return jsonContent?.schema as SchemaObject | undefined;
  }

  /**
   * Get faker method hint from schema
   */
  private getFakerMethod(schema: SchemaObject | undefined): string | undefined {
    if (!schema) return undefined;

    const format = schema.format;
    const type = schema.type;

    if (format === 'email') return 'faker.internet.email()';
    if (format === 'uuid') return 'faker.string.uuid()';
    if (format === 'uri' || format === 'url') return 'faker.internet.url()';
    if (format === 'date') return 'faker.date.recent()';
    if (format === 'date-time') return 'faker.date.recent().toISOString()';
    if (type === 'integer') return 'faker.number.int()';
    if (type === 'number') return 'faker.number.float()';
    if (type === 'boolean') return 'faker.datatype.boolean()';
    if (type === 'string') return 'faker.lorem.sentence()';

    return undefined;
  }
}

/**
 * Convenience function to generate happy path tests
 */
export function generateHappyPathTests(
  endpoints: ApiEndpoint[],
  options?: HappyPathGeneratorOptions
): TestCase[] {
  const dataFactory = new DataFactory();
  const bodyGenerator = new RequestBodyGenerator();
  const generator = new HappyPathGenerator(dataFactory, bodyGenerator, options);
  return generator.generateTests(endpoints);
}
