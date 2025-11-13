# Docker Test Executor Examples

This document provides practical examples for using the Docker Test Executor in various scenarios.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Configuration Examples](#configuration-examples)
- [Integration Examples](#integration-examples)
- [Advanced Examples](#advanced-examples)
- [CI/CD Examples](#cicd-examples)

## Basic Examples

### Example 1: Simple Test Execution

```typescript
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

async function runBasicTests() {
  const executor = new DockerTestExecutor(
    DockerConfig.createDefault()
  );

  try {
    const result = await executor.executeTests({
      outputDir: './generated-tests',
      showProgress: true,
    });

    console.log('Execution Summary:');
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Duration: ${result.duration}ms`);
  } finally {
    await executor.cleanup();
  }
}

runBasicTests().catch(console.error);
```

### Example 2: Per-Test Isolation

```typescript
import { DockerTestExecutor, CleanupStrategy } from 'api-test-agent';

async function runIsolatedTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    isolationPerTest: true, // Each test gets its own container
    cleanupStrategy: CleanupStrategy.IMMEDIATE,
    showProgress: true,
  });

  const result = await executor.executeTests();

  console.log(`Executed ${result.dockerStats.totalContainers} containers`);
  console.log(`Success rate: ${(result.successRate * 100).toFixed(2)}%`);

  await executor.cleanup();
}

runIsolatedTests().catch(console.error);
```

### Example 3: Execute Single Test

```typescript
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

async function runSingleTest() {
  const executor = new DockerTestExecutor(
    DockerConfig.createDefault()
  );

  const result = await executor.executeTest(
    './generated-tests/users-api.spec.ts',
    {
      timeout: 60000,
      retries: 2,
    }
  );

  console.log('Container Result:');
  console.log(`Container ID: ${result.containerId}`);
  console.log(`Exit Code: ${result.exitCode}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Tests: ${result.testResults.length}`);

  if (result.resourceUsage) {
    console.log(`Memory Used: ${result.resourceUsage.memoryMB.toFixed(2)}MB`);
    console.log(`CPU: ${result.resourceUsage.cpuPercent.toFixed(2)}%`);
  }

  await executor.cleanup();
}

runSingleTest().catch(console.error);
```

## Configuration Examples

### Example 4: Resource Presets

```typescript
import { DockerTestExecutor, DockerConfig, RESOURCE_PRESETS } from 'api-test-agent';

// Minimal resources for lightweight tests
async function runLightweightTests() {
  const executor = new DockerTestExecutor(
    DockerConfig.createWithPreset('minimal', 'bridge')
  );

  return executor.executeTests({
    outputDir: './generated-tests',
  });
}

// High resources for intensive tests
async function runIntensiveTests() {
  const executor = new DockerTestExecutor({
    ...DockerConfig.createWithPreset('high', 'bridge'),
    outputDir: './generated-tests',
  });

  return executor.executeTests();
}

// Custom resource configuration
async function runCustomResourceTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    resources: {
      memoryMB: 3072, // 3GB
      cpuLimit: 3,
      pidsLimit: 512,
    },
  });

  return executor.executeTests();
}
```

### Example 5: Network Configuration

```typescript
import { DockerTestExecutor, NetworkMode } from 'api-test-agent';

// Isolated network (no external access)
async function runIsolatedNetworkTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    network: {
      mode: NetworkMode.NONE,
      isolated: true,
    },
  });

  return executor.executeTests();
}

// Custom network with DNS
async function runCustomNetworkTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    network: {
      mode: NetworkMode.CUSTOM,
      networkName: 'test-network',
      dns: ['8.8.8.8', '1.1.1.1'],
      extraHosts: {
        'api.local': '127.0.0.1',
        'db.local': '192.168.1.100',
      },
    },
  });

  return executor.executeTests();
}

// Port mapping
async function runPortMappedTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    network: {
      mode: NetworkMode.BRIDGE,
      ports: {
        3000: 3000, // Map container port 3000 to host port 3000
        8080: 8080,
      },
    },
  });

  return executor.executeTests();
}
```

### Example 6: Volume Mounts

```typescript
import { DockerTestExecutor } from 'api-test-agent';
import * as path from 'path';

