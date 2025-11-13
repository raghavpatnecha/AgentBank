/**
 * Integration Example: Test Data Management with AgentBank
 * Demonstrates integration with the existing test generation and API testing system
 */

import { faker } from '@faker-js/faker';
import { TestDataManager } from '../../src/data/test-data-manager.js';
import { FactoryRegistry, sequence, sequences } from '../../src/data/entity-factory.js';
import {
  EntityDefinition,
  RelationType,
  CleanupStrategy,
} from '../../src/types/test-data-types.js';

/**
 * API Test Data Entities
 */

interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: ApiParameter[];
  requestBody?: any;
  responses?: ApiResponse[];
}

interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
}

interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

interface TestCase {
  id: string;
  endpointId: string;
  name: string;
  type: 'happy-path' | 'error-case' | 'edge-case';
  request: {
    params?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
  };
  expectedResponse: {
    statusCode: number;
    body?: any;
    headers?: Record<string, string>;
  };
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
  testCases: TestCase[];
}

/**
 * Factory Definitions for API Testing
 */

const apiEndpointFactory: EntityDefinition<ApiEndpoint> = {
  type: 'apiEndpoint',

  factory: (overrides = {}) => ({
    id: faker.string.uuid(),
    path: `/api/${faker.lorem.word()}`,
    method: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']),
    description: faker.lorem.sentence(),
    parameters: [],
    responses: [],
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
    path: sequence(n => `/api/v1/resource${n}`),
  },

  traits: {
    withAuth: {
      name: 'withAuth',
      attributes: {
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            type: 'string',
            description: 'Bearer token',
          },
        ],
      },
    },
    listEndpoint: {
      name: 'listEndpoint',
      attributes: {
        method: 'GET',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            type: 'number',
            description: 'Page number',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            type: 'number',
            description: 'Items per page',
          },
        ],
      },
    },
    createEndpoint: {
      name: 'createEndpoint',
      attributes: {
        method: 'POST',
      },
    },
  },

  relationships: [
    {
      name: 'testCases',
      type: RelationType.HAS_MANY,
      target: 'testCase',
      foreignKey: 'endpointId',
      autoCreate: true,
      factory: 'testCase',
      count: 5,
    },
  ],
};

const testCaseFactory: EntityDefinition<TestCase> = {
  type: 'testCase',

  factory: (overrides = {}, context) => ({
    id: faker.string.uuid(),
    endpointId: context?.parent?.id || faker.string.uuid(),
    name: faker.lorem.words(4),
    type: 'happy-path',
    request: {
      params: {},
      body: {},
      headers: {},
    },
    expectedResponse: {
      statusCode: 200,
      body: {},
    },
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
    name: sequence(n => `Test Case ${n}`),
  },

  traits: {
    happyPath: {
      name: 'happyPath',
      attributes: {
        type: 'happy-path',
        expectedResponse: {
          statusCode: 200,
        },
      },
    },
    errorCase: {
      name: 'errorCase',
      attributes: {
        type: 'error-case',
        expectedResponse: {
          statusCode: faker.helpers.arrayElement([400, 401, 403, 404, 500]),
        },
      },
    },
    edgeCase: {
      name: 'edgeCase',
      attributes: {
        type: 'edge-case',
      },
    },
    unauthorized: {
      name: 'unauthorized',
      attributes: {
        type: 'error-case',
        request: {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        },
        expectedResponse: {
          statusCode: 401,
          body: { error: 'Unauthorized' },
        },
      },
    },
    notFound: {
      name: 'notFound',
      attributes: {
        type: 'error-case',
        expectedResponse: {
          statusCode: 404,
          body: { error: 'Not found' },
        },
      },
    },
  },
};

const testSuiteFactory: EntityDefinition<TestSuite> = {
  type: 'testSuite',

  factory: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    endpoints: [],
    testCases: [],
    ...overrides,
  }),

  sequences: {
    id: sequences.uuid(),
    name: sequence(n => `Test Suite ${n}`),
  },

  relationships: [
    {
      name: 'endpoints',
      type: RelationType.HAS_MANY,
      target: 'apiEndpoint',
      autoCreate: true,
      factory: 'apiEndpoint',
      count: 10,
    },
  ],
};

/**
 * Setup test data management for AgentBank
 */
export function setupAgentBankTestData(): TestDataManager {
  const manager = new TestDataManager({
    cleanupAfterTests: CleanupStrategy.DELETE,
    useTransactions: true,
    snapshots: {
      enabled: true,
      autoCreate: true,
    },
    fixtures: {
      baseDir: './examples/test-data/fixtures',
      cache: true,
    },
    entities: {
      maxDepth: 5,
      autoCreateRelationships: true,
      validate: true,
    },
  });

  // Register factories
  manager.registerFactory(apiEndpointFactory);
  manager.registerFactory(testCaseFactory);
  manager.registerFactory(testSuiteFactory);

  return manager;
}

