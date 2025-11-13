# Docker Test Executor Guide

## Overview

The Docker Test Executor (Feature 3.1) provides isolated container-based test execution for the AgentBank project. Each test or test suite runs in its own Docker container, ensuring complete isolation, reproducibility, and security.

## Features

- **Per-Test or Per-Suite Isolation**: Run each test in its own container or batch tests together
- **Resource Limits**: Control CPU, memory, and process limits per container
- **Network Isolation**: Prevent external network access or configure custom networking
- **Automatic Cleanup**: Containers are automatically removed after execution
- **Retry Logic**: Failed containers can be automatically retried with exponential backoff
- **Resource Monitoring**: Track CPU, memory, and I/O usage per container
- **Lifecycle Events**: Subscribe to container creation, start, stop, and removal events
- **Docker Remote Support**: Works with both local Docker and remote Docker hosts

## Installation

First, ensure Docker is installed and running on your system:

```bash
# Check Docker is installed
docker --version

# Install dependencies
npm install dockerode @types/dockerode
```

## Quick Start

### Basic Usage

```typescript
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

// Create executor with default configuration
const executor = new DockerTestExecutor(
  DockerConfig.createDefault()
);

// Execute tests
const result = await executor.executeTests({
  outputDir: './generated-tests',
  testPath: './generated-tests/**/*.spec.ts',
});

console.log(`Tests completed: ${result.passed} passed, ${result.failed} failed`);
console.log(`Containers used: ${result.dockerStats.totalContainers}`);

// Cleanup
await executor.cleanup();
```

### Using Convenience Function

```typescript
import { executeTestsInDocker } from 'api-test-agent';

const result = await executeTestsInDocker({
  outputDir: './generated-tests',
  dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
  isolationPerTest: true,
  cleanupStrategy: 'batch',
});
```

## Configuration

### Resource Presets

The Docker executor provides several resource presets for different test scenarios:

```typescript
import { DockerConfig, RESOURCE_PRESETS } from 'api-test-agent';

// Minimal resources (512MB RAM, 0.5 CPU)
const minimalConfig = DockerConfig.createWithPreset('minimal');

// Standard resources (2GB RAM, 2 CPUs)
const standardConfig = DockerConfig.createWithPreset('standard');

// High resources (4GB RAM, 4 CPUs)
const highConfig = DockerConfig.createWithPreset('high');

// Maximum resources (8GB RAM, 8 CPUs)
const maxConfig = DockerConfig.createWithPreset('maximum');
```

### Network Presets

Control network access for your tests:

```typescript
import { DockerConfig, NETWORK_PRESETS } from 'api-test-agent';

// Isolated network (no external access)
const isolated = DockerConfig.createWithPreset('standard', 'isolated');

// Bridge network (standard Docker networking)
const bridge = DockerConfig.createWithPreset('standard', 'bridge');

// Host network (use host's network stack)
const host = DockerConfig.createWithPreset('standard', 'host');

// Custom network
const custom = DockerConfig.createWithPreset('standard', 'custom');
```

### Custom Configuration

```typescript
import { DockerTestExecutor, NetworkMode, CleanupStrategy } from 'api-test-agent';

const executor = new DockerTestExecutor({
  // Docker settings
  dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
  dockerHost: 'tcp://remote-docker-host:2375', // Optional: remote Docker
  pullImage: true, // Pull latest image before execution

  // Isolation strategy
  isolationPerTest: true, // One container per test file

  // Resource limits
  resources: {
    memoryMB: 2048,
    cpuLimit: 2,
    pidsLimit: 256,
  },

  // Network configuration
  network: {
    mode: NetworkMode.BRIDGE,
    dns: ['8.8.8.8', '8.8.4.4'],
    isolated: true,
  },

  // Volume mounts
  volumes: [
    {
      hostPath: '/path/to/test-data',
      containerPath: '/data',
      mode: 'ro', // read-only
    },
  ],

  // Cleanup strategy
  cleanupStrategy: CleanupStrategy.BATCH, // Clean up after all tests
  keepContainers: false, // Set to true for debugging

  // Retry configuration
  containerRetry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryOnExitCodes: [125, 126, 127, 137, 139],
  },

  // Logging
  captureLogs: true,
  showProgress: true,

  // Test execution options
  outputDir: './generated-tests',
  workers: 4,
  timeout: 30000,
  retries: 2,
});
```