async function runTestsWithVolumes() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    volumes: [
      // Mount test data directory as read-only
      {
        hostPath: path.resolve('./test-data'),
        containerPath: '/data',
        mode: 'ro',
      },
      // Mount fixtures directory
      {
        hostPath: path.resolve('./fixtures'),
        containerPath: '/fixtures',
        mode: 'ro',
      },
      // Mount output directory for reports
      {
        hostPath: path.resolve('./test-results'),
        containerPath: '/results',
        mode: 'rw',
      },
    ],
  });

  return executor.executeTests();
}

runTestsWithVolumes().catch(console.error);
```

## Integration Examples

### Example 7: Integration with PipelineOrchestrator

```typescript
import {
  PipelineOrchestrator,
  DockerTestExecutor,
  DockerConfig,
} from 'api-test-agent';

async function runCompletePipeline() {
  // Step 1: Generate tests from OpenAPI spec
  const pipeline = new PipelineOrchestrator({
    specPath: './specs/petstore.yaml',
    outputDir: './generated-tests',
    baseUrl: 'https://petstore3.swagger.io/api/v3',
    useAI: true,
    enableHealing: true,
    verbose: true,
  });

  console.log('Running pipeline...');
  const pipelineResult = await pipeline.execute();

  console.log(`Generated ${pipelineResult.generation.totalTests} tests`);

  // Step 2: Execute tests in Docker containers
  const dockerExecutor = new DockerTestExecutor({
    ...DockerConfig.getRecommendedConfig({
      testCount: pipelineResult.generation.totalTests,
      hasBrowserTests: true,
      hasAPITests: true,
      hasHeavyComputation: false,
      needsNetworkIsolation: false,
    }),
    outputDir: './generated-tests',
    showProgress: true,
  });

  console.log('Executing tests in Docker...');
  const dockerResult = await dockerExecutor.executeTests();

  console.log('Results:');
  console.log(`Pipeline Success: ${pipelineResult.success}`);
  console.log(`Tests Passed: ${dockerResult.passed}`);
  console.log(`Tests Failed: ${dockerResult.failed}`);
  console.log(`Containers Used: ${dockerResult.dockerStats.totalContainers}`);

  await dockerExecutor.cleanup();

  return {
    pipeline: pipelineResult,
    docker: dockerResult,
  };
}

runCompletePipeline().catch(console.error);
```

### Example 8: Parallel Execution with Worker Manager

```typescript
import {
  DockerTestExecutor,
  WorkerManager,
  DockerConfig,
} from 'api-test-agent';

async function runParallelTests() {
  const dockerExecutor = new DockerTestExecutor(
    DockerConfig.createWithPreset('standard', 'bridge')
  );

  const workerManager = new WorkerManager({
    maxWorkers: 4,
    minWorkers: 2,
    memoryLimitMB: 2048,
    workerTimeout: 60000,
    isolation: true,
  });

  // Get test files
  const testFiles = [
    './generated-tests/users-api.spec.ts',
    './generated-tests/products-api.spec.ts',
    './generated-tests/orders-api.spec.ts',
    './generated-tests/auth-api.spec.ts',
  ];

  // Execute tests in parallel using Docker
  const results = await Promise.all(
    testFiles.map((file) =>
      dockerExecutor.executeTest(file, {
        timeout: 30000,
        retries: 2,
      })
    )
  );

  console.log('Parallel execution results:');
  results.forEach((result, index) => {
    console.log(`Test ${index + 1}: ${result.testResults.length} tests`);
    console.log(`  Exit code: ${result.exitCode}`);
    console.log(`  Duration: ${result.duration}ms`);
  });

  await dockerExecutor.cleanup();
}

runParallelTests().catch(console.error);
```

## Advanced Examples

### Example 9: Container Event Monitoring

```typescript
import {
  DockerTestExecutor,
  DockerConfig,
  ContainerLifecycleEventType,
} from 'api-test-agent';

