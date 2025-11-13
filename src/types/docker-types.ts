/**
 * TypeScript type definitions for Docker Test Executor (Feature 3.1)
 * Defines interfaces for Docker-based test isolation and execution
 */

import type { ExecutionOptions, TestResult, ExecutionSummary } from './executor-types.js';

/**
 * Docker executor configuration
 */
export interface DockerExecutorOptions extends ExecutionOptions {
  /** Docker image to use for test execution */
  dockerImage?: string;

  /** Docker registry for custom images */
  registry?: string;

  /** Enable container isolation per test */
  isolationPerTest?: boolean;

  /** Container resource limits */
  resources?: ContainerResources;

  /** Network configuration */
  network?: NetworkConfig;

  /** Volume mounts for test files and dependencies */
  volumes?: VolumeMount[];

  /** Container cleanup strategy */
  cleanupStrategy?: CleanupStrategy;

  /** Enable container logs capture */
  captureLogs?: boolean;

  /** Container retry configuration */
  containerRetry?: ContainerRetryConfig;

  /** Docker host (for remote Docker) */
  dockerHost?: string;

  /** Docker socket path (for local Docker) */
  dockerSocket?: string;

  /** Container name prefix */
  containerPrefix?: string;

  /** Keep containers after execution (for debugging) */
  keepContainers?: boolean;

  /** Pull image before execution */
  pullImage?: boolean;

  /** Docker build context (if building custom image) */
  buildContext?: string;

  /** Dockerfile path (if building custom image) */
  dockerfile?: string;

  /** Environment variables to inject into container */
  containerEnv?: Record<string, string>;

  /** Working directory inside container */
  workingDir?: string;

  /** Container user to run as */
  user?: string;

  /** Container platform (e.g., linux/amd64) */
  platform?: string;
}

/**
 * Container resource limits
 */
export interface ContainerResources {
  /** Memory limit in MB */
  memoryMB?: number;

  /** Memory swap limit in MB */
  memorySwapMB?: number;

  /** CPU limit (number of CPUs, can be fractional) */
  cpuLimit?: number;

  /** CPU shares (relative weight) */
  cpuShares?: number;

  /** Disk I/O weight (10-1000) */
  ioWeight?: number;

  /** Maximum PIDs (process limit) */
  pidsLimit?: number;
}

/**
 * Network configuration for containers
 */
export interface NetworkConfig {
  /** Network mode (bridge, host, none, container:name) */
  mode: NetworkMode;

  /** Custom network name */
  networkName?: string;

  /** DNS servers */
  dns?: string[];

  /** DNS search domains */
  dnsSearch?: string[];

  /** Extra hosts to add to /etc/hosts */
  extraHosts?: Record<string, string>;

  /** Publish ports (containerPort:hostPort) */
  ports?: Record<number, number>;

  /** Enable network isolation */
  isolated?: boolean;
}

/**
 * Network modes
 */
export enum NetworkMode {
  BRIDGE = 'bridge',
  HOST = 'host',
  NONE = 'none',
  CUSTOM = 'custom',
}

/**
 * Volume mount configuration
 */
export interface VolumeMount {
  /** Host path */
  hostPath: string;

  /** Container path */
  containerPath: string;

  /** Mount mode (ro, rw) */
  mode: 'ro' | 'rw';

  /** Volume driver options */
  driverOpts?: Record<string, string>;
}

/**
 * Container cleanup strategy
 */
export enum CleanupStrategy {
  /** Remove container immediately after execution */
  IMMEDIATE = 'immediate',

  /** Remove container after all tests complete */
  BATCH = 'batch',

  /** Remove container on process exit */
  ON_EXIT = 'on-exit',

  /** Never remove containers (manual cleanup) */
  MANUAL = 'manual',
}

/**
 * Container retry configuration
 */
export interface ContainerRetryConfig {
  /** Maximum retry attempts for container failures */
  maxRetries: number;

  /** Initial backoff delay in milliseconds */
  initialDelayMs: number;

  /** Maximum backoff delay in milliseconds */
  maxDelayMs: number;

  /** Backoff multiplier */
  backoffMultiplier: number;

  /** Retry on specific exit codes */
  retryOnExitCodes?: number[];
}

/**
 * Container configuration for test execution
 */
export interface ContainerConfig {
  /** Container ID (assigned after creation) */
  id?: string;

  /** Container name */
  name: string;

  /** Docker image */
  image: string;

  /** Command to run */
  cmd?: string[];

  /** Entrypoint override */
  entrypoint?: string[];

  /** Environment variables */
  env: Record<string, string>;

  /** Working directory */
  workingDir: string;

  /** Resource limits */
  resources: ContainerResources;

  /** Network configuration */
  network: NetworkConfig;

  /** Volume mounts */
  volumes: VolumeMount[];

  /** User to run as */
  user?: string;

  /** Platform */
  platform?: string;

  /** Labels for container metadata */
  labels: Record<string, string>;

  /** Auto-remove container after exit */
  autoRemove: boolean;
}

/**
 * Container status
 */
export enum ContainerStatus {
  CREATED = 'created',
  STARTING = 'starting',
  RUNNING = 'running',
  EXITED = 'exited',
  FAILED = 'failed',
  REMOVED = 'removed',
}

/**
 * Container execution result
 */
export interface ContainerExecutionResult {
  /** Container ID */
  containerId: string;

  /** Container name */
  containerName: string;

  /** Exit code */
  exitCode: number;

  /** Container status */
  status: ContainerStatus;

  /** Test results from container */
  testResults: TestResult[];

