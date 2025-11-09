# Reporting Configuration Guide

Complete guide to configuring the API Test Agent reporting system.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuration Reference](#configuration-reference)
4. [Report Formats](#report-formats)
5. [Email Configuration](#email-configuration)
6. [Cloud Storage Upload](#cloud-storage-upload)
7. [Environment Variables](#environment-variables)
8. [Examples](#examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

The reporting system generates comprehensive test reports in multiple formats, sends email notifications, and uploads reports to cloud storage providers.

### Features

- **Multiple Formats**: HTML, JSON, JUnit XML, Markdown, PDF
- **Beautiful HTML Reports**: Interactive reports with charts and detailed test information
- **Email Notifications**: Automatic email delivery with attachments
- **Cloud Storage**: Upload to S3, Google Cloud Storage, Azure Blob Storage
- **Customizable**: Extensive configuration options
- **CI/CD Integration**: Machine-readable formats for automation

## Quick Start

### Basic Configuration

Create a `reporting.config.json` file:

```json
{
  "formats": ["html", "json", "junit"],
  "outputDir": "./reports",
  "html": {
    "includeCharts": true,
    "theme": "light"
  },
  "json": {
    "pretty": true
  }
}
```

### Using Environment Variables

```bash
export API_TEST_AGENT_REPORT_FORMATS=html,json
export API_TEST_AGENT_REPORT_OUTPUT_DIR=./reports
```

### Programmatic Usage

```typescript
import { ReportManager } from './src/reporting/report-manager';
import { loadConfig } from './src/config/reporting-config';

const config = loadConfig();
const manager = new ReportManager(config);

// After tests complete
const result = await manager.generateAllReports(playwrightTestResults);

console.log(\`Reports generated at:\`);
for (const [format, report] of Object.entries(result.reports)) {
  console.log(\`  \${format}: \${report.path}\`);
}
```

## Configuration Reference

### Root Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`formats\` | \`ReportFormat[]\` | \`['html', 'json']\` | Report formats to generate |
| \`outputDir\` | \`string\` | \`'./reports'\` | Output directory for reports |
| \`filenamePattern\` | \`string\` | \`'test-report-{timestamp}.{format}'\` | Filename pattern |
| \`timestampFormat\` | \`string\` | \`'YYYY-MM-DD_HH-mm-ss'\` | Timestamp format |
| \`parallel\` | \`boolean\` | \`true\` | Generate reports in parallel |
| \`compression\` | \`boolean\` | \`false\` | Compress report files |

### HTML Configuration (\`html\`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`includeCharts\` | \`boolean\` | \`true\` | Include interactive charts |
| \`theme\` | \`'light' \| 'dark' \| 'auto'\` | \`'light'\` | Report theme |
| \`embedAssets\` | \`boolean\` | \`true\` | Embed CSS/JS instead of linking |
| \`includeScreenshots\` | \`boolean\` | \`true\` | Include test screenshots |
| \`includeVideos\` | \`boolean\` | \`true\` | Include test videos |
| \`includeTraces\` | \`boolean\` | \`true\` | Include Playwright traces |
| \`includeTimeline\` | \`boolean\` | \`true\` | Include execution timeline |
| \`customCss\` | \`string\` | \`undefined\` | Custom CSS to inject |
| \`customJs\` | \`string\` | \`undefined\` | Custom JavaScript to inject |
| \`logo\` | \`string\` | \`undefined\` | Logo URL or path |
| \`title\` | \`string\` | \`'Test Report'\` | Report title |

### JSON Configuration (\`json\`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`pretty\` | \`boolean\` | \`true\` | Pretty-print JSON |
| \`includeEnvironment\` | \`boolean\` | \`true\` | Include environment info |
| \`includeMetadata\` | \`boolean\` | \`true\` | Include test metadata |
| \`includeScreenshots\` | \`boolean\` | \`false\` | Include screenshot paths |
| \`includeVideos\` | \`boolean\` | \`false\` | Include video paths |
| \`includeTraces\` | \`boolean\` | \`false\` | Include trace paths |
| \`indent\` | \`number\` | \`2\` | Indentation spaces |

### JUnit Configuration (\`junit\`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`suiteName\` | \`string\` | \`'API Tests'\` | Test suite name |
| \`includeSystemOut\` | \`boolean\` | \`true\` | Include stdout logs |
| \`includeSystemErr\` | \`boolean\` | \`true\` | Include stderr logs |
| \`includeProperties\` | \`boolean\` | \`true\` | Include test properties |
| \`includeHostname\` | \`boolean\` | \`true\` | Include hostname |
| \`includeTimestamp\` | \`boolean\` | \`true\` | Include timestamp |

### Retention Configuration (\`retention\`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`maxReports\` | \`number\` | \`100\` | Maximum number of reports to keep |
| \`maxAge\` | \`number\` | \`30\` | Maximum age in days |
| \`cleanupOnGenerate\` | \`boolean\` | \`true\` | Cleanup when generating new reports |
| \`archiveOldReports\` | \`boolean\` | \`false\` | Archive instead of deleting |

## Report Formats

### HTML Reports

Beautiful, interactive reports with:
- Test summary dashboard
- Pass/fail statistics with charts
- Detailed test results
- Error messages and stack traces
- Screenshots and videos (when available)
- Execution timeline
- Dark/light theme support

### JSON Reports

Machine-readable format for:
- CI/CD integration
- Custom processing
- Data analysis
- Archiving

### JUnit XML Reports

Standard format for:
- Jenkins
- GitLab CI
- CircleCI
- GitHub Actions
- Other CI/CD tools

### Markdown Reports

Human-readable format for:
- Documentation
- Pull request comments
- Wiki pages
- README files

### PDF Reports

Professional format for:
- Stakeholder reports
- Archiving
- Sharing

## Email Configuration

### Basic Setup

```json
{
  "email": {
    "enabled": true,
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    },
    "from": "your-email@gmail.com",
    "recipients": ["team@example.com"],
    "attachReport": true,
    "attachFormats": ["html"],
    "onlyOnFailure": false
  }
}
```

### Provider-Specific Configuration

#### Gmail

```json
{
  "email": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

**Note**: Use an App Password, not your regular password.

#### Outlook/Office 365

```json
{
  "email": {
    "host": "smtp.office365.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@outlook.com",
      "pass": "your-password"
    }
  }
}
```

#### SendGrid

```json
{
  "email": {
    "host": "smtp.sendgrid.net",
    "port": 587,
    "auth": {
      "user": "apikey",
      "pass": "your-sendgrid-api-key"
    }
  }
}
```

#### Amazon SES

```json
{
  "email": {
    "host": "email-smtp.us-east-1.amazonaws.com",
    "port": 587,
    "auth": {
      "user": "your-smtp-username",
      "pass": "your-smtp-password"
    }
  }
}
```

### Email Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`enabled\` | \`boolean\` | \`false\` | Enable email notifications |
| \`host\` | \`string\` | \`'localhost'\` | SMTP host |
| \`port\` | \`number\` | \`587\` | SMTP port |
| \`secure\` | \`boolean\` | \`false\` | Use TLS |
| \`auth.user\` | \`string\` | \`undefined\` | SMTP username |
| \`auth.pass\` | \`string\` | \`undefined\` | SMTP password |
| \`from\` | \`string\` | \`'test@example.com'\` | From address |
| \`recipients\` | \`string[]\` | \`[]\` | To addresses |
| \`cc\` | \`string[]\` | \`undefined\` | CC addresses |
| \`bcc\` | \`string[]\` | \`undefined\` | BCC addresses |
| \`subject\` | \`string\` | \`undefined\` | Custom subject (auto-generated if not set) |
| \`attachReport\` | \`boolean\` | \`true\` | Attach report files |
| \`attachFormats\` | \`ReportFormat[]\` | \`['html']\` | Formats to attach |
| \`onlyOnFailure\` | \`boolean\` | \`false\` | Send only when tests fail |
| \`includeScreenshots\` | \`boolean\` | \`false\` | Attach screenshots |

## Cloud Storage Upload

### Amazon S3

```json
{
  "upload": {
    "enabled": true,
    "provider": "s3",
    "s3": {
      "bucket": "my-test-reports",
      "region": "us-east-1",
      "accessKeyId": "YOUR_ACCESS_KEY",
      "secretAccessKey": "YOUR_SECRET_KEY",
      "prefix": "reports/",
      "acl": "private"
    },
    "uploadFormats": ["html", "json"]
  }
}
```

### Google Cloud Storage

```json
{
  "upload": {
    "enabled": true,
    "provider": "gcs",
    "gcs": {
      "bucket": "my-test-reports",
      "projectId": "my-project",
      "keyFilename": "/path/to/service-account-key.json",
      "prefix": "reports/"
    },
    "uploadFormats": ["html", "json"]
  }
}
```

### Azure Blob Storage

```json
{
  "upload": {
    "enabled": true,
    "provider": "azure",
    "azure": {
      "accountName": "mystorageaccount",
      "accountKey": "YOUR_ACCOUNT_KEY",
      "containerName": "test-reports",
      "prefix": "reports/"
    },
    "uploadFormats": ["html", "json"]
  }
}
```

### HTTP Upload

```json
{
  "upload": {
    "enabled": true,
    "provider": "http",
    "http": {
      "endpoint": "https://your-server.com/upload",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    },
    "uploadFormats": ["html", "json"]
  }
}
```

## Environment Variables

All configuration options can be set via environment variables.

### General

- \`API_TEST_AGENT_REPORT_FORMATS\` - Comma-separated list of formats
- \`API_TEST_AGENT_REPORT_OUTPUT_DIR\` - Output directory
- \`API_TEST_AGENT_REPORT_FILENAME_PATTERN\` - Filename pattern

### HTML

- \`API_TEST_AGENT_HTML_THEME\` - \`light\`, \`dark\`, or \`auto\`
- \`API_TEST_AGENT_HTML_INCLUDE_CHARTS\` - \`true\` or \`false\`
- \`API_TEST_AGENT_HTML_TITLE\` - Report title

### JSON

- \`API_TEST_AGENT_JSON_PRETTY\` - \`true\` or \`false\`
- \`API_TEST_AGENT_JSON_INDENT\` - Number of spaces

### JUnit

- \`API_TEST_AGENT_JUNIT_SUITE_NAME\` - Test suite name

### Email

- \`API_TEST_AGENT_EMAIL_ENABLED\` - \`true\` or \`false\`
- \`API_TEST_AGENT_EMAIL_HOST\` - SMTP host
- \`API_TEST_AGENT_EMAIL_PORT\` - SMTP port
- \`API_TEST_AGENT_EMAIL_FROM\` - From address
- \`API_TEST_AGENT_EMAIL_RECIPIENTS\` - Comma-separated recipients
- \`API_TEST_AGENT_EMAIL_ONLY_ON_FAILURE\` - \`true\` or \`false\`

### Upload

- \`API_TEST_AGENT_UPLOAD_ENABLED\` - \`true\` or \`false\`
- \`API_TEST_AGENT_UPLOAD_PROVIDER\` - \`s3\`, \`gcs\`, \`azure\`, or \`http\`
- \`API_TEST_AGENT_S3_BUCKET\` - S3 bucket name
- \`API_TEST_AGENT_S3_REGION\` - S3 region
- \`API_TEST_AGENT_S3_ACCESS_KEY_ID\` - AWS access key
- \`API_TEST_AGENT_S3_SECRET_ACCESS_KEY\` - AWS secret key
- \`API_TEST_AGENT_S3_PREFIX\` - S3 key prefix

### Retention

- \`API_TEST_AGENT_REPORT_MAX_AGE\` - Maximum age in days
- \`API_TEST_AGENT_REPORT_MAX_COUNT\` - Maximum number of reports

## Examples

### Example 1: Basic Local Reporting

```json
{
  "formats": ["html", "json"],
  "outputDir": "./test-reports",
  "html": {
    "includeCharts": true,
    "theme": "light"
  },
  "json": {
    "pretty": true
  }
}
```

### Example 2: CI/CD with Email Notifications

```json
{
  "formats": ["junit", "html"],
  "outputDir": "./reports",
  "email": {
    "enabled": true,
    "host": "smtp.gmail.com",
    "port": 587,
    "auth": {
      "user": "ci@example.com",
      "pass": "app-password"
    },
    "from": "ci@example.com",
    "recipients": ["team@example.com"],
    "onlyOnFailure": true
  }
}
```

### Example 3: Full Featured with S3 Upload

```json
{
  "formats": ["html", "json", "junit"],
  "outputDir": "./reports",
  "html": {
    "includeCharts": true,
    "theme": "auto",
    "includeTimeline": true
  },
  "email": {
    "enabled": true,
    "host": "smtp.sendgrid.net",
    "port": 587,
    "auth": {
      "user": "apikey",
      "pass": "sendgrid-api-key"
    },
    "from": "reports@example.com",
    "recipients": ["team@example.com", "qa@example.com"],
    "attachFormats": ["html"]
  },
  "upload": {
    "enabled": true,
    "provider": "s3",
    "s3": {
      "bucket": "test-reports-bucket",
      "region": "us-east-1",
      "accessKeyId": "AWS_ACCESS_KEY",
      "secretAccessKey": "AWS_SECRET_KEY",
      "prefix": "qa-reports/"
    },
    "uploadFormats": ["html", "json", "junit"]
  },
  "retention": {
    "maxAge": 30,
    "maxReports": 100,
    "cleanupOnGenerate": true
  }
}
```

### Example 4: Custom Branding

```json
{
  "formats": ["html"],
  "html": {
    "title": "Acme Corp Test Results",
    "logo": "https://acme.com/logo.png",
    "theme": "dark",
    "customCss": "body { font-family: 'Roboto', sans-serif; }"
  }
}
```

### Example 5: Minimal for Quick Tests

```json
{
  "formats": ["html"],
  "outputDir": "./quick-reports"
}
```

## Best Practices

### 1. Use Environment Variables in CI/CD

```bash
# .env.ci
API_TEST_AGENT_REPORT_FORMATS=junit,html
API_TEST_AGENT_EMAIL_ENABLED=true
API_TEST_AGENT_EMAIL_ONLY_ON_FAILURE=true
API_TEST_AGENT_UPLOAD_ENABLED=true
```

### 2. Separate Configurations for Different Environments

```javascript
const config = process.env.CI
  ? loadConfig('reporting.ci.json')
  : loadConfig('reporting.local.json');
```

### 3. Use Compression for Large Reports

```json
{
  "compression": true,
  "upload": {
    "compression": true
  }
}
```

### 4. Optimize Performance with Parallel Generation

```json
{
  "parallel": true,
  "formats": ["html", "json", "junit"]
}
```

### 5. Implement Report Retention

```json
{
  "retention": {
    "maxAge": 30,
    "maxReports": 100,
    "cleanupOnGenerate": true,
    "archiveOldReports": true
  }
}
```

### 6. Use Templates for Consistent Emails

```json
{
  "email": {
    "template": "detailed",
    "includeScreenshots": true
  }
}
```

### 7. Secure Credentials

- Use environment variables for secrets
- Never commit credentials to version control
- Use cloud provider IAM roles when possible
- Rotate credentials regularly

### 8. Monitor Report Generation

```typescript
const result = await manager.generateAllReports(testResults);

if (!result.success) {
  console.error('Report generation failed:', result.errors);
  // Alert monitoring system
}
```

### 9. Customize for Your Team

```json
{
  "html": {
    "title": "Team Backend API Tests",
    "logo": "/assets/team-logo.png",
    "customCss": "@import url('https://fonts.googleapis.com/css?family=Inter');"
  }
}
```

### 10. Test Email Configuration

```typescript
import { EmailSender } from './src/reporting/email-sender';

const sender = new EmailSender(config.email);
await sender.testConnection(); // Verify SMTP settings
```

## Troubleshooting

### Reports Not Generated

**Problem**: No reports are created after tests run.

**Solutions**:
1. Check output directory permissions
2. Verify configuration is loaded correctly
3. Check for errors in console output
4. Ensure test results are being passed to report manager

```typescript
console.log('Config:', JSON.stringify(config, null, 2));
console.log('Test Results:', testResults);
```

### Email Not Sending

**Problem**: Email notifications are not being sent.

**Solutions**:
1. Verify SMTP credentials
2. Check \`enabled\` is \`true\`
3. Test connection:

```typescript
const sender = new EmailSender(config.email);
const result = await sender.testConnection();
console.log('Connection test:', result);
```

4. Check spam folder
5. Verify firewall/network allows SMTP
6. Use correct port (587 for TLS, 465 for SSL)

### Upload Failures

**Problem**: Reports fail to upload to cloud storage.

**Solutions**:
1. Verify credentials
2. Check bucket/container exists
3. Verify permissions
4. Check network connectivity
5. Test upload manually:

```typescript
const uploader = new StorageUploader(config.upload);
const result = await uploader.testConnection();
console.log('Upload test:', result);
```

### HTML Report Not Displaying Correctly

**Problem**: HTML report doesn't look right.

**Solutions**:
1. Check \`embedAssets\` is \`true\`
2. Verify chart library loaded correctly
3. Check browser console for JavaScript errors
4. Try different theme

### JSON Report Invalid

**Problem**: JSON report can't be parsed.

**Solutions**:
1. Enable \`pretty\` for debugging
2. Validate with online JSON validator
3. Check for special characters in test names
4. Verify complete write before reading

### Large Report Files

**Problem**: Report files are too large.

**Solutions**:
1. Enable compression
2. Exclude screenshots/videos:

```json
{
  "html": {
    "includeScreenshots": false,
    "includeVideos": false
  }
}
```

3. Use JSON instead of HTML for archiving
4. Implement report rotation

### Slow Report Generation

**Problem**: Reports take too long to generate.

**Solutions**:
1. Enable parallel generation
2. Reduce number of formats
3. Disable charts if not needed
4. Optimize test suite size

### Permission Errors

**Problem**: Can't write to output directory.

**Solutions**:
1. Check directory permissions
2. Create directory manually
3. Use absolute path
4. Verify user has write access

```bash
chmod 755 ./reports
```

### CI/CD Integration Issues

**Problem**: Reports not working in CI/CD pipeline.

**Solutions**:
1. Use environment variables
2. Save reports as artifacts
3. Verify paths are correct
4. Check CI/CD logs

```yaml
# GitHub Actions example
- name: Generate Reports
  run: npm run test
- uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: ./reports
```

### Custom CSS/JS Not Working

**Problem**: Custom styles or scripts not applied.

**Solutions**:
1. Verify CSS/JS syntax
2. Check for conflicts
3. Use browser dev tools to debug
4. Ensure \`embedAssets\` is \`true\`

## Support

For additional help:
- GitHub Issues: https://github.com/your-org/api-test-agent/issues
- Documentation: https://docs.example.com
- Email: support@example.com

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
