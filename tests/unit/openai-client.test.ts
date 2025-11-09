/**
 * Tests for OpenAI Client
 *
 * Tests:
 * - Configuration validation
 * - API call success
 * - Retry logic with exponential backoff
 * - Rate limit handling
 * - Token usage monitoring
 * - Response caching
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OpenAIClient,
  OpenAIError,
  RateLimitError,
  ConfigurationError,
  type OpenAIConfig,
  type CompletionResult,
  type TokenMetrics,
} from '../../src/ai/openai-client.js';

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation((config) => {
      return {
        chat: {
          completions: {
            create: vi.fn(),
          },
        },
      };
    }),
  };
});

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  let mockCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mock instance
    const OpenAI = (await import('openai')).default as any;
    const mockInstance = new OpenAI({ apiKey: 'test' });
    mockCreate = mockInstance.chat.completions.create;
  });

  afterEach(() => {
    if (client) {
      client.clearCache();
    }
  });

  describe('Configuration', () => {
    it('should create client with valid config', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      };

      expect(() => new OpenAIClient(config)).not.toThrow();
    });

    it('should throw error if API key is missing', () => {
      const config = {} as OpenAIConfig;

      expect(() => new OpenAIClient(config)).toThrow(ConfigurationError);
      expect(() => new OpenAIClient(config)).toThrow('API key is required');
    });

    it('should throw error if API key is empty', () => {
      const config: OpenAIConfig = {
        apiKey: '   ',
      };

      expect(() => new OpenAIClient(config)).toThrow(ConfigurationError);
      expect(() => new OpenAIClient(config)).toThrow('API key cannot be empty');
    });

    it('should throw error if temperature is out of range', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        temperature: 3.0,
      };

      expect(() => new OpenAIClient(config)).toThrow(ConfigurationError);
      expect(() => new OpenAIClient(config)).toThrow('Temperature must be between 0 and 2');
    });

    it('should throw error if max tokens is negative', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        maxTokens: -100,
      };

      expect(() => new OpenAIClient(config)).toThrow(ConfigurationError);
      expect(() => new OpenAIClient(config)).toThrow('Max tokens must be positive');
    });

    it('should throw error if max retries is negative', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        maxRetries: -1,
      };

      expect(() => new OpenAIClient(config)).toThrow(ConfigurationError);
      expect(() => new OpenAIClient(config)).toThrow('Max retries cannot be negative');
    });

    it('should use default values for optional config', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
      };

      const client = new OpenAIClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.model).toBe('gpt-4');
      expect(clientConfig.temperature).toBe(0.1);
      expect(clientConfig.maxTokens).toBe(2000);
      expect(clientConfig.maxRetries).toBe(3);
      expect(clientConfig.enableCaching).toBe(true);
    });

    it('should accept custom configuration', () => {
      const config: OpenAIConfig = {
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
        temperature: 0.5,
        maxTokens: 1000,
        maxRetries: 5,
        enableCaching: false,
      };

      const client = new OpenAIClient(config);
      const clientConfig = client.getConfig();

      expect(clientConfig.model).toBe('gpt-4-turbo');
      expect(clientConfig.temperature).toBe(0.5);
      expect(clientConfig.maxTokens).toBe(1000);
      expect(clientConfig.maxRetries).toBe(5);
      expect(clientConfig.enableCaching).toBe(false);
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key' });
    });

    it('should generate completion successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        model: 'gpt-4',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await client.generateCompletion('Test prompt');

      expect(result.content).toBe('Test response');
      expect(result.model).toBe('gpt-4');
      expect(result.usage.promptTokens).toBe(10);
      expect(result.usage.completionTokens).toBe(5);
      expect(result.usage.totalTokens).toBe(15);
      expect(result.cached).toBe(false);
      expect(result.retryCount).toBe(0);
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
        model: 'gpt-4',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await client.generateCompletion('Test prompt');

      expect(result.content).toBe('');
    });

    it('should handle missing usage data', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        model: 'gpt-4',
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await client.generateCompletion('Test prompt');

      expect(result.usage.promptTokens).toBe(0);
      expect(result.usage.completionTokens).toBe(0);
      expect(result.usage.totalTokens).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key', maxRetries: 3 });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry on rate limit error', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Success' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      // Fail twice, then succeed
      mockCreate
        .mockRejectedValueOnce({ status: 429, code: 'rate_limit_exceeded' })
        .mockRejectedValueOnce({ status: 429, code: 'rate_limit_exceeded' })
        .mockResolvedValueOnce(mockResponse);

      const promise = client.generateWithRetry('Test prompt');

      // Fast-forward through backoff delays
      await vi.advanceTimersByTimeAsync(10000);

      const result = await promise;

      expect(result.content).toBe('Success');
      expect(result.retryCount).toBe(2);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx server errors', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Success' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce(mockResponse);

      const promise = client.generateWithRetry('Test prompt');

      await vi.advanceTimersByTimeAsync(5000);

      const result = await promise;

      expect(result.content).toBe('Success');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      mockCreate.mockRejectedValue({ status: 400, message: 'Bad request' });

      const promise = client.generateWithRetry('Test prompt');

      await expect(promise).rejects.toThrow(OpenAIError);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      mockCreate.mockRejectedValue({ status: 429, code: 'rate_limit_exceeded' });

      const promise = client.generateWithRetry('Test prompt');

      await vi.advanceTimersByTimeAsync(30000);

      await expect(promise).rejects.toThrow(RateLimitError);
      expect(mockCreate).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      vi.useRealTimers();
      vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any);

      mockCreate.mockRejectedValue({ status: 500 });

      try {
        await client.generateWithRetry('Test prompt');
      } catch {
        // Expected to fail
      }

      // Check that delays increase exponentially (with some jitter)
      expect(delays.length).toBeGreaterThan(0);
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1] * 0.75); // Account for jitter
      }

      vi.restoreAllMocks();
    });

    it('should respect retry-after header', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Success' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate
        .mockRejectedValueOnce({
          status: 429,
          headers: { 'retry-after': '5' },
        })
        .mockResolvedValueOnce(mockResponse);

      const promise = client.generateWithRetry('Test prompt');

      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;

      expect(result.content).toBe('Success');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      client = new OpenAIClient({
        apiKey: 'test-key',
        enableCaching: true,
        cacheTTL: 5000,
      });
    });

    it('should cache responses', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Cached response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result1 = await client.generateCompletion('Test prompt');
      const result2 = await client.generateCompletion('Test prompt');

      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(true);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      client = new OpenAIClient({
        apiKey: 'test-key',
        enableCaching: false,
      });

      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Test prompt');
      await client.generateCompletion('Test prompt');

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should expire cached responses after TTL', async () => {
      vi.useFakeTimers();

      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Test prompt');

      // Advance time beyond TTL
      vi.advanceTimersByTime(6000);

      await client.generateCompletion('Test prompt');

      expect(mockCreate).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should clear cache', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Test prompt');
      client.clearCache();
      await client.generateCompletion('Test prompt');

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should track cache statistics', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt 1');
      await client.generateCompletion('Prompt 1'); // Cache hit
      await client.generateCompletion('Prompt 2');

      const stats = client.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.5);
      expect(stats.missRate).toBeCloseTo(0.5);
    });
  });

  describe('Token Monitoring', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key' });
    });

    it('should track token usage', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt 1');
      await client.generateCompletion('Prompt 2');

      const metrics = client.monitorTokenUsage();

      expect(metrics.totalPromptTokens).toBe(200);
      expect(metrics.totalCompletionTokens).toBe(100);
      expect(metrics.totalTokens).toBe(300);
      expect(metrics.requestCount).toBe(2);
    });

    it('should calculate average tokens per request', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt 1');
      await client.generateCompletion('Prompt 2');

      const metrics = client.monitorTokenUsage();

      expect(metrics.averageTokensPerRequest).toBe(150);
    });

    it('should estimate cost in USD', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt');

      const metrics = client.monitorTokenUsage();

      // GPT-4: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
      const expectedCost = (1000 / 1000) * 0.03 + (500 / 1000) * 0.06;
      expect(metrics.estimatedCostUSD).toBeCloseTo(expectedCost);
    });

    it('should track cache hits and misses', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt 1');
      await client.generateCompletion('Prompt 1'); // Cache hit
      await client.generateCompletion('Prompt 2');

      const metrics = client.monitorTokenUsage();

      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(2);
    });

    it('should reset metrics', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.generateCompletion('Prompt');
      client.resetMetrics();

      const metrics = client.monitorTokenUsage();

      expect(metrics.totalTokens).toBe(0);
      expect(metrics.requestCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key' });
    });

    it('should throw RateLimitError on 429', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        code: 'rate_limit_exceeded',
      });

      await expect(client.generateCompletion('Test')).rejects.toThrow(RateLimitError);
    });

    it('should throw OpenAIError on other errors', async () => {
      mockCreate.mockRejectedValue({
        status: 500,
        message: 'Internal server error',
      });

      await expect(client.generateCompletion('Test')).rejects.toThrow(OpenAIError);
    });

    it('should include error details', async () => {
      mockCreate.mockRejectedValue({
        status: 400,
        message: 'Invalid request',
      });

      try {
        await client.generateCompletion('Test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIError);
        expect((error as OpenAIError).status).toBe(400);
      }
    });
  });

  describe('Rate Limit Info', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key' });
    });

    it('should return rate limit information', () => {
      const info = client.getRateLimitInfo();

      expect(info).toHaveProperty('limitRequests');
      expect(info).toHaveProperty('limitTokens');
      expect(info).toHaveProperty('remainingRequests');
      expect(info).toHaveProperty('remainingTokens');
      expect(info).toHaveProperty('resetRequests');
      expect(info).toHaveProperty('resetTokens');
    });
  });

  describe('Connection Test', () => {
    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'test-key' });
    });

    it('should return true on successful connection', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hi' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const connected = await client.testConnection();

      expect(connected).toBe(true);
    });

    it('should return false on failed connection', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      const connected = await client.testConnection();

      expect(connected).toBe(false);
    });
  });
});
