/**
 * Healing Metrics Tracker (Feature 4, Task 4.8)
 * Tracks and reports self-healing effectiveness and statistics
 */

import * as fs from 'fs/promises';
import {
  FailedTest,
  FailureType,
  HealingAttempt,
  TypeMetrics,
  AIUsageStats,
  FallbackUsageStats,
  HealingMetricsSummary,
  HealingStrategy,
  MetricsConfig,
  HealingHistoryEntry,
} from '../types/self-healing-types.js';

/**
 * Default metrics configuration
 */
const DEFAULT_CONFIG: MetricsConfig = {
  historyPath: '.healing-history.json',
  autoSave: true,
  autoSaveInterval: 5, // 5 minutes
  maxHistoryEntries: 1000,
  successRateWarningThreshold: 0.5,
  enableVisualizations: true,
};

/**
 * Healing Metrics Tracker
 * Tracks healing attempts, successes, failures, and generates reports
 */
export class HealingMetrics {
  private attempts: HealingAttempt[] = [];
  private config: MetricsConfig;
  private startTime: Date;
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Record a healing attempt
   */
  recordAttempt(test: FailedTest, _type?: FailureType): string {
    const attemptId = this.generateAttemptId();
    const attempt: HealingAttempt = {
      id: attemptId,
      test,
      strategy: HealingStrategy.AI_POWERED, // Default, will be updated
      startTime: new Date(),
      success: false,
    };

    this.attempts.push(attempt);
    return attemptId;
  }

  /**
   * Record a successful healing
   */
  recordSuccess(
    attemptId: string,
    healingTime: number,
    options: {
      strategy?: HealingStrategy;
      tokensUsed?: number;
      estimatedCost?: number;
      generatedFix?: string;
      cacheHit?: boolean;
    } = {}
  ): void {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }

