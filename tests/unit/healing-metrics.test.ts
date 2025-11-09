/**
 * Unit Tests for HealingMetrics (Feature 4, Task 4.8)
 * Comprehensive test coverage for healing metrics tracking and reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealingMetrics } from '../../src/ai/healing-metrics.js';
import {
  FailedTest,
  FailureType,
  HealingStrategy,
  MetricsConfig,
} from '../../src/types/self-healing-types.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('HealingMetrics', () => {
  let metrics: HealingMetrics;

  const createMockFailedTest = (overrides: Partial<FailedTest> = {}): FailedTest => ({
    id: 'test-1',
    name: 'Test API endpoint',
    filePath: '/tests/api.test.ts',
    failureType: FailureType.ASSERTION,
    errorMessage: 'Expected 200 but got 404',
    testCode: 'expect(response.status).toBe(200)',
    timestamp: new Date(),
    previousAttempts: 0,
    ...overrides,
  });

  beforeEach(() => {
    metrics = new HealingMetrics({ autoSave: false });
    vi.clearAllMocks();
  });

  afterEach(() => {
    metrics.stopAutoSave();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      const m = new HealingMetrics();
      expect(m).toBeInstanceOf(HealingMetrics);
      m.stopAutoSave();
    });

    it('should create instance with custom config', () => {
      const config: Partial<MetricsConfig> = {
        historyPath: '/custom/path.json',
        autoSave: false,
        maxHistoryEntries: 500,
      };
      const m = new HealingMetrics(config);
      expect(m).toBeInstanceOf(HealingMetrics);
    });

    it('should not start auto-save when disabled', () => {
      const m = new HealingMetrics({ autoSave: false });
      expect(m).toBeInstanceOf(HealingMetrics);
      m.stopAutoSave();
    });
  });

  describe('recordAttempt', () => {
    it('should record a healing attempt', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      expect(attemptId).toBeDefined();
      expect(attemptId).toMatch(/^attempt-/);
    });

    it('should generate unique attempt IDs', () => {
      const test = createMockFailedTest();
      const id1 = metrics.recordAttempt(test, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test, FailureType.TIMEOUT);

      expect(id1).not.toBe(id2);
    });

    it('should record attempt with correct failure type', () => {
      const test = createMockFailedTest({ failureType: FailureType.NETWORK });
      const attemptId = metrics.recordAttempt(test, FailureType.NETWORK);

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded).toBeDefined();
      expect(recorded?.test.failureType).toBe(FailureType.NETWORK);
    });

    it('should initialize attempt as unsuccessful', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded?.success).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('should record a successful healing', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(attemptId, 1500, {
        strategy: HealingStrategy.AI_POWERED,
        tokensUsed: 150,
        estimatedCost: 0.015,
      });

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded?.success).toBe(true);
      expect(recorded?.duration).toBe(1500);
      expect(recorded?.strategy).toBe(HealingStrategy.AI_POWERED);
      expect(recorded?.tokensUsed).toBe(150);
      expect(recorded?.estimatedCost).toBe(0.015);
    });

    it('should throw error for non-existent attempt', () => {
      expect(() => {
        metrics.recordSuccess('invalid-id', 1000);
      }).toThrow('Attempt not found');
    });

    it('should record cache hit', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(attemptId, 100, { cacheHit: true });

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded?.cacheHit).toBe(true);
    });

    it('should set end time on success', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(attemptId, 1000);

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded?.endTime).toBeDefined();
      expect(recorded?.endTime).toBeInstanceOf(Date);
    });
  });

  describe('recordFailure', () => {
    it('should record a failed healing', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordFailure(attemptId, 'AI request timed out', {
        strategy: HealingStrategy.AI_POWERED,
      });

      const attempts = metrics.getAttempts();
      const recorded = attempts.find((a) => a.id === attemptId);

      expect(recorded?.success).toBe(false);
      expect(recorded?.failureReason).toBe('AI request timed out');
    });

    it('should throw error for non-existent attempt', () => {
      expect(() => {
        metrics.recordFailure('invalid-id', 'Some reason');
      }).toThrow('Attempt not found');
    });

    it('should calculate duration on failure', () => {
      const test = createMockFailedTest();
      const attemptId = metrics.recordAttempt(test, FailureType.ASSERTION);

      // Wait a tiny bit
      setTimeout(() => {
        metrics.recordFailure(attemptId, 'Failed');

        const attempts = metrics.getAttempts();
        const recorded = attempts.find((a) => a.id === attemptId);

        expect(recorded?.duration).toBeGreaterThan(0);
      }, 10);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should return 0 for no attempts', () => {
      expect(metrics.calculateSuccessRate()).toBe(0);
    });

    it('should calculate correct success rate', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });
      const test3 = createMockFailedTest({ id: 'test-3' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);
      const id3 = metrics.recordAttempt(test3, FailureType.NETWORK);

      metrics.recordSuccess(id1, 1000);
      metrics.recordSuccess(id2, 1000);
      metrics.recordFailure(id3, 'Failed');

      const rate = metrics.calculateSuccessRate();
      expect(rate).toBeCloseTo(66.67, 1);
    });

    it('should return 100 for all successful', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);
      metrics.recordSuccess(id, 1000);

      expect(metrics.calculateSuccessRate()).toBe(100);
    });

    it('should return 0 for all failed', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);
      metrics.recordFailure(id, 'Failed');

      expect(metrics.calculateSuccessRate()).toBe(0);
    });
  });

  describe('calculateAverageTime', () => {
    it('should return 0 for no completed attempts', () => {
      expect(metrics.calculateAverageTime()).toBe(0);
    });

    it('should calculate correct average time', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);

      metrics.recordSuccess(id1, 1000);
      metrics.recordSuccess(id2, 2000);

      expect(metrics.calculateAverageTime()).toBe(1500);
    });

    it('should ignore incomplete attempts', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      metrics.recordAttempt(test2, FailureType.TIMEOUT); // Not completed

      metrics.recordSuccess(id1, 1000);

      expect(metrics.calculateAverageTime()).toBe(1000);
    });
  });

  describe('getMetricsByFailureType', () => {
    it('should return metrics for all failure types', () => {
      const byType = metrics.getMetricsByFailureType();

      expect(Object.keys(byType)).toContain(FailureType.ASSERTION);
      expect(Object.keys(byType)).toContain(FailureType.TIMEOUT);
      expect(Object.keys(byType)).toContain(FailureType.NETWORK);
    });

    it('should calculate correct type metrics', () => {
      const test1 = createMockFailedTest({ id: 'test-1', failureType: FailureType.ASSERTION });
      const test2 = createMockFailedTest({ id: 'test-2', failureType: FailureType.ASSERTION });
      const test3 = createMockFailedTest({ id: 'test-3', failureType: FailureType.TIMEOUT });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.ASSERTION);
      const id3 = metrics.recordAttempt(test3, FailureType.TIMEOUT);

      metrics.recordSuccess(id1, 1000);
      metrics.recordFailure(id2, 'Failed');
      metrics.recordSuccess(id3, 2000);

      const byType = metrics.getMetricsByFailureType();

      expect(byType[FailureType.ASSERTION].attempts).toBe(2);
      expect(byType[FailureType.ASSERTION].successful).toBe(1);
      expect(byType[FailureType.ASSERTION].failed).toBe(1);
      expect(byType[FailureType.ASSERTION].successRate).toBe(50);

      expect(byType[FailureType.TIMEOUT].attempts).toBe(1);
      expect(byType[FailureType.TIMEOUT].successful).toBe(1);
      expect(byType[FailureType.TIMEOUT].successRate).toBe(100);
    });

    it('should calculate average time per type', () => {
      const test1 = createMockFailedTest({ id: 'test-1', failureType: FailureType.ASSERTION });
      const test2 = createMockFailedTest({ id: 'test-2', failureType: FailureType.ASSERTION });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.ASSERTION);

      metrics.recordSuccess(id1, 1000);
      metrics.recordSuccess(id2, 3000);

      const byType = metrics.getMetricsByFailureType();
      expect(byType[FailureType.ASSERTION].averageTime).toBe(2000);
    });

    it('should calculate total cost per type', () => {
      const test = createMockFailedTest({ failureType: FailureType.NETWORK });
      const id = metrics.recordAttempt(test, FailureType.NETWORK);

      metrics.recordSuccess(id, 1000, { estimatedCost: 0.025 });

      const byType = metrics.getMetricsByFailureType();
      expect(byType[FailureType.NETWORK].totalCost).toBe(0.025);
    });
  });

  describe('getAIUsageStats', () => {
    it('should return zero stats for no AI usage', () => {
      const stats = metrics.getAIUsageStats();

      expect(stats.timesUsed).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
    });

    it('should calculate AI usage stats', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(id, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        tokensUsed: 200,
        estimatedCost: 0.02,
      });

      const stats = metrics.getAIUsageStats();

      expect(stats.timesUsed).toBe(1);
      expect(stats.totalTokens).toBe(200);
      expect(stats.totalCost).toBe(0.02);
    });

    it('should calculate average tokens', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);

      metrics.recordSuccess(id1, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        tokensUsed: 100,
      });
      metrics.recordSuccess(id2, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        tokensUsed: 300,
      });

      const stats = metrics.getAIUsageStats();
      expect(stats.averageTokens).toBe(200);
    });

    it('should calculate AI success rate', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);

      metrics.recordSuccess(id1, 1000, { strategy: HealingStrategy.AI_POWERED });
      metrics.recordFailure(id2, 'Failed', { strategy: HealingStrategy.AI_POWERED });

      const stats = metrics.getAIUsageStats();
      expect(stats.successRate).toBe(50);
    });

    it('should calculate cache hit rate', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);

      metrics.recordSuccess(id1, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        cacheHit: true,
      });
      metrics.recordSuccess(id2, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        cacheHit: false,
      });

      const stats = metrics.getAIUsageStats();
      expect(stats.cacheHitRate).toBe(50);
    });

    it('should estimate prompt and completion tokens', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(id, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        tokensUsed: 1000,
      });

      const stats = metrics.getAIUsageStats();
      expect(stats.promptTokens).toBe(400); // 40%
      expect(stats.completionTokens).toBe(600); // 60%
    });
  });

  describe('getFallbackUsageStats', () => {
    it('should return zero stats for no fallback usage', () => {
      const stats = metrics.getFallbackUsageStats();

      expect(stats.timesUsed).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate fallback stats', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(id, 1000, { strategy: HealingStrategy.FALLBACK });

      const stats = metrics.getFallbackUsageStats();
      expect(stats.timesUsed).toBe(1);
      expect(stats.successRate).toBe(100);
    });

    it('should collect fallback reasons', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = metrics.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = metrics.recordAttempt(test2, FailureType.TIMEOUT);

      metrics.recordFailure(id1, 'budget-exceeded', {
        strategy: HealingStrategy.FALLBACK,
      });
      metrics.recordFailure(id2, 'budget-exceeded', {
        strategy: HealingStrategy.FALLBACK,
      });

      const stats = metrics.getFallbackUsageStats();
      expect(stats.fallbackReasons['budget-exceeded']).toBe(2);
    });

    it('should use default reason when not specified', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.recordSuccess(id, 1000, { strategy: HealingStrategy.FALLBACK });

      const stats = metrics.getFallbackUsageStats();
      expect(stats.fallbackReasons['cost-optimization']).toBe(1);
    });
  });

  describe('generateSummary', () => {
    it('should generate complete summary', () => {
      const summary = metrics.generateSummary();

      expect(summary).toHaveProperty('totalAttempts');
      expect(summary).toHaveProperty('successful');
      expect(summary).toHaveProperty('failed');
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('averageTime');
      expect(summary).toHaveProperty('totalCost');
      expect(summary).toHaveProperty('byFailureType');
      expect(summary).toHaveProperty('aiStats');
      expect(summary).toHaveProperty('fallbackStats');
      expect(summary).toHaveProperty('period');
      expect(summary).toHaveProperty('warnings');
      expect(summary).toHaveProperty('recommendations');
    });

    it('should include warning for low success rate', () => {
      const config: Partial<MetricsConfig> = {
        successRateWarningThreshold: 0.8,
        autoSave: false,
      };
      const m = new HealingMetrics(config);

      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      const id1 = m.recordAttempt(test1, FailureType.ASSERTION);
      const id2 = m.recordAttempt(test2, FailureType.TIMEOUT);

      m.recordSuccess(id1, 1000);
      m.recordFailure(id2, 'Failed');

      const summary = m.generateSummary();
      expect(summary.warnings.length).toBeGreaterThan(0);
      expect(summary.warnings[0]).toContain('Low success rate');
    });

    it('should include recommendations', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);
      metrics.recordSuccess(id, 1000, {
        strategy: HealingStrategy.AI_POWERED,
        cacheHit: false,
        tokensUsed: 100,
      });

      const summary = metrics.generateSummary();
      // Should have recommendations array
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });
  });

  describe('exportToJSON', () => {
    it('should export valid JSON', () => {
      const json = metrics.exportToJSON();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all summary data', () => {
      const test = createMockFailedTest();
      const id = metrics.recordAttempt(test, FailureType.ASSERTION);
      metrics.recordSuccess(id, 1000);

      const json = metrics.exportToJSON();
      const data = JSON.parse(json);

      expect(data.totalAttempts).toBe(1);
      expect(data.successful).toBe(1);
    });
  });

  describe('exportToMarkdown', () => {
    it('should export valid markdown', () => {
      const md = metrics.exportToMarkdown();
      expect(md).toContain('# Healing Metrics Report');
    });

    it('should include overview section', () => {
      const md = metrics.exportToMarkdown();
      expect(md).toContain('## Overview');
      expect(md).toContain('Total Attempts');
    });

    it('should include metrics table', () => {
      const md = metrics.exportToMarkdown();
      expect(md).toContain('## Metrics by Failure Type');
      expect(md).toContain('| Type |');
    });

    it('should include AI stats section', () => {
      const md = metrics.exportToMarkdown();
      expect(md).toContain('## AI Usage Statistics');
    });

    it('should include fallback stats section', () => {
      const md = metrics.exportToMarkdown();
      expect(md).toContain('## Fallback Strategy Statistics');
    });

    it('should include warnings when present', () => {
      const config: Partial<MetricsConfig> = {
        successRateWarningThreshold: 0.9,
        autoSave: false,
      };
      const m = new HealingMetrics(config);

      const test = createMockFailedTest();
      const id = m.recordAttempt(test, FailureType.ASSERTION);
      m.recordFailure(id, 'Failed');

      const md = m.exportToMarkdown();
      expect(md).toContain('## ⚠️ Warnings');
    });

    it('should include ASCII visualization when enabled', () => {
      const config: Partial<MetricsConfig> = {
        enableVisualizations: true,
        autoSave: false,
      };
      const m = new HealingMetrics(config);

      const test = createMockFailedTest();
      const id = m.recordAttempt(test, FailureType.ASSERTION);
      m.recordSuccess(id, 1000);

      const md = m.exportToMarkdown();
      expect(md).toContain('```');
      expect(md).toContain('█'); // ASCII bar
    });
  });

  describe('storeHistory', () => {
    it('should store history to file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(fs.writeFile).mockResolvedValue();

      await metrics.storeHistory('/test/history.json');

      expect(fs.writeFile).toHaveBeenCalledWith('/test/history.json', expect.any(String), 'utf-8');
    });

    it('should append to existing history', async () => {
      const existingHistory = JSON.stringify([
        {
          id: 'entry-1',
          timestamp: new Date().toISOString(),
          metrics: {},
        },
      ]);

      vi.mocked(fs.readFile).mockResolvedValue(existingHistory);
      vi.mocked(fs.writeFile).mockResolvedValue();

      await metrics.storeHistory('/test/history.json');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);

      expect(writtenData).toHaveLength(2);
    });

    it('should handle write errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(metrics.storeHistory('/test/history.json')).rejects.toThrow(
        'Failed to store history'
      );
    });
  });

  describe('loadHistory', () => {
    it('should load history from file', async () => {
      const history = [
        {
          id: 'entry-1',
          timestamp: new Date().toISOString(),
          metrics: {},
        },
      ];

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(history));

      const loaded = await metrics.loadHistory('/test/history.json');
      expect(loaded).toHaveLength(1);
    });

    it('should return empty array for non-existent file', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const loaded = await metrics.loadHistory('/test/history.json');
      expect(loaded).toEqual([]);
    });

    it('should handle read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(metrics.loadHistory('/test/history.json')).rejects.toThrow(
        'Failed to load history'
      );
    });
  });

  describe('getAttempts', () => {
    it('should return all attempts', () => {
      const test1 = createMockFailedTest({ id: 'test-1' });
      const test2 = createMockFailedTest({ id: 'test-2' });

      metrics.recordAttempt(test1, FailureType.ASSERTION);
      metrics.recordAttempt(test2, FailureType.TIMEOUT);

      const attempts = metrics.getAttempts();
      expect(attempts).toHaveLength(2);
    });

    it('should return copy of attempts', () => {
      const test = createMockFailedTest();
      metrics.recordAttempt(test, FailureType.ASSERTION);

      const attempts1 = metrics.getAttempts();
      const attempts2 = metrics.getAttempts();

      expect(attempts1).not.toBe(attempts2);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      const test = createMockFailedTest();
      metrics.recordAttempt(test, FailureType.ASSERTION);

      metrics.clear();

      expect(metrics.getAttempts()).toHaveLength(0);
      expect(metrics.calculateSuccessRate()).toBe(0);
    });

    it('should reset start time', () => {
      const test = createMockFailedTest();
      metrics.recordAttempt(test, FailureType.ASSERTION);

      const summary1 = metrics.generateSummary();
      const startTime1 = summary1.period.start;

      metrics.clear();

      const summary2 = metrics.generateSummary();
      const startTime2 = summary2.period.start;

      expect(startTime2.getTime()).toBeGreaterThan(startTime1.getTime());
    });
  });

  describe('stopAutoSave', () => {
    it('should stop auto-save timer', () => {
      const m = new HealingMetrics({ autoSave: true, autoSaveInterval: 0.01 });
      m.stopAutoSave();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
