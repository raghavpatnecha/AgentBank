/**
 * TypeScript type definitions for WebSocket Testing
 * Defines interfaces for WebSocket test generation and execution
 */

import type { SchemaObject } from './openapi-types.js';
import type { TestMetadata } from './test-generator-types.js';

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error',
}

/**
 * WebSocket protocol types
 */
export type WebSocketProtocol = 'ws' | 'wss';

/**
 * WebSocket message types
 */
export enum MessageType {
  TEXT = 'text',
  BINARY = 'binary',
  JSON = 'json',
  PING = 'ping',
  PONG = 'pong',
}

/**
 * WebSocket test case structure
 */
export interface WebSocketTestCase {
  /** Unique test identifier */
  id: string;

  /** Test name */
  name: string;

  /** Test description */
  description: string;

  /** WebSocket endpoint URL */
  endpoint: string;

  /** Connection configuration */
  connection: WebSocketConnectionConfig;

  /** Messages to send/receive */
  messages: WebSocketMessageTest[];

  /** Expected events */
  expectedEvents?: WebSocketEventTest[];

  /** Test assertions */
  assertions: WebSocketAssertion[];

  /** Test timeout in milliseconds */
  timeout?: number;

  /** Test metadata */
  metadata: TestMetadata;
}

/**
 * WebSocket connection configuration
 */
export interface WebSocketConnectionConfig {
  /** Protocol (ws or wss) */
  protocol: WebSocketProtocol;

  /** Connection headers */
  headers?: Record<string, string>;

  /** Subprotocols to use */
  protocols?: string[];

  /** Authentication configuration */
  auth?: WebSocketAuthConfig;

  /** Connection timeout in ms */
  connectionTimeout?: number;

  /** Heartbeat/ping interval in ms */
  heartbeatInterval?: number;

  /** Reconnection strategy */
  reconnection?: ReconnectionConfig;

  /** Query parameters */
  queryParams?: Record<string, string>;
}

/**
 * WebSocket authentication configuration
 */
export interface WebSocketAuthConfig {
  /** Authentication type */
  type: 'token' | 'cookie' | 'header' | 'query';

  /** Token value or reference */
  token?: string;

  /** Cookie configuration */
  cookie?: {
    name: string;
    value: string;
  };

  /** Header configuration */
  header?: {
    name: string;
    value: string;
  };

  /** Query parameter configuration */
  query?: {
    name: string;
    value: string;
  };
}

/**
 * Reconnection configuration
 */
export interface ReconnectionConfig {
  /** Enable automatic reconnection */
  enabled: boolean;

  /** Maximum number of retry attempts */
  maxAttempts?: number;

  /** Delay between retries in ms */
  retryDelay?: number;

  /** Exponential backoff multiplier */
  backoffMultiplier?: number;

  /** Maximum delay in ms */
  maxDelay?: number;
}

/**
 * WebSocket message test
 */
export interface WebSocketMessageTest {
  /** Message identifier */
  id: string;

  /** Message type */
  type: MessageType;

  /** Direction (send or receive) */
  direction: 'send' | 'receive';

  /** Message data */
  data: WebSocketMessageData;

  /** Expected response (for send messages) */
  expectedResponse?: WebSocketMessageData;

  /** Delay before sending/after receiving (ms) */
  delay?: number;

  /** Timeout for response (ms) */
  responseTimeout?: number;

  /** Message schema validation */
  schema?: SchemaObject;
}

/**
 * WebSocket message data
 */
export interface WebSocketMessageData {
  /** Message payload */
  payload: string | Buffer | Record<string, unknown>;

  /** Message format */
  format: 'text' | 'binary' | 'json';

  /** Message metadata */
  metadata?: Record<string, unknown>;
}

/**
 * WebSocket event test
 */
export interface WebSocketEventTest {
  /** Event type */
  event: WebSocketEventType;

  /** Expected timing (ms from test start) */
  expectedTiming?: number;

  /** Timing tolerance (ms) */
  timingTolerance?: number;

  /** Event data expectations */
  expectedData?: unknown;

  /** Whether event is required */
  required: boolean;
}

/**
 * WebSocket event types
 */
export enum WebSocketEventType {
  OPEN = 'open',
  CLOSE = 'close',
  ERROR = 'error',
  MESSAGE = 'message',
  PING = 'ping',
  PONG = 'pong',
  RECONNECT = 'reconnect',
}

/**
 * WebSocket assertion types
 */
export interface WebSocketAssertion {
  /** Assertion type */
  type: WebSocketAssertionType;

  /** Target (what to assert) */
  target: string;

  /** Expected value */
  expected: unknown;

  /** Assertion message */
  message?: string;

  /** Assertion timeout (ms) */
  timeout?: number;
}

/**
 * WebSocket assertion types
 */
export enum WebSocketAssertionType {
  CONNECTION_ESTABLISHED = 'connection_established',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_COUNT = 'message_count',
  MESSAGE_CONTENT = 'message_content',
  MESSAGE_ORDER = 'message_order',
  CONNECTION_CLOSED = 'connection_closed',
  ERROR_OCCURRED = 'error_occurred',
  PING_PONG = 'ping_pong',
  RECONNECTION_SUCCESS = 'reconnection_success',
  RESPONSE_TIME = 'response_time',
}

/**
 * WebSocket test result
 */
export interface WebSocketTestResult {
  /** Test case ID */
  testId: string;

  /** Test name */
  name: string;

  /** Test status */
  status: 'passed' | 'failed' | 'error';

  /** Test duration (ms) */
  duration: number;

