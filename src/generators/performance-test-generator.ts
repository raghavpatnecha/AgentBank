/**
 * Performance Test Generator
 * Generates load, stress, spike, and endurance tests from OpenAPI endpoints
 */

import type { ApiEndpoint } from '../types/openapi-types.js';
import type {
  PerformanceTestCase,
  PerformanceConfig,
  PerformanceAssertion,
  LoadPattern,
  PerformanceTestType,
  SessionConfig,
  PerformanceGeneratorOptions,
  LoadProfile,
  LoadStage,
} from '../types/performance-types.js';
import type { TestRequest, ExpectedResponse } from '../types/test-generator-types.js';

/**
 * Performance Test Generator
 * Creates performance tests for load, stress, spike, and endurance testing
 */
export class PerformanceTestGenerator {
  private options: Required<PerformanceGeneratorOptions>;

  constructor(options: PerformanceGeneratorOptions = {}) {
    this.options = {
      defaultUsers: options.defaultUsers ?? 10,
      defaultDuration: options.defaultDuration ?? 60,
      defaultThinkTime: options.defaultThinkTime ?? {
        min: 1000,
        max: 3000,
        distribution: 'uniform',
      },
      defaultAssertions: options.defaultAssertions ?? [],
      enableSessions: options.enableSessions ?? true,
      generateMultipleScenarios: options.generateMultipleScenarios ?? true,
    };
  }

  /**
   * Generate performance tests for endpoints
   */
  generateTests(endpoints: ApiEndpoint[]): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    for (const endpoint of endpoints) {
      // Generate different types of performance tests
      tests.push(this.generateLoadTest(endpoint));

      if (this.options.generateMultipleScenarios) {
        tests.push(this.generateStressTest(endpoint));
        tests.push(this.generateSpikeTest(endpoint));
        tests.push(this.generateEnduranceTest(endpoint));
      }
    }

