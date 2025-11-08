# Feature 4: Self-Healing Agent

## Overview
AI-powered intelligent test repair system that detects API changes, analyzes failures, and automatically regenerates failing tests using OpenAI's API.

## Status
**Current Status**: Not Started
**Priority**: High
**Target Completion**: Week 7
**Progress**: 0/9 tasks complete

## Dependencies
- Feature 3: Test Executor (must be complete)
- OpenAI API access required

## Tasks

### Task 4.1: Spec Diff Analyzer
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Compare current and previous OpenAPI specifications to detect changes.

**Acceptance Criteria**:
- [ ] Load and parse previous spec version
- [ ] Compare endpoint paths
- [ ] Detect added/removed endpoints
- [ ] Detect parameter changes
- [ ] Detect schema changes
- [ ] Detect authentication changes
- [ ] Generate structured diff report
- [ ] Unit tests for all change types

**Files to Create**:
- src/ai/spec-diff-analyzer.ts
- src/types/spec-diff-types.ts
- tests/unit/spec-diff-analyzer.test.ts
- tests/fixtures/spec-v1.yaml
- tests/fixtures/spec-v2.yaml

**Diff Report Structure**:
```typescript
interface SpecDiff {
  endpointsAdded: string[];
  endpointsRemoved: string[];
  endpointsModified: Array<{
    path: string;
    changes: Change[];
  }>;
}

interface Change {
  type: 'field_renamed' | 'type_changed' | 'field_added' | 'field_removed';
  location: string;
  oldValue: any;
  newValue: any;
}
```

**Notes**:
Use deep object comparison. Track nested changes in schemas.

---

### Task 4.2: Failure Pattern Detection
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Analyze test failures to identify patterns and root causes.

**Acceptance Criteria**:
- [ ] Parse Playwright test failure messages
- [ ] Detect assertion failures
- [ ] Detect network errors
- [ ] Detect timeout errors
- [ ] Detect authentication errors
- [ ] Categorize failure types
- [ ] Extract relevant context
- [ ] Unit tests for pattern detection

**Files to Create**:
- src/ai/failure-analyzer.ts
- src/types/failure-types.ts
- tests/unit/failure-analyzer.test.ts

**Failure Categories**:
```typescript
enum FailureType {
  FIELD_MISSING = 'field_missing',
  TYPE_MISMATCH = 'type_mismatch',
  STATUS_CODE_CHANGED = 'status_code_changed',
  AUTH_FAILED = 'auth_failed',
  ENDPOINT_NOT_FOUND = 'endpoint_not_found',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}
```

**Notes**:
Use regex patterns to extract field names and values from error messages.

---

### Task 4.3: OpenAI Integration
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Integrate OpenAI API for intelligent test regeneration.

**Acceptance Criteria**:
- [ ] Configure OpenAI client with API key
- [ ] Implement retry logic with exponential backoff
- [ ] Handle rate limiting
- [ ] Implement response caching
- [ ] Set appropriate model parameters
- [ ] Monitor token usage
- [ ] Handle API errors gracefully
- [ ] Unit tests with mocked API

**Files to Create**:
- src/ai/openai-client.ts
- src/ai/cache-manager.ts
- tests/unit/openai-client.test.ts

**Configuration**:
```typescript
{
  model: 'gpt-4',
  temperature: 0.1, // Low for consistency
  max_tokens: 2000,
  timeout: 30000
}
```

**Environment Variables**:
```
API_TEST_AGENT_OPENAI_API_KEY (required)
API_TEST_AGENT_OPENAI_MODEL (default: gpt-4)
API_TEST_AGENT_OPENAI_TIMEOUT (default: 30000)
```

**Notes**:
Implement caching to reduce API costs. Cache based on failure pattern + spec changes.

---

### Task 4.4: Prompt Engineering
**Status**: Not Started
**Estimated Time**: 10 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Design and implement effective prompts for test regeneration.

**Acceptance Criteria**:
- [ ] Create base prompt template
- [ ] Add context about API changes
- [ ] Add failure information
- [ ] Add original test code
- [ ] Add new OpenAPI spec excerpt
- [ ] Request specific output format
- [ ] Implement few-shot examples
- [ ] Test prompt effectiveness