  /** Connection events */
  events: WebSocketEventResult[];

  /** Messages sent/received */
  messages: WebSocketMessageResult[];

  /** Assertion results */
  assertions: WebSocketAssertionResult[];

  /** Error information */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };

  /** Performance metrics */
  metrics?: WebSocketMetrics;
}

/**
 * WebSocket event result
 */
export interface WebSocketEventResult {
  /** Event type */
  event: WebSocketEventType;

  /** Timestamp */
  timestamp: number;

  /** Event data */
  data?: unknown;

  /** Time from test start (ms) */
  timingOffset: number;
}

/**
 * WebSocket message result
 */
export interface WebSocketMessageResult {
  /** Message ID */
  id: string;

  /** Direction */
  direction: 'send' | 'receive';

  /** Message type */
  type: MessageType;

  /** Payload */
  payload: unknown;

  /** Timestamp */
  timestamp: number;

  /** Response time (ms) - for sent messages */
  responseTime?: number;
}

/**
 * WebSocket assertion result
 */
export interface WebSocketAssertionResult {
  /** Assertion type */
  type: WebSocketAssertionType;

  /** Pass/fail status */
  passed: boolean;

  /** Actual value */
  actual: unknown;

  /** Expected value */
  expected: unknown;

  /** Error message if failed */
  error?: string;
}

/**
 * WebSocket performance metrics
 */
export interface WebSocketMetrics {
  /** Connection time (ms) */
  connectionTime: number;

  /** Average message round-trip time (ms) */
  averageRoundTripTime: number;

  /** Total messages sent */
  messagesSent: number;

  /** Total messages received */
  messagesReceived: number;

  /** Reconnection count */
  reconnections: number;

  /** Error count */
  errors: number;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  /** WebSocket URL */
  url: string;

  /** Connection options */
  options: WebSocketConnectionConfig;

  /** Event handlers */
  handlers?: WebSocketEventHandlers;

  /** Debug mode */
  debug?: boolean;
}

/**
 * WebSocket close event
 */
export interface WebSocketCloseEvent {
  type: 'close';
  code: number;
  reason: string;
  wasClean: boolean;
}

/**
 * WebSocket open event
 */
export interface WebSocketOpenEvent {
  type: 'open';
}

/**
 * WebSocket event handlers
 */
export interface WebSocketEventHandlers {
  /** Connection opened */
  onOpen?: (event: WebSocketOpenEvent) => void;

  /** Message received */
  onMessage?: (message: WebSocketMessageResult) => void;

  /** Connection closed */
  onClose?: (event: WebSocketCloseEvent) => void;

  /** Error occurred */
  onError?: (error: Error) => void;

  /** Ping received */
  onPing?: () => void;

  /** Pong received */
  onPong?: () => void;
}

/**
 * WebSocket test scenario types
 */
export type WebSocketScenarioType =
  | 'connection' // Basic connection test
  | 'echo' // Message echo test
  | 'binary' // Binary message test
  | 'json' // JSON message test
  | 'heartbeat' // Ping/pong heartbeat test
  | 'reconnection' // Reconnection test
  | 'close' // Close handshake test
  | 'error' // Error handling test
  | 'ordering' // Message ordering test
  | 'concurrent' // Concurrent connections test
  | 'authentication' // Authentication test
  | 'subscription'; // Event subscription test

/**
 * WebSocket test generation options
 */
export interface WebSocketTestGenerationOptions {
  /** Scenarios to generate */
  scenarios?: WebSocketScenarioType[];

  /** Include authentication tests */
  includeAuth?: boolean;

  /** Include reconnection tests */
  includeReconnection?: boolean;

  /** Include performance tests */
  includePerformance?: boolean;

  /** Message count for ordering tests */
  messageCount?: number;

  /** Concurrent connection count */
  concurrentConnections?: number;

  /** Default timeout (ms) */
  defaultTimeout?: number;
}

/**
 * OpenAPI WebSocket extension
 * Custom extension for defining WebSocket endpoints in OpenAPI
 */
export interface OpenAPIWebSocketExtension {
  /** WebSocket path */
  path: string;

  /** Description */
  description?: string;

  /** Connection parameters */
  parameters?: Array<{
    name: string;
    in: 'query' | 'header';
    required?: boolean;
    schema?: SchemaObject;
  }>;

  /** Authentication requirements */
  security?: Array<Record<string, string[]>>;

  /** Message schemas */
  messages?: {
    /** Messages that can be sent to server */
    send?: Array<{
      name: string;
      description?: string;
      schema: SchemaObject;
    }>;
    /** Messages that can be received from server */
    receive?: Array<{
      name: string;
      description?: string;
      schema: SchemaObject;
    }>;
  };

  /** Subprotocols supported */
  subprotocols?: string[];

  /** Tags */
  tags?: string[];
}

/**
 * WebSocket endpoint information extracted from OpenAPI
 */
export interface WebSocketEndpoint {
  /** WebSocket path */
  path: string;

  /** Full URL template */
  url: string;

  /** Description */
  description?: string;

  /** Parameters */
  parameters: Array<{
    name: string;
    in: 'query' | 'header';
    required: boolean;
    schema?: SchemaObject;
  }>;

  /** Security requirements */
  security: Array<Record<string, string[]>>;

  /** Message definitions */
  messages: {
    send: Array<{
      name: string;
      description?: string;
      schema: SchemaObject;
    }>;
    receive: Array<{
      name: string;
      description?: string;
      schema: SchemaObject;
    }>;
  };

  /** Supported subprotocols */
  subprotocols: string[];

  /** Tags */
  tags: string[];
}
