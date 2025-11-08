/**
 * Demo: Prompt Generation for Test Repair
 *
 * This demonstrates how to use the PromptBuilder to generate
 * AI prompts for repairing failing tests.
 */

import { PromptBuilder, type PromptContext } from '../src/ai/prompt-builder.js';

// Example: A test that failed due to API changes
const exampleContext: PromptContext = {
  originalTestCode: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/users/123');
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.id).toBe(123);
  expect(data.name).toBeDefined();
  expect(data.email).toBeDefined();
});`,

  failureAnalysis: {
    error: 'RequestError',
    statusCode: 404,
    expectedStatus: 200,
    errorMessage: 'Not Found: The endpoint /api/users/123 does not exist',
    timestamp: Date.now(),
  },

  specDiff: {
    endpoint: '/api/users/{id}',
    changes: [
      {
        type: 'modified',
        field: 'path',
        oldValue: '/api/users/{id}',
        newValue: '/api/v2/users/{id}',
        description: 'Endpoint versioned to v2',
      },
      {
        type: 'modified',
        field: 'response',
        oldValue: '{ id, name, email }',
        newValue: '{ data: { id, name, email }, version }',
        description: 'Response wrapped in data object with version field',
      },
      {
        type: 'added',
        field: 'response.version',
        newValue: 'string',
        description: 'API version string added to response',
      },
    ],
    breakingChanges: [
      'Endpoint path changed from /api/users/{id} to /api/v2/users/{id}',
      'Response structure changed: data now wrapped in "data" field',
    ],
  },

  relevantSpec: {
    openapi: '3.0.0',
    paths: {
      '/api/v2/users/{id}': {
        get: {
          summary: 'Get user by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description: 'User found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                        },
                      },
                      version: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  includeFewShot: true,
  fewShotCount: 3,
};

// Generate the prompt
console.log('='.repeat(80));
console.log('DEMO: AI Prompt Generation for Test Repair');
console.log('='.repeat(80));
console.log();

const builder = new PromptBuilder();
const prompt = builder.buildTestRepairPrompt(exampleContext);

console.log('Generated Prompt:');
console.log('-'.repeat(80));
console.log(prompt);
console.log('-'.repeat(80));
console.log();

// Show builder state
const state = builder.getState();
console.log('Builder State:');
console.log(`- Original test: ${state.originalTestCode.length} characters`);
console.log(`- Failure info: ${state.failureInfo.length} characters`);
console.log(`- API changes: ${state.apiChanges.length} characters`);
console.log(`- Spec: ${state.relevantSpec.length} characters`);
console.log(`- Few-shot examples: ${state.fewShotCount}`);
console.log();

// Estimate token count
const tokenCount = builder.estimateTokenCount();
console.log(`Estimated tokens: ~${tokenCount} tokens`);
console.log(`Estimated cost: $${((tokenCount / 1000) * 0.03).toFixed(4)} (input only)`);
console.log();

// Validate
const validation = builder.validate();
console.log(`Validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
if (!validation.valid) {
  console.log(`Missing fields: ${validation.missing.join(', ')}`);
}
console.log();

console.log('='.repeat(80));
console.log('✅ Prompt generation complete!');
console.log('='.repeat(80));
