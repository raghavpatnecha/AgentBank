/**
 * Flow Generator - Generates multi-step workflow tests
 * Detects and generates CRUD workflows, create-read flows, and sequential dependencies
 */

import { RequestBodyGenerator } from './request-body-generator.js';
import type { ApiEndpoint } from '../types/openapi-types.js';
import type { TestCase, TestType } from '../types/test-generator-types.js';
import {
  findCRUDSets,
  findCreateReadPairs,
  extractResourceName,
  type CRUDSet,
} from '../utils/dependency-analyzer.js';

/**
 * Workflow flow types
 */
export type FlowType = 'crud' | 'create-read' | 'list-filter' | 'custom';

/**
 * Flow step in a workflow
 */
export interface FlowStep {
  /** Endpoint to call */
  endpoint: ApiEndpoint;

  /** Step description */
  description: string;

  /** Variable to capture from response (e.g., 'userId') */
  dataPass?: string;

  /** Expected status code */
  expectedStatus: number;

  /** Step order */
  order: number;
}

/**
 * Workflow flow representing a multi-step test
 */
export interface WorkflowFlow {
  /** Flow name */
  name: string;

  /** Flow type */
  type: FlowType;

  /** Flow description */
  description: string;

  /** Flow steps */
  steps: FlowStep[];

  /** Resource being tested */
  resource: string;

  /** Tags */
  tags: string[];
}

/**
 * Flow Generator Configuration
 */
export interface FlowGeneratorOptions {
  /** Include CRUD workflows */
  includeCRUD?: boolean;

  /** Include create-read workflows */
  includeCreateRead?: boolean;

  /** Include list-filter workflows */
  includeListFilter?: boolean;

  /** Minimum steps required for a flow */
  minSteps?: number;
}

/**
 * Flow Generator
 * Generates multi-step workflow tests from API endpoints
 */
export class FlowGenerator {
  private bodyGenerator: RequestBodyGenerator;
  private options: Required<FlowGeneratorOptions>;

  constructor(bodyGenerator: RequestBodyGenerator, options: FlowGeneratorOptions = {}) {
    this.bodyGenerator = bodyGenerator;
    this.options = {
      includeCRUD: options.includeCRUD ?? true,
      includeCreateRead: options.includeCreateRead ?? true,
      includeListFilter: options.includeListFilter ?? true,
      minSteps: options.minSteps ?? 2,
    };
  }

  /**
   * Detect all possible flows from endpoints
   */
  detectFlows(endpoints: ApiEndpoint[]): WorkflowFlow[] {
    const flows: WorkflowFlow[] = [];

    // Detect CRUD workflows
    if (this.options.includeCRUD) {
      const crudFlows = this.detectCRUDFlows(endpoints);
      flows.push(...crudFlows);
    }

    // Detect create-read workflows
    if (this.options.includeCreateRead) {
      const createReadFlows = this.detectCreateReadFlows(endpoints);
      flows.push(...createReadFlows);
    }

    // Detect list-filter workflows
    if (this.options.includeListFilter) {
      const listFilterFlows = this.detectListFilterFlows(endpoints);
      flows.push(...listFilterFlows);
    }

    // Filter flows by minimum steps
    return flows.filter((flow) => flow.steps.length >= this.options.minSteps);
  }

  /**
   * Detect CRUD workflows (Create → Read → Update → Delete)
   */
  private detectCRUDFlows(endpoints: ApiEndpoint[]): WorkflowFlow[] {
    const crudSets = findCRUDSets(endpoints);
    const flows: WorkflowFlow[] = [];

    for (const crudSet of crudSets) {
      // Full CRUD workflow
      if (crudSet.create && crudSet.read && crudSet.update && crudSet.delete) {
        flows.push(this.createCRUDFlow(crudSet));
      }

      // Partial CRUD workflows (Create → Read → Update)
      if (crudSet.create && crudSet.read && crudSet.update && !crudSet.delete) {
        flows.push(this.createPartialCRUDFlow(crudSet, ['create', 'read', 'update']));
      }

      // Create → Read → Delete
      if (crudSet.create && crudSet.read && crudSet.delete && !crudSet.update) {
        flows.push(this.createPartialCRUDFlow(crudSet, ['create', 'read', 'delete']));
      }
    }

    return flows;
  }

