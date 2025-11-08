/**
 * TypeScript type definitions for Self-Healing Agent (Feature 4)
 * Defines interfaces for healing metrics, cost optimization, and caching
 */

/**
 * Test failure types
 */
export enum FailureType {
  ASSERTION = 'assertion',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SETUP = 'setup',
  TEARDOWN = 'teardown',
  SYNTAX = 'syntax',
  RUNTIME = 'runtime',
  UNKNOWN = 'unknown',
}

/**
 * Healing strategy types
 */
export enum HealingStrategy {
  AI_POWERED = 'ai-powered',
  RULE_BASED = 'rule-based',
  HYBRID = 'hybrid',
  FALLBACK = 'fallback',
}

/**
 * Failed test information
 */
export interface FailedTest {
  /** Unique test identifier */
  id: string;

  /** Test name/title */
  name: string;

  /** Test file path */
  filePath: string;

  /** Failure type */
  failureType: FailureType;

  /** Error message */
  errorMessage: string;

  /** Error stack trace */
  stackTrace?: string;

  /** Test code that failed */
  testCode: string;

  /** Expected vs actual values */
  comparison?: {
    expected: unknown;
    actual: unknown;
  };

  /** Failure timestamp */
  timestamp: Date;

  /** Number of previous healing attempts */
  previousAttempts: number;

  /** Test metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Healing attempt record
 */
export interface HealingAttempt {
  /** Attempt ID */
  id: string;

  /** Test being healed */
  test: FailedTest;

  /** Healing strategy used */
  strategy: HealingStrategy;

  /** Attempt start time */
  startTime: Date;

  /** Attempt end time */
  endTime?: Date;

  /** Attempt duration in milliseconds */
  duration?: number;

  /** Whether attempt was successful */
  success: boolean;

  /** Failure reason if unsuccessful */
  failureReason?: string;

  /** AI tokens used (if AI strategy) */
  tokensUsed?: number;

  /** Estimated cost in USD */
  estimatedCost?: number;

  /** Generated fix */
  generatedFix?: string;

  /** Whether cache was used */
  cacheHit?: boolean;
}

/**
 * Type-specific metrics
 */
export interface TypeMetrics {
  /** Number of attempts for this type */
  attempts: number;

  /** Number of successful healings */
  successful: number;

  /** Number of failed healings */
  failed: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average healing time in milliseconds */
  averageTime: number;

  /** Total cost for this type in USD */
  totalCost: number;
}

/**
 * AI usage statistics
 */
export interface AIUsageStats {
  /** Number of times AI was used */
  timesUsed: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** Prompt tokens */
  promptTokens: number;

  /** Completion tokens */
  completionTokens: number;

  /** Total cost in USD */
  totalCost: number;

  /** Average tokens per request */
  averageTokens: number;

  /** Success rate when using AI */
  successRate: number;

  /** Cache hit rate */
  cacheHitRate: number;
}

/**
 * Fallback usage statistics
 */
export interface FallbackUsageStats {
  /** Number of times fallback was used */
  timesUsed: number;

  /** Success rate when using fallback */
  successRate: number;

  /** Average healing time in milliseconds */
  averageTime: number;

  /** Reasons for fallback usage */
  fallbackReasons: Record<string, number>;
}

/**
 * Healing metrics summary
 */
export interface HealingMetricsSummary {
  /** Total healing attempts */
  totalAttempts: number;

  /** Successful healings */
  successful: number;

  /** Failed healings */
  failed: number;

  /** Overall success rate (0-100) */
  successRate: number;

  /** Average healing time in milliseconds */
  averageTime: number;

  /** Total cost in USD */
  totalCost: number;

  /** Metrics by failure type */
  byFailureType: Record<FailureType, TypeMetrics>;

  /** AI usage statistics */
  aiStats: AIUsageStats;

  /** Fallback usage statistics */
  fallbackStats: FallbackUsageStats;

