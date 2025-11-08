# Feature 2: Test Generator

## Overview
Generate comprehensive Playwright API tests from parsed OpenAPI specifications, including happy paths, error cases, edge cases, and authentication flows.

## Status
**Current Status**: Not Started
**Priority**: Critical
**Target Completion**: Week 4
**Progress**: 0/10 tasks complete

## Dependencies
- Feature 1: OpenAPI Parser (must be complete)

## Tasks

### Task 2.1: Playwright Setup and Basic Structure
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Set up Playwright for API testing and create the foundation for test generation.

**Acceptance Criteria**:
- [ ] Playwright installed and configured
- [ ] Basic test runner setup
- [ ] Request context configuration
- [ ] Environment variable support
- [ ] Example test demonstrating API request
- [ ] Documentation for Playwright setup

**Dependencies Required**:
- @playwright/test
- dotenv

**Files to Create**:
- src/core/test-generator.ts
- playwright.config.ts
- tests/examples/basic-api-test.spec.ts

**Notes**:
Use Playwright's request fixture for API testing, not browser automation.

---

### Task 2.2: Happy Path Test Generation
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Generate tests for successful API responses (2xx status codes).

**Acceptance Criteria**:
- [ ] Generate tests for GET requests
- [ ] Generate tests for POST requests
- [ ] Generate tests for PUT requests
- [ ] Generate tests for DELETE requests
- [ ] Generate tests for PATCH requests
- [ ] Include request body generation from schemas
- [ ] Include response validation assertions
- [ ] Unit tests for generator

**Files to Create**:
- src/generators/happy-path-generator.ts
- tests/unit/happy-path-generator.test.ts
- tests/generated/ (output directory)

**Example Output**:
```typescript
test('GET /users - retrieve all users', async ({ request }) => {
  const response = await request.get('/users');
  expect(response.status()).toBe(200);
  expect(await response.json()).toBeInstanceOf(Array);
});
```

**Notes**:
Generated tests must be valid TypeScript that compiles without errors.

---

### Task 2.3: Request Body Generation
**Status**: Not Started
**Estimated Time**: 10 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Generate valid request bodies from OpenAPI schemas for POST/PUT/PATCH requests.

**Acceptance Criteria**:
- [ ] Generate bodies for primitive types (string, number, boolean)
- [ ] Generate bodies for object types
- [ ] Generate bodies for array types
- [ ] Handle required vs optional fields
- [ ] Generate realistic sample data
- [ ] Support enum values
- [ ] Handle nested objects
- [ ] Respect format constraints (email, date, uuid)
- [ ] Unit tests for all data types

**Files to Create**:
- src/generators/request-body-generator.ts
- src/utils/data-factory.ts
- tests/unit/request-body-generator.test.ts

**Example Generation**:
```typescript
// Schema:
// { name: string, email: string (format: email), age: number }
// Generated:
{
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30
}
```

**Notes**:
Use realistic but fake data. Consider using faker.js for data generation.

---

### Task 2.4: Response Validation Generation
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Generate response validation assertions based on OpenAPI response schemas.

**Acceptance Criteria**:
- [ ] Validate status codes
- [ ] Validate response schema structure
- [ ] Validate required fields
- [ ] Validate field types
- [ ] Validate array items
- [ ] Validate nested objects
- [ ] Handle multiple response types (200, 201, etc.)
- [ ] Unit tests for validator generation

**Files to Create**:
- src/generators/response-validator-generator.ts
- tests/unit/response-validator-generator.test.ts

**Example Output**:
```typescript
const body = await response.json();
expect(body).toMatchObject({
  id: expect.any(String),
  name: expect.any(String),
  email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  createdAt: expect.any(String)
});
```

**Notes**:
Use Playwright's expect matchers and custom matchers where needed.

---

### Task 2.5: Error Case Test Generation
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Generate tests for error responses (4xx and 5xx status codes).

**Acceptance Criteria**:
- [ ] Generate 400 Bad Request tests (invalid input)
- [ ] Generate 401 Unauthorized tests (missing auth)
- [ ] Generate 403 Forbidden tests (insufficient permissions)
- [ ] Generate 404 Not Found tests (non-existent resources)
- [ ] Generate 422 Unprocessable Entity tests (validation errors)
- [ ] Validate error response structure
- [ ] Unit tests for error case generation

**Files to Create**:
- src/generators/error-case-generator.ts
- tests/unit/error-case-generator.test.ts

**Example Output**:
```typescript
test('POST /users - missing required field', async ({ request }) => {
  const response = await request.post('/users', {
    data: { name: 'John' } // missing required email
  });
  expect(response.status()).toBe(400);
  const error = await response.json();
  expect(error.message).toContain('email');
});
```

**Notes**:
Not all error cases may be documented in spec. Generate common patterns.

---

### Task 2.6: Authentication Test Generation
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Generate tests that handle authentication and authorization.

**Acceptance Criteria**:
- [ ] Generate Bearer token authentication
- [ ] Generate API key authentication (header)
- [ ] Generate API key authentication (query param)
- [ ] Generate Basic authentication
- [ ] Generate OAuth2 flows (where applicable)
- [ ] Test authenticated and unauthenticated requests
- [ ] Handle multiple auth schemes in same spec
- [ ] Unit tests for auth generation

**Files to Create**:
- src/generators/auth-test-generator.ts
- src/utils/auth-helper.ts
- tests/unit/auth-test-generator.test.ts

**Example Output**:
```typescript
test.beforeAll(async ({ request }) => {
  const authResponse = await request.post('/auth/login', {
    data: { username: 'test', password: 'test' }
  });
  token = (await authResponse.json()).token;
});

test('GET /protected - with valid token', async ({ request }) => {
  const response = await request.get('/protected', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  expect(response.status()).toBe(200);
});
```

