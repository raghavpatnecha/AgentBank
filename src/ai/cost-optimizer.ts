/**
 * Cost Optimizer (Feature 4, Task 4.9)
 * Optimizes OpenAI API usage through intelligent cost estimation and budget management
 */

import {
  CostEstimate,
  APIRequest,
  APIResponse,
  CostBreakdown,
  HealingContext,
  CostReport,
  BudgetStatus,
  TokenMetrics,
  HealingRequest,
  OptimizedBatch,
  PricingConfig,
  FailureType,
  HealingStrategy,
} from '../types/self-healing-types.js';

/**
 * Default OpenAI GPT-4 pricing (as of 2024)
 */
const DEFAULT_PRICING: PricingConfig = {
  model: 'gpt-4',
  promptPrice: 0.03, // $0.03 per 1K tokens
  completionPrice: 0.06, // $0.06 per 1K tokens
  currency: 'USD',
};

/**
 * Cost optimizer configuration
 */
interface OptimizerConfig {
  pricing: PricingConfig;
  monthlyBudget: number;
  warningThreshold: number; // 0-1
  blockThreshold: number; // 0-1
  fallbackCostThreshold: number; // USD
  cacheEnabled: boolean;
}

/**
 * Default optimizer configuration
 */
const DEFAULT_CONFIG: OptimizerConfig = {
  pricing: DEFAULT_PRICING,
  monthlyBudget: 100, // $100/month
  warningThreshold: 0.8, // 80%
  blockThreshold: 1.0, // 100%
  fallbackCostThreshold: 0.1, // Use fallback if estimated cost > $0.10
  cacheEnabled: true,
};

/**
 * Token usage record
 */
interface TokenUsageRecord {
  requestId: string;
  timestamp: Date;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  failureType?: FailureType;
  strategy: HealingStrategy;
}

/**
 * Cost Optimizer
 * Estimates costs, tracks token usage, enforces budgets, and optimizes batch requests
 */
