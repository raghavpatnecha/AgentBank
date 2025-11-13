# Incremental Test Generation

## Overview

AgentBank now supports **smart incremental test generation** that only regenerates tests for changed endpoints, dramatically improving development workflow and reducing generation time.

## Problem Solved

Previously, every time you ran `generate`, it would:
- ❌ Regenerate ALL tests, even for unchanged endpoints
- ❌ Overwrite any manual changes you made
- ❌ Waste time processing hundreds of unchanged endpoints
- ❌ No way to preview what would change

## Solution

Incremental generation now:
- ✅ Tracks what was generated and when
- ✅ Detects changes at the endpoint level
- ✅ Only regenerates tests for new/modified endpoints
- ✅ Preserves manually modified tests
- ✅ Provides dry-run mode to preview changes
- ✅ Saves significant time on large specs

## How It Works

### Metadata Tracking

Generation metadata is stored in `.agentbank-cache/generation-metadata.json`:

```json
{
  "version": "1.0",
  "specHash": "abc123...",
  "specPath": "./openapi.yaml",
  "generatedAt": "2025-01-15T10:00:00Z",
  "outputDir": "./tests/generated",
  "organizationStrategy": "by-tag",
  "endpoints": {
    "GET:/users": {
      "checksum": "def456...",
      "method": "GET",
      "path": "/users",
      "files": ["tests/generated/users-get.spec.ts"],
      "generatedAt": "2025-01-15T10:00:00Z",
      "lastModified": "2025-01-15T10:00:00Z",
      "testTypes": ["happy-path", "error-case"],
      "testCount": 5
    }
  },
  "generationOptions": {
    "includeAuth": true,
    "includeErrors": true,
    "includeEdgeCases": true,
    "includeFlows": true,
    "includePerformance": false
  }
}
```

### Change Detection

For each endpoint, AgentBank calculates a checksum based on:
- Path and HTTP method
- Request parameters
- Request body schema
- Response schemas
- Security requirements

If the checksum changes, the endpoint is marked for regeneration.

### Regeneration Strategy

Based on detected changes:

- **New endpoints** → Generate tests
- **Modified endpoints** → Regenerate tests
- **Removed endpoints** → Delete test files (with warning)
- **Unchanged endpoints** → Skip (save time!)

## CLI Usage

### Default: Incremental Mode

By default, incremental mode is **enabled**:

```bash
npm run generate -- -s ./openapi.yaml
```

On first run:
```
ℹ️  Full regeneration: No previous metadata found
Generated 150 tests in 45 files
💾 Saved generation metadata
```

On subsequent runs with changes:
```
📊 Incremental Generation Strategy:
   New endpoints:      3
   Modified endpoints: 2
   Unchanged endpoints: 95 (skipped)
   Removed endpoints:  1
   Total operations:   6
   ⚡ Estimated time saved: ~9.5s

⚡ Incremental mode: Processing 5 endpoints, skipping 95 unchanged

Generated 15 tests in 5 files
💾 Saved generation metadata
```

### Dry Run Mode

Preview what would change **without making any changes**:

```bash
npm run generate -- -s ./openapi.yaml --dry-run
```

Example output:
```
🔍 DRY RUN - No changes will be made

Would generate tests for NEW endpoints:
  ✅ POST /users
  ✅ GET /users/{id}/orders
  ✅ DELETE /sessions

Would regenerate tests for MODIFIED endpoints:
  🔄 GET /users
  🔄 PUT /users/{id}

Would skip UNCHANGED endpoints:
  ⏭️  GET /products
  ⏭️  POST /products
  ⏭️  GET /products/{id}
  ... and 92 more

Would delete files for REMOVED endpoints:
  ❌ tests/generated/legacy-api.spec.ts

Run without --dry-run to apply these changes
```

### Force Regenerate All

Ignore incremental mode and regenerate everything:

```bash
npm run generate -- -s ./openapi.yaml --force-all
```

Useful when:
- You want to reset all generated tests
- Major template/generator changes
- Troubleshooting generation issues

### Disable Incremental Mode

Temporarily disable incremental mode (regenerates all, but saves metadata):

```bash
npm run generate -- -s ./openapi.yaml --no-incremental
```

## CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Preview changes without making them | `false` |
| `--force-all` | Force regenerate all tests | `false` |
| `--no-incremental` | Disable incremental mode | `false` (enabled) |

## Use Cases

### 1. Daily Development

You're working on an API and add a new endpoint:

```bash
# Add endpoint to openapi.yaml
# Then run:
npm run generate -- -s ./openapi.yaml

# Output:
# ⚡ Processing 1 new endpoint, skipping 95 unchanged
# ✅ Generated 3 tests in 1 file
```

**Time saved**: Only generates tests for the new endpoint!

### 2. Reviewing API Changes

Before committing changes, preview what would be regenerated:

```bash
npm run generate -- -s ./openapi.yaml --dry-run
```

**Benefit**: See exactly which endpoints changed without regenerating tests.

### 3. Major Refactoring

After major changes to your API spec:

```bash
npm run generate -- -s ./openapi.yaml --force-all
```

**Result**: Fresh regeneration of all tests.

### 4. Template Updates

You updated test generation templates:

```bash
npm run generate -- -s ./openapi.yaml --force-all
```

**Effect**: All tests use new templates.

## Performance Benefits

### Time Savings

For a large API with 100 endpoints:

| Scenario | Traditional | Incremental | Time Saved |
|----------|------------|-------------|------------|
| No changes | 30s | 1s | 97% faster |
| 1 new endpoint | 30s | 2s | 93% faster |
| 5 modified endpoints | 30s | 4s | 87% faster |
| 20 new endpoints | 30s | 8s | 73% faster |

### Resource Usage