**Files to Create**:
- src/ai/prompt-templates.ts
- src/ai/prompt-builder.ts
- tests/unit/prompt-builder.test.ts
- docs/prompt-engineering.md

**Prompt Structure**:
```typescript
const template = `
You are a test engineer fixing a failing API test.

**Original Test Code:**
${originalTestCode}

**Test Failure:**
Error: ${failureMessage}
Expected status 200 but got 404

**API Changes Detected:**
${JSON.stringify(specDiff, null, 2)}

**New OpenAPI Specification (relevant section):**
${relevantSpecSection}

**Task:**
Regenerate the test to work with the updated API.
Return ONLY the fixed TypeScript test code, no explanations.

**Requirements:**
- Use Playwright test syntax
- Include proper assertions
- Handle the detected API changes
- Maintain test intent
`;
```

**Notes**:
Iterate on prompts based on success rate. Document what works and what doesn't.

---

### Task 4.5: Test Regeneration Engine
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Use AI to regenerate failing tests based on spec changes and failure analysis.

**Acceptance Criteria**:
- [ ] Send prompt to OpenAI
- [ ] Parse AI response
- [ ] Validate generated code syntax
- [ ] Extract test code from response
- [ ] Save regenerated test
- [ ] Log regeneration attempts
- [ ] Track success/failure rate
- [ ] Unit tests for regeneration logic

**Files to Create**:
- src/ai/test-regenerator.ts
- src/ai/code-validator.ts
- tests/unit/test-regenerator.test.ts

**Regeneration Flow**:
```
1. Analyze failure
2. Get spec diff
3. Build prompt with context
4. Call OpenAI API
5. Parse response
6. Validate TypeScript syntax
7. Save regenerated test
8. Return result
```

**Notes**:
Validate generated code with TypeScript compiler before saving.

---

### Task 4.6: Self-Healing Orchestrator
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Coordinate the self-healing process from failure detection to test regeneration.

**Acceptance Criteria**:
- [ ] Detect failed tests from executor
- [ ] Analyze each failure
- [ ] Attempt self-healing for fixable failures
- [ ] Retry tests after healing
- [ ] Limit healing attempts per test
- [ ] Track healing success rate
- [ ] Generate healing report
- [ ] Integration tests

**Files to Create**:
- src/ai/self-healing-orchestrator.ts
- tests/integration/self-healing.test.ts

**Healing Workflow**:
```
1. Test fails
2. Analyze failure type
3. If healable: attempt regeneration
4. Save new test
5. Retry test (max 2 regeneration attempts)
6. Mark as healed or permanently failed
7. Log outcome
```

**Healing Limits**:
```
MAX_HEALING_ATTEMPTS_PER_TEST = 2
MAX_TOTAL_HEALING_TIME = 300000 (5 minutes)
```

**Notes**:
Don't attempt healing for non-API issues (network failures, timeouts).

---

### Task 4.7: Rule-Based Fallback
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Implement rule-based healing for common patterns when AI is unavailable.

**Acceptance Criteria**:
- [ ] Detect field renames (common naming patterns)
- [ ] Handle added required fields
- [ ] Handle removed fields
- [ ] Update endpoint paths
- [ ] Update status codes
- [ ] Apply simple transformations
- [ ] Unit tests for each rule

**Files to Create**:
- src/ai/rule-based-healer.ts
- src/ai/transformation-rules.ts
- tests/unit/rule-based-healer.test.ts

**Example Rules**:
```typescript
// Field rename: user_id -> userId (snake_case to camelCase)
if (specDiff.fieldRenamed) {
  testCode = testCode.replace(
    new RegExp(specDiff.oldFieldName, 'g'),
    specDiff.newFieldName
  );
}

// Status code change
if (specDiff.statusCodeChanged) {
  testCode = testCode.replace(
    `expect(response.status()).toBe(${specDiff.oldStatus})`,
    `expect(response.status()).toBe(${specDiff.newStatus})`
  );
}
```

**Notes**:
Use this as fallback when OpenAI unavailable. Log when fallback is used.

---

