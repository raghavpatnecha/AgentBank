/**
 * Playwright Test Examples for WebSocket Testing
 * Shows how to integrate WebSocket tests with Playwright
 */

import { test, expect } from '@playwright/test';
import { createWebSocketClient } from '../src/executor/websocket-client.js';
import type { WebSocketClientConfig } from '../src/types/websocket-types.js';

/**
 * Test suite for WebSocket connection
 */
test.describe('WebSocket Connection Tests', () => {
  test('should establish WebSocket connection', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
        connectionTimeout: 5000,
      },
    };

    const client = createWebSocketClient(config);

    await test.step('Connect to WebSocket server', async () => {
      await client.connect();
      expect(client.getState()).toBe('open');
    });

    await test.step('Close connection', async () => {
      await client.close();
      expect(client.getState()).toBe('closed');
    });
  });

  test('should fail to connect to invalid endpoint', async () => {
    const config: WebSocketClientConfig = {
      url: 'ws://invalid-endpoint-that-does-not-exist.test',
      options: {
        protocol: 'ws',
        connectionTimeout: 2000,
      },
    };

    const client = createWebSocketClient(config);

    await expect(async () => {
      await client.connect();
    }).rejects.toThrow();
  });
});

/**
 * Test suite for WebSocket messaging
 */
test.describe('WebSocket Message Tests', () => {
  let client: ReturnType<typeof createWebSocketClient>;

  test.beforeEach(async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };
    client = createWebSocketClient(config);
    await client.connect();
  });

  test.afterEach(async () => {
    if (client.getState() === 'open') {
      await client.close();
    }
  });

  test('should send and receive text message', async () => {
    const testMessage = 'Hello WebSocket!';

    await test.step('Send text message', async () => {
      await client.send({
        payload: testMessage,
        format: 'text',
      });
    });

    await test.step('Receive echo response', async () => {
      const response = await client.receive(5000);
      expect(response.type).toBe('text');
      expect(response.payload).toBe(testMessage);
    });
  });

  test('should send and receive JSON message', async () => {
    const jsonData = {
      type: 'test',
      message: 'JSON test',
      timestamp: Date.now(),
    };

    await test.step('Send JSON message', async () => {
      await client.send({
        payload: jsonData,
        format: 'json',
      });
    });

    await test.step('Receive JSON response', async () => {
      const response = await client.receive(5000);
      expect(response.type).toBe('json');
      const receivedData = JSON.parse(response.payload as string);
      expect(receivedData.type).toBe(jsonData.type);
      expect(receivedData.message).toBe(jsonData.message);
    });
  });

  test('should send and receive binary message', async () => {
    const binaryData = Buffer.from('Binary test data', 'utf-8');

    await test.step('Send binary message', async () => {
      await client.send({
        payload: binaryData,
        format: 'binary',
      });
    });

    await test.step('Receive binary response', async () => {
      const response = await client.receive(5000);
      expect(response.type).toBe('binary');
      expect(Buffer.isBuffer(response.payload) || response.payload instanceof ArrayBuffer).toBe(true);
    });
  });

  test('should handle multiple messages in order', async () => {
    const messageCount = 5;
    const messages: string[] = [];

    await test.step('Send multiple messages', async () => {
      for (let i = 1; i <= messageCount; i++) {
        const msg = `Message ${i}`;
        messages.push(msg);
        await client.send({
          payload: msg,
          format: 'text',
        });
      }
    });

    await test.step('Receive messages in order', async () => {
      for (let i = 0; i < messageCount; i++) {
        const response = await client.receive(5000);
        expect(response.payload).toBe(messages[i]);
      }
    });
  });
});

/**
 * Test suite for WebSocket heartbeat
 */
test.describe('WebSocket Heartbeat Tests', () => {
  test('should respond to ping with pong', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);

    await test.step('Connect and ping', async () => {
      await client.connect();
      const latency = await client.ping();
      expect(latency).toBeGreaterThan(0);
      expect(latency).toBeLessThan(5000);
    });

    await test.step('Check for pong event', async () => {
      const events = client.getEvents();
      const pongEvent = events.find(e => e.event === 'pong');
      expect(pongEvent).toBeDefined();
    });

    await client.close();
  });

  test('should maintain heartbeat over time', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
        heartbeatInterval: 1000, // Ping every second
      },
    };

    const client = createWebSocketClient(config);

    await test.step('Connect with heartbeat', async () => {
      await client.connect();
    });

    await test.step('Wait for multiple heartbeats', async () => {
      await new Promise(resolve => setTimeout(resolve, 3500));
      const events = client.getEvents();
      const pongEvents = events.filter(e => e.event === 'pong');
      // Should have at least 2-3 pongs in 3.5 seconds with 1s interval
      expect(pongEvents.length).toBeGreaterThanOrEqual(2);
    });

    await client.close();
  });
});

/**
 * Test suite for WebSocket performance
 */
