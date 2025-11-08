# Docker Container Setup for API Test Agent

## Overview

This document provides comprehensive instructions for building, running, and managing the Docker container for the API Test Agent with Playwright support.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Instructions](#build-instructions)
- [Run Instructions](#run-instructions)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)

## Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build approach to optimize the final image size:

1. **Builder Stage**: Installs dependencies and builds TypeScript code
2. **Runtime Stage**: Creates minimal production image with only necessary files

**Benefits**:
- Reduced image size (target: <500MB)
- Faster deployment
- Improved security (no build tools in production)
- Reproducible builds

### Container Specifications

- **Base Image**: `mcr.microsoft.com/playwright:v1.40.0-jammy`
- **Node.js**: v18.19.0
- **User**: Non-root user `playwright` (UID: 1000)
- **Timezone**: UTC
- **Health Check**: HTTP endpoint on port 3000

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 1.29+ (optional)
- 2GB+ free disk space
- 4GB+ RAM recommended

## Quick Start

```bash
# Build the image
docker build -f docker/Dockerfile -t api-test-agent:latest .

# Run tests
docker run --rm api-test-agent:latest

# Run with custom configuration
docker run --rm \
  -e TEST_COMMAND="npm run test:playwright" \
  -v $(pwd)/test-results:/app/test-results \
  api-test-agent:latest
```

## Build Instructions

### Standard Build

```bash
# From project root directory
docker build -f docker/Dockerfile -t api-test-agent:latest .
```

### Build with Custom Arguments

```bash
docker build \
  --build-arg NODE_VERSION=18.19.0 \
  --build-arg NPM_VERSION=10.2.3 \
  --build-arg PLAYWRIGHT_VERSION=1.40.0 \
  -f docker/Dockerfile \
  -t api-test-agent:1.0.0 \
  .
```

### Multi-Platform Build

```bash
# Build for AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile \
  -t api-test-agent:latest \
  --push \
  .
```

### Verify Build

```bash
# Check image size
docker images api-test-agent:latest

# Inspect image layers
docker history api-test-agent:latest

# Scan for vulnerabilities
docker scan api-test-agent:latest
```

## Run Instructions

### Basic Execution

```bash
# Run tests and exit
docker run --rm api-test-agent:latest

# Run with test results volume
docker run --rm \
  -v $(pwd)/test-results:/app/test-results \
  api-test-agent:latest
```

### Interactive Mode

```bash
# Run with shell access
docker run -it --rm \
  --entrypoint /bin/bash \
  api-test-agent:latest

# Run and keep container alive
docker run -d \
  --name api-test-agent \
  -e KEEP_ALIVE=true \
  api-test-agent:latest
```

### Custom Test Commands

```bash
# Run specific test suite
docker run --rm \
  -e TEST_COMMAND="npm run test:playwright -- --grep @smoke" \
  api-test-agent:latest

# Run with debug mode
docker run --rm \
  -e PLAYWRIGHT_HEADLESS=false \
  -e LOG_LEVEL=debug \
  api-test-agent:latest
```

### Volume Mounts

```bash
# Mount test results and reports
docker run --rm \
  -v $(pwd)/test-results:/app/test-results:rw \
  -v $(pwd)/playwright-report:/app/playwright-report:rw \
  -v $(pwd)/coverage:/app/coverage:rw \
  api-test-agent:latest
```

### Network Configuration

```bash
# Run with host network for API access
docker run --rm \
  --network host \
  api-test-agent:latest

# Run with custom network
docker network create test-network
docker run --rm \
  --network test-network \
  api-test-agent:latest
```

## Environment Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PLAYWRIGHT_BROWSERS_PATH` | `/ms-playwright` | Browser binaries path |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_COMMAND` | `npm run test:playwright` | Command to execute tests |
| `PLAYWRIGHT_HEADLESS` | `true` | Run browsers in headless mode |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `HEALTH_CHECK_PORT` | `3000` | Port for health check endpoint |
| `KEEP_ALIVE` | `false` | Keep container running after tests |
| `MAX_RETRIES` | `3` | Maximum health check retries |
| `RETRY_DELAY` | `5` | Seconds between health check retries |

### Example .env File

```bash
# Test Configuration
TEST_COMMAND=npm run test:playwright
PLAYWRIGHT_HEADLESS=true
LOG_LEVEL=info

# Server Configuration
HEALTH_CHECK_PORT=3000
KEEP_ALIVE=false

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY=5
```

## Health Checks

### Health Endpoint

The container exposes a health check endpoint at `/health`:

```bash
# Check container health
curl http://localhost:3000/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "version": "0.1.0"
}
```

### Docker Health Check

Docker automatically checks container health every 30 seconds:

```bash
# View health status
docker inspect --format='{{.State.Health.Status}}' api-test-agent

# View health check logs
docker inspect --format='{{json .State.Health}}' api-test-agent | jq
```

### Manual Health Check

```bash
# Test health check inside container
docker exec api-test-agent curl -f http://localhost:3000/health

# Check from host (if port is exposed)
docker run -d -p 3000:3000 --name api-test-agent api-test-agent:latest
curl http://localhost:3000/health
```

## Troubleshooting

### Common Issues

#### 1. Container Exits Immediately

**Symptoms**: Container starts and exits with code 0 or 1

**Solutions**:
```bash
# Check container logs
docker logs api-test-agent

# Run in interactive mode to debug
docker run -it --rm --entrypoint /bin/bash api-test-agent:latest

# Verify entrypoint script
docker run --rm --entrypoint cat api-test-agent:latest /usr/local/bin/entrypoint.sh
```

#### 2. Health Check Failing

**Symptoms**: Container shows as unhealthy

**Solutions**:
```bash
# Check health check logs
docker inspect --format='{{json .State.Health}}' api-test-agent | jq

# Manually test health endpoint
docker exec api-test-agent curl -v http://localhost:3000/health

# Check if health server is running
docker exec api-test-agent ps aux | grep node
```

#### 3. Tests Failing

**Symptoms**: Tests fail inside container but pass locally

**Solutions**:
```bash
# Run with verbose logging
docker run --rm -e LOG_LEVEL=debug api-test-agent:latest

# Check browser availability
docker run --rm --entrypoint playwright api-test-agent:latest --version

# Verify Playwright installation
docker run --rm --entrypoint bash api-test-agent:latest -c "playwright install --dry-run"
```

#### 4. Permission Errors

**Symptoms**: Permission denied errors in logs

**Solutions**:
```bash
# Check file permissions
docker run --rm --entrypoint ls api-test-agent:latest -la /app

# Verify user
docker run --rm --entrypoint whoami api-test-agent:latest

# Fix volume permissions
docker run --rm -v $(pwd)/test-results:/app/test-results:rw \
  --user $(id -u):$(id -g) \
  api-test-agent:latest
```

#### 5. Out of Memory

**Symptoms**: Container killed by OOM

**Solutions**:
```bash
# Increase memory limit
docker run --rm --memory=4g api-test-agent:latest

# Monitor memory usage
docker stats api-test-agent

# Check container limits
docker inspect --format='{{.HostConfig.Memory}}' api-test-agent
```

### Debug Mode

```bash
# Enable debug logging
docker run --rm \
  -e LOG_LEVEL=debug \
  -e PLAYWRIGHT_DEBUG=1 \
  api-test-agent:latest

# Run with shell for manual debugging
docker run -it --rm \
  --entrypoint /bin/bash \
  api-test-agent:latest

# Inside container, run tests manually
cd /app
npm run test:playwright -- --debug
```

## Security Considerations

### Non-Root User

The container runs as the `playwright` user (UID: 1000) for security:

```dockerfile
USER playwright
```

**Benefits**:
- Reduced attack surface
- Prevents privilege escalation
- Follows least privilege principle

### Pinned Versions

All dependencies use pinned versions:

```dockerfile
ARG NODE_VERSION=18.19.0
ARG NPM_VERSION=10.2.3
```

**Benefits**:
- Reproducible builds
- Prevents supply chain attacks
- Easier vulnerability tracking

### Secrets Management

**Never include secrets in the image**:

```bash
# ❌ WRONG - Don't do this
docker build --build-arg API_KEY=secret123 .

# ✅ CORRECT - Use environment variables
docker run --rm -e API_KEY=secret123 api-test-agent:latest

# ✅ CORRECT - Use Docker secrets
echo "secret123" | docker secret create api_key -
docker service create --secret api_key api-test-agent:latest
```

### Image Scanning

```bash
# Scan for vulnerabilities
docker scan api-test-agent:latest

# Use Trivy for comprehensive scanning
trivy image api-test-agent:latest

# Scan specific severity
trivy image --severity HIGH,CRITICAL api-test-agent:latest
```

### Network Security

```bash
# Run without network access (if tests don't need external calls)
docker run --rm --network none api-test-agent:latest

# Use custom network with firewall rules
docker network create --driver bridge test-network
docker run --rm --network test-network api-test-agent:latest
```

### Read-Only Root Filesystem

```bash
# Run with read-only root filesystem
docker run --rm \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /app/test-results \
  api-test-agent:latest
```

## Performance Optimization

### Build Cache

```bash
# Use BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile -t api-test-agent:latest .

# Use cache from registry
docker build \
  --cache-from api-test-agent:latest \
  -f docker/Dockerfile \
  -t api-test-agent:latest \
  .
```

### Layer Optimization

The Dockerfile is optimized for layer caching:

1. Copy package files first (changes rarely)
2. Install dependencies (expensive operation)
3. Copy source code (changes frequently)
4. Build application

### Resource Limits

```bash
# Set CPU and memory limits
docker run --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  api-test-agent:latest
```

### Parallel Test Execution

```bash
# Run tests in parallel
docker run --rm \
  -e TEST_COMMAND="npm run test:playwright -- --workers=4" \
  api-test-agent:latest
```

### Image Size Reduction

Current optimizations:
- Multi-stage build
- Production dependencies only
- Cleaned npm cache
- Minimal base image
- Optimized layer ordering

Target size: **<500MB** (typically 450-480MB)

## Docker Compose (Optional)

Create `docker-compose.yml` for easier orchestration:

```yaml
version: '3.8'

services:
  test-agent:
    build:
      context: .
      dockerfile: docker/Dockerfile
    image: api-test-agent:latest
    container_name: api-test-agent
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - PLAYWRIGHT_HEADLESS=true
    volumes:
      - ./test-results:/app/test-results:rw
      - ./playwright-report:/app/playwright-report:rw
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
docker-compose up --build
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Build Docker image
  run: docker build -f docker/Dockerfile -t api-test-agent:latest .

- name: Run tests in container
  run: docker run --rm -v $(pwd)/test-results:/app/test-results api-test-agent:latest
```

### GitLab CI

```yaml
test:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f docker/Dockerfile -t api-test-agent:latest .
    - docker run --rm api-test-agent:latest
```

## Additional Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Playwright Docker Documentation](https://playwright.dev/docs/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review container logs: `docker logs api-test-agent`
3. Open an issue in the project repository

---

**Last Updated**: 2024-11-08
**Version**: 1.0.0
**Maintainer**: API Test Agent Team
