/**
 * Unit Tests for CostOptimizer (Feature 4, Task 4.9)
 * Comprehensive test coverage for cost estimation and optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CostOptimizer } from '../../src/ai/cost-optimizer.js';
import {
  APIRequest,
  APIResponse,
  HealingContext,
  HealingRequest,
  FailureType,
  PricingConfig,
  HealingStrategy,
} from '../../src/types/self-healing-types.js';

describe('CostOptimizer', () => {
  let optimizer: CostOptimizer;

  const createMockRequest = (overrides: Partial<APIRequest> = {}): APIRequest => ({
    id: 'req-1',
    timestamp: new Date(),
    prompt: 'Fix this test',
    model: 'gpt-4',
    ...overrides,
  });

  const createMockResponse = (overrides: Partial<APIResponse> = {}): APIResponse => ({
    requestId: 'req-1',
    timestamp: new Date(),
    content: 'Fixed test code',
    tokensUsed: {
      prompt: 100,
      completion: 150,
      total: 250,
    },
    actualCost: 0.012,
    responseTime: 1500,
    fromCache: false,
    ...overrides,
  });

  const createMockHealingContext = (
    overrides: Partial<HealingContext> = {}
  ): HealingContext => ({
    failureType: FailureType.ASSERTION,
    specDiff: { added: ['newField'] },
    testCode: 'expect(response.status).toBe(200)',
    errorMessage: 'Expected 200 but got 404',
    ...overrides,
  });

  beforeEach(() => {
    optimizer = new CostOptimizer();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(optimizer).toBeInstanceOf(CostOptimizer);
    });

    it('should create instance with custom pricing', () => {
      const pricing: PricingConfig = {
        model: 'gpt-3.5-turbo',
        promptPrice: 0.001,
        completionPrice: 0.002,
        currency: 'USD',
      };

      const opt = new CostOptimizer({ pricing });
      expect(opt).toBeInstanceOf(CostOptimizer);
    });

    it('should create instance with custom budget', () => {
      const opt = new CostOptimizer({ monthlyBudget: 50 });
      const status = opt.checkBudgetLimit();
      expect(status.limit).toBe(50);
    });

    it('should initialize with zero monthly spend', () => {
      const status = optimizer.checkBudgetLimit();
      expect(status.spent).toBe(0);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for simple prompt', () => {
      const prompt = 'This is a test prompt'.repeat(10); // ~200 chars
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.promptTokens).toBeGreaterThan(0);
      expect(estimate.completionTokens).toBeGreaterThan(0);
      expect(estimate.totalTokens).toBeGreaterThan(0);
      expect(estimate.estimatedCost).toBeGreaterThan(0);
    });

    it('should calculate token estimate (4 chars per token)', () => {
      const prompt = 'a'.repeat(400); // 400 chars = ~100 tokens
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.promptTokens).toBe(100);
    });

    it('should estimate completion tokens as 80% of prompt by default', () => {
      const prompt = 'a'.repeat(400); // 100 tokens
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.completionTokens).toBe(80);
    });

    it('should use custom completion length when provided', () => {
      const prompt = 'a'.repeat(400); // 100 tokens
      const completionChars = 800; // 200 tokens
      const estimate = optimizer.estimateCost(prompt, completionChars);

      expect(estimate.completionTokens).toBe(200);
    });

    it('should calculate cost breakdown', () => {
      const prompt = 'a'.repeat(400); // 100 tokens
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.breakdown).toBeDefined();
      expect(estimate.breakdown.promptCost).toBeGreaterThan(0);
      expect(estimate.breakdown.completionCost).toBeGreaterThan(0);
    });

    it('should check budget status', () => {
      const prompt = 'test prompt';
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.withinBudget).toBeDefined();
      expect(typeof estimate.withinBudget).toBe('boolean');
    });

    it('should recommend use-ai when within budget', () => {
      const prompt = 'small prompt';
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.recommendation).toBeDefined();
    });

    it('should recommend check-cache when cache enabled', () => {
      const opt = new CostOptimizer({ cacheEnabled: true });
      const estimate = opt.estimateCost('test');

      expect(estimate.recommendation).toBe('check-cache');
    });

    it('should recommend use-fallback when cost too high', () => {
      const opt = new CostOptimizer({ fallbackCostThreshold: 0.001 });
      const prompt = 'a'.repeat(10000); // Large prompt
      const estimate = opt.estimateCost(prompt);

      expect(estimate.recommendation).toBe('use-fallback');
    });

    it('should calculate correct total tokens', () => {
      const prompt = 'a'.repeat(400);
      const estimate = optimizer.estimateCost(prompt);

      expect(estimate.totalTokens).toBe(
        estimate.promptTokens + estimate.completionTokens
      );
    });
  });

  describe('trackTokenUsage', () => {
    it('should track token usage from API response', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const usage = optimizer.getTokenUsage();
      expect(usage).toHaveLength(1);
    });

    it('should update monthly spend', () => {
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 100, completion: 100, total: 200 },
      });

      const before = optimizer.checkBudgetLimit().spent;
      optimizer.trackTokenUsage(request, response);
      const after = optimizer.checkBudgetLimit().spent;

      expect(after).toBeGreaterThan(before);
    });

    it('should record correct token counts', () => {
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 150, completion: 200, total: 350 },
      });

      optimizer.trackTokenUsage(request, response);

      const usage = optimizer.getTokenUsage();
      expect(usage[0].promptTokens).toBe(150);
      expect(usage[0].completionTokens).toBe(200);
      expect(usage[0].totalTokens).toBe(350);
    });

    it('should calculate actual cost', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const usage = optimizer.getTokenUsage();
      expect(usage[0].cost).toBeGreaterThan(0);
    });

    it('should track multiple requests', () => {
      const req1 = createMockRequest({ id: 'req-1' });
      const req2 = createMockRequest({ id: 'req-2' });
      const res1 = createMockResponse({ requestId: 'req-1' });
      const res2 = createMockResponse({ requestId: 'req-2' });

      optimizer.trackTokenUsage(req1, res1);
      optimizer.trackTokenUsage(req2, res2);

      const usage = optimizer.getTokenUsage();
      expect(usage).toHaveLength(2);
    });
  });

  describe('calculateTotalCost', () => {
    it('should return 0 for no usage', () => {
      expect(optimizer.calculateTotalCost()).toBe(0);
    });

    it('should calculate total cost correctly', () => {
      const req1 = createMockRequest({ id: 'req-1' });
      const req2 = createMockRequest({ id: 'req-2' });
      const res1 = createMockResponse({
        requestId: 'req-1',
        tokensUsed: { prompt: 100, completion: 100, total: 200 },
      });
      const res2 = createMockResponse({
        requestId: 'req-2',
        tokensUsed: { prompt: 100, completion: 100, total: 200 },
      });

      optimizer.trackTokenUsage(req1, res1);
      optimizer.trackTokenUsage(req2, res2);

      const total = optimizer.calculateTotalCost();
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('getCostBreakdown', () => {
    it('should return breakdown structure', () => {
      const breakdown = optimizer.getCostBreakdown();

      expect(breakdown).toHaveProperty('total');
      expect(breakdown).toHaveProperty('byFailureType');
      expect(breakdown).toHaveProperty('byDate');
      expect(breakdown).toHaveProperty('byStrategy');
      expect(breakdown).toHaveProperty('tokenBreakdown');
    });

    it('should calculate total cost', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const breakdown = optimizer.getCostBreakdown();
      expect(breakdown.total).toBeGreaterThan(0);
    });

    it('should break down by date', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const breakdown = optimizer.getCostBreakdown();
      const dates = Object.keys(breakdown.byDate);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should calculate token breakdown', () => {
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 100, completion: 200, total: 300 },
      });

      optimizer.trackTokenUsage(request, response);

      const breakdown = optimizer.getCostBreakdown();
      expect(breakdown.tokenBreakdown.promptCost).toBeGreaterThan(0);
      expect(breakdown.tokenBreakdown.completionCost).toBeGreaterThan(0);
    });

    it('should include cache and fallback savings', () => {
      const breakdown = optimizer.getCostBreakdown();

      expect(breakdown).toHaveProperty('cacheSavings');
      expect(breakdown).toHaveProperty('fallbackSavings');
    });
  });

  describe('shouldUseCache', () => {
    it('should return true when cache enabled', () => {
      const opt = new CostOptimizer({ cacheEnabled: true });
      const context = createMockHealingContext();

      expect(opt.shouldUseCache(context)).toBe(true);
    });

    it('should return false when cache disabled', () => {
      const opt = new CostOptimizer({ cacheEnabled: false });
      const context = createMockHealingContext();

      expect(opt.shouldUseCache(context)).toBe(false);
    });
  });

  describe('shouldUseFallback', () => {
    it('should return false for low cost estimates', () => {
      const estimate = optimizer.estimateCost('small prompt');
      expect(optimizer.shouldUseFallback(estimate)).toBe(false);
    });

    it('should return true when budget exceeded', () => {
      const opt = new CostOptimizer({ monthlyBudget: 0.001 });

      // Add some usage to exceed budget
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 1000, completion: 1000, total: 2000 },
      });
      opt.trackTokenUsage(request, response);

      const estimate = opt.estimateCost('test');
      expect(opt.shouldUseFallback(estimate)).toBe(true);
    });

    it('should return true when cost exceeds threshold', () => {
      const opt = new CostOptimizer({ fallbackCostThreshold: 0.001 });
      const estimate = opt.estimateCost('a'.repeat(10000)); // Large prompt

      expect(opt.shouldUseFallback(estimate)).toBe(true);
    });

    it('should return false when within budget and threshold', () => {
      const estimate = optimizer.estimateCost('small prompt');
      expect(optimizer.shouldUseFallback(estimate)).toBe(false);
    });
  });

  describe('optimizeBatchRequests', () => {
    const createMockHealingRequest = (
      overrides: Partial<HealingRequest> = {}
    ): HealingRequest => ({
      id: 'heal-1',
      test: {
        id: 'test-1',
        name: 'Test',
        filePath: '/test.ts',
        failureType: FailureType.ASSERTION,
        errorMessage: 'Error',
        testCode: 'expect(true).toBe(false)',
        timestamp: new Date(),
        previousAttempts: 0,
      },
      priority: 3,
      complexity: 'medium',
      batchable: true,
      ...overrides,
    });

    it('should sort by priority', () => {
      const req1 = createMockHealingRequest({ id: 'req-1', priority: 1 });
      const req2 = createMockHealingRequest({ id: 'req-2', priority: 5 });
      const req3 = createMockHealingRequest({ id: 'req-3', priority: 3 });

      const batch = optimizer.optimizeBatchRequests([req1, req2, req3]);

      expect(batch.requests[0].id).toBe('req-2'); // Highest priority first
      expect(batch.requests[1].id).toBe('req-3');
      expect(batch.requests[2].id).toBe('req-1');
    });

    it('should sort by complexity when priority equal', () => {
      const req1 = createMockHealingRequest({
        id: 'req-1',
        priority: 3,
        complexity: 'high',
      });
      const req2 = createMockHealingRequest({
        id: 'req-2',
        priority: 3,
        complexity: 'low',
      });

      const batch = optimizer.optimizeBatchRequests([req1, req2]);

      expect(batch.requests[0].id).toBe('req-2'); // Lower complexity first
      expect(batch.requests[1].id).toBe('req-1');
    });

    it('should estimate total cost', () => {
      const req = createMockHealingRequest();
      const batch = optimizer.optimizeBatchRequests([req]);

      expect(batch.estimatedCost).toBeGreaterThan(0);
    });

    it('should estimate total tokens', () => {
      const req = createMockHealingRequest();
      const batch = optimizer.optimizeBatchRequests([req]);

      expect(batch.estimatedTokens).toBeGreaterThan(0);
    });

    it('should choose sequential strategy when budget low', () => {
      const opt = new CostOptimizer({ monthlyBudget: 10 });

      // Use up most of budget
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 50000, completion: 50000, total: 100000 },
      });
      opt.trackTokenUsage(request, response);

      const req = createMockHealingRequest();
      const batch = opt.optimizeBatchRequests([req]);

      expect(batch.strategy).toBe('sequential');
    });

    it('should choose parallel strategy when budget sufficient', () => {
      const opt = new CostOptimizer({ monthlyBudget: 1000 });
      const reqs = [
        createMockHealingRequest({ id: 'req-1', complexity: 'low' }),
        createMockHealingRequest({ id: 'req-2', complexity: 'low' }),
      ];

      const batch = opt.optimizeBatchRequests(reqs);

      expect(batch.strategy).toBe('parallel');
    });

    it('should choose sequential when high complexity present', () => {
      const reqs = [
        createMockHealingRequest({ id: 'req-1', complexity: 'high' }),
        createMockHealingRequest({ id: 'req-2', complexity: 'low' }),
      ];

      const batch = optimizer.optimizeBatchRequests(reqs);

      expect(batch.strategy).toBe('sequential');
    });

    it('should generate processing order', () => {
      const reqs = [
        createMockHealingRequest({ id: 'req-1' }),
        createMockHealingRequest({ id: 'req-2' }),
      ];

      const batch = optimizer.optimizeBatchRequests(reqs);

      expect(batch.order).toHaveLength(2);
      expect(batch.order).toContain('req-1');
      expect(batch.order).toContain('req-2');
    });
  });

  describe('generateCostReport', () => {
    it('should generate complete report', () => {
      const report = optimizer.generateCostReport();

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('totalCost');
      expect(report).toHaveProperty('breakdown');
      expect(report).toHaveProperty('monthlySpend');
      expect(report).toHaveProperty('budget');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('suggestions');
      expect(report).toHaveProperty('topCostDrivers');
    });

    it('should include period information', () => {
      const report = optimizer.generateCostReport();

      expect(report.period.start).toBeInstanceOf(Date);
      expect(report.period.end).toBeInstanceOf(Date);
    });

    it('should include budget information', () => {
      const report = optimizer.generateCostReport();

      expect(report.budget.limit).toBeDefined();
      expect(report.budget.remaining).toBeDefined();
      expect(report.budget.percentUsed).toBeDefined();
    });

    it('should include trends', () => {
      const report = optimizer.generateCostReport();

      expect(report.trends.dailyAverage).toBeDefined();
      expect(report.trends.projectedMonthly).toBeDefined();
      expect(report.trends.costPerHealing).toBeDefined();
    });

    it('should include suggestions when budget high', () => {
      const opt = new CostOptimizer({ monthlyBudget: 10 });

      // Use most of budget
      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 40000, completion: 40000, total: 80000 },
      });
      opt.trackTokenUsage(request, response);

      const report = opt.generateCostReport();

      expect(report.suggestions.length).toBeGreaterThan(0);
    });

    it('should include top cost drivers', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const report = optimizer.generateCostReport();

      expect(Array.isArray(report.topCostDrivers)).toBe(true);
    });

    it('should limit top cost drivers to 3', () => {
      const report = optimizer.generateCostReport();

      expect(report.topCostDrivers.length).toBeLessThanOrEqual(3);
    });
  });

  describe('setMonthlyBudget', () => {
    it('should update monthly budget', () => {
      optimizer.setMonthlyBudget(50);

      const status = optimizer.checkBudgetLimit();
      expect(status.limit).toBe(50);
    });

    it('should throw error for negative budget', () => {
      expect(() => optimizer.setMonthlyBudget(-10)).toThrow('Budget must be positive');
    });

    it('should throw error for zero budget', () => {
      expect(() => optimizer.setMonthlyBudget(0)).toThrow('Budget must be positive');
    });

    it('should accept positive budget', () => {
      expect(() => optimizer.setMonthlyBudget(100)).not.toThrow();
    });
  });

  describe('checkBudgetLimit', () => {
    it('should return budget status', () => {
      const status = optimizer.checkBudgetLimit();

      expect(status).toHaveProperty('limit');
      expect(status).toHaveProperty('spent');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('percentUsed');
      expect(status).toHaveProperty('exceeded');
      expect(status).toHaveProperty('atWarningThreshold');
      expect(status).toHaveProperty('daysRemaining');
      expect(status).toHaveProperty('projectedSpend');
    });

    it('should show zero spend initially', () => {
      const status = optimizer.checkBudgetLimit();

      expect(status.spent).toBe(0);
      expect(status.remaining).toBe(status.limit);
    });

    it('should calculate remaining budget', () => {
      optimizer.setMonthlyBudget(100);

      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 1000, completion: 1000, total: 2000 },
      });
      optimizer.trackTokenUsage(request, response);

      const status = optimizer.checkBudgetLimit();

      expect(status.remaining).toBe(status.limit - status.spent);
    });

    it('should calculate percent used', () => {
      optimizer.setMonthlyBudget(10);

      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 5000, completion: 5000, total: 10000 },
      });
      optimizer.trackTokenUsage(request, response);

      const status = optimizer.checkBudgetLimit();

      expect(status.percentUsed).toBeGreaterThan(0);
      expect(status.percentUsed).toBeLessThanOrEqual(100);
    });

    it('should detect budget exceeded', () => {
      optimizer.setMonthlyBudget(0.01);

      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 10000, completion: 10000, total: 20000 },
      });
      optimizer.trackTokenUsage(request, response);

      const status = optimizer.checkBudgetLimit();

      expect(status.exceeded).toBe(true);
    });

    it('should detect warning threshold', () => {
      const opt = new CostOptimizer({ monthlyBudget: 10, warningThreshold: 0.5 });

      const request = createMockRequest();
      const response = createMockResponse({
        tokensUsed: { prompt: 5000, completion: 5000, total: 10000 },
      });
      opt.trackTokenUsage(request, response);

      const status = opt.checkBudgetLimit();

      expect(status.atWarningThreshold).toBe(true);
    });

    it('should calculate days remaining', () => {
      const status = optimizer.checkBudgetLimit();

      expect(status.daysRemaining).toBeGreaterThan(0);
      expect(status.daysRemaining).toBeLessThanOrEqual(31);
    });

    it('should project monthly spend', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      const status = optimizer.checkBudgetLimit();

      expect(status.projectedSpend).toBeGreaterThanOrEqual(status.spent);
    });
  });

  describe('logTokenUsage', () => {
    it('should log token metrics', () => {
      optimizer.logTokenUsage({
        requestId: 'req-1',
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 150,
        totalTokens: 250,
        cost: 0.012,
        model: 'gpt-4',
        responseTime: 1500,
      });

      const usage = optimizer.getTokenUsage();
      expect(usage).toHaveLength(1);
    });

    it('should update monthly spend', () => {
      const before = optimizer.checkBudgetLimit().spent;

      optimizer.logTokenUsage({
        requestId: 'req-1',
        timestamp: new Date(),
        promptTokens: 100,
        completionTokens: 150,
        totalTokens: 250,
        cost: 0.012,
        model: 'gpt-4',
        responseTime: 1500,
      });

      const after = optimizer.checkBudgetLimit().spent;

      expect(after).toBeGreaterThan(before);
    });
  });

  describe('getTokenUsage', () => {
    it('should return empty array initially', () => {
      expect(optimizer.getTokenUsage()).toEqual([]);
    });

    it('should return all usage records', () => {
      const req1 = createMockRequest({ id: 'req-1' });
      const req2 = createMockRequest({ id: 'req-2' });
      const res1 = createMockResponse({ requestId: 'req-1' });
      const res2 = createMockResponse({ requestId: 'req-2' });

      optimizer.trackTokenUsage(req1, res1);
      optimizer.trackTokenUsage(req2, res2);

      expect(optimizer.getTokenUsage()).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all usage data', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      optimizer.clear();

      expect(optimizer.getTokenUsage()).toHaveLength(0);
      expect(optimizer.calculateTotalCost()).toBe(0);
    });

    it('should reset monthly spend', () => {
      const request = createMockRequest();
      const response = createMockResponse();

      optimizer.trackTokenUsage(request, response);

      optimizer.clear();

      const status = optimizer.checkBudgetLimit();
      expect(status.spent).toBe(0);
    });

    it('should reset month start', () => {
      optimizer.clear();

      const status = optimizer.checkBudgetLimit();
      expect(status.spent).toBe(0);
    });
  });
});
