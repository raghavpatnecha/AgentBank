/**
 * Test Executor Module
 * Exports parallel execution and retry logic components
 */

export { WorkerManager, createWorkerManager, DEFAULT_WORKER_CONFIG } from './worker-manager.js';
export { RetryHandler, createRetryHandler } from './retry-handler.js';
export { PlaywrightTestRunner, executeTests } from './test-runner.js';
export {
  DockerTestExecutor,
  createDockerExecutor,
  executeTestsInDocker,
} from './docker-test-executor.js';
export { WebSocketTestClient, createWebSocketClient } from './websocket-client.js';

export type {
  WorkerConfig,
  WorkerInfo,
  TestTask,
  TestExecutionResult,
  AllocationRequest,
  AllocationResult,
  WorkerManagerStats,
  RetryConfig,
  RetryAttempt,
  FlakyTest,
  FlakyTestReport,
  BackoffResult,
} from '../types/worker-types.js';

export { WorkerState, AllocationStrategy } from '../types/worker-types.js';
