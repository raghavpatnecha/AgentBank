# Feature 5: GitHub Integration

## Overview
Integrate with GitHub to trigger tests via PR comments, post results, update check statuses, and provide seamless CI/CD workflow integration.

## Status
**Current Status**: Not Started
**Priority**: High
**Target Completion**: Week 9
**Progress**: 0/8 tasks complete

## Dependencies
- Feature 3: Test Executor (must be complete)

## Tasks

### Task 5.1: GitHub Actions Workflow Setup
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Create reusable GitHub Action for running API tests in workflows.

**Acceptance Criteria**:
- [ ] action.yml file with inputs and outputs defined
- [ ] Docker-based action using composite run steps
- [ ] Support for OpenAPI spec path input
- [ ] Support for environment configuration
- [ ] Support for output report path
- [ ] Example workflow files
- [ ] Action marketplace documentation

**Files to Create**:
- .github/actions/api-test-agent/action.yml
- .github/workflows/example-usage.yml
- docs/github-actions.md

**Action Inputs**:
```yaml
inputs:
  spec-path:
    description: 'Path to OpenAPI specification file'
    required: true
  environment:
    description: 'Target environment (dev/staging/prod)'
    default: 'dev'
  api-base-url:
    description: 'Base URL for API'
    required: true
  auth-token:
    description: 'Authentication token'
    required: false
```

**Notes**:
Follow GitHub Actions best practices for naming and documentation.

---

### Task 5.2: Webhook Handler
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Implement webhook endpoint to receive GitHub events.

**Acceptance Criteria**:
- [ ] Express server for webhook endpoint
- [ ] Signature verification for security
- [ ] Handle issue_comment events
- [ ] Handle pull_request events
- [ ] Parse event payload
- [ ] Extract PR information
- [ ] Queue test execution jobs
- [ ] Unit tests with mock payloads

**Files to Create**:
- src/github/webhook-server.ts
- src/github/signature-verifier.ts
- tests/unit/webhook-server.test.ts

**Webhook Endpoint**:
```
POST /webhook
```

**Security**:
Verify webhook signature using HMAC with GitHub secret.

**Notes**:
This is optional for users who want webhook-based triggering instead of Actions.

---

### Task 5.3: Comment Trigger Detection
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Detect and parse @mention triggers in PR comments.

**Acceptance Criteria**:
- [ ] Detect @api-test-agent mentions
- [ ] Parse command arguments (run, help, config)
- [ ] Validate comment author permissions
- [ ] Extract PR context (branch, files changed)
- [ ] Ignore bot comments to prevent loops
- [ ] Unit tests for parsing logic

**Files to Create**:
- src/github/comment-parser.ts
- src/github/permission-checker.ts
- tests/unit/comment-parser.test.ts

**Supported Commands**:
```
@api-test-agent run
@api-test-agent run --env staging
@api-test-agent help
```

**Notes**:
Check that commenter has write access to prevent abuse.

---

### Task 5.4: GitHub API Client
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Implement GitHub API client using Octokit for all GitHub operations.

**Acceptance Criteria**:
- [ ] Initialize Octokit with authentication
- [ ] Fetch PR information
- [ ] Fetch OpenAPI spec from repository
- [ ] Post comments to PRs
- [ ] Update check run status
- [ ] Handle rate limiting
- [ ] Retry failed requests
- [ ] Unit tests with mocked API

**Files to Create**:
- src/github/github-client.ts
- tests/unit/github-client.test.ts

**Required Permissions**:
```
- contents: read
- issues: write
- pull-requests: write
- checks: write
```

**Environment Variables**:
```
API_TEST_AGENT_GITHUB_TOKEN (required)
```

**Notes**:
Use Octokit's built-in retry and throttling plugins.

---

### Task 5.5: PR Comment Formatter
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Generate rich, formatted comments with test results for PRs.

**Acceptance Criteria**:
- [ ] Format test summary (passed/failed/healed)
- [ ] Include failure details
- [ ] Highlight self-healed tests
- [ ] Link to full HTML report
- [ ] Use GitHub Flavored Markdown
- [ ] Add emoji for visual clarity (optional)
- [ ] Collapsible sections for details
- [ ] Unit tests for formatting

**Files to Create**:
- src/github/comment-formatter.ts
- tests/unit/comment-formatter.test.ts

**Example Comment**:
```markdown
### API Test Results

**Summary**: 23 passed, 2 failed, 1 self-healed

#### Passed Tests
- GET /users - Retrieve all users
- POST /users - Create new user
- ... (21 more)

#### Failed Tests
<details>
<summary>POST /orders - Invalid quantity (click to expand)</summary>

**Error**: Expected status 400 but got 422

**Request**:
POST /orders
Body: { quantity: -1 }

**Response**:
Status: 422
Body: { error: "Unprocessable entity" }
</details>

#### Self-Healed Tests
- GET /products - Field 'price' renamed to 'cost' (auto-fixed)

[View Full Report](https://example.com/reports/abc123)
```

