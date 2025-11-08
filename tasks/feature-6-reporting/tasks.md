# Feature 6: Reporting

## Overview
Generate comprehensive test reports in multiple formats (HTML, JSON, JUnit XML) and deliver them via email with detailed test results, statistics, and self-healing information.

## Status
**Current Status**: Not Started
**Priority**: Medium
**Target Completion**: Week 10
**Progress**: 0/6 tasks complete

## Dependencies
- Feature 3: Test Executor (must be complete)

## Tasks

### Task 6.1: Report Data Aggregation
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Aggregate test results, execution metadata, and self-healing information into structured report data.

**Acceptance Criteria**:
- [ ] Collect test results from Playwright
- [ ] Aggregate pass/fail/skip statistics
- [ ] Calculate execution time metrics
- [ ] Include self-healing statistics
- [ ] Capture test failure details
- [ ] Organize by test suite/file
- [ ] Export as structured data model
- [ ] Unit tests for aggregation logic

**Files to Create**:
- src/reporting/data-aggregator.ts
- src/types/report-types.ts
- tests/unit/data-aggregator.test.ts

**Report Data Structure**:
```typescript
interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    selfHealed: number;
    duration: number;
  };
  environment: {
    baseUrl: string;
    environment: string;
    timestamp: string;
  };
  tests: TestResult[];
  selfHealing: HealingMetrics;
}
```

**Notes**:
This is the foundation for all report formats.

---

### Task 6.2: HTML Report Generator
**Status**: Not Started
**Estimated Time**: 8 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Generate professional, interactive HTML reports with charts and detailed test information.

**Acceptance Criteria**:
- [ ] Responsive HTML template
- [ ] Summary dashboard with statistics
- [ ] Charts for pass/fail visualization
- [ ] Expandable test details
- [ ] Request/response examples for failures
- [ ] Self-healing section
- [ ] Downloadable report
- [ ] Print-friendly CSS

**Files to Create**:
- src/reporting/html-reporter.ts
- src/reporting/templates/report.html
- src/reporting/templates/styles.css
- tests/unit/html-reporter.test.ts

**Report Sections**:
1. Executive Summary (stats, charts)
2. Test Results (grouped by suite)
3. Failed Tests (detailed breakdown)
4. Self-Healed Tests
5. Performance Metrics
6. Environment Information

**Template Engine**:
Use template literals or lightweight templating (Handlebars/EJS).

**Notes**:
Make it visually appealing. Use charts (Chart.js or similar).

---

### Task 6.3: JSON Report Generator
**Status**: Not Started
**Estimated Time**: 3 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Generate machine-readable JSON reports for CI/CD integration.

**Acceptance Criteria**:
- [ ] Export complete test data as JSON
- [ ] Include all test details
- [ ] Include timing information
- [ ] Include self-healing data
- [ ] Schema-validated output
- [ ] Pretty-printed and minified options
- [ ] Unit tests for JSON structure

**Files to Create**:
- src/reporting/json-reporter.ts
- src/reporting/schemas/report-schema.json
- tests/unit/json-reporter.test.ts

**JSON Structure**:
```json
{
  "version": "1.0.0",
  "generatedAt": "2025-01-08T10:30:00Z",
  "summary": {
    "total": 50,
    "passed": 45,
    "failed": 3,
    "selfHealed": 2
  },
  "tests": [...]
}
```

**Notes**:
Follow JSON Schema standards. Make it parseable by common tools.

---

### Task 6.4: JUnit XML Report Generator
**Status**: Not Started
**Estimated Time**: 4 hours
**Priority**: Medium
**Owner**: Unassigned

**Description**:
Generate JUnit XML format reports for CI/CD tools like Jenkins, GitLab CI.

**Acceptance Criteria**:
- [ ] Generate valid JUnit XML
- [ ] Include test suites and test cases
- [ ] Include failure messages
- [ ] Include execution time
- [ ] Include system-out for logs
- [ ] Validate against JUnit schema
- [ ] Unit tests for XML generation

**Files to Create**:
- src/reporting/junit-reporter.ts
- tests/unit/junit-reporter.test.ts

**JUnit XML Format**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="API Tests" tests="50" failures="3" time="45.2">
    <testcase name="GET /users" time="0.5"/>
    <testcase name="POST /users" time="0.8">
      <failure message="Expected 201 but got 400"/>
    </testcase>
  </testsuite>