  /** Container logs (stdout) */
  stdout: string;

  /** Container logs (stderr) */
  stderr: string;

  /** Container start time */
  startTime: Date;

  /** Container end time */
  endTime: Date;

  /** Container execution duration in milliseconds */
  duration: number;

  /** Container resource usage */
  resourceUsage?: ContainerResourceUsage;

  /** Container error (if any) */
  error?: ContainerError;
}

/**
 * Container resource usage statistics
 */
export interface ContainerResourceUsage {
  /** CPU usage percentage */
  cpuPercent: number;

  /** Memory usage in MB */
  memoryMB: number;

  /** Memory limit in MB */
  memoryLimitMB: number;

  /** Memory usage percentage */
  memoryPercent: number;

  /** Network I/O (bytes received) */
  networkRxBytes: number;

  /** Network I/O (bytes transmitted) */
  networkTxBytes: number;

  /** Block I/O (bytes read) */
  blockReadBytes: number;

  /** Block I/O (bytes written) */
  blockWriteBytes: number;

  /** PIDs (number of processes) */
  pids: number;
}

/**
 * Container error information
 */
export interface ContainerError {
  /** Error code */
  code: ContainerErrorCode;

  /** Error message */
  message: string;

  /** Error details */
  details?: string;

  /** Original error (if any) */
  originalError?: Error;

  /** Container ID (if applicable) */
  containerId?: string;

  /** Retry attempt number */
  retryAttempt?: number;
}

/**
 * Container error codes
 */
export enum ContainerErrorCode {
  /** Failed to create container */
  CREATE_FAILED = 'create-failed',

  /** Failed to start container */
  START_FAILED = 'start-failed',

  /** Container exited with non-zero code */
  EXIT_ERROR = 'exit-error',

  /** Container timed out */
  TIMEOUT = 'timeout',

  /** Failed to stop container */
  STOP_FAILED = 'stop-failed',

  /** Failed to remove container */
  REMOVE_FAILED = 'remove-failed',

  /** Docker daemon connection error */
  DOCKER_CONNECTION = 'docker-connection',

  /** Image not found */
  IMAGE_NOT_FOUND = 'image-not-found',

  /** Image pull failed */
  IMAGE_PULL_FAILED = 'image-pull-failed',

  /** Out of resources (memory, CPU, etc.) */
  OUT_OF_RESOURCES = 'out-of-resources',

  /** Network error */
  NETWORK_ERROR = 'network-error',

  /** Volume mount error */
  VOLUME_ERROR = 'volume-error',

  /** Unknown error */
  UNKNOWN = 'unknown',
}

/**
 * Docker executor statistics
 */
export interface DockerExecutorStats {
  /** Total containers created */
  totalContainers: number;

  /** Containers currently running */
  runningContainers: number;

  /** Containers successfully completed */
  successfulContainers: number;

  /** Containers failed */
  failedContainers: number;

  /** Total tests executed */
  totalTests: number;

  /** Total test duration in milliseconds */
  totalDuration: number;

  /** Average test duration per container in milliseconds */
  averageDuration: number;

  /** Total container creation time in milliseconds */
  totalCreationTime: number;

  /** Total resource usage */
  totalResourceUsage: {
    memoryMB: number;
    cpuSeconds: number;
    networkBytes: number;
    diskBytes: number;
  };

  /** Containers pending cleanup */
  pendingCleanup: number;

  /** Retry statistics */
  retryStats: {
    totalRetries: number;
    retriesByReason: Record<string, number>;
  };
}

/**
 * Docker execution result
 */
export interface DockerExecutionResult extends ExecutionSummary {
  /** Container execution results */
  containers: ContainerExecutionResult[];

  /** Docker executor statistics */
  dockerStats: DockerExecutorStats;

  /** Containers that failed to start */
  failedContainers: string[];

  /** Containers that were retried */
  retriedContainers: string[];
}

/**
 * Container lifecycle event
 */
export interface ContainerLifecycleEvent {
  /** Event type */
  type: ContainerLifecycleEventType;

  /** Container ID */
  containerId: string;

  /** Container name */
  containerName: string;

  /** Timestamp */
  timestamp: Date;

  /** Event data */
  data?: Record<string, unknown>;
}

/**
 * Container lifecycle event types
 */
export enum ContainerLifecycleEventType {
  CREATING = 'creating',
  CREATED = 'created',
  STARTING = 'starting',
  STARTED = 'started',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  REMOVING = 'removing',
  REMOVED = 'removed',
  ERROR = 'error',
}

/**
 * Docker test runner interface
 */
export interface DockerTestRunner {
  /**
   * Execute tests in isolated Docker containers
   * @param options - Docker execution options
   * @returns Docker execution result
   */
  executeTests(options: DockerExecutorOptions): Promise<DockerExecutionResult>;

  /**
   * Execute a single test in a Docker container
   * @param testPath - Path to test file
   * @param options - Docker execution options
   * @returns Container execution result
   */
  executeTest(testPath: string, options: DockerExecutorOptions): Promise<ContainerExecutionResult>;

  /**
   * Get executor statistics
   * @returns Docker executor statistics
   */
  getStats(): DockerExecutorStats;

  /**
   * Clean up containers
   * @param force - Force removal of running containers
   */
  cleanup(force?: boolean): Promise<void>;

  /**
   * Subscribe to container lifecycle events
   * @param callback - Event handler
   */
  onContainerEvent(callback: ContainerEventCallback): void;
}

/**
 * Container event callback
 */
export type ContainerEventCallback = (event: ContainerLifecycleEvent) => void;
