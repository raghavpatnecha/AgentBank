# CLI Usage Guide

Complete guide for using the `api-test-agent` command-line interface.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Options](#options)
- [Configuration File](#configuration-file)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Installation

### Global Installation

```bash
npm install -g api-test-agent
```

### Local Installation

```bash
npm install --save-dev api-test-agent
```

### Using npx (No Installation Required)

```bash
npx api-test-agent generate --spec ./openapi.yaml
```

## Quick Start

Generate tests from an OpenAPI specification:

```bash
api-test-agent generate --spec ./openapi.yaml
```

This will:
1. Parse your OpenAPI specification
2. Generate Playwright API tests
3. Save tests to `./tests/generated` directory
4. Display generation statistics

## Commands

### `generate`

Generate Playwright API tests from an OpenAPI specification.

```bash
api-test-agent generate [options]
```

## Options

### Required Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--spec <path>` | `-s` | Path to OpenAPI specification file (YAML or JSON) |

### Output Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output <dir>` | `-o` | Output directory for generated tests | `./tests/generated` |

### Configuration Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Path to configuration file (JSON or JS) |

### Test Type Options

| Option | Description | Default |
|--------|-------------|---------|
| `--no-auth` | Skip authentication tests | `false` (auth tests included) |
| `--no-errors` | Skip error case tests | `false` (error tests included) |
| `--no-edge-cases` | Skip edge case tests | `false` (edge case tests included) |
| `--no-flows` | Skip workflow tests | `false` (workflow tests included) |

### Organization Options

| Option | Description | Default |
|--------|-------------|---------|
| `--organization <strategy>` | Test organization strategy (see below) | `by-tag` |

**Organization Strategies:**
- `by-tag` - Organize tests by OpenAPI tags
- `by-endpoint` - One file per endpoint
- `by-type` - One file per test type (happy, error, edge, etc.)
- `by-method` - Organize by HTTP method (GET, POST, etc.)
- `flat` - All tests in one directory

### Other Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--base-url <url>` | | Override API base URL from spec | (uses spec servers) |
| `--verbose` | `-v` | Verbose output | `false` |

## Configuration File

Create a configuration file to avoid repeating command-line options.

### JSON Configuration

**api-test-agent.config.json:**

```json
{
  "spec": "./openapi.yaml",
  "output": "./tests/generated",
  "includeAuth": true,
  "includeErrors": true,
  "includeEdgeCases": true,
  "includeFlows": true,
  "organizationStrategy": "by-tag",
  "baseUrl": "https://api.example.com",
  "options": {
    "useFixtures": true,
    "useHooks": true,
    "verbose": false
  }
}
```

### JavaScript Configuration

**api-test-agent.config.js:**

```javascript
export default {
  spec: './openapi.yaml',
  output: './tests/generated',
  includeAuth: true,
  includeErrors: true,
  includeEdgeCases: true,
  includeFlows: true,
  organizationStrategy: 'by-tag',
  baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  options: {
    useFixtures: true,
    useHooks: true,
    verbose: false,
  },
};
```

### Using Configuration File

```bash
# Use default config file (api-test-agent.config.json)
api-test-agent generate

# Use specific config file
api-test-agent generate --config ./my-config.json

# Override config file options with CLI flags
api-test-agent generate --config ./my-config.json --no-auth --verbose
```

## Examples

### Basic Usage

```bash
# Generate tests from OpenAPI spec
api-test-agent generate --spec ./openapi.yaml
```

### Custom Output Directory

```bash
api-test-agent generate \\
  --spec ./openapi.yaml \\
  --output ./tests/api
```

### Organize by Endpoint

```bash
api-test-agent generate \\
  --spec ./openapi.yaml \\
  --organization by-endpoint
```

### Skip Certain Test Types

```bash
# Skip authentication and workflow tests
api-test-agent generate \\
  --spec ./openapi.yaml \\
  --no-auth \\
  --no-flows
```

### Override Base URL

```bash
api-test-agent generate \\
  --spec ./openapi.yaml \\
  --base-url https://staging.api.example.com
```

### Verbose Output

```bash
api-test-agent generate \\
  --spec ./openapi.yaml \\
  --verbose
```

### Complete Example

```bash
api-test-agent generate \\
  --spec ./petstore.yaml \\
  --output ./tests/api \\
  --organization by-tag \\
  --base-url https://petstore.swagger.io/v2 \\
  --no-edge-cases \\
  --verbose
```

### Using Config File

```bash
# Create config file first
cat > api-test-agent.config.json <<EOF
{
  "spec": "./petstore.yaml",
  "output": "./tests/api",
  "includeAuth": true,
  "includeErrors": true,
  "includeEdgeCases": false,
  "includeFlows": true,
  "organizationStrategy": "by-tag",
  "baseUrl": "https://petstore.swagger.io/v2"
}
EOF

# Generate with config
api-test-agent generate --config ./api-test-agent.config.json
```

## Output

After generation, you'll see output like:

```
⚡ Parsing OpenAPI specification...
✓ Parsed: Petstore API v1.0.0
✓ Found 12 endpoints

⚡ Generating tests...
✓ Generated 65 tests in 4 files

⚡ Writing test files to ./tests/generated...
✓ Wrote 4 test files to ./tests/generated

──────────────────────────────────────────────────
📊 Generation Summary
──────────────────────────────────────────────────
  Total endpoints:     12
  Total tests:         65
  Test breakdown:
    - Happy Path: 12
    - Error Case: 24
    - Edge Case: 18
    - Auth: 8
    - Flow: 3
  Files generated:     4
  Lines of code:       1,842
  Generation time:     2.45s
──────────────────────────────────────────────────

ℹ Next steps:
  1. Review generated tests
  2. Add authentication credentials to .env file
  3. Run tests with: npm run test:playwright
```

## Generated Test Structure

### By Tag (Default)

```
tests/generated/
├── pet-tests.spec.ts       # Tests for 'pet' tag
├── store-tests.spec.ts     # Tests for 'store' tag
├── user-tests.spec.ts      # Tests for 'user' tag
└── auth-tests.spec.ts      # Authentication tests
```

### By Endpoint

```
tests/generated/
├── get-pets.spec.ts
├── post-pets.spec.ts
├── get-pets-id.spec.ts
├── put-pets-id.spec.ts
└── delete-pets-id.spec.ts
```

### By Type

```
tests/generated/
├── happy-path.spec.ts
├── error-case.spec.ts
├── edge-case.spec.ts
├── auth.spec.ts
└── flow.spec.ts
```

### By Method

```
tests/generated/
├── get-tests.spec.ts
├── post-tests.spec.ts
├── put-tests.spec.ts
├── patch-tests.spec.ts
└── delete-tests.spec.ts
```

## Best Practices

### 1. Use Version Control

Always commit your OpenAPI specification and configuration file:

```bash
git add openapi.yaml api-test-agent.config.json
git commit -m "Add API spec and test generator config"
```

### 2. Exclude Generated Tests

Add generated tests to `.gitignore`:

```gitignore
# Generated tests (regenerate as needed)
tests/generated/
```

Or commit them for reference:

```bash
git add tests/generated/
git commit -m "Add generated API tests"
```

### 3. Environment Variables

Store credentials in `.env` file:

```env
API_BASE_URL=https://api.example.com
API_KEY=your-api-key-here
BEARER_TOKEN=your-bearer-token-here
```

### 4. CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/tests.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:playwright
```

### 5. Update Tests Regularly

Regenerate tests when your API changes:

```bash
# After updating openapi.yaml
api-test-agent generate --spec ./openapi.yaml

# Review changes
git diff tests/generated/

# Commit if appropriate
git add tests/generated/
git commit -m "Update generated tests for API v2.1"
```

### 6. Customize Generated Tests

While generated tests are comprehensive, you may want to:

1. Add custom test data
2. Add test-specific setup/teardown
3. Add assertions for business logic
4. Extend tests with edge cases specific to your domain

Create a separate directory for custom tests:

```
tests/
├── generated/          # Auto-generated tests
├── custom/            # Hand-written custom tests
└── fixtures/          # Shared test fixtures
```

## Troubleshooting

### "Failed to parse OpenAPI spec"

- Verify your OpenAPI file is valid YAML/JSON
- Check for syntax errors
- Validate your spec at https://editor.swagger.io/

### "No endpoints found"

- Ensure your spec has a `paths` section
- Check that operations have HTTP methods defined

### "Permission denied" Error

- Ensure output directory is writable
- Check file permissions: `chmod +w tests/generated`

### TypeScript Errors in Generated Tests

- Run `npm run build` to compile TypeScript
- Check that `@playwright/test` is installed
- Verify tsconfig.json includes the output directory

## Getting Help

```bash
# Show help
api-test-agent --help

# Show command help
api-test-agent generate --help

# Show version
api-test-agent --version
```

## Related Documentation

- [OpenAPI Parser Documentation](./openapi-parser.md)
- [Test Generator Documentation](./test-generator.md)
- [API Reference](./api-reference.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Support

- GitHub Issues: https://github.com/your-repo/api-test-agent/issues
- Documentation: https://github.com/your-repo/api-test-agent/docs
- Examples: https://github.com/your-repo/api-test-agent/examples
