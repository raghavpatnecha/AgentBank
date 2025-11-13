# Performance Testing - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```bash
# Generate and run performance tests
npm run generate -- -s ./openapi.yaml --performance
npm run test:playwright
```

## 📋 Common Commands

```bash
# Basic (10 users, 60s)
npm run generate -- -s ./openapi.yaml --performance

# Heavy load (50 users, 5 minutes)
npm run generate -- -s ./openapi.yaml --performance --load-users=50 --duration=300

# Light smoke test (5 users, 30s)
npm run generate -- -s ./openapi.yaml --performance --load-users=5 --duration=30

# With all test types
npm run generate -- -s ./openapi.yaml --performance --auth --errors --edge-cases
```

## 🎯 Test Types Generated

| Type | Users | Duration | Pattern | Purpose |
|------|-------|----------|---------|---------|
| **Load** | 10 (1x) | 60s | Constant | Normal load testing |
| **Stress** | 50 (5x) | 120s | Ramp | Find breaking point |
| **Spike** | 100 (10x) | 120s | Spike | Sudden traffic |
| **Endurance** | 7 (0.7x) | 3600s | Constant | Memory leaks |

## 📊 Key Metrics

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **P95 Response Time** | <500ms | 500-1000ms | >1000ms |
| **Error Rate** | <0.5% | 0.5-1% | >1% |
| **Success Rate** | >99% | 95-99% | <95% |
| **Throughput** | Project-specific | - | - |

## 🔧 CLI Flags

```
--performance              Enable performance tests
--load-users=<N>          Number of virtual users (default: 10)
--duration=<seconds>      Test duration (default: 60)
-o, --output=<dir>        Output directory
-v, --verbose             Verbose output
```

## 📁 Output Files

```
tests/generated/
├── performance-load-*.spec.ts
├── performance-stress-*.spec.ts
├── performance-spike-*.spec.ts
└── performance-endurance-*.spec.ts

reports/performance/
├── report.html          # Interactive report
├── report.json          # Machine-readable
├── report.csv           # Spreadsheet
└── report.md            # Documentation
```

## 💻 Programmatic API

```typescript
// 1. Generate
const generator = new PerformanceTestGenerator({ defaultUsers: 20 });
const tests = generator.generateTests(endpoints);

// 2. Execute
const runner = new LoadTestRunner({ tests, baseURL: '...' });
const metrics = await runner.executeTests();

// 3. Report
const reporter = new PerformanceReporter();
const report = await reporter.generateReport(config, metrics);
await reporter.exportReport(report, { format: 'html', outputPath: '...' });
```

## 🎨 Load Patterns

```
CONSTANT: ████████████████  (steady)
RAMP:     ▁▂▃▄▅▆▇█████████  (gradual)
SPIKE:    ████▓▓▓▓████████  (sudden)
WAVE:     ▁▃▅▇█▇▅▃▁▃▅▇█▇▅  (oscillating)
STEP:     ▂▂▂▄▄▄▆▆▆████████  (stepped)
```

## ⚙️ Configuration File

```json
{
  "spec": "./openapi.yaml",
  "output": "./tests/perf",
  "includePerformance": true,
  "options": {
    "loadUsers": 20,
    "duration": 120
  }
}
```

## 🔍 Understanding Results

### Console Output
```
📊 Performance Test Results
═══════════════════════════════════════════════════════════
Total Requests:      1,234
Success Rate:        98.54%
P95 Response Time:   680ms
Throughput:          20.6 RPS
SLA Compliance:      ✓ PASS
═══════════════════════════════════════════════════════════
```

### What Each Metric Means

- **Total Requests**: Total API calls made
- **Success Rate**: % of successful responses
- **P95 Response Time**: 95% of requests faster than this
- **Throughput**: Requests per second
- **SLA Compliance**: All assertions passed

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| High error rate | Reduce users: `--load-users=5` |
| Tests timeout | Reduce duration: `--duration=30` |
| Inconsistent results | Run multiple times, average results |
| Memory issues | Reduce concurrent users |

## 📈 Best Practices

✅ **DO:**
- Start with 5-10 users
- Create baselines
- Run multiple times
- Test staging first
- Monitor resources
- Set clear SLAs

❌ **DON'T:**
- Test production
- Run on laptop
- Single test run
- Ignore failures
- Skip monitoring

## 🎯 Common Scenarios

### 1. Baseline Creation
```bash
npm run generate -- -s ./openapi.yaml --performance
npm run test:playwright -- tests/generated
cp reports/performance/report.json reports/performance/baseline.json
```

### 2. Regression Check
```bash
# Tests automatically compare with baseline.json
npm run test:playwright -- tests/generated
# Check: SLA Compliance and comparison results
```

### 3. Pre-Production Validation
```bash
# Heavy load test
npm run generate -- -s ./openapi.yaml --performance --load-users=100 --duration=300
npm run test:playwright
```

### 4. CI/CD Integration
```yaml
- run: npm run generate -- -s ./openapi.yaml --performance
- run: npm run test:playwright
- name: Check SLA
  run: |
    if grep -q '"slaCompliance":false' reports/performance/report.json; then
      exit 1
    fi
```

## 📚 More Information

- **Full Docs**: `/docs/performance-testing.md`
- **Quick Start**: `/docs/PERFORMANCE_TESTING_USAGE.md`
- **Examples**: `/examples/*.ts`
- **Summary**: `/PERFORMANCE_TESTING_SUMMARY.md`

## 🆘 Support

Issues? Check:
1. Verbose output: `--verbose`
2. Reduce load: `--load-users=5`
3. Check API status
4. Review logs
5. See troubleshooting guide

## ⚡ Pro Tips

1. **Warm-up**: Always include ramp-up time
2. **Think time**: Use realistic delays (1-5s)
3. **Sessions**: Enable for stateful APIs
4. **Baselines**: Update monthly
5. **Trends**: Track metrics over time
6. **SLAs**: Start lenient, tighten gradually

---

**Quick Help**: `npm run generate -- --help`
