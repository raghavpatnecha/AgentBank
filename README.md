# AgentBank - AI-Powered API Test Agent

> **Automated API Testing with Self-Healing Capabilities**

Generate comprehensive Playwright test suites from OpenAPI/Swagger specifications with AI-powered self-healing, GitHub integration, and detailed reporting.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Latest-orange.svg)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Features

### ✨ Core Capabilities

- **🔍 OpenAPI Parser** - Full support for OpenAPI 3.0 and Swagger 2.0 specifications
- **🧪 Test Generator** - Automatic generation of comprehensive Playwright test suites
- **🤖 AI-Powered Test Generation** - GPT-4 generates intelligent tests that understand business logic, security, and workflows (optional)
- **🔧 AI-Powered Self-Healing** - Automatically repairs broken tests using GPT-4
- **🐳 Docker Test Isolation** - Run tests in isolated containers for security and consistency (FR-3.1)
- **⚡ Performance Testing** - Load, stress, spike, and endurance testing with detailed metrics
- **🔌 WebSocket Support** - Complete WebSocket testing capabilities for real-time APIs
- **📦 Test Data Management** - Sophisticated fixture management, entity factories, and database seeding
- **🔄 GitHub Integration** - Seamless CI/CD integration with GitHub Actions
- **📊 Advanced Reporting** - HTML, JSON, JUnit, CSV, and Markdown reports with detailed metrics
- **⚡ Parallel Execution** - Multi-worker test execution for optimal performance

### 🎯 Test Coverage

- ✅ **Happy Path Tests** - Successful API responses (2xx)
- ✅ **Authentication Tests** - Bearer, API Key, OAuth2, Basic Auth
- ✅ **Error Case Tests** - Client (4xx) and server (5xx) error scenarios
- ✅ **Edge Case Tests** - Boundary values, missing fields, invalid data
- ✅ **Workflow Tests** - Multi-step API flows with dependencies
- ✅ **Performance Tests** - Load testing, stress testing, spike testing, endurance testing
- ✅ **WebSocket Tests** - Connection, messaging, heartbeat, reconnection, authentication
- ✅ **AI-Generated Tests** - Intelligent tests for business logic, security vulnerabilities, and implicit requirements (optional, requires OpenAI API key)

---

## 📦 Installation

### Prerequisites

- **Node.js** 20 LTS or higher
- **npm** 9 or higher
- OpenAPI/Swagger specification file

### Quick Start

```bash
# Clone the repository
git clone https://github.com/raghavpatnecha/AgentBank.git
cd AgentBank

# Install dependencies
npm install

# Build the project
npm run build

# Verify installation
node dist/cli/index.js --help
```

---

## 🎯 Usage

### Basic Usage

Generate tests from your OpenAPI specification:

```bash
# Generate all test types
node dist/cli/index.js generate --spec ./api/openapi.yaml

# Generate to custom output directory
node dist/cli/index.js generate --spec ./api.yaml --output ./tests/api

# Generate with verbose output
node dist/cli/index.js generate --spec ./api.yaml --verbose
```

### Command Options

```bash
Usage: api-test-agent generate [options]

Options:
  -s, --spec <path>           Path to OpenAPI spec file (required)
  -o, --output <dir>          Output directory (default: "./tests/generated")
  -c, --config <path>         Path to config file (JSON or JS)
  --no-auth                   Skip authentication tests
  --no-errors                 Skip error case tests
  --no-edge-cases             Skip edge case tests
  --no-flows                  Skip workflow tests
  --ai-tests                  Force enable AI test generation
  --no-ai-tests               Disable AI test generation
  --performance               Generate performance/load tests
  --load-users <number>       Number of virtual users for load tests (default: 10)
  --duration <seconds>        Duration for performance tests (default: 60)
  --organization <strategy>   Organization strategy (default: "by-tag")
                              Options: by-tag, by-endpoint, by-type, by-method, flat
  --base-url <url>            Base URL for API (overrides spec servers)
  -v, --verbose               Verbose output

Note: AI-powered test generation is automatically enabled when OPENAI_API_KEY is set.
```

### 🤖 AI-Powered Test Generation

**Enabled by Default!** When you set `OPENAI_API_KEY`, AI-powered intelligent test generation runs automatically. This goes beyond schema validation to understand business logic, security vulnerabilities, and implicit requirements.

**Requirements:**
- OpenAI API key (set `OPENAI_API_KEY` environment variable)
- Optional: Set `OPENAI_MODEL` (defaults to `gpt-4`)

