/**
 * Prompt templates for AI-powered test generation and repair
 *
 * Contains:
 * - Base templates for test repair
 * - Few-shot examples
 * - Section templates
 * - Formatting utilities
 */

/**
 * Few-shot example for test repair
 */
export interface FewShotExample {
  description: string;
  originalTest: string;
  failure: string;
  apiChanges: string;
  repairedTest: string;
}

/**
 * Template sections
 */
export interface TemplateSections {
  header: string;
  task: string;
  context: string;
  requirements: string;
  examples: string;
  output: string;
}

/**
 * Base template for test repair prompts
 */
export const BASE_TEMPLATE = `You are an expert test engineer specializing in API testing with Playwright.

Your task is to repair a failing test based on API specification changes.

# CONTEXT

## Original Test Code
\`\`\`typescript
{originalTestCode}
\`\`\`

## Test Failure
{failureInformation}

## API Changes
{apiChanges}

## Relevant API Specification
\`\`\`json
{relevantSpec}
\`\`\`

# REQUIREMENTS

1. **Preserve Test Intent**: The repaired test must verify the same business logic as the original
2. **Update API Calls**: Adapt to new endpoints, parameters, and request/response formats
3. **Maintain Code Quality**: Follow Playwright best practices and the existing code style
4. **Handle All Changes**: Address all breaking changes mentioned in the API changes section
5. **Keep Test Structure**: Maintain the same test organization and flow unless changes require restructuring

# OUTPUT FORMAT

Return ONLY the complete repaired test code in TypeScript.
Do NOT include explanations, comments about what changed, or markdown code fences.
The output should be valid TypeScript that can be directly written to a file.

{fewShotExamples}

# YOUR TASK

Repair the failing test based on the context above.`;

/**
 * Few-shot examples for test repair
 */
export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    description: 'Endpoint path change and response structure update',
    originalTest: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/users/123');
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.id).toBe(123);
  expect(data.name).toBeDefined();
});`,
    failure: `Error: 404 Not Found at /api/users/123
Expected status 200, received 404`,
    apiChanges: `- Endpoint changed from /api/users/{id} to /api/v2/users/{id}
- Response now includes user data wrapped in a 'data' field
- Added 'version' field to response`,
    repairedTest: `import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/v2/users/123');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.data.id).toBe(123);
  expect(body.data.name).toBeDefined();
  expect(body.version).toBeDefined();
});`,
  },
  {
    description: 'Required parameter added to request',
    originalTest: `import { test, expect } from '@playwright/test';

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
    failure: `Error: 400 Bad Request
Missing required field: authorId`,
    apiChanges: `- Added required field 'authorId' to POST /api/posts request body
- Field must be a valid user ID (number)`,
    repairedTest: `import { test, expect } from '@playwright/test';

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
  {
    description: 'Authentication requirement added',
    originalTest: `import { test, expect } from '@playwright/test';

test('should list all products', async ({ request }) => {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(200);

  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
});`,
    failure: `Error: 401 Unauthorized
Authentication required`,
    apiChanges: `- Endpoint /api/products now requires authentication
- Must include 'Authorization: Bearer <token>' header`,
    repairedTest: `import { test, expect } from '@playwright/test';

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
  {
    description: 'HTTP method change and parameter location change',
    originalTest: `import { test, expect } from '@playwright/test';

test('should delete user', async ({ request }) => {
  const response = await request.delete('/api/users/456');
  expect(response.status()).toBe(204);
});`,
    failure: `Error: 405 Method Not Allowed
DELETE method not supported`,
    apiChanges: `- Changed from DELETE to POST method
- User ID now passed in request body instead of path
- Endpoint changed to /api/users/delete`,
    repairedTest: `import { test, expect } from '@playwright/test';

test('should delete user', async ({ request }) => {
  const response = await request.post('/api/users/delete', {
    data: {
      userId: 456
    }
  });
  expect(response.status()).toBe(200);
});`,
  },
  {
    description: 'Query parameter renamed and validation added',
    originalTest: `import { test, expect } from '@playwright/test';

test('should search products', async ({ request }) => {
  const response = await request.get('/api/products/search?q=laptop');
  expect(response.status()).toBe(200);

  const results = await response.json();
  expect(results.length).toBeGreaterThan(0);
});`,
    failure: `Error: 400 Bad Request
Unknown query parameter: q
Expected: query`,
    apiChanges: `- Query parameter renamed from 'q' to 'query'
- Minimum length validation added (3 characters)
- Results now in 'items' field instead of root array`,
    repairedTest: `import { test, expect } from '@playwright/test';

test('should search products', async ({ request }) => {
  const response = await request.get('/api/products/search?query=laptop');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.items.length).toBeGreaterThan(0);
});`,
  },
];

