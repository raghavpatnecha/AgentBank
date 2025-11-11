/**
 * Unit tests for Test Regenerator (Feature 4, Task 4.5)
 * Comprehensive test coverage for AI-powered test regeneration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TestRegenerator,
  PromptBuilder,
  type OpenAIClient,
} from '../../src/ai/test-regenerator.js';
import type {
  RegenerationContext,
  FailureAnalysis,
  FailureType,
  OpenAIConfig,
  PromptConfig,
} from '../../src/types/ai-types.js';
import type { TestResult, TestStatus } from '../../src/types/executor-types.js';

// Mock OpenAI client
class MockOpenAIClient implements OpenAIClient {
  private mockResponses: Map<string, { text: string; tokensUsed: number }> = new Map();
  private callCount = 0;

  setMockResponse(key: string, response: { text: string; tokensUsed: number }) {
    this.mockResponses.set(key, response);
  }

  async createCompletion(
    prompt: string,
    options?: any
  ): Promise<{
    text: string;
    tokensUsed: number;
    model: string;
  }> {
    this.callCount++;

    // Return predefined response or default
    const response = this.mockResponses.get('default') || {
      text: "```typescript\nimport { test, expect } from '@playwright/test';\n\ntest('sample test', async ({ request }) => {\n  const response = await request.get('/api/users');\n  expect(response.status()).toBe(200);\n});\n```",
      tokensUsed: 100,
    };

    return {
      ...response,
      model: options?.model || 'gpt-4',
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset() {
    this.callCount = 0;
    this.mockResponses.clear();
  }
}

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
  });

  describe('buildRegenerationPrompt', () => {
    it('should build basic prompt with default config', () => {
      const context = createMockContext();
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('Task: Regenerate Failing Playwright Test');
      expect(prompt).toContain('Failure Analysis');
      expect(prompt).toContain('Original Test Code');
    });

    it('should include test name in prompt', () => {
      const context = createMockContext({ testName: 'GET /api/users - should return users' });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('GET /api/users - should return users');
    });

    it('should include failure type in prompt', () => {
      const context = createMockContext({
        failureType: 'field_missing' as FailureType,
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('field_missing');
    });

    it('should include root cause in prompt', () => {
      const context = createMockContext({
        rootCause: 'Field "email" is missing from response',
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('Field "email" is missing from response');
    });

    it('should include suggested fix when available', () => {
      const context = createMockContext({
        suggestedFix: 'Update assertion to use "emailAddress" instead of "email"',
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('Update assertion to use "emailAddress"');
    });

    it('should include spec changes', () => {
      const context = createMockContext({
        specChanges: [
          {
            type: 'field_renamed' as any,
            path: '/api/users',
            oldValue: 'email',
            newValue: 'emailAddress',
            impact: 'medium' as any,
            description: 'Field renamed from email to emailAddress',
          },
        ],
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('field_renamed');
      expect(prompt).toContain('email');
      expect(prompt).toContain('emailAddress');
    });

    it('should include original test code', () => {
      const testCode = 'test("my test", async () => { expect(true).toBe(true); })';
      const context = createMockContext({ originalTestCode: testCode });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain(testCode);
    });

    it('should include current spec', () => {
      const spec = { paths: { '/api/users': { get: { responses: {} } } } };
      const context = createMockContext({ currentSpec: spec });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('/api/users');
    });

    it('should include additional context when provided', () => {
      const context = createMockContext({
        additionalContext: 'API version changed from v1 to v2',
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('API version changed from v1 to v2');
    });

    it('should exclude spec changes when config disabled', () => {
      const config: PromptConfig = {
        includeSpecChanges: false,
        includeOriginalCode: true,
        includeFailureAnalysis: true,
      };
      promptBuilder = new PromptBuilder(config);

      const context = createMockContext({
        specChanges: [
          {
            type: 'field_added' as any,
            path: '/test',
            oldValue: null,
            newValue: 'test',
            impact: 'low' as any,
            description: 'test',
          },
        ],
      });
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).not.toContain('API Specification Changes');
    });

    it('should exclude original code when config disabled', () => {
      const config: PromptConfig = {
        includeSpecChanges: true,
        includeOriginalCode: false,
        includeFailureAnalysis: true,
      };
      promptBuilder = new PromptBuilder(config);

      const context = createMockContext();
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).not.toContain('Original Test Code');
    });

    it('should update config with updateConfig', () => {
      promptBuilder.updateConfig({ customInstructions: 'Use specific naming convention' });
      const context = createMockContext();
      const prompt = promptBuilder.buildRegenerationPrompt(context);

      expect(prompt).toContain('Use specific naming convention');
    });
  });
});

describe('TestRegenerator', () => {
  let regenerator: TestRegenerator;
  let mockClient: MockOpenAIClient;
  let promptBuilder: PromptBuilder;
  let config: OpenAIConfig;

  beforeEach(() => {
    mockClient = new MockOpenAIClient();
    promptBuilder = new PromptBuilder();
    config = {
      apiKey: 'test-key',
      model: 'gpt-4',
      timeout: 30000,
    };
    regenerator = new TestRegenerator(mockClient, promptBuilder, config);
  });

  describe('regenerateTest', () => {
    it('should successfully regenerate test', async () => {
      const context = createMockContext();
      const result = await regenerator.regenerateTest(context);

      expect(result.success).toBe(true);
      expect(result.regeneratedCode).toBeDefined();
      expect(result.modelUsed).toBe('gpt-4');
    });

    it('should track regeneration metrics', async () => {
      const context = createMockContext();
      await regenerator.regenerateTest(context);

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successful).toBe(1);
    });

    it('should handle AI API errors', async () => {
      mockClient.setMockResponse('default', {
        text: '',
        tokensUsed: 0,
      });

      const context = createMockContext();
      const result = await regenerator.regenerateTest(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track failed attempts in metrics', async () => {
      mockClient.setMockResponse('default', {
        text: 'no code here',
        tokensUsed: 0,
      });

      const context = createMockContext();
      await regenerator.regenerateTest(context);

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.failed).toBe(1);
    });

    it('should log regeneration attempts', async () => {
      const context = createMockContext();
      await regenerator.regenerateTest(context);

      const log = regenerator.getRegenerationLog();
      expect(log).toHaveLength(1);
      expect(log[0]?.context.testName).toBe(context.testName);
    });
  });

  describe('parseAIResponse', () => {
    it('should parse TypeScript code block', () => {
      const response = '```typescript\nconst x = 1;\n```';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.found).toBe(true);
      expect(parsed.code).toBe('const x = 1;');
      expect(parsed.language).toBe('typescript');
      expect(parsed.confidence).toBeGreaterThan(0.9);
    });

    it('should parse JavaScript code block', () => {
      const response = '```javascript\nconst x = 1;\n```';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.found).toBe(true);
      expect(parsed.language).toBe('javascript');
    });

    it('should parse generic code block', () => {
      const response = '```\nconst x = 1;\n```';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.found).toBe(true);
      expect(parsed.language).toBe('unknown');
    });

    it('should detect code without markdown blocks', () => {
      const response = 'import test from "test";\ntest("x", () => {});';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.found).toBe(true);
      expect(parsed.confidence).toBeLessThan(0.9);
    });

    it('should return not found for plain text', () => {
      const response = 'This is just plain text without code';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.found).toBe(false);
      expect(parsed.confidence).toBe(0);
    });

    it('should handle multiple code blocks (use first)', () => {
      const response = '```typescript\nfirst\n```\n\n```typescript\nsecond\n```';
      const parsed = regenerator.parseAIResponse(response);

      expect(parsed.code).toBe('first');
    });
  });

  describe('extractTestCode', () => {
    it('should extract clean test code', () => {
      const code = '  test("x", () => {});  ';
      const extracted = regenerator.extractTestCode(code);

      expect(extracted).toContain('test("x", () => {});');
    });

    it('should remove markdown artifacts', () => {
      const code = '```typescript\ntest("x", () => {});\n```';
      const extracted = regenerator.extractTestCode(code);

      expect(extracted).not.toContain('```');
    });

    it('should add Playwright imports if missing', () => {
      const code = 'test("x", async () => {});';
      const extracted = regenerator.extractTestCode(code);

      expect(extracted).toContain("import { test, expect } from '@playwright/test'");
    });

    it('should not duplicate imports', () => {
      const code = "import { test, expect } from '@playwright/test';\ntest('x', () => {});";
      const extracted = regenerator.extractTestCode(code);

      const importCount = (extracted.match(/import { test, expect }/g) || []).length;
      expect(importCount).toBe(1);
    });
  });

  describe('trackSuccessRate', () => {
    it('should track overall success rate', async () => {
      mockClient.setMockResponse('default', {
        text: '```typescript\nimport { test } from "@playwright/test";\ntest("x", () => {});\n```',
        tokensUsed: 100,
      });

      await regenerator.regenerateTest(createMockContext());
      await regenerator.regenerateTest(createMockContext());

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.rate).toBe(1.0);
    });

    it('should track success by failure type', async () => {
      const context1 = createMockContext({ failureType: 'field_missing' as FailureType });
      const context2 = createMockContext({ failureType: 'type_mismatch' as FailureType });

      await regenerator.regenerateTest(context1);
      await regenerator.regenerateTest(context2);

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.byFailureType).toBeDefined();
    });

    it('should calculate correct rates with mixed results', async () => {
      // Success
      mockClient.setMockResponse('default', {
        text: '```typescript\nimport { test } from "@playwright/test";\ntest("x", () => {});\n```',
        tokensUsed: 100,
      });
      await regenerator.regenerateTest(createMockContext());

      // Failure
      mockClient.setMockResponse('default', {
        text: 'no code',
        tokensUsed: 0,
      });
      await regenerator.regenerateTest(createMockContext());

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.rate).toBe(0.5);
    });
  });

  describe('clearMetrics', () => {
    it('should reset all metrics', async () => {
      await regenerator.regenerateTest(createMockContext());
      regenerator.clearMetrics();

      const metrics = regenerator.trackSuccessRate();
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.successful).toBe(0);
    });

    it('should clear regeneration log', async () => {
      await regenerator.regenerateTest(createMockContext());
      regenerator.clearMetrics();

      const log = regenerator.getRegenerationLog();
      expect(log).toHaveLength(0);
    });
  });
});

describe('Integration: PromptBuilder + TestRegenerator', () => {
  it('should use prompt builder in regeneration flow', async () => {
    const mockClient = new MockOpenAIClient();
    const promptBuilder = new PromptBuilder({
      includeSpecChanges: true,
      includeOriginalCode: true,
      includeFailureAnalysis: true,
      customInstructions: 'Use async/await',
    });
    const config: OpenAIConfig = {
      apiKey: 'test',
      model: 'gpt-4',
    };

    const regenerator = new TestRegenerator(mockClient, promptBuilder, config);
    const context = createMockContext();

    const result = await regenerator.regenerateTest(context);
    expect(result.success).toBe(true);
  });
});

// Helper function to create mock context
function createMockContext(overrides: any = {}): RegenerationContext {
  const testResult: TestResult = {
    id: 'test-1',
    name: 'Test API endpoint',
    filePath: '/tmp/test.spec.ts',
    status: 'failed' as TestStatus,
    duration: 1000,
    retries: 0,
    startTime: new Date(),
    endTime: new Date(),
    error: {
      message: 'Expected field not found',
      type: 'assertion' as any,
    },
  };

  const failureAnalysis: FailureAnalysis = {
    testResult,
    failureType: overrides.failureType || ('field_missing' as FailureType),
    rootCause: overrides.rootCause || 'Field missing in response',
    relatedChanges: [],
    healable: true,
    confidence: 0.9,
    suggestedFix: overrides.suggestedFix,
    analyzedAt: new Date(),
    metadata: {},
  };

  return {
    testFilePath: '/tmp/test.spec.ts',
    testName: overrides.testName || 'Test API endpoint',
    failureAnalysis,
    currentSpec: overrides.currentSpec || {},
    originalTestCode: overrides.originalTestCode || 'test("x", () => {})',
    specChanges: overrides.specChanges || [],
    additionalContext: overrides.additionalContext,
  };
}
