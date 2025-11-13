# WebSocket Testing - Quick Reference

## Quick Start

```typescript
import { createWebSocketClient } from './src/executor/websocket-client.js';

// Connect
const client = createWebSocketClient({
  url: 'wss://echo.websocket.org',
  options: { protocol: 'wss' },
});
await client.connect();

// Send/Receive
await client.send({ payload: 'Hello!', format: 'text' });
const msg = await client.receive(5000);

// Close
await client.close();
```

## Common Patterns

### 1. Echo Test
```typescript
await client.connect();
await client.send({ payload: 'test', format: 'text' });
const echo = await client.receive(5000);
expect(echo.payload).toBe('test');
await client.close();
```

### 2. JSON Messaging
```typescript
await client.send({
  payload: { type: 'chat', message: 'Hi!' },
  format: 'json',
});
const response = await client.receive(5000);
```

### 3. Authentication
```typescript
const client = createWebSocketClient({
  url: 'wss://api.example.com/ws',
  options: {
    protocol: 'wss',
    auth: {
      type: 'token',
      token: process.env.WS_TOKEN,
    },
  },
});
```

### 4. Heartbeat
```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: {
    protocol: 'ws',
    heartbeatInterval: 2000, // ping every 2s
  },
});

// Manual ping
const latency = await client.ping();
console.log(`Latency: ${latency}ms`);
```

### 5. Reconnection
```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: {
    protocol: 'ws',
    reconnection: {
      enabled: true,
      maxAttempts: 3,
      retryDelay: 1000,
    },
  },
});
```

### 6. Wait for Specific Message
```typescript
const message = await client.waitForMessage(
  (msg) => msg.payload.type === 'login',
  10000
);
```

### 7. Performance Metrics
```typescript
const metrics = client.getMetrics();
console.log({
  connectionTime: metrics.connectionTime,
  averageRTT: metrics.averageRoundTripTime,
  messagesSent: metrics.messagesSent,
  messagesReceived: metrics.messagesReceived,
});
```

### 8. Event Handlers
```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: { protocol: 'ws' },
  handlers: {
    onOpen: () => console.log('Connected'),
    onMessage: (msg) => console.log('Received:', msg.payload),
    onClose: (event) => console.log('Closed:', event.code),
    onError: (err) => console.error('Error:', err.message),
  },
});
```

## Generate Tests from OpenAPI

```typescript
import { createWebSocketTestGenerator } from './src/generators/websocket-test-generator.js';

const generator = createWebSocketTestGenerator(spec, baseURL, {
  scenarios: ['connection', 'echo', 'json', 'heartbeat'],
  includeAuth: true,
});

const endpoints = generator.extractWebSocketEndpoints();
const tests = generator.generateTests(endpoints);
```

## OpenAPI Extension

```yaml
paths:
  /ws/chat:
    x-websocket:
      description: "Chat WebSocket"
      parameters:
        - name: room
          in: query
          schema:
            type: string
      security:
        - bearerAuth: []
      messages:
        send:
          - name: message
            schema:
              type: object
              properties:
                text: { type: string }
        receive:
          - name: message
            schema:
              type: object
              properties:
                user: { type: string }
                text: { type: string }
```

## Playwright Integration

```typescript
import { test, expect } from '@playwright/test';
import { createWebSocketClient } from '../src/executor/websocket-client.js';

test('WebSocket test', async () => {
  const client = createWebSocketClient({
    url: 'wss://api.example.com/ws',
    options: { protocol: 'wss' },
  });

  await test.step('Connect', async () => {
    await client.connect();
    expect(client.getState()).toBe('open');
  });

  await test.step('Send message', async () => {
    await client.send({ payload: 'test', format: 'text' });
  });

  await test.step('Receive response', async () => {
    const response = await client.receive(5000);
    expect(response).toBeDefined();
  });

  await client.close();
});
```

## Test Scenarios

