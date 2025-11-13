# WebSocket Testing Guide

Complete guide for testing WebSocket endpoints in AgentBank with comprehensive test generation and execution capabilities.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Usage](#usage)
  - [WebSocket Client](#websocket-client)
  - [Test Generator](#test-generator)
  - [Playwright Integration](#playwright-integration)
- [Test Scenarios](#test-scenarios)
- [OpenAPI Integration](#openapi-integration)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Overview

AgentBank's WebSocket testing support provides comprehensive capabilities for testing WebSocket endpoints, including:

- ✅ Connection establishment and management
- ✅ Message sending and receiving (text, binary, JSON)
- ✅ Ping/pong heartbeat testing
- ✅ Reconnection handling
- ✅ Authentication support
- ✅ Performance metrics
- ✅ Event tracking
- ✅ Message ordering validation
- ✅ Concurrent connection testing
- ✅ OpenAPI/Swagger integration

## Installation

The WebSocket testing dependencies are included in AgentBank:

```bash
npm install
```

Key dependencies:
- `ws` - WebSocket client library
- `@types/ws` - TypeScript definitions
- `@playwright/test` - Playwright testing framework

## Quick Start

### Basic WebSocket Test

```typescript
import { createWebSocketClient } from './src/executor/websocket-client.js';
import type { WebSocketClientConfig } from './src/types/websocket-types.js';

const config: WebSocketClientConfig = {
  url: 'wss://echo.websocket.org',
  options: {
    protocol: 'wss',
  },
};

const client = createWebSocketClient(config);

// Connect
await client.connect();

// Send message
await client.send({
  payload: 'Hello WebSocket!',
  format: 'text',
});

// Receive response
const response = await client.receive(5000);
console.log('Received:', response.payload);

// Close
await client.close();
```

### Generate Tests from OpenAPI

```typescript
import { createWebSocketTestGenerator } from './src/generators/websocket-test-generator.js';

const generator = createWebSocketTestGenerator(
  openApiSpec,
  'https://api.example.com',
  {
    scenarios: ['connection', 'echo', 'json', 'heartbeat'],
    includeAuth: true,
  }
);

const testCases = generator.generateTests();
console.log(`Generated ${testCases.length} test cases`);
```

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                WebSocket Testing                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │ Test Generator   │───▶│  Test Cases      │     │
│  └──────────────────┘    └──────────────────┘     │
│           │                       │                 │
│           ▼                       ▼                 │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │ OpenAPI Parser   │    │ WebSocket Client │     │
│  └──────────────────┘    └──────────────────┘     │
│                                   │                 │
│                                   ▼                 │
│                          ┌──────────────────┐      │
│                          │ Metrics & Events │      │
│                          └──────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── types/
│   └── websocket-types.ts          # Type definitions
├── executor/
│   └── websocket-client.ts         # WebSocket client
└── generators/
    └── websocket-test-generator.ts # Test generator

examples/
├── websocket-testing-example.ts    # Usage examples
└── websocket-playwright-test.spec.ts # Playwright tests

docs/
└── WEBSOCKET_TESTING.md           # This file
```

## Usage

### WebSocket Client

The WebSocket client handles connection management and message exchange.

#### Basic Connection

```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: {
    protocol: 'ws',
    connectionTimeout: 5000,
  },
  debug: true,
});

await client.connect();
console.log('State:', client.getState()); // 'open'
await client.close();
```

#### Send Messages

```typescript
// Text message
await client.send({
  payload: 'Hello',
  format: 'text',
});

// JSON message
await client.send({
  payload: { type: 'chat', message: 'Hello' },
  format: 'json',
});

// Binary message
await client.send({
  payload: Buffer.from('Binary data'),
  format: 'binary',
});
```

#### Receive Messages

```typescript
// Receive next message
const message = await client.receive(5000);
console.log('Received:', message.payload);

// Wait for specific message
const targetMessage = await client.waitForMessage(
  (msg) => msg.payload.type === 'login',
  10000
);
```

#### Authentication

```typescript
// Token authentication
const client = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  options: {
    protocol: 'wss',
    auth: {
      type: 'token',
      token: process.env.WS_AUTH_TOKEN,
    },
  },
});

// Header authentication
const client = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  options: {
    protocol: 'wss',
    auth: {
      type: 'header',
      header: {
        name: 'Authorization',
        value: 'Bearer token-123',
      },
    },
  },
});
```

#### Heartbeat/Ping-Pong

```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: {
    protocol: 'ws',
    heartbeatInterval: 2000, // Ping every 2 seconds
  },
});

// Manual ping
const latency = await client.ping();
console.log(`Latency: ${latency}ms`);
```

#### Reconnection

```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: {
    protocol: 'ws',
    reconnection: {
      enabled: true,
      maxAttempts: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 5000,
    },
  },
});
```

#### Performance Metrics

```typescript
const metrics = client.getMetrics();
console.log({
  connectionTime: metrics.connectionTime,
  averageRTT: metrics.averageRoundTripTime,
  messagesSent: metrics.messagesSent,
  messagesReceived: metrics.messagesReceived,
  reconnections: metrics.reconnections,
  errors: metrics.errors,
});
```

### Test Generator

Generate comprehensive test cases from WebSocket endpoints.

#### Basic Generation

```typescript
import { createWebSocketTestGenerator } from './src/generators/websocket-test-generator.js';

