# Architecture Document: Feature 2 - Test Generator

## 1. Overview

Feature 2 implements automatic generation of Playwright API tests from OpenAPI specifications. It builds on Feature 1's parser to create comprehensive, maintainable test suites that cover happy paths, error cases, authentication, edge cases, and multi-step flows.

### 1.1 Goals

- **Automation**: Generate complete Playwright test suites automatically
- **Coverage**: Support multiple test types (happy-path, error-case, auth, edge-case, flow)
- **Quality**: Generate realistic test data using faker.js
- **Maintainability**: Create well-organized, documented, type-safe tests
- **Extensibility**: Allow custom generators and validators

### 1.2 Non-Goals

- UI testing (Playwright browser automation)
- Performance/load testing (basic checks only)
- Test execution/reporting (use Playwright's built-in tools)

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│                    (tests/cli-feature2.ts)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TestGeneratorOrchestrator                     │
│                 (src/core/test-generator.ts)                     │
│  • Coordinates all generators                                    │
│  • Manages configuration                                         │
│  • Orchestrates test generation pipeline                         │
└────────────┬─────────────────────────────────────┬──────────────┘
             │                                     │
             ▼                                     ▼
┌────────────────────────────┐      ┌────────────────────────────┐
│   OpenAPIParser (F1)       │      │    TestOrganizer           │
│ • Parse OpenAPI spec       │      │ • Organize tests into      │
│ • Extract endpoints        │      │   files based on strategy  │
│ • Extract auth schemes     │      │ • Generate file structure  │
└────────────┬───────────────┘      └──────────────┬─────────────┘
             │                                     │
             ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Specialized Generators                        │
├─────────────────────────────────────────────────────────────────┤
│  HappyPathGenerator    │  Generates successful scenarios         │
│  ErrorCaseGenerator    │  Generates error scenarios (4xx, 5xx)   │
│  AuthTestGenerator     │  Generates auth/authz tests             │
│  EdgeCaseGenerator     │  Generates boundary/edge cases          │
│  FlowTestGenerator     │  Generates multi-step workflows         │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             ▼                                    ▼
┌───────────────────────┐           ┌──────────────────────────┐
│   DataFactory         │           │  ResponseValidator       │
│ • Generate test data  │           │ • Generate validation    │
│ • Use faker.js        │           │   code for responses     │
│ • Handle edge cases   │           │ • Schema validation      │
│ • Handle boundaries   │           │ • Custom validations     │
└───────────────────────┘           └──────────────────────────┘
             │                                    │
             └────────────┬───────────────────────┘
                          ▼
             ┌────────────────────────┐
             │   CodeGenerator        │
             │ • Generate Playwright  │
             │   test code            │
             │ • Format code          │
             │ • Add comments         │
             └────────────────────────┘
```

### 2.2 Data Flow

```
Input (OpenAPI Spec)
        │
        ▼
┌─────────────────┐
│ OpenAPIParser   │──────► ParsedApiSpec
│   (Feature 1)   │        • endpoints[]
└─────────────────┘        • auth schemes[]
        │                  • schemas
        │                  • servers
        ▼
┌─────────────────────────────────────────┐
│   TestGeneratorOrchestrator             │
│   • Load configuration                  │
│   • Filter endpoints (by tag, method)   │
│   • Initialize generators               │
└─────────────────┬───────────────────────┘
                  │
                  ├─────► For each endpoint:
                  │
                  ▼
     ┌────────────────────────┐
     │  Specialized Generator │
     │  (based on test type)  │
     └────────┬───────────────┘
              │
              ├──► DataFactory.generate()
              │      • Generate request params
              │      • Generate request body
              │      • Use faker.js for realistic data
              │
              ├──► ResponseValidator.generate()
              │      • Generate validation code
              │      • Schema validation
              │      • Custom rules
              │
              └──► Create TestCase object
                     │
                     ▼
              ┌────────────────┐
              │ TestOrganizer  │
              │ • Group tests  │
              │ • Create files │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ CodeGenerator  │
              │ • Generate TS  │
              │ • Format code  │
              └────────┬───────┘
                       │
                       ▼
         GeneratedTestFile[]
         (Write to disk)
```

## 3. Component Design

### 3.1 TestGeneratorOrchestrator

**Location**: `src/core/test-generator.ts`

**Responsibilities**:
- Main entry point for test generation
- Load and validate configuration
- Filter endpoints based on user criteria
- Coordinate specialized generators
- Collect and return results

**Key Methods**:
```typescript
class TestGeneratorOrchestrator {
  constructor(config: TestGeneratorConfig)

  async generateTests(
    spec: ParsedApiSpec,
    options?: TestGenerationOptions
  ): Promise<TestGenerationResult>

  private async generateForEndpoint(
    endpoint: ApiEndpoint,
    testTypes: TestType[]
  ): Promise<TestCase[]>

  private selectGenerator(testType: TestType): BaseTestGenerator
}
```

### 3.2 Base Test Generator

**Location**: `src/generators/base-generator.ts`

**Responsibilities**:
- Abstract base class for all generators
- Common functionality (data factory, validator access)
- Template method pattern for test generation

**Key Methods**:
```typescript
abstract class BaseTestGenerator {
  constructor(
    dataFactory: DataFactory,
    validator: ResponseValidator,
    config: TestGeneratorConfig
  )

  abstract generate(endpoint: ApiEndpoint): TestCase[]

  protected createTestCase(
    endpoint: ApiEndpoint,
    request: TestRequest,
    expectedResponse: ExpectedResponse
  ): TestCase
}
```

### 3.3 Specialized Generators

#### HappyPathGenerator
**Location**: `src/generators/happy-path-generator.ts`

**Purpose**: Generate tests for successful API calls with valid data

**Strategy**:
- Generate valid request parameters
- Use examples from OpenAPI spec when available
- Generate realistic data with faker.js
- Validate 2xx responses
- Check response schema

#### ErrorCaseGenerator
**Location**: `src/generators/error-case-generator.ts`

**Purpose**: Generate tests for error scenarios

**Strategy**:
- Generate invalid parameters (wrong types, missing required)
- Test validation errors (400)
- Test not found scenarios (404)
- Test documented error responses (4xx, 5xx)
- Validate error response format

#### AuthTestGenerator
**Location**: `src/generators/auth-generator.ts`

**Purpose**: Generate authentication/authorization tests

**Strategy**:
- Test with valid credentials (2xx)
- Test without credentials (401)
- Test with invalid credentials (401)
- Test with insufficient permissions (403)
- Support all auth types (apiKey, http, oauth2, openIdConnect)

#### EdgeCaseGenerator
**Location**: `src/generators/edge-case-generator.ts`

**Purpose**: Generate boundary and edge case tests

**Strategy**:
- Empty strings, null values
- Maximum/minimum lengths
- Maximum/minimum numeric values
- Special characters in strings
- Large payloads
- Empty arrays/objects

#### FlowTestGenerator
**Location**: `src/generators/flow-generator.ts`

**Purpose**: Generate multi-step workflow tests

**Strategy**:
- Identify related endpoints (CRUD operations)
- Generate sequential test flows (create → read → update → delete)
- Pass data between steps
- Test data consistency across operations

### 3.4 DataFactory

**Location**: `src/generators/data-factory.ts`

**Responsibilities**:
- Generate test data from JSON schemas
- Use faker.js for realistic data
- Support custom generators
- Generate edge cases and boundary values

**Key Methods**:
```typescript
class DataFactory {
  constructor(options: DataGenerationOptions)

  generate(schema: SchemaObject, context: GenerationContext): unknown

  generateTestValues(schema: SchemaObject, testType: TestType): TestValue[]

  generateEdgeCases(schema: SchemaObject): TestValue[]

  generateBoundaryValues(schema: SchemaObject): TestValue[]

  private generateString(schema: SchemaObject): string
  private generateNumber(schema: SchemaObject): number
  private generateObject(schema: SchemaObject): Record<string, unknown>
  private generateArray(schema: SchemaObject): unknown[]
}
```

**Faker.js Integration**:
- Use schema format hints (email, uuid, date-time)
- Use field names to infer faker methods (firstName → faker.person.firstName())
- Fallback to generic faker methods by type

### 3.5 ResponseValidator

**Location**: `src/generators/response-validator.ts`

**Responsibilities**:
- Generate Playwright validation code
- Schema validation (using ajv or similar)
- Header validation
- Custom validation rules

**Key Methods**:
```typescript
class ResponseValidator {
  constructor(options: ValidationOptions)

  generateValidationCode(response: ResponseObject, varName: string): string

  generateSchemaValidation(schema: SchemaObject, varName: string): string

  generateCustomValidation(rules: ValidationRule[], varName: string): string

  private generateTypeCheck(type: string, path: string): string
  private generateFormatCheck(format: string, path: string): string
}
```

### 3.6 TestOrganizer

**Location**: `src/utils/test-organizer.ts`

**Responsibilities**:
- Group tests into logical files
- Apply organization strategy
- Generate file paths
- Create file structure

**Key Methods**:
```typescript
class TestOrganizer {
  constructor(config: TestGeneratorConfig)

  organizeTests(tests: TestCase[], strategy: OrganizationStrategy): GeneratedTestFile[]

  generateFileStructure(suite: TestSuite): FileStructure

  private groupByEndpoint(tests: TestCase[]): Map<string, TestCase[]>
  private groupByTag(tests: TestCase[]): Map<string, TestCase[]>
  private groupByType(tests: TestCase[]): Map<string, TestCase[]>
}
```

**Organization Strategies**:

1. **by-endpoint**: One file per endpoint
   ```
   tests/
     api/
       users-get.spec.ts
       users-post.spec.ts
       users-id-get.spec.ts
   ```

2. **by-tag**: One file per OpenAPI tag
   ```
   tests/
     api/
       users.spec.ts       (all /users endpoints)
       products.spec.ts    (all /products endpoints)
   ```

3. **by-type**: One file per test type
   ```
   tests/
     api/
       happy-path.spec.ts
       error-cases.spec.ts
       auth.spec.ts
   ```

4. **by-method**: One file per HTTP method
   ```
   tests/
     api/
       get.spec.ts
       post.spec.ts
       put.spec.ts
   ```

### 3.7 CodeGenerator

**Location**: `src/utils/code-generator.ts`

**Responsibilities**:
- Generate Playwright test code from TestCase objects
- Format code (using prettier or custom formatter)
- Add imports, fixtures, helpers
- Generate TypeScript or JavaScript

**Key Methods**:
```typescript
class CodeGenerator {
  constructor(options: CodeGenerationOptions)

  generateFile(file: GeneratedTestFile): string

  generateTest(test: TestCase): string

  generateImports(imports: string[]): string

  generateFixtures(fixtures: string[]): string

  formatCode(code: string): string
}
```

**Generated Code Structure**:
```typescript
// Imports
import { test, expect } from '@playwright/test';

// Fixtures (if any)
// ... fixture code ...

// Tests
test.describe('GET /users', () => {
  test('should return list of users (happy path)', async ({ request }) => {
    // Request
    const response = await request.get('/users', {
      params: { page: 1, limit: 10 }
    });

    // Validations
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    // ... more validations ...
  });
});
```

### 3.8 CLI Interface

**Location**: `tests/cli-feature2.ts`

**Responsibilities**:
- Command-line interface for test generation
- Parse command-line arguments
- Load configuration
- Execute test generation
- Report results

**Commands**:
```bash
# Generate all tests
npm run generate-tests -- --spec openapi.yaml --output tests/api

# Generate specific endpoints
npm run generate-tests -- --spec openapi.yaml --endpoints /users,/products

# Generate specific test types
npm run generate-tests -- --spec openapi.yaml --types happy-path,error-case

# Generate for specific tags
npm run generate-tests -- --spec openapi.yaml --tags users,products

# Dry run
npm run generate-tests -- --spec openapi.yaml --dry-run
```

## 4. Key Design Decisions

### 4.1 Class-Based Architecture

**Decision**: Use class-based architecture (similar to Feature 1)

**Rationale**:
- Encapsulation of state (config, data factory, validator)
- Inheritance for specialized generators
- Consistent with Feature 1
- Better for dependency injection and testing

**Alternative Considered**: Functional approach with pure functions
- Pros: Simpler, easier to test individual functions
- Cons: More complex state management, harder to extend

### 4.2 Strategy Pattern for Generators

**Decision**: Use strategy pattern with specialized generator classes

**Rationale**:
- Each test type has unique generation logic
- Easy to add new test types
- Clear separation of concerns
- Each generator is independently testable

**Alternative Considered**: Single generator with switch statements
- Pros: Simpler initial implementation
- Cons: Becomes complex as test types grow, violates open/closed principle

### 4.3 Configuration-Driven Generation

**Decision**: Use comprehensive configuration object (TestGeneratorConfig)

**Rationale**:
- Flexibility for different use cases
- Easy to override defaults
- Can be loaded from file (config.json)
- Supports both CLI and programmatic usage

### 4.4 Test Organization Strategies

**Decision**: Support multiple organization strategies

**Rationale**:
- Different projects have different preferences
- by-endpoint: Good for small APIs, easy to find tests
- by-tag: Good for large APIs with clear domains
- by-type: Good for focusing on specific test categories
- by-method: Good for RESTful APIs with consistent methods

**Default**: by-tag (balances discoverability and organization)

### 4.5 Faker.js Integration

**Decision**: Use faker.js as primary data generation library

**Rationale**:
- Industry standard for fake data
- Rich set of generators (person, address, company, etc.)
- Locale support
- Seed support for reproducibility

**Integration Strategy**:
1. Parse OpenAPI format field (email, uuid, date-time) → specific faker method
2. Parse field name (firstName, email, zipCode) → infer faker method
3. Use type (string, number, boolean) → generic faker method
4. Fallback to simple random data

### 4.6 Validation Approach

**Decision**: Generate inline validation code (not external validators)

**Rationale**:
- Self-contained tests (no external dependencies)
- Clear what's being validated
- Easy to customize generated tests
- Better for code review

**Alternative Considered**: Use JSON schema validator library (ajv)
- Pros: More powerful validation, less code to generate
- Cons: External dependency, harder to understand what's being validated

### 4.7 TypeScript-First

**Decision**: Generate TypeScript by default (optional JavaScript)

**Rationale**:
- Type safety for test maintenance
- Better IDE support
- Consistent with modern Playwright usage
- Can always compile to JavaScript if needed

### 4.8 Playwright Request Context

**Decision**: Use Playwright's `request` fixture (not axios/fetch)

**Rationale**:
- Native Playwright integration
- Consistent with Playwright ecosystem
- Built-in features (auth, retry, tracing)
- No additional dependencies

## 5. Integration Strategy

### 5.1 Integration with Feature 1 (OpenAPI Parser)

**Approach**: Direct dependency on Feature 1

```typescript
import { OpenAPIParser } from './core/openapi-parser.js';
import { TestGeneratorOrchestrator } from './core/test-generator.js';

// Usage
const parser = new OpenAPIParser();
const spec = await parser.parseFromFile('openapi.yaml');

const generator = new TestGeneratorOrchestrator(config);
const result = await generator.generateTests(spec);
```

**Data Flow**:
1. Parse OpenAPI spec with Feature 1 parser
2. Extract endpoints and auth schemes
3. Pass ParsedApiSpec to test generator
4. Generator uses endpoint data to create tests

### 5.2 Playwright Integration

**Generated Test Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.use({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
});

test.describe('Users API', () => {
  test('GET /users should return users list', async ({ request }) => {
    const response = await request.get('/users');
    expect(response.status()).toBe(200);
    // ...
  });
});
```

### 5.3 Authentication Integration

**Fixture Generation**:
```typescript
// tests/fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedRequest: async ({ request }, use) => {
    const token = await getAuthToken();
    const authenticatedRequest = {
      ...request,
      defaults: {
        headers: { Authorization: `Bearer ${token}` }
      }
    };
    await use(authenticatedRequest);
  }
});
```

### 5.4 CLI Integration

**NPM Scripts** (package.json):
```json
{
  "scripts": {
    "generate-tests": "node tests/cli-feature2.js",
    "test:api": "playwright test tests/api"
  }
}
```

## 6. Module Structure

```
src/
  core/
    test-generator.ts              # TestGeneratorOrchestrator
  generators/
    base-generator.ts              # BaseTestGenerator (abstract)
    happy-path-generator.ts        # HappyPathGenerator
    error-case-generator.ts        # ErrorCaseGenerator
    auth-generator.ts              # AuthTestGenerator
    edge-case-generator.ts         # EdgeCaseGenerator
    flow-generator.ts              # FlowTestGenerator
    data-factory.ts                # DataFactory (faker.js integration)
    response-validator.ts          # ResponseValidator
  utils/
    test-organizer.ts              # TestOrganizer
    code-generator.ts              # CodeGenerator
    schema-helpers.ts              # Schema utility functions
  types/
    test-generator-types.ts        # All type definitions (CREATED)

tests/
  cli-feature2.ts                  # CLI interface
  fixtures/
    auth.ts                        # Authentication fixtures (generated)
    helpers.ts                     # Helper functions (generated)
  api/                             # Generated tests go here
    users.spec.ts
    products.spec.ts
    ...
```

## 7. Error Handling

### 7.1 Error Types

1. **Configuration Errors**: Invalid or missing configuration
2. **Schema Errors**: Unable to generate data from complex schemas
3. **Validation Errors**: Invalid OpenAPI spec
4. **File System Errors**: Cannot write to output directory

### 7.2 Error Recovery

- Continue generating other tests if one fails
- Collect warnings and errors
- Report all issues at the end
- Partial output on failure

### 7.3 Warnings

- Missing examples in spec
- Missing response schemas
- Ambiguous security requirements
- Complex nested schemas (>5 levels deep)

## 8. Extensibility

### 8.1 Custom Generators

Users can add custom generator classes:

```typescript
import { BaseTestGenerator } from './generators/base-generator';

class MyCustomGenerator extends BaseTestGenerator {
  generate(endpoint: ApiEndpoint): TestCase[] {
    // Custom logic
  }
}

// Register
orchestrator.registerGenerator('custom', new MyCustomGenerator(...));
```

### 8.2 Custom Data Generators

Users can provide custom data generators:

```typescript
const config: TestGeneratorConfig = {
  dataGeneration: {
    customGenerators: {
      'x-custom-type': (schema, context) => {
        // Generate custom data
        return customValue;
      }
    }
  }
};
```

### 8.3 Custom Validators

Users can add custom validation rules:

```typescript
const rules: ValidationRule[] = [
  {
    name: 'checkCustomFormat',
    path: '$.data.id',
    type: 'custom',
    config: { /* ... */ }
  }
];
```

## 9. Testing Strategy (for Feature 2 itself)

### 9.1 Unit Tests

- Test each generator independently
- Test DataFactory with various schemas
- Test ResponseValidator code generation
- Test TestOrganizer strategies
- Test CodeGenerator output

### 9.2 Integration Tests

- Test full generation pipeline
- Test with real OpenAPI specs (Petstore, Stripe, GitHub)
- Test generated code can be executed
- Test different configuration combinations

### 9.3 Fixtures

- Sample OpenAPI specs (simple, complex, with auth, with errors)
- Expected test outputs
- Mock data

## 10. Performance Considerations

### 10.1 Optimization Strategies

1. **Parallel Generation**: Generate tests for endpoints in parallel
2. **Schema Caching**: Cache resolved schemas to avoid repeated dereferencing
3. **Incremental Generation**: Only regenerate changed endpoints
4. **Lazy Loading**: Load generators only when needed

### 10.2 Scalability

- Target: Generate tests for 100+ endpoints in <10 seconds
- Memory: Keep memory usage under 100MB for typical specs
- Output: Support generating 1000+ test cases

## 11. Future Enhancements

### 11.1 Phase 2 Features

- Contract testing integration (Pact)
- Mock server generation
- Test data seeding
- Performance test generation (k6)
- GraphQL support

### 11.2 Advanced Features

- Machine learning for test prioritization
- Test coverage analysis
- Mutation testing
- Visual regression testing integration
- Test maintenance suggestions

## 12. Dependencies

### 12.1 Runtime Dependencies

- `@playwright/test`: ^1.40.0 (peer dependency)
- `@faker-js/faker`: ^8.3.0 (test data generation)
- `ajv`: ^8.12.0 (optional, for schema validation)

### 12.2 Development Dependencies

- All Feature 1 dependencies
- Additional test fixtures and mocks

## 13. Success Metrics

### 13.1 Code Quality

- 90%+ test coverage for generator code
- 0 TypeScript errors
- Passes all linting rules
- All integration tests pass

### 13.2 Generated Test Quality

- Generated tests compile without errors
- Generated tests execute successfully
- Clear, readable test code
- Proper error messages
- Good test organization

### 13.3 Usability

- CLI is intuitive and well-documented
- Configuration is flexible but has good defaults
- Generated tests require minimal manual editing
- Clear error messages and warnings

---

## Summary

This architecture provides a robust, extensible foundation for generating Playwright API tests from OpenAPI specifications. The modular design allows for easy addition of new test types and customization while maintaining code quality and test maintainability.

**Key Architectural Strengths**:
1. **Separation of Concerns**: Each component has a clear, single responsibility
2. **Extensibility**: Easy to add new generators, validators, and data factories
3. **Type Safety**: Comprehensive TypeScript types throughout
4. **Testability**: Each component can be tested independently
5. **Maintainability**: Clear structure and well-documented design decisions
6. **Integration**: Clean integration with Feature 1 and Playwright