test.describe('WebSocket Performance Tests', () => {
  test('should measure connection time', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    const metrics = client.getMetrics();
    expect(metrics.connectionTime).toBeGreaterThan(0);
    expect(metrics.connectionTime).toBeLessThan(5000);

    await client.close();
  });

  test('should measure round-trip time', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    // Send multiple messages
    for (let i = 0; i < 5; i++) {
      await client.send({
        payload: `Test ${i}`,
        format: 'text',
      });
      await client.receive(5000);
    }

    const metrics = client.getMetrics();
    expect(metrics.messagesSent).toBe(5);
    expect(metrics.messagesReceived).toBe(5);
    expect(metrics.averageRoundTripTime).toBeGreaterThan(0);

    await client.close();
  });

  test('should track message statistics', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    const messageCount = 10;
    for (let i = 0; i < messageCount; i++) {
      await client.send({
        payload: `Message ${i}`,
        format: 'text',
      });
    }

    // Wait for all responses
    for (let i = 0; i < messageCount; i++) {
      await client.receive(5000);
    }

    const metrics = client.getMetrics();
    expect(metrics.messagesSent).toBe(messageCount);
    expect(metrics.messagesReceived).toBe(messageCount);
    expect(metrics.errors).toBe(0);

    await client.close();
  });
});

/**
 * Test suite for WebSocket error handling
 */
test.describe('WebSocket Error Handling Tests', () => {
  test('should handle connection timeout', async () => {
    const config: WebSocketClientConfig = {
      url: 'ws://10.255.255.1:9999', // Non-routable IP
      options: {
        protocol: 'ws',
        connectionTimeout: 2000,
      },
    };

    const client = createWebSocketClient(config);

    await expect(async () => {
      await client.connect();
    }).rejects.toThrow();
  });

  test('should handle receive timeout', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    // Try to receive without sending (should timeout)
    await expect(async () => {
      await client.receive(1000);
    }).rejects.toThrow(/timeout/i);

    await client.close();
  });
});

/**
 * Test suite for WebSocket events
 */
test.describe('WebSocket Event Tests', () => {
  test('should record connection events', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();
    await client.close();

    const events = client.getEvents();
    const openEvent = events.find(e => e.event === 'open');
    const closeEvent = events.find(e => e.event === 'close');

    expect(openEvent).toBeDefined();
    expect(closeEvent).toBeDefined();
    expect(openEvent!.timingOffset).toBeGreaterThanOrEqual(0);
  });

  test('should wait for specific message', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    // Send multiple messages
    await client.send({ payload: 'Message 1', format: 'text' });
    await client.send({ payload: 'Target Message', format: 'text' });
    await client.send({ payload: 'Message 3', format: 'text' });

    // Wait for specific message
    const targetMessage = await client.waitForMessage(
      msg => msg.payload === 'Target Message',
      5000
    );

    expect(targetMessage.payload).toBe('Target Message');

    await client.close();
  });
});

/**
 * Test suite for WebSocket authentication
 */
test.describe('WebSocket Authentication Tests', () => {
  test('should send authentication header', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
        auth: {
          type: 'header',
          header: {
            name: 'Authorization',
            value: 'Bearer test-token-12345',
          },
        },
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();
    expect(client.getState()).toBe('open');
    await client.close();
  });

  test('should send authentication token', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
        auth: {
          type: 'token',
          token: 'test-token-67890',
        },
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();
    expect(client.getState()).toBe('open');
    await client.close();
  });
});

/**
 * Test suite for WebSocket data clearing
 */
test.describe('WebSocket Data Management Tests', () => {
  test('should clear received messages', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);
    await client.connect();

    // Send some messages
    await client.send({ payload: 'Test 1', format: 'text' });
    await client.receive(5000);

    expect(client.getReceivedMessages().length).toBeGreaterThan(0);

    // Clear data
    client.clear();

    expect(client.getReceivedMessages().length).toBe(0);
    expect(client.getEvents().length).toBe(0);

    await client.close();
  });
});

/**
 * Real-world scenario: Chat application testing
 */
test.describe('Real-world: Chat Application', () => {
  test('should handle chat room subscription and messages', async () => {
    const config: WebSocketClientConfig = {
      url: 'wss://echo.websocket.org',
      options: {
        protocol: 'wss',
      },
    };

    const client = createWebSocketClient(config);

    await test.step('Connect to chat server', async () => {
      await client.connect();
      expect(client.getState()).toBe('open');
    });

    await test.step('Subscribe to chat room', async () => {
      await client.send({
        payload: {
          action: 'subscribe',
          room: 'general',
        },
        format: 'json',
      });
    });

    await test.step('Send chat message', async () => {
      await client.send({
        payload: {
          action: 'message',
          room: 'general',
          user: 'TestUser',
          text: 'Hello everyone!',
        },
        format: 'json',
      });
    });

    await test.step('Receive confirmation', async () => {
      const response = await client.receive(5000);
      expect(response).toBeDefined();
    });

    await test.step('Check performance', async () => {
      const metrics = client.getMetrics();
      expect(metrics.messagesSent).toBe(2);
      expect(metrics.errors).toBe(0);
    });

    await client.close();
  });
});
