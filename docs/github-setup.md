# GitHub Integration Setup Guide

Complete guide for setting up API Test Agent with GitHub integration, including Actions, webhooks, and check runs.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Token Setup](#github-token-setup)
- [Installation Methods](#installation-methods)
  - [Method 1: GitHub Action (Recommended)](#method-1-github-action-recommended)
  - [Method 2: Webhook Integration](#method-2-webhook-integration)
  - [Method 3: Manual CLI](#method-3-manual-cli)
- [Repository Configuration](#repository-configuration)
- [First Test Run](#first-test-run)
- [Advanced Configuration](#advanced-configuration)
- [Verification Checklist](#verification-checklist)

---

## Prerequisites

Before setting up GitHub integration, ensure you have:

- **GitHub Account**: With admin access to the target repository
- **Repository with API Specification**: OpenAPI 3.0+ specification file (YAML or JSON)
- **Node.js**: Version 18.0.0 or higher
- **API Test Agent**: Installed via npm (`npm install -g api-test-agent`)

### Required Permissions

The GitHub token or app needs the following permissions:

- `repo` - Full repository access (or `repo:status` for public repos)
- `checks:write` - Create and update check runs
- `pull_requests:write` - Comment on pull requests
- `contents:read` - Read repository contents

---

## GitHub Token Setup

### Step 1: Generate Personal Access Token (Classic)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click **"Generate new token (classic)"**
3. Give your token a descriptive name (e.g., "API Test Agent - MyRepo")
4. Set expiration (recommended: 90 days, then rotate)
5. Select the following scopes:

   ```
   ✓ repo
     ✓ repo:status
     ✓ repo_deployment
     ✓ public_repo (if public repository)
   ✓ write:discussion
   ✓ read:org (if using organization repos)
   ```

6. Click **"Generate token"**
7. **IMPORTANT**: Copy the token immediately (you won't see it again)

### Step 2: Generate Fine-Grained Personal Access Token (Alternative)

For better security, use fine-grained tokens:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click **"Generate new token"**
3. Configure:
   - **Token name**: API Test Agent
   - **Expiration**: 90 days
   - **Repository access**: Select specific repositories
4. Select permissions:
   - **Repository permissions**:
     - Contents: Read
     - Checks: Read and write
     - Pull requests: Read and write
     - Issues: Read and write (for comments)
5. Click **"Generate token"** and copy it

### Step 3: Store Token Securely

Add the token to your repository secrets:

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Name: `GITHUB_TOKEN` (or `API_TEST_AGENT_TOKEN`)
4. Value: Paste your token
5. Click **"Add secret"**

**Security Best Practices**:
- Never commit tokens to source control
- Rotate tokens every 90 days
- Use organization secrets for multiple repositories
- Limit token scope to minimum required permissions

---

## Installation Methods

### Method 1: GitHub Action (Recommended)

This is the easiest and most integrated approach.

#### Step 1.1: Create Workflow File

Create `.github/workflows/api-tests.yml`:

```yaml
name: API Tests

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'api/**/*.yaml'
      - 'api/**/*.json'
  issue_comment:
    types: [created]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - prod

jobs:
  # Detect if tests should run
  detect-trigger:
    runs-on: ubuntu-latest
    outputs:
      should_run: ${{ steps.check.outputs.should_run }}
      spec_path: ${{ steps.check.outputs.spec_path }}
      environment: ${{ steps.check.outputs.environment }}
    steps:
      - name: Check trigger
        id: check
        uses: actions/github-script@v7
        with:
          script: |
            const { context } = github;

            // Check for comment trigger
            if (context.eventName === 'issue_comment') {
              const comment = context.payload.comment.body;
              const trigger = /@api-test-agent\s+test/i;

              if (trigger.test(comment)) {
                const specMatch = comment.match(/--spec[=\s]+([^\s]+)/i);
                const envMatch = comment.match(/--env[=\s]+(\w+)/i);

                core.setOutput('should_run', 'true');
                core.setOutput('spec_path', specMatch ? specMatch[1] : 'api/openapi.yaml');
                core.setOutput('environment', envMatch ? envMatch[1] : 'dev');
              } else {
                core.setOutput('should_run', 'false');
              }
            } else if (context.eventName === 'pull_request') {
              core.setOutput('should_run', 'true');
              core.setOutput('spec_path', 'api/openapi.yaml');
              core.setOutput('environment', 'dev');
            } else if (context.eventName === 'workflow_dispatch') {
              core.setOutput('should_run', 'true');
              core.setOutput('spec_path', 'api/openapi.yaml');
              core.setOutput('environment', github.event.inputs.environment);
            }

  # Run API tests
  api-tests:
    needs: detect-trigger
    if: needs.detect-trigger.outputs.should_run == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm install -g api-test-agent

      - name: Run API tests
        id: run-tests
        env:
          API_BASE_URL: ${{ secrets[format('{0}_API_URL', needs.detect-trigger.outputs.environment)] }}
          AUTH_TOKEN: ${{ secrets[format('{0}_AUTH_TOKEN', needs.detect-trigger.outputs.environment)] }}
        run: |
          api-test-agent test \
            --spec=${{ needs.detect-trigger.outputs.spec_path }} \
            --base-url=$API_BASE_URL \
            --auth-token=$AUTH_TOKEN \
            --environment=${{ needs.detect-trigger.outputs.environment }} \
            --output=json \
            --output-file=test-results.json

      - name: Parse test results
        id: parse-results
        run: |
          RESULTS=$(cat test-results.json)
          TOTAL=$(echo $RESULTS | jq '.summary.total')
          PASSED=$(echo $RESULTS | jq '.summary.passed')
          FAILED=$(echo $RESULTS | jq '.summary.failed')

          echo "total=$TOTAL" >> $GITHUB_OUTPUT
          echo "passed=$PASSED" >> $GITHUB_OUTPUT
          echo "failed=$FAILED" >> $GITHUB_OUTPUT

      - name: Create check run
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'API Tests',
              head_sha: context.payload.pull_request?.head?.sha || context.sha,
              status: 'completed',
              conclusion: results.summary.failed === 0 ? 'success' : 'failure',
              output: {
                title: results.summary.failed === 0 ? 'All API tests passed' : 'Some API tests failed',
                summary: `**Total**: ${results.summary.total} | **Passed**: ${results.summary.passed} | **Failed**: ${results.summary.failed}`,
                text: JSON.stringify(results, null, 2)
              }
            });

      - name: Comment on PR
        if: github.event_name == 'pull_request' || github.event_name == 'issue_comment'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
            const { total, passed, failed } = results.summary;

            const emoji = failed === 0 ? '✅' : '❌';
            const status = failed === 0 ? 'passed' : 'failed';

            const comment = `### ${emoji} API Tests ${status.toUpperCase()}

**Environment**: ${{ needs.detect-trigger.outputs.environment }}
**Spec**: ${{ needs.detect-trigger.outputs.spec_path }}

| Metric | Count |
|--------|-------|
| Total Tests | ${total} |
| Passed | ✅ ${passed} |
| Failed | ❌ ${failed} |

<details>
<summary>Full Results</summary>

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

</details>`;

            const prNumber = context.payload.pull_request?.number || context.payload.issue?.number;
            if (prNumber) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: prNumber,
                body: comment
              });
            }

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: api-test-results-${{ needs.detect-trigger.outputs.environment }}
          path: |
            test-results.json
            test-results/
          retention-days: 30

      - name: Fail workflow if tests failed
        if: steps.parse-results.outputs.failed != '0'
        run: exit 1
```

#### Step 1.2: Commit and Push

```bash
git add .github/workflows/api-tests.yml
git commit -m "Add API test automation workflow"
git push origin main
```

---

### Method 2: Webhook Integration

For real-time comment-triggered testing.

#### Step 2.1: Set Up Webhook Server

Create `server/webhook.js`:

```javascript
import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();

app.use(express.json());

// Webhook secret for verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Verify GitHub signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

app.post('/webhook', async (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];

  if (event === 'issue_comment' && req.body.action === 'created') {
    const comment = req.body.comment.body;

    // Check for trigger
    if (/@api-test-agent\s+test/i.test(comment)) {
      // Parse command
      const specMatch = comment.match(/--spec[=\s]+([^\s]+)/i);
      const envMatch = comment.match(/--env[=\s]+(\w+)/i);

      const specPath = specMatch ? specMatch[1] : 'api/openapi.yaml';
      const environment = envMatch ? envMatch[1] : 'dev';

      // Run tests
      try {
        const { stdout } = await execAsync(
          `api-test-agent test --spec=${specPath} --environment=${environment} --output=json`
        );

        const results = JSON.parse(stdout);

        // Post comment with results
        // (Use GitHub API client here)

        res.status(200).send('Tests triggered');
      } catch (error) {
        console.error('Test execution failed:', error);
        res.status(500).send('Test execution failed');
      }
    } else {
      res.status(200).send('Not a test trigger');
    }
  } else {
    res.status(200).send('Event ignored');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
```

#### Step 2.2: Configure GitHub Webhook

1. Go to repository **Settings → Webhooks → Add webhook**
2. **Payload URL**: Your server URL (e.g., `https://your-server.com/webhook`)
3. **Content type**: `application/json`
4. **Secret**: Generate a strong secret and save it
5. **Events**: Select "Issue comments" and "Pull requests"
6. Click **"Add webhook"**

---

### Method 3: Manual CLI

For local testing or CI/CD integration.

```bash
# Install globally
npm install -g api-test-agent

# Run tests
api-test-agent test \
  --spec=api/openapi.yaml \
  --base-url=https://api.example.com \
  --auth-token=$AUTH_TOKEN \
  --environment=dev

# With GitHub integration
export GITHUB_TOKEN=your_token_here

api-test-agent test \
  --spec=api/openapi.yaml \
  --base-url=https://api.example.com \
  --github-repo=owner/repo \
  --github-pr=42
```

---

## Repository Configuration

### Environment Variables

Set up environment-specific secrets:

**Development Environment**:
- `DEV_API_URL`: Development API base URL
- `DEV_AUTH_TOKEN`: Development authentication token

**Staging Environment**:
- `STAGING_API_URL`: Staging API base URL
- `STAGING_AUTH_TOKEN`: Staging authentication token

**Production Environment**:
- `PROD_API_URL`: Production API base URL
- `PROD_AUTH_TOKEN`: Production authentication token

### Branch Protection Rules

Recommended settings:

1. Go to **Settings → Branches → Add rule**
2. **Branch name pattern**: `main` (or your default branch)
3. Enable:
   - ✓ Require status checks to pass before merging
   - ✓ Require branches to be up to date before merging
   - ✓ Status checks: Select "API Tests"
4. Save changes

---

## First Test Run

### Via Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/test-github-integration
   ```

2. Make a small change to your API spec:
   ```bash
   echo "# Test" >> api/openapi.yaml
   ```

3. Commit and push:
   ```bash
   git add api/openapi.yaml
   git commit -m "Test GitHub integration"
   git push origin feature/test-github-integration
   ```

4. Create a pull request on GitHub

5. Verify:
   - GitHub Action starts automatically
   - Check run appears in PR
   - Test results are posted as comment

### Via Comment

1. On an existing PR, post a comment:
   ```
   @api-test-agent test --spec=api/openapi.yaml --env=staging
   ```

2. Verify:
   - Tests are triggered
   - Check run is created
   - Results are posted as reply comment

### Via Workflow Dispatch

1. Go to **Actions → API Tests → Run workflow**
2. Select branch
3. Choose environment
4. Click **"Run workflow"**

---

## Advanced Configuration

### Multiple Spec Files

Test multiple API versions:

```yaml
strategy:
  matrix:
    spec:
      - api/v1/openapi.yaml
      - api/v2/openapi.yaml
      - api/internal/openapi.yaml
    environment: [dev, staging]

steps:
  - name: Run tests
    run: |
      api-test-agent test \
        --spec=${{ matrix.spec }} \
        --environment=${{ matrix.environment }}
```

### Custom Test Configuration

Create `.api-test-agent.yml`:

```yaml
specs:
  - path: api/openapi.yaml
    baseUrl: ${API_BASE_URL}
    auth:
      type: bearer
      token: ${AUTH_TOKEN}

  - path: api/v2/openapi.yaml
    baseUrl: ${API_V2_BASE_URL}
    auth:
      type: apiKey
      header: X-API-Key
      value: ${API_KEY}

environments:
  dev:
    API_BASE_URL: https://dev-api.example.com
    API_V2_BASE_URL: https://dev-api.example.com/v2

  staging:
    API_BASE_URL: https://staging-api.example.com
    API_V2_BASE_URL: https://staging-api.example.com/v2

reporting:
  formats: [json, html, junit]
  outputDir: ./test-results

github:
  commentOnPR: true
  createCheckRun: true
  uploadArtifacts: true
```

### Scheduled Testing

Add cron schedule to workflow:

```yaml
on:
  schedule:
    # Run tests daily at 2 AM UTC
    - cron: '0 2 * * *'
  pull_request:
  issue_comment:
```

---

## Verification Checklist

After setup, verify everything is working:

### Token Permissions
- [ ] Token has `repo` scope
- [ ] Token has `checks:write` permission
- [ ] Token has `pull_requests:write` permission
- [ ] Token is stored in repository secrets

### GitHub Action
- [ ] Workflow file exists in `.github/workflows/`
- [ ] Workflow runs on PR events
- [ ] Workflow runs on comment triggers
- [ ] Action can access secrets

### Test Execution
- [ ] Tests run successfully
- [ ] Test results are generated
- [ ] Results are in expected format

### GitHub Integration
- [ ] Check runs appear in PRs
- [ ] Check runs show correct status
- [ ] Comments are posted to PRs
- [ ] Comment formatting is correct

### Error Handling
- [ ] Permission errors are caught
- [ ] Rate limit errors are handled
- [ ] Network errors are retried
- [ ] Test failures are reported

---

## Troubleshooting

If you encounter issues, see [GitHub Troubleshooting Guide](./github-troubleshooting.md).

Common issues:
- **Token permissions**: Ensure all required scopes are selected
- **Workflow not triggering**: Check event types and file paths
- **Tests not running**: Verify Node.js version and dependencies
- **Comments not posting**: Check token `pull_requests:write` permission

---

## Next Steps

- Read [GitHub Examples](./github-examples.md) for more use cases
- Explore [Advanced Configuration](./advanced-config.md)
- Set up [Multi-Repository Testing](./multi-repo.md)
- Configure [Slack/Teams Notifications](./notifications.md)

---

## Support

- GitHub Issues: https://github.com/your-org/api-test-agent/issues
- Documentation: https://docs.example.com
- Discord: https://discord.gg/your-channel