async function runTestsWithMonitoring() {
  const executor = new DockerTestExecutor(
    DockerConfig.createDefault()
  );

  // Track container lifecycle
  const events: string[] = [];

  executor.onContainerEvent((event) => {
    const message = `[${event.timestamp.toISOString()}] ${event.type}: ${event.containerName}`;
    events.push(message);
    console.log(message);

    // Handle specific events
    switch (event.type) {
      case ContainerLifecycleEventType.CREATED:
        console.log(`  Container ${event.containerId} created`);
        break;

      case ContainerLifecycleEventType.STARTED:
        console.log(`  Container ${event.containerId} started`);
        break;

      case ContainerLifecycleEventType.ERROR:
        console.error(`  Container error:`, event.data);
        break;

      case ContainerLifecycleEventType.REMOVED:
        console.log(`  Container ${event.containerId} removed`);
        break;
    }
  });

  const result = await executor.executeTests({
    outputDir: './generated-tests',
  });

  console.log(`\nTotal events captured: ${events.length}`);
  console.log(`Tests executed: ${result.totalTests}`);

  await executor.cleanup();
}

runTestsWithMonitoring().catch(console.error);
```

### Example 10: Retry Logic with Custom Configuration

```typescript
import { DockerTestExecutor, ContainerErrorCode } from 'api-test-agent';

async function runTestsWithRetry() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    containerRetry: {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryOnExitCodes: [125, 126, 127, 137, 139, 143],
    },
  });

  const result = await executor.executeTests();

  // Check retry statistics
  const stats = executor.getStats();

  console.log('Retry Statistics:');
  console.log(`Total retries: ${stats.retryStats.totalRetries}`);
  console.log('Retries by reason:');

  Object.entries(stats.retryStats.retriesByReason).forEach(([reason, count]) => {
    console.log(`  ${reason}: ${count}`);
  });

  console.log(`\nRetried containers: ${result.retriedContainers.length}`);
  result.retriedContainers.forEach((name) => {
    console.log(`  - ${name}`);
  });

  await executor.cleanup();
}

runTestsWithRetry().catch(console.error);
```

### Example 11: Resource Usage Tracking

```typescript
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

async function trackResourceUsage() {
  const executor = new DockerTestExecutor(
    DockerConfig.createDefault()
  );

  const result = await executor.executeTests({
    outputDir: './generated-tests',
    captureLogs: true,
  });

  console.log('Resource Usage Report:');
  console.log('======================\n');

  result.containers.forEach((container, index) => {
    console.log(`Container ${index + 1}: ${container.containerName}`);
    console.log(`  Duration: ${container.duration}ms`);
    console.log(`  Exit Code: ${container.exitCode}`);

    if (container.resourceUsage) {
      const { memoryMB, memoryLimitMB, cpuPercent, memoryPercent } =
        container.resourceUsage;

      console.log(`  Memory: ${memoryMB.toFixed(2)}MB / ${memoryLimitMB.toFixed(2)}MB (${memoryPercent.toFixed(2)}%)`);
      console.log(`  CPU: ${cpuPercent.toFixed(2)}%`);
    }

    console.log('');
  });

  // Overall statistics
  const stats = executor.getStats();

  console.log('Overall Statistics:');
  console.log(`Total Memory Used: ${stats.totalResourceUsage.memoryMB.toFixed(2)}MB`);
  console.log(`Total CPU Time: ${stats.totalResourceUsage.cpuSeconds.toFixed(2)}s`);
  console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);

  await executor.cleanup();
}

trackResourceUsage().catch(console.error);
```

### Example 12: Debugging Failed Tests

```typescript
import { DockerTestExecutor, CleanupStrategy, TestStatus } from 'api-test-agent';
import * as fs from 'fs/promises';

