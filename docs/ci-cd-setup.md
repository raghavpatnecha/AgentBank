# CI/CD Setup Guide

Complete guide for Docker-based test execution and CI/CD integration for the API Test Agent.

## Table of Contents

- [Overview](#overview)
- [Docker Setup](#docker-setup)
- [Local Development](#local-development)
- [CI/CD Integration](#cicd-integration)
- [GitHub Actions](#github-actions)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The API Test Agent uses a Docker-based test execution strategy that provides:

- **Consistent Environment**: Same environment locally and in CI/CD
- **Isolation**: Tests run in isolated containers
- **Resource Management**: CPU and memory limits prevent resource exhaustion
- **Parallel Execution**: Run multiple test suites in parallel
- **Artifact Collection**: Automatic collection of test results and coverage

### Architecture

```
┌─────────────────────────────────────────┐
│         Docker Multi-Stage Build        │
├─────────────────────────────────────────┤
│  1. Dependencies (node_modules)         │
│  2. Builder (TypeScript compilation)    │
│  3. Test Runner (test execution)        │
│  4. Development (watch mode)            │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│        docker-compose.yml               │
├─────────────────────────────────────────┤
│  - test-runner: Production tests        │
│  - test-dev: Development with watch     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│     Volume Mounts & Results             │
├─────────────────────────────────────────┤
│  - Source code (read-only)              │
│  - Test results (read-write)            │
│  - Coverage reports (read-write)        │
└─────────────────────────────────────────┘
```

## Docker Setup

### Prerequisites

- Docker 20.10 or later
- Docker Compose 2.0 or later
- Git

### Dockerfile

The multi-stage Dockerfile (`Dockerfile`) defines four build stages:

1. **dependencies**: Installs npm packages
2. **builder**: Compiles TypeScript code
3. **test-runner**: Production test execution environment
4. **development**: Development environment with watch mode

#### Key Features

- **Base Image**: `node:18-alpine` (lightweight)
- **System Dependencies**: bash, curl, jq
- **Playwright**: Browsers pre-installed
- **Resource Optimization**: Multi-stage build reduces image size
- **Health Checks**: Container health monitoring

### docker-compose.yml

Main docker-compose configuration for local development.

#### Services

##### test-runner

Production-like test execution service:

```yaml
services:
  test-runner:
    build:
      context: .
      target: test-runner
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    volumes:
      - ./src:/app/src:ro
      - ./tests:/app/tests:ro
      - ./test-results:/app/test-results
      - ./coverage:/app/coverage
```

**Features**:
- Resource limits: 2 CPUs, 2GB RAM
- Read-only source mounts (safety)
- Read-write result directories
- Network isolation
- Environment file support

##### test-dev

Development service with watch mode:

```yaml
services:
  test-dev:
    build:
      target: development
    command: npm run test:watch
    stdin_open: true
    tty: true
```

**Features**:
- Watch mode enabled
- Interactive TTY
- Hot reload support
- Full source access

### docker-compose.ci.yml

CI/CD optimized configuration.

**Optimizations**:
- Build cache from registry
- Parallel service execution (lint, typecheck, tests)
- No restart policy (fail fast)
- Minimal logging
- Exit on failure

**Services**:
- `test-runner`: Main test execution
- `lint`: Code linting
- `typecheck`: TypeScript type checking

## Local Development

### Quick Start

1. **Build Docker image**:
```bash
docker-compose build
```

2. **Run all tests**:
```bash
docker-compose up test-runner
```

3. **Run tests in watch mode**:
```bash
docker-compose up test-dev
```

### Using run-tests.sh

The `scripts/run-tests.sh` script provides a convenient interface for Docker-based testing.

#### Basic Usage

```bash
# Run all tests
./scripts/run-tests.sh

# Force rebuild and run tests
./scripts/run-tests.sh --build

# Clean and rebuild
./scripts/run-tests.sh --clean --build

# Run specific test type
./scripts/run-tests.sh --type unit
./scripts/run-tests.sh --type integration
./scripts/run-tests.sh --type playwright

# Run with coverage
./scripts/run-tests.sh --coverage

# Run in watch mode
./scripts/run-tests.sh --watch

# Verbose output
./scripts/run-tests.sh --verbose
```

#### Advanced Options

```bash
# Build without cache
./scripts/run-tests.sh --no-cache --build

# Interactive mode
./scripts/run-tests.sh --interactive

# Combination
./scripts/run-tests.sh --clean --build --type unit --coverage --verbose
```

#### Script Features

- **Error Handling**: Exits on first error
- **Cleanup**: Automatic container cleanup
- **Logging**: Color-coded output
- **Result Collection**: Automatic result aggregation
- **Summary**: Displays test execution summary

### Manual Docker Commands

If you prefer direct Docker commands:

```bash
# Build image
docker build -t api-test-agent:latest --target test-runner .

# Run tests
docker run --rm \
  -v $(pwd)/test-results:/app/test-results \
  -v $(pwd)/coverage:/app/coverage \
  api-test-agent:latest

# Run specific test type
docker run --rm api-test-agent:latest npm run test:unit

# Interactive shell
docker run --rm -it api-test-agent:latest sh
```

### Volume Mounts Explained

| Mount | Mode | Purpose |
|-------|------|---------|
| `./src:/app/src` | Read-Only | Source code (prevents accidental modification) |
| `./tests:/app/tests` | Read-Only | Test files |
| `./test-results:/app/test-results` | Read-Write | Test execution results |
| `./coverage:/app/coverage` | Read-Write | Coverage reports |
| `./playwright-report:/app/playwright-report` | Read-Write | Playwright HTML reports |
| `node_modules:/app/node_modules` | Volume | Faster performance |

### Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` to configure:
- `API_BASE_URL`: API endpoint for tests
- `PLAYWRIGHT_WORKERS`: Number of parallel workers
- `CI`: Set to `true` for CI behavior

The `.env` file is automatically loaded by docker-compose.

## CI/CD Integration

### Using ci-test.sh

The `scripts/ci-test.sh` script is optimized for CI/CD environments.

#### Features

- **Docker BuildKit**: Fast builds with caching
- **Parallel Execution**: Runs lint, typecheck, and tests in parallel
- **Result Aggregation**: Collects all artifacts
- **GitHub Actions Integration**: Sets outputs for workflow
- **Error Handling**: Comprehensive error reporting
- **Cleanup**: Automatic resource cleanup

#### Usage in CI

```bash
# Basic CI execution
./scripts/ci-test.sh

# With environment variables
DOCKER_REGISTRY=ghcr.io \
DOCKER_IMAGE=myorg/api-test-agent \
GITHUB_SHA=abc123 \
PARALLEL=true \
./scripts/ci-test.sh
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCKER_REGISTRY` | Container registry | `ghcr.io` |
| `DOCKER_IMAGE` | Image name | `api-test-agent` |
| `GITHUB_SHA` | Git commit SHA | `latest` |
| `PARALLEL` | Enable parallel execution | `true` |
| `CACHE_FROM` | Use build cache | `true` |
| `CI` | CI mode flag | `false` |
| `GITHUB_ACTIONS` | GitHub Actions flag | `false` |

#### Artifacts Generated

The script creates an `artifacts/` directory with:

```
artifacts/
├── test-results/        # JUnit XML, JSON results
├── coverage/            # Coverage reports (HTML, LCOV, JSON)
├── playwright-report/   # Playwright HTML report
└── summary.txt          # Execution summary
```

## GitHub Actions

### Workflow: test-execution.yml

The `.github/workflows/test-execution.yml` workflow provides comprehensive CI/CD testing.

#### Workflow Jobs

```
build → lint
      → unit-tests
      → integration-tests
      → e2e-tests
      → report

build → ci-full (on PR/main only)
```

#### Job Descriptions

##### 1. build

- Builds Docker image
- Pushes to GitHub Container Registry (ghcr.io)
- Uses layer caching for speed
- Tags with branch, SHA, and latest

##### 2. lint

- Runs ESLint
- Uses built image from `build` job
- Fast execution

##### 3. unit-tests

- Runs unit tests with coverage
- Uploads test results as artifacts
- Uploads coverage reports

##### 4. integration-tests

- Runs integration tests
- Includes Docker execution tests
- Uploads results and coverage

##### 5. e2e-tests

- Runs Playwright E2E tests
- Uploads Playwright HTML report
- Includes screenshots and traces on failure

##### 6. report

- Aggregates all test results
- Publishes test report as PR comment
- Uploads coverage to Codecov
- Creates workflow summary

##### 7. ci-full

- Runs complete CI suite using `ci-test.sh`
- Only on pull requests and main branch
- Parallel execution of all checks

#### Triggering the Workflow

The workflow runs on:

- **Push** to `main`, `develop`, `feature/*`, `claude/*` branches
- **Pull Request** to `main`, `develop` branches
- **Manual trigger** via workflow_dispatch (with test type selection)

#### Manual Trigger

Manually run the workflow from GitHub Actions UI:

1. Go to Actions tab
2. Select "Test Execution" workflow
3. Click "Run workflow"
4. Choose test type (all, unit, integration, e2e, playwright)

#### Artifacts

Each job uploads artifacts that persist for 30 days:

- `unit-test-results` - Unit test JUnit/JSON results
- `unit-coverage` - Unit test coverage reports
- `integration-test-results` - Integration test results
- `integration-coverage` - Integration coverage
- `playwright-test-results` - Playwright results
- `playwright-report` - Playwright HTML report with screenshots
- `ci-full-results` - Complete CI execution artifacts

#### Permissions

The workflow requires these permissions:

```yaml
permissions:
  contents: read      # Read repository
  packages: write     # Push to ghcr.io
  checks: write       # Create check runs
  pull-requests: write # Comment on PRs
```

#### Container Registry Setup

To push to GitHub Container Registry:

1. **Enable Package Write**: Already configured in workflow with `GITHUB_TOKEN`

2. **Public Access** (optional): Make packages public in repository settings

3. **Pull in CI**: No authentication needed for public packages

4. **Local Pull** (if private):
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Codecov Integration

Coverage reports are automatically uploaded to Codecov:

```yaml
- uses: codecov/codecov-action@v4
  with:
    files: ./artifacts/*/coverage/coverage-final.json
    flags: unittests,integration
```

**Setup**:
1. Add repository to Codecov
2. Add `CODECOV_TOKEN` to repository secrets (optional for public repos)

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem**: Docker build fails with network errors

**Solution**:
```bash
# Clear build cache
docker builder prune -a

# Retry build
./scripts/run-tests.sh --no-cache --build
```

#### 2. Permission Denied on Scripts

**Problem**: Cannot execute shell scripts

**Solution**:
```bash
chmod +x scripts/run-tests.sh scripts/ci-test.sh
```

#### 3. Volume Mount Issues

**Problem**: Results not appearing in local directories

**Solution**:
```bash
# Ensure directories exist
mkdir -p test-results coverage playwright-report

# Check Docker volume permissions
docker-compose down --volumes
docker-compose up test-runner
```

#### 4. Resource Exhaustion

**Problem**: Tests fail due to memory limits

**Solution**:

Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Increase from 2G
```

#### 5. Playwright Browser Issues

**Problem**: Playwright tests fail to launch browser

**Solution**:
```bash
# Rebuild with fresh browser install
docker-compose build --no-cache test-runner

# Or use development image
docker-compose up test-dev
```

#### 6. CI Build Cache Misses

**Problem**: CI builds are slow, not using cache

**Solution**:

Ensure workflow has cache configuration:
```yaml
cache-from: |
  type=registry,ref=${{ env.DOCKER_REGISTRY }}/${{ env.DOCKER_IMAGE }}:latest
```

### Debugging

#### View Container Logs

```bash
# Running container
docker logs api-test-runner

# docker-compose
docker-compose logs test-runner
```

#### Interactive Shell

```bash
# Start container with shell
docker run --rm -it api-test-agent:latest sh

# Or with docker-compose
docker-compose run --rm test-runner sh
```

#### Check Container Resources

```bash
# View container stats
docker stats api-test-runner

# Inspect container
docker inspect api-test-runner
```

#### Verify Environment

```bash
# Check environment variables
docker-compose run --rm test-runner env

# Check file permissions
docker-compose run --rm test-runner ls -la /app
```

## Best Practices

### Local Development

1. **Use watch mode** for rapid feedback:
   ```bash
   docker-compose up test-dev
   ```

2. **Build incrementally**: Don't use `--no-cache` unless necessary

3. **Clean up regularly**:
   ```bash
   docker-compose down --volumes
   docker system prune -a
   ```

4. **Keep .env updated**: Sync with `.env.example`

### CI/CD

1. **Use layer caching**: Configure `cache-from` in workflows

2. **Parallel execution**: Enable parallel mode for faster CI

3. **Fail fast**: Use `--abort-on-container-exit` in docker-compose

4. **Resource limits**: Configure appropriate limits for CI runners

5. **Artifact retention**: Balance storage cost with debugging needs

### Docker Images

1. **Multi-stage builds**: Keep image size small

2. **Layer optimization**: Order Dockerfile commands by change frequency

3. **Security scanning**: Scan images for vulnerabilities
   ```bash
   docker scan api-test-agent:latest
   ```

4. **Tag properly**: Use semantic versioning or commit SHAs

5. **Clean up**: Remove old images regularly

### Testing

1. **Isolation**: Each test should be independent

2. **Idempotency**: Tests should produce same results on repeated runs

3. **Resource cleanup**: Clean up test data and resources

4. **Timeouts**: Set appropriate timeouts for CI

5. **Retry logic**: Implement retries for flaky tests (sparingly)

## Advanced Configuration

### Custom Test Commands

Override default command in docker-compose:

```yaml
services:
  test-runner:
    command: npm run test:unit -- --reporter=verbose
```

### Multiple Environments

Create environment-specific compose files:

```bash
# Development
docker-compose -f docker-compose.yml up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production tests
docker-compose -f docker-compose.prod.yml up
```

### Resource Profiles

Define resource profiles for different scenarios:

```yaml
# docker-compose.light.yml (for limited resources)
services:
  test-runner:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Network Configuration

Custom network setup:

```yaml
networks:
  test-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
```

## Metrics and Monitoring

### Test Execution Metrics

The CI workflow collects:

- Test execution time
- Test pass/fail rates
- Code coverage percentages
- Resource usage

### Viewing Metrics

1. **GitHub Actions**: Check workflow run summary
2. **Codecov**: View coverage trends
3. **Docker stats**: Monitor resource usage

### Performance Optimization

Track these metrics:

- Build time (target: < 5 minutes)
- Test execution time (target: < 10 minutes)
- Image size (target: < 1GB)
- Cache hit rate (target: > 80%)

## Security Considerations

### Secrets Management

- Never commit `.env` file
- Use GitHub Secrets for sensitive data
- Rotate credentials regularly

### Image Security

- Use official base images
- Scan for vulnerabilities
- Keep dependencies updated
- Use multi-stage builds (reduce attack surface)

### Network Security

- Isolate test networks
- Don't expose unnecessary ports
- Use read-only mounts where possible

## Migration Guide

### From Local to Docker

1. Install Docker and Docker Compose
2. Copy `.env.example` to `.env`
3. Build image: `./scripts/run-tests.sh --build`
4. Run tests: `./scripts/run-tests.sh`

### From Docker to CI

1. Push code to GitHub
2. Workflow runs automatically
3. View results in Actions tab
4. Download artifacts if needed

## Support

For issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review workflow logs in GitHub Actions
3. Check container logs: `docker logs api-test-runner`
4. Open issue with reproduction steps

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Docker Documentation](https://playwright.dev/docs/ci#docker)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated**: 2024-11-08

**Version**: 1.0.0
