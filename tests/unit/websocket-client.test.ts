/**
 * Unit tests for WebSocket Test Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createWebSocketClient } from '../../src/executor/websocket-client.js';
import type { WebSocketClientConfig } from '../../src/types/websocket-types.js';

describe('WebSocketTestClient', () => {
  describe('Configuration', () => {
    it('should create client with valid config', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
      expect(client.getState()).toBe('closed');
    });

    it('should accept debug option', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
        debug: true,
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept event handlers', () => {
      const onOpen = vi.fn();
      const onMessage = vi.fn();
      const onClose = vi.fn();
      const onError = vi.fn();

      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
        handlers: {
          onOpen,
          onMessage,
          onClose,
          onError,
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should start in closed state', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      expect(client.getState()).toBe('closed');
    });

    it('should initialize with empty messages', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      expect(client.getReceivedMessages()).toEqual([]);
    });

    it('should initialize with empty events', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      expect(client.getEvents()).toEqual([]);
    });
  });

  describe('Metrics', () => {
    it('should initialize metrics to zero', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      const metrics = client.getMetrics();

      expect(metrics.messagesSent).toBe(0);
      expect(metrics.messagesReceived).toBe(0);
      expect(metrics.reconnections).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });

  describe('Data Management', () => {
    it('should clear messages and events', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      client.clear();

      expect(client.getReceivedMessages()).toEqual([]);
      expect(client.getEvents()).toEqual([]);
      expect(client.getMetrics().messagesSent).toBe(0);
      expect(client.getMetrics().messagesReceived).toBe(0);
    });
  });

  describe('Authentication Config', () => {
    it('should accept token authentication', () => {
      const config: WebSocketClientConfig = {
        url: 'wss://api.example.com/ws',
        options: {
          protocol: 'wss',
          auth: {
            type: 'token',
            token: 'test-token-123',
          },
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept header authentication', () => {
      const config: WebSocketClientConfig = {
        url: 'wss://api.example.com/ws',
        options: {
          protocol: 'wss',
          auth: {
            type: 'header',
            header: {
              name: 'Authorization',
              value: 'Bearer token-456',
            },
          },
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept query authentication', () => {
      const config: WebSocketClientConfig = {
        url: 'wss://api.example.com/ws',
        options: {
          protocol: 'wss',
          auth: {
            type: 'query',
            query: {
              name: 'token',
              value: 'query-token-789',
            },
          },
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept cookie authentication', () => {
      const config: WebSocketClientConfig = {
        url: 'wss://api.example.com/ws',
        options: {
          protocol: 'wss',
          auth: {
            type: 'cookie',
            cookie: {
              name: 'session',
              value: 'cookie-value',
            },
          },
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('Reconnection Config', () => {
    it('should accept reconnection configuration', () => {
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
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('Heartbeat Config', () => {
    it('should accept heartbeat configuration', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
          heartbeatInterval: 2000,
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('Connection Options', () => {
    it('should accept custom headers', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
          headers: {
            'X-Custom-Header': 'custom-value',
            'User-Agent': 'AgentBank-Test',
          },
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept subprotocols', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
          protocols: ['chat', 'superchat'],
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept connection timeout', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
          connectionTimeout: 10000,
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('URL Protocols', () => {
    it('should accept ws:// protocol', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:8080/ws',
        options: {
          protocol: 'ws',
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });

    it('should accept wss:// protocol', () => {
      const config: WebSocketClientConfig = {
        url: 'wss://secure.example.com/ws',
        options: {
          protocol: 'wss',
        },
      };

      const client = createWebSocketClient(config);
      expect(client).toBeDefined();
    });
  });
});
