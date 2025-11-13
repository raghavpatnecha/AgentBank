/**
 * WebSocket Test Client
 * Handles WebSocket connections and message exchange for testing
 */

import WebSocket from 'ws';
import { ConnectionState, MessageType } from '../types/websocket-types.js';
import type {
  WebSocketClientConfig,
  WebSocketMessageData,
  WebSocketMessageResult,
  WebSocketEventResult,
  WebSocketEventType,
  WebSocketMetrics,
  ReconnectionConfig,
} from '../types/websocket-types.js';

/**
 * WebSocket Test Client Implementation
 * Manages WebSocket connections for testing purposes
 */
export class WebSocketTestClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private state: ConnectionState = ConnectionState.CLOSED;
  private receivedMessages: WebSocketMessageResult[] = [];
  private events: WebSocketEventResult[] = [];
  private metrics: Partial<WebSocketMetrics> = {
    messagesSent: 0,
    messagesReceived: 0,
    reconnections: 0,
    errors: 0,
  };
  private connectionStartTime: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private testStartTime: number = 0;
  private debug: boolean;

  constructor(config: WebSocketClientConfig) {
    this.config = config;
    this.debug = config.debug || false;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.log('Connecting to WebSocket:', this.config.url);
        this.connectionStartTime = Date.now();
        this.testStartTime = Date.now();
        this.state = ConnectionState.CONNECTING;

        // Build WebSocket options
        const wsOptions: WebSocket.ClientOptions = {
          headers: this.config.options.headers || {},
        };

        // Add protocols if specified
        const protocols = this.config.options.protocols || [];

        // Apply authentication
        this.applyAuthentication(wsOptions);

        // Create WebSocket connection
        this.ws = new WebSocket(this.config.url, protocols, wsOptions);

        // Setup event handlers
        this.setupEventHandlers();

        // Connection timeout
        const timeout = this.config.options.connectionTimeout || 5000;
        const timeoutId = setTimeout(() => {
          if (this.state === ConnectionState.CONNECTING) {
            this.ws?.terminate();
            const error = new Error(`Connection timeout after ${timeout}ms`);
            this.recordError(error);
            reject(error);
          }
        }, timeout);

        // Wait for connection
        this.ws.once('open', () => {
          clearTimeout(timeoutId);
          this.state = ConnectionState.OPEN;
          const connectionTime = Date.now() - this.connectionStartTime;
          this.metrics.connectionTime = connectionTime;
          this.log(`Connected in ${connectionTime}ms`);

          // Record open event
          this.recordEvent('open', {});

          // Start heartbeat if configured
          if (this.config.options.heartbeatInterval) {
            this.startHeartbeat();
          }

          // Call handler
          if (this.config.handlers?.onOpen) {
            this.config.handlers.onOpen({ type: 'open' });
          }

          resolve();
        });

        this.ws.once('error', (error) => {
          clearTimeout(timeoutId);
          if (this.state === ConnectionState.CONNECTING) {
            this.recordError(error);
            reject(error);
          }
        });
      } catch (error) {
        this.recordError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Send message to WebSocket server
   */
  async send(data: WebSocketMessageData, timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.state !== ConnectionState.OPEN) {
        const error = new Error('WebSocket is not connected');
        this.recordError(error);
        reject(error);
        return;
      }

      try {
        let payload: string | Buffer;
        let messageType: MessageType;

        // Prepare payload based on format
        if (data.format === 'json') {
          payload = JSON.stringify(data.payload);
          messageType = MessageType.JSON;
        } else if (data.format === 'binary') {
          payload = Buffer.from(data.payload as string | Buffer);
          messageType = MessageType.BINARY;
        } else {
          payload = String(data.payload);
          messageType = MessageType.TEXT;
        }

        this.log('Sending message:', { type: messageType, payload });

        // Send message
        this.ws.send(payload, (error) => {
          if (error) {
            this.recordError(error);
            reject(error);
            return;
          }

          // Record sent message
          this.metrics.messagesSent = (this.metrics.messagesSent || 0) + 1;
          this.log('Message sent successfully');
          resolve();
        });

        // Timeout for send operation
        setTimeout(() => {
          reject(new Error(`Send timeout after ${timeout}ms`));
        }, timeout);
      } catch (error) {
        this.recordError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Receive message from WebSocket server
   */
  async receive(timeout: number = 5000): Promise<WebSocketMessageResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Receive timeout after ${timeout}ms`));
      }, timeout);

      // Check if we already have messages in queue
      if (this.receivedMessages.length > 0) {
        clearTimeout(timeoutId);
        const message = this.receivedMessages.shift()!;
        resolve(message);
        return;
      }

      // Wait for next message
      const handler = (data: WebSocket.Data) => {
        clearTimeout(timeoutId);
        const message = this.processReceivedMessage(data);
        this.ws?.off('message', handler);
        resolve(message);
      };

      this.ws?.on('message', handler);
    });
  }

  /**
   * Wait for specific message matching a predicate
   */
  async waitForMessage(
    predicate: (message: WebSocketMessageResult) => boolean,
    timeout: number = 5000
  ): Promise<WebSocketMessageResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for matching message after ${timeout}ms`));
      }, timeout);

      // Check existing messages
      const existingMatch = this.receivedMessages.find(predicate);
      if (existingMatch) {
        clearTimeout(timeoutId);
        resolve(existingMatch);
        return;
      }

      // Wait for new message
      const handler = (data: WebSocket.Data) => {
        const message = this.processReceivedMessage(data);
        if (predicate(message)) {
          clearTimeout(timeoutId);
          this.ws?.off('message', handler);
          resolve(message);
        }
      };

      this.ws?.on('message', handler);
    });
  }

  /**
   * Send ping to server
   */
  async ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.state !== ConnectionState.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const startTime = Date.now();

      this.ws.ping();
      this.recordEvent('ping', {});

      this.ws.once('pong', () => {
        const latency = Date.now() - startTime;
        this.recordEvent('pong', { latency });
        if (this.config.handlers?.onPong) {
          this.config.handlers.onPong();
        }
        resolve(latency);
      });

      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  /**
   * Close WebSocket connection
   */
  async close(code: number = 1000, reason: string = 'Normal closure'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws || this.state === ConnectionState.CLOSED) {
        resolve();
        return;
      }

      this.log(`Closing connection: ${code} - ${reason}`);
      this.state = ConnectionState.CLOSING;

      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Close connection
      this.ws.once('close', () => {
        this.state = ConnectionState.CLOSED;
        this.recordEvent('close', { code, reason });
        resolve();
      });

      this.ws.close(code, reason);

      // Force close after timeout
      setTimeout(() => {
        if (this.state !== ConnectionState.CLOSED) {
          this.ws?.terminate();
          this.state = ConnectionState.CLOSED;
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get received messages
   */
  getReceivedMessages(): WebSocketMessageResult[] {
    return [...this.receivedMessages];
  }

  /**
   * Get recorded events
   */
  getEvents(): WebSocketEventResult[] {
    return [...this.events];
  }

  /**
   * Get performance metrics
   */
  getMetrics(): WebSocketMetrics {
    const roundTripTimes = this.receivedMessages
      .filter((m) => m.responseTime !== undefined)
      .map((m) => m.responseTime!);

    const averageRoundTripTime =
      roundTripTimes.length > 0
        ? roundTripTimes.reduce((sum, time) => sum + time, 0) / roundTripTimes.length
        : 0;

    return {
      connectionTime: this.metrics.connectionTime || 0,
      averageRoundTripTime,
      messagesSent: this.metrics.messagesSent || 0,
      messagesReceived: this.metrics.messagesReceived || 0,
      reconnections: this.metrics.reconnections || 0,
      errors: this.metrics.errors || 0,
    };
  }

  /**
   * Clear recorded data
   */
  clear(): void {
    this.receivedMessages = [];
    this.events = [];
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      reconnections: 0,
      errors: 0,
    };
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    // Message handler
    this.ws.on('message', (data: WebSocket.Data) => {
      this.processReceivedMessage(data);
    });

    // Error handler
    this.ws.on('error', (error: Error) => {
      this.log('WebSocket error:', error.message);
      this.state = ConnectionState.ERROR;
      this.recordError(error);
      this.recordEvent('error', { error: error.message });

      if (this.config.handlers?.onError) {
        this.config.handlers.onError(error);
      }

      // Attempt reconnection if configured
      if (this.config.options.reconnection?.enabled) {
        this.attemptReconnection();
      }
    });

    // Close handler
    this.ws.on('close', (code: number, reason: string) => {
      this.log(`WebSocket closed: ${code} - ${reason}`);
      this.state = ConnectionState.CLOSED;
      this.recordEvent('close', { code, reason: reason.toString() });

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.config.handlers?.onClose) {
        const closeEvent = {
          type: 'close' as const,
          code,
          reason: reason.toString(),
          wasClean: code === 1000,
        };
        this.config.handlers.onClose(closeEvent);
      }

      // Attempt reconnection if configured and not a normal closure
      if (code !== 1000 && this.config.options.reconnection?.enabled) {
        this.attemptReconnection();
      }
    });

    // Ping handler
    this.ws.on('ping', () => {
      this.recordEvent('ping', {});
      if (this.config.handlers?.onPing) {
        this.config.handlers.onPing();
      }
    });

    // Pong handler
    this.ws.on('pong', () => {
      this.recordEvent('pong', {});
      if (this.config.handlers?.onPong) {
        this.config.handlers.onPong();
      }
    });
  }

  /**
   * Process received message
   */
  private processReceivedMessage(data: WebSocket.Data): WebSocketMessageResult {
    let payload: unknown;
    let type: MessageType;

    // Determine message type and parse payload
    if (Buffer.isBuffer(data)) {
      type = MessageType.BINARY;
      payload = data;
    } else if (typeof data === 'string') {
      type = MessageType.TEXT;
      // Try to parse as JSON
      try {
        payload = JSON.parse(data);
        type = MessageType.JSON;
      } catch {
        payload = data;
      }
    } else {
      type = MessageType.TEXT;
      payload = data.toString();
    }

    const message: WebSocketMessageResult = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      direction: 'receive',
      type,
      payload,
      timestamp: Date.now(),
    };

    this.receivedMessages.push(message);
    this.metrics.messagesReceived = (this.metrics.messagesReceived || 0) + 1;
    this.log('Message received:', { type, payload });

    if (this.config.handlers?.onMessage) {
      this.config.handlers.onMessage(message);
    }

    return message;
  }

  /**
   * Apply authentication to WebSocket connection
   */
  private applyAuthentication(options: WebSocket.ClientOptions): void {
    const auth = this.config.options.auth;
    if (!auth) return;

    switch (auth.type) {
      case 'token':
      case 'header':
        if (auth.header) {
          if (!options.headers) options.headers = {};
          options.headers[auth.header.name] = auth.header.value;
        } else if (auth.token) {
          if (!options.headers) options.headers = {};
          options.headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;

      case 'query':
        if (auth.query) {
          const url = new URL(this.config.url);
          url.searchParams.set(auth.query.name, auth.query.value);
          this.config.url = url.toString();
        }
        break;

      case 'cookie':
        if (auth.cookie) {
          if (!options.headers) options.headers = {};
          options.headers['Cookie'] = `${auth.cookie.name}=${auth.cookie.value}`;
        }
        break;
    }
  }

  /**
   * Start heartbeat (ping/pong)
   */
  private startHeartbeat(): void {
    if (!this.config.options.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        this.log('Heartbeat failed:', error);
      }
    }, this.config.options.heartbeatInterval);
  }

  /**
   * Attempt reconnection
   */
  private async attemptReconnection(): Promise<void> {
    const reconnectConfig: ReconnectionConfig = this.config.options.reconnection || {
      enabled: false,
    };

    if (!reconnectConfig.enabled) return;

    const maxAttempts = reconnectConfig.maxAttempts || 3;
    const retryDelay = reconnectConfig.retryDelay || 1000;
    const backoffMultiplier = reconnectConfig.backoffMultiplier || 2;
    const maxDelay = reconnectConfig.maxDelay || 30000;

    let attempt = 0;
    let delay = retryDelay;

    while (attempt < maxAttempts) {
      attempt++;
      this.log(`Reconnection attempt ${attempt}/${maxAttempts} in ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        await this.connect();
        this.metrics.reconnections = (this.metrics.reconnections || 0) + 1;
        this.recordEvent('reconnect', { attempt });
        this.log('Reconnection successful');
        return;
      } catch (error) {
        this.log(`Reconnection attempt ${attempt} failed:`, error);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    this.log('All reconnection attempts failed');
  }

  /**
   * Record event
   */
  private recordEvent(event: string, data: unknown): void {
    this.events.push({
      event: event as WebSocketEventType,
      timestamp: Date.now(),
      data,
      timingOffset: Date.now() - this.testStartTime,
    });
  }

  /**
   * Record error
   */
  private recordError(error: Error): void {
    this.metrics.errors = (this.metrics.errors || 0) + 1;
    this.log('Error:', error.message);
  }

  /**
   * Log debug message
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[WebSocketTestClient]', ...args);
    }
  }
}

/**
 * Create WebSocket test client
 */
export function createWebSocketClient(config: WebSocketClientConfig): WebSocketTestClient {
  return new WebSocketTestClient(config);
}