export class CostOptimizer {
  private config: OptimizerConfig;
  private tokenUsage: TokenUsageRecord[] = [];
  private monthlySpend: number = 0;

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Estimate cost for a prompt
   */
  estimateCost(prompt: string, estimatedCompletionLength?: number): CostEstimate {
    // Estimate tokens: ~4 characters per token
    const promptTokens = Math.ceil(prompt.length / 4);

    // Estimate completion tokens (default to prompt length if not specified)
    const completionTokens = estimatedCompletionLength
      ? Math.ceil(estimatedCompletionLength / 4)
      : Math.ceil(promptTokens * 0.8); // Assume completion is 80% of prompt

    const totalTokens = promptTokens + completionTokens;

    // Calculate costs
    const promptCost = (promptTokens / 1000) * this.config.pricing.promptPrice;
    const completionCost = (completionTokens / 1000) * this.config.pricing.completionPrice;
    const estimatedCost = promptCost + completionCost;

    // Check budget
    const budgetStatus = this.checkBudgetLimit();
    const withinBudget = budgetStatus.remaining >= estimatedCost;

    // Determine recommendation
    let recommendation: 'use-ai' | 'use-fallback' | 'check-cache';

    if (!withinBudget || budgetStatus.exceeded) {
      recommendation = 'use-fallback';
    } else if (this.config.cacheEnabled) {
      recommendation = 'check-cache';
    } else if (estimatedCost > this.config.fallbackCostThreshold) {
      recommendation = 'use-fallback';
    } else {
      recommendation = 'use-ai';
    }

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      breakdown: {
        promptCost,
        completionCost,
      },
      withinBudget,
      recommendation,
    };
  }

  /**
   * Track actual token usage from API response
   */
  trackTokenUsage(request: APIRequest, response: APIResponse): void {
    const cost = this.calculateActualCost(
      response.tokensUsed.prompt,
      response.tokensUsed.completion
    );

    const record: TokenUsageRecord = {
      requestId: request.id,
      timestamp: new Date(),
      promptTokens: response.tokensUsed.prompt,
      completionTokens: response.tokensUsed.completion,
      totalTokens: response.tokensUsed.total,
      cost,
      model: request.model,
      strategy: HealingStrategy.AI_POWERED,
    };

    this.tokenUsage.push(record);

    // Update monthly spend
    if (this.isCurrentMonth(record.timestamp)) {
      this.monthlySpend += cost;
    } else {
      // New month - reset
      this.resetMonthlySpend();
      this.monthlySpend = cost;
    }
  }

  /**
   * Calculate total cost across all tracked usage
   */
  calculateTotalCost(): number {
    return this.tokenUsage.reduce((sum, record) => sum + record.cost, 0);
  }

  /**
   * Get detailed cost breakdown
   */
  getCostBreakdown(): CostBreakdown {
    // Calculate totals
    const total = this.calculateTotalCost();

    // By failure type
    const byFailureType: Record<string, number> = {};
    this.tokenUsage.forEach((record) => {
      if (record.failureType) {
        const type = String(record.failureType);
        byFailureType[type] = (byFailureType[type] || 0) + record.cost;
      }
    });

    // By date
    const byDate: Record<string, number> = {};
    this.tokenUsage.forEach((record) => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (dateKey) {
        byDate[dateKey] = (byDate[dateKey] || 0) + record.cost;
      }
    });

    // By strategy
    const byStrategy: Record<string, number> = {};
    this.tokenUsage.forEach((record) => {
      const strategy = String(record.strategy);
      byStrategy[strategy] = (byStrategy[strategy] || 0) + record.cost;
    });

    // Token breakdown
    const totalPromptTokens = this.tokenUsage.reduce(
      (sum, r) => sum + r.promptTokens,
      0
    );
    const totalCompletionTokens = this.tokenUsage.reduce(
      (sum, r) => sum + r.completionTokens,
      0
    );

    const promptCost = (totalPromptTokens / 1000) * this.config.pricing.promptPrice;
    const completionCost =
      (totalCompletionTokens / 1000) * this.config.pricing.completionPrice;

    return {
      total,
      byFailureType: byFailureType as Record<FailureType, number>,
      byDate,
      byStrategy: byStrategy as Record<HealingStrategy, number>,
      tokenBreakdown: {
        promptCost,
        completionCost,
      },
      cacheSavings: 0, // Will be calculated by cache store
      fallbackSavings: 0, // Estimated savings from using fallback
    };
  }

  /**
   * Determine if cache should be used
   */
  shouldUseCache(_context: HealingContext): boolean {
    if (!this.config.cacheEnabled) return false;

    // Always check cache first
    return true;
  }

  /**
   * Determine if fallback should be used instead of AI
   */
  shouldUseFallback(costEstimate: CostEstimate): boolean {
    // Check budget
    const budgetStatus = this.checkBudgetLimit();
    if (budgetStatus.exceeded || !costEstimate.withinBudget) {
      return true;
    }

    // Check cost threshold
    if (costEstimate.estimatedCost > this.config.fallbackCostThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Optimize batch requests
   */
  optimizeBatchRequests(requests: HealingRequest[]): OptimizedBatch {
    // Sort by priority (higher first) and complexity (lower first)
    const sorted = [...requests].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      const complexityOrder = { low: 1, medium: 2, high: 3 };
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });

    // Calculate total estimated cost
    let estimatedCost = 0;
    let estimatedTokens = 0;

    sorted.forEach((req) => {
      const estimate = this.estimateCost(req.test.testCode);
      estimatedCost += estimate.estimatedCost;
      estimatedTokens += estimate.totalTokens;
    });

    // Determine strategy based on complexity and budget
    let strategy: 'sequential' | 'parallel' | 'hybrid';

    const budgetStatus = this.checkBudgetLimit();
    const hasHighComplexity = sorted.some((r) => r.complexity === 'high');

    if (budgetStatus.percentUsed > 90 || hasHighComplexity) {
      strategy = 'sequential'; // Process one at a time to control costs
    } else if (sorted.length <= 3 && budgetStatus.remaining > estimatedCost * 2) {
      strategy = 'parallel'; // Can afford to run all at once
    } else {
      strategy = 'hybrid'; // Mix of parallel and sequential
    }

    return {
      id: this.generateBatchId(),
      requests: sorted,
      estimatedCost,
      estimatedTokens,
      strategy,
      order: sorted.map((r) => r.id),
    };
  }

  /**
   * Generate comprehensive cost report
   */
  generateCostReport(): CostReport {
    const now = new Date();
    const monthStart = this.getMonthStart();
    const breakdown = this.getCostBreakdown();
    const budgetStatus = this.checkBudgetLimit();

    // Calculate trends
    const currentMonthRecords = this.tokenUsage.filter((r) =>
      this.isCurrentMonth(r.timestamp)
    );

    const daysInMonth = this.getDaysInMonth();
    const daysPassed = this.getDaysPassed();
    const dailyAverage =
      daysPassed > 0 ? this.monthlySpend / daysPassed : this.monthlySpend;
    const projectedMonthly = dailyAverage * daysInMonth;
    const costPerHealing =
      currentMonthRecords.length > 0
        ? this.monthlySpend / currentMonthRecords.length
        : 0;

    // Generate suggestions
    const suggestions: string[] = [];

    if (budgetStatus.atWarningThreshold) {
      suggestions.push(
        `Budget warning: ${budgetStatus.percentUsed.toFixed(1)}% of monthly budget used`
      );
    }

    if (projectedMonthly > this.config.monthlyBudget) {
      suggestions.push(
        `Projected spend ($${projectedMonthly.toFixed(2)}) exceeds monthly budget - consider using more caching or fallback strategies`
      );
    }

    if (costPerHealing > 0.5) {
      suggestions.push(
        `High cost per healing ($${costPerHealing.toFixed(2)}) - consider optimizing prompts or using smaller models`
      );
    }

    if (breakdown.tokenBreakdown.completionCost > breakdown.tokenBreakdown.promptCost * 2) {
      suggestions.push(
        'Completion tokens are expensive - consider reducing max_tokens parameter'
      );
    }

    // Find top cost drivers
    const topCostDrivers: Array<{ category: string; cost: number; percentage: number }> = [];

    Object.entries(breakdown.byFailureType).forEach(([type, cost]) => {
      topCostDrivers.push({
        category: `Failure: ${type}`,
        cost,
        percentage: (cost / breakdown.total) * 100,
      });
    });

    topCostDrivers.sort((a, b) => b.cost - a.cost);
    const topThree = topCostDrivers.slice(0, 3);

    return {
      period: {
        start: monthStart,
        end: now,
      },
      totalCost: breakdown.total,
      breakdown,
      monthlySpend: this.monthlySpend,
      budget: {
        limit: budgetStatus.limit,
        remaining: budgetStatus.remaining,
        percentUsed: budgetStatus.percentUsed,
      },
      trends: {
        dailyAverage,
        projectedMonthly,
        costPerHealing,
      },
      suggestions,
      topCostDrivers: topThree,
    };
  }

  /**
   * Set monthly budget
   */
  setMonthlyBudget(amount: number): void {
    if (amount <= 0) {
      throw new Error('Budget must be positive');
    }
    this.config.monthlyBudget = amount;
  }

  /**
   * Check current budget status
   */
  checkBudgetLimit(): BudgetStatus {
    const limit = this.config.monthlyBudget;
    const spent = this.monthlySpend;
    const remaining = Math.max(0, limit - spent);
    const percentUsed = (spent / limit) * 100;
    const exceeded = spent >= limit;
    const atWarningThreshold = percentUsed >= this.config.warningThreshold * 100;

    const daysRemaining = this.getDaysRemaining();
    const dailyAverage = spent / Math.max(1, this.getDaysPassed());
    const projectedSpend = dailyAverage * this.getDaysInMonth();

    return {
      limit,
      spent,
      remaining,
      percentUsed,
      exceeded,
      atWarningThreshold,
      daysRemaining,
      projectedSpend,
    };
  }

  /**
   * Log token usage
   */
  logTokenUsage(metrics: TokenMetrics): void {
    const record: TokenUsageRecord = {
      requestId: metrics.requestId,
      timestamp: metrics.timestamp,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      totalTokens: metrics.totalTokens,
      cost: metrics.cost,
      model: metrics.model,
      strategy: HealingStrategy.AI_POWERED,
    };

    this.tokenUsage.push(record);

    if (this.isCurrentMonth(record.timestamp)) {
      this.monthlySpend += record.cost;
    }
  }

  /**
   * Get all token usage records
   */
  getTokenUsage(): TokenUsageRecord[] {
    return [...this.tokenUsage];
  }

  /**
   * Clear all usage data
   */
  clear(): void {
    this.tokenUsage = [];
    this.monthlySpend = 0;
    // Reset month start
    this.getMonthStart();
  }

  /**
   * Calculate actual cost from token counts
   */
  private calculateActualCost(promptTokens: number, completionTokens: number): number {
    const promptCost = (promptTokens / 1000) * this.config.pricing.promptPrice;
    const completionCost = (completionTokens / 1000) * this.config.pricing.completionPrice;
    return promptCost + completionCost;
  }

  /**
   * Get start of current month
   */
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  /**
   * Check if date is in current month
   */
  private isCurrentMonth(date: Date): boolean {
    const now = new Date();
    const monthStart = this.getMonthStart();
    return (
      date.getTime() >= monthStart.getTime() &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  /**
   * Reset monthly spend
   */
  private resetMonthlySpend(): void {
    this.monthlySpend = 0;
  }

  /**
   * Get days in current month
   */
  private getDaysInMonth(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  /**
   * Get days passed in current month
   */
  private getDaysPassed(): number {
    const now = new Date();
    return now.getDate();
  }

  /**
   * Get days remaining in current month
   */
  private getDaysRemaining(): number {
    return this.getDaysInMonth() - this.getDaysPassed();
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