**Usage:**
```bash
# Set your OpenAI API key - AI tests will run automatically!
export OPENAI_API_KEY=sk-...

# Generate tests (AI automatically included)
node dist/cli/index.js generate --spec ./api.yaml

# Disable AI tests even with API key set
node dist/cli/index.js generate --spec ./api.yaml --no-ai-tests

# Force enable (will warn if no API key)
node dist/cli/index.js generate --spec ./api.yaml --ai-tests
```

**What AI Tests Provide:**
- **Business Logic Validation** - Tests that understand domain constraints and rules
- **Security Testing** - Identifies OWASP vulnerabilities and authorization issues
- **Workflow Analysis** - Tests multi-step flows and endpoint dependencies
- **Edge Case Discovery** - Finds implicit requirements and real-world scenarios
- **Context-Aware** - Analyzes related endpoints for comprehensive coverage

**AI Test Organization:**
- AI-generated tests are placed in `ai-tests/` subdirectory
- Each file is prefixed with `ai-` for easy identification
- Tests are marked as `experimental` stability
- Tagged with `ai-generated` for filtering

**Note:** AI test generation makes API calls to OpenAI and may incur costs. Tests are generated at 3 per endpoint by default.

### Advanced Examples

**Generate only happy path tests:**
```bash
node dist/cli/index.js generate \
  --spec ./api.yaml \
  --no-auth \
  --no-errors \
  --no-edge-cases
```

**Organize tests by endpoint:**
```bash
node dist/cli/index.js generate \
  --spec ./api.yaml \
  --organization by-endpoint
```

**Test against staging environment:**
```bash
node dist/cli/index.js generate \
  --spec ./api.yaml \
  --base-url https://staging-api.example.com
```

**Use configuration file:**
```bash
# Create config file
cat > api-test-agent.config.json << EOF
{
  "spec": "./api/openapi.yaml",
  "output": "./tests/generated",
  "includeAuth": true,
  "includeErrors": true,
  "includeEdgeCases": true,
  "includeFlows": true,
  "organizationStrategy": "by-tag",
  "baseUrl": "https://api.example.com"
}
EOF

# Generate with config
node dist/cli/index.js generate --config ./api-test-agent.config.json
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
API_BASE_URL=http://localhost:3000

# Worker Configuration
MAX_WORKERS=4
MIN_WORKERS=1
WORKER_MEMORY_LIMIT_MB=512
WORKER_TIMEOUT_MS=30000

# Retry Configuration
MAX_RETRIES=3
INITIAL_DELAY_MS=1000
MAX_DELAY_MS=30000
BACKOFF_MULTIPLIER=2

# OpenAI Configuration (for AI test generation and self-healing)
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional: defaults to gpt-4

# Test Configuration
WORKERS=4
GLOBAL_TIMEOUT_MS=600000
```

See `.env.example` for complete configuration options.

---

## 🏃 Running Tests

After generating tests, run them with Playwright:

```bash
# Run all generated tests
npx playwright test

# Run specific test file
npx playwright test tests/generated/users.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run in debug mode
npx playwright test --debug

# Run with specific number of workers
npx playwright test --workers=2

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

---

## 🤖 Self-Healing Features

The AI-powered self-healing agent automatically detects and repairs broken tests:

### How It Works

1. **Failure Detection** - Identifies test failures and analyzes patterns
2. **Spec Diff Analysis** - Compares API changes in OpenAPI spec
3. **AI Regeneration** - Uses GPT-4 to regenerate broken tests
4. **Validation** - Verifies repaired tests pass
5. **GitHub Integration** - Creates PR with fixes

### Enable Self-Healing

```env
# Add to .env file
OPENAI_API_KEY=your-openai-api-key
ENABLE_SELF_HEALING=true
```

---

## 🐙 GitHub Integration

### GitHub Actions Setup

1. **Add workflow file** to `.github/workflows/api-tests.yml`:

```yaml
name: API Tests

on:
  pull_request:
    paths:
      - 'api/**/*.yaml'
      - 'src/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate tests
        run: node dist/cli/index.js generate --spec ./api/openapi.yaml

      - name: Run tests
        run: npx playwright test

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: playwright-report/
```

2. **Configure secrets** in your GitHub repository:
   - `API_BASE_URL` - Your API endpoint
   - `OPENAI_API_KEY` - For self-healing (optional)

See `examples/github-workflow-complete.yml` for advanced configuration.

---

## 📊 Reports

The tool generates comprehensive reports in multiple formats:

### HTML Reports

```bash
# Reports are auto-generated after test runs
open playwright-report/index.html
```

### JSON Reports

```javascript
// Access structured test data
const results = require('./test-results.json');
console.log(results.summary);
```

### JUnit Reports

```xml
<!-- Compatible with CI/CD tools -->
<testsuite name="API Tests" tests="50" failures="2" errors="0">
  <!-- Test results -->
