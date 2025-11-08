# GitHub Actions Integration Guide

Complete guide for integrating API Test Agent with GitHub Actions for automated API testing in your CI/CD pipelines.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Input Parameters](#input-parameters)
- [Output Values](#output-values)
- [Usage Examples](#usage-examples)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Performance Optimization](#performance-optimization)

## Overview

The API Test Agent GitHub Action provides automated API testing capabilities using OpenAPI/Swagger specifications. It integrates seamlessly into your CI/CD workflow to validate API contracts, test endpoints, and ensure API reliability.

### Key Features

- **Automated Test Generation**: Generates tests directly from OpenAPI/Swagger specs
- **Self-Healing Tests**: AI-powered automatic test repair when APIs change
- **Multi-Environment Support**: Test across dev, staging, and production
- **Comprehensive Reporting**: HTML reports with detailed test results
- **Matrix Testing**: Run tests across multiple configurations simultaneously
- **Authentication Support**: Bearer, API Key, Basic, and OAuth2
- **Performance Testing**: Parallel execution with configurable workers
- **PR Integration**: Automatic test result comments on pull requests
- **Coverage Tracking**: Monitor test coverage with configurable thresholds

## Quick Start

### Basic Usage

Add this to your workflow file (`.github/workflows/api-tests.yml`):

```yaml
name: API Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run API Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
```

## Installation

### Prerequisites

1. **Node.js 18+** installed in your workflow
2. **OpenAPI/Swagger specification** file in your repository
3. **GitHub Actions** enabled for your repository

### Setup Steps

#### 1. Copy the Action

Copy the action directory to your repository:

```bash
mkdir -p .github/actions/api-test-agent
cp -r /path/to/action.yml .github/actions/api-test-agent/
```

#### 2. Configure Secrets

Add required secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `DEV_API_TOKEN`: Development environment API token
   - `STAGING_API_TOKEN`: Staging environment API token
   - `PRODUCTION_API_TOKEN`: Production environment API token (if applicable)
   - `OPENAI_API_KEY`: OpenAI API key (for self-healing features)

#### 3. Create Workflow File

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Testing

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run API Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          environment: 'dev'
          api-base-url: ${{ secrets.DEV_API_BASE_URL }}
          auth-token: ${{ secrets.DEV_API_TOKEN }}
          coverage-threshold: 80
```

## Configuration

### Input Parameters

Comprehensive list of all input parameters:

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `spec-path` | Path to OpenAPI/Swagger spec file | `openapi.yaml` |
| `api-base-url` | Base URL for the API under test | `https://api.example.com` |

#### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `environment` | string | `dev` | Target environment (dev, staging, production) |
| `auth-token` | string | `''` | Authentication token for API requests |
| `auth-type` | string | `bearer` | Authentication type (bearer, apiKey, basic, oauth2) |
| `output-path` | string | `./test-results` | Directory for test results and reports |
| `test-timeout` | number | `30000` | Maximum timeout per test (milliseconds) |
| `retries` | number | `3` | Number of retries for failed tests |
| `parallel-workers` | number | `4` | Number of parallel test workers |
| `enable-self-healing` | boolean | `true` | Enable AI-powered self-healing |
| `openai-api-key` | string | `''` | OpenAI API key for self-healing |
| `coverage-threshold` | number | `80` | Minimum coverage percentage (0-100) |
| `generate-html-report` | boolean | `true` | Generate HTML test report |
| `fail-on-error` | boolean | `true` | Fail workflow if tests fail |
| `upload-artifacts` | boolean | `true` | Upload test results as artifacts |
| `custom-headers` | string | `{}` | Custom headers as JSON string |
| `test-filter` | string | `''` | Filter tests by tag or pattern |

### Output Values

Values available after the action completes:

| Output | Type | Description |
|--------|------|-------------|
| `test-results` | string | JSON string with all test results |
| `success-count` | number | Number of passed tests |
| `failure-count` | number | Number of failed tests |
| `skip-count` | number | Number of skipped tests |
| `total-count` | number | Total number of tests |
| `coverage-percentage` | number | Test coverage percentage |
| `report-url` | string | URL to HTML test report |
| `healed-tests` | number | Number of auto-healed tests |
| `status` | string | Overall status (success, failure, partial) |

### Accessing Outputs

```yaml
- name: Run API Tests
  id: api-tests
  uses: ./.github/actions/api-test-agent
  with:
    spec-path: 'openapi.yaml'
    api-base-url: 'https://api.example.com'

- name: Check Results
  run: |
    echo "Status: ${{ steps.api-tests.outputs.status }}"
    echo "Passed: ${{ steps.api-tests.outputs.success-count }}"
    echo "Failed: ${{ steps.api-tests.outputs.failure-count }}"
    echo "Coverage: ${{ steps.api-tests.outputs.coverage-percentage }}%"
```

## Usage Examples

### Example 1: Basic API Testing

Simple test execution on pull requests:

```yaml
name: API Tests

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api-dev.example.com'
          auth-token: ${{ secrets.DEV_API_TOKEN }}
```

### Example 2: Multi-Environment Testing

Test across multiple environments:

```yaml
name: Multi-Environment Tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging]

    steps:
      - uses: actions/checkout@v4

      - name: Run Tests - ${{ matrix.environment }}
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          environment: ${{ matrix.environment }}
          api-base-url: ${{ secrets[format('{0}_API_URL', matrix.environment)] }}
          auth-token: ${{ secrets[format('{0}_API_TOKEN', matrix.environment)] }}
```

### Example 3: Self-Healing Tests

Enable AI-powered self-healing for API changes:

```yaml
name: Self-Healing API Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests with Self-Healing
        id: tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
          enable-self-healing: 'true'
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}

      - name: Report Healing Results
        if: always()
        run: |
          echo "Auto-healed: ${{ steps.tests.outputs.healed-tests }} tests"
```

### Example 4: Matrix Testing

Test across multiple Node versions and operating systems:

```yaml
name: Matrix API Tests

on: [push]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: ['18.x', '20.x']

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Run Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
```

### Example 5: Performance Testing

High-throughput testing with multiple workers:

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Performance Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
          parallel-workers: 16
          test-timeout: 60000
          test-filter: 'performance'
```

### Example 6: Custom Headers

Add custom headers to all requests:

```yaml
name: API Tests with Custom Headers

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
          custom-headers: '{"X-API-Version": "v2", "X-Client-ID": "ci-pipeline"}'
```

### Example 7: Filtered Testing

Run only specific test categories:

```yaml
name: Critical Path Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Critical Tests
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api.example.com'
          auth-token: ${{ secrets.API_TOKEN }}
          test-filter: 'critical,smoke'
          coverage-threshold: 100
```

### Example 8: Contract Testing on PR

Validate API contracts when specs change:

```yaml
name: API Contract Validation

on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'openapi/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for Breaking Changes
        run: |
          git diff origin/main...HEAD -- openapi.yaml

      - name: Validate Contract
        uses: ./.github/actions/api-test-agent
        with:
          spec-path: 'openapi.yaml'
          api-base-url: 'https://api-staging.example.com'
          auth-token: ${{ secrets.STAGING_API_TOKEN }}
          test-filter: 'contract'
          fail-on-error: 'true'
```

## Advanced Features

### Self-Healing Tests

The action includes AI-powered self-healing capabilities:

1. **Automatic Detection**: Identifies when tests fail due to API changes
2. **Intelligent Analysis**: Uses AI to understand the nature of changes
3. **Automatic Repair**: Updates tests to match new API behavior
4. **Validation**: Ensures healed tests still meet original intent

Enable self-healing:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    enable-self-healing: 'true'
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### PR Comments

Automatically posts test results as PR comments:

```yaml
permissions:
  contents: read
  pull-requests: write

jobs:
  test:
    steps:
      - uses: ./.github/actions/api-test-agent
        # Results automatically posted to PR
```

### Artifact Uploads

Test results are automatically uploaded as artifacts:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    upload-artifacts: 'true'
    output-path: './test-results'

# Download in subsequent jobs
- uses: actions/download-artifact@v4
  with:
    name: api-test-results-dev-${{ github.run_number }}
```

### Coverage Thresholds

Enforce minimum test coverage:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    coverage-threshold: 85
    fail-on-error: 'true'
```

## Best Practices

### 1. Environment Isolation

Always use separate environments for testing:

```yaml
strategy:
  matrix:
    environment: [dev, staging]
    exclude:
      - environment: staging
        # Don't test staging on forks
        if: github.event.pull_request.head.repo.fork == true
```

### 2. Secret Management

Store sensitive data in GitHub Secrets:

```yaml
# Good
auth-token: ${{ secrets.API_TOKEN }}

# Bad - never hardcode tokens!
auth-token: 'sk-1234567890'
```

### 3. Fail-Fast Strategy

Use fail-fast for critical tests, disable for comprehensive testing:

```yaml
strategy:
  fail-fast: true  # Stop all jobs if one fails
  matrix:
    environment: [dev, staging, production]
```

### 4. Timeout Configuration

Set appropriate timeouts to prevent hanging workflows:

```yaml
jobs:
  test:
    timeout-minutes: 15
    steps:
      - uses: ./.github/actions/api-test-agent
        with:
          test-timeout: 30000
```

### 5. Caching

Cache dependencies for faster execution:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'
```

### 6. Conditional Execution

Run expensive tests only when necessary:

```yaml
jobs:
  performance-test:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: ./.github/actions/api-test-agent
```

### 7. Test Filtering

Use filters to run different test suites:

```yaml
# Smoke tests on every PR
- uses: ./.github/actions/api-test-agent
  with:
    test-filter: 'smoke'
    parallel-workers: 2

# Full tests on merge to main
- uses: ./.github/actions/api-test-agent
  if: github.ref == 'refs/heads/main'
  with:
    parallel-workers: 8
```

## Troubleshooting

### Common Issues

#### Issue: Tests Fail with Authentication Error

**Solution**: Verify your secrets are correctly configured:

```yaml
- name: Debug Auth
  run: |
    echo "Token length: ${#API_TOKEN}"
  env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
```

#### Issue: Spec File Not Found

**Solution**: Ensure the spec path is relative to repository root:

```yaml
- uses: actions/checkout@v4  # Must checkout first!

- uses: ./.github/actions/api-test-agent
  with:
    spec-path: 'api/openapi.yaml'  # Relative to repo root
```

#### Issue: Tests Timeout

**Solution**: Increase timeout or reduce parallel workers:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    test-timeout: 60000  # 60 seconds
    parallel-workers: 2  # Reduce concurrency
```

#### Issue: Self-Healing Not Working

**Solution**: Verify OpenAI API key is set:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    enable-self-healing: 'true'
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # Must be set!
```

#### Issue: Coverage Below Threshold

**Solution**: Generate more tests or adjust threshold:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    coverage-threshold: 70  # Lower threshold
    fail-on-error: 'false'  # Don't fail workflow
```

### Debug Mode

Enable debug logging:

```yaml
jobs:
  test:
    steps:
      - uses: ./.github/actions/api-test-agent
        env:
          DEBUG: '*'
          RUNNER_DEBUG: 1
```

### Viewing Logs

1. Go to **Actions** tab in your repository
2. Click on the workflow run
3. Click on the failed job
4. Expand the step to view detailed logs

## Security

### Best Practices

1. **Never Commit Secrets**: Always use GitHub Secrets
2. **Limit Token Scope**: Use tokens with minimum required permissions
3. **Rotate Tokens**: Regularly rotate API tokens
4. **Use Environment Protection**: Require approvals for production
5. **Audit Logs**: Review GitHub audit logs regularly

### Secure Configuration

```yaml
jobs:
  test:
    environment:
      name: production
      url: https://api.example.com
    steps:
      - uses: ./.github/actions/api-test-agent
        with:
          api-base-url: ${{ secrets.PROD_API_URL }}
          auth-token: ${{ secrets.PROD_API_TOKEN }}
```

### OIDC Authentication

Use OIDC for enhanced security:

```yaml
permissions:
  id-token: write
  contents: read

jobs:
  test:
    steps:
      - name: Get OIDC Token
        id: oidc
        run: |
          TOKEN=$(curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL" | jq -r .value)
          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT

      - uses: ./.github/actions/api-test-agent
        with:
          auth-token: ${{ steps.oidc.outputs.token }}
```

## Performance Optimization

### 1. Parallel Execution

Maximize throughput with parallel workers:

```yaml
- uses: ./.github/actions/api-test-agent
  with:
    parallel-workers: 8  # Adjust based on API capacity
```

### 2. Test Sharding

Split tests across multiple jobs:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - uses: ./.github/actions/api-test-agent
    with:
      test-filter: 'shard-${{ matrix.shard }}'
```

### 3. Dependency Caching

Cache npm dependencies:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 4. Conditional Workflows

Skip unnecessary runs:

```yaml
on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'src/**'
      # Only run when relevant files change
```

### 5. Matrix Optimization

Use excludes to reduce redundant testing:

```yaml
strategy:
  matrix:
    os: [ubuntu, windows, macos]
    node: ['18', '20']
    exclude:
      - os: macos
        node: '18'  # Skip older Node on macOS
```

## Support and Resources

- **GitHub Issues**: [Report bugs](https://github.com/your-repo/issues)
- **Documentation**: [Full docs](https://github.com/your-repo/docs)
- **Examples**: See `.github/workflows/example-usage.yml`

## License

MIT License - see LICENSE file for details.
