# Performance Testing System

Complete performance and load testing capabilities for AgentBank.

## Overview

The performance testing system allows you to:
- **Generate load tests** - Simulate concurrent users
- **Generate stress tests** - Find breaking points
- **Generate spike tests** - Test sudden load increases
- **Generate endurance tests** - Test sustained load over time
- **Measure performance** - Response times (p50, p95, p99), throughput, error rates
- **Generate reports** - HTML, JSON, CSV, JMeter XML, Markdown formats

## Architecture

### Components

1. **PerformanceTestGenerator** (`src/generators/performance-test-generator.ts`)
   - Generates performance test cases from OpenAPI endpoints
   - Supports multiple test types: load, stress, spike, endurance
   - Configurable load patterns: constant, ramp, spike, wave, step

2. **LoadTestRunner** (`src/executor/load-test-runner.ts`)
   - Executes performance tests with virtual users
   - Simulates realistic user behavior with think time
   - Tracks metrics in real-time
   - Supports session/cookie management

3. **PerformanceReporter** (`src/reporting/performance-reporter.ts`)
   - Generates comprehensive performance reports
   - Exports to multiple formats (HTML, JSON, CSV, etc.)
   - Provides baseline comparison for trend analysis
   - Creates ASCII charts for console output

4. **Performance Types** (`src/types/performance-types.ts`)
   - Complete TypeScript type definitions
   - Ensures type safety across the system

## Quick Start

### Generate Performance Tests from CLI

```bash
# Generate performance tests with default settings (10 users, 60 seconds)
npm run generate -- -s ./openapi.yaml --performance

# Generate with custom settings
npm run generate -- -s ./openapi.yaml --performance --load-users=50 --duration=300

# Generate all test types including performance
npm run generate -- -s ./openapi.yaml --performance --auth --errors --edge-cases
```

### Programmatic Usage

```typescript
import { parseOpenAPIFile } from './src/core/openapi-parser.js';
import { PerformanceTestGenerator } from './src/generators/performance-test-generator.js';
import { LoadTestRunner } from './src/executor/load-test-runner.js';
import { PerformanceReporter } from './src/reporting/performance-reporter.js';

// 1. Parse OpenAPI spec
const spec = await parseOpenAPIFile('./openapi.yaml');

// 2. Extract endpoints
const endpoints = extractEndpoints(spec);

// 3. Generate performance tests
const generator = new PerformanceTestGenerator({
  defaultUsers: 20,
  defaultDuration: 120,
  generateMultipleScenarios: true,
});

const tests = generator.generateTests(endpoints);

// 4. Configure and run load tests
const config = {
  tests,
  baseURL: 'https://api.example.com',
  trackResources: true,
};

const runner = new LoadTestRunner(config);
const metrics = await runner.executeTests();

// 5. Generate and export report
const reporter = new PerformanceReporter();
const report = await reporter.generateReport(config, metrics);

await reporter.exportReport(report, {
  format: 'html',
  outputPath: './reports/performance/report.html',
  includeCharts: true,
});
```

## Test Types

### 1. Load Test
Simulates a constant number of concurrent users to test normal load conditions.

```typescript
const loadTest = generator.generateLoadTest(endpoint);
// - Pattern: constant
// - Users: 10 (default)
// - Duration: 60s (default)
```

### 2. Stress Test
Gradually increases load to find the breaking point of your API.

```typescript
const stressTest = generator.generateStressTest(endpoint);
// - Pattern: ramp
// - Users: 50 (5x normal load)
// - Duration: 120s
// - Ramp up: 60s
```

### 3. Spike Test
Tests API behavior during sudden traffic spikes.

```typescript
const spikeTest = generator.generateSpikeTest(endpoint);
// - Pattern: spike
// - Users: 100 (10x spike)
// - Duration: 120s
// - Spike duration: 5s
```

### 4. Endurance Test
Tests API stability over extended periods (soak testing).

```typescript
const enduranceTest = generator.generateEnduranceTest(endpoint);
// - Pattern: constant
// - Users: 7 (70% of normal)
// - Duration: 3600s (1 hour)
```

## Load Patterns

### Constant
Maintains a fixed number of users throughout the test.
```
Users
  10 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   5 ░░░░░░░░░░░░░░░░░░░░░░░░░░
   0 ──────────────────────────→
     Time
```