  /**
   * Create a full CRUD flow
   */
  private createCRUDFlow(crudSet: CRUDSet): WorkflowFlow {
    const steps: FlowStep[] = [];
    const idVar = `${crudSet.resource}Id`;

    // CREATE
    steps.push({
      endpoint: crudSet.create!,
      description: `Create a new ${crudSet.resource}`,
      dataPass: idVar,
      expectedStatus: this.getExpectedStatus(crudSet.create!, 'create'),
      order: 1,
    });

    // READ
    steps.push({
      endpoint: crudSet.read!,
      description: `Read the created ${crudSet.resource}`,
      expectedStatus: 200,
      order: 2,
    });

    // UPDATE
    steps.push({
      endpoint: crudSet.update!,
      description: `Update the ${crudSet.resource}`,
      expectedStatus: this.getExpectedStatus(crudSet.update!, 'update'),
      order: 3,
    });

    // DELETE
    steps.push({
      endpoint: crudSet.delete!,
      description: `Delete the ${crudSet.resource}`,
      expectedStatus: this.getExpectedStatus(crudSet.delete!, 'delete'),
      order: 4,
    });

    // VERIFY DELETED
    steps.push({
      endpoint: crudSet.read!,
      description: `Verify ${crudSet.resource} was deleted`,
      expectedStatus: 404,
      order: 5,
    });

    return {
      name: `${crudSet.resource} CRUD workflow`,
      type: 'crud',
      description: `Complete CRUD workflow for ${crudSet.resource}`,
      steps,
      resource: crudSet.resource,
      tags: crudSet.create!.tags,
    };
  }

  /**
   * Create a partial CRUD flow
   */
  private createPartialCRUDFlow(
    crudSet: CRUDSet,
    operations: Array<'create' | 'read' | 'update' | 'delete'>
  ): WorkflowFlow {
    const steps: FlowStep[] = [];
    const idVar = `${crudSet.resource}Id`;
    let order = 1;

    for (const op of operations) {
      switch (op) {
        case 'create':
          if (crudSet.create) {
            steps.push({
              endpoint: crudSet.create,
              description: `Create a new ${crudSet.resource}`,
              dataPass: idVar,
              expectedStatus: this.getExpectedStatus(crudSet.create, 'create'),
              order: order++,
            });
          }
          break;

        case 'read':
          if (crudSet.read) {
            steps.push({
              endpoint: crudSet.read,
              description: `Read the ${crudSet.resource}`,
              expectedStatus: 200,
              order: order++,
            });
          }
          break;

        case 'update':
          if (crudSet.update) {
            steps.push({
              endpoint: crudSet.update,
              description: `Update the ${crudSet.resource}`,
              expectedStatus: this.getExpectedStatus(crudSet.update, 'update'),
              order: order++,
            });
          }
          break;

        case 'delete':
          if (crudSet.delete) {
            steps.push({
              endpoint: crudSet.delete,
              description: `Delete the ${crudSet.resource}`,
              expectedStatus: this.getExpectedStatus(crudSet.delete, 'delete'),
              order: order++,
            });
          }
          break;
      }
    }

    return {
      name: `${crudSet.resource} ${operations.join('-')} workflow`,
      type: 'crud',
      description: `${operations.join(' → ')} workflow for ${crudSet.resource}`,
      steps,
      resource: crudSet.resource,
      tags: crudSet.create?.tags ?? crudSet.read?.tags ?? [],
    };
  }

  /**
   * Detect create-read workflows (POST → GET)
   */
  private detectCreateReadFlows(endpoints: ApiEndpoint[]): WorkflowFlow[] {
    const pairs = findCreateReadPairs(endpoints);
    return pairs.map(([create, read]) => {
      const resource = extractResourceName(create) ?? 'resource';
      const idVar = `${resource}Id`;

      return {
        name: `${resource} create-read workflow`,
        type: 'create-read' as FlowType,
        description: `Create and immediately read ${resource}`,
        steps: [
          {
            endpoint: create,
            description: `Create a new ${resource}`,
            dataPass: idVar,
            expectedStatus: this.getExpectedStatus(create, 'create'),
            order: 1,
          },
          {
            endpoint: read,
            description: `Read the created ${resource}`,
            expectedStatus: 200,
            order: 2,
          },
        ],
        resource,
        tags: create.tags,
      };
    });
  }

  /**
   * Detect list-filter workflows (GET all → GET filtered)
   */
  private detectListFilterFlows(endpoints: ApiEndpoint[]): WorkflowFlow[] {
    const flows: WorkflowFlow[] = [];
    const listEndpoints = endpoints.filter((e) => e.method === 'get' && !this.hasIdParameter(e));

    for (const listEndpoint of listEndpoints) {
      // Check if this endpoint supports query parameters for filtering
      const queryParams = listEndpoint.parameters.filter((p) => p.in === 'query');
      if (queryParams.length === 0) continue;

      const resource = extractResourceName(listEndpoint) ?? 'resource';

      flows.push({
        name: `${resource} list-filter workflow`,
        type: 'list-filter',
        description: `List all ${resource} then filter results`,
        steps: [
          {
            endpoint: listEndpoint,
            description: `List all ${resource}`,
            expectedStatus: 200,
            order: 1,
          },
          {
            endpoint: listEndpoint,
            description: `List ${resource} with filters`,
            expectedStatus: 200,
            order: 2,
          },
        ],
        resource,
        tags: listEndpoint.tags,
      });
    }

    return flows;
  }

