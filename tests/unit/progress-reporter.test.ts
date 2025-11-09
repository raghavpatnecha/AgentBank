/**
 * Unit Tests for Progress Reporter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressReporter } from '../../src/cli/progress-reporter.js';
import type { GenerationStatistics } from '../../src/types/test-generator-types.js';

describe('ProgressReporter', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create reporter with default verbose=false', () => {
      const reporter = new ProgressReporter();
      expect(reporter).toBeDefined();
    });

    it('should create reporter with verbose=true', () => {
      const reporter = new ProgressReporter(true);
      expect(reporter).toBeDefined();
    });
  });

  describe('start', () => {
    it('should log start message', () => {
      const reporter = new ProgressReporter();
      reporter.start('Starting operation');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Starting operation');
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      const reporter = new ProgressReporter();
      reporter.success('Operation successful');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Operation successful');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const reporter = new ProgressReporter();
      reporter.error('Operation failed');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('Operation failed');
    });
  });

  describe('warning', () => {
    it('should log warning message', () => {
      const reporter = new ProgressReporter();
      reporter.warning('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0][0];
      expect(call).toContain('Warning message');
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const reporter = new ProgressReporter();
      reporter.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Info message');
    });
  });

  describe('update', () => {
    it('should not log in non-verbose mode', () => {
      const reporter = new ProgressReporter(false);
      reporter.update('Progress update');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log in verbose mode', () => {
      const reporter = new ProgressReporter(true);
      reporter.update('Progress update');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Progress update');
    });
  });

  describe('summary', () => {
    it('should display generation summary', () => {
      const reporter = new ProgressReporter();
      const stats: GenerationStatistics = {
        endpointsProcessed: 10,
        testsByType: {
          'happy-path': 10,
          'error-case': 20,
          'edge-case': 15,
        },
        filesGenerated: 5,
        generationTime: 2500,
        linesOfCode: 1234,
      };

      reporter.summary(stats);

      expect(consoleLogSpy).toHaveBeenCalled();

      // Check that key information is logged
      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]).join('\n');
      expect(calls).toContain('Generation Summary');
      expect(calls).toContain('10'); // endpoints
      expect(calls).toContain('5'); // files
      expect(calls).toContain('1,234'); // lines of code
    });

    it('should format duration correctly for milliseconds', () => {
      const reporter = new ProgressReporter();
      const stats: GenerationStatistics = {
        endpointsProcessed: 5,
        testsByType: {},
        filesGenerated: 2,
        generationTime: 500, // 500ms
        linesOfCode: 100,
      };

      reporter.summary(stats);

      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]).join('\n');
      expect(calls).toContain('500ms');
    });

    it('should format duration correctly for seconds', () => {
      const reporter = new ProgressReporter();
      const stats: GenerationStatistics = {
        endpointsProcessed: 5,
        testsByType: {},
        filesGenerated: 2,
        generationTime: 2500, // 2.5s
        linesOfCode: 100,
      };

      reporter.summary(stats);

      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]).join('\n');
      expect(calls).toContain('2.50s');
    });
  });

  describe('fileGenerated', () => {
    it('should log file generation success', () => {
      const reporter = new ProgressReporter();
      reporter.fileGenerated('test.spec.ts', 5);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('test.spec.ts');
      expect(call).toContain('5');
    });
  });

  describe('step', () => {
    it('should log step completion without count', () => {
      const reporter = new ProgressReporter();
      reporter.step('Parsing complete');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Parsing complete');
    });

    it('should log step completion with count', () => {
      const reporter = new ProgressReporter();
      reporter.step('Tests generated', 42);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Tests generated');
      expect(call).toContain('42');
    });
  });

  describe('verbose', () => {
    it('should not log in non-verbose mode', () => {
      const reporter = new ProgressReporter(false);
      reporter.verbose('Verbose message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log in verbose mode', () => {
      const reporter = new ProgressReporter(true);
      reporter.verbose('Verbose message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('Verbose message');
    });
  });

  describe('progressBar', () => {
    it('should create progress bar with correct format', () => {
      const reporter = new ProgressReporter();
      const bar = reporter.progressBar(50, 100, 40);

      expect(bar).toContain('[');
      expect(bar).toContain(']');
      expect(bar).toContain('50%');
      expect(bar).toContain('(50/100)');
    });

    it('should handle 0% progress', () => {
      const reporter = new ProgressReporter();
      const bar = reporter.progressBar(0, 100, 40);

      expect(bar).toContain('0%');
      expect(bar).toContain('(0/100)');
    });

    it('should handle 100% progress', () => {
      const reporter = new ProgressReporter();
      const bar = reporter.progressBar(100, 100, 40);

      expect(bar).toContain('100%');
      expect(bar).toContain('(100/100)');
    });
  });

  describe('list', () => {
    it('should display list of items', () => {
      const reporter = new ProgressReporter();
      const items = ['Item 1', 'Item 2', 'Item 3'];

      reporter.list(items);

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]).join('\n');

      items.forEach((item) => {
        expect(calls).toContain(item);
      });
    });

    it('should display list with title', () => {
      const reporter = new ProgressReporter();
      const items = ['Item 1', 'Item 2'];

      reporter.list(items, 'My List');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.map((call: any) => call[0]).join('\n');

      expect(calls).toContain('My List');
      items.forEach((item) => {
        expect(calls).toContain(item);
      });
    });
  });

  describe('spacing', () => {
    it('should add empty line', () => {
      const reporter = new ProgressReporter();
      reporter.spacing();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });
});
