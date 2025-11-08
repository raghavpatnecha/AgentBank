/**
 * Tests for Prompt Builder
 *
 * Tests:
 * - Prompt construction
 * - Template formatting
 * - Context injection
 * - Few-shot examples
 * - Output format requirements
 * - Validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PromptBuilder,
  type PromptContext,
  type FailureAnalysis,
  type SpecDiff,
} from '../../src/ai/prompt-builder.js';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('Initialization', () => {
    it('should create a new builder', () => {
      expect(builder).toBeInstanceOf(PromptBuilder);
    });

    it('should have empty initial state', () => {
      const state = builder.getState();

      expect(state.originalTestCode).toBe('');
      expect(state.failureInfo).toBe('');
      expect(state.apiChanges).toBe('');
      expect(state.relevantSpec).toBe('');
      expect(state.fewShotCount).toBe(0);
    });
  });

  describe('Adding Original Test Code', () => {
    it('should add original test code', () => {
      const code = `import { test, expect } from '@playwright/test';

test('should get user', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.status()).toBe(200);
});`;

      builder.addOriginalTestCode(code);
      const state = builder.getState();

      expect(state.originalTestCode).toBe(code);
    });

    it('should trim whitespace from test code', () => {
      const code = '  test code  ';

      builder.addOriginalTestCode(code);
      const state = builder.getState();

      expect(state.originalTestCode).toBe('test code');
    });
  });

  describe('Adding Failure Information', () => {
    it('should add failure information', () => {
      const failure: FailureAnalysis = {
        error: 'RequestError',
        statusCode: 404,
        expectedStatus: 200,
        errorMessage: 'Not Found',
        timestamp: Date.now(),
      };

      builder.addFailureInformation(failure);
      const state = builder.getState();

      expect(state.failureInfo).toContain('RequestError');
      expect(state.failureInfo).toContain('404');
      expect(state.failureInfo).toContain('Not Found');
    });

    it('should include stack trace if provided', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        stackTrace: 'at line 1\nat line 2',
        timestamp: Date.now(),
      };

      builder.addFailureInformation(failure);
      const state = builder.getState();

      expect(state.failureInfo).toContain('Stack Trace');
      expect(state.failureInfo).toContain('at line 1');
    });

    it('should format timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp,
      };

      builder.addFailureInformation(failure);
      const state = builder.getState();

      expect(state.failureInfo).toContain('2024-01-15');
    });
  });

  describe('Adding Spec Changes', () => {
    it('should add spec changes', () => {
      const diff: SpecDiff = {
        endpoint: '/api/users/{id}',
        changes: [
          {
            type: 'modified',
            field: 'path',
            oldValue: '/api/users/{id}',
            newValue: '/api/v2/users/{id}',
            description: 'Endpoint path updated to v2',
          },
        ],
        breakingChanges: ['Endpoint path changed'],
      };

      builder.addSpecChanges(diff);
      const state = builder.getState();

      expect(state.apiChanges).toContain('/api/users/{id}');
      expect(state.apiChanges).toContain('Breaking Changes');
      expect(state.apiChanges).toContain('Endpoint path changed');
    });

    it('should group changes by type', () => {
      const diff: SpecDiff = {
        endpoint: '/api/posts',
        changes: [
          {
            type: 'added',
            field: 'authorId',
            newValue: 'number',
            description: 'Required author ID',
          },
          {
            type: 'removed',
            field: 'userId',
            oldValue: 'number',
            description: 'Replaced by authorId',
          },
          {
            type: 'modified',
            field: 'title',
            oldValue: 'optional',
            newValue: 'required',
            description: 'Title is now required',
          },
        ],
        breakingChanges: [],
      };

      builder.addSpecChanges(diff);
      const state = builder.getState();

      expect(state.apiChanges).toContain('*Added:*');
      expect(state.apiChanges).toContain('*Removed:*');
      expect(state.apiChanges).toContain('*Modified:*');
      expect(state.apiChanges).toContain('authorId');
      expect(state.apiChanges).toContain('userId');
      expect(state.apiChanges).toContain('title');
    });

    it('should include values in changes', () => {
      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [
          {
            type: 'modified',
            field: 'method',
            oldValue: 'GET',
            newValue: 'POST',
            description: 'Method changed',
          },
        ],
        breakingChanges: [],
      };

      builder.addSpecChanges(diff);
      const state = builder.getState();

      expect(state.apiChanges).toContain('GET');
      expect(state.apiChanges).toContain('POST');
    });
  });

  describe('Adding Relevant Spec', () => {
    it('should add relevant spec section', () => {
      const spec = {
        path: '/api/users/{id}',
        method: 'GET',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
      };

      builder.addRelevantSpecSection(spec);
      const state = builder.getState();

      expect(state.relevantSpec).toContain('/api/users/{id}');
      expect(state.relevantSpec).toContain('GET');
    });

    it('should format spec as JSON', () => {
      const spec = { key: 'value' };

      builder.addRelevantSpecSection(spec);
      const state = builder.getState();

      expect(state.relevantSpec).toContain('"key"');
      expect(state.relevantSpec).toContain('"value"');
    });
  });

  describe('Adding Few-Shot Examples', () => {
    it('should add few-shot examples', () => {
      builder.addFewShotExamples(3);
      const state = builder.getState();

      expect(state.fewShotCount).toBe(3);
    });

    it('should limit examples to requested count', () => {
      builder.addFewShotExamples(2);
      const state = builder.getState();

      expect(state.fewShotCount).toBe(2);
    });

    it('should use default count if not specified', () => {
      builder.addFewShotExamples();
      const state = builder.getState();

      expect(state.fewShotCount).toBe(3);
    });
  });

  describe('Building Prompt', () => {
    it('should build complete prompt', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Test failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('test code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({ path: '/api/test' });

      const prompt = builder.build();

      expect(prompt).toContain('test code');
      expect(prompt).toContain('Test failed');
      expect(prompt).toContain('/api/test');
    });

    it('should include few-shot examples when added', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({});
      builder.addFewShotExamples(2);

      const prompt = builder.build();

      expect(prompt).toContain('# EXAMPLES');
      expect(prompt).toContain('Example 1');
    });

    it('should not include examples when not added', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({});

      const prompt = builder.build();

      expect(prompt).not.toContain('# EXAMPLES');
    });
  });

  describe('Validation', () => {
    it('should validate complete builder', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({});

      const validation = builder.validate();

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should detect missing fields', () => {
      const validation = builder.validate();

      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('originalTestCode');
      expect(validation.missing).toContain('failureInformation');
      expect(validation.missing).toContain('apiChanges');
      expect(validation.missing).toContain('relevantSpec');
    });

    it('should detect partially complete builder', () => {
      builder.addOriginalTestCode('code');

      const validation = builder.validate();

      expect(validation.valid).toBe(false);
      expect(validation.missing).not.toContain('originalTestCode');
      expect(validation.missing).toContain('failureInformation');
    });
  });

  describe('Reset', () => {
    it('should reset builder state', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({});
      builder.addFewShotExamples(3);

      builder.reset();

      const state = builder.getState();

      expect(state.originalTestCode).toBe('');
      expect(state.failureInfo).toBe('');
      expect(state.apiChanges).toBe('');
      expect(state.relevantSpec).toBe('');
      expect(state.fewShotCount).toBe(0);
    });
  });

  describe('Build Test Repair Prompt', () => {
    it('should build prompt from context', () => {
      const context: PromptContext = {
        originalTestCode: 'test code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: { path: '/api/test' },
      };

      const prompt = builder.buildTestRepairPrompt(context);

      expect(prompt).toContain('test code');
      expect(prompt).toContain('Failed');
      expect(prompt).toContain('/api/test');
    });

    it('should include few-shot examples by default', () => {
      const context: PromptContext = {
        originalTestCode: 'code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: {},
      };

      const prompt = builder.buildTestRepairPrompt(context);

      expect(prompt).toContain('# EXAMPLES');
    });

    it('should exclude few-shot examples when requested', () => {
      const context: PromptContext = {
        originalTestCode: 'code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: {},
        includeFewShot: false,
      };

      const prompt = builder.buildTestRepairPrompt(context);

      expect(prompt).not.toContain('# EXAMPLES');
    });

    it('should use custom few-shot count', () => {
      const context: PromptContext = {
        originalTestCode: 'code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: {},
        fewShotCount: 5,
      };

      builder.buildTestRepairPrompt(context);
      const state = builder.getState();

      expect(state.fewShotCount).toBe(5);
    });
  });

  describe('Build Minimal Prompt', () => {
    it('should build prompt without examples', () => {
      const context: PromptContext = {
        originalTestCode: 'code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: {},
      };

      const prompt = builder.buildMinimalPrompt(context);

      expect(prompt).not.toContain('# EXAMPLES');
      expect(prompt).toContain('code');
    });
  });

  describe('From Context', () => {
    it('should create builder from context', () => {
      const context: PromptContext = {
        originalTestCode: 'test code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: { path: '/api/test' },
      };

      const newBuilder = PromptBuilder.fromContext(context);
      const state = newBuilder.getState();

      expect(state.originalTestCode).toBe('test code');
      expect(state.fewShotCount).toBe(3);
    });

    it('should respect includeFewShot option', () => {
      const context: PromptContext = {
        originalTestCode: 'code',
        failureAnalysis: {
          error: 'Error',
          errorMessage: 'Failed',
          timestamp: Date.now(),
        },
        specDiff: {
          endpoint: '/api/test',
          changes: [],
          breakingChanges: [],
        },
        relevantSpec: {},
        includeFewShot: false,
      };

      const newBuilder = PromptBuilder.fromContext(context);
      const state = newBuilder.getState();

      expect(state.fewShotCount).toBe(0);
    });
  });

  describe('Token Estimation', () => {
    it('should estimate token count', () => {
      const failure: FailureAnalysis = {
        error: 'Error',
        errorMessage: 'Failed',
        timestamp: Date.now(),
      };

      const diff: SpecDiff = {
        endpoint: '/api/test',
        changes: [],
        breakingChanges: [],
      };

      builder.addOriginalTestCode('test code');
      builder.addFailureInformation(failure);
      builder.addSpecChanges(diff);
      builder.addRelevantSpecSection({});

      const tokenCount = builder.estimateTokenCount();

      expect(tokenCount).toBeGreaterThan(0);
    });

    it('should increase with more content', () => {
      const shortBuilder = new PromptBuilder();
      shortBuilder.addOriginalTestCode('short');

      const longBuilder = new PromptBuilder();
      longBuilder.addOriginalTestCode('long '.repeat(100));

      expect(longBuilder.estimateTokenCount()).toBeGreaterThan(shortBuilder.estimateTokenCount());
    });
  });
});