| Scenario | Description |
|----------|-------------|
| connection | Basic connection test |
| echo | Send/receive validation |
| binary | Binary message handling |
| json | JSON message validation |
| heartbeat | Ping/pong testing |
| reconnection | Auto-reconnect test |
| close | Graceful closure |
| error | Error handling |
| ordering | Message sequence |
| concurrent | Multiple connections |
| authentication | Auth testing |
| subscription | Event subscription |

## Authentication Types

```typescript
// Token
auth: { type: 'token', token: 'token-123' }

// Header
auth: {
  type: 'header',
  header: { name: 'Authorization', value: 'Bearer token' }
}

// Query
auth: {
  type: 'query',
  query: { name: 'token', value: 'token-123' }
}

// Cookie
auth: {
  type: 'cookie',
  cookie: { name: 'session', value: 'session-id' }
}
```

## Client Methods

| Method | Description |
|--------|-------------|
| `connect()` | Establish connection |
| `send(data, timeout)` | Send message |
| `receive(timeout)` | Receive next message |
| `waitForMessage(predicate, timeout)` | Wait for specific message |
| `ping()` | Send ping, return latency |
| `close(code, reason)` | Close connection |
| `getState()` | Get connection state |
| `getReceivedMessages()` | Get all messages |
| `getEvents()` | Get connection events |
| `getMetrics()` | Get performance metrics |
| `clear()` | Clear recorded data |

## Generator Methods

| Method | Description |
|--------|-------------|
| `extractWebSocketEndpoints()` | Parse OpenAPI endpoints |
| `generateTests(endpoints)` | Generate all tests |
| `generateEndpointTests(endpoint)` | Tests for endpoint |
| `generateScenarioTests(endpoint, scenario)` | Scenario tests |

## Configuration Options

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
  };
  handlers?: WebSocketEventHandlers;
  debug?: boolean;
}
```

## Common Timeouts

- Connection: 5000ms (5 seconds)
- Receive: 5000ms (5 seconds)
- Ping: 5000ms (5 seconds)
- Send: 5000ms (5 seconds)

## Connection States

- `connecting` - Establishing connection
- `open` - Connected and ready
- `closing` - Closing connection
- `closed` - Connection closed
- `error` - Error occurred

## Message Types

- `text` - Text string
- `binary` - Binary buffer
- `json` - JSON object
- `ping` - Ping frame
- `pong` - Pong frame

## Files Reference

| File | Purpose |
|------|---------|
| `src/types/websocket-types.ts` | Type definitions |
| `src/executor/websocket-client.ts` | WebSocket client |
| `src/generators/websocket-test-generator.ts` | Test generator |
| `examples/websocket-testing-example.ts` | Usage examples |
| `examples/websocket-playwright-test.spec.ts` | Playwright tests |
| `docs/WEBSOCKET_TESTING.md` | Complete guide |

## Error Handling

```typescript
try {
  await client.connect();
} catch (error) {
  if (error.message.includes('timeout')) {
    // Connection timeout
  } else if (error.message.includes('refused')) {
    // Connection refused
  }
}
```

## Best Practices

1. Always set timeouts
2. Handle errors gracefully
3. Close connections properly
4. Clear data between tests
5. Use event handlers for monitoring
6. Check metrics for performance
7. Use debug mode during development

## Running Examples

```bash
# Basic examples
npm run cli -- examples/websocket-testing-example.ts

# Playwright tests
npm run test:playwright -- websocket-playwright-test.spec.ts

# Unit tests
npm run test -- tests/unit/websocket-client.test.ts
```

## Environment Variables

```bash
WS_AUTH_TOKEN=your-token-here
WS_URL=wss://api.example.com/ws
```

## Debugging

```typescript
const client = createWebSocketClient({
  url: 'ws://localhost:8080/ws',
  options: { protocol: 'ws' },
  debug: true, // Enable debug logging
});
```

---

For complete documentation, see `docs/WEBSOCKET_TESTING.md`