### Task 4.8: Healing Metrics and Reporting
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Medium
**Owner**: Unassigned

**Description**:
Track and report self-healing effectiveness and statistics.

**Acceptance Criteria**:
- [ ] Track total healing attempts
- [ ] Track successful healings
- [ ] Track failed healings
- [ ] Track healing time per test
- [ ] Calculate success rate
- [ ] Generate healing summary
- [ ] Include in test report
- [ ] Store metrics history

**Files to Create**:
- src/ai/healing-metrics.ts
- tests/unit/healing-metrics.test.ts

**Metrics to Track**:
```typescript
interface HealingMetrics {
  totalAttempts: number;
  successful: number;
  failed: number;
  successRate: number;
  averageTime: number;
  byFailureType: Record<FailureType, number>;
  aiUsed: number;
  fallbackUsed: number;
}
```

**Notes**:
Include these metrics in final test report for visibility.

---

### Task 4.9: Caching and Cost Optimization
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: Medium
**Owner**: Unassigned

**Description**:
Optimize OpenAI API usage through caching and intelligent request management.

**Acceptance Criteria**:
- [ ] Cache API responses by prompt hash
- [ ] Cache expiration (24 hours)
- [ ] Track cache hit rate
- [ ] Monitor API costs
- [ ] Implement request batching where possible
- [ ] Log token usage
- [ ] Cost estimation before healing
- [ ] Unit tests for caching

**Files to Create**:
- src/ai/cost-optimizer.ts
- src/ai/cache-store.ts
- tests/unit/cost-optimizer.test.ts

**Cache Key**:
```typescript
const cacheKey = hashCode(
  `${failureType}-${specDiffHash}-${testCodeHash}`
);
```

**Cost Tracking**:
```typescript
interface CostMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number; // in USD
  cacheHitRate: number;
}
```

**Notes**:
This completes the self-healing feature. All previous tasks must be done.

---

## Testing Strategy

### Unit Tests
- Mock OpenAI API responses
- Test each component in isolation
- Test error handling
- Target 85% coverage

### Integration Tests
- Test with real OpenAI API (in CI)
- Test full healing workflow
- Test with various failure types
- Measure success rate

### Performance Tests
- Test healing time
- Test with multiple concurrent healings
- Monitor memory usage

## Success Criteria

Feature is complete when:
- All 9 tasks marked complete
- 70% self-healing success rate on test cases
- Graceful degradation when AI unavailable
- Caching reduces API costs by 50%
- 85% unit test coverage
- Integration tests passing
- Documentation complete with examples

## Risks and Mitigations

### Risk: OpenAI API rate limits
**Mitigation**: Implement exponential backoff, caching, and fallback to rules

### Risk: Low healing success rate
**Mitigation**: Improve prompts iteratively, add more few-shot examples

### Risk: High API costs
**Mitigation**: Aggressive caching, cost estimation, usage limits

### Risk: Generated code has bugs
**Mitigation**: Validate with TypeScript compiler, add basic smoke tests

## Dependencies

### External Services
- OpenAI API (GPT-4 recommended)

### API Costs Estimation
- GPT-4: ~$0.03 per healing attempt (estimated)
- Expected: 10-50 healings per test run
- Monthly budget: $50-200 recommended

## Configuration

### Required Environment Variables
```
API_TEST_AGENT_OPENAI_API_KEY
```

### Optional Environment Variables
```
API_TEST_AGENT_OPENAI_MODEL (default: gpt-4)
API_TEST_AGENT_MAX_HEALING_ATTEMPTS (default: 2)
API_TEST_AGENT_HEALING_TIMEOUT (default: 60000)
API_TEST_AGENT_CACHE_TTL (default: 86400)
```

## Notes

- Self-healing is the key differentiator - invest time here
- Start with common patterns, expand based on real-world usage
- Monitor costs closely in production
- Consider using GPT-3.5 for simple healings to save costs
- Log all AI interactions for debugging and improvement
- Provide opt-out flag for users who don't want AI

## References

- OpenAI API: https://platform.openai.com/docs/api-reference
- Prompt Engineering Guide: https://www.promptingguide.ai/
- TypeScript AST: https://ts-ast-viewer.com/