  /**
   * Generate a test case from a workflow flow
   */
  generateFlowTest(flow: WorkflowFlow): TestCase {
    const timestamp = new Date().toISOString();

    return {
      id: `flow-${flow.resource}-${flow.type}`,
      name: flow.name,
      description: flow.description,
      type: 'flow' as TestType,
      method: 'WORKFLOW', // Special method for multi-step tests
      endpoint: `/${flow.resource}`,
      request: {
        // Flow tests don't have a single request
        pathParams: {},
        queryParams: {},
        headers: {},
      },
      expectedResponse: {
        status: 200, // Overall workflow success
      },
      metadata: {
        tags: [...flow.tags, 'workflow', flow.type],
        priority: 'high',
        stability: 'stable',
        generatedAt: timestamp,
        generatorVersion: '1.0.0',
      },
    };
  }

  /**
   * Get expected status code for an operation
   */
  private getExpectedStatus(endpoint: ApiEndpoint, operation: string): number {
    // Check the endpoint's responses for success status
    const successStatuses = Array.from(endpoint.responses.keys()).filter(
      (status) => typeof status === 'number' && status >= 200 && status < 300
    );

    if (successStatuses.length > 0) {
      return successStatuses[0] as number;
    }

    // Default status codes by operation
    switch (operation) {
      case 'create':
        return 201;
      case 'update':
        return 200;
      case 'delete':
        return 204;
      default:
        return 200;
    }
  }

  /**
   * Check if endpoint has an ID parameter
   */
  private hasIdParameter(endpoint: ApiEndpoint): boolean {
    for (const param of endpoint.parameters) {
      if (param.in === 'path') {
        const name = param.name.toLowerCase();
        if (name === 'id' || name.endsWith('id')) {
          return true;
        }
      }
    }
    return /\{[^}]*id[^}]*\}/i.test(endpoint.path);
  }

  /**
   * Generate Playwright test code for a flow
   */
  generateFlowTestCode(flow: WorkflowFlow): string {
    const lines: string[] = [];
    const indent = '  ';

    lines.push(`test('${flow.name}', async ({ request }) => {`);
    lines.push(`${indent}// ${flow.description}`);
    lines.push('');

    for (const step of flow.steps) {
      lines.push(`${indent}// ${step.description.toUpperCase()}`);

      const method = step.endpoint.method.toLowerCase();

      // For steps that need the captured data, generate path with substitution
      const pathWithParams =
        step.order > 1 && flow.steps[0]?.dataPass
          ? this.generatePathWithParams(step.endpoint.path, flow.steps[0].dataPass)
          : step.endpoint.path;

      // Generate request
      if (
        step.endpoint.requestBody &&
        (method === 'post' || method === 'put' || method === 'patch')
      ) {
        const bodySchema = this.extractBodySchema(step.endpoint);
        const bodyData = bodySchema ? this.bodyGenerator.generateBody(bodySchema) : {};

        lines.push(
          `${indent}const ${step.order}Res = await request.${method}(\`${pathWithParams}\`, {`
        );
        lines.push(
          `${indent}  data: ${JSON.stringify(bodyData, null, 2).split('\n').join(`\n${indent}  `)}`
        );
        lines.push(`${indent}});`);
      } else {
        lines.push(
          `${indent}const ${step.order}Res = await request.${method}(\`${pathWithParams}\`);`
        );
      }

      // Add status assertion
      lines.push(`${indent}expect(${step.order}Res.status()).toBe(${step.expectedStatus});`);

      // Capture data if needed
      if (step.dataPass) {
        lines.push(`${indent}const ${step.order}Data = await ${step.order}Res.json();`);
        lines.push(`${indent}const ${step.dataPass} = ${step.order}Data.id;`);
      }

      lines.push('');
    }

    lines.push('});');

    return lines.join('\n');
  }

  /**
   * Generate path with parameter placeholders
   */
  private generatePathWithParams(path: string, dataPassVar?: string): string {
    if (!dataPassVar) return path;
    // Replace path parameters with template literal syntax
    return path.replace(/\{[^}]+\}/g, `\${${dataPassVar}}`);
  }

  /**
   * Extract body schema from endpoint
   */
  private extractBodySchema(endpoint: ApiEndpoint): any {
    if (!endpoint.requestBody) return null;

    const content = endpoint.requestBody.content;
    const jsonContent = content['application/json'];
    if (!jsonContent?.schema) return null;

    return jsonContent.schema;
  }
}
