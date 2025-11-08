# Feature 3: Test Executor

## Overview
Execute generated Playwright tests in isolated Docker containers with configurable environments, parallel execution, retry logic, and comprehensive logging.

## Status
**Current Status**: Not Started
**Priority**: Critical
**Target Completion**: Week 5
**Progress**: 0/7 tasks complete

## Dependencies
- Feature 2: Test Generator (must be complete)

## Tasks

### Task 3.1: Docker Container Setup
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Create Docker container with Playwright and all dependencies for test execution.

**Acceptance Criteria**:
- [ ] Dockerfile with Node.js and Playwright
- [ ] Multi-stage build for optimized image size
- [ ] Image size under 500MB
- [ ] Non-root user for security
- [ ] Timezone configuration
- [ ] Health check endpoint
- [ ] Successfully runs Playwright tests

**Files to Create**:
- docker/Dockerfile
- docker/.dockerignore
- docker/entrypoint.sh
- docs/docker-setup.md

**Base Image**:
Use official Playwright Docker image as base: mcr.microsoft.com/playwright

**Notes**:
Pin all versions to ensure reproducibility. Document all installed packages.

---

### Task 3.2: Environment Configuration
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Implement environment-specific configuration for test execution.

**Acceptance Criteria**:
- [ ] Support for multiple environments (dev, staging, prod)
- [ ] Environment variables loaded from .env files
- [ ] Environment-specific base URLs
- [ ] Environment-specific credentials
- [ ] Validation of required env variables
- [ ] Default values for optional variables
- [ ] Documentation of all env variables

**Files to Create**:
- src/config/environment.ts
- src/config/validator.ts
- .env.example
- tests/unit/environment.test.ts

**Required Environment Variables**:
```
API_BASE_URL
AUTH_TOKEN or API_KEY
ENVIRONMENT (dev/staging/prod)
```

**Optional Variables**:
```
REQUEST_TIMEOUT (default: 30000)
MAX_RETRIES (default: 3)
PARALLEL_WORKERS (default: 4)
LOG_LEVEL (default: info)
```

**Notes**:
Never commit actual .env files. Validate on startup and fail fast if missing required vars.

---

### Task 3.3: Test Execution Engine
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Implement core test execution logic with Playwright test runner.

**Acceptance Criteria**:
- [ ] Execute all generated tests
- [ ] Capture test results (pass/fail/skip)
- [ ] Capture execution time per test
- [ ] Capture request/response logs
- [ ] Handle test timeouts
- [ ] Generate JUnit XML output
- [ ] Generate JSON output
- [ ] Exit with appropriate status code

**Files to Create**:
- src/executor/test-runner.ts
- src/executor/result-collector.ts
- playwright.config.ts (production config)
- tests/unit/test-runner.test.ts

**Playwright Config**:
```typescript
export default defineConfig({
  timeout: 30000,
  retries: 3,
  workers: process.env.PARALLEL_WORKERS || 4,
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['junit', { outputFile: 'results.xml' }],
    ['html']
  ]
});
```

**Notes**:
Use Playwright's built-in reporters where possible. Don't reinvent the wheel.

---

### Task 3.4: Parallel Test Execution
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Optimize test execution with parallel workers while managing resource constraints.

**Acceptance Criteria**:
- [ ] Configure worker count based on environment
- [ ] Run independent tests in parallel
- [ ] Serialize tests with shared state
- [ ] Monitor memory usage
- [ ] Prevent worker starvation
- [ ] Graceful shutdown of workers
- [ ] Performance tests showing improvement

**Files to Update**:
- playwright.config.ts
- src/executor/test-runner.ts

**Files to Create**:
- src/executor/worker-manager.ts
- tests/performance/parallel-execution.test.ts

**Notes**:
Default to 4 workers. Allow override via environment variable. Monitor for resource exhaustion.

---

### Task 3.5: Retry Logic and Error Handling
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Implement intelligent retry logic for flaky tests and transient failures.