**Notes**:
Keep summary concise. Use collapsible sections for details.

---

### Task 5.6: Check Runs Integration
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Create and update GitHub check runs to show test status in PR UI.

**Acceptance Criteria**:
- [ ] Create check run when tests start
- [ ] Update status to in_progress
- [ ] Update status to completed (success/failure)
- [ ] Add annotations for failed tests
- [ ] Include summary in check run
- [ ] Link to detailed report
- [ ] Handle check run failures gracefully
- [ ] Integration tests

**Files to Create**:
- src/github/check-runner.ts
- tests/integration/check-runs.test.ts

**Check Run States**:
```
queued -> in_progress -> completed
```

**Annotations**:
Add file-level annotations if OpenAPI spec is in repo and errors relate to specific paths.

**Notes**:
Check runs appear in the PR "Checks" tab.

---

### Task 5.7: Spec File Detection
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Medium
**Owner**: Unassigned

**Description**:
Automatically detect OpenAPI spec files in the repository.

**Acceptance Criteria**:
- [ ] Search for common spec file names
- [ ] Search in common directories (docs/, api/, spec/)
- [ ] Support multiple specs per repo
- [ ] Allow manual override via comment argument
- [ ] Validate detected files are valid OpenAPI
- [ ] Cache detection results
- [ ] Unit tests for detection logic

**Files to Create**:
- src/github/spec-detector.ts
- tests/unit/spec-detector.test.ts

**Common Spec Locations**:
```
- openapi.yaml / openapi.json
- swagger.yaml / swagger.json
- api/openapi.yaml
- docs/api.yaml
- spec/openapi.yaml
```

**Command Override**:
```
@api-test-agent run --spec api/v2/openapi.yaml
```

**Notes**:
Prioritize files in root directory. Warn if multiple specs found.

---

### Task 5.8: GitHub Integration Testing and Documentation
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Complete integration testing and comprehensive documentation for GitHub features.

**Acceptance Criteria**:
- [ ] End-to-end test with actual GitHub repo
- [ ] Test comment trigger flow
- [ ] Test check run updates
- [ ] Test with public and private repos
- [ ] Setup guide for new users
- [ ] Troubleshooting documentation
- [ ] Video walkthrough (optional)

**Files to Create**:
- tests/e2e/github-integration.test.ts
- docs/github-setup.md
- docs/github-troubleshooting.md
- examples/github-workflow-complete.yml

**Documentation Topics**:
- Setting up GitHub token
- Configuring webhook (if used)
- Installing GitHub Action
- Using @mention triggers
- Interpreting check results
- Common issues and solutions

**Notes**:
This completes the GitHub integration feature. All previous tasks must be done.

---

## Testing Strategy

### Unit Tests
- Mock Octokit API calls
- Test comment parsing logic
- Test formatting functions
- Target 80% coverage

### Integration Tests
- Use GitHub API with test repository
- Test actual comment posting
- Test check run creation
- Verify webhook handling

### End-to-End Tests
- Complete workflow from trigger to report
- Test in real PR environment
- Verify all integrations work together

## Success Criteria

Feature is complete when:
- All 8 tasks marked complete
- GitHub Action published and usable
- Comment triggers work in PRs
- Check runs update correctly
- 80% unit test coverage
- Integration tests passing
- Documentation complete with examples
- At least one successful test run in real PR

## Risks and Mitigations

### Risk: GitHub API rate limiting
**Mitigation**: Implement caching, respect rate limits, use conditional requests

### Risk: Webhook security vulnerabilities
**Mitigation**: Always verify signatures, validate inputs, use HTTPS only

### Risk: Permission issues
**Mitigation**: Clear documentation on required permissions, helpful error messages

## Dependencies

### GitHub Requirements
- GitHub account
- Repository with pull requests
- Personal access token or GitHub App

### Permissions Needed
```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
  checks: write
```

## Configuration

### Required Environment Variables
```
API_TEST_AGENT_GITHUB_TOKEN
```

### Optional Environment Variables
```
API_TEST_AGENT_GITHUB_WEBHOOK_SECRET (if using webhooks)
API_TEST_AGENT_GITHUB_APP_ID (if using GitHub App)
```

## Notes

- Use GitHub App instead of PAT for production (better security)
- Rate limits: 5000 requests/hour for authenticated requests
- Webhooks are optional - GitHub Actions can work standalone
- Consider creating a dedicated bot account
- Test thoroughly in private repo before public release

## References

- GitHub Actions: https://docs.github.com/en/actions
- Octokit: https://github.com/octokit/octokit.js
- GitHub Webhooks: https://docs.github.com/en/webhooks
- Check Runs API: https://docs.github.com/en/rest/checks/runs