## Advanced Usage

### Monitoring Container Events

```typescript
import { DockerTestExecutor, ContainerLifecycleEventType } from 'api-test-agent';

const executor = new DockerTestExecutor(config);

// Subscribe to lifecycle events
executor.onContainerEvent((event) => {
  console.log(`[${event.type}] ${event.containerName} at ${event.timestamp}`);

  if (event.type === ContainerLifecycleEventType.ERROR) {
    console.error('Container error:', event.data);
  }
});

await executor.executeTests();
```

### Executing Individual Tests

```typescript
const executor = new DockerTestExecutor(config);

// Execute a single test file
const result = await executor.executeTest(
  './generated-tests/users-api.spec.ts'
);

console.log('Test result:', result);
console.log('Container logs:', result.stdout);
console.log('Resource usage:', result.resourceUsage);
```

### Getting Statistics

```typescript
const executor = new DockerTestExecutor(config);

await executor.executeTests();

const stats = executor.getStats();

console.log('Total containers:', stats.totalContainers);
console.log('Successful containers:', stats.successfulContainers);
console.log('Failed containers:', stats.failedContainers);
console.log('Average duration:', stats.averageDuration);
console.log('Total resource usage:', stats.totalResourceUsage);
console.log('Retry statistics:', stats.retryStats);
```

### Recommended Configuration

Get an automatically optimized configuration based on your test characteristics:

```typescript
import { DockerConfig } from 'api-test-agent';

const config = DockerConfig.getRecommendedConfig({
  testCount: 50,
  hasBrowserTests: true,
  hasAPITests: true,
  hasHeavyComputation: false,
  needsNetworkIsolation: true,
});

const executor = new DockerTestExecutor(config);
```

## Integration with Pipeline

### Integrate with PipelineOrchestrator

```typescript
import { PipelineOrchestrator } from 'api-test-agent';
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

// Create Docker executor
const dockerExecutor = new DockerTestExecutor(
  DockerConfig.getRecommendedConfig({
    testCount: 100,
    hasBrowserTests: true,
    hasAPITests: true,
    hasHeavyComputation: false,
    needsNetworkIsolation: false,
  })
);

// Use in pipeline
const pipeline = new PipelineOrchestrator({
  specPath: './specs/api.yaml',
  outputDir: './generated-tests',
  baseUrl: 'https://api.example.com',
  enableHealing: true,
  useAI: true,
});

// Execute pipeline
const pipelineResult = await pipeline.execute();

// Then run tests in Docker
const dockerResult = await dockerExecutor.executeTests({
  testPath: pipelineResult.generation.files.map(f => f.filePath),
});

console.log('Docker execution result:', dockerResult);
```

### Integration with PlaywrightExecutor

The Docker executor can work alongside the PlaywrightExecutor:

```typescript
import { PlaywrightExecutor } from 'api-test-agent/core/playwright-executor';
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

// Use PlaywrightExecutor for local development
const localExecutor = new PlaywrightExecutor({
  outputDir: './generated-tests',
  workers: 4,
});

// Use DockerExecutor for CI/CD
const ciExecutor = new DockerTestExecutor({
  ...DockerConfig.createDefault(),
  outputDir: './generated-tests',
  isolationPerTest: true,
});

// Choose executor based on environment
const executor = process.env.CI ? ciExecutor : localExecutor;
```

## Docker Images

### Supported Images

The executor works with various Docker images:

