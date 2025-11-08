/**
 * HTML Reporter Demo - Example Usage
 * Demonstrates how to use the HTMLReporter to generate reports
 */

import { HTMLReporter, TestReport, PerformanceMetrics, EnvironmentInfo } from '../src/reporting/html-reporter';
import { TestResult, TestStatus, ExecutionSummary, ErrorType } from '../src/types/executor-types';
import { HealingAttempt, HealingStrategy } from '../src/types/self-healing-types';

// Create sample test data
const sampleTests: TestResult[] = [
  {
    id: 'test-1',
    name: 'GET /api/users - should return all users',
    filePath: 'tests/api/users.spec.ts',
    status: TestStatus.PASSED,
    duration: 150,
    retries: 0,
    startTime: new Date('2025-11-08T10:00:00Z'),
    endTime: new Date('2025-11-08T10:00:00.150Z'),
    tags: ['api', 'users', 'smoke'],
  },
  {
    id: 'test-2',
    name: 'POST /api/users - should create new user',
    filePath: 'tests/api/users.spec.ts',
    status: TestStatus.PASSED,
    duration: 200,
    retries: 0,
    startTime: new Date('2025-11-08T10:00:00.150Z'),
    endTime: new Date('2025-11-08T10:00:00.350Z'),
    tags: ['api', 'users'],
  },
  {
    id: 'test-3',
    name: 'DELETE /api/users/:id - should delete user',
    filePath: 'tests/api/users.spec.ts',
    status: TestStatus.FAILED,
    duration: 100,
    retries: 2,
    startTime: new Date('2025-11-08T10:00:00.350Z'),
    endTime: new Date('2025-11-08T10:00:00.450Z'),
    error: {
      message: 'Expected status code 200 but got 404',
      type: ErrorType.ASSERTION,
      stack: 'Error: Expected status code 200 but got 404\n    at users.spec.ts:45:12',
      comparison: {
        expected: { status: 200, body: { success: true } },
        actual: { status: 404, body: { error: 'Not found' } },
      },
    },
  },
];

const summary: ExecutionSummary = {
  totalTests: 3,
  passed: 2,
  failed: 1,
  skipped: 0,
  timeout: 0,
  error: 0,
  duration: 450,
  startTime: new Date('2025-11-08T10:00:00Z'),
  endTime: new Date('2025-11-08T10:00:00.450Z'),
  successRate: 0.667,
  averageDuration: 150,
  filesExecuted: ['tests/api/users.spec.ts'],
  totalRetries: 2,
  byFile: {
    'tests/api/users.spec.ts': {
      filePath: 'tests/api/users.spec.ts',
      testCount: 3,
      passed: 2,
      failed: 1,
      skipped: 0,
      duration: 450,
    },
  },
};

const performanceMetrics: PerformanceMetrics = {
  totalDuration: 450,
  averageDuration: 150,
  slowestTests: [
    { name: 'POST /api/users', duration: 200 },
    { name: 'GET /api/users', duration: 150 },
  ],
  fastestTests: [
    { name: 'DELETE /api/users/:id', duration: 100 },
  ],
  testsPerSecond: 6.67,
  memoryUsage: {
    peak: 157286400, // ~150 MB
    average: 134217728, // ~128 MB
  },
};

const environment: EnvironmentInfo = {
  os: 'Linux 5.10.0-21-amd64',
  nodeVersion: 'v18.16.0',
  playwrightVersion: '1.40.0',
  browsers: {
    chromium: '119.0.6045.9',
    firefox: '119.0',
    webkit: '17.4',
  },
  ci: {
    name: 'GitHub Actions',
    buildNumber: '123',
    branch: 'main',
    commit: 'abc123def456',
  },
};

const healedTests = [
  {
    test: sampleTests[0],
    attempt: {
      id: 'heal-1',
      test: sampleTests[0],
      strategy: HealingStrategy.AI_POWERED,
      startTime: new Date('2025-11-08T10:00:01Z'),
      endTime: new Date('2025-11-08T10:00:06Z'),
      duration: 5000,
      success: true,
      tokensUsed: 1500,
      estimatedCost: 0.0045,
      generatedFix: 'await expect(response.status).toBe(200);',
      cacheHit: false,
    } as HealingAttempt,
  },
];

const testReport: TestReport = {
  summary,
  tests: sampleTests,
  failedTests: sampleTests.filter((t) => t.status === TestStatus.FAILED),
  healedTests,
  performanceMetrics,
  environment,
  timestamp: new Date(),
};

// Example 1: Basic HTML Report
async function generateBasicReport() {
  const reporter = new HTMLReporter({
    outputDir: './reports',
    title: 'API Test Report',
  });

  const filepath = await reporter.generateReport(testReport);
  console.log(`Basic report generated: ${filepath}`);
}

// Example 2: Customized HTML Report
async function generateCustomReport() {
  const reporter = new HTMLReporter({
    outputDir: './reports/custom',
    title: 'Custom API Test Report',
    darkMode: true,
    includeCharts: true,
    includeDetails: true,
    includeFailedTests: true,
    includeHealedTests: true,
    includePerformance: true,
    includeEnvironment: true,
    customCSS: `
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      }
      .summary-card {
        border: 2px solid #667eea;
      }
    `,
    logoUrl: 'https://example.com/logo.png',
  });

  const filepath = await reporter.generateReport(testReport);
  console.log(`Custom report generated: ${filepath}`);
}

// Example 3: Minimal Report (Summary Only)
async function generateMinimalReport() {
  const reporter = new HTMLReporter({
    outputDir: './reports/minimal',
    title: 'Summary Report',
    includeCharts: false,
    includeDetails: false,
    includeFailedTests: false,
    includeHealedTests: false,
    includePerformance: false,
    includeEnvironment: false,
  });

  const filepath = await reporter.generateReport(testReport);
  console.log(`Minimal report generated: ${filepath}`);
}

// Example 4: Generate HTML Without Saving
function generateHTMLOnly() {
  const reporter = new HTMLReporter({
    outputDir: './reports',
  });

  const html = reporter.generateHTML(testReport);
  console.log(`Generated HTML length: ${html.length} characters`);

  // You can now send this HTML via email, upload to S3, etc.
  return html;
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      console.log('🎨 HTML Reporter Demo\n');

      await generateBasicReport();
      await generateCustomReport();
      await generateMinimalReport();
      generateHTMLOnly();

      console.log('\n✅ All reports generated successfully!');
    } catch (error) {
      console.error('❌ Error generating reports:', error);
      process.exit(1);
    }
  })();
}

export {
  generateBasicReport,
  generateCustomReport,
  generateMinimalReport,
  generateHTMLOnly,
};