/**
 * Example 1: Generate API test data for a REST API
 */
export async function generateRestApiTestData() {
  console.log('=== Generating REST API Test Data ===\n');

  const manager = setupAgentBankTestData();

  // Create a complete REST API test suite
  const endpoints = [
    // Users API
    await manager.create('apiEndpoint', {
      path: '/api/users',
      method: 'GET',
      description: 'List all users',
    }),
    await manager.create('apiEndpoint', {
      path: '/api/users/{id}',
      method: 'GET',
      description: 'Get user by ID',
    }),
    await manager.create('apiEndpoint', {
      path: '/api/users',
      method: 'POST',
      description: 'Create new user',
    }),
    await manager.create('apiEndpoint', {
      path: '/api/users/{id}',
      method: 'PUT',
      description: 'Update user',
    }),
    await manager.create('apiEndpoint', {
      path: '/api/users/{id}',
      method: 'DELETE',
      description: 'Delete user',
    }),
  ];

  console.log(`Created ${endpoints.length} API endpoints`);
  console.log('\nEndpoints:');
  endpoints.forEach(e => console.log(`  ${e.method} ${e.path} - ${e.description}`));

  // Create test cases for each endpoint
  for (const endpoint of endpoints) {
    // Happy path test
    await manager.create('testCase', {
      endpointId: endpoint.id,
      name: `${endpoint.method} ${endpoint.path} - Success`,
      type: 'happy-path',
      expectedResponse: {
        statusCode: endpoint.method === 'POST' ? 201 : 200,
      },
    });

    // Error cases
    await manager.create('testCase', {
      endpointId: endpoint.id,
      name: `${endpoint.method} ${endpoint.path} - Unauthorized`,
      type: 'error-case',
      expectedResponse: {
        statusCode: 401,
      },
    });

    if (endpoint.path.includes('{id}')) {
      await manager.create('testCase', {
        endpointId: endpoint.id,
        name: `${endpoint.method} ${endpoint.path} - Not Found`,
        type: 'error-case',
        expectedResponse: {
          statusCode: 404,
        },
      });
    }
  }

  const stats = manager.getStats();
  console.log('\nTest Data Statistics:');
  console.log(`  Endpoints: ${stats.byType['apiEndpoint'] || 0}`);
  console.log(`  Test Cases: ${stats.byType['testCase'] || 0}`);

  return { manager, endpoints };
}

/**
 * Example 2: Create test data with relationships
 */
export async function createTestDataWithRelationships() {
  console.log('\n=== Creating Test Data with Relationships ===\n');

  const manager = setupAgentBankTestData();
  const registry = new FactoryRegistry();
  registry.register(apiEndpointFactory);
  registry.register(testCaseFactory);
  registry.register(testSuiteFactory);

  // Create test suite with auto-generated endpoints and test cases
  const suite = await registry
    .get('testSuite')
    .build({
      name: 'User Management API Tests',
      description: 'Complete test suite for user management endpoints',
    });

  console.log('Test Suite:', suite.name);
  console.log(`  Endpoints: ${suite.endpoints?.length || 0}`);
  console.log(`  Test Cases: ${suite.testCases?.length || 0}`);

  return { manager, suite };
}

/**
 * Example 3: Load fixtures for known test scenarios
 */
export async function loadTestFixtures() {
  console.log('\n=== Loading Test Fixtures ===\n');

  const manager = setupAgentBankTestData();

  // Create fixture file data
  const fixtures = [
    {
      id: 'endpoint-user-list',
      type: 'apiEndpoint',
      data: {
        id: 'ep_1',
        path: '/api/users',
        method: 'GET',
        description: 'List all users with pagination',
        parameters: [
          { name: 'page', in: 'query', required: false, type: 'number' },
          { name: 'limit', in: 'query', required: false, type: 'number' },
        ],
      },
      traits: ['listEndpoint', 'withAuth'],
    },
  ];

  console.log(`Loaded ${fixtures.length} fixtures`);

  return { manager, fixtures };
}

/**
 * Example 4: Integration with test generation
 */