```typescript
import { DEFAULT_DOCKER_IMAGES } from 'api-test-agent';

// Playwright with browsers (default)
dockerImage: DEFAULT_DOCKER_IMAGES.playwright

// Node.js Alpine (lightweight)
dockerImage: DEFAULT_DOCKER_IMAGES.node

// Ubuntu with Node.js
dockerImage: DEFAULT_DOCKER_IMAGES.ubuntu

// Custom image
dockerImage: 'your-registry/your-image:tag'
```

### Building Custom Images

Create a Dockerfile for your tests:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install additional dependencies
RUN apt-get update && apt-get install -y curl jq

# Copy test files
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Set up test environment
ENV NODE_ENV=test
ENV CI=true

# Default command
CMD ["npx", "playwright", "test"]
```

Build and use:

```bash
docker build -t my-test-runner:latest .
```

```typescript
const executor = new DockerTestExecutor({
  dockerImage: 'my-test-runner:latest',
  outputDir: './generated-tests',
});
```

## Troubleshooting

### Common Issues

#### Docker Daemon Not Running

```
Error: Cannot connect to Docker daemon
```

**Solution**: Start Docker Desktop or Docker daemon:
```bash
# macOS/Windows
# Start Docker Desktop

# Linux
sudo systemctl start docker
```

#### Permission Denied

```
Error: Permission denied while trying to connect to Docker daemon socket
```

**Solution**: Add user to docker group:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

#### Container Creation Failed

```
Error: Failed to create container: No such image
```

**Solution**: Pull the image first:
```bash
docker pull mcr.microsoft.com/playwright:v1.40.0-jammy
```

Or enable automatic pulling:
```typescript
const executor = new DockerTestExecutor({
  dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
  pullImage: true, // Auto-pull if not found
});
```

#### Out of Resources

```
Error: Container exited with code 137 (out of memory)
```

**Solution**: Increase resource limits:
```typescript
const executor = new DockerTestExecutor({
  resources: {
    memoryMB: 4096, // Increase from 2GB to 4GB
    cpuLimit: 4,
  },
});
```

### Debugging

Enable container preservation for debugging:

```typescript
const executor = new DockerTestExecutor({
  keepContainers: true, // Don't remove containers
  captureLogs: true, // Capture all logs
  showProgress: true, // Show progress output
});

await executor.executeTests();

// Containers will remain for inspection
// List containers: docker ps -a
// View logs: docker logs <container-id>
// Inspect: docker inspect <container-id>
```

## Environment Variables

Configure Docker executor via environment variables:

```bash
# Docker host
export DOCKER_HOST=tcp://remote-host:2375

# Docker TLS settings
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=/path/to/certs

# Test configuration
export TEST_TIMEOUT=60000
export TEST_WORKERS=8
export TEST_RETRIES=3
```

## Performance Tips

1. **Use batch isolation for large test suites**: Set `isolationPerTest: false` to run all tests in fewer containers
2. **Enable image caching**: Keep `pullImage: false` after initial pull
3. **Use appropriate resource presets**: Don't over-allocate resources
4. **Leverage volume mounts**: Mount node_modules as read-only to avoid copying
5. **Use cleanup strategy wisely**: `IMMEDIATE` for long-running suites, `BATCH` for quick tests

## CI/CD Integration

### GitHub Actions

```yaml
name: Docker Test Execution

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker
        uses: docker/setup-buildx-action@v2

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests in Docker
        run: |
          npm run test:docker
        env:
          DOCKER_HOST: unix:///var/run/docker.sock
```

### GitLab CI

```yaml
docker-tests:
  image: docker:latest
  services:
    - docker:dind
  script:
    - npm ci
    - npm run test:docker
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
```

## API Reference

See [/home/user/AgentBank/src/types/docker-types.ts](../src/types/docker-types.ts) for complete type definitions.

Key classes and functions:
- `DockerTestExecutor` - Main executor class
- `DockerConfig` - Configuration utilities
- `createDockerExecutor()` - Factory function
- `executeTestsInDocker()` - Convenience function

## Examples

See [/home/user/AgentBank/docs/docker-executor-examples.md](./docker-executor-examples.md) for more examples.

## License

MIT