const generator = createWebSocketTestGenerator(
  openApiSpec,
  'https://api.example.com',
  {
    scenarios: [
      'connection',
      'echo',
      'json',
      'heartbeat',
      'reconnection',
      'authentication',
    ],
    includeAuth: true,
    includeReconnection: true,
    messageCount: 5,
    defaultTimeout: 10000,
  }
);

const testCases = generator.generateTests();
```

#### Extract WebSocket Endpoints

```typescript
const endpoints = generator.extractWebSocketEndpoints();

endpoints.forEach(endpoint => {
  console.log(`Endpoint: ${endpoint.path}`);
  console.log(`URL: ${endpoint.url}`);
  console.log(`Send messages: ${endpoint.messages.send.length}`);
  console.log(`Receive messages: ${endpoint.messages.receive.length}`);
});
```

### Playwright Integration

Use WebSocket client in Playwright tests.

```typescript
import { test, expect } from '@playwright/test';
import { createWebSocketClient } from '../src/executor/websocket-client.js';

test('WebSocket chat test', async () => {
  const client = createWebSocketClient({
    url: 'wss://chat.example.com/ws',
    options: { protocol: 'wss' },
  });

  await test.step('Connect', async () => {
    await client.connect();
    expect(client.getState()).toBe('open');
  });

  await test.step('Send message', async () => {
    await client.send({
      payload: { type: 'chat', text: 'Hello!' },
      format: 'json',
    });
  });

  await test.step('Receive response', async () => {
    const response = await client.receive(5000);
    expect(response).toBeDefined();
  });

  await client.close();
});
```

## Test Scenarios

### Supported Scenarios

1. **Connection** - Basic connection establishment
2. **Echo** - Send and receive messages
3. **Binary** - Binary message handling
4. **JSON** - JSON message handling
5. **Heartbeat** - Ping/pong testing
6. **Reconnection** - Automatic reconnection
7. **Close** - Graceful connection closure
8. **Error** - Error handling
9. **Ordering** - Message order validation
10. **Concurrent** - Multiple concurrent connections
11. **Authentication** - Auth testing (valid/invalid)
12. **Subscription** - Event subscription

### Connection Test

```typescript
test('Connection establishment', async () => {
  const client = createWebSocketClient(config);
  await client.connect();
  expect(client.getState()).toBe('open');
  await client.close();
});
```

### Echo Test

```typescript
test('Echo test', async () => {
  const client = createWebSocketClient(config);
  await client.connect();

  await client.send({ payload: 'Hello', format: 'text' });
  const response = await client.receive(5000);

  expect(response.payload).toBe('Hello');
  await client.close();
});
```

### Ordering Test

```typescript
test('Message ordering', async () => {
  const client = createWebSocketClient(config);
  await client.connect();

  // Send sequence
  for (let i = 1; i <= 5; i++) {
    await client.send({
      payload: { sequence: i },
      format: 'json',
    });
  }

  // Verify order
  const messages = client.getReceivedMessages();
  messages.forEach((msg, idx) => {
    expect(msg.payload.sequence).toBe(idx + 1);
  });

  await client.close();
});
```

### Performance Test

```typescript
test('Performance metrics', async () => {
  const client = createWebSocketClient(config);
  await client.connect();

  for (let i = 0; i < 10; i++) {
    await client.send({ payload: `Test ${i}`, format: 'text' });
    await client.receive(5000);
  }

  const metrics = client.getMetrics();
  expect(metrics.messagesSent).toBe(10);
  expect(metrics.messagesReceived).toBe(10);
  expect(metrics.averageRoundTripTime).toBeGreaterThan(0);

  await client.close();
});
```

## OpenAPI Integration

### WebSocket Extension

Define WebSocket endpoints in OpenAPI using the `x-websocket` extension:

```yaml
paths:
  /ws/chat:
    x-websocket:
      description: "Real-time chat WebSocket"
      parameters:
        - name: room
          in: query
          required: true
          schema:
            type: string
      security:
        - bearerAuth: []
      messages:
        send:
          - name: chatMessage
            description: "Send a chat message"
            schema:
              type: object
              properties:
                action:
                  type: string
                  enum: [message]
                text:
                  type: string
              required: [action, text]
        receive:
          - name: chatMessage
            description: "Receive a chat message"
            schema:
              type: object
              properties:
                user:
                  type: string
                text:
                  type: string
                timestamp:
                  type: number
      tags:
        - chat
        - websocket
