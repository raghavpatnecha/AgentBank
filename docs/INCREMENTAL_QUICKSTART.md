# Incremental Generation - Quick Start

## 🚀 Getting Started (30 seconds)

### 1. First Generation

```bash
npm run generate -- -s ./openapi.yaml
```

**Output:**
```
ℹ️  Full regeneration: No previous metadata found
Generated 150 tests in 45 files
💾 Saved generation metadata to .agentbank-cache/generation-metadata.json
```

### 2. Modify Your API

Edit `openapi.yaml`:
- Add a new endpoint: `POST /users`
- Modify existing: `GET /users` (change response schema)
- Remove old endpoint: `DELETE /legacy-api`

### 3. Regenerate (Incremental)

```bash
npm run generate -- -s ./openapi.yaml
```

**Output:**
```
📊 Incremental Generation Strategy:
   New endpoints:      1
   Modified endpoints: 1
   Unchanged endpoints: 148 (skipped)
   Removed endpoints:  1
   Total operations:   3
   ⚡ Estimated time saved: ~14.8s

⚡ Incremental mode: Processing 2 endpoints, skipping 148 unchanged

Generated 6 tests in 2 files
💾 Saved generation metadata
```

**Result**: Only 2 files regenerated instead of all 45! ⚡

## 📋 Quick Reference

| Command | What It Does |
|---------|--------------|
| `npm run generate -- -s spec.yaml` | Default: Incremental mode |
| `npm run generate -- -s spec.yaml --dry-run` | Preview changes without regenerating |
| `npm run generate -- -s spec.yaml --force-all` | Regenerate everything |
| `npm run generate -- -s spec.yaml --no-incremental` | Disable incremental mode |

## 🎯 Common Workflows

### Preview Before Regenerating

```bash
# See what changed
npm run generate -- -s ./openapi.yaml --dry-run

# Apply changes
npm run generate -- -s ./openapi.yaml
```

### After Major Template Changes

```bash
# Force regenerate all tests with new templates
npm run generate -- -s ./openapi.yaml --force-all
```

### Reset Everything

```bash
# Clear cache and start fresh
rm -rf .agentbank-cache
npm run generate -- -s ./openapi.yaml
```

## ⚠️ Important Notes

1. **Metadata is saved** in `.agentbank-cache/generation-metadata.json`
2. **Manual changes are detected** - You'll get warnings
3. **Dry-run is your friend** - Always safe to use
4. **Force-all when needed** - Use for template updates

## 💡 Pro Tips

1. **Add to Git**: Commit `.agentbank-cache/` to share incremental benefits with your team
2. **Dry-run first**: Always run `--dry-run` to preview changes
3. **Watch for warnings**: Pay attention to manual modification warnings
4. **CI/CD ready**: Works great in automated pipelines

## 🐛 Troubleshooting

**Q: Tests regenerate every time**
```bash
# Check if metadata exists
ls -la .agentbank-cache/

# If missing, first run creates it
npm run generate -- -s ./openapi.yaml
```

**Q: Need to regenerate everything**
```bash
npm run generate -- -s ./openapi.yaml --force-all
```

**Q: Want to see what changed**
```bash
npm run generate -- -s ./openapi.yaml --dry-run
```

## 📖 Full Documentation

See [incremental-generation.md](./incremental-generation.md) for complete details.

## 🎉 That's It!

You're now using smart incremental generation. Enjoy faster test regeneration! ⚡