  /** Time period */
  period: {
    start: Date;
    end: Date;
  };

  /** Warning messages */
  warnings: string[];

  /** Recommendations */
  recommendations: string[];
}

/**
 * Cost estimation result
 */
export interface CostEstimate {
  /** Estimated prompt tokens */
  promptTokens: number;

  /** Estimated completion tokens */
  completionTokens: number;

  /** Total estimated tokens */
  totalTokens: number;

  /** Estimated cost in USD */
  estimatedCost: number;

  /** Cost breakdown */
  breakdown: {
    promptCost: number;
    completionCost: number;
  };

  /** Whether estimate is within budget */
  withinBudget: boolean;

  /** Recommendation (use AI or fallback) */
  recommendation: 'use-ai' | 'use-fallback' | 'check-cache';
}

/**
 * API request tracking
 */
export interface APIRequest {
  /** Request ID */
  id: string;

  /** Request timestamp */
  timestamp: Date;

  /** Prompt content */
  prompt: string;

  /** Model used */
  model: string;

  /** Max tokens requested */
  maxTokens?: number;

  /** Temperature setting */
  temperature?: number;

  /** Other parameters */
  parameters?: Record<string, unknown>;
}

/**
 * API response tracking
 */
export interface APIResponse {
  /** Request ID */
  requestId: string;

  /** Response timestamp */
  timestamp: Date;

  /** Generated content */
  content: string;

  /** Actual tokens used */
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };

  /** Actual cost in USD */
  actualCost: number;

  /** Response time in milliseconds */
  responseTime: number;

  /** Whether response was from cache */
  fromCache: boolean;
}

/**
 * Cost breakdown by category
 */
export interface CostBreakdown {
  /** Total cost */
  total: number;

  /** Cost by failure type */
  byFailureType: Record<FailureType, number>;

  /** Cost by date */
  byDate: Record<string, number>;

  /** Cost by strategy */
  byStrategy: Record<HealingStrategy, number>;

  /** Prompt vs completion costs */
  tokenBreakdown: {
    promptCost: number;
    completionCost: number;
  };

  /** Cache savings */
  cacheSavings: number;

  /** Fallback savings */
  fallbackSavings: number;
}

/**
 * Healing context for cache key generation
 */
export interface HealingContext {
  /** Failure type */
  failureType: FailureType;

  /** Spec difference/requirements */
  specDiff: unknown;

  /** Test code snippet */
  testCode: string;

  /** Error message */
  errorMessage: string;

  /** Additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Cost report
 */
export interface CostReport {
  /** Report period */
  period: {
    start: Date;
    end: Date;
  };

  /** Total cost */
  totalCost: number;

  /** Cost breakdown */
  breakdown: CostBreakdown;

  /** Monthly spend */
  monthlySpend: number;

  /** Budget information */
  budget: {
    limit: number;
    remaining: number;
    percentUsed: number;
  };

  /** Cost trends */
  trends: {
    dailyAverage: number;
    projectedMonthly: number;
    costPerHealing: number;
  };

  /** Optimization suggestions */
  suggestions: string[];

  /** Top cost drivers */
  topCostDrivers: Array<{
    category: string;
    cost: number;
    percentage: number;
  }>;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  /** Monthly budget limit */
  limit: number;

  /** Amount spent this month */
  spent: number;

  /** Amount remaining */
  remaining: number;

  /** Percentage used (0-100) */
  percentUsed: number;

  /** Whether budget exceeded */
  exceeded: boolean;

  /** Whether at warning threshold (80%) */
  atWarningThreshold: boolean;

  /** Days remaining in month */
  daysRemaining: number;

  /** Projected end-of-month spend */
  projectedSpend: number;
}

/**
 * Token metrics
 */
export interface TokenMetrics {
  /** Request ID */
  requestId: string;

  /** Timestamp */
  timestamp: Date;

  /** Prompt tokens */
  promptTokens: number;

