import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright Configuration for API Testing - Production
 *
 * This is the production configuration for the Test Executor (Feature 3).
 * It's optimized for executing generated tests with comprehensive reporting.
 *
 * Key features:
 * - Executes tests from tests/generated directory
 * - Configurable workers and retries
 * - Multiple reporter formats (JSON, JUnit, HTML)
 * - Proper timeout handling
 * - Results stored in results/ directory
 */
export default defineConfig({
  // Test directory - where generated tests are stored
  testDir: './tests/generated',

  // Match all test files in the generated directory
  testMatch: '**/*.spec.ts',

  // Maximum time one test can run (30 seconds)
  timeout: 30000,

  // Expect timeout for assertions (5 seconds)
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Number of retry attempts (3 retries for robustness)
  retries: 3,

  // Number of parallel workers
  // Use environment variable if set, otherwise use 4 workers
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : 4,

  // Reporter configuration
  // Multiple reporters for comprehensive test reporting
  reporter: [
    // JSON reporter - machine-readable results
    ['json', { outputFile: 'results/results.json' }],

    // JUnit XML reporter - for CI/CD integration
    ['junit', { outputFile: 'results/junit.xml' }],

    // HTML reporter - human-readable test report
    ['html', { outputFolder: 'results/html-report', open: 'never' }],

    // List reporter - console output during test execution
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for API requests
    // Use environment variable if set, otherwise use default
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',

    // Extra HTTP headers sent with every request
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },

    // Collect trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshot on failure for debugging
    screenshot: 'only-on-failure',

    // Video on failure for debugging
    video: 'retain-on-failure',

    // Timeout for each individual action (10 seconds)
    actionTimeout: 10000,

    // Navigation timeout (15 seconds)
    navigationTimeout: 15000,
  },

  // Configure project for API testing
  projects: [
    {
      name: 'api-tests',
      testDir: './tests/generated',
      use: {
        ...devices['Desktop Chrome'], // Use Chrome user agent
      },
    },
  ],

  // Output folder for test artifacts (traces, videos, screenshots)
  outputDir: 'results/test-artifacts',

  // Global setup/teardown
  // globalSetup: require.resolve('./tests/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Web server configuration (if testing against local server)
  // Uncomment if you need to start a local API server before tests
  // webServer: {
  //   command: 'npm run start:api',
  //   port: 3000,
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
