/**
 * WebSocket Testing Examples
 * Demonstrates how to use WebSocket testing capabilities in AgentBank
 */

import { createWebSocketClient } from '../src/executor/websocket-client.js';
import { createWebSocketTestGenerator } from '../src/generators/websocket-test-generator.js';
import type { ParsedApiSpec } from '../src/types/openapi-types.js';
import type {
  WebSocketTestCase,
  WebSocketClientConfig,
  MessageType,
} from '../src/types/websocket-types.js';

/**
 * Example 1: Basic WebSocket Connection Test
 */
async function example1_BasicConnection() {
  console.log('Example 1: Basic WebSocket Connection\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/ws',
    options: {
      protocol: 'ws',
      connectionTimeout: 5000,
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    // Connect to WebSocket server
    await client.connect();
    console.log('✓ Connected successfully');

    // Check connection state
    console.log('State:', client.getState());

    // Close connection
    await client.close();
    console.log('✓ Connection closed');
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
}

/**
 * Example 2: Echo Test (Send and Receive)
 */
async function example2_EchoTest() {
  console.log('\nExample 2: Echo Test\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/echo',
    options: {
      protocol: 'ws',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Send a text message
    await client.send({
      payload: 'Hello WebSocket!',
      format: 'text',
    });
    console.log('✓ Message sent');

    // Receive the echo
    const response = await client.receive(5000);
    console.log('✓ Received:', response.payload);

    await client.close();
  } catch (error) {
    console.error('✗ Echo test failed:', error);
  }
}

/**
 * Example 3: JSON Message Test
 */
async function example3_JSONMessage() {
  console.log('\nExample 3: JSON Message Test\n');

  const config: WebSocketClientConfig = {
    url: 'wss://echo.websocket.org',
    options: {
      protocol: 'wss',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Send JSON message
    const jsonData = {
      type: 'chat',
      user: 'TestUser',
      message: 'Hello from AgentBank!',
      timestamp: Date.now(),
    };

    await client.send({
      payload: jsonData,
      format: 'json',
    });
    console.log('✓ JSON message sent:', jsonData);

    // Receive response
    const response = await client.receive(5000);
    console.log('✓ Received:', response.payload);

    await client.close();
  } catch (error) {
    console.error('✗ JSON test failed:', error);
  }
}

/**
 * Example 4: Binary Message Test
 */
async function example4_BinaryMessage() {
  console.log('\nExample 4: Binary Message Test\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/binary',
    options: {
      protocol: 'ws',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Send binary data
    const binaryData = Buffer.from('Binary test data', 'utf-8');
    await client.send({
      payload: binaryData,
      format: 'binary',
    });
    console.log('✓ Binary message sent');

    const response = await client.receive(5000);
    console.log('✓ Received binary response');

    await client.close();
  } catch (error) {
    console.error('✗ Binary test failed:', error);
  }
}

/**
 * Example 5: Heartbeat (Ping/Pong) Test
 */
async function example5_Heartbeat() {
  console.log('\nExample 5: Heartbeat Test\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/ws',
    options: {
      protocol: 'ws',
      heartbeatInterval: 2000, // Ping every 2 seconds
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected with heartbeat enabled');

    // Send a manual ping
    const latency = await client.ping();
    console.log(`✓ Ping/Pong latency: ${latency}ms`);

    // Wait to observe automatic heartbeats
    await new Promise(resolve => setTimeout(resolve, 6000));

    await client.close();
  } catch (error) {
    console.error('✗ Heartbeat test failed:', error);
  }
}

/**
 * Example 6: Authentication Test
 */
async function example6_Authentication() {
  console.log('\nExample 6: Authentication Test\n');

  const config: WebSocketClientConfig = {
    url: 'wss://api.example.com/ws/chat',
    options: {
      protocol: 'wss',
      auth: {
        type: 'token',
        token: process.env.WS_AUTH_TOKEN || 'test-token-12345',
      },
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected with authentication');

    // Send authenticated message
    await client.send({
      payload: { action: 'subscribe', channel: 'updates' },
      format: 'json',
    });

    await client.close();
  } catch (error) {
    console.error('✗ Authentication failed:', error);
  }
}

/**
 * Example 7: Reconnection Test
 */
async function example7_Reconnection() {
  console.log('\nExample 7: Reconnection Test\n');

  const config: WebSocketClientConfig = {
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
    handlers: {
      onError: (error) => console.log('Error occurred:', error.message),
      onClose: (event) => console.log('Connection closed:', event.code),
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected with auto-reconnection enabled');

    // Simulate some activity
    await new Promise(resolve => setTimeout(resolve, 2000));

    // The client will automatically reconnect if connection drops
    console.log('Metrics:', client.getMetrics());

    await client.close();
  } catch (error) {
    console.error('✗ Reconnection test failed:', error);
  }
}

/**
 * Example 8: Message Ordering Test
 */
async function example8_MessageOrdering() {
  console.log('\nExample 8: Message Ordering Test\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/echo',
    options: {
      protocol: 'ws',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Send sequence of messages
    for (let i = 1; i <= 5; i++) {
      await client.send({
        payload: { sequence: i, message: `Message ${i}` },
        format: 'json',
      });
      console.log(`✓ Sent message ${i}`);
    }

    // Receive and verify order
    const messages = client.getReceivedMessages();
    console.log(`✓ Received ${messages.length} messages`);
    messages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}:`, msg.payload);
    });

    await client.close();
  } catch (error) {
    console.error('✗ Ordering test failed:', error);
  }
}

/**
 * Example 9: Event Subscription Test (Real-time Chat)
 */
async function example9_EventSubscription() {
  console.log('\nExample 9: Event Subscription (Real-time Chat)\n');

  const config: WebSocketClientConfig = {
    url: 'wss://api.example.com/ws/chat',
    options: {
      protocol: 'wss',
      auth: {
        type: 'header',
        header: {
          name: 'Authorization',
          value: 'Bearer ' + (process.env.CHAT_TOKEN || 'test-token'),
        },
      },
    },
    handlers: {
      onMessage: (message) => {
        console.log('📨 New message:', message.payload);
      },
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected to chat server');

    // Subscribe to chat room
    await client.send({
      payload: {
        action: 'subscribe',
        room: 'general',
      },
      format: 'json',
    });
    console.log('✓ Subscribed to chat room');

    // Send a chat message
    await client.send({
      payload: {
        action: 'message',
        room: 'general',
        text: 'Hello everyone!',
      },
      format: 'json',
    });
    console.log('✓ Chat message sent');

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get all events
    const events = client.getEvents();
    console.log('Events:', events.length);

    await client.close();
  } catch (error) {
    console.error('✗ Subscription test failed:', error);
  }
}

/**
 * Example 10: Generate WebSocket Tests from OpenAPI
 */
async function example10_GenerateFromOpenAPI() {
  console.log('\nExample 10: Generate Tests from OpenAPI\n');

  // Sample OpenAPI spec with WebSocket extension
  const openApiSpec: ParsedApiSpec = {
    version: '3.0.0',
    type: 'openapi-3.0',
    info: {
      title: 'Chat API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://api.example.com',
      },
    ],
    paths: {
      '/ws/chat': {
        summary: 'WebSocket chat endpoint',
        'x-websocket': {
          path: '/ws/chat',
          description: 'Real-time chat WebSocket',
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
                name: 'chatMessage',
                description: 'Send a chat message',
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['message'] },
                    text: { type: 'string' },
                  },
                  required: ['action', 'text'],
                },
              },
            ],
            receive: [
              {
                name: 'chatMessage',
                description: 'Receive a chat message',
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'string' },
                    text: { type: 'string' },
                    timestamp: { type: 'number' },
                  },
                },
              },
            ],
          },
          tags: ['chat', 'websocket'],
        },
      },
    },
    components: {},
    security: [],
    tags: [],
  };

  // Create WebSocket test generator
  const generator = createWebSocketTestGenerator(
    openApiSpec,
    'https://api.example.com',
    {
      scenarios: ['connection', 'echo', 'json', 'heartbeat', 'authentication'],
      includeAuth: true,
      includeReconnection: true,
      defaultTimeout: 10000,
    }
  );

  // Extract WebSocket endpoints
  const endpoints = generator.extractWebSocketEndpoints();
  console.log(`✓ Found ${endpoints.length} WebSocket endpoint(s)`);

  endpoints.forEach(endpoint => {
    console.log('\nEndpoint:', endpoint.path);
    console.log('  URL:', endpoint.url);
    console.log('  Description:', endpoint.description);
    console.log('  Security:', endpoint.security);
    console.log('  Send messages:', endpoint.messages.send.length);
    console.log('  Receive messages:', endpoint.messages.receive.length);
  });

  // Generate test cases
  const testCases = generator.generateTests(endpoints);
  console.log(`\n✓ Generated ${testCases.length} test case(s)`);

  testCases.forEach((test, idx) => {
    console.log(`\n${idx + 1}. ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    console.log(`   Messages: ${test.messages.length}`);
    console.log(`   Assertions: ${test.assertions.length}`);
  });
}

/**
 * Example 11: Performance Metrics
 */
async function example11_PerformanceMetrics() {
  console.log('\nExample 11: Performance Metrics\n');

  const config: WebSocketClientConfig = {
    url: 'ws://localhost:8080/echo',
    options: {
      protocol: 'ws',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Send multiple messages and track performance
    const messageCount = 10;
    for (let i = 0; i < messageCount; i++) {
      await client.send({
        payload: `Test message ${i}`,
        format: 'text',
      });
      await client.receive(1000);
    }

    // Get performance metrics
    const metrics = client.getMetrics();
    console.log('\nPerformance Metrics:');
    console.log('  Connection time:', metrics.connectionTime, 'ms');
    console.log('  Average RTT:', metrics.averageRoundTripTime.toFixed(2), 'ms');
    console.log('  Messages sent:', metrics.messagesSent);
    console.log('  Messages received:', metrics.messagesReceived);
    console.log('  Reconnections:', metrics.reconnections);
    console.log('  Errors:', metrics.errors);

    await client.close();
  } catch (error) {
    console.error('✗ Performance test failed:', error);
  }
}

/**
 * Example 12: Wait for Specific Message
 */
async function example12_WaitForMessage() {
  console.log('\nExample 12: Wait for Specific Message\n');

  const config: WebSocketClientConfig = {
    url: 'wss://api.example.com/ws/events',
    options: {
      protocol: 'wss',
    },
    debug: true,
  };

  const client = createWebSocketClient(config);

  try {
    await client.connect();
    console.log('✓ Connected');

    // Subscribe to events
    await client.send({
      payload: { action: 'subscribe', event: 'user.login' },
      format: 'json',
    });

    // Wait for specific event type
    const loginEvent = await client.waitForMessage(
      (msg) => {
        if (typeof msg.payload === 'object' && msg.payload !== null) {
          return (msg.payload as any).event === 'user.login';
        }
        return false;
      },
      10000
    );

    console.log('✓ Received login event:', loginEvent.payload);

    await client.close();
  } catch (error) {
    console.error('✗ Wait for message failed:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('='.repeat(60));
  console.log('WebSocket Testing Examples for AgentBank');
  console.log('='.repeat(60));

  // Note: Comment out examples that require a running server
  // Uncomment to run specific examples

  // await example1_BasicConnection();
  // await example2_EchoTest();
  // await example3_JSONMessage();
  // await example4_BinaryMessage();
  // await example5_Heartbeat();
  // await example6_Authentication();
  // await example7_Reconnection();
  // await example8_MessageOrdering();
  // await example9_EventSubscription();
  await example10_GenerateFromOpenAPI();
  // await example11_PerformanceMetrics();
  // await example12_WaitForMessage();

  console.log('\n' + '='.repeat(60));
  console.log('Examples completed!');
  console.log('='.repeat(60));
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  example1_BasicConnection,
  example2_EchoTest,
  example3_JSONMessage,
  example4_BinaryMessage,
  example5_Heartbeat,
  example6_Authentication,
  example7_Reconnection,
  example8_MessageOrdering,
  example9_EventSubscription,
  example10_GenerateFromOpenAPI,
  example11_PerformanceMetrics,
  example12_WaitForMessage,
};
