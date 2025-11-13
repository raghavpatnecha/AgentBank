# Performance Testing - Quick Start Guide

## Installation

No additional installation required - performance testing is built into AgentBank!

## Basic Usage

### 1. Generate Performance Tests from CLI

```bash
# Basic performance test generation (10 users, 60 seconds)
npm run generate -- -s ./openapi.yaml --performance

# Custom user count and duration
npm run generate -- -s ./openapi.yaml --performance --load-users=50 --duration=300

# Generate all test types including performance
npm run generate -- -s ./openapi.yaml --performance --auth --errors --edge-cases
```

### 2. Review Generated Tests

Performance tests are generated in the output directory (default: `./tests/generated`):

```
tests/generated/
├── performance-load-get-pets.spec.ts
├── performance-stress-get-pets.spec.ts
├── performance-spike-get-pets.spec.ts
└── performance-endurance-get-pets.spec.ts
```

### 3. Run Performance Tests

```bash
# Run all generated tests
npm run test:playwright

# Run only performance tests
npm run test:playwright -- --grep "performance"

# Run with specific workers
npm run test:playwright -- --workers=4
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--performance` | Enable performance test generation | `false` |
| `--load-users=<N>` | Number of virtual users | `10` |
| `--duration=<seconds>` | Test duration in seconds | `60` |

## Examples

### Example 1: Light Load Test

Test with minimal load for quick validation:

```bash
npm run generate -- \
  -s ./openapi.yaml \
  --performance \
  --load-users=5 \
  --duration=30 \
  -o ./tests/perf
```

**When to use:**
- During development
- Quick smoke tests
- Testing single endpoints

### Example 2: Standard Load Test

Simulate typical production load:

```bash
npm run generate -- \
  -s ./openapi.yaml \
  --performance \
  --load-users=50 \
  --duration=300 \
  -o ./tests/perf
```

**When to use:**
- Regular performance testing
- CI/CD pipelines
- Baseline creation

### Example 3: Stress Test

Find the breaking point of your API:

```bash
npm run generate -- \
  -s ./openapi.yaml \
  --performance \
  --load-users=200 \
  --duration=600 \
  -o ./tests/stress
```

**When to use:**
- Capacity planning
- Finding system limits
- Pre-production validation

### Example 4: Endurance Test

Test stability over long periods:

```bash
npm run generate -- \
  -s ./openapi.yaml \
  --performance \
  --load-users=30 \
  --duration=3600 \
  -o ./tests/endurance
```

**When to use:**
- Finding memory leaks
- Testing stability
- Production readiness

## Understanding the Output

### Console Output

```
🚀 Starting load test with 4 test(s)

📊 Running: Load test: GET /api/users
   Users: 10, Duration: 60s
   ✓ Completed in 60.1s

📊 Performance Test Results
═══════════════════════════════════════════════════════════
Total Requests:      1,234
Success Rate:        98.54%
Error Rate:          1.46%
───────────────────────────────────────────────────────────
Avg Response Time:   245ms
P95 Response Time:   680ms
P99 Response Time:   1250ms
───────────────────────────────────────────────────────────
Throughput:          20.6 RPS
Peak Concurrent:     10 users
───────────────────────────────────────────────────────────
SLA Compliance:      ✓ PASS
═══════════════════════════════════════════════════════════
```

### HTML Report

Open `./reports/performance/report.html` in a browser:

- **Summary Dashboard**: Key metrics at a glance
- **Response Time Stats**: Min, max, percentiles
- **Performance Assertions**: SLA compliance
- **Time Series**: Performance over time
- **Endpoint Breakdown**: Per-endpoint metrics

### JSON Report

Machine-readable format at `./reports/performance/report.json`:

```json
{
  "version": "1.0.0",
  "summary": {
    "totalRequests": 1234,
    "successRate": 0.9854,
    "avgThroughput": 20.6,
    "avgResponseTime": 245,
    "slaCompliance": true
  },
  "metrics": {
    "responseTime": {
      "mean": 245,
      "p95": 680,
      "p99": 1250
    },
    "throughput": 20.6,
    "errorRate": 0.0146
  }
}
```

