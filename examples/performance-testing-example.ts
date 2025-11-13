/**
 * Performance Testing Example
 * Demonstrates how to use the performance testing system
 */

import { parseOpenAPIFile } from '../src/core/openapi-parser.js';
import { PerformanceTestGenerator } from '../src/generators/performance-test-generator.js';
import { LoadTestRunner } from '../src/executor/load-test-runner.js';
import { PerformanceReporter } from '../src/reporting/performance-reporter.js';
import type { LoadTestConfig, PerformanceTestCase } from '../src/types/performance-types.js';

async function main() {
  console.log('🚀 Performance Testing Example\n');

  // Step 1: Parse OpenAPI specification
  console.log('📖 Parsing OpenAPI specification...');
  const spec = await parseOpenAPIFile('./examples/petstore.yaml');
  console.log(`✓ Parsed: ${spec.info.title} v${spec.info.version}\n`);

  // Step 2: Extract endpoints
  const endpoints = Object.entries(spec.paths).flatMap(([path, pathItem]) => {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    return methods
      .filter((method) => pathItem[method])
      .map((method) => ({
        path,
        method,
        operationId: pathItem[method].operationId,
        summary: pathItem[method].summary,
        description: pathItem[method].description,
        parameters: pathItem[method].parameters || [],
        requestBody: pathItem[method].requestBody,
        responses: new Map(
          Object.entries(pathItem[method].responses || {}).map(([code, resp]) => [
            code === 'default' ? 'default' : parseInt(code, 10),
            resp,
          ])
        ),
        security: pathItem[method].security || [],
        tags: pathItem[method].tags || [],
        servers: pathItem[method].servers || [],
      }));
  });

  console.log(`📍 Found ${endpoints.length} endpoints\n`);

  // Step 3: Generate performance tests
  console.log('🎯 Generating performance tests...');
  const generator = new PerformanceTestGenerator({
    defaultUsers: 10,
    defaultDuration: 60,
    generateMultipleScenarios: true, // Generate load, stress, spike, endurance tests
  });

  const performanceTests = generator.generateTests(endpoints);
  console.log(`✓ Generated ${performanceTests.length} performance tests\n`);

  // Display test types
  const testTypes = new Map<string, number>();
  for (const test of performanceTests) {
    const type = test.performance.testType;
    testTypes.set(type, (testTypes.get(type) || 0) + 1);
  }

  console.log('Test breakdown:');
  for (const [type, count] of testTypes) {
    console.log(`  - ${type}: ${count} tests`);
  }
  console.log('');

  // Step 4: Configure load test
  const loadTestConfig: LoadTestConfig = {
    tests: performanceTests.filter((t) => t.performance.testType === 'load'), // Run only load tests
    baseURL: 'https://petstore.swagger.io/v2',
    timeout: 30000,
    trackResources: true,
    outputDir: './reports/performance',
  };

  console.log(`🏃 Running ${loadTestConfig.tests.length} load tests...\n`);

  // Step 5: Execute load tests
  const runner = new LoadTestRunner(loadTestConfig);
  const metrics = await runner.executeTests();

  console.log('\n✓ Load tests completed!\n');

  // Step 6: Generate performance report
  console.log('📊 Generating performance report...');
  const reporter = new PerformanceReporter({
    outputDir: './reports/performance',
    includeCharts: true,
  });

  const report = await reporter.generateReport(loadTestConfig, metrics);

  // Print console summary
  reporter.printSummary(report);

  // Export reports in multiple formats
  console.log('\n📄 Exporting reports...');

  await reporter.exportReport(report, {
    format: 'json',
    outputPath: './reports/performance/report.json',
  });
  console.log('  ✓ JSON report saved');

  await reporter.exportReport(report, {
    format: 'html',
    outputPath: './reports/performance/report.html',
    includeCharts: true,
    includeTimeSeries: true,
  });
  console.log('  ✓ HTML report saved');

  await reporter.exportReport(report, {
    format: 'markdown',
    outputPath: './reports/performance/report.md',
  });
  console.log('  ✓ Markdown report saved');

  await reporter.exportReport(report, {
    format: 'csv',
    outputPath: './reports/performance/report.csv',
  });
  console.log('  ✓ CSV report saved');

  console.log('\n✨ Performance testing complete!');
  console.log(`\nView the full report at: ./reports/performance/report.html`);
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