</testsuites>
```

**Notes**:
Use xml builder library. Ensure valid XML structure.

---

### Task 6.5: Email Delivery Service
**Status**: Not Started
**Estimated Time**: 6 hours
**Priority**: High
**Owner**: Unassigned

**Description**:
Implement email delivery for test reports using SMTP.

**Acceptance Criteria**:
- [ ] Configure SMTP client (Nodemailer)
- [ ] Send HTML email with embedded report
- [ ] Attach full HTML report file
- [ ] Support multiple recipients
- [ ] Handle email delivery failures
- [ ] Template for email body
- [ ] Test email sending (with mock SMTP)
- [ ] Unit tests for email generation

**Files to Create**:
- src/reporting/email-sender.ts
- src/reporting/templates/email-template.html
- tests/unit/email-sender.test.ts

**Environment Variables**:
```
API_TEST_AGENT_SMTP_HOST
API_TEST_AGENT_SMTP_PORT
API_TEST_AGENT_SMTP_USER
API_TEST_AGENT_SMTP_PASS
API_TEST_AGENT_EMAIL_FROM
API_TEST_AGENT_EMAIL_TO
```

**Email Structure**:
- Subject: "API Test Report - [PASSED/FAILED] - [timestamp]"
- Body: Summary with key statistics
- Attachment: Full HTML report

**Notes**:
Support Gmail, SendGrid, AWS SES. Provide examples for each.

---

### Task 6.6: Report Integration and Configuration
**Status**: Not Started
**Estimated Time**: 5 hours
**Priority**: Critical
**Owner**: Unassigned

**Description**:
Integrate all reporting components and provide configuration options.

**Acceptance Criteria**:
- [ ] Unified report generation interface
- [ ] Configure which formats to generate
- [ ] Configure output directories
- [ ] Configure email settings
- [ ] Generate all reports after test execution
- [ ] Upload reports to storage (optional)
- [ ] Integration tests for complete flow
- [ ] Documentation for configuration

**Files to Create**:
- src/reporting/report-manager.ts
- src/config/reporting-config.ts
- tests/integration/reporting.test.ts
- docs/reporting-configuration.md

**Configuration Options**:
```typescript
interface ReportingConfig {
  formats: ('html' | 'json' | 'junit')[];
  outputDir: string;
  email: {
    enabled: boolean;
    recipients: string[];
    attachReport: boolean;
  };
  upload: {
    enabled: boolean;
    provider: 's3' | 'gcs' | 'azure';
    bucket: string;
  };
}
```

**Report Workflow**:
```
1. Tests complete
2. Aggregate results
3. Generate HTML report
4. Generate JSON report
5. Generate JUnit XML report
6. Send email (if configured)
7. Upload to storage (if configured)
8. Log report locations
```

**Notes**:
This completes the reporting feature. All previous tasks must be done.

---

## Testing Strategy

### Unit Tests
- Test each report format independently
- Mock email service
- Test data aggregation
- Target 80% coverage

### Integration Tests
- Generate reports from real test results
- Test email delivery (with test SMTP)
- Verify all formats are valid
- Test file system operations

### Visual Testing
- Manually review HTML report appearance
- Test on different screen sizes
- Verify charts render correctly

## Success Criteria

Feature is complete when:
- All 6 tasks marked complete
- HTML reports are professional and readable
- JSON reports are schema-valid
- JUnit XML is compatible with CI tools
- Emails deliver successfully
- 80% unit test coverage
- Integration tests passing
- Documentation complete with examples

## Risks and Mitigations

### Risk: Email delivery failures
**Mitigation**: Implement retry logic, log failures, provide alternative delivery methods

### Risk: Large reports exceed email size limits
**Mitigation**: Compress attachments, upload to storage and send link instead

### Risk: SMTP configuration complexity
**Mitigation**: Clear documentation with examples for common providers

## Dependencies

### External Services
- SMTP server (Gmail, SendGrid, AWS SES, etc.)
- Optional: Cloud storage (S3, GCS, Azure Blob)

### Libraries
- nodemailer (email)
- chart.js or similar (charts in HTML)
- xml builder (JUnit XML)
- Handlebars or EJS (templating)

## Configuration

### Required Environment Variables
```
API_TEST_AGENT_SMTP_HOST
API_TEST_AGENT_SMTP_PORT
API_TEST_AGENT_SMTP_USER
API_TEST_AGENT_SMTP_PASS
```

### Optional Environment Variables
```
API_TEST_AGENT_EMAIL_FROM (default: noreply@example.com)
API_TEST_AGENT_EMAIL_TO (comma-separated list)
API_TEST_AGENT_REPORT_OUTPUT_DIR (default: ./reports)
API_TEST_AGENT_REPORT_FORMATS (default: html,json)
```

## Report Examples

### HTML Report Features
- Summary cards with key metrics
- Pie chart for pass/fail distribution
- Bar chart for execution time by suite
- Expandable test details
- Syntax-highlighted request/response
- Self-healing badges
- Timestamp and environment info

### Email Template
```
Subject: API Test Report - PASSED - 2025-01-08 10:30

Hi Team,

Your API tests have completed successfully!

Summary:
- Total Tests: 50
- Passed: 45
- Failed: 3
- Self-Healed: 2
- Duration: 45.2s

See the attached HTML report for full details.

Environment: staging
API Base URL: https://api.staging.example.com

---
Automated by API Test Agent
```

## Performance Considerations

- Generate reports asynchronously
- Compress large reports
- Cache template compilation
- Limit email attachment size
- Stream large JSON files

## Notes

- HTML report should work without JavaScript (progressive enhancement)
- JSON report should be parseable by jq and other tools
- JUnit XML must validate against standard schema
- Email should render well in major clients (Gmail, Outlook)
- Consider dark mode for HTML report
- Make reports shareable (standalone HTML)

## References

- JUnit XML Schema: https://github.com/testmoapp/junitxml
- Nodemailer: https://nodemailer.com/
- Chart.js: https://www.chartjs.org/
- HTML Email Best Practices: https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/
