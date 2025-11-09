/**
 * Worker Manager
 * Manages parallel test execution with intelligent worker allocation and resource management
 */

import type {
  WorkerConfig,
  WorkerInfo,
  WorkerState,
  TestTask,
  TestExecutionResult,
  AllocationResult,
  WorkerManagerStats,
} from '../types/worker-types.js';
import { WorkerState as WS, AllocationStrategy } from '../types/worker-types.js';

/**
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  maxWorkers: parseInt(process.env.MAX_WORKERS || '4', 10),
  minWorkers: parseInt(process.env.MIN_WORKERS || '1', 10),
  memoryLimitMB: parseInt(process.env.WORKER_MEMORY_LIMIT_MB || '512', 10),
  workerTimeout: parseInt(process.env.WORKER_TIMEOUT_MS || '30000', 10),
  isolation: process.env.WORKER_ISOLATION === 'true',
};

/**
 * Worker instance
 */
class Worker {
  id: string;
  state: WorkerState;
  taskId?: string;
  memoryUsageMB: number;
  completedTasks: number;
  failedTasks: number;
  startTime: Date;
  lastActivity: Date;

  constructor(id: string) {
    this.id = id;
    this.state = WS.IDLE;
    this.memoryUsageMB = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.startTime = new Date();
    this.lastActivity = new Date();
  }

  getInfo(): WorkerInfo {
    return {
      id: this.id,
      state: this.state,
      taskId: this.taskId,
      memoryUsageMB: this.memoryUsageMB,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
    };
  }

  updateMemoryUsage(): void {
    // In a real implementation, this would measure actual memory usage
    // For now, we'll simulate it based on task count
    this.memoryUsageMB = Math.min(
      50 + this.completedTasks * 5,
      DEFAULT_WORKER_CONFIG.memoryLimitMB
    );
  }
}

/**
 * Worker Manager
 */
