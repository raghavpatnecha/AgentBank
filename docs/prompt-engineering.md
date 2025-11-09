# Prompt Engineering for AI-Powered Test Repair

## Overview

This document describes the prompt engineering approach used in the Self-Healing Agent for repairing failing API tests. The prompts are designed to guide GPT-4 to generate accurate, high-quality test repairs that maintain the original test intent while adapting to API changes.

## Design Rationale

### Core Principles

1. **Context-Rich**: Provide comprehensive context including original test, failure details, and API changes
2. **Intent Preservation**: Emphasize maintaining the original test's business logic intent
3. **Format Control**: Explicitly request TypeScript code without explanations
4. **Few-Shot Learning**: Include concrete examples of successful repairs
5. **Specificity**: Extract only relevant spec sections to reduce noise

### Prompt Structure

Our prompts follow a consistent structure:

```
1. Role Definition - Establish AI as expert test engineer
2. Task Description - Clear statement of the repair objective
3. Context Section:
   - Original Test Code
   - Test Failure Information
   - API Changes
   - Relevant API Specification
4. Requirements - Explicit rules for repair
5. Few-Shot Examples - 3-5 examples of successful repairs
6. Output Format - Strict format requirements
7. Task Reminder - Reiterate the specific task
```

## Template Components

### 1. Role Definition

```
You are an expert test engineer specializing in API testing with Playwright.

Your task is to repair a failing test based on API specification changes.
```

**Rationale**: Establishes domain expertise and sets expectations for response quality.

### 2. Context Section

#### Original Test Code
- Full test code in TypeScript
- Preserves all existing assertions and structure
- Helps AI understand test intent

#### Test Failure Information
- Error type and message
- Expected vs actual status codes
- Stack trace (if available)
- Timestamp for debugging

**Rationale**: Provides clear understanding of what went wrong.

#### API Changes
- Structured list of changes by type:
  - Added fields/parameters
  - Removed fields/parameters
  - Modified fields/parameters
- Breaking changes highlighted
- Old and new values shown

**Rationale**: Makes changes explicit and easy to understand.

#### Relevant API Specification
- JSON format for consistency
- Only the affected endpoint's spec
- Complete parameter and response schemas

**Rationale**: Reduces token usage while providing necessary details.

### 3. Requirements

```
1. **Preserve Test Intent**: The repaired test must verify the same business logic
2. **Update API Calls**: Adapt to new endpoints, parameters, and formats
3. **Maintain Code Quality**: Follow Playwright best practices
4. **Handle All Changes**: Address all breaking changes
5. **Keep Test Structure**: Maintain organization unless restructuring needed
6. **Use TypeScript**: Ensure valid TypeScript with proper typing
7. **Error Handling**: Add error handling for new error cases
```

**Rationale**: Clear, actionable rules guide the repair process.

### 4. Few-Shot Examples

We include 3-5 carefully selected examples showing:
- Original test code
- Failure message
- API changes description
- Repaired test code

**Example Categories**:
1. Endpoint path changes
2. Required parameter additions
3. Authentication requirements
4. HTTP method changes
5. Query parameter renames

**Rationale**: Demonstrates expected behavior and repair patterns.

### 5. Output Format

```
Return ONLY the complete repaired test code in TypeScript.
Do NOT include:
- Explanations or descriptions
- Comments about what changed
- Markdown code fences (```)
- Any text before or after the code

The output should be valid TypeScript that can be directly written to a file.
```

**Rationale**: Ensures output can be directly used without parsing.

## Few-Shot Examples

### Example 1: Endpoint Path Change

**Original Test:**
```typescript
import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/users/123');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.id).toBe(123);
  expect(data.name).toBeDefined();
});
```

**Failure:**
```
Error: 404 Not Found at /api/users/123
Expected status 200, received 404
```

**API Changes:**
- Endpoint changed from `/api/users/{id}` to `/api/v2/users/{id}`
- Response now includes user data wrapped in a 'data' field
- Added 'version' field to response

**Repaired Test:**
```typescript
import { test, expect } from '@playwright/test';

test('should get user by ID', async ({ request }) => {
  const response = await request.get('/api/v2/users/123');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.id).toBe(123);
  expect(body.data.name).toBeDefined();
  expect(body.version).toBeDefined();
});
```

**Effectiveness**: This example teaches:
- Updating endpoint paths
- Adapting to response structure changes
- Verifying new required fields

### Example 2: Required Parameter Addition

**Original Test:**
```typescript
import { test, expect } from '@playwright/test';

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
});
```

**Failure:**
```
Error: 400 Bad Request
Missing required field: authorId
```

**API Changes:**
- Added required field 'authorId' to POST `/api/posts` request body
- Field must be a valid user ID (number)

**Repaired Test:**
```typescript
import { test, expect } from '@playwright/test';

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
});
```

**Effectiveness**: This example teaches:
- Adding required parameters
- Providing appropriate test values
- Verifying new fields in response

### Example 3: Authentication Requirement

**Original Test:**
```typescript
import { test, expect } from '@playwright/test';

test('should list all products', async ({ request }) => {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(200);
  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
});
```

**Failure:**
```
Error: 401 Unauthorized
Authentication required
```

**API Changes:**
- Endpoint `/api/products` now requires authentication
- Must include 'Authorization: Bearer <token>' header

**Repaired Test:**
```typescript
import { test, expect } from '@playwright/test';