## Common Scenarios

### Scenario 1: Baseline Creation

Create a performance baseline for future comparisons:

```bash
# 1. Generate and run tests
npm run generate -- -s ./openapi.yaml --performance -o ./tests/perf

# 2. Run tests
npm run test:playwright -- tests/perf

# 3. Save baseline
cp ./reports/performance/report.json ./reports/performance/baseline.json
```

### Scenario 2: Regression Testing

Test for performance regressions:

```bash
# Run tests
npm run test:playwright -- tests/perf

# The runner will automatically compare with baseline.json if present
# Check for regressions in the report
```

### Scenario 3: CI/CD Integration

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
  schedule:
    - cron: '0 2 * * *'

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run generate -- -s ./openapi.yaml --performance
      - run: npm run test:playwright -- tests/generated

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: reports/performance/
```

### Scenario 4: Multi-endpoint Testing

Test multiple endpoints with different load profiles:

```bash
# Generate tests for all endpoints
npm run generate -- -s ./openapi.yaml --performance

# This generates:
# - Load tests for all endpoints
# - Stress tests for critical endpoints
# - Spike tests for high-traffic endpoints
# - Endurance tests for background services
```

## Interpreting Results

### Response Time Metrics

| Metric | What it means | Good value |
|--------|---------------|------------|
| **Mean** | Average response time | < 500ms |
| **Median (p50)** | 50% of requests faster than this | < 300ms |
| **p95** | 95% of requests faster than this | < 1000ms |
| **p99** | 99% of requests faster than this | < 2000ms |

### Throughput Metrics

| Metric | What it means | Notes |
|--------|---------------|-------|
| **RPS** | Requests per second | Higher is better |
| **Peak Users** | Maximum concurrent users | Should match test config |

### Error Metrics

| Metric | What it means | Acceptable |
|--------|---------------|------------|
| **Error Rate** | Percentage of failed requests | < 1% |
| **Success Rate** | Percentage of successful requests | > 99% |

## Troubleshooting

### Problem: High error rates

**Possible causes:**
- API not available
- Rate limiting
- Authentication issues
- Network problems

**Solutions:**
```bash
# Reduce concurrent users
npm run generate -- -s ./openapi.yaml --performance --load-users=5

# Increase timeout
# Edit playwright.config.ts:
timeout: 60000, // 60 seconds
```

### Problem: Tests timeout

**Possible causes:**
- API too slow
- Network latency
- Resource constraints

**Solutions:**
```bash
# Reduce test duration
npm run generate -- -s ./openapi.yaml --performance --duration=30

# Reduce concurrent users
npm run generate -- -s ./openapi.yaml --performance --load-users=5
```

### Problem: Inconsistent results

**Possible causes:**
- Network instability
- API caching
- Background processes

**Solutions:**
- Run tests multiple times
- Test at consistent times
- Use dedicated test environment
- Monitor system resources

## Best Practices

### ✅ DO

- **Start small**: Begin with 5-10 users
- **Create baselines**: Save initial results for comparison
- **Test regularly**: Schedule daily or weekly tests
- **Monitor trends**: Track metrics over time
- **Test realistically**: Match production patterns
- **Use assertions**: Define clear SLA requirements

### ❌ DON'T

- **Don't test production**: Use staging or test environments
- **Don't run in dev**: Your laptop isn't a server
- **Don't ignore errors**: Investigate all failures
- **Don't test once**: Multiple runs give better data
- **Don't forget resources**: Monitor CPU/memory
- **Don't skip warm-up**: Allow systems to stabilize

## Advanced Usage

See `/examples` directory for advanced scenarios:

- `performance-testing-example.ts` - Complete example
- `advanced-performance-scenarios.ts` - Advanced patterns

See full documentation: `/docs/performance-testing.md`

## Support

For issues, questions, or contributions:
- GitHub Issues: [Your repo URL]
- Documentation: `/docs/performance-testing.md`

## Next Steps

1. ✅ Generate your first performance tests
2. ✅ Run tests and review results
3. ✅ Create a baseline
4. ✅ Integrate into CI/CD
5. ✅ Monitor and optimize

Happy performance testing! 🚀