/**
 * Template sections for building prompts
 */
export const TEMPLATE_SECTIONS: TemplateSections = {
  header: `You are an expert test engineer specializing in API testing with Playwright.

Your task is to repair a failing test based on API specification changes.`,

  task: `# YOUR TASK

Repair the failing test based on the context provided above.
Ensure the test maintains its original intent while adapting to the API changes.`,

  context: `# CONTEXT

## Original Test Code
\`\`\`typescript
{originalTestCode}
\`\`\`

## Test Failure
{failureInformation}

## API Changes
{apiChanges}

## Relevant API Specification
\`\`\`json
{relevantSpec}
\`\`\``,

  requirements: `# REQUIREMENTS

1. **Preserve Test Intent**: The repaired test must verify the same business logic as the original
2. **Update API Calls**: Adapt to new endpoints, parameters, and request/response formats
3. **Maintain Code Quality**: Follow Playwright best practices and the existing code style
4. **Handle All Changes**: Address all breaking changes mentioned in the API changes section
5. **Keep Test Structure**: Maintain the same test organization and flow unless changes require restructuring
6. **Use TypeScript**: Ensure all code is valid TypeScript with proper typing
7. **Error Handling**: Add appropriate error handling if the API changes introduce new error cases`,

  examples: `# EXAMPLES

Here are examples of successful test repairs:

{examples}`,

  output: `# OUTPUT FORMAT

Return ONLY the complete repaired test code in TypeScript.
Do NOT include:
- Explanations or descriptions
- Comments about what changed
- Markdown code fences (\`\`\`)
- Any text before or after the code

The output should be valid TypeScript that can be directly written to a file.`,
};

/**
 * Format the base template with context
 */
export function formatTemplate(context: {
  originalTestCode: string;
  failureInformation: string;
  apiChanges: string;
  relevantSpec: string;
  includeFewShot?: boolean;
  fewShotCount?: number;
}): string {
  let template = BASE_TEMPLATE;

  // Replace placeholders
  template = template.replace('{originalTestCode}', context.originalTestCode);
  template = template.replace('{failureInformation}', context.failureInformation);
  template = template.replace('{apiChanges}', context.apiChanges);
  template = template.replace('{relevantSpec}', context.relevantSpec);

  // Add few-shot examples if requested
  if (context.includeFewShot !== false) {
    const count = context.fewShotCount || 3;
    const examples = formatFewShotExamples(FEW_SHOT_EXAMPLES.slice(0, count));
    template = template.replace('{fewShotExamples}', `\n# EXAMPLES\n\n${examples}\n`);
  } else {
    template = template.replace('{fewShotExamples}', '');
  }

  return template;
}

/**
 * Format few-shot examples for inclusion in prompt
 */
export function formatFewShotExamples(examples: FewShotExample[]): string {
  return examples
    .map((example, index) => {
      return `## Example ${index + 1}: ${example.description}

### Original Test
\`\`\`typescript
${example.originalTest}
\`\`\`

### Failure
${example.failure}

### API Changes
${example.apiChanges}

### Repaired Test
\`\`\`typescript
${example.repairedTest}
\`\`\``;
    })
    .join('\n\n');
}

/**
 * Build a custom template from sections
 */
export function buildCustomTemplate(sections: Partial<TemplateSections>): string {
  const parts: string[] = [];

  if (sections.header) parts.push(sections.header);
  if (sections.context) parts.push(sections.context);
  if (sections.requirements) parts.push(sections.requirements);
  if (sections.examples) parts.push(sections.examples);
  if (sections.output) parts.push(sections.output);
  if (sections.task) parts.push(sections.task);

  return parts.join('\n\n');
}

/**
 * Extract code from AI response (remove markdown fences if present)
 */
export function extractCode(response: string): string {
  // Remove markdown code fences
  let code = response.trim();

  // Remove ```typescript or ```ts at start
  code = code.replace(/^```(?:typescript|ts)\n/, '');

  // Remove ``` at end
  code = code.replace(/\n```$/, '');

  return code.trim();
}

/**
 * Validate that response is valid TypeScript code
 */
export function isValidTypeScriptCode(code: string): boolean {
  // Basic validation checks
  if (!code || code.trim().length === 0) {
    return false;
  }

  // Should contain import statement
  if (!code.includes('import')) {
    return false;
  }

  // Should contain test function
  if (!code.includes('test(')) {
    return false;
  }

  // Should not contain markdown
  if (code.includes('```')) {
    return false;
  }

  return true;
}