  /** Completion tokens */
  completionTokens: number;

  /** Total tokens */
  totalTokens: number;

  /** Cost in USD */
  cost: number;

  /** Model used */
  model: string;

  /** Response time in milliseconds */
  responseTime: number;
}

/**
 * Healing request for batch optimization
 */
export interface HealingRequest {
  /** Request ID */
  id: string;

  /** Failed test */
  test: FailedTest;

  /** Priority (1-5) */
  priority: number;

  /** Estimated complexity */
  complexity: 'low' | 'medium' | 'high';

  /** Whether can be batched */
  batchable: boolean;
}

/**
 * Optimized batch of requests
 */
export interface OptimizedBatch {
  /** Batch ID */
  id: string;

  /** Requests in this batch */
  requests: HealingRequest[];

  /** Estimated total cost */
  estimatedCost: number;

  /** Estimated total tokens */
  estimatedTokens: number;

  /** Batch strategy */
  strategy: 'sequential' | 'parallel' | 'hybrid';

  /** Processing order */
  order: string[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default TTL in seconds */
  defaultTTL: number;

  /** Maximum cache size (entries) */
  maxSize: number;

  /** Eviction policy */
  evictionPolicy: 'lru' | 'lfu' | 'fifo';

  /** Enable disk persistence */
  persistToDisk: boolean;

  /** Disk storage path */
  diskPath?: string;

  /** Enable compression */
  enableCompression: boolean;
}

/**
 * Cached item
 */
export interface CachedItem {
  /** Cache key */
  key: string;

  /** Cached value */
  value: unknown;

  /** Item creation timestamp */
  createdAt: Date;

  /** Last access timestamp */
  lastAccessedAt: Date;

  /** Number of times accessed */
  accessCount: number;

  /** TTL in seconds */
  ttl: number;

  /** Expiration timestamp */
  expiresAt: Date;

  /** Item size in bytes */
  size: number;

  /** Item metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cache key context
 */
export interface CacheKeyContext {
  /** Failure type */
  failureType: FailureType;

  /** Spec difference hash */
  specDiffHash: string;

  /** Test code hash */
  testCodeHash: string;

  /** Additional context */
  extra?: Record<string, unknown>;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /** Total entries in cache */
  totalEntries: number;

  /** Total cache hits */
  hits: number;

  /** Total cache misses */
  misses: number;

  /** Hit rate (0-1) */
  hitRate: number;

  /** Total cache size in bytes */
  totalSize: number;

  /** Average entry size in bytes */
  averageSize: number;

  /** Oldest entry age in seconds */
  oldestEntryAge: number;

  /** Number of evictions */
  evictions: number;

  /** Number of expired entries */
  expired: number;

  /** Cache effectiveness score (0-100) */
  effectiveness: number;
}

/**
 * Pricing configuration
 */
export interface PricingConfig {
  /** Model name */
  model: string;

  /** Price per 1K prompt tokens (USD) */
  promptPrice: number;

  /** Price per 1K completion tokens (USD) */
  completionPrice: number;

  /** Currency */
  currency: 'USD';
}

/**
 * Healing metrics configuration
 */
export interface MetricsConfig {
  /** History file path */
  historyPath: string;

  /** Enable automatic history saving */
  autoSave: boolean;

  /** Auto-save interval in minutes */
  autoSaveInterval: number;

  /** Maximum history entries to keep */
  maxHistoryEntries: number;

  /** Warning threshold for success rate (0-1) */
  successRateWarningThreshold: number;

  /** Enable ASCII visualizations */
  enableVisualizations: boolean;
}

/**
 * Healing history entry
 */
export interface HealingHistoryEntry {
  /** Entry ID */
  id: string;

  /** Timestamp */
  timestamp: Date;

  /** Metrics snapshot */
  metrics: HealingMetricsSummary;

  /** Session information */
  session?: {
    id: string;
    startTime: Date;
    endTime: Date;
  };
}