export class WorkerManager {
  private config: WorkerConfig;
  private workers: Map<string, Worker> = new Map();
  private taskQueue: TestTask[] = [];
  private runningTasks: Map<string, TestTask> = new Map();
  private serializedTasks: TestTask[] = [];
  private isShuttingDown: boolean = false;
  private startTime: Date;
  private totalExecutionTime: number = 0;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...config };
    this.startTime = new Date();
    this.validateConfig();
    this.initializeWorkers();
  }

  /**
   * Validate worker configuration
   */
  private validateConfig(): void {
    if (this.config.maxWorkers < 1) {
      throw new Error('maxWorkers must be at least 1');
    }
    if (this.config.minWorkers < 1) {
      throw new Error('minWorkers must be at least 1');
    }
    if (this.config.minWorkers > this.config.maxWorkers) {
      throw new Error('minWorkers cannot exceed maxWorkers');
    }
    if (this.config.memoryLimitMB < 64) {
      throw new Error('memoryLimitMB must be at least 64');
    }
    if (this.config.workerTimeout < 1000) {
      throw new Error('workerTimeout must be at least 1000ms');
    }
  }

  /**
   * Initialize workers
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      const worker = new Worker(`worker-${i + 1}`);
      this.workers.set(worker.id, worker);
    }
  }

  /**
   * Schedule a test task
   */
  async scheduleTask(task: TestTask): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Worker manager is shutting down');
    }

    // Add to appropriate queue
    if (task.requiresSerialization) {
      this.serializedTasks.push(task);
    } else {
      this.taskQueue.push(task);
    }

    // Sort by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    this.serializedTasks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute all scheduled tasks
   */
  async executeTasks(
    executor: (task: TestTask) => Promise<TestExecutionResult>
  ): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];

    // Execute serialized tasks first (one at a time)
    for (const task of this.serializedTasks) {
      const result = await this.executeTask(task, executor);
      results.push(result);
    }

    // Execute parallel tasks
    const parallelPromises: Promise<TestExecutionResult>[] = [];

    while (this.taskQueue.length > 0 || this.runningTasks.size > 0) {
      // Check if we can start more tasks
      while (this.taskQueue.length > 0 && this.hasAvailableWorker()) {
        const task = this.taskQueue.shift()!;

        // Check dependencies
        if (this.areDependenciesMet(task, results)) {
          const promise = this.executeTask(task, executor);
          parallelPromises.push(promise);
        } else {
          // Put back in queue
          this.taskQueue.push(task);
          break;
        }
      }

      // Wait a bit before checking again
      if (this.taskQueue.length > 0 && !this.hasAvailableWorker()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (this.taskQueue.length === 0 && this.runningTasks.size === 0) {
        break;
      }
    }

    // Wait for all parallel tasks to complete
    const parallelResults = await Promise.all(parallelPromises);
    results.push(...parallelResults);

    return results;
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: TestTask,
    executor: (task: TestTask) => Promise<TestExecutionResult>
  ): Promise<TestExecutionResult> {
    const worker = await this.allocateWorker(task);

    if (!worker.success) {
      throw new Error(`Failed to allocate worker: ${worker.reason}`);
    }

    const workerInstance = this.workers.get(worker.worker.id)!;
    workerInstance.state = WS.BUSY;
    workerInstance.taskId = task.id;
    workerInstance.lastActivity = new Date();
    this.runningTasks.set(task.id, task);

    const startTime = Date.now();

    try {
      // Set timeout
      const timeoutPromise = new Promise<TestExecutionResult>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Task ${task.id} timed out`)),
          this.config.workerTimeout
        );
      });

      // Execute with timeout
      const result = await Promise.race([
        executor(task),
        timeoutPromise,
      ]);

      // Update worker stats
      workerInstance.completedTasks++;
      workerInstance.state = WS.IDLE;
      workerInstance.taskId = undefined;
      workerInstance.lastActivity = new Date();
      workerInstance.updateMemoryUsage();

      // Track execution time
      this.totalExecutionTime += Date.now() - startTime;

      return result;

    } catch (error) {
      // Handle failure
      workerInstance.failedTasks++;
      workerInstance.state = WS.IDLE;
      workerInstance.taskId = undefined;
      workerInstance.lastActivity = new Date();

      throw error;

    } finally {
      this.runningTasks.delete(task.id);
      this.preventWorkerStarvation();
    }
  }

  /**
   * Allocate a worker for a task
   */
  private async allocateWorker(
    _task: TestTask,
    strategy: AllocationStrategy = AllocationStrategy.LEAST_LOADED
  ): Promise<AllocationResult> {
    // Try to find an idle worker
    let worker = this.findWorkerByStrategy(strategy);

    // If no idle worker and we can create more
    if (!worker && this.workers.size < this.config.maxWorkers) {
      worker = this.createWorker();
    }

    // If still no worker, wait for one to become available
    if (!worker) {
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        worker = this.findWorkerByStrategy(strategy);
        if (worker) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!worker) {
      return {
        worker: {} as WorkerInfo,
        success: false,
        reason: 'No workers available',
      };
    }

    return {
      worker: worker.getInfo(),
      success: true,
    };
  }

  /**
   * Find worker by allocation strategy
   */
  private findWorkerByStrategy(strategy: AllocationStrategy): Worker | undefined {
    const idleWorkers = Array.from(this.workers.values()).filter(
      (w) => w.state === WS.IDLE
    );

    if (idleWorkers.length === 0) {
      return undefined;
    }

    switch (strategy) {
      case AllocationStrategy.LEAST_LOADED:
        return idleWorkers.reduce((least, current) =>
          current.memoryUsageMB < least.memoryUsageMB ? current : least
        );

      case AllocationStrategy.ROUND_ROBIN:
        return idleWorkers[0];

      case AllocationStrategy.RANDOM:
        return idleWorkers[Math.floor(Math.random() * idleWorkers.length)];

      case AllocationStrategy.PRIORITY:
        return idleWorkers.reduce((best, current) =>
          current.completedTasks < best.completedTasks ? current : best
        );

      default:
        return idleWorkers[0];
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): Worker {
    const id = `worker-${this.workers.size + 1}`;
    const worker = new Worker(id);
    this.workers.set(id, worker);
    return worker;
  }

  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(task: TestTask, completedResults: TestExecutionResult[]): boolean {
    if (task.dependencies.length === 0) {
      return true;
    }

    const completedTaskIds = new Set(completedResults.map((r) => r.taskId));
    return task.dependencies.every((depId) => completedTaskIds.has(depId));
  }

  /**
   * Check if there's an available worker
   */
  private hasAvailableWorker(): boolean {
    return (
      Array.from(this.workers.values()).some((w) => w.state === WS.IDLE) ||
      this.workers.size < this.config.maxWorkers
    );
  }

  /**
   * Prevent worker starvation
   * Ensures tasks are distributed evenly across workers
   */
  private preventWorkerStarvation(): void {
    const busyWorkers = Array.from(this.workers.values()).filter(
      (w) => w.state === WS.BUSY
    ).length;

    const idleWorkers = this.workers.size - busyWorkers;

    // If too many workers are idle and we're above minimum, remove some
    if (idleWorkers > 2 && this.workers.size > this.config.minWorkers) {
      const workersToRemove = Math.min(
        idleWorkers - 1,
        this.workers.size - this.config.minWorkers
      );

      const idleWorkerInstances = Array.from(this.workers.values())
        .filter((w) => w.state === WS.IDLE)
        .slice(0, workersToRemove);

      for (const worker of idleWorkerInstances) {
        worker.state = WS.TERMINATED;
        this.workers.delete(worker.id);
      }
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage(): void {
    for (const worker of this.workers.values()) {
      worker.updateMemoryUsage();

      // Check if worker exceeds memory limit
      if (worker.memoryUsageMB > this.config.memoryLimitMB) {
        console.warn(
          `Worker ${worker.id} exceeded memory limit: ${worker.memoryUsageMB}MB / ${this.config.memoryLimitMB}MB`
        );

        // If worker is idle, restart it
        if (worker.state === WS.IDLE) {
          this.restartWorker(worker.id);
        }
      }
    }
  }

  /**
   * Restart a worker
   */
  private restartWorker(workerId: string): void {
    this.workers.delete(workerId);
    const newWorker = new Worker(workerId);
    this.workers.set(workerId, newWorker);
  }

  /**
   * Gracefully shutdown all workers
   */
  async shutdown(timeoutMs: number = 10000): Promise<void> {
    this.isShuttingDown = true;

    const startTime = Date.now();

    // Wait for running tasks to complete
    while (this.runningTasks.size > 0 && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Force terminate remaining workers
    for (const worker of this.workers.values()) {
      worker.state = WS.TERMINATED;
    }

    this.workers.clear();
    this.taskQueue = [];
    this.serializedTasks = [];
    this.runningTasks.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): WorkerManagerStats {
    const workers = Array.from(this.workers.values());

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.state === WS.BUSY).length,
      idleWorkers: workers.filter((w) => w.state === WS.IDLE).length,
      failedWorkers: workers.filter((w) => w.state === WS.FAILED).length,
      totalTasksCompleted: workers.reduce((sum, w) => sum + w.completedTasks, 0),
      totalTasksFailed: workers.reduce((sum, w) => sum + w.failedTasks, 0),
      averageExecutionTime:
        workers.reduce((sum, w) => sum + w.completedTasks, 0) > 0
          ? this.totalExecutionTime / workers.reduce((sum, w) => sum + w.completedTasks, 0)
          : 0,
      totalMemoryUsageMB: workers.reduce((sum, w) => sum + w.memoryUsageMB, 0),
      uptimeMs: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Get all workers
   */
  getWorkers(): WorkerInfo[] {
    return Array.from(this.workers.values()).map((w) => w.getInfo());
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): WorkerInfo | undefined {
    return this.workers.get(workerId)?.getInfo();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();

    // Adjust workers to match new config
    while (this.workers.size < this.config.minWorkers) {
      this.createWorker();
    }
  }
}

/**
 * Create a worker manager with default configuration
 */
export function createWorkerManager(config?: Partial<WorkerConfig>): WorkerManager {
  return new WorkerManager(config);
}
