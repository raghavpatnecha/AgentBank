import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright Configuration for API Testing
 *
 * This configuration is optimized for API testing (no browser automation).
 * Key features:
 * - API-only testing with request fixture
 * - Environment-based base URL configuration
 * - Comprehensive test reporting
 * - Configurable timeouts for various API scenarios
 * - Parallel test execution for speed
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Match test files
  testMatch: '**/*.spec.ts',

  // Maximum time one test can run
  timeout: 30 * 1000, // 30 seconds

  // Expect timeout for assertions
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for API requests
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',

    // Extra HTTP headers to be sent with every request
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },

    // Collect trace for debugging
    trace: 'on-first-retry',

    // Timeout for each action (like request)
    actionTimeout: 10 * 1000, // 10 seconds
  },

  // Configure projects for different API testing scenarios
  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'], // Use Chrome user agent for API requests
      },
    },

    // Separate project for integration tests with longer timeout
    {
      name: 'integration',
      testMatch: '**/integration/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
      timeout: 60 * 1000, // 60 seconds for integration tests
    },

    // Separate project for E2E tests with even longer timeout
    {
      name: 'e2e',
      testMatch: '**/e2e/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
      timeout: 120 * 1000, // 120 seconds for E2E tests
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results',
});
