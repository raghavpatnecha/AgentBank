/**
 * Advanced Performance Testing Scenarios
 * Demonstrates custom load patterns and advanced configurations
 */

import { PerformanceTestGenerator } from '../src/generators/performance-test-generator.js';
import { LoadTestRunner } from '../src/executor/load-test-runner.js';
import { PerformanceReporter } from '../src/reporting/performance-reporter.js';
import type {
  LoadTestConfig,
  PerformanceTestCase,
  LoadProfile,
  PerformanceAssertion,
} from '../src/types/performance-types.js';

// Example: Custom load profile with multiple stages
function createBlackFridayLoadProfile(): LoadProfile {
  return {
    pattern: 'custom',
    totalDuration: 3600, // 1 hour
    peakUsers: 1000,
    stages: [
      {
        name: 'Pre-sale Baseline',
        targetUsers: 100,
        duration: 600, // 10 minutes
      },
      {
        name: 'Sale Start Rush',
        targetUsers: 1000,
        duration: 900, // 15 minutes
        rampTime: 60, // Spike in 1 minute
      },
      {
        name: 'Peak Traffic',
        targetUsers: 1000,
        duration: 1200, // 20 minutes
      },
      {
        name: 'Gradual Decline',
        targetUsers: 300,
        duration: 900, // 15 minutes
        rampTime: 600, // Ramp down over 10 minutes
      },
      {
        name: 'Post-sale Baseline',
        targetUsers: 100,
        duration: 600, // 10 minutes
        rampTime: 300,
      },
    ],
  };
}

// Example: Custom performance assertions for critical endpoints
function createCriticalEndpointAssertions(): PerformanceAssertion[] {
  return [
    {
      name: 'Response time p95 < 500ms',
      metric: 'response_time_p95',
      operator: 'lt',
      threshold: 500,
      severity: 'critical',
      scope: 'p95',
    },
    {
      name: 'Response time p99 < 1000ms',
      metric: 'response_time_p99',
      operator: 'lt',
      threshold: 1000,
      severity: 'error',
      scope: 'p99',
    },
    {
      name: 'Error rate < 0.1%',
      metric: 'error_rate',
      operator: 'lt',
      threshold: 0.001,
      severity: 'critical',
    },
    {
      name: 'Throughput > 100 RPS',
      metric: 'throughput',
      operator: 'gt',
      threshold: 100,
      severity: 'warning',
    },
  ];
}

async function scenarioStressTest() {
  console.log('\n🔥 Scenario 1: Stress Testing\n');
  console.log('Finding the breaking point of the API...\n');

  const generator = new PerformanceTestGenerator({
    defaultUsers: 500,
    defaultDuration: 300, // 5 minutes
    defaultAssertions: createCriticalEndpointAssertions(),
  });

  // Mock endpoint for demonstration
  const endpoint: any = {
    path: '/api/checkout',
    method: 'post',
    operationId: 'checkout',
    summary: 'Process checkout',
    parameters: [],
    responses: new Map([[200, { description: 'Success' }]]),
    security: [],
    tags: ['checkout'],
    servers: [],
  };

  const stressTest = generator.generateFromSpec(endpoint, 'stress', 500, 300);

  console.log(`Test: ${stressTest.name}`);
  console.log(`  - Users: ${stressTest.performance.virtualUsers}`);
  console.log(`  - Duration: ${stressTest.performance.duration}s`);
  console.log(`  - Pattern: ${stressTest.performance.loadPattern}`);
  console.log(`  - Assertions: ${stressTest.assertions.length}`);
  console.log('');

  // Run stress test
  const config: LoadTestConfig = {
    tests: [stressTest],
    baseURL: 'https://api.example.com',
    timeout: 30000,
    trackResources: true,
  };

  const runner = new LoadTestRunner(config);
  const metrics = await runner.executeTests();

  const reporter = new PerformanceReporter();
  const report = await reporter.generateReport(config, metrics);
  reporter.printSummary(report);

  return report;
}

async function scenarioSpikeTest() {
  console.log('\n⚡ Scenario 2: Spike Testing\n');
  console.log('Testing sudden traffic spikes...\n');

  const generator = new PerformanceTestGenerator({
    defaultUsers: 1000,
    defaultDuration: 180, // 3 minutes
  });

  const endpoint: any = {
    path: '/api/products',
    method: 'get',
    operationId: 'listProducts',
    summary: 'List products',
    parameters: [],
    responses: new Map([[200, { description: 'Success' }]]),
    security: [],
    tags: ['products'],
    servers: [],
  };

  const spikeTest = generator.generateFromSpec(endpoint, 'spike', 1000, 180);

  console.log(`Test: ${spikeTest.name}`);
  console.log(`  - Peak Users: ${spikeTest.performance.virtualUsers}`);
  console.log(`  - Duration: ${spikeTest.performance.duration}s`);
  console.log(`  - Pattern: ${spikeTest.performance.loadPattern}`);
  console.log('');

  const config: LoadTestConfig = {
    tests: [spikeTest],
    baseURL: 'https://api.example.com',
    trackResources: true,
  };

  const runner = new LoadTestRunner(config);
  const metrics = await runner.executeTests();

  const reporter = new PerformanceReporter();
  const report = await reporter.generateReport(config, metrics);
  reporter.printSummary(report);

  return report;
}

