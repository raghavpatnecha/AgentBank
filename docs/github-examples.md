# GitHub Integration Examples

Comprehensive examples for using API Test Agent with GitHub, from basic setups to advanced configurations.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Configurations](#advanced-configurations)
- [Multi-Spec Testing](#multi-spec-testing)
- [Custom Environments](#custom-environments)
- [Integration with Other Actions](#integration-with-other-actions)
- [Scheduled Testing](#scheduled-testing)
- [Manual Triggers](#manual-triggers)
- [Real-World Scenarios](#real-world-scenarios)

---

## Basic Usage

### Example 1: Simple PR Testing

Test API on every pull request.

**.github/workflows/api-test-basic.yml**:
```yaml
name: Basic API Tests

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Run API tests
        env:
          API_BASE_URL: ${{ secrets.DEV_API_URL }}
          AUTH_TOKEN: ${{ secrets.DEV_AUTH_TOKEN }}
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN
```

**Usage**:
1. Create a PR
2. Tests run automatically
3. Results appear in PR checks

---

### Example 2: Comment-Triggered Testing

Trigger tests by commenting on PR.

**.github/workflows/api-test-comment.yml**:
```yaml
name: Comment-Triggered Tests

on:
  issue_comment:
    types: [created]

jobs:
  check-comment:
    if: contains(github.event.comment.body, '@api-test-agent test')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Run tests
        run: npx api-test-agent test --spec=api/openapi.yaml

      - name: Comment results
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '✅ Tests completed successfully!'
            });
```

**Usage**:
```
On a PR, comment:
@api-test-agent test

Tests will run and post results.
```

---

### Example 3: Check Run Integration

Create GitHub check runs for better PR integration.

**.github/workflows/api-test-checks.yml**:
```yaml
name: API Tests with Check Runs

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Create check run
        id: check
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'API Tests',
              head_sha: context.payload.pull_request.head.sha,
              status: 'in_progress',
            });
            core.setOutput('check_run_id', data.id);

      - name: Run tests
        id: test
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --output=json \
            --output-file=results.json

      - name: Update check run
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results.json'));
            const conclusion = results.summary.failed === 0 ? 'success' : 'failure';

            await github.rest.checks.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              check_run_id: ${{ steps.check.outputs.check_run_id }},
              status: 'completed',
              conclusion,
              output: {
                title: conclusion === 'success' ? 'All tests passed' : 'Some tests failed',
                summary: `Total: ${results.summary.total}, Passed: ${results.summary.passed}, Failed: ${results.summary.failed}`,
              },
            });
```

---

## Advanced Configurations

### Example 4: Matrix Testing (Multiple Environments)

Test against multiple environments in parallel.

**.github/workflows/api-test-matrix.yml**:
```yaml
name: Matrix API Tests

on:
  pull_request:

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        environment: [dev, staging, prod]
        include:
          - environment: dev
            api_url_secret: DEV_API_URL
            auth_token_secret: DEV_AUTH_TOKEN
          - environment: staging
            api_url_secret: STAGING_API_URL
            auth_token_secret: STAGING_AUTH_TOKEN
          - environment: prod
            api_url_secret: PROD_API_URL
            auth_token_secret: PROD_AUTH_TOKEN

    runs-on: ubuntu-latest
    name: Test on ${{ matrix.environment }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Run tests
        env:
          API_BASE_URL: ${{ secrets[matrix.api_url_secret] }}
          AUTH_TOKEN: ${{ secrets[matrix.auth_token_secret] }}
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN \
            --environment=${{ matrix.environment }}

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.environment }}
          path: test-results/
```

---

### Example 5: Conditional Testing Based on Changed Files

Only test when API-related files change.

**.github/workflows/api-test-conditional.yml**:
```yaml
name: Conditional API Tests

on:
  pull_request:

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api_changed: ${{ steps.filter.outputs.api }}
      specs_changed: ${{ steps.filter.outputs.specs }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            api:
              - 'src/api/**'
              - 'api/**'
            specs:
              - 'api/**/*.yaml'
              - 'api/**/*.json'

  test-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test API
        run: npx api-test-agent test --spec=api/openapi.yaml

  test-specs:
    needs: detect-changes
    if: needs.detect-changes.outputs.specs_changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate specs
        run: npx swagger-cli validate api/*.yaml

      - name: Test all specs
        run: |
          for spec in api/*.yaml; do
            npx api-test-agent test --spec=$spec
          done
```

---

## Multi-Spec Testing

### Example 6: Test Multiple API Versions

Test v1, v2, and internal APIs in parallel.

**.github/workflows/api-test-multi-spec.yml**:
```yaml
name: Multi-Spec API Tests

on:
  pull_request:

jobs:
  test:
    strategy:
      matrix:
        spec:
          - path: api/v1/openapi.yaml
            name: API v1
            base_url_secret: V1_API_URL
          - path: api/v2/openapi.yaml
            name: API v2
            base_url_secret: V2_API_URL
          - path: api/internal/openapi.yaml
            name: Internal API
            base_url_secret: INTERNAL_API_URL

    runs-on: ubuntu-latest
    name: Test ${{ matrix.spec.name }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Test ${{ matrix.spec.name }}
        env:
          API_BASE_URL: ${{ secrets[matrix.spec.base_url_secret] }}
          AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
        run: |
          npx api-test-agent test \
            --spec=${{ matrix.spec.path }} \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: results-${{ matrix.spec.name }}
          path: test-results/
```

---

### Example 7: Dynamic Spec Discovery

Automatically discover and test all OpenAPI specs in repository.

**.github/workflows/api-test-discover.yml**:
```yaml
name: Auto-Discover Specs

on:
  pull_request:

jobs:
  discover:
    runs-on: ubuntu-latest
    outputs:
      specs: ${{ steps.find.outputs.specs }}
    steps:
      - uses: actions/checkout@v4

      - name: Find all specs
        id: find
        run: |
          SPECS=$(find api -name "*.yaml" -o -name "*.json" | jq -R -s -c 'split("\n") | map(select(length > 0))')
          echo "specs=$SPECS" >> $GITHUB_OUTPUT

  test:
    needs: discover
    strategy:
      matrix:
        spec: ${{ fromJSON(needs.discover.outputs.specs) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test ${{ matrix.spec }}
        run: npx api-test-agent test --spec=${{ matrix.spec }}
```

---

## Custom Environments

### Example 8: Environment-Specific Configuration

Use different configurations per environment.

**config/dev.json**:
```json
{
  "apiBaseUrl": "https://dev-api.example.com",
  "timeout": 5000,
  "retries": 3,
  "auth": {
    "type": "bearer"
  }
}
```

**config/prod.json**:
```json
{
  "apiBaseUrl": "https://api.example.com",
  "timeout": 10000,
  "retries": 5,
  "auth": {
    "type": "bearer"
  }
}
```

**.github/workflows/api-test-env-config.yml**:
```yaml
name: Environment-Specific Tests

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, staging, prod]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Load environment config
        run: |
          CONFIG=$(cat config/${{ github.event.inputs.environment }}.json)
          echo "config=$CONFIG" >> $GITHUB_ENV

      - name: Run tests
        env:
          AUTH_TOKEN: ${{ secrets[format('{0}_AUTH_TOKEN', github.event.inputs.environment)] }}
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --config=config/${{ github.event.inputs.environment }}.json \
            --auth-token=$AUTH_TOKEN
```

---

## Integration with Other Actions

### Example 9: Combine with Deployment

Run tests before and after deployment.

**.github/workflows/deploy-with-tests.yml**:
```yaml
name: Deploy with Tests

on:
  push:
    branches: [main]

jobs:
  pre-deploy-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test staging
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --environment=staging

  deploy:
    needs: pre-deploy-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          # Your deployment script
          ./deploy.sh production

  post-deploy-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test production
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --environment=prod

      - name: Rollback on failure
        if: failure()
        run: |
          # Rollback deployment
          ./rollback.sh production
```

---

### Example 10: Integration with Lighthouse Performance Testing

Combine API tests with performance tests.

**.github/workflows/api-perf-tests.yml**:
```yaml
name: API and Performance Tests

on:
  pull_request:

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: API functional tests
        run: npx api-test-agent test --spec=api/openapi.yaml

      - name: API performance tests
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --performance \
            --concurrent-users=100

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.example.com
          uploadArtifacts: true
```

---

## Scheduled Testing

### Example 11: Daily Health Checks

Run comprehensive tests daily.

**.github/workflows/daily-health-check.yml**:
```yaml
name: Daily Health Check

on:
  schedule:
    # Every day at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  health-check:
    strategy:
      matrix:
        environment: [dev, staging, prod]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Health check for ${{ matrix.environment }}
        env:
          API_BASE_URL: ${{ secrets[format('{0}_API_URL', matrix.environment)] }}
          AUTH_TOKEN: ${{ secrets[format('{0}_AUTH_TOKEN', matrix.environment)] }}
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN \
            --full-suite

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Health check failed for ${{ matrix.environment }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Health Check Failed*\nEnvironment: ${{ matrix.environment }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
```

---

### Example 12: Continuous Monitoring

Run tests every hour and track trends.

**.github/workflows/continuous-monitoring.yml**:
```yaml
name: Continuous Monitoring

on:
  schedule:
    # Every hour
    - cron: '0 * * * *'

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run monitoring tests
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --environment=prod \
            --monitor

      - name: Store metrics
        run: |
          # Store results in time-series database
          # (e.g., InfluxDB, Prometheus, CloudWatch)
          TIMESTAMP=$(date +%s)
          RESULTS=$(cat test-results.json)
          # Send to metrics service

      - name: Check SLA
        run: |
          PASS_RATE=$(jq '.summary.passed * 100 / .summary.total' test-results.json)
          SLA_THRESHOLD=99.5

          if (( $(echo "$PASS_RATE < $SLA_THRESHOLD" | bc -l) )); then
            echo "::error::SLA breach: $PASS_RATE% < $SLA_THRESHOLD%"
            exit 1
          fi
```

---

## Manual Triggers

### Example 13: Manual Workflow with Parameters

Allow manual test runs with custom parameters.

**.github/workflows/manual-test.yml**:
```yaml
name: Manual API Test

on:
  workflow_dispatch:
    inputs:
      spec_path:
        description: 'OpenAPI spec path'
        required: true
        default: 'api/openapi.yaml'
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod
      test_type:
        description: 'Test type'
        required: true
        type: choice
        options:
          - smoke
          - full
          - performance
      verbose:
        description: 'Verbose output'
        type: boolean
        default: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run ${{ github.event.inputs.test_type }} tests
        env:
          API_BASE_URL: ${{ secrets[format('{0}_API_URL', github.event.inputs.environment)] }}
          AUTH_TOKEN: ${{ secrets[format('{0}_AUTH_TOKEN', github.event.inputs.environment)] }}
        run: |
          CMD="npx api-test-agent test \
            --spec=${{ github.event.inputs.spec_path }} \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN \
            --environment=${{ github.event.inputs.environment }}"

          case "${{ github.event.inputs.test_type }}" in
            smoke)
              CMD="$CMD --smoke-only"
              ;;
            full)
              CMD="$CMD --full-suite"
              ;;
            performance)
              CMD="$CMD --performance --concurrent-users=100"
              ;;
          esac

          if [ "${{ github.event.inputs.verbose }}" == "true" ]; then
            CMD="$CMD --verbose"
          fi

          eval $CMD
```

**Usage**:
1. Go to Actions tab
2. Select "Manual API Test"
3. Click "Run workflow"
4. Fill in parameters
5. Click "Run workflow"

---

## Real-World Scenarios

### Example 14: Microservices Testing

Test multiple microservices with dependencies.

**.github/workflows/microservices-test.yml**:
```yaml
name: Microservices Tests

on:
  pull_request:

jobs:
  test-user-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test User Service
        run: npx api-test-agent test --spec=services/user/openapi.yaml

  test-order-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test Order Service
        run: npx api-test-agent test --spec=services/order/openapi.yaml

  test-payment-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test Payment Service
        run: npx api-test-agent test --spec=services/payment/openapi.yaml

  integration-tests:
    needs: [test-user-service, test-order-service, test-payment-service]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        run: |
          # Test end-to-end flows across services
          npx api-test-agent test \
            --spec=services/user/openapi.yaml \
            --spec=services/order/openapi.yaml \
            --spec=services/payment/openapi.yaml \
            --integration
```

---

### Example 15: Compliance and Security Testing

Include security and compliance checks.

**.github/workflows/security-compliance.yml**:
```yaml
name: Security and Compliance

on:
  pull_request:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Functional tests
        run: npx api-test-agent test --spec=api/openapi.yaml

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: OWASP ZAP scan
        uses: zaproxy/action-api-scan@v0.1.0
        with:
          target: 'api/openapi.yaml'

  compliance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check PII handling
        run: |
          # Verify sensitive data is properly handled
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --compliance=GDPR

      - name: Check rate limiting
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --rate-limit-test

      - name: Check authentication
        run: |
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --security-tests
```

---

### Example 16: Progressive Rollout with Canary Testing

Test canary deployments before full rollout.

**.github/workflows/canary-deployment.yml**:
```yaml
name: Canary Deployment

on:
  push:
    branches: [main]

jobs:
  deploy-canary:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to canary (10% traffic)
        run: ./deploy-canary.sh 10

  test-canary:
    needs: deploy-canary
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test canary endpoint
        env:
          CANARY_URL: ${{ secrets.CANARY_API_URL }}
          PROD_URL: ${{ secrets.PROD_API_URL }}
        run: |
          # Test canary
          npx api-test-agent test \
            --spec=api/openapi.yaml \
            --base-url=$CANARY_URL

          # Compare with production
          npx api-test-agent compare \
            --spec=api/openapi.yaml \
            --baseline=$PROD_URL \
            --candidate=$CANARY_URL

  increase-traffic:
    needs: test-canary
    runs-on: ubuntu-latest
    strategy:
      matrix:
        traffic: [25, 50, 75, 100]
    steps:
      - name: Increase to ${{ matrix.traffic }}%
        run: ./deploy-canary.sh ${{ matrix.traffic }}

      - name: Monitor metrics
        run: |
          sleep 300  # Wait 5 minutes
          npx api-test-agent test --spec=api/openapi.yaml
```

---

## Tips and Best Practices

### Reusable Workflows

Create reusable workflow for DRY:

**.github/workflows/reusable-api-test.yml**:
```yaml
name: Reusable API Test

on:
  workflow_call:
    inputs:
      spec_path:
        required: true
        type: string
      environment:
        required: true
        type: string
    secrets:
      api_url:
        required: true
      auth_token:
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        env:
          API_BASE_URL: ${{ secrets.api_url }}
          AUTH_TOKEN: ${{ secrets.auth_token }}
        run: |
          npx api-test-agent test \
            --spec=${{ inputs.spec_path }} \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN
```

**Use in other workflows**:
```yaml
jobs:
  test-dev:
    uses: ./.github/workflows/reusable-api-test.yml
    with:
      spec_path: api/openapi.yaml
      environment: dev
    secrets:
      api_url: ${{ secrets.DEV_API_URL }}
      auth_token: ${{ secrets.DEV_AUTH_TOKEN }}
```

---

## Next Steps

- Review [GitHub Setup Guide](./github-setup.md) for installation
- Check [Troubleshooting Guide](./github-troubleshooting.md) for common issues
- Explore [Advanced Features](./advanced-features.md)

---

## Contributing

Found a useful pattern? Submit a PR to add it to this guide!
