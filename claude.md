# Claude Development Guidelines

## Project: API Test Agent

### Code Style and Conventions

#### General Rules
- No emojis in code, comments, commit messages, or documentation
- Use clear, descriptive variable and function names
- Prefer explicit over implicit
- Avoid magic numbers and strings (use constants)
- Follow the principle of least surprise

#### TypeScript Standards
- Enable strict mode in tsconfig.json
- No use of `any` type (use `unknown` if type is truly unknown)
- All functions must have explicit return types
- Use interfaces for object shapes, types for unions/intersections
- Prefer readonly properties where applicable
- Use const assertions for literal types

#### Naming Conventions
- Files: kebab-case (e.g., `openapi-parser.ts`)
- Classes: PascalCase (e.g., `TestGenerator`)
- Interfaces: PascalCase with 'I' prefix (e.g., `IOpenAPISpec`)
- Functions: camelCase (e.g., `parseOpenAPISpec`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- Private class members: prefix with underscore (e.g., `_apiKey`)

#### Code Organization
- One class per file
- Group related functions in modules
- Keep files under 300 lines (refactor if larger)
- Imports organized: Node built-ins, external packages, internal modules
- Avoid circular dependencies

### Error Handling

#### Principles
- Always handle errors explicitly
- Never use empty catch blocks
- Provide actionable error messages
- Log errors with context
- Use custom error classes for different error types

#### Implementation
```typescript
// Good: Explicit error handling
try {
  const spec = await parseOpenAPISpec(filePath);
  return spec;
} catch (error) {
  if (error instanceof FileNotFoundError) {
    logger.error('OpenAPI spec file not found', { filePath });
    throw new ParseError('Failed to load spec: file not found');
  }
  throw error;
}

// Bad: Generic catch-all
try {
  // code
} catch (error) {
  // Silent failure
}
```

### Fallback Handling

#### Avoid Fallbacks When:
- Data integrity is critical
- User expects specific behavior
- Fallback could mask real issues
- Error should propagate to caller

#### Use Fallbacks Only When:
- Graceful degradation is acceptable
- User experience benefits from continuation
- Fallback behavior is clearly documented
- Fallback is logged for monitoring

#### Implementation
```typescript
// Good: Explicit fallback with logging
async function generateTestWithAI(spec: IOpenAPISpec): Promise<TestCase[]> {
  try {
    return await aiService.generateTests(spec);
  } catch (error) {
    logger.warn('AI service unavailable, using rule-based fallback', { error });
    return ruleBasedGenerator.generateTests(spec);
  }
}

// Bad: Silent fallback
function getValue(key: string): string {
  return config.get(key) || 'default'; // What if key should exist?
}
```

### Linting and Code Quality

#### ESLint Configuration
- Enforce: no-console (use logger)
- Enforce: no-any (use proper types)
- Enforce: explicit-function-return-type
- Enforce: no-unused-vars
- Enforce: no-magic-numbers
- Warning: max-lines (300)
- Warning: complexity (cyclomatic complexity under 10)

#### Pre-commit Checks
- Run ESLint with --max-warnings 0
- Run TypeScript compiler with --noEmit
- Run Prettier for formatting
- Run unit tests for changed files

#### Code Review Requirements
- All linting rules pass
- No TypeScript errors
- Test coverage for new code
- Documentation updated
- No TODOs in production code

### Testing Guidelines

#### Unit Tests
- Test one thing per test
- Use descriptive test names (should/when format)
- Arrange-Act-Assert pattern
- Mock external dependencies
- Aim for 80% coverage minimum

#### Integration Tests
- Test component interactions
- Use real implementations where possible
- Test happy path and error cases
- Use test fixtures for complex data

#### Test Structure
```typescript
describe('OpenAPIParser', () => {
  describe('parseSpec', () => {
    it('should parse valid OpenAPI 3.0 spec', async () => {
      // Arrange
      const spec = loadFixture('valid-openapi-3.0.yaml');
      const parser = new OpenAPIParser();

      // Act
      const result = await parser.parseSpec(spec);

      // Assert
      expect(result.version).toBe('3.0.0');
      expect(result.paths).toBeDefined();
    });

    it('should throw ParseError for invalid spec', async () => {
      // Arrange
      const invalidSpec = loadFixture('invalid-spec.yaml');
      const parser = new OpenAPIParser();

      // Act & Assert
      await expect(parser.parseSpec(invalidSpec)).rejects.toThrow(ParseError);
    });
  });
});
```

### Documentation Standards

#### Code Comments
- Use JSDoc for all public APIs
- Explain why, not what (code should be self-documenting)
- Document edge cases and assumptions
- Include examples for complex functions

#### JSDoc Format
```typescript
/**
 * Parses an OpenAPI specification file and extracts test metadata.
 *
 * Supports OpenAPI 3.0, 3.1, and Swagger 2.0 formats. Validates the spec
 * against the OpenAPI schema before parsing.
 *
 * @param filePath - Absolute path to the OpenAPI spec file
 * @param options - Optional parsing configuration
 * @returns Parsed spec with resolved references
 * @throws {FileNotFoundError} When spec file does not exist
 * @throws {ParseError} When spec is invalid or unsupported version
 *
 * @example
 * ```typescript
 * const spec = await parseOpenAPISpec('/path/to/openapi.yaml');
 * console.log(spec.paths); // All API endpoints
 * ```
 */
async function parseOpenAPISpec(
  filePath: string,
  options?: IParseOptions
): Promise<IResolvedSpec> {
  // Implementation
}
```

### Logging Standards

#### Log Levels
- ERROR: Unrecoverable errors requiring immediate attention
- WARN: Recoverable issues or degraded functionality
- INFO: Important business events
- DEBUG: Detailed information for troubleshooting

#### Logging Best Practices
- Use structured logging (JSON format)
- Include context (correlationId, userId, etc.)
- Never log sensitive data (credentials, PII)
- Use consistent log message format
- Include stack traces for errors

#### Implementation
```typescript
// Good: Structured logging with context
logger.info('Test execution started', {
  correlationId: context.correlationId,
  specFile: context.specFile,
  environment: context.environment,
  testCount: tests.length
});

// Bad: Unstructured logging
console.log('Starting tests...');
```

### Performance Guidelines

#### General Principles
- Profile before optimizing
- Optimize for common case
- Use async/await for I/O operations
- Implement timeouts for external calls
- Cache expensive operations

#### Specific Rules
- Limit OpenAI API calls (use caching)
- Use Promise.all for parallel operations
- Implement request debouncing where applicable
- Monitor and log performance metrics
- Set reasonable timeouts (30s for API calls)

### Security Guidelines

#### Credential Management
- Never hardcode credentials
- Use environment variables or secret managers
- Rotate credentials regularly
- Log authentication failures (without credentials)

#### Input Validation
- Validate all external inputs
- Use Zod for runtime schema validation
- Sanitize user inputs before logging
- Implement rate limiting for APIs

#### Dependency Management
- Keep dependencies up to date
- Run npm audit regularly
- Pin exact versions in package-lock.json
- Review dependencies before adding

### Git Workflow

#### Commit Messages
- Use conventional commits format
- Be descriptive but concise
- Reference issues when applicable

Format: `type(scope): description`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- refactor: Code refactoring
- test: Test additions or modifications
- chore: Build process or auxiliary tool changes

Examples:
- `feat(parser): add support for OpenAPI 3.1`
- `fix(self-healing): handle null response bodies`
- `docs(readme): update installation instructions`

#### Branch Naming
- feature/description (e.g., `feature/self-healing-agent`)
- fix/description (e.g., `fix/github-webhook-error`)
- refactor/description (e.g., `refactor/test-generator`)

#### Pull Request Guidelines
- Link to related issues
- Provide clear description of changes
- Include test results
- Update documentation as needed
- Request review from relevant team members

### Project-Specific Rules

#### OpenAPI Handling
- Always validate specs before parsing
- Handle all OpenAPI versions consistently
- Provide clear error messages for unsupported features
- Cache parsed specs to avoid re-parsing

#### AI Integration
- Implement retry with exponential backoff
- Set maximum retry attempts (3)
- Log all AI interactions for debugging
- Provide fallback when AI unavailable
- Monitor API usage and costs

#### Docker Best Practices
- Use multi-stage builds
- Minimize image size
- Pin base image versions
- Run as non-root user
- Clean up temporary files

#### GitHub Integration
- Respect rate limits
- Implement webhook signature verification
- Handle partial data gracefully
- Provide clear status messages
- Link to detailed reports

### Configuration Management

#### Environment Variables
- Prefix with PROJECT_NAME (e.g., `API_TEST_AGENT_`)
- Provide sensible defaults
- Document all environment variables
- Validate configuration on startup
- Use separate configs for dev/staging/prod

#### Required Variables
```
API_TEST_AGENT_OPENAI_API_KEY
API_TEST_AGENT_GITHUB_TOKEN
API_TEST_AGENT_SMTP_HOST
API_TEST_AGENT_SMTP_USER
API_TEST_AGENT_SMTP_PASS
```

#### Optional Variables
```
API_TEST_AGENT_LOG_LEVEL (default: info)
API_TEST_AGENT_MAX_RETRIES (default: 3)
API_TEST_AGENT_TIMEOUT (default: 30000)
```

### Maintenance Guidelines

#### Regular Tasks
- Update dependencies monthly
- Review and close stale issues weekly
- Run security audits before releases
- Update documentation with code changes
- Refactor when complexity increases

#### Deprecation Process
- Mark as deprecated with @deprecated JSDoc tag
- Log warning when deprecated feature used
- Provide migration path in documentation
- Remove after 2 major versions

### Additional Resources

#### Style Guides
- TypeScript: https://google.github.io/styleguide/tsguide.html
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

#### Tools
- ESLint: Linting
- Prettier: Code formatting
- Vitest: Testing
- Playwright: API testing
- Docker: Containerization

#### Learning Resources
- OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- Playwright API Testing: https://playwright.dev/docs/api-testing
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/

---

Last Updated: 2025-01-08
Version: 1.0
