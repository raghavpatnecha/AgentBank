/**
 * Type definitions for worker management and parallel execution
 * Supports parallel execution, retry logic, and worker management
 */

/**
 * Worker configuration
 */
export interface WorkerConfig {
  /** Maximum number of parallel workers */
  maxWorkers: number;
  /** Minimum number of workers to maintain */
  minWorkers: number;
  /** Memory limit per worker in MB */
  memoryLimitMB: number;
  /** Timeout for worker tasks in milliseconds */
  workerTimeout: number;
  /** Enable worker isolation */
  isolation: boolean;
}

/**
 * Worker state
 */
export enum WorkerState {
  IDLE = 'idle',
  BUSY = 'busy',
  FAILED = 'failed',
  TERMINATED = 'terminated',
}

/**
 * Worker information
 */
export interface WorkerInfo {
  /** Unique worker ID */
  id: string;
  /** Current state */
  state: WorkerState;
  /** Current task ID if busy */
  taskId?: string;
  /** Memory usage in MB */
  memoryUsageMB: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Number of failed tasks */
  failedTasks: number;
  /** Worker start time */
  startTime: Date;
  /** Last activity time */
  lastActivity: Date;
}

/**
 * Test task to be executed
 */
export interface TestTask {
  /** Unique task ID */
  id: string;
  /** Test file path */
  filePath: string;
  /** Test name or pattern */
  testName?: string;
  /** Priority (higher = more important) */
  priority: number;
  /** Whether test requires serialization */
  requiresSerialization: boolean;
  /** Dependencies (task IDs that must complete first) */
  dependencies: string[];
  /** Retry count */
  retryCount: number;
  /** Maximum retries allowed */
  maxRetries: number;
}

/**
 * Test execution result for worker manager
 */
export interface TestExecutionResult {
  /** Task ID */
  taskId: string;
  /** Success status */
  success: boolean;
  /** Error if failed */
  error?: Error;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Worker ID that executed the test */
  workerId: string;
  /** Retry attempt number (0 = first attempt) */
  retryAttempt: number;
  /** Whether test is flaky (failed then passed) */
  isFlaky: boolean;
  /** Test output/logs */
  output?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial backoff delay in milliseconds */
  initialDelayMs: number;
  /** Maximum backoff delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Enable jitter to prevent thundering herd */
  enableJitter: boolean;
  /** Jitter factor (0-1) */
  jitterFactor: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  /** Attempt number (1-based) */
  attemptNumber: number;
  /** Timestamp of attempt */
  timestamp: Date;
  /** Error that caused retry */
  error: Error;
  /** Delay before next attempt in milliseconds */
  delayMs: number;
}

/**
 * Flaky test information
 */
export interface FlakyTest {
  /** Test identifier */
  testId: string;
  /** Test file path */
  filePath: string;
  /** Test name */
  testName: string;
  /** Number of times test failed before passing */
  failureCount: number;
  /** All retry attempts */
  attempts: RetryAttempt[];
  /** First failure time */
  firstFailure: Date;
  /** Final success time */
  finalSuccess: Date;
  /** Total execution time including retries */
  totalExecutionTime: number;
}

/**
 * Flaky test report
 */
export interface FlakyTestReport {
  /** Report generation time */
  generatedAt: Date;
  /** Total number of flaky tests detected */
  totalFlakyTests: number;
  /** List of flaky tests */
  flakyTests: FlakyTest[];
  /** Summary statistics */
  statistics: {
    /** Total tests executed */
    totalTests: number;
    /** Percentage of flaky tests */
    flakyPercentage: number;
    /** Average retries per flaky test */
    averageRetries: number;
    /** Most flaky test */
    mostFlakyTest?: FlakyTest;
  };
}

/**
 * Backoff calculation result
 */
export interface BackoffResult {
  /** Delay in milliseconds */
  delayMs: number;
  /** Whether max delay was reached */
  maxDelayReached: boolean;
  /** Attempt number */
  attemptNumber: number;
}

/**
 * Worker manager statistics
 */
export interface WorkerManagerStats {
  /** Total workers */
  totalWorkers: number;
  /** Active workers */
  activeWorkers: number;
  /** Idle workers */
  idleWorkers: number;
  /** Failed workers */
  failedWorkers: number;
  /** Total tasks completed */
  totalTasksCompleted: number;
  /** Total tasks failed */
  totalTasksFailed: number;
  /** Average task execution time */
  averageExecutionTime: number;
  /** Total memory usage in MB */
  totalMemoryUsageMB: number;
  /** Uptime in milliseconds */
  uptimeMs: number;
}

/**
 * Resource allocation strategy
 */
export enum AllocationStrategy {
  /** Round-robin allocation */
  ROUND_ROBIN = 'round-robin',
  /** Least-loaded worker first */
  LEAST_LOADED = 'least-loaded',
  /** Random allocation */
  RANDOM = 'random',
  /** Priority-based allocation */
  PRIORITY = 'priority',
}

/**
 * Worker allocation request
 */
export interface AllocationRequest {
  /** Task to allocate */
  task: TestTask;
  /** Preferred strategy */
  strategy: AllocationStrategy;
  /** Timeout for allocation in milliseconds */
  timeout: number;
}

/**
 * Worker allocation result
 */
export interface AllocationResult {
  /** Allocated worker */
  worker: WorkerInfo;
  /** Whether allocation was successful */
  success: boolean;
  /** Reason if allocation failed */
  reason?: string;
}