async function debugFailedTests() {
  const executor = new DockerTestExecutor({
    dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
    outputDir: './generated-tests',
    keepContainers: true, // Keep containers for inspection
    cleanupStrategy: CleanupStrategy.MANUAL,
    captureLogs: true,
  });

  const result = await executor.executeTests();

  // Find failed tests
  const failedContainers = result.containers.filter(
    (c) => c.exitCode !== 0 || c.testResults.some((t) => t.status === TestStatus.FAILED)
  );

  if (failedContainers.length > 0) {
    console.log(`Found ${failedContainers.length} failed containers`);

    // Save logs for each failed container
    for (const container of failedContainers) {
      const logFile = `./debug-logs/${container.containerName}.log`;

      await fs.mkdir('./debug-logs', { recursive: true });
      await fs.writeFile(
        logFile,
        `Container: ${container.containerName}\n` +
          `Container ID: ${container.containerId}\n` +
          `Exit Code: ${container.exitCode}\n` +
          `Duration: ${container.duration}ms\n\n` +
          `=== STDOUT ===\n${container.stdout}\n\n` +
          `=== STDERR ===\n${container.stderr}\n\n` +
          `=== FAILED TESTS ===\n` +
          container.testResults
            .filter((t) => t.status === TestStatus.FAILED)
            .map((t) => `${t.name}: ${t.error?.message}`)
            .join('\n')
      );

      console.log(`Logs saved to: ${logFile}`);
      console.log(`Inspect container: docker inspect ${container.containerId}`);
      console.log(`View logs: docker logs ${container.containerId}`);
    }

    console.log('\nNote: Containers were not removed. Clean up manually with:');
    console.log('  docker ps -a | grep agentbank-test | awk \'{print $1}\' | xargs docker rm -f');
  }

  // Don't cleanup automatically in debug mode
  // await executor.cleanup();
}

debugFailedTests().catch(console.error);
```

## CI/CD Examples

### Example 13: GitHub Actions Workflow

```typescript
// test-docker.ts
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';
import * as process from 'process';

async function runCITests() {
  const isCI = process.env.CI === 'true';
  const githubActions = process.env.GITHUB_ACTIONS === 'true';

  console.log(`Running in ${isCI ? 'CI' : 'local'} mode`);

  const executor = new DockerTestExecutor({
    ...DockerConfig.getRecommendedConfig({
      testCount: 100,
      hasBrowserTests: true,
      hasAPITests: true,
      hasHeavyComputation: false,
      needsNetworkIsolation: false,
    }),
    outputDir: process.env.TEST_OUTPUT_DIR || './generated-tests',
    dockerHost: process.env.DOCKER_HOST,
    showProgress: true,
  });

  try {
    const result = await executor.executeTests();

    // Generate summary for GitHub Actions
    if (githubActions) {
      const summary = [
        '## Docker Test Results',
        '',
        `- **Total Tests**: ${result.totalTests}`,
        `- **Passed**: ${result.passed} ✅`,
        `- **Failed**: ${result.failed} ❌`,
        `- **Skipped**: ${result.skipped} ⏭️`,
        `- **Duration**: ${(result.duration / 1000).toFixed(2)}s`,
        `- **Containers**: ${result.dockerStats.totalContainers}`,
        `- **Success Rate**: ${(result.successRate * 100).toFixed(2)}%`,
        '',
      ].join('\n');

      console.log(summary);

      // Set GitHub Actions output
      console.log(`::set-output name=tests-passed::${result.passed}`);
      console.log(`::set-output name=tests-failed::${result.failed}`);
      console.log(`::set-output name=success-rate::${result.successRate}`);
    }

    await executor.cleanup();

    // Exit with appropriate code
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution failed:', error);
    await executor.cleanup(true); // Force cleanup
    process.exit(1);
  }
}

runCITests();
```

### Example 14: Multi-Environment Testing

```typescript
import { DockerTestExecutor, DockerConfig } from 'api-test-agent';

interface Environment {
  name: string;
  baseUrl: string;
  dockerImage: string;
  resources: 'minimal' | 'standard' | 'high';
}

