/**
 * WebSocket Test Generator
 * Generates comprehensive WebSocket tests from OpenAPI specifications
 */

import type { ParsedApiSpec, SchemaObject } from '../types/openapi-types.js';
import {
  WebSocketAssertionType,
  MessageType,
} from '../types/websocket-types.js';
import type {
  WebSocketTestCase,
  WebSocketEndpoint,
  WebSocketTestGenerationOptions,
  WebSocketScenarioType,
  WebSocketConnectionConfig,
  WebSocketMessageTest,
  OpenAPIWebSocketExtension,
} from '../types/websocket-types.js';
import type { TestMetadata } from '../types/test-generator-types.js';

/**
 * WebSocket Test Generator
 * Generates test cases for WebSocket endpoints
 */
export class WebSocketTestGenerator {
  private spec: ParsedApiSpec;
  private options: WebSocketTestGenerationOptions;
  private baseURL: string;

  constructor(spec: ParsedApiSpec, baseURL: string, options: WebSocketTestGenerationOptions = {}) {
    this.spec = spec;
    this.baseURL = baseURL;
    this.options = {
      scenarios: [
        'connection',
        'echo',
        'json',
        'heartbeat',
        'close',
        'error',
        'ordering',
      ],
      includeAuth: true,
      includeReconnection: true,
      includePerformance: false,
      messageCount: 5,
      concurrentConnections: 3,
      defaultTimeout: 10000,
      ...options,
    };
  }

  /**
   * Extract WebSocket endpoints from OpenAPI spec
   */
  extractWebSocketEndpoints(): WebSocketEndpoint[] {
    const endpoints: WebSocketEndpoint[] = [];

    // Check for x-websocket extension in paths
    if (!this.spec.paths) {
      return endpoints;
    }

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem) continue;

      // Look for x-websocket extension
      const wsExtension = (pathItem as any)['x-websocket'] as OpenAPIWebSocketExtension | undefined;