```

### Generate Tests from OpenAPI

```typescript
const spec = await parseOpenAPISpec('openapi.yaml');
const generator = createWebSocketTestGenerator(spec, baseURL);
const endpoints = generator.extractWebSocketEndpoints();
const tests = generator.generateTests(endpoints);
```

## Configuration

### WebSocket Client Configuration

```typescript
interface WebSocketClientConfig {
  url: string;
  options: {
    protocol: 'ws' | 'wss';
    headers?: Record<string, string>;
    protocols?: string[];
    auth?: WebSocketAuthConfig;
    connectionTimeout?: number;
    heartbeatInterval?: number;
    reconnection?: ReconnectionConfig;
    queryParams?: Record<string, string>;
  };
  handlers?: {
    onOpen?: (event: Event) => void;
    onMessage?: (message: WebSocketMessageResult) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: Error) => void;
    onPing?: () => void;
    onPong?: () => void;
  };
  debug?: boolean;
}
```

### Test Generation Options

```typescript
interface WebSocketTestGenerationOptions {
  scenarios?: WebSocketScenarioType[];
  includeAuth?: boolean;
  includeReconnection?: boolean;
  includePerformance?: boolean;
  messageCount?: number;
  concurrentConnections?: number;
  defaultTimeout?: number;
}
```

## Examples

See the `/examples` directory for complete examples:

- `websocket-testing-example.ts` - 12 comprehensive examples
- `websocket-playwright-test.spec.ts` - Playwright test suite

### Run Examples

```bash
# Basic examples
npm run cli -- examples/websocket-testing-example.ts

# Playwright tests
npm run test:playwright -- websocket-playwright-test.spec.ts
```

## Best Practices

### 1. Always Set Timeouts

```typescript
await client.connect(); // Uses default timeout
await client.receive(5000); // Explicit timeout
await client.ping(); // Has built-in timeout
```

### 2. Handle Errors Gracefully

```typescript
try {
  await client.connect();
} catch (error) {
  console.error('Connection failed:', error);
  // Handle error appropriately
}
```

### 3. Close Connections

```typescript
test.afterEach(async () => {
  if (client.getState() === 'open') {
    await client.close();
  }
});
```

### 4. Use Event Handlers

```typescript
const client = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  options: { protocol: 'wss' },
  handlers: {
    onMessage: (msg) => console.log('Message:', msg.payload),
    onError: (err) => console.error('Error:', err.message),
  },
});
```

### 5. Monitor Performance

```typescript
const metrics = client.getMetrics();
expect(metrics.averageRoundTripTime).toBeLessThan(1000);
expect(metrics.errors).toBe(0);
```

### 6. Clear Data Between Tests

```typescript
test.beforeEach(() => {
  client.clear(); // Clear messages and events
});
```

## API Reference

### WebSocketTestClient

#### Methods

- `connect(): Promise<void>` - Connect to WebSocket server
- `send(data: WebSocketMessageData, timeout?: number): Promise<void>` - Send message
- `receive(timeout?: number): Promise<WebSocketMessageResult>` - Receive message
- `waitForMessage(predicate, timeout): Promise<WebSocketMessageResult>` - Wait for specific message
- `ping(): Promise<number>` - Send ping and return latency
- `close(code?, reason?): Promise<void>` - Close connection
- `getState(): ConnectionState` - Get current connection state
- `getReceivedMessages(): WebSocketMessageResult[]` - Get all received messages
- `getEvents(): WebSocketEventResult[]` - Get all recorded events
- `getMetrics(): WebSocketMetrics` - Get performance metrics
- `clear(): void` - Clear recorded data

### WebSocketTestGenerator

#### Methods

- `extractWebSocketEndpoints(): WebSocketEndpoint[]` - Extract endpoints from OpenAPI
- `generateTests(endpoints?): WebSocketTestCase[]` - Generate test cases
- `generateEndpointTests(endpoint): WebSocketTestCase[]` - Generate tests for endpoint
- `generateScenarioTests(endpoint, scenario): WebSocketTestCase[]` - Generate scenario tests

### Types

See `src/types/websocket-types.ts` for complete type definitions.

## CLI Integration

Add WebSocket testing to CLI:

```bash
# Generate WebSocket tests
npm run cli -- generate --spec openapi.yaml --websocket

# Run WebSocket tests
npm run test:playwright -- --grep websocket
```

## Troubleshooting

### Connection Timeout

```typescript
// Increase timeout
const client = createWebSocketClient({
  url: 'ws://slow-server.com',
  options: {
    protocol: 'ws',
    connectionTimeout: 10000, // 10 seconds
  },
});
```

### SSL/TLS Issues

```typescript
// For self-signed certificates (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

### Authentication Failures

```typescript
// Check auth configuration
const client = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  options: {
    protocol: 'wss',
    auth: {
      type: 'token',
      token: process.env.WS_TOKEN, // Ensure token is set
    },
  },
  debug: true, // Enable debug logging
});
```

## Contributing

When adding new WebSocket testing features:

1. Add types to `src/types/websocket-types.ts`
2. Implement functionality in `src/executor/websocket-client.ts`
3. Update generator in `src/generators/websocket-test-generator.ts`
4. Add tests in `tests/` directory
5. Add examples in `examples/` directory
6. Update this documentation

## Resources

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws Library Documentation](https://github.com/websockets/ws)
- [Playwright Testing](https://playwright.dev/docs/test-intro)
- [OpenAPI Specification](https://swagger.io/specification/)

## License

MIT