### Ramp
Gradually increases from low to high load.
```
Users
  50 ░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  25 ░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░
   0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░
     Time →
```

### Spike
Sudden increase to peak load.
```
Users
 100 ░░░░░░░░▓▓▓▓░░░░░░░░░░░░░░
  50 ░░░░░░░░▓▓▓▓░░░░░░░░░░░░░░
   0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
     Time →
```

### Wave
Oscillating load pattern.
```
Users
  50 ░░▓▓░░░░░░▓▓░░░░░░▓▓░░░░░░
  25 ▓▓▓▓▓▓░░▓▓▓▓▓▓░░▓▓▓▓▓▓░░░░
   0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
     Time →
```

### Step
Step-wise increase in load.
```
Users
  50 ░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓
  30 ░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  10 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
   0 ──────────────────────────→
     Time
```

## Performance Metrics

### Response Time Statistics
- **Min**: Fastest response
- **Max**: Slowest response
- **Mean**: Average response time
- **Median (p50)**: 50th percentile
- **p90**: 90th percentile
- **p95**: 95th percentile (common SLA metric)
- **p99**: 99th percentile
- **StdDev**: Standard deviation

### Throughput Metrics
- **Requests per second (RPS)**: Total throughput
- **Peak concurrent users**: Maximum simultaneous users
- **Active users**: Current active users over time

### Error Metrics
- **Error rate**: Percentage of failed requests
- **Success rate**: Percentage of successful requests
- **Error breakdown**: Errors by type and endpoint

### Resource Metrics (optional)
- **CPU usage**: Min/Max/Average CPU utilization
- **Memory usage**: Min/Max/Average memory consumption
- **Network I/O**: Inbound/outbound traffic

## Performance Assertions

Define SLA requirements that must be met:

```typescript
const assertions: PerformanceAssertion[] = [
  {
    name: 'Response time p95 < 1000ms',
    metric: 'response_time_p95',
    operator: 'lt',
    threshold: 1000,
    severity: 'error',
  },
  {
    name: 'Error rate < 1%',
    metric: 'error_rate',
    operator: 'lt',
    threshold: 0.01,
    severity: 'critical',
  },
  {
    name: 'Throughput > 50 RPS',
    metric: 'throughput',
    operator: 'gt',
    threshold: 50,
    severity: 'warning',
  },
];
```

## Advanced Features

### Think Time
Simulate realistic user behavior with delays between requests:

```typescript
const thinkTime: ThinkTimeConfig = {
  min: 1000,        // Minimum 1 second
  max: 5000,        // Maximum 5 seconds
  distribution: 'normal',  // normal, uniform, or exponential
  mean: 3000,       // Mean for normal distribution
  stdDev: 500,      // Standard deviation
};
```

### Session Management
Maintain session state across requests:

```typescript
const session: SessionConfig = {
  cookies: true,              // Enable cookie handling
  sessionStorage: true,       // Enable session storage
  timeout: 300000,            // 5 minute timeout
  initEndpoint: '/api/login', // Initialize session
  cleanupEndpoint: '/api/logout',
};
```

### Custom Load Profiles
Create complex multi-stage load profiles:

```typescript
const profile: LoadProfile = {
  pattern: 'custom',
  totalDuration: 3600,
  peakUsers: 1000,
  stages: [
    { name: 'Warm up', targetUsers: 10, duration: 300 },
    { name: 'Ramp up', targetUsers: 100, duration: 600, rampTime: 600 },
    { name: 'Peak', targetUsers: 1000, duration: 1800 },
    { name: 'Ramp down', targetUsers: 10, duration: 300, rampTime: 300 },
  ],
};
```

### Baseline Comparison
Track performance trends over time:

```typescript
const reporter = new PerformanceReporter({
  baselineFile: './baseline.json',
  regressionThreshold: 10, // Alert on 10% regression
});

const report = await reporter.generateReport(config, metrics);

// Report includes comparison with baseline:
// - Improved metrics (faster response times)
// - Regressed metrics (slower response times)
// - Stable metrics (within threshold)
```

## Report Formats

### HTML Report
Interactive report with charts and detailed metrics:
```typescript
await reporter.exportReport(report, {
  format: 'html',
  outputPath: './reports/performance.html',
  includeCharts: true,
  includeTimeSeries: true,
});
```