    attempt.endTime = new Date();
    attempt.duration = healingTime;
    attempt.success = true;
    attempt.strategy = options.strategy ?? attempt.strategy;
    attempt.tokensUsed = options.tokensUsed;
    attempt.estimatedCost = options.estimatedCost;
    attempt.generatedFix = options.generatedFix;
    attempt.cacheHit = options.cacheHit ?? false;
  }

  /**
   * Record a failed healing
   */
  recordFailure(
    attemptId: string,
    reason: string,
    options: {
      strategy?: HealingStrategy;
      tokensUsed?: number;
      estimatedCost?: number;
    } = {}
  ): void {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }

    attempt.endTime = new Date();
    attempt.duration = attempt.endTime.getTime() - attempt.startTime.getTime();
    attempt.success = false;
    attempt.failureReason = reason;
    attempt.strategy = options.strategy ?? attempt.strategy;
    attempt.tokensUsed = options.tokensUsed;
    attempt.estimatedCost = options.estimatedCost;
  }

  /**
   * Calculate overall success rate
   */
  calculateSuccessRate(): number {
    if (this.attempts.length === 0) return 0;

    const successful = this.attempts.filter((a) => a.success).length;
    return (successful / this.attempts.length) * 100;
  }

  /**
   * Calculate average healing time
   */
  calculateAverageTime(): number {
    const completedAttempts = this.attempts.filter((a) => a.duration !== undefined);
    if (completedAttempts.length === 0) return 0;

    const totalTime = completedAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);
    return totalTime / completedAttempts.length;
  }

  /**
   * Get metrics breakdown by failure type
   */
  getMetricsByFailureType(): Record<FailureType, TypeMetrics> {
    const metrics: Partial<Record<FailureType, TypeMetrics>> = {};

    // Initialize metrics for all failure types
    Object.values(FailureType).forEach((type) => {
      const typeAttempts = this.attempts.filter((a) => a.test.failureType === type);
      const successful = typeAttempts.filter((a) => a.success).length;
      const failed = typeAttempts.filter((a) => !a.success).length;
      const completedAttempts = typeAttempts.filter((a) => a.duration !== undefined);
      const totalTime = completedAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);
      const totalCost = typeAttempts.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);

      metrics[type] = {
        attempts: typeAttempts.length,
        successful,
        failed,
        successRate: typeAttempts.length > 0 ? (successful / typeAttempts.length) * 100 : 0,
        averageTime: completedAttempts.length > 0 ? totalTime / completedAttempts.length : 0,
        totalCost,
      };
    });

    return metrics as Record<FailureType, TypeMetrics>;
  }

  /**
   * Get AI usage statistics
   */
  getAIUsageStats(): AIUsageStats {
    const aiAttempts = this.attempts.filter(
      (a) => a.strategy === HealingStrategy.AI_POWERED || a.strategy === HealingStrategy.HYBRID
    );

    const totalTokens = aiAttempts.reduce((sum, a) => sum + (a.tokensUsed || 0), 0);
    const totalCost = aiAttempts.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
    const successful = aiAttempts.filter((a) => a.success).length;
    const cacheHits = aiAttempts.filter((a) => a.cacheHit).length;

    // Estimate prompt vs completion tokens (roughly 40% prompt, 60% completion)
    const promptTokens = Math.round(totalTokens * 0.4);
    const completionTokens = totalTokens - promptTokens;

    return {
      timesUsed: aiAttempts.length,
      totalTokens,
      promptTokens,
      completionTokens,
      totalCost,
      averageTokens: aiAttempts.length > 0 ? totalTokens / aiAttempts.length : 0,
      successRate: aiAttempts.length > 0 ? (successful / aiAttempts.length) * 100 : 0,
      cacheHitRate: aiAttempts.length > 0 ? (cacheHits / aiAttempts.length) * 100 : 0,
    };
  }

  /**
   * Get fallback usage statistics
   */
  getFallbackUsageStats(): FallbackUsageStats {
    const fallbackAttempts = this.attempts.filter(
      (a) => a.strategy === HealingStrategy.FALLBACK || a.strategy === HealingStrategy.RULE_BASED
    );

    const successful = fallbackAttempts.filter((a) => a.success).length;
    const completedAttempts = fallbackAttempts.filter((a) => a.duration !== undefined);
    const totalTime = completedAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);

    // Collect fallback reasons
    const fallbackReasons: Record<string, number> = {};
    fallbackAttempts.forEach((a) => {
      const reason = a.failureReason || 'cost-optimization';
      fallbackReasons[reason] = (fallbackReasons[reason] || 0) + 1;
    });

    return {
      timesUsed: fallbackAttempts.length,
      successRate: fallbackAttempts.length > 0 ? (successful / fallbackAttempts.length) * 100 : 0,
      averageTime: completedAttempts.length > 0 ? totalTime / completedAttempts.length : 0,
      fallbackReasons,
    };
  }

  /**
   * Generate comprehensive summary
   */
  generateSummary(): HealingMetricsSummary {
    const successful = this.attempts.filter((a) => a.success).length;
    const failed = this.attempts.filter((a) => !a.success).length;
    const totalCost = this.attempts.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check success rate
    const successRate = this.calculateSuccessRate();
    if (successRate < this.config.successRateWarningThreshold * 100) {
      warnings.push(
        `Low success rate: ${successRate.toFixed(1)}% (threshold: ${(this.config.successRateWarningThreshold * 100).toFixed(0)}%)`
      );
      recommendations.push('Consider reviewing healing strategies or improving AI prompts');
    }

    // Check AI vs fallback usage
    const aiStats = this.getAIUsageStats();
    const fallbackStats = this.getFallbackUsageStats();

    if (aiStats.timesUsed > 0 && aiStats.successRate < fallbackStats.successRate) {
      recommendations.push(
        'Fallback strategy has higher success rate - consider using it more frequently'
      );
    }

    // Check cache effectiveness
    if (aiStats.cacheHitRate < 30 && aiStats.timesUsed > 10) {
      recommendations.push(
        `Low cache hit rate (${aiStats.cacheHitRate.toFixed(1)}%) - consider increasing cache TTL`
      );
    }

    // Check cost efficiency
    if (totalCost > 10 && aiStats.timesUsed > 0) {
      const costPerHealing = totalCost / aiStats.timesUsed;
      if (costPerHealing > 0.5) {
        warnings.push(`High cost per healing: $${costPerHealing.toFixed(2)}`);
        recommendations.push('Consider using smaller models or increasing cache usage');
      }
    }

    return {
      totalAttempts: this.attempts.length,
      successful,
      failed,
      successRate,
      averageTime: this.calculateAverageTime(),
      totalCost,
      byFailureType: this.getMetricsByFailureType(),
      aiStats,
      fallbackStats,
      period: {
        start: this.startTime,
        end: new Date(),
      },
      warnings,
      recommendations,
    };
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON(): string {
    const summary = this.generateSummary();
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export metrics to Markdown
   */
  exportToMarkdown(): string {
    const summary = this.generateSummary();
    let md = '# Healing Metrics Report\n\n';

    // Overview
    md += '## Overview\n\n';
    md += `- **Total Attempts**: ${summary.totalAttempts}\n`;
    md += `- **Successful**: ${summary.successful} (${summary.successRate.toFixed(1)}%)\n`;
    md += `- **Failed**: ${summary.failed}\n`;
    md += `- **Average Time**: ${summary.averageTime.toFixed(0)}ms\n`;
    md += `- **Total Cost**: $${summary.totalCost.toFixed(4)}\n`;
    md += `- **Period**: ${summary.period.start.toISOString()} to ${summary.period.end.toISOString()}\n\n`;

    // Success rate visualization
    if (this.config.enableVisualizations) {
      md += '## Success Rate\n\n';
      md += this.generateASCIIChart(summary.successRate) + '\n\n';
    }

    // By Failure Type
    md += '## Metrics by Failure Type\n\n';
    md += '| Type | Attempts | Success | Failed | Success Rate | Avg Time | Cost |\n';
    md += '|------|----------|---------|--------|--------------|----------|------|\n';

    Object.entries(summary.byFailureType).forEach(([type, metrics]) => {
      if (metrics.attempts > 0) {
        md += `| ${type} | ${metrics.attempts} | ${metrics.successful} | ${metrics.failed} | `;
        md += `${metrics.successRate.toFixed(1)}% | ${metrics.averageTime.toFixed(0)}ms | `;
        md += `$${metrics.totalCost.toFixed(4)} |\n`;
      }
    });
    md += '\n';

    // AI Usage
    md += '## AI Usage Statistics\n\n';
    md += `- **Times Used**: ${summary.aiStats.timesUsed}\n`;
    md += `- **Total Tokens**: ${summary.aiStats.totalTokens.toLocaleString()}\n`;
    md += `- **Prompt Tokens**: ${summary.aiStats.promptTokens.toLocaleString()}\n`;
    md += `- **Completion Tokens**: ${summary.aiStats.completionTokens.toLocaleString()}\n`;
    md += `- **Total Cost**: $${summary.aiStats.totalCost.toFixed(4)}\n`;
    md += `- **Success Rate**: ${summary.aiStats.successRate.toFixed(1)}%\n`;
    md += `- **Cache Hit Rate**: ${summary.aiStats.cacheHitRate.toFixed(1)}%\n\n`;

    // Fallback Usage
    md += '## Fallback Strategy Statistics\n\n';
    md += `- **Times Used**: ${summary.fallbackStats.timesUsed}\n`;
    md += `- **Success Rate**: ${summary.fallbackStats.successRate.toFixed(1)}%\n`;
    md += `- **Average Time**: ${summary.fallbackStats.averageTime.toFixed(0)}ms\n\n`;

    if (Object.keys(summary.fallbackStats.fallbackReasons).length > 0) {
      md += '### Fallback Reasons\n\n';
      Object.entries(summary.fallbackStats.fallbackReasons).forEach(([reason, count]) => {
        md += `- **${reason}**: ${count}\n`;
      });
      md += '\n';
    }

    // Warnings
    if (summary.warnings.length > 0) {
      md += '## ⚠️ Warnings\n\n';
      summary.warnings.forEach((warning) => {
        md += `- ${warning}\n`;
      });
      md += '\n';
    }

    // Recommendations
    if (summary.recommendations.length > 0) {
      md += '## 💡 Recommendations\n\n';
      summary.recommendations.forEach((rec) => {
        md += `- ${rec}\n`;
      });
      md += '\n';
    }

    return md;
  }

  /**
   * Store history to file
   */
  async storeHistory(filepath?: string): Promise<void> {
    const path = filepath || this.config.historyPath;

    try {
      // Load existing history
      let history: HealingHistoryEntry[] = [];
      try {
        const existing = await fs.readFile(path, 'utf-8');
        history = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      // Add current metrics
      const entry: HealingHistoryEntry = {
        id: this.generateEntryId(),
        timestamp: new Date(),
        metrics: this.generateSummary(),
      };

      history.push(entry);

      // Trim to max entries
      if (history.length > this.config.maxHistoryEntries) {
        history = history.slice(-this.config.maxHistoryEntries);
      }

      // Write to file
      await fs.writeFile(path, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to store history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load history from file
   */
  async loadHistory(filepath?: string): Promise<HealingHistoryEntry[]> {
    const path = filepath || this.config.historyPath;

    try {
      const content = await fs.readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // File doesn't exist
      }
      throw new Error(`Failed to load history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all attempts
   */
  getAttempts(): HealingAttempt[] {
    return [...this.attempts];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.attempts = [];
    this.startTime = new Date();
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Generate ASCII chart for success rate
   */
  private generateASCIIChart(percentage: number): string {
    const barLength = 50;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`\`\`\n${bar} ${percentage.toFixed(1)}%\n\`\`\``;
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.storeHistory().catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, this.config.autoSaveInterval * 60 * 1000);
  }

  /**
   * Generate unique attempt ID
   */
  private generateAttemptId(): string {
    return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