    return tests;
  }

  /**
   * Generate a load test (constant user load)
   */
  generateLoadTest(endpoint: ApiEndpoint): PerformanceTestCase {
    const performanceConfig: PerformanceConfig = {
      testType: 'load',
      loadPattern: 'constant',
      virtualUsers: this.options.defaultUsers,
      duration: this.options.defaultDuration,
      rampUpTime: 10,
      rampDownTime: 5,
    };

    return this.createPerformanceTest(
      endpoint,
      'load-test',
      `Load test: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      performanceConfig,
      this.getDefaultAssertions()
    );
  }

  /**
   * Generate a stress test (find breaking point)
   */
  generateStressTest(endpoint: ApiEndpoint): PerformanceTestCase {
    const performanceConfig: PerformanceConfig = {
      testType: 'stress',
      loadPattern: 'ramp',
      virtualUsers: this.options.defaultUsers * 5, // 5x normal load
      duration: this.options.defaultDuration * 2,
      rampUpTime: 60, // Gradual increase
      rampDownTime: 10,
    };

    const assertions = this.getStressTestAssertions();

    return this.createPerformanceTest(
      endpoint,
      'stress-test',
      `Stress test: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      performanceConfig,
      assertions
    );
  }

  /**
   * Generate a spike test (sudden load increase)
   */
  generateSpikeTest(endpoint: ApiEndpoint): PerformanceTestCase {
    const performanceConfig: PerformanceConfig = {
      testType: 'spike',
      loadPattern: 'spike',
      virtualUsers: this.options.defaultUsers * 10, // 10x spike
      duration: 120,
      rampUpTime: 5, // Sudden increase
      rampDownTime: 5,
    };

    const assertions = this.getSpikeTestAssertions();

    return this.createPerformanceTest(
      endpoint,
      'spike-test',
      `Spike test: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      performanceConfig,
      assertions
    );
  }

  /**
   * Generate an endurance test (sustained load)
   */
  generateEnduranceTest(endpoint: ApiEndpoint): PerformanceTestCase {
    const performanceConfig: PerformanceConfig = {
      testType: 'endurance',
      loadPattern: 'constant',
      virtualUsers: Math.ceil(this.options.defaultUsers * 0.7), // 70% of load
      duration: 3600, // 1 hour
      rampUpTime: 30,
      rampDownTime: 10,
    };

    const assertions = this.getEnduranceTestAssertions();

    return this.createPerformanceTest(
      endpoint,
      'endurance-test',
      `Endurance test: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      performanceConfig,
      assertions
    );
  }

  /**
   * Create a performance test case
   */
  private createPerformanceTest(
    endpoint: ApiEndpoint,
    idPrefix: string,
    name: string,
    performanceConfig: PerformanceConfig,
    assertions: PerformanceAssertion[]
  ): PerformanceTestCase {
    const testId = `${idPrefix}-${endpoint.method}-${endpoint.path
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()}`;

    const request = this.generateRequest(endpoint);
    const expectedResponse = this.generateExpectedResponse(endpoint);

    return {
      id: testId,
      name,
      description: `${performanceConfig.testType} test for ${endpoint.summary || endpoint.path}`,
      type: 'performance',
      method: endpoint.method.toUpperCase(),
      endpoint: endpoint.path,
      request,
      expectedResponse,
      performance: performanceConfig,
      assertions,
      thinkTime: this.options.defaultThinkTime,
      session: this.options.enableSessions ? this.getDefaultSessionConfig() : undefined,
      metadata: {
        tags: [...endpoint.tags, 'performance', performanceConfig.testType],
        priority: 'medium',
        stability: 'stable',
        operationId: endpoint.operationId,
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Generate request configuration
   */
  private generateRequest(endpoint: ApiEndpoint): TestRequest {
    const request: TestRequest = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    // Add path parameters
    const pathParams = endpoint.parameters?.filter((p) => p.in === 'path');
    if (pathParams && pathParams.length > 0) {
      request.pathParams = {};
      for (const param of pathParams) {
        request.pathParams[param.name] = {
          value: this.generateParameterValue(param),
          description: param.description,
          generated: true,
        };
      }
    }

    // Add query parameters
    const queryParams = endpoint.parameters?.filter((p) => p.in === 'query');
    if (queryParams && queryParams.length > 0) {
      request.queryParams = {};
      for (const param of queryParams) {
        if (param.required) {
          request.queryParams[param.name] = {
            value: this.generateParameterValue(param),
            description: param.description,
            generated: true,
          };
        }
      }
    }

    // Add request body for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(endpoint.method.toLowerCase()) && endpoint.requestBody) {
      request.body = {
        contentType: 'application/json',
        data: this.generateRequestBody(endpoint),
        generated: true,
      };
    }

    return request;
  }

  /**
   * Generate parameter value
   */
  private generateParameterValue(param: any): any {
    const schema = param.schema;

    if (!schema) {
      return 'test-value';
    }

    switch (schema.type) {
      case 'integer':
        return schema.minimum ?? 1;
      case 'number':
        return schema.minimum ?? 1.0;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      case 'string':
      default:
        if (schema.enum) {
          return schema.enum[0];
        }
        return schema.example || `test-${param.name}`;
    }
  }

  /**
   * Generate request body
   */
  private generateRequestBody(endpoint: ApiEndpoint): any {
    // Simple mock data generation
    const content = endpoint.requestBody?.content;
    if (!content) {
      return {};
    }

    const jsonContent = content['application/json'];
    if (!jsonContent || !jsonContent.schema) {
      return {};
    }

    const schema = jsonContent.schema;
    return this.generateFromSchema(schema);
  }

  /**
   * Generate data from schema
   */
  private generateFromSchema(schema: any): any {
    if (!schema) {
      return null;
    }

    if (schema.example) {
      return schema.example;
    }

    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            const required = schema.required?.includes(key);
            if (required) {
              obj[key] = this.generateFromSchema(propSchema);
            }
          }
        }
        return obj;

      case 'array':
        return schema.items ? [this.generateFromSchema(schema.items)] : [];

      case 'string':
        if (schema.enum) {
          return schema.enum[0];
        }
        return schema.format === 'email' ? 'test@example.com' : 'test-string';

      case 'integer':
        return schema.minimum ?? 1;

      case 'number':
        return schema.minimum ?? 1.0;

      case 'boolean':
        return true;

      default:
        return null;
    }
  }

  /**
   * Generate expected response
   */
  private generateExpectedResponse(endpoint: ApiEndpoint): ExpectedResponse {
    // Find success response
    const successCodes = [200, 201, 204];
    let statusCode = 200;

    for (const code of successCodes) {
      if (endpoint.responses.has(code)) {
        statusCode = code;
        break;
      }
    }

    return {
      status: statusCode,
      maxResponseTime: 1000, // 1 second default SLA
    };
  }

  /**
   * Get default performance assertions
   */
  private getDefaultAssertions(): PerformanceAssertion[] {
    return [
      {
        name: 'Response time p95 < 1000ms',
        metric: 'response_time_p95',
        operator: 'lt',
        threshold: 1000,
        severity: 'error',
        scope: 'p95',
      },
      {
        name: 'Error rate < 1%',
        metric: 'error_rate',
        operator: 'lt',
        threshold: 0.01,
        severity: 'critical',
      },
      {
        name: 'Throughput > 10 RPS',
        metric: 'throughput',
        operator: 'gt',
        threshold: 10,
        severity: 'warning',
      },
    ];
  }

  /**
   * Get stress test assertions
   */
  private getStressTestAssertions(): PerformanceAssertion[] {
    return [
      {
        name: 'Response time p99 < 5000ms',
        metric: 'response_time_p99',
        operator: 'lt',
        threshold: 5000,
        severity: 'warning',
        scope: 'p99',
      },
      {
        name: 'Error rate < 5%',
        metric: 'error_rate',
        operator: 'lt',
        threshold: 0.05,
        severity: 'error',
      },
    ];
  }

  /**
   * Get spike test assertions
   */
  private getSpikeTestAssertions(): PerformanceAssertion[] {
    return [
      {
        name: 'Response time p95 < 3000ms during spike',
        metric: 'response_time_p95',
        operator: 'lt',
        threshold: 3000,
        severity: 'warning',
        scope: 'p95',
      },
      {
        name: 'Error rate < 2% during spike',
        metric: 'error_rate',
        operator: 'lt',
        threshold: 0.02,
        severity: 'error',
      },
    ];
  }

  /**
   * Get endurance test assertions
   */
  private getEnduranceTestAssertions(): PerformanceAssertion[] {
    return [
      {
        name: 'Response time p95 < 1500ms over duration',
        metric: 'response_time_p95',
        operator: 'lt',
        threshold: 1500,
        severity: 'error',
        scope: 'p95',
      },
      {
        name: 'Error rate < 0.5% sustained',
        metric: 'error_rate',
        operator: 'lt',
        threshold: 0.005,
        severity: 'critical',
      },
      {
        name: 'No memory leaks (stable resource usage)',
        metric: 'memory_usage',
        operator: 'lt',
        threshold: 1000, // MB
        severity: 'warning',
      },
    ];
  }

  /**
   * Get default session configuration
   */
  private getDefaultSessionConfig(): SessionConfig {
    return {
      cookies: true,
      sessionStorage: false,
      timeout: 300000, // 5 minutes
    };
  }

  /**
   * Generate load profile for complex scenarios
   */
  generateLoadProfile(
    pattern: LoadPattern,
    peakUsers: number,
    duration: number
  ): LoadProfile {
    const stages: LoadStage[] = [];

    switch (pattern) {
      case 'ramp':
        stages.push(
          { name: 'Ramp Up', targetUsers: peakUsers, duration: duration * 0.3, rampTime: duration * 0.3 },
          { name: 'Sustain', targetUsers: peakUsers, duration: duration * 0.4 },
          { name: 'Ramp Down', targetUsers: 0, duration: duration * 0.3, rampTime: duration * 0.3 }
        );
        break;

      case 'spike':
        stages.push(
          { name: 'Baseline', targetUsers: Math.ceil(peakUsers * 0.1), duration: duration * 0.2 },
          { name: 'Spike', targetUsers: peakUsers, duration: duration * 0.3, rampTime: duration * 0.05 },
          { name: 'Recovery', targetUsers: Math.ceil(peakUsers * 0.1), duration: duration * 0.3, rampTime: duration * 0.1 },
          { name: 'Ramp Down', targetUsers: 0, duration: duration * 0.2, rampTime: duration * 0.2 }
        );
        break;

      case 'wave':
        const waveDuration = duration / 4;
        for (let i = 0; i < 4; i++) {
          stages.push({
            name: `Wave ${i + 1} Up`,
            targetUsers: peakUsers,
            duration: waveDuration / 2,
            rampTime: waveDuration / 2,
          });
          stages.push({
            name: `Wave ${i + 1} Down`,
            targetUsers: Math.ceil(peakUsers * 0.3),
            duration: waveDuration / 2,
            rampTime: waveDuration / 2,
          });
        }
        break;

      case 'step':
        const steps = 5;
        const stepDuration = duration / steps;
        for (let i = 1; i <= steps; i++) {
          stages.push({
            name: `Step ${i}`,
            targetUsers: Math.ceil((peakUsers / steps) * i),
            duration: stepDuration,
            rampTime: stepDuration * 0.2,
          });
        }
        break;

      case 'constant':
      default:
        stages.push({
          name: 'Constant Load',
          targetUsers: peakUsers,
          duration,
        });
        break;
    }

    return {
      pattern,
      stages,
      totalDuration: duration,
      peakUsers,
    };
  }

  /**
   * Generate performance test from OpenAPI spec
   */
  generateFromSpec(
    endpoint: ApiEndpoint,
    testType: PerformanceTestType = 'load',
    users: number = this.options.defaultUsers,
    duration: number = this.options.defaultDuration
  ): PerformanceTestCase {
    const performanceConfig: PerformanceConfig = {
      testType,
      loadPattern: this.getLoadPatternForTestType(testType),
      virtualUsers: users,
      duration,
      rampUpTime: Math.ceil(duration * 0.1),
      rampDownTime: Math.ceil(duration * 0.05),
    };

    const assertions = this.getAssertionsForTestType(testType);

    return this.createPerformanceTest(
      endpoint,
      testType,
      `${testType} test: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      performanceConfig,
      assertions
    );
  }

  /**
   * Get load pattern for test type
   */
  private getLoadPatternForTestType(testType: PerformanceTestType): LoadPattern {
    const patterns: Record<PerformanceTestType, LoadPattern> = {
      load: 'constant',
      stress: 'ramp',
      spike: 'spike',
      endurance: 'constant',
      scalability: 'step',
      soak: 'constant',
    };

    return patterns[testType] || 'constant';
  }

  /**
   * Get assertions for test type
   */
  private getAssertionsForTestType(testType: PerformanceTestType): PerformanceAssertion[] {
    switch (testType) {
      case 'stress':
        return this.getStressTestAssertions();
      case 'spike':
        return this.getSpikeTestAssertions();
      case 'endurance':
      case 'soak':
        return this.getEnduranceTestAssertions();
      default:
        return this.getDefaultAssertions();
    }
  }
}