async function runMultiEnvironmentTests() {
  const environments: Environment[] = [
    {
      name: 'development',
      baseUrl: 'https://dev.api.example.com',
      dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
      resources: 'minimal',
    },
    {
      name: 'staging',
      baseUrl: 'https://staging.api.example.com',
      dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
      resources: 'standard',
    },
    {
      name: 'production',
      baseUrl: 'https://api.example.com',
      dockerImage: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
      resources: 'high',
    },
  ];

  const results = new Map();

  for (const env of environments) {
    console.log(`\nTesting ${env.name} environment...`);

    const executor = new DockerTestExecutor({
      ...DockerConfig.createWithPreset(env.resources, 'bridge'),
      dockerImage: env.dockerImage,
      outputDir: './generated-tests',
      containerEnv: {
        BASE_URL: env.baseUrl,
        ENVIRONMENT: env.name,
      },
    });

    const result = await executor.executeTests();
    results.set(env.name, result);

    console.log(`${env.name} results:`);
    console.log(`  Passed: ${result.passed}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Duration: ${result.duration}ms`);

    await executor.cleanup();
  }

  // Summary
  console.log('\n=== Multi-Environment Test Summary ===');
  for (const [envName, result] of results) {
    const status = result.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${envName}: ${result.passed}/${result.totalTests} passed`);
  }
}

runMultiEnvironmentTests().catch(console.error);
```

## Performance Examples

### Example 15: Benchmark Different Configurations

```typescript
import { DockerTestExecutor, DockerConfig, RESOURCE_PRESETS } from 'api-test-agent';

async function benchmarkConfigurations() {
  const configurations = [
    { name: 'Minimal Resources', preset: 'minimal' as const },
    { name: 'Standard Resources', preset: 'standard' as const },
    { name: 'High Resources', preset: 'high' as const },
  ];

  const benchmarkResults = [];

  for (const config of configurations) {
    console.log(`\nBenchmarking: ${config.name}`);

    const executor = new DockerTestExecutor(
      DockerConfig.createWithPreset(config.preset, 'bridge')
    );

    const startTime = Date.now();
    const result = await executor.executeTests({
      outputDir: './generated-tests',
    });
    const totalTime = Date.now() - startTime;

    const stats = executor.getStats();

    benchmarkResults.push({
      name: config.name,
      totalTime,
      averageTestTime: stats.averageDuration,
      successRate: result.successRate,
      containersUsed: stats.totalContainers,
      memoryUsed: stats.totalResourceUsage.memoryMB,
      cpuTime: stats.totalResourceUsage.cpuSeconds,
    });

    await executor.cleanup();
  }

  // Print benchmark results
  console.log('\n=== Benchmark Results ===\n');
  console.log('Configuration           | Time    | Avg Test | Success | Containers | Memory  | CPU');
  console.log('------------------------|---------|----------|---------|------------|---------|--------');

  benchmarkResults.forEach((r) => {
    console.log(
      `${r.name.padEnd(23)} | ` +
        `${(r.totalTime / 1000).toFixed(1)}s  | ` +
        `${r.averageTestTime.toFixed(0)}ms    | ` +
        `${(r.successRate * 100).toFixed(1)}%   | ` +
        `${r.containersUsed}          | ` +
        `${r.memoryUsed.toFixed(0)}MB   | ` +
        `${r.cpuTime.toFixed(1)}s`
    );
  });
}

benchmarkConfigurations().catch(console.error);
```

## Complete Application Example

### Example 16: Full-Featured Test Runner

```typescript
import {
  DockerTestExecutor,
  DockerConfig,
  PipelineOrchestrator,
  ContainerLifecycleEventType,
  TestStatus,
} from 'api-test-agent';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestRunnerOptions {
  specPath: string;
  outputDir: string;
  baseUrl: string;
  useDocker: boolean;
  generateReport: boolean;
  verbose: boolean;
}

async function runCompleteTestSuite(options: TestRunnerOptions) {
  const {
    specPath,
    outputDir,
    baseUrl,
    useDocker,
    generateReport,
    verbose,
  } = options;

  console.log('🚀 AgentBank Test Runner\n');

  // Step 1: Generate tests
  console.log('📋 Step 1: Generating tests from OpenAPI spec...');
  const pipeline = new PipelineOrchestrator({
    specPath,
    outputDir,
    baseUrl,
    useAI: true,
    enableHealing: false,
    verbose,
  });

  const pipelineResult = await pipeline.execute();
  console.log(`✅ Generated ${pipelineResult.generation.totalTests} tests\n`);

  // Step 2: Execute tests
  console.log('🧪 Step 2: Executing tests...');

  let executionResult;

  if (useDocker) {
    console.log('Using Docker for test execution');

    const dockerExecutor = new DockerTestExecutor({
      ...DockerConfig.getRecommendedConfig({
        testCount: pipelineResult.generation.totalTests,
        hasBrowserTests: true,
        hasAPITests: true,
        hasHeavyComputation: false,
        needsNetworkIsolation: false,
      }),
      outputDir,
      showProgress: verbose,
      captureLogs: true,
    });

    // Monitor events
    if (verbose) {
      dockerExecutor.onContainerEvent((event) => {
        if (
          event.type === ContainerLifecycleEventType.STARTED ||
          event.type === ContainerLifecycleEventType.ERROR
        ) {
          console.log(`  [${event.type}] ${event.containerName}`);
        }
      });
    }

    executionResult = await dockerExecutor.executeTests();
    await dockerExecutor.cleanup();
  } else {
    console.log('Using local Playwright executor');
    // Use PlaywrightExecutor (not shown for brevity)
  }

  console.log(`✅ Executed ${executionResult.totalTests} tests\n`);

  // Step 3: Generate report
  if (generateReport) {
    console.log('📊 Step 3: Generating report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: executionResult.totalTests,
        passed: executionResult.passed,
        failed: executionResult.failed,
        skipped: executionResult.skipped,
        duration: executionResult.duration,
        successRate: executionResult.successRate,
      },
      docker: useDocker
        ? {
            containersUsed: executionResult.dockerStats?.totalContainers,
            averageDuration: executionResult.dockerStats?.averageDuration,
            resourceUsage: executionResult.dockerStats?.totalResourceUsage,
          }
        : null,
      failedTests: executionResult.byFile
        ? Object.entries(executionResult.byFile)
            .filter(([, summary]: [string, any]) => summary.failed > 0)
            .map(([file, summary]: [string, any]) => ({
              file,
              failed: summary.failed,
              total: summary.testCount,
            }))
        : [],
    };

    const reportPath = path.join(outputDir, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    console.log(`✅ Report saved to: ${reportPath}\n`);
  }

  // Step 4: Print summary
  console.log('📊 Test Summary');
  console.log('===============\n');
  console.log(`Total Tests:    ${executionResult.totalTests}`);
  console.log(`✅ Passed:      ${executionResult.passed}`);
  console.log(`❌ Failed:      ${executionResult.failed}`);
  console.log(`⏭️  Skipped:    ${executionResult.skipped}`);
  console.log(`⏱️  Duration:    ${(executionResult.duration / 1000).toFixed(2)}s`);
  console.log(`📈 Success Rate: ${(executionResult.successRate * 100).toFixed(2)}%`);

  if (useDocker && executionResult.dockerStats) {
    console.log(`\n🐳 Docker Stats`);
    console.log(`Containers:     ${executionResult.dockerStats.totalContainers}`);
    console.log(`Avg Duration:   ${executionResult.dockerStats.averageDuration.toFixed(2)}ms`);
  }

  // Return exit code based on results
  return executionResult.failed === 0 ? 0 : 1;
}

// CLI interface
if (require.main === module) {
  const options: TestRunnerOptions = {
    specPath: process.env.SPEC_PATH || './specs/api.yaml',
    outputDir: process.env.OUTPUT_DIR || './generated-tests',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    useDocker: process.env.USE_DOCKER === 'true',
    generateReport: process.env.GENERATE_REPORT !== 'false',
    verbose: process.env.VERBOSE === 'true',
  };

  runCompleteTestSuite(options)
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}
```

---

For more information, see the [Docker Executor Guide](./docker-executor-guide.md).
