# GitHub Integration Troubleshooting Guide

Comprehensive troubleshooting guide for API Test Agent GitHub integration issues.

## Table of Contents

- [Permission Errors](#permission-errors)
- [Authentication Issues](#authentication-issues)
- [Rate Limiting](#rate-limiting)
- [Webhook Problems](#webhook-problems)
- [Check Run Issues](#check-run-issues)
- [Action Failures](#action-failures)
- [Network Errors](#network-errors)
- [Test Execution Problems](#test-execution-problems)
- [Common Questions (FAQ)](#common-questions-faq)

---

## Permission Errors

### Error: "Resource not accessible by integration"

**Symptoms**:
- GitHub API returns 403 Forbidden
- Error message mentions "Resource not accessible"
- Actions fail when trying to create comments or check runs

**Causes**:
1. Missing required permissions in token
2. Token scope is too restrictive
3. Repository settings block the action

**Solutions**:

#### Solution 1: Check Token Permissions

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Find your token and click "Edit"
3. Ensure these scopes are selected:
   ```
   ✓ repo (Full control)
     or
   ✓ public_repo (for public repositories)
   ✓ write:discussion
   ```
4. Click "Update token"
5. Update the secret in your repository

#### Solution 2: Use Fine-Grained Token

Fine-grained tokens offer more control:

1. Create a new fine-grained token
2. Select repository access (specific repos)
3. Set these permissions:
   - **Contents**: Read
   - **Checks**: Read and write
   - **Pull requests**: Read and write
   - **Issues**: Read and write
4. Save and update repository secret

#### Solution 3: Check Repository Settings

1. Go to repository Settings → Actions → General
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"
3. Save changes

**Verification**:
```bash
# Test token permissions
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/pulls/1/comments

# Should return 200 OK, not 403
```

---

### Error: "Requires authentication"

**Symptoms**:
- API returns 401 Unauthorized
- "Requires authentication" error message

**Causes**:
- Token not provided
- Token not properly configured in secrets
- Token format is incorrect

**Solutions**:

#### Solution 1: Verify Secret Configuration

```yaml
# In workflow file
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Common mistake - typo in secret name
env:
  GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}  # Wrong if secret is named GITHUB_TOKEN
```

#### Solution 2: Check Token Format

```bash
# Correct format
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Wrong - missing prefix or quotes
export GITHUB_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Solution 3: Regenerate Token

If token is corrupted or expired:
1. Delete old token
2. Generate new token with same permissions
3. Update repository secret immediately

---

## Authentication Issues

### Error: "Bad credentials"

**Symptoms**:
- 401 Unauthorized responses
- "Bad credentials" in error message
- Tests fail immediately

**Diagnostic Steps**:

```bash
# Test token validity
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Expected: Your user info
# Error: {"message": "Bad credentials", ...}
```

**Solutions**:

#### Solution 1: Token Expired

1. Check token expiration date
2. Generate new token
3. Update secrets:
   ```bash
   # Via GitHub CLI
   gh secret set GITHUB_TOKEN < token.txt

   # Or via UI: Settings → Secrets → Update
   ```

#### Solution 2: Wrong Token Type

Ensure you're using a Personal Access Token (PAT), not an OAuth token or SSH key.

```bash
# PAT format: ghp_xxxxxxxxxxxxx (Classic)
# PAT format: github_pat_xxxxxxxxxxxxx (Fine-grained)

# NOT: gho_xxxxxxxxxxxxx (OAuth)
# NOT: ssh-rsa AAAAB3Nza... (SSH key)
```

#### Solution 3: Token Revoked

If token was revoked:
1. Generate new token
2. Update all locations where it's used
3. Set up token rotation reminders

---

## Rate Limiting

### Error: "API rate limit exceeded"

**Symptoms**:
- 403 Forbidden with rate limit message
- X-RateLimit-Remaining header shows 0
- Intermittent failures during high activity

**Understanding Rate Limits**:

GitHub API rate limits:
- **Authenticated requests**: 5,000 per hour
- **Unauthenticated requests**: 60 per hour
- **Search API**: 30 per minute
- **Check Runs API**: 1,000 per hour

**Solutions**:

#### Solution 1: Check Current Rate Limit

```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Response shows:
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1699564800
    }
  }
}
```

#### Solution 2: Implement Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        const resetTime = error.headers['x-ratelimit-reset'];
        const waitTime = (parseInt(resetTime) * 1000) - Date.now();

        if (i < maxRetries - 1 && waitTime > 0) {
          console.log(`Rate limited. Waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Solution 3: Optimize API Calls

```typescript
// Bad - Multiple separate calls
for (const file of files) {
  await github.getFile(file);
}

// Good - Batch operations
const contents = await github.getContents(files);

// Better - Use GraphQL for complex queries
const query = `
  query {
    repository(owner: "owner", name: "repo") {
      pullRequest(number: 42) {
        comments(first: 100) { ... }
        files(first: 100) { ... }
      }
    }
  }
`;
```

#### Solution 4: Use Conditional Requests

```typescript
// Cache and use ETags
const response = await fetch(url, {
  headers: {
    'If-None-Match': cachedETag,
    'Authorization': `token ${token}`
  }
});

if (response.status === 304) {
  // Use cached data
  return cache.get(url);
}
```

---

## Webhook Problems

### Webhook Not Triggering

**Symptoms**:
- Comment posted but tests don't run
- No webhook delivery attempts shown
- Server never receives webhook event

**Diagnostic Steps**:

1. Check webhook configuration:
   - Go to Settings → Webhooks
   - Click on your webhook
   - Check "Recent Deliveries" tab

2. Verify webhook events:
   ```json
   {
     "events": ["issue_comment", "pull_request"],
     "active": true
   }
   ```

**Solutions**:

#### Solution 1: Verify Webhook URL

```bash
# Test webhook endpoint
curl -X POST https://your-server.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Should return 200 OK
```

#### Solution 2: Check Event Types

Ensure webhook listens to correct events:
1. Settings → Webhooks → Edit
2. Under "Which events would you like to trigger this webhook?":
   - ✓ Issue comments
   - ✓ Pull requests
3. Save webhook

#### Solution 3: Verify Signature

```javascript
// Server-side verification
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// In webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  if (!verifySignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook...
});
```

### Webhook Delivery Failures

**Check Delivery Logs**:

1. Go to Settings → Webhooks → Your webhook
2. Click "Recent Deliveries"
3. Check failed deliveries for errors

**Common Delivery Errors**:

```
Timeout: Server didn't respond within 10 seconds
→ Optimize server response time
→ Return 200 immediately, process async

Connection refused: Server not accessible
→ Check firewall rules
→ Verify server is running
→ Check DNS/IP configuration

502 Bad Gateway: Server error
→ Check server logs
→ Verify server is healthy
→ Check reverse proxy config
```

**Solution: Webhook Replay**

For failed deliveries:
1. Click on failed delivery
2. Click "Redeliver"
3. Confirm redelivery

---

## Check Run Issues

### Check Run Not Appearing

**Symptoms**:
- PR doesn't show check run
- No status checks in "Checks" tab
- Workflow completes but no check run created

**Solutions**:

#### Solution 1: Verify SHA

```javascript
// Ensure you're using the correct SHA
const sha = context.payload.pull_request?.head?.sha || context.sha;

await github.rest.checks.create({
  owner,
  repo,
  name: 'API Tests',
  head_sha: sha,  // Critical - must be exact SHA
  // ...
});
```

#### Solution 2: Check Permissions

```yaml
# In workflow file
permissions:
  checks: write  # Required for check runs
  pull-requests: write
  contents: read
```

#### Solution 3: Verify Check Run Name

```javascript
// Name must be unique and under 255 characters
await github.rest.checks.create({
  name: 'API Tests',  // ✓ Good
  // name: 'A'.repeat(300),  // ✗ Too long
  // ...
});
```

### Check Run Status Not Updating

**Symptoms**:
- Check run shows "queued" indefinitely
- Status doesn't change to "in_progress" or "completed"

**Solutions**:

#### Solution 1: Complete Check Run

```javascript
// Always complete check runs
await github.rest.checks.update({
  owner,
  repo,
  check_run_id: checkRunId,
  status: 'completed',  // Required
  conclusion: 'success',  // Required when status is 'completed'
});
```

#### Solution 2: Handle Errors Properly

```javascript
let checkRunId;

try {
  // Create check run
  const { data } = await github.rest.checks.create({...});
  checkRunId = data.id;

  // Update to in_progress
  await github.rest.checks.update({
    check_run_id: checkRunId,
    status: 'in_progress',
  });

  // Run tests
  const results = await runTests();

  // Complete with success
  await github.rest.checks.update({
    check_run_id: checkRunId,
    status: 'completed',
    conclusion: 'success',
  });
} catch (error) {
  // IMPORTANT: Complete check run even on error
  if (checkRunId) {
    await github.rest.checks.update({
      check_run_id: checkRunId,
      status: 'completed',
      conclusion: 'failure',
      output: {
        title: 'Error',
        summary: error.message,
      },
    });
  }
  throw error;
}
```

---

## Action Failures

### Workflow Not Running

**Symptoms**:
- PR created but workflow doesn't start
- No workflow runs in Actions tab
- Comment posted but nothing happens

**Diagnostic Steps**:

```yaml
# Check workflow trigger configuration
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:  # ← May be too restrictive
      - 'api/**/*.yaml'

  issue_comment:
    types: [created]  # ← Should this include 'edited'?
```

**Solutions**:

#### Solution 1: Broaden Path Filters

```yaml
# Before - too restrictive
on:
  pull_request:
    paths:
      - 'api/openapi.yaml'  # Only this exact file

# After - more flexible
on:
  pull_request:
    paths:
      - 'api/**/*.yaml'
      - 'api/**/*.json'
      - '.github/workflows/api-tests.yml'
```

#### Solution 2: Check Workflow File Location

Workflow must be in `.github/workflows/` directory:

```bash
# Correct
.github/workflows/api-tests.yml

# Wrong - won't be detected
github/workflows/api-tests.yml
workflows/api-tests.yml
.github/api-tests.yml
```

#### Solution 3: Validate YAML Syntax

```bash
# Install yamllint
pip install yamllint

# Validate workflow file
yamllint .github/workflows/api-tests.yml

# Or use online validator
# https://www.yamllint.com/
```

### Step Failures

**"Module not found" Errors**:

```yaml
# Solution: Install dependencies first
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'  # Important for speed

  - run: npm ci  # ← Don't skip this!

  - run: npm test
```

**"Command not found" Errors**:

```bash
# Error: api-test-agent: command not found

# Solution: Install globally or use npx
- name: Install CLI
  run: npm install -g api-test-agent

# Or use npx
- name: Run tests
  run: npx api-test-agent test --spec=api/openapi.yaml
```

---

## Network Errors

### Connection Timeouts

**Symptoms**:
- "ETIMEDOUT" errors
- "connect ECONNREFUSED"
- API calls hang

**Solutions**:

#### Solution 1: Increase Timeout

```typescript
// Default timeout too low
const response = await fetch(url, {
  timeout: 5000  // 5 seconds
});

// Increase for slower APIs
const response = await fetch(url, {
  timeout: 30000  // 30 seconds
});
```

#### Solution 2: Implement Retry Logic

```typescript
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000;  // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### Solution 3: Check Network Configuration

```yaml
# GitHub Actions may need proxy configuration
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      HTTP_PROXY: ${{ secrets.HTTP_PROXY }}
      HTTPS_PROXY: ${{ secrets.HTTPS_PROXY }}
      NO_PROXY: localhost,127.0.0.1
```

### SSL Certificate Errors

**Error: "self signed certificate"**

```typescript
// For development/testing only - NOT for production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Better: Add certificate to trusted store
import https from 'https';

const agent = new https.Agent({
  ca: fs.readFileSync('./custom-ca.pem')
});

const response = await fetch(url, { agent });
```

---

## Test Execution Problems

### Tests Pass Locally But Fail in CI

**Common Causes**:
1. Environment variable differences
2. File path issues
3. Timing/race conditions
4. Missing dependencies

**Solutions**:

#### Solution 1: Debug Environment Variables

```yaml
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    ls -la
    printenv | sort
```

#### Solution 2: Use Absolute Paths

```typescript
// Bad - relative path might differ in CI
const specPath = './api/openapi.yaml';

// Good - resolve to absolute path
import { resolve } from 'path';
const specPath = resolve(__dirname, '../api/openapi.yaml');

// Or use process.cwd()
const specPath = resolve(process.cwd(), 'api/openapi.yaml');
```

#### Solution 3: Add Delays for Timing Issues

```typescript
// If tests have race conditions
test('should update resource', async () => {
  await createResource();

  // Add small delay for eventual consistency
  await new Promise(resolve => setTimeout(resolve, 100));

  const resource = await getResource();
  expect(resource).toBeDefined();
});
```

---

## Common Questions (FAQ)

### Q: Can I use this with GitHub Enterprise?

**A**: Yes! Configure the base URL:

```typescript
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: 'https://github.example.com/api/v3'  // Enterprise URL
});
```

### Q: How do I test multiple OpenAPI specs?

**A**: Use matrix strategy:

```yaml
strategy:
  matrix:
    spec:
      - api/v1/openapi.yaml
      - api/v2/openapi.yaml
      - api/internal/openapi.yaml
steps:
  - run: api-test-agent test --spec=${{ matrix.spec }}
```

### Q: Can I run tests on a schedule?

**A**: Yes, use cron:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
    - cron: '0 */6 * * *'  # Every 6 hours
```

### Q: How do I skip tests for certain PRs?

**A**: Check PR labels:

```yaml
jobs:
  check-skip:
    runs-on: ubuntu-latest
    outputs:
      skip: ${{ steps.check.outputs.skip }}
    steps:
      - uses: actions/github-script@v7
        id: check
        with:
          script: |
            const labels = context.payload.pull_request.labels.map(l => l.name);
            core.setOutput('skip', labels.includes('skip-tests'));

  test:
    needs: check-skip
    if: needs.check-skip.outputs.skip != 'true'
    # ...
```

### Q: How do I handle flaky tests?

**A**: Implement retry logic:

```typescript
test('potentially flaky test', async () => {
  let lastError;

  for (let i = 0; i < 3; i++) {
    try {
      await testFunction();
      return;  // Success
    } catch (error) {
      lastError = error;
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw lastError;
});
```

### Q: Can I test against multiple environments in one PR?

**A**: Yes, use matrix:

```yaml
strategy:
  matrix:
    environment: [dev, staging, prod]
steps:
  - run: api-test-agent test --environment=${{ matrix.environment }}
```

### Q: How do I preserve test results between runs?

**A**: Use artifacts:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-results-${{ github.run_number }}
    path: test-results/
    retention-days: 30
```

---

## Still Having Issues?

If your problem isn't covered here:

1. **Check GitHub Status**: https://www.githubstatus.com/
2. **Search Existing Issues**: https://github.com/your-org/api-test-agent/issues
3. **Enable Debug Logging**:
   ```yaml
   - name: Run tests
     env:
       DEBUG: 'api-test-agent:*'
     run: api-test-agent test --verbose
   ```
4. **Create an Issue**: Include:
   - Error message and stack trace
   - Workflow file
   - Minimal reproduction steps
   - Environment details (OS, Node version, etc.)

---

## Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Octokit SDK](https://github.com/octokit/octokit.js)
- [Webhook Events](https://docs.github.com/en/webhooks)
- [Check Runs API](https://docs.github.com/en/rest/checks/runs)