export async function integrateWithTestGeneration() {
  console.log('\n=== Integration with Test Generation ===\n');

  const manager = setupAgentBankTestData();

  // Create initial snapshot
  await manager.createSnapshot('before-tests', {
    description: 'State before test generation',
  });

  // Generate test data
  const endpoint = await manager.create('apiEndpoint', {
    path: '/api/products',
    method: 'GET',
    description: 'Get product list',
  });

  // Create various test cases
  const testCases = await Promise.all([
    manager.create('testCase', {
      endpointId: endpoint.id,
      name: 'Get products - Success',
      type: 'happy-path',
    }),
    manager.create('testCase', {
      endpointId: endpoint.id,
      name: 'Get products - Empty list',
      type: 'edge-case',
    }),
    manager.create('testCase', {
      endpointId: endpoint.id,
      name: 'Get products - Unauthorized',
      type: 'error-case',
    }),
  ]);

  console.log('Generated Test Cases:');
  testCases.forEach(tc => console.log(`  - ${tc.name} (${tc.type})`));

  // Simulate test execution
  console.log('\nSimulating test execution...');

  // Rollback to initial state
  await manager.restoreSnapshot('before-tests');
  console.log('Restored to initial state after tests');

  return { manager, endpoint, testCases };
}

/**
 * Example 5: Cleanup strategies for test isolation
 */
export async function demonstrateCleanupStrategies() {
  console.log('\n=== Cleanup Strategies ===\n');

  // Strategy 1: Transaction-based cleanup
  const manager1 = setupAgentBankTestData();
  const tx = await manager1.beginTransaction();

  await manager1.create('apiEndpoint', {
    path: '/api/test',
    method: 'GET',
  });

  console.log('Before rollback:', manager1.getStats());
  await manager1.rollbackTransaction();
  console.log('After rollback:', manager1.getStats());

  // Strategy 2: Snapshot-based cleanup
  const manager2 = setupAgentBankTestData();
  await manager2.createSnapshot('initial');

  await manager2.createMany('apiEndpoint', 5);
  console.log('\nBefore snapshot restore:', manager2.getStats());

  await manager2.restoreSnapshot('initial');
  console.log('After snapshot restore:', manager2.getStats());

  // Strategy 3: Direct cleanup
  const manager3 = setupAgentBankTestData();
  await manager3.createMany('apiEndpoint', 5);

  console.log('\nBefore cleanup:', manager3.getStats());
  await manager3.cleanup(CleanupStrategy.DELETE);
  console.log('After cleanup:', manager3.getStats());
}

/**
 * Example 6: Complex scenario - E-commerce API testing
 */
export async function ecommerceApiTestScenario() {
  console.log('\n=== E-commerce API Test Scenario ===\n');

  const manager = setupAgentBankTestData();

  // Define e-commerce endpoints
  const endpoints = {
    products: await manager.create('apiEndpoint', {
      path: '/api/products',
      method: 'GET',
      description: 'Get product catalog',
    }),
    productDetail: await manager.create('apiEndpoint', {
      path: '/api/products/{id}',
      method: 'GET',
      description: 'Get product details',
    }),
    cart: await manager.create('apiEndpoint', {
      path: '/api/cart',
      method: 'POST',
      description: 'Add to cart',
    }),
    checkout: await manager.create('apiEndpoint', {
      path: '/api/checkout',
      method: 'POST',
      description: 'Complete checkout',
    }),
    orders: await manager.create('apiEndpoint', {
      path: '/api/orders',
      method: 'GET',
      description: 'Get order history',
    }),
  };

  console.log('E-commerce Endpoints Created:');
  Object.entries(endpoints).forEach(([key, ep]) => {
    console.log(`  ${key}: ${ep.method} ${ep.path}`);
  });

  // Create test scenarios
  const scenarios = [
    {
      name: 'Browse and Purchase Flow',
      steps: [
        { endpoint: endpoints.products, description: 'Browse products' },
        { endpoint: endpoints.productDetail, description: 'View product details' },
        { endpoint: endpoints.cart, description: 'Add to cart' },
        { endpoint: endpoints.checkout, description: 'Complete purchase' },
        { endpoint: endpoints.orders, description: 'View order confirmation' },
      ],
    },
  ];

  console.log('\nTest Scenarios:');
  scenarios.forEach(scenario => {
    console.log(`\n${scenario.name}:`);
    scenario.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.description}`);
    });
  });

  return { manager, endpoints, scenarios };
}

/**
 * Run all integration examples
 */
export async function runIntegrationExamples() {
  console.log('='.repeat(70));
  console.log('AgentBank Test Data Management Integration Examples');
  console.log('='.repeat(70));

  try {
    await generateRestApiTestData();
    await createTestDataWithRelationships();
    await loadTestFixtures();
    await integrateWithTestGeneration();
    await demonstrateCleanupStrategies();
    await ecommerceApiTestScenario();

    console.log('\n' + '='.repeat(70));
    console.log('All integration examples completed successfully!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runIntegrationExamples().catch(console.error);
