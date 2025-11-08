/**
 * Test Runner Unit Tests
 * Comprehensive test suite for test execution engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlaywrightTestRunner, executeTests } from '../../src/executor/test-runner.js';
import { ResultCollector } from '../../src/executor/result-collector.js';
import {
  ExecutionOptions,
  TestStatus,
  ProgressEventType,
  ErrorType,
} from '../../src/types/executor-types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock child_process spawn
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises');

describe('PlaywrightTestRunner', () => {
  let runner: PlaywrightTestRunner;
  let collector: ResultCollector;

  beforeEach(() => {
    collector = new ResultCollector();
    runner = new PlaywrightTestRunner(collector);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create runner with default collector', () => {
      const defaultRunner = new PlaywrightTestRunner();
      expect(defaultRunner).toBeInstanceOf(PlaywrightTestRunner);
    });

    it('should create runner with custom collector', () => {
      const customCollector = new ResultCollector();
      const customRunner = new PlaywrightTestRunner(customCollector);
      expect(customRunner).toBeInstanceOf(PlaywrightTestRunner);
    });
  });

  describe('executeTests', () => {
    it('should throw error if execution already in progress', async () => {
      // Mock spawn to simulate running process
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            // Don't call callback to keep process "running"
          }
        }),
        kill: vi.fn(),
        killed: false,
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      // Start first execution (won't complete)
      const promise = runner.executeTests();

      // Try to start second execution
      await expect(runner.executeTests()).rejects.toThrow('already in progress');
    });

    it('should emit start progress event', async () => {
      const progressEvents: any[] = [];
      runner.onProgress((event) => progressEvents.push(event));

      // Mock successful execution
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests();

      const startEvent = progressEvents.find(e => e.type === ProgressEventType.START);
      expect(startEvent).toBeDefined();
      expect(startEvent.completed).toBe(0);
    });

    it('should emit complete progress event', async () => {
      const progressEvents: any[] = [];
      runner.onProgress((event) => progressEvents.push(event));

      // Mock successful execution
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests();

      const completeEvent = progressEvents.find(e => e.type === ProgressEventType.COMPLETE);
      expect(completeEvent).toBeDefined();
      expect(completeEvent.percentage).toBe(100);
    });

    it('should handle execution options', async () => {
      const options: ExecutionOptions = {
        testPath: './tests/my-tests',
        workers: 2,
        retries: 1,
        timeout: 15000,
        showProgress: true,
      };

      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests(options);

      expect(spawn).toHaveBeenCalled();
      const spawnArgs = vi.mocked(spawn).mock.calls[0];
      const command = spawnArgs[1] as string[];

      expect(command).toContain('./tests/my-tests');
      expect(command).toContain('--workers');
      expect(command).toContain('2');
      expect(command).toContain('--retries');
      expect(command).toContain('1');
    });

    it('should handle process errors', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Process error')), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      await expect(runner.executeTests()).rejects.toThrow('Failed to execute Playwright');
    });

    it('should handle critical exit codes', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(2), 10); // Exit code 2 = critical error
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      await expect(runner.executeTests()).rejects.toThrow('exited with code 2');
    });
  });

  describe('onProgress', () => {
    it('should register progress callback', () => {
      const callback = vi.fn();
      runner.onProgress(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call multiple progress callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      runner.onProgress(callback1);
      runner.onProgress(callback2);

      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const successCallback = vi.fn();

      runner.onProgress(errorCallback);
      runner.onProgress(successCallback);

      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      // Should not throw even though callback throws
      await runner.executeTests();

      expect(successCallback).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop running process with SIGTERM', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
        killed: true,
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      // Start execution
      const executePromise = runner.executeTests();

      // Stop execution
      await runner.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should force kill if SIGTERM fails', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
        killed: false, // Process didn't die
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      // Start execution
      const executePromise = runner.executeTests();

      // Stop execution
      await runner.stop();

      // Should be called twice: SIGTERM then SIGKILL
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
    });
  });

  describe('buildPlaywrightCommand', () => {
    it('should build basic command', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests();

      const spawnArgs = vi.mocked(spawn).mock.calls[0];
      const command = spawnArgs[1] as string[];

      expect(command).toContain('playwright');
      expect(command).toContain('test');
      expect(command).toContain('--reporter=json');
    });

    it('should add test path', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests({ testPath: './my-tests' });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('./my-tests');
    });

    it('should add multiple test paths', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests({ testPath: ['./test1', './test2'] });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('./test1');
      expect(command).toContain('./test2');
    });

    it('should add config path', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests({ configPath: './custom.config.ts' });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('--config');
      expect(command).toContain('./custom.config.ts');
    });

    it('should add grep pattern', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests({ grep: 'should pass' });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('--grep');
      expect(command).toContain('should pass');
    });

    it('should add fail-fast flag', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await runner.executeTests({ failFast: true });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('-x');
    });
  });

  describe('parseProgressFromOutput', () => {
    it('should parse "Running N tests" message', async () => {
      const progressEvents: any[] = [];
      runner.onProgress((event) => progressEvents.push(event));

      const { spawn } = await import('child_process');
      let stdoutCallback: any;
      const mockProcess = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') stdoutCallback = callback;
          })
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const executePromise = runner.executeTests({ showProgress: true });

      // Simulate Playwright output
      stdoutCallback(Buffer.from('Running 25 tests using 4 workers\n'));

      await executePromise;

      const startEvent = progressEvents.find(
        e => e.type === ProgressEventType.START && e.total === 25
      );
      expect(startEvent).toBeDefined();
    });

    it('should parse progress "[X/Y]" messages', async () => {
      const progressEvents: any[] = [];
      runner.onProgress((event) => progressEvents.push(event));

      const { spawn } = await import('child_process');
      let stdoutCallback: any;
      const mockProcess = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') stdoutCallback = callback;
          })
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const executePromise = runner.executeTests({ showProgress: true });

      // Simulate Playwright progress output
      stdoutCallback(Buffer.from('[10/25] test.spec.ts:10:5 › should pass\n'));

      await executePromise;

      const progressEvent = progressEvents.find(
        e => e.type === ProgressEventType.TEST_END && e.completed === 10
      );
      expect(progressEvent).toBeDefined();
      expect(progressEvent?.total).toBe(25);
      expect(progressEvent?.percentage).toBe(40);
    });
  });

  describe('convertPlaywrightTestResult', () => {
    it('should convert passed test', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const mockResults = {
        suites: [
          {
            file: 'test.spec.ts',
            tests: [
              {
                titlePath: ['should pass'],
                status: 'passed',
                duration: 1234,
                startTime: new Date('2024-01-01T00:00:00Z'),
                retry: 0,
              },
            ],
          },
        ],
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockResults));

      await runner.executeTests({ outputDir: 'results' });

      const results = collector.getResults();
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(TestStatus.PASSED);
      expect(results[0].duration).toBe(1234);
    });

    it('should convert failed test with error', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const mockResults = {
        suites: [
          {
            file: 'test.spec.ts',
            tests: [
              {
                titlePath: ['should fail'],
                status: 'failed',
                duration: 2000,
                startTime: new Date('2024-01-01T00:00:00Z'),
                retry: 2,
                error: {
                  message: 'Expected 200, got 404',
                  stack: 'Error: Expected 200, got 404\n  at test.spec.ts:10',
                },
              },
            ],
          },
        ],
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockResults));

      await runner.executeTests({ outputDir: 'results' });

      const results = collector.getResults();
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(TestStatus.FAILED);
      expect(results[0].error).toBeDefined();
      expect(results[0].error?.message).toContain('Expected 200');
      expect(results[0].retries).toBe(2);
    });

    it('should classify assertion errors', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const mockResults = {
        suites: [
          {
            file: 'test.spec.ts',
            tests: [
              {
                titlePath: ['should fail'],
                status: 'failed',
                duration: 1000,
                startTime: new Date(),
                error: {
                  message: 'expect(received).toBe(expected)',
                },
              },
            ],
          },
        ],
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockResults));

      await runner.executeTests();

      const results = collector.getResults();
      expect(results[0].error?.type).toBe(ErrorType.ASSERTION);
    });

    it('should handle timeout status', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);

      const mockResults = {
        suites: [
          {
            file: 'test.spec.ts',
            tests: [
              {
                titlePath: ['should timeout'],
                status: 'timedOut',
                duration: 30000,
                startTime: new Date(),
              },
            ],
          },
        ],
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockResults));

      await runner.executeTests();

      const results = collector.getResults();
      expect(results[0].status).toBe(TestStatus.TIMEOUT);
    });
  });

  describe('executeTests helper function', () => {
    it('should execute tests with default runner', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const summary = await executeTests();

      expect(summary).toBeDefined();
      expect(summary.totalTests).toBeGreaterThanOrEqual(0);
    });

    it('should pass options to runner', async () => {
      const { spawn } = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
        kill: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(mockProcess as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      await executeTests({ workers: 8 });

      const command = vi.mocked(spawn).mock.calls[0][1] as string[];
      expect(command).toContain('--workers');
      expect(command).toContain('8');
    });
  });
});