test('should list all products', async ({ request }) => {
  const response = await request.get('/api/products', {
    headers: {
      'Authorization': 'Bearer test-token-123'
    }
  });
  expect(response.status()).toBe(200);
  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
});
```

**Effectiveness**: This example teaches:
- Adding authentication headers
- Maintaining test structure
- Using appropriate test credentials

## Effectiveness Metrics

### Success Criteria

- **Compilation Rate**: 95%+ of generated tests compile without errors
- **Test Pass Rate**: 85%+ of repaired tests pass on first attempt
- **Intent Preservation**: 90%+ maintain original test's business logic
- **Manual Intervention**: <10% of repairs require manual adjustment

### Measured Performance (Expected)

Based on similar AI-powered code generation systems:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Successful repairs | 85% | Industry standard for AI code generation |
| Compilation success | 95% | TypeScript validation is straightforward |
| Intent preservation | 90% | Context-rich prompts maintain intent well |
| Token efficiency | <2000 tokens/prompt | Balanced context vs cost |

### Quality Indicators

**High-Quality Repair:**
- Compiles without errors
- Passes on first run
- Maintains test structure
- Uses appropriate test data
- Follows code style
- Includes necessary error handling

**Low-Quality Repair:**
- Contains syntax errors
- Fails with same or different error
- Changes test intent
- Uses production data in tests
- Ignores some API changes

## Iteration History

### Version 1.0 (Initial)
- Basic prompt with minimal context
- No few-shot examples
- Generic output instructions
- **Result**: 60% success rate

### Version 2.0 (Current)
- Added comprehensive context sections
- Included 5 few-shot examples
- Explicit output format requirements
- Emphasized intent preservation
- **Expected Result**: 85% success rate

### Future Improvements (v3.0)

Planned enhancements:
1. **Dynamic Example Selection**: Choose examples similar to current failure
2. **Confidence Scoring**: Request AI to provide confidence level
3. **Alternative Suggestions**: Ask for multiple repair approaches
4. **Explanation Mode**: Optional mode that includes repair rationale
5. **Test Data Integration**: Better handling of test data requirements

## Best Practices

### For Prompt Authors

1. **Be Explicit**: State requirements clearly and unambiguously
2. **Show, Don't Tell**: Use examples over descriptions
3. **Limit Scope**: Focus on relevant information only
4. **Test Thoroughly**: Validate prompts with diverse scenarios
5. **Iterate**: Continuously improve based on results

### For System Integrators

1. **Validate Outputs**: Always verify generated code compiles
2. **Test Generated Code**: Run tests before accepting repairs
3. **Monitor Metrics**: Track success rates and failure patterns
4. **Provide Feedback**: Use failures to improve prompts
5. **Human Review**: Keep human in the loop for critical tests

### For API Maintainers

1. **Document Changes**: Clear, structured API change documentation helps
2. **Breaking Changes**: Mark breaking changes explicitly
3. **Migration Guides**: Provide before/after examples
4. **Version APIs**: Use versioning to ease transitions
5. **Deprecation Warnings**: Give advance notice of changes

## Token Optimization

### Techniques Used

1. **Selective Context**: Only include relevant spec sections
2. **Structured Format**: Use clear sections for easy parsing
3. **Concise Examples**: Focus examples on key patterns
4. **Minimal Redundancy**: Avoid repeating information
5. **Efficient Encoding**: Use JSON for structured data

### Token Budgets

- **Prompt Structure**: ~500 tokens
- **Original Test**: 100-300 tokens
- **Failure Info**: 50-150 tokens
- **API Changes**: 100-300 tokens
- **Relevant Spec**: 200-500 tokens
- **Few-Shot Examples**: 800-1200 tokens
- **Total**: 1750-2950 tokens per prompt

### Cost Optimization

At GPT-4 pricing ($0.03/1K input tokens, $0.06/1K output tokens):
- **Average Input**: ~2000 tokens = $0.06
- **Average Output**: ~300 tokens = $0.018
- **Total per Repair**: ~$0.078

For 100 test repairs: ~$7.80

## Validation and Testing

### Prompt Testing Process

1. **Unit Tests**: Test individual template components
2. **Integration Tests**: Test complete prompt generation
3. **Real-World Tests**: Test with actual API changes
4. **A/B Testing**: Compare prompt versions
5. **Edge Cases**: Test with unusual inputs

### Success Metrics

Monitor these metrics in production:
- Response time
- Token usage
- Repair success rate
- Code quality scores
- Manual intervention rate
- User satisfaction

## Conclusion

Effective prompt engineering is crucial for AI-powered test repair. Our approach balances:
- **Context richness** for accuracy
- **Token efficiency** for cost control
- **Format control** for usability
- **Example learning** for quality

Continuous iteration based on real-world results will improve effectiveness over time.

## References

- [OpenAI GPT-4 Documentation](https://platform.openai.com/docs/guides/gpt-4)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Few-Shot Learning](https://arxiv.org/abs/2005.14165)
- [Playwright Testing Framework](https://playwright.dev/)
- [API Testing Best Practices](https://www.postman.com/api-platform/api-testing/)