**Acceptance Criteria**:
- [ ] Retry failed tests up to MAX_RETRIES
- [ ] Exponential backoff between retries
- [ ] Detect flaky tests (pass on retry)
- [ ] Detect permanent failures (fail all retries)
- [ ] Log retry attempts with reasons
- [ ] Report flaky test statistics
- [ ] Unit tests for retry logic

**Files to Create**:
- src/executor/retry-handler.ts
- src/utils/backoff.ts
- tests/unit/retry-handler.test.ts

**Retry Strategy**:
```
Attempt 1: Immediate
Attempt 2: Wait 2s
Attempt 3: Wait 4s
Max: 3 attempts
```

**Notes**:
Distinguish between network errors (retry) and assertion failures (might not retry).

---

### Task 3.6: Request/Response Logging
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Capture detailed request/response logs for debugging failed tests.

**Acceptance Criteria**:
- [ ] Log all HTTP requests (method, URL, headers, body)
- [ ] Log all HTTP responses (status, headers, body)
- [ ] Redact sensitive data (tokens, passwords)
- [ ] Associate logs with specific tests
- [ ] Configurable log levels
- [ ] Export logs to files
- [ ] Structured logging (JSON format)

**Files to Create**:
- src/executor/request-logger.ts
- src/utils/sensitive-data-filter.ts
- tests/unit/request-logger.test.ts

**Sensitive Data Patterns**:
```
- Authorization headers
- API-Key headers
- Cookies
- Fields named: password, token, secret, key
```

**Notes**:
Balance verbosity with storage. Only log full bodies for failures in production.

---

### Task 3.7: Docker Integration and Orchestration
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Complete Docker integration with docker-compose for local development and CI/CD.

**Acceptance Criteria**:
- [ ] docker-compose.yml for local testing
- [ ] Volume mounts for test code
- [ ] Environment file injection
- [ ] Network isolation
- [ ] Resource limits (CPU, memory)
- [ ] Automatic cleanup of containers
- [ ] CI/CD integration examples

**Files to Create**:
- docker-compose.yml
- docker-compose.ci.yml
- scripts/run-tests.sh
- .github/workflows/test-execution.yml

**Docker Compose Example**:
```yaml
services:
  test-runner:
    build: ./docker
    volumes:
      - ./tests:/app/tests
      - ./results:/app/results
    env_file:
      - .env.test
    mem_limit: 2g
    cpus: 2
```

**Notes**:
This completes the test executor feature. All previous tasks must be done.

---

## Testing Strategy

### Unit Tests
- Mock Docker and file system operations
- Test retry logic with simulated failures
- Test environment validation
- Target 80% coverage

### Integration Tests
- Run tests in actual Docker container
- Test with various environment configs
- Verify output file generation
- Test parallel execution

### Performance Tests
- Measure execution time improvement with parallelization
- Test memory usage under load
- Verify no resource leaks

## Success Criteria

Feature is complete when:
- All 7 tasks marked complete
- Docker image builds successfully
- Tests run in container with correct environment
- Parallel execution works correctly
- Retry logic handles transient failures
- Logs captured without sensitive data
- 80% unit test coverage
- Integration tests passing
- Documentation complete

## Risks and Mitigations

### Risk: Docker image too large
**Mitigation**: Use multi-stage builds, alpine base where possible

### Risk: Tests run too slowly
**Mitigation**: Optimize parallelization, consider test prioritization

### Risk: Flaky tests in CI/CD
**Mitigation**: Implement robust retry logic, identify and fix flaky tests

## Dependencies

### External Tools
- Docker 20+
- docker-compose
- Playwright

### Environment Requirements
- 2GB RAM minimum
- 2 CPU cores recommended
- Network access to test APIs

## Performance Targets

- Container startup: Under 10 seconds
- 100 tests: Under 5 minutes
- Memory usage: Under 2GB
- Parallel workers: 4 default, up to 8 supported

## Notes

- Security: Run as non-root user in container
- Cleanup: Ensure containers are removed after execution
- Logs: Rotate log files to prevent disk issues
- Resources: Set limits to prevent resource exhaustion
- Isolation: Each test run should be completely isolated

## References

- Playwright in Docker: https://playwright.dev/docs/docker
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Docker Compose: https://docs.docker.com/compose/