async function scenarioEnduranceTest() {
  console.log('\n⏱️  Scenario 3: Endurance/Soak Testing\n');
  console.log('Testing stability over extended period...\n');

  const generator = new PerformanceTestGenerator({
    defaultUsers: 50,
    defaultDuration: 7200, // 2 hours
  });

  const endpoint: any = {
    path: '/api/health',
    method: 'get',
    operationId: 'healthCheck',
    summary: 'Health check',
    parameters: [],
    responses: new Map([[200, { description: 'Success' }]]),
    security: [],
    tags: ['health'],
    servers: [],
  };

  const enduranceTest = generator.generateFromSpec(endpoint, 'endurance', 50, 7200);

  console.log(`Test: ${enduranceTest.name}`);
  console.log(`  - Sustained Users: ${enduranceTest.performance.virtualUsers}`);
  console.log(`  - Duration: ${enduranceTest.performance.duration / 60} minutes`);
  console.log(`  - Looking for: Memory leaks, performance degradation`);
  console.log('');

  // Note: This would run for 2 hours in production
  console.log('⏭️  Skipping actual execution in example (would run for 2 hours)');

  return null;
}

async function scenarioBaselineComparison() {
  console.log('\n📊 Scenario 4: Baseline Comparison\n');
  console.log('Comparing performance against baseline...\n');

  const generator = new PerformanceTestGenerator();

  const endpoint: any = {
    path: '/api/search',
    method: 'get',
    operationId: 'search',
    summary: 'Search',
    parameters: [],
    responses: new Map([[200, { description: 'Success' }]]),
    security: [],
    tags: ['search'],
    servers: [],
  };

  const loadTest = generator.generateFromSpec(endpoint, 'load', 100, 120);

  const config: LoadTestConfig = {
    tests: [loadTest],
    baseURL: 'https://api.example.com',
    trackResources: true,
  };

  const runner = new LoadTestRunner(config);
  const metrics = await runner.executeTests();

  // Generate report with baseline comparison
  const reporter = new PerformanceReporter({
    baselineFile: './reports/performance/baseline.json',
    regressionThreshold: 10, // Alert on 10% regression
  });

  const report = await reporter.generateReport(config, metrics);
  reporter.printSummary(report);

  // Save as new baseline
  await reporter.exportReport(report, {
    format: 'json',
    outputPath: './reports/performance/latest-baseline.json',
  });

  console.log('\n✓ New baseline saved for future comparisons');

  return report;
}

async function scenarioCompleteLoadProfile() {
  console.log('\n🎯 Scenario 5: Custom Load Profile (Black Friday)\n');

  const generator = new PerformanceTestGenerator();
  const profile = createBlackFridayLoadProfile();

  console.log('Load Profile:');
  console.log(`  - Total Duration: ${profile.totalDuration / 60} minutes`);
  console.log(`  - Peak Users: ${profile.peakUsers}`);
  console.log(`  - Stages: ${profile.stages?.length}`);
  console.log('');

  if (profile.stages) {
    console.log('Stages:');
    for (const stage of profile.stages) {
      console.log(`  ${stage.name}:`);
      console.log(`    - Users: ${stage.targetUsers}`);
      console.log(`    - Duration: ${stage.duration / 60} minutes`);
      if (stage.rampTime) {
        console.log(`    - Ramp Time: ${stage.rampTime} seconds`);
      }
    }
  }

  console.log('\n⏭️  Skipping actual execution (would run for 1 hour)');

  return null;
}

// Run all scenarios
async function main() {
  console.log('🚀 Advanced Performance Testing Scenarios\n');
  console.log('═'.repeat(60));

  try {
    await scenarioStressTest();
    console.log('\n' + '═'.repeat(60));

    await scenarioSpikeTest();
    console.log('\n' + '═'.repeat(60));

    await scenarioEnduranceTest();
    console.log('\n' + '═'.repeat(60));

    await scenarioBaselineComparison();
    console.log('\n' + '═'.repeat(60));

    await scenarioCompleteLoadProfile();

    console.log('\n✨ All scenarios completed!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  scenarioStressTest,
  scenarioSpikeTest,
  scenarioEnduranceTest,
  scenarioBaselineComparison,
  scenarioCompleteLoadProfile,
  createBlackFridayLoadProfile,
  createCriticalEndpointAssertions,
};