</testsuite>
```

---

## 🏗️ Project Structure

```
AgentBank/
├── src/
│   ├── ai/                  # Self-healing AI components
│   ├── cli/                 # Command-line interface
│   ├── config/              # Configuration management
│   ├── core/                # OpenAPI parser
│   ├── executor/            # Test execution engine
│   ├── generators/          # Test generators
│   ├── github/              # GitHub integration
│   ├── reporting/           # Report generation
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── fixtures/            # Test fixtures & sample specs
├── examples/                # Usage examples
├── docs/                    # Documentation
└── dist/                    # Compiled output
```

---

## 🛠️ Development

### Build Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
npm run test:unit
npm run test:integration

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Format code
npm run format
```

### Development Workflow

1. **Make changes** in `src/` directory
2. **Build** the project: `npm run build`
3. **Test** your changes: `npm test`
4. **Lint** your code: `npm run lint`
5. **Commit** with clear message

---

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Getting Started](GETTING_STARTED.md)** - Quick start guide
- **[GitHub Setup](docs/github-setup.md)** - GitHub integration guide
- **[CI/CD Setup](docs/ci-cd-setup.md)** - Continuous integration
- **[Docker Setup](docs/docker-setup.md)** - Containerization
- **[Reporting Configuration](docs/reporting-configuration.md)** - Report customization
- **[API Reference](docs/api-reference.md)** - API documentation

---

## 🎓 Examples

### Sample OpenAPI Specs

The project includes sample OpenAPI specifications for testing:

```bash
# Petstore API example
node dist/cli/index.js generate \
  --spec tests/fixtures/valid-openapi-3.0.yaml \
  --output ./tests/demo

# Run the generated tests
npx playwright test tests/demo/
```

### Demo Scripts

Check the `examples/` directory for:
- **demo-prompt-generation.ts** - AI prompt generation examples
- **healing-demo.ts** - Self-healing demonstration
- **html-reporter-demo.ts** - Report generation examples
- **github-workflow-complete.yml** - Full GitHub Actions workflow

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Current Test Stats

- **Total Tests:** 538 tests
- **Test Coverage:** 97.35% (Feature 1)
- **Test Suites:** 45 unit + 13 integration
- **All Tests:** ✅ Passing

---

## 🔧 Tech Stack

- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.3+
- **Testing Framework:** Playwright + Vitest
- **AI Integration:** OpenAI GPT-4
- **Build Tool:** TypeScript Compiler (tsc)
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

---

## 📋 Requirements

### System Requirements

- Node.js 20 LTS or higher
- npm 9 or higher
- 2GB RAM minimum (4GB recommended)
- 500MB disk space

### API Requirements

- OpenAPI 3.0 or Swagger 2.0 specification
- Accessible API endpoint
- Authentication credentials (if required)

---

## 🚧 Roadmap

### Completed ✅

- [x] OpenAPI 3.0 and Swagger 2.0 parser
- [x] Comprehensive test generation
- [x] Multi-worker test execution
- [x] AI-powered self-healing
- [x] GitHub Actions integration
- [x] HTML/JSON/JUnit reporting
- [x] Docker containerization
- [x] **Docker test isolation** - Run tests in isolated containers (FR-3.1)
- [x] **Performance testing** - Load, stress, spike, and endurance tests
- [x] **WebSocket testing** - Complete WebSocket support for real-time APIs
- [x] **Test data management** - Fixtures, entity factories, database seeding

### Planned 🎯

- [ ] GraphQL support
- [ ] gRPC API support
- [ ] Visual regression testing
- [ ] Advanced mock server
- [ ] Multi-environment orchestration improvements
- [ ] Contract testing (Pact.js integration)
- [ ] Mutation testing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Maintain test coverage above 90%
- Use ESLint and Prettier for formatting
- Write clear commit messages
- Add tests for new features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Playwright** - Modern test automation framework
- **OpenAI** - AI-powered test healing
- **OpenAPI Initiative** - API specification standard
- **TypeScript** - Type-safe development

---

## 📞 Support

### Get Help

- **Issues:** [GitHub Issues](https://github.com/raghavpatnecha/AgentBank/issues)
- **Discussions:** [GitHub Discussions](https://github.com/raghavpatnecha/AgentBank/discussions)
- **Documentation:** [Full Docs](docs/)

### Reporting Bugs

When reporting bugs, please include:
- Node.js and npm versions
- OpenAPI spec (sanitized if needed)
- Error messages and stack traces
- Steps to reproduce

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

<div align="center">

**Built with ❤️ using TypeScript, Playwright, and AI**

[Documentation](docs/) · [Examples](examples/) · [Report Bug](https://github.com/raghavpatnecha/AgentBank/issues) · [Request Feature](https://github.com/raghavpatnecha/AgentBank/issues)

</div>