### JSON Report
Machine-readable format for CI/CD integration:
```typescript
await reporter.exportReport(report, {
  format: 'json',
  outputPath: './reports/performance.json',
});
```

### CSV Report
For spreadsheet analysis:
```typescript
await reporter.exportReport(report, {
  format: 'csv',
  outputPath: './reports/performance.csv',
});
```

### JMeter XML
Compatible with JMeter:
```typescript
await reporter.exportReport(report, {
  format: 'jmeter',
  outputPath: './reports/performance.jtl',
});
```

### Markdown Report
For documentation:
```typescript
await reporter.exportReport(report, {
  format: 'markdown',
  outputPath: './reports/performance.md',
});
```

## Examples

See the `/examples` directory for complete examples:
- `performance-testing-example.ts` - Basic usage
- `advanced-performance-scenarios.ts` - Advanced scenarios

## Best Practices

### 1. Start Small
Begin with low user counts and short durations:
```bash
npm run generate -- -s ./openapi.yaml --performance --load-users=5 --duration=30
```

### 2. Baseline First
Create a baseline before making changes:
```bash
# Run baseline test
npm run test:performance

# Save as baseline
cp ./reports/performance/report.json ./reports/performance/baseline.json
```

### 3. Monitor Resources
Enable resource tracking to identify bottlenecks:
```typescript
const config = {
  tests,
  baseURL: 'https://api.example.com',
  trackResources: true, // Enable CPU/memory tracking
};
```

### 4. Use Realistic Think Time
Add think time to simulate real users:
```typescript
const generator = new PerformanceTestGenerator({
  defaultThinkTime: {
    min: 2000,
    max: 5000,
    distribution: 'normal',
  },
});
```

### 5. Test Production-like Environment
Always test against an environment that matches production configuration.

### 6. Gradual Load Increase
Use ramp patterns to avoid overwhelming the system:
```typescript
const stressTest = generator.generateFromSpec(endpoint, 'stress', 500, 300);
// Gradually ramps from 0 to 500 users
```

### 7. Set Realistic Assertions
Base assertions on business requirements:
```typescript
// Good: Based on SLA
{ name: 'p95 < 500ms', metric: 'response_time_p95', threshold: 500 }

// Too strict: Might cause false failures
{ name: 'p99 < 100ms', metric: 'response_time_p99', threshold: 100 }
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:performance

      - name: Check for regressions
        run: |
          node -e "
            const report = require('./reports/performance/report.json');
            if (report.comparison?.hasRegression) {
              console.error('Performance regression detected!');
              process.exit(1);
            }
          "

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: reports/performance/
```

## Troubleshooting

### High Error Rates
- Increase timeout values
- Check API availability
- Verify authentication
- Review API rate limits

### Resource Issues
- Reduce concurrent users
- Add think time
- Check local system resources
- Use remote test runners for large tests

### Inconsistent Results
- Run tests multiple times
- Use fixed seed for reproducibility
- Test at consistent times (avoid peak hours)
- Ensure stable network conditions

## API Reference

### PerformanceTestGenerator

```typescript
constructor(options?: PerformanceGeneratorOptions)

generateTests(endpoints: ApiEndpoint[]): PerformanceTestCase[]
generateLoadTest(endpoint: ApiEndpoint): PerformanceTestCase
generateStressTest(endpoint: ApiEndpoint): PerformanceTestCase
generateSpikeTest(endpoint: ApiEndpoint): PerformanceTestCase
generateEnduranceTest(endpoint: ApiEndpoint): PerformanceTestCase
generateLoadProfile(pattern: LoadPattern, peakUsers: number, duration: number): LoadProfile
```

### LoadTestRunner

```typescript
constructor(config: LoadTestConfig)

executeTests(): Promise<PerformanceMetrics>
stop(): void
```

### PerformanceReporter

```typescript
constructor(config?: PerformanceReporterConfig)

generateReport(config: LoadTestConfig, metrics: PerformanceMetrics): Promise<PerformanceReport>
exportReport(report: PerformanceReport, options: ReportExportOptions): Promise<void>
printSummary(report: PerformanceReport): void
```

## Contributing

When adding new features:
1. Add types to `src/types/performance-types.ts`
2. Update generator for new test types
3. Update runner for new execution patterns
4. Update reporter for new metrics
5. Add tests and examples
6. Update documentation

## License

Same as AgentBank project.