**Notes**:
Auth credentials should come from environment variables, not hardcoded.

---

### Task 2.7: Edge Case Test Generation
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Medium
**Owner**: Unassigned

**Description**:
Generate tests for edge cases and boundary conditions.

**Acceptance Criteria**:
- [ ] Test with empty strings
- [ ] Test with null values (where allowed)
- [ ] Test with minimum values
- [ ] Test with maximum values
- [ ] Test with special characters
- [ ] Test with very long strings
- [ ] Test with empty arrays
- [ ] Unit tests for edge case generation

**Files to Create**:
- src/generators/edge-case-generator.ts
- tests/unit/edge-case-generator.test.ts

**Example Output**:
```typescript
test('POST /users - name with special characters', async ({ request }) => {
  const response = await request.post('/users', {
    data: { name: "O'Brien-Smith", email: 'test@example.com' }
  });
  expect(response.status()).toBe(201);
});
```

**Notes**:
Balance comprehensiveness with test suite size. Focus on common edge cases.

---

### Task 2.8: Multi-Step Test Flow Generation
**Status**: Not Started
**Estimated Time**: 10 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Generate tests for workflows that require multiple API calls in sequence.

**Acceptance Criteria**:
- [ ] Detect operation dependencies from spec
- [ ] Generate create-then-read flows
- [ ] Generate create-update-delete flows
- [ ] Generate list-then-filter flows
- [ ] Pass data between test steps
- [ ] Handle step failures gracefully
- [ ] Unit tests for flow generation

**Files to Create**:
- src/generators/flow-generator.ts
- src/utils/dependency-analyzer.ts
- tests/unit/flow-generator.test.ts

**Example Output**:
```typescript
test('User CRUD workflow', async ({ request }) => {
  // Create
  const createRes = await request.post('/users', { data: userData });
  const userId = (await createRes.json()).id;

  // Read
  const readRes = await request.get(`/users/${userId}`);
  expect(readRes.status()).toBe(200);

  // Update
  const updateRes = await request.put(`/users/${userId}`, { data: updatedData });
  expect(updateRes.status()).toBe(200);

  // Delete
  const deleteRes = await request.delete(`/users/${userId}`);
  expect(deleteRes.status()).toBe(204);
});
```

**Notes**:
Use operationId and path parameters to detect dependencies.

---

### Task 2.9: Test Organization and Structure
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Organize generated tests into logical groups with proper structure.

**Acceptance Criteria**:
- [ ] Group tests by resource/tag
- [ ] Use describe blocks for organization
- [ ] Generate beforeAll/beforeEach hooks
- [ ] Generate afterAll/afterEach cleanup
- [ ] Add descriptive test names
- [ ] Include comments explaining test purpose
- [ ] Generate separate files per resource
- [ ] Unit tests for organization logic

**Files to Create**:
- src/generators/test-organizer.ts
- tests/unit/test-organizer.test.ts

**Example Output Structure**:
```
generated-tests/
├── users.spec.ts
├── products.spec.ts
└── orders.spec.ts
```

**Notes**:
Follow Playwright best practices for test organization.

---

### Task 2.10: Generator Integration and CLI
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Integrate all generators and provide CLI interface for test generation.

**Acceptance Criteria**:
- [ ] CLI command to generate tests
- [ ] Support for input spec file path
- [ ] Support for output directory path
- [ ] Configuration file support
- [ ] Progress logging during generation
- [ ] Summary of generated tests
- [ ] Integration tests with complete specs
- [ ] Documentation for CLI usage

**Files to Create**:
- src/cli/generate-command.ts
- src/cli/index.ts
- tests/integration/test-generation.test.ts
- docs/test-generation.md

**CLI Usage**:
```bash
api-test-agent generate \
  --spec ./openapi.yaml \
  --output ./tests/generated \
  --config ./config.json
```

**Notes**:
This completes the test generation feature. All previous tasks must be done.

---

## Testing Strategy

### Unit Tests
- Test each generator in isolation
- Mock parsed OpenAPI specs
- Verify generated code syntax
- Target 85% code coverage

### Integration Tests
- Generate tests from complete specs
- Verify generated tests compile
- Run generated tests against mock server
- Test with 3+ real-world specs

### Validation
- Generated code must pass TypeScript compiler
- Generated code must pass ESLint
- Generated tests must be executable

## Success Criteria

Feature is complete when:
- All 10 tasks marked complete
- 85% unit test coverage
- Integration tests passing with 3+ real specs
- Generated tests pass linting
- CLI functional with help documentation
- Code review approved
- Documentation complete with examples

## Risks and Mitigations

### Risk: Generated tests too brittle
**Mitigation**: Use flexible matchers, focus on schema compliance not exact values

### Risk: Too many tests generated
**Mitigation**: Make generation configurable, allow filtering by tag/path

### Risk: Complex schemas hard to generate data for
**Mitigation**: Start simple, iterate based on real-world specs

## Dependencies

### External Libraries
- @playwright/test
- faker-js (for test data)
- dotenv (for environment config)

### Internal Dependencies
- Feature 1 (OpenAPI Parser) must provide:
  - Parsed spec with all endpoints
  - Resolved schemas
  - Authentication requirements

## Notes

- Generated tests should be readable and maintainable
- Add comments explaining what each test validates
- Use constants for common test data
- Consider test execution time - don't generate redundant tests
- Generated code should follow claude.md guidelines

## References

- Playwright API Testing: https://playwright.dev/docs/api-testing
- Faker.js: https://fakerjs.dev/
- OpenAPI Test Generation Best Practices
