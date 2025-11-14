/**
 * Prompt Engineering Rules
 * Centralized rules based on docs/prompt-engineering.md
 *
 * This module provides shared prompt engineering guidelines for all AI components
 * to ensure consistent, high-quality outputs across test generation and repair.
 */

/**
 * Core principles for effective prompt engineering
 */
export const CORE_PRINCIPLES = {
  CONTEXT_RICH: 'Provide comprehensive context including all relevant information',
  INTENT_PRESERVATION: 'Maintain the original purpose and business logic',
  FORMAT_CONTROL: 'Return ONLY code without explanations or markdown',
  FEW_SHOT_LEARNING: 'Learn from provided examples of successful patterns',
  SPECIFICITY: 'Focus only on relevant information to reduce noise',
} as const;

/**
 * Requirements for test repair operations
 */
export const TEST_REPAIR_REQUIREMENTS = [
  'Preserve Test Intent: Must verify the same business logic',
  'Update API Calls: Adapt to new endpoints, parameters, and formats',
  'Maintain Code Quality: Follow Playwright and TypeScript best practices',
  'Handle All Changes: Address all identified breaking changes',
  'Keep Test Structure: Maintain organization unless restructuring needed',
  'Use TypeScript: Ensure valid, compile-ready TypeScript code',
  'Error Handling: Add appropriate error handling for new cases',
] as const;

/**
 * Requirements for test generation operations
 */
export const TEST_GENERATION_REQUIREMENTS = [
  'Business Logic: Test domain constraints and business rules',
  'Security: Validate authentication, authorization, and OWASP Top 10',
  'Workflow Dependencies: Test relationships between endpoints',
  'Edge Cases: Cover realistic failure scenarios and boundary conditions',
  'Code Quality: Follow Playwright best practices and TypeScript standards',
  'Implicit Requirements: Consider requirements not explicitly in the spec',
  'Maintainability: Generate clear, well-structured, readable tests',
] as const;

/**
 * Output format rules for AI responses
 */
export const OUTPUT_FORMAT_RULES = `
Return ONLY the complete code in TypeScript.
Do NOT include:
- Explanations or descriptions
- Comments about what changed
- Markdown code fences (\`\`\`)
- Any text before or after the code

The output must be valid TypeScript that can be directly written to a file.
`;

/**
 * Few-shot examples for test repair scenarios
 */
export const FEW_SHOT_REPAIR_EXAMPLES = {
  ENDPOINT_PATH_CHANGE: {
    description: 'Endpoint path changed from /api/users to /api/v2/users',
    original: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/users/123');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.id).toBe(123);
  expect(data.name).toBeDefined();
});`,
    failure: 'Error: 404 Not Found at /api/users/123\nExpected status 200, received 404',
    apiChanges: 'Endpoint changed from /api/users/{id} to /api/v2/users/{id}',
    repaired: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/v2/users/123');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.id).toBe(123);
  expect(data.name).toBeDefined();
});`,
  },
  REQUIRED_PARAMETER: {
    description: 'New required field authorId added',
    original: `import { test, expect } from '@playwright/test';

test('should create new post', async ({ request }) => {
  const response = await request.post('/api/posts', {
    data: {
      title: 'Test Post',
      content: 'This is test content'
    }
  });
  expect(response.status()).toBe(201);
  const post = await response.json();
  expect(post.title).toBe('Test Post');
});`,
    failure: 'Error: 400 Bad Request\nMissing required field: authorId',
    apiChanges: 'Added required field "authorId" to POST /api/posts request body',
    repaired: `import { test, expect } from '@playwright/test';

test('should create new post', async ({ request }) => {
  const response = await request.post('/api/posts', {
    data: {
      title: 'Test Post',
      content: 'This is test content',
      authorId: 1
    }
  });
  expect(response.status()).toBe(201);
  const post = await response.json();
  expect(post.title).toBe('Test Post');
  expect(post.authorId).toBe(1);
});`,
  },
  AUTHENTICATION_REQUIRED: {
    description: 'Endpoint now requires authentication',
    original: `import { test, expect } from '@playwright/test';

test('should list all products', async ({ request }) => {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(200);
  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
});`,
    failure: 'Error: 401 Unauthorized\nAuthentication required',
    apiChanges: 'Endpoint /api/products now requires Authorization header with Bearer token',
    repaired: `import { test, expect } from '@playwright/test';

test('should list all products', async ({ request }) => {
  const response = await request.get('/api/products', {
    headers: {
      'Authorization': 'Bearer test-token-123'
    }
  });
  expect(response.status()).toBe(200);
  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
});`,
  },
  RESPONSE_STRUCTURE_CHANGE: {
    description: 'Response structure wrapped in data field',
    original: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/v2/users/123');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.id).toBe(123);
  expect(body.name).toBeDefined();
});`,
    failure: 'TypeError: Cannot read property "id" of undefined',
    apiChanges: 'Response now wraps user data in a "data" field and adds "version" field',
    repaired: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/v2/users/123');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.id).toBe(123);
  expect(body.data.name).toBeDefined();
  expect(body.version).toBeDefined();
});`,
  },
  QUERY_PARAMETER_RENAME: {
    description: 'Query parameter renamed from sort to orderBy',
    original: `import { test, expect } from '@playwright/test';

test('should list users sorted by name', async ({ request }) => {
  const response = await request.get('/api/users?sort=name');
  expect(response.status()).toBe(200);
  const users = await response.json();
  expect(Array.isArray(users)).toBe(true);
});`,
    failure: 'Error: 400 Bad Request\nUnknown query parameter: sort',
    apiChanges: 'Query parameter "sort" renamed to "orderBy"',
    repaired: `import { test, expect } from '@playwright/test';

test('should list users sorted by name', async ({ request }) => {
  const response = await request.get('/api/users?orderBy=name');
  expect(response.status()).toBe(200);
  const users = await response.json();
  expect(Array.isArray(users)).toBe(true);
});`,
  },
} as const;