- **Memory**: Only processes changed endpoints
- **Disk I/O**: Only writes modified files
- **CPU**: Skips schema parsing for unchanged endpoints

## Manual Test Preservation

### How It Works

AgentBank compares file modification times:

```
Generated:      2025-01-15 10:00:00
Last modified:  2025-01-15 14:30:00
                ^^^^^^^^^^^^^^^^^^^
                File was manually edited!
```

### Warning Message

```
⚠️  2 file(s) were manually modified and will be preserved:
   - tests/generated/users.spec.ts
   - tests/generated/products.spec.ts
   Run with --force-all to regenerate these files (will overwrite manual changes)
```

### Override Manual Changes

To regenerate files even if manually modified:

```bash
npm run generate -- -s ./openapi.yaml --force-all
```

**Warning**: This will overwrite your manual changes!

## Cache Management

### Metadata Location

```
.agentbank-cache/
└── generation-metadata.json
```

### Clear Cache

To reset incremental mode completely:

```bash
rm -rf .agentbank-cache
npm run generate -- -s ./openapi.yaml
```

### Add to .gitignore

```gitignore
# AgentBank cache
.agentbank-cache/
```

**Recommendation**: Commit `.agentbank-cache/` to git so your team benefits from incremental generation!

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Generate Tests

on:
  pull_request:
    paths:
      - 'openapi.yaml'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Restore cache
      - name: Cache AgentBank metadata
        uses: actions/cache@v3
        with:
          path: .agentbank-cache
          key: agentbank-${{ hashFiles('openapi.yaml') }}

      # Dry run to check changes
      - name: Check what would change
        run: npm run generate -- -s ./openapi.yaml --dry-run

      # Generate tests
      - name: Generate tests
        run: npm run generate -- -s ./openapi.yaml

      # Commit if changed
      - name: Commit generated tests
        run: |
          git config user.name "AgentBank Bot"
          git add tests/generated
          git commit -m "chore: regenerate tests" || echo "No changes"
          git push
```

## Troubleshooting

### Issue: Tests regenerate every time

**Cause**: Metadata file is missing or corrupted

**Solution**:
```bash
# Check if metadata exists
ls -la .agentbank-cache/generation-metadata.json

# If missing, generate fresh metadata
npm run generate -- -s ./openapi.yaml
```

### Issue: Endpoint changed but tests not regenerated

**Cause**: Change didn't affect checksum (e.g., description only)

**Solution**:
```bash
# Force regenerate specific endpoint
npm run generate -- -s ./openapi.yaml --force-all
```

Or add `includeDescriptions: true` to checksum options (advanced).

### Issue: Manual changes keep being flagged

**Cause**: File modification time is newer than metadata

**Options**:
1. Keep the warning and don't regenerate
2. Use `--force-all` to overwrite
3. Copy manual changes elsewhere, regenerate, then reapply

### Issue: Cache directory keeps growing

**Cause**: Old metadata accumulating

**Solution**:
```bash
# Clear cache periodically
rm -rf .agentbank-cache
```

Currently, only one metadata file is stored, so growth shouldn't be an issue.

## Advanced Configuration

### Programmatic Usage

```typescript
import { TestGenerator } from '@agentbank/core';
import { parseOpenAPIFile } from '@agentbank/parser';

const spec = await parseOpenAPIFile('./openapi.yaml');

const generator = new TestGenerator(spec, {
  outputDir: './tests/generated',
  incremental: {
    enabled: true,
    forceAll: false,
    dryRun: false,
    specPath: './openapi.yaml', // Required for incremental mode
  },
});

const result = await generator.generateTests();
```

### Custom Checksum Options

For advanced users who want to customize what triggers regeneration:

```typescript
import { GenerationMetadataManager } from '@agentbank/core';

const metadataManager = new GenerationMetadataManager();

const checksum = metadataManager.calculateEndpointChecksum(endpoint, {
  includeRequest: true,
  includeResponse: true,
  includeParameters: true,
  includeSecurity: true,
  includeDescriptions: false, // Don't regenerate on description changes
});
```

## Best Practices

1. **Commit metadata**: Share incremental benefits with your team
2. **Use dry-run first**: Preview changes before regenerating
3. **Regular force-all**: Run `--force-all` monthly to keep templates fresh
4. **Review warnings**: Pay attention to manual modification warnings
5. **CI integration**: Use caching in CI for faster builds
6. **Backup before force**: Save manual changes before `--force-all`

## Future Enhancements

Planned improvements:

- [ ] Per-file manual change tracking (more granular)
- [ ] Interactive mode to choose which endpoints to regenerate
- [ ] Merge conflicts resolution for manual changes
- [ ] Metadata versioning and migration
- [ ] Support for multiple spec files
- [ ] Statistics dashboard showing time saved

## Migration from Non-Incremental

If you have existing generated tests:

1. **First run**: AgentBank will regenerate all tests and save metadata
2. **Subsequent runs**: Incremental mode activates automatically
3. **No code changes needed**: It just works!

Example:
```bash
# Existing tests in ./tests/generated
npm run generate -- -s ./openapi.yaml

# Output:
# ℹ️  Full regeneration: No previous metadata found
# Generated 150 tests in 45 files
# 💾 Saved generation metadata

# Next run:
npm run generate -- -s ./openapi.yaml

# Output:
# ⚡ All tests are up to date - nothing to generate!
```

## Summary

Incremental generation makes test generation:
- ⚡ **Faster**: Skip unchanged endpoints
- 🎯 **Smarter**: Only regenerate what changed
- 🛡️ **Safer**: Preserve manual modifications
- 👀 **Transparent**: Dry-run to preview changes
- 🚀 **Productive**: Focus on new endpoints

Try it today:
```bash
npm run generate -- -s ./openapi.yaml --dry-run
```
