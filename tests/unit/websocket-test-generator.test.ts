/**
 * Unit tests for WebSocket Test Generator
 */

import { describe, it, expect } from 'vitest';
import { createWebSocketTestGenerator } from '../../src/generators/websocket-test-generator.js';
import type { ParsedApiSpec } from '../../src/types/openapi-types.js';

describe('WebSocketTestGenerator', () => {
  const mockSpec: ParsedApiSpec = {
    version: '3.0.0',
    type: 'openapi-3.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://api.example.com',
      },
    ],
    paths: {
      '/ws/chat': {
        summary: 'Chat WebSocket',
        'x-websocket': {
          path: '/ws/chat',
          description: 'Real-time chat',
          parameters: [
            {
              name: 'room',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          security: [
            {
              bearerAuth: [],
            },
          ],
          messages: {
            send: [
              {
                name: 'message',
                description: 'Send message',
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                  },
                },
              },
            ],
            receive: [
              {
                name: 'message',
                description: 'Receive message',
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'string' },
                    text: { type: 'string' },
                  },
                },
              },
            ],
          },
          tags: ['chat'],
        },
      },
    },
    components: {},
    security: [],
    tags: [],
  };

  describe('Constructor', () => {
    it('should create generator with spec and base URL', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      expect(generator).toBeDefined();
    });

    it('should create generator with custom options', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection', 'echo'],
        includeAuth: false,
        defaultTimeout: 5000,
      });

      expect(generator).toBeDefined();
    });

    it('should use default options when not provided', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      expect(generator).toBeDefined();
    });
  });

  describe('Extract WebSocket Endpoints', () => {
    it('should extract endpoints from OpenAPI spec', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].path).toBe('/ws/chat');
      expect(endpoints[0].url).toBe('wss://api.example.com/ws/chat');
    });

    it('should convert HTTP to WS protocol', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'http://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints[0].url).toBe('ws://api.example.com/ws/chat');
    });

    it('should convert HTTPS to WSS protocol', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints[0].url).toBe('wss://api.example.com/ws/chat');
    });

    it('should extract endpoint parameters', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints[0].parameters).toHaveLength(1);
      expect(endpoints[0].parameters[0].name).toBe('room');
      expect(endpoints[0].parameters[0].required).toBe(true);
    });

    it('should extract security requirements', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints[0].security).toHaveLength(1);
    });

    it('should extract message schemas', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints[0].messages.send).toHaveLength(1);
      expect(endpoints[0].messages.receive).toHaveLength(1);
    });

    it('should return empty array for spec without WebSocket endpoints', () => {
      const emptySpec: ParsedApiSpec = {
        ...mockSpec,
        paths: {},
      };

      const generator = createWebSocketTestGenerator(emptySpec, 'https://api.example.com');

      const endpoints = generator.extractWebSocketEndpoints();

      expect(endpoints).toHaveLength(0);
    });
  });

  describe('Generate Tests', () => {
    it('should generate tests for extracted endpoints', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection', 'echo'],
      });

      const tests = generator.generateTests();

      expect(tests.length).toBeGreaterThan(0);
    });

    it('should generate connection test', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
      });

      const tests = generator.generateTests();
      const connectionTest = tests.find((t) => t.id.includes('connection'));

      expect(connectionTest).toBeDefined();
      expect(connectionTest?.name).toContain('Connection');
    });

    it('should generate echo test', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['echo'],
      });

      const tests = generator.generateTests();
      const echoTest = tests.find((t) => t.id.includes('echo'));

      expect(echoTest).toBeDefined();
      expect(echoTest?.name).toContain('Echo');
    });

    it('should generate JSON test', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['json'],
      });

      const tests = generator.generateTests();
      const jsonTest = tests.find((t) => t.id.includes('json'));

      expect(jsonTest).toBeDefined();
      expect(jsonTest?.name).toContain('JSON');
    });

    it('should generate heartbeat test', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['heartbeat'],
      });

      const tests = generator.generateTests();
      const heartbeatTest = tests.find((t) => t.id.includes('heartbeat'));

      expect(heartbeatTest).toBeDefined();
      expect(heartbeatTest?.name).toContain('Heartbeat');
    });

    it('should include authentication tests when enabled', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['authentication'],
        includeAuth: true,
      });

      const tests = generator.generateTests();
      const authTests = tests.filter((t) => t.id.includes('auth'));

      expect(authTests.length).toBeGreaterThan(0);
    });

    it('should skip authentication tests when disabled', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['authentication'],
        includeAuth: false,
      });

      const tests = generator.generateTests();
      const authTests = tests.filter((t) => t.id.includes('auth'));

      expect(authTests).toHaveLength(0);
    });

    it('should include reconnection tests when enabled', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['reconnection'],
        includeReconnection: true,
      });

      const tests = generator.generateTests();
      const reconnectTests = tests.filter((t) => t.id.includes('reconnect'));

      expect(reconnectTests.length).toBeGreaterThan(0);
    });

    it('should set proper test metadata', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
      });

      const tests = generator.generateTests();
      const test = tests[0];

      expect(test.metadata).toBeDefined();
      expect(test.metadata.tags).toContain('websocket');
      expect(test.metadata.priority).toBeDefined();
      expect(test.metadata.stability).toBeDefined();
      expect(test.metadata.generatedAt).toBeDefined();
    });

    it('should set default timeout', () => {
      const customTimeout = 15000;
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
        defaultTimeout: customTimeout,
      });

      const tests = generator.generateTests();
      const test = tests[0];

      expect(test.timeout).toBe(customTimeout);
    });

    it('should generate tests with assertions', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
      });

      const tests = generator.generateTests();
      const test = tests[0];

      expect(test.assertions.length).toBeGreaterThan(0);
    });

    it('should generate ordering test with correct message count', () => {
      const messageCount = 10;
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['ordering'],
        messageCount,
      });

      const tests = generator.generateTests();
      const orderingTest = tests.find((t) => t.id.includes('ordering'));

      expect(orderingTest).toBeDefined();
      expect(orderingTest?.messages.length).toBe(messageCount);
    });

    it('should generate concurrent test with connection count', () => {
      const concurrentConnections = 5;
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['concurrent'],
        concurrentConnections,
      });

      const tests = generator.generateTests();
      const concurrentTest = tests.find((t) => t.id.includes('concurrent'));

      expect(concurrentTest).toBeDefined();
      expect(concurrentTest?.name).toContain(String(concurrentConnections));
    });
  });

  describe('Test Properties', () => {
    it('should generate unique test IDs', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection', 'echo', 'json'],
      });

      const tests = generator.generateTests();
      const ids = tests.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate descriptive test names', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
      });

      const tests = generator.generateTests();
      const test = tests[0];

      expect(test.name).toBeTruthy();
      expect(test.name.length).toBeGreaterThan(0);
    });

    it('should include endpoint URL in tests', () => {
      const generator = createWebSocketTestGenerator(mockSpec, 'https://api.example.com', {
        scenarios: ['connection'],
      });

      const tests = generator.generateTests();
      const test = tests[0];

      expect(test.endpoint).toContain('wss://');
    });
  });

  describe('Edge Cases', () => {
    it('should handle spec with no messages defined', () => {
      const specNoMessages: ParsedApiSpec = {
        ...mockSpec,
        paths: {
          '/ws/simple': {
            'x-websocket': {
              path: '/ws/simple',
              description: 'Simple WebSocket',
            },
          },
        },
      };

      const generator = createWebSocketTestGenerator(specNoMessages, 'https://api.example.com');

      const tests = generator.generateTests();
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should handle spec with no security', () => {
      const specNoSecurity: ParsedApiSpec = {
        ...mockSpec,
        paths: {
          '/ws/public': {
            'x-websocket': {
              path: '/ws/public',
              description: 'Public WebSocket',
              security: [],
            },
          },
        },
      };

      const generator = createWebSocketTestGenerator(specNoSecurity, 'https://api.example.com', {
        scenarios: ['authentication'],
        includeAuth: true,
      });

      const tests = generator.generateTests();
      const authTests = tests.filter((t) => t.id.includes('auth'));

      // Should not generate auth tests for endpoints without security
      expect(authTests).toHaveLength(0);
    });
  });
});