      if (wsExtension) {
        const endpoint = this.parseWebSocketExtension(path, wsExtension);
        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  /**
   * Parse WebSocket extension from OpenAPI
   */
  private parseWebSocketExtension(path: string, extension: OpenAPIWebSocketExtension): WebSocketEndpoint {
    // Convert HTTP(S) base URL to WS(S)
    const wsURL = this.baseURL
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:');

    return {
      path: extension.path || path,
      url: `${wsURL}${extension.path || path}`,
      description: extension.description,
      parameters: extension.parameters?.map(p => ({
        name: p.name,
        in: p.in,
        required: p.required || false,
        schema: p.schema,
      })) || [],
      security: extension.security || [],
      messages: {
        send: extension.messages?.send || [],
        receive: extension.messages?.receive || [],
      },
      subprotocols: extension.subprotocols || [],
      tags: extension.tags || ['websocket'],
    };
  }

  /**
   * Generate all WebSocket tests
   */
  generateTests(endpoints?: WebSocketEndpoint[]): WebSocketTestCase[] {
    const wsEndpoints = endpoints || this.extractWebSocketEndpoints();
    const tests: WebSocketTestCase[] = [];

    for (const endpoint of wsEndpoints) {
      tests.push(...this.generateEndpointTests(endpoint));
    }

    return tests;
  }

  /**
   * Generate tests for a specific endpoint
   */
  private generateEndpointTests(endpoint: WebSocketEndpoint): WebSocketTestCase[] {
    const tests: WebSocketTestCase[] = [];
    const scenarios = this.options.scenarios || [];

    for (const scenario of scenarios) {
      const scenarioTests = this.generateScenarioTests(endpoint, scenario);
      tests.push(...scenarioTests);
    }

    return tests;
  }

  /**
   * Generate tests for a specific scenario
   */
  private generateScenarioTests(
    endpoint: WebSocketEndpoint,
    scenario: WebSocketScenarioType
  ): WebSocketTestCase[] {
    switch (scenario) {
      case 'connection':
        return [this.generateConnectionTest(endpoint)];
      case 'echo':
        return [this.generateEchoTest(endpoint)];
      case 'binary':
        return [this.generateBinaryTest(endpoint)];
      case 'json':
        return [this.generateJSONTest(endpoint)];
      case 'heartbeat':
        return [this.generateHeartbeatTest(endpoint)];
      case 'reconnection':
        return this.options.includeReconnection ? [this.generateReconnectionTest(endpoint)] : [];
      case 'close':
        return [this.generateCloseTest(endpoint)];
      case 'error':
        return [this.generateErrorTest(endpoint)];
      case 'ordering':
        return [this.generateOrderingTest(endpoint)];
      case 'concurrent':
        return [this.generateConcurrentTest(endpoint)];
      case 'authentication':
        return this.options.includeAuth ? this.generateAuthTests(endpoint) : [];
      case 'subscription':
        return [this.generateSubscriptionTest(endpoint)];
      default:
        return [];
    }
  }

  /**
   * Generate connection establishment test
   */
  private generateConnectionTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    return {
      id: `ws-connection-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Connection - ${endpoint.path}`,
      description: 'Test WebSocket connection establishment',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.CONNECTION_ESTABLISHED,
          target: 'connection',
          expected: 'open',
          message: 'WebSocket connection should be established',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'connection'),
    };
  }

  /**
   * Generate echo test (send message and receive same back)
   */
  private generateEchoTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);
    const echoMessage = 'Hello WebSocket!';

    const messages: WebSocketMessageTest[] = [
      {
        id: 'send-echo',
        type: MessageType.TEXT,
        direction: 'send',
        data: {
          payload: echoMessage,
          format: 'text',
        },
        expectedResponse: {
          payload: echoMessage,
          format: 'text',
        },
        responseTimeout: 5000,
      },
      {
        id: 'receive-echo',
        type: MessageType.TEXT,
        direction: 'receive',
        data: {
          payload: echoMessage,
          format: 'text',
        },
      },
    ];

    return {
      id: `ws-echo-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Echo Test - ${endpoint.path}`,
      description: 'Test WebSocket message echo (send and receive)',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.MESSAGE_RECEIVED,
          target: 'message',
          expected: echoMessage,
          message: 'Should receive echoed message',
        },
        {
          type: WebSocketAssertionType.MESSAGE_CONTENT,
          target: 'payload',
          expected: echoMessage,
          message: 'Received message content should match sent message',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'echo'),
    };
  }

  /**
   * Generate binary message test
   */
  private generateBinaryTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);
    const binaryData = Buffer.from('Binary test data', 'utf-8');

    const messages: WebSocketMessageTest[] = [
      {
        id: 'send-binary',
        type: MessageType.BINARY,
        direction: 'send',
        data: {
          payload: binaryData,
          format: 'binary',
        },
        responseTimeout: 5000,
      },
    ];

    return {
      id: `ws-binary-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Binary Message - ${endpoint.path}`,
      description: 'Test WebSocket binary message handling',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.MESSAGE_RECEIVED,
          target: 'message',
          expected: true,
          message: 'Should receive response to binary message',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'binary'),
    };
  }

  /**
   * Generate JSON message test
   */
  private generateJSONTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    // Use first send message schema if available
    const messageSchema = endpoint.messages.send[0];
    const payload = messageSchema
      ? this.generateDataFromSchema(messageSchema.schema)
      : { type: 'test', data: 'JSON test message' };

    const messages: WebSocketMessageTest[] = [
      {
        id: 'send-json',
        type: MessageType.JSON,
        direction: 'send',
        data: {
          payload,
          format: 'json',
        },
        schema: messageSchema?.schema,
        responseTimeout: 5000,
      },
    ];

    return {
      id: `ws-json-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket JSON Message - ${endpoint.path}`,
      description: 'Test WebSocket JSON message handling',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.MESSAGE_RECEIVED,
          target: 'message',
          expected: true,
          message: 'Should receive response to JSON message',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'json'),
    };
  }

  /**
   * Generate heartbeat test (ping/pong)
   */
  private generateHeartbeatTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);
    connectionConfig.heartbeatInterval = 2000;

    return {
      id: `ws-heartbeat-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Heartbeat - ${endpoint.path}`,
      description: 'Test WebSocket ping/pong heartbeat',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.PING_PONG,
          target: 'heartbeat',
          expected: true,
          message: 'Should successfully complete ping/pong heartbeat',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'heartbeat'),
    };
  }

  /**
   * Generate reconnection test
   */
  private generateReconnectionTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);
    connectionConfig.reconnection = {
      enabled: true,
      maxAttempts: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 5000,
    };

    return {
      id: `ws-reconnect-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Reconnection - ${endpoint.path}`,
      description: 'Test WebSocket reconnection on disconnect',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.RECONNECTION_SUCCESS,
          target: 'reconnection',
          expected: true,
          message: 'Should successfully reconnect after disconnect',
        },
      ],
      timeout: 30000,
      metadata: this.buildMetadata(endpoint, 'reconnection'),
    };
  }

  /**
   * Generate close handshake test
   */
  private generateCloseTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    return {
      id: `ws-close-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Close Handshake - ${endpoint.path}`,
      description: 'Test WebSocket close handshake',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.CONNECTION_ESTABLISHED,
          target: 'connection',
          expected: 'open',
          message: 'Connection should be established',
        },
        {
          type: WebSocketAssertionType.CONNECTION_CLOSED,
          target: 'close',
          expected: 1000,
          message: 'Connection should close with normal status',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'close'),
    };
  }

  /**
   * Generate error handling test
   */
  private generateErrorTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    // Send invalid message to trigger error
    const messages: WebSocketMessageTest[] = [
      {
        id: 'send-invalid',
        type: MessageType.TEXT,
        direction: 'send',
        data: {
          payload: 'INVALID_MESSAGE_FORMAT',
          format: 'text',
        },
      },
    ];

    return {
      id: `ws-error-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Error Handling - ${endpoint.path}`,
      description: 'Test WebSocket error handling',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.ERROR_OCCURRED,
          target: 'error',
          expected: true,
          message: 'Should handle errors gracefully',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'error'),
    };
  }

  /**
   * Generate message ordering test
   */
  private generateOrderingTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);
    const messageCount = this.options.messageCount || 5;
    const messages: WebSocketMessageTest[] = [];

    // Generate sequence of messages
    for (let i = 1; i <= messageCount; i++) {
      messages.push({
        id: `send-${i}`,
        type: MessageType.JSON,
        direction: 'send',
        data: {
          payload: { sequence: i, message: `Message ${i}` },
          format: 'json',
        },
      });
    }

    return {
      id: `ws-ordering-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Message Ordering - ${endpoint.path}`,
      description: 'Test WebSocket message ordering',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.MESSAGE_COUNT,
          target: 'messages',
          expected: messageCount,
          message: `Should receive ${messageCount} messages`,
        },
        {
          type: WebSocketAssertionType.MESSAGE_ORDER,
          target: 'sequence',
          expected: Array.from({ length: messageCount }, (_, i) => i + 1),
          message: 'Messages should be received in order',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'ordering'),
    };
  }

  /**
   * Generate concurrent connections test
   */
  private generateConcurrentTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    return {
      id: `ws-concurrent-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Concurrent Connections - ${endpoint.path}`,
      description: `Test ${this.options.concurrentConnections} concurrent WebSocket connections`,
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.CONNECTION_ESTABLISHED,
          target: 'connections',
          expected: this.options.concurrentConnections,
          message: `Should establish ${this.options.concurrentConnections} concurrent connections`,
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'concurrent'),
    };
  }

  /**
   * Generate authentication tests
   */
  private generateAuthTests(endpoint: WebSocketEndpoint): WebSocketTestCase[] {
    const tests: WebSocketTestCase[] = [];

    if (endpoint.security.length === 0) {
      return tests;
    }

    // Test with valid authentication
    const validAuthConfig = this.buildConnectionConfig(endpoint, true);
    tests.push({
      id: `ws-auth-valid-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Authentication (Valid) - ${endpoint.path}`,
      description: 'Test WebSocket connection with valid authentication',
      endpoint: endpoint.url,
      connection: validAuthConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.CONNECTION_ESTABLISHED,
          target: 'connection',
          expected: 'open',
          message: 'Should connect with valid authentication',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'auth-valid'),
    });

    // Test without authentication
    const noAuthConfig = this.buildConnectionConfig(endpoint, false);
    tests.push({
      id: `ws-auth-invalid-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Authentication (Invalid) - ${endpoint.path}`,
      description: 'Test WebSocket connection without authentication',
      endpoint: endpoint.url,
      connection: noAuthConfig,
      messages: [],
      assertions: [
        {
          type: WebSocketAssertionType.ERROR_OCCURRED,
          target: 'connection',
          expected: true,
          message: 'Should fail to connect without authentication',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'auth-invalid'),
    });

    return tests;
  }

  /**
   * Generate subscription/event test
   */
  private generateSubscriptionTest(endpoint: WebSocketEndpoint): WebSocketTestCase {
    const connectionConfig = this.buildConnectionConfig(endpoint);

    // Subscribe to events
    const messages: WebSocketMessageTest[] = [
      {
        id: 'subscribe',
        type: MessageType.JSON,
        direction: 'send',
        data: {
          payload: {
            action: 'subscribe',
            channel: 'events',
          },
          format: 'json',
        },
      },
    ];

    return {
      id: `ws-subscription-${this.sanitizePath(endpoint.path)}`,
      name: `WebSocket Event Subscription - ${endpoint.path}`,
      description: 'Test WebSocket event subscription',
      endpoint: endpoint.url,
      connection: connectionConfig,
      messages,
      assertions: [
        {
          type: WebSocketAssertionType.MESSAGE_RECEIVED,
          target: 'subscription',
          expected: true,
          message: 'Should receive subscription confirmation',
        },
      ],
      timeout: this.options.defaultTimeout,
      metadata: this.buildMetadata(endpoint, 'subscription'),
    };
  }

  /**
   * Build connection configuration
   */
  private buildConnectionConfig(endpoint: WebSocketEndpoint, includeAuth: boolean = true): WebSocketConnectionConfig {
    const protocol = endpoint.url.startsWith('wss:') ? 'wss' : 'ws';
    const config: WebSocketConnectionConfig = {
      protocol,
      connectionTimeout: 5000,
      protocols: endpoint.subprotocols,
    };

    // Add authentication if required
    if (includeAuth && endpoint.security.length > 0) {
      config.auth = {
        type: 'token',
        token: process.env.WS_AUTH_TOKEN || 'test-token',
      };
    }

    return config;
  }

  /**
   * Build test metadata
   */
  private buildMetadata(endpoint: WebSocketEndpoint, scenario: string): TestMetadata {
    return {
      tags: ['websocket', scenario, ...endpoint.tags],
      priority: 'high',
      stability: 'stable',
      generatedAt: new Date().toISOString(),
      generatorVersion: '1.0.0',
    };
  }

  /**
   * Generate data from schema
   */
  private generateDataFromSchema(schema: SchemaObject): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const propSchema = '$ref' in prop ? {} : prop;
        data[key] = this.generateValueFromSchema(propSchema);
      }
    }

    return data;
  }

  /**
   * Generate value from schema
   */
  private generateValueFromSchema(schema: SchemaObject): unknown {
    if (schema.example !== undefined) {
      return schema.example;
    }

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum[0] : 'test-value';
      case 'number':
      case 'integer':
        return schema.enum ? schema.enum[0] : 42;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return this.generateDataFromSchema(schema);
      default:
        return null;
    }
  }

  /**
   * Sanitize path for use in test IDs
   */
  private sanitizePath(path: string): string {
    return path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '');
  }
}

/**
 * Create WebSocket test generator
 */
export function createWebSocketTestGenerator(
  spec: ParsedApiSpec,
  baseURL: string,
  options?: WebSocketTestGenerationOptions
): WebSocketTestGenerator {
  return new WebSocketTestGenerator(spec, baseURL, options);
}