/**
 * Format few-shot examples for prompt inclusion (test repair)
 */
export function formatFewShotRepairExamples(): string {
  return Object.entries(FEW_SHOT_REPAIR_EXAMPLES)
    .map(
      ([_key, example]) => `
### Example: ${example.description}

**Original Test:**
\`\`\`typescript
${example.original}
\`\`\`

**Failure:** ${example.failure}

**API Changes:** ${example.apiChanges}

**Repaired Test:**
\`\`\`typescript
${example.repaired}
\`\`\`
    `
    )
    .join('\n');
}

/**
 * Get comprehensive prompt engineering rules for test repair
 */
export function getTestRepairPromptRules(): string {
  return `
PROMPT ENGINEERING RULES (from docs/prompt-engineering.md):

Core Principles:
1. Context-Rich: Provide comprehensive context including original test, failure details, and API changes
2. Intent Preservation: Maintain the original test's business logic intent
3. Format Control: Return ONLY valid TypeScript code without explanations
4. Few-Shot Learning: Learn from provided examples of successful repairs
5. Specificity: Focus only on relevant spec sections

Test Repair Requirements:
${TEST_REPAIR_REQUIREMENTS.map((req, i) => `${i + 1}. **${req}**`).join('\n')}

${OUTPUT_FORMAT_RULES}
  `.trim();
}

/**
 * Get comprehensive prompt engineering rules for test generation
 */
export function getTestGenerationPromptRules(): string {
  return `
PROMPT ENGINEERING RULES (from docs/prompt-engineering.md):

Core Principles:
1. Context-Rich: Provide comprehensive context about the API and its domain
2. Intent Clarity: Generate tests that clearly express their purpose
3. Format Control: Return ONLY valid TypeScript code without explanations
4. Few-Shot Learning: Learn from provided examples of high-quality tests
5. Specificity: Focus on the most important test scenarios

Test Generation Requirements:
${TEST_GENERATION_REQUIREMENTS.map((req, i) => `${i + 1}. **${req}**`).join('\n')}

${OUTPUT_FORMAT_RULES}
  `.trim();
}

/**
 * Token optimization guidelines
 */
export const TOKEN_OPTIMIZATION = {
  selectiveContext: 'Only include relevant spec sections',
  structuredFormat: 'Use clear sections for easy parsing',
  conciseExamples: 'Focus examples on key patterns',
  minimalRedundancy: 'Avoid repeating information',
  efficientEncoding: 'Use JSON for structured data',
} as const;

/**
 * Quality indicators for AI-generated outputs
 */
export const QUALITY_INDICATORS = {
  highQuality: [
    'Compiles without errors',
    'Passes on first run',
    'Maintains test structure',
    'Uses appropriate test data',
    'Follows code style',
    'Includes necessary error handling',
  ],
  lowQuality: [
    'Contains syntax errors',
    'Fails with same or different error',
    'Changes test intent',
    'Uses production data in tests',
    'Ignores some API changes',
  ],
} as const;
