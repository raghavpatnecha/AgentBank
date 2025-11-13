# Incremental Generation - Complete Example

## Real-World Workflow Example

This example walks through a complete development workflow using incremental generation.

## Initial Setup

### 1. Your OpenAPI Spec

**File**: `openapi.yaml`

```yaml
openapi: 3.0.0
info:
  title: E-Commerce API
  version: 1.0.0
paths:
  /products:
    get:
      summary: List products
      responses:
        '200':
          description: Success
  /products/{id}:
    get:
      summary: Get product
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
```

### 2. First Generation

```bash
$ npm run generate -- -s ./openapi.yaml -o ./tests/generated

Parsing OpenAPI specification...
✓ Parsed: E-Commerce API v1.0.0
Found 3 endpoints

Initializing test generator...
Generating tests...
Generated 9 tests in 3 files

Writing test files to ./tests/generated...
✓ Wrote 3 test files to ./tests/generated

💾 Saved generation metadata to .agentbank-cache/generation-metadata.json

Summary:
  Endpoints processed: 3
  Tests generated: 9
  Files generated: 3
  Generation time: 1.2s
```

### 3. Generated Files

```
tests/generated/
├── products-get.spec.ts          # 3 tests
├── products-id-get.spec.ts       # 3 tests
└── users-get.spec.ts             # 3 tests

.agentbank-cache/
└── generation-metadata.json      # Metadata tracking
```

### 4. Metadata Created

```json
{
  "version": "1.0",
  "specHash": "a1b2c3d4e5f6...",
  "specPath": "/path/to/openapi.yaml",
  "generatedAt": "2025-01-15T10:00:00Z",
  "outputDir": "./tests/generated",
  "organizationStrategy": "by-endpoint",
  "endpoints": {
    "GET:/products": {
      "checksum": "xyz123...",
      "method": "GET",
      "path": "/products",
      "files": ["products-get.spec.ts"],
      "generatedAt": "2025-01-15T10:00:00Z",
      "lastModified": "2025-01-15T10:00:00Z",
      "testTypes": ["happy-path", "error-case", "edge-case"],
      "testCount": 3
    },
    "GET:/products/{id}": {
      "checksum": "abc456...",
      "method": "GET",
      "path": "/products/{id}",
      "files": ["products-id-get.spec.ts"],
      "generatedAt": "2025-01-15T10:00:00Z",
      "lastModified": "2025-01-15T10:00:00Z",
      "testTypes": ["happy-path", "error-case", "edge-case"],
      "testCount": 3
    },
    "GET:/users": {
      "checksum": "def789...",
      "method": "GET",
      "path": "/users",
      "files": ["users-get.spec.ts"],
      "generatedAt": "2025-01-15T10:00:00Z",
      "lastModified": "2025-01-15T10:00:00Z",
      "testTypes": ["happy-path", "error-case", "edge-case"],
      "testCount": 3
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

## Day 2: No Changes

### Running Generation Again

```bash
$ npm run generate -- -s ./openapi.yaml -o ./tests/generated

Parsing OpenAPI specification...
✓ Parsed: E-Commerce API v1.0.0
Found 3 endpoints

Initializing test generator...

📊 Incremental Generation Strategy:
   New endpoints:      0
   Modified endpoints: 0
   Unchanged endpoints: 3 (skipped)
   Removed endpoints:  0
   Total operations:   0
   ⚡ Estimated time saved: ~0.3s

✅ All tests are up to date - nothing to generate!
```

**Result**: Completed in 0.1s instead of 1.2s! ⚡

## Day 3: Adding New Endpoint

### 1. Update Spec

Add new endpoint to `openapi.yaml`:

```yaml
paths:
  # ... existing endpoints ...

  /orders:
    post:
      summary: Create order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                productId:
                  type: string
                quantity:
                  type: integer
      responses:
        '201':
          description: Created
```

### 2. Preview Changes (Dry Run)

```bash
$ npm run generate -- -s ./openapi.yaml --dry-run

Parsing OpenAPI specification...
✓ Parsed: E-Commerce API v1.0.0
Found 4 endpoints

🔍 DRY RUN - No changes will be made

Would generate tests for NEW endpoints:
  ✅ POST /orders

Would skip UNCHANGED endpoints:
  ⏭️  GET /products
  ⏭️  GET /products/{id}
  ⏭️  GET /users

Run without --dry-run to apply these changes
```

### 3. Generate Tests

```bash
$ npm run generate -- -s ./openapi.yaml

Parsing OpenAPI specification...
✓ Parsed: E-Commerce API v1.0.0
Found 4 endpoints

📊 Incremental Generation Strategy:
   New endpoints:      1
   Modified endpoints: 0
   Unchanged endpoints: 3 (skipped)
   Removed endpoints:  0
   Total operations:   1
   ⚡ Estimated time saved: ~0.3s

⚡ Incremental mode: Processing 1 endpoint, skipping 3 unchanged

Generating tests...
Generated 3 tests in 1 file

Writing test files to ./tests/generated...
✓ Wrote 1 test file to ./tests/generated

💾 Saved generation metadata to .agentbank-cache/generation-metadata.json

Summary:
  Endpoints processed: 1
  Tests generated: 3
  Files generated: 1
  Generation time: 0.4s
```

### 4. New File Created

```
tests/generated/
├── products-get.spec.ts          # unchanged
├── products-id-get.spec.ts       # unchanged
├── users-get.spec.ts             # unchanged
└── orders-post.spec.ts           # ✨ NEW
```

## Day 4: Modifying Endpoint

### 1. Update Spec

Modify `/products` to add pagination:

```yaml
paths:
  /products:
    get:
      summary: List products
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Success
```

### 2. Dry Run

```bash
$ npm run generate -- -s ./openapi.yaml --dry-run

🔍 DRY RUN - No changes will be made

Would regenerate tests for MODIFIED endpoints:
  🔄 GET /products

Would skip UNCHANGED endpoints:
  ⏭️  GET /products/{id}
  ⏭️  GET /users
  ⏭️  POST /orders

Run without --dry-run to apply these changes
```

### 3. Generate

```bash
$ npm run generate -- -s ./openapi.yaml

📊 Incremental Generation Strategy:
   New endpoints:      0
   Modified endpoints: 1
   Unchanged endpoints: 3 (skipped)
   Removed endpoints:  0
   Total operations:   1
   ⚡ Estimated time saved: ~0.3s

⚡ Incremental mode: Processing 1 endpoint, skipping 3 unchanged

Generating tests...
Generated 3 tests in 1 file

Writing test files to ./tests/generated...
✓ Wrote 1 test file to ./tests/generated

💾 Saved generation metadata
```

### 4. Result

```
tests/generated/
├── products-get.spec.ts          # ✨ REGENERATED (with pagination tests)
├── products-id-get.spec.ts       # unchanged
├── users-get.spec.ts             # unchanged
└── orders-post.spec.ts           # unchanged
```

## Day 5: Manual Changes

### 1. Edit Generated Test

You manually edit `users-get.spec.ts` to add custom assertions:

```typescript
// tests/generated/users-get.spec.ts
test('should list users', async ({ request }) => {
  const response = await request.get('/users');
  expect(response.ok()).toBeTruthy();

  // ✨ CUSTOM: Added manual validation
  const users = await response.json();
  expect(users).toBeInstanceOf(Array);
  expect(users.length).toBeGreaterThan(0);
});
```

### 2. Try to Regenerate

```bash
$ npm run generate -- -s ./openapi.yaml

📊 Incremental Generation Strategy:
   New endpoints:      0
   Modified endpoints: 0
   Unchanged endpoints: 4 (skipped)
   Removed endpoints:  0
   Total operations:   0

⚠️  Warnings:
⚠️  1 file(s) were manually modified and will be preserved:
   - users-get.spec.ts
   Run with --force-all to regenerate these files (will overwrite manual changes)

✅ All tests are up to date - nothing to generate!
```

**Result**: Your manual changes are preserved! 🛡️

### 3. Force Regenerate (Overwrites Manual Changes)

```bash
$ npm run generate -- -s ./openapi.yaml --force-all

ℹ️  Full regeneration: force-all flag

Generating tests...
Generated 12 tests in 4 files

Writing test files to ./tests/generated...
✓ Wrote 4 test files to ./tests/generated

💾 Saved generation metadata
```

**Warning**: This overwrites your manual changes!

## Day 6: Removing Endpoint

### 1. Remove Endpoint

Remove `/products/{id}` from `openapi.yaml`

### 2. Dry Run

```bash
$ npm run generate -- -s ./openapi.yaml --dry-run

🔍 DRY RUN - No changes will be made

Would skip UNCHANGED endpoints:
  ⏭️  GET /products
  ⏭️  GET /users
  ⏭️  POST /orders

Would delete files for REMOVED endpoints:
  ❌ products-id-get.spec.ts

Run without --dry-run to apply these changes
```

### 3. Generate

```bash
$ npm run generate -- -s ./openapi.yaml

📊 Incremental Generation Strategy:
   New endpoints:      0
   Modified endpoints: 0
   Unchanged endpoints: 3 (skipped)
   Removed endpoints:  1
   Total operations:   1

⚠️  Warnings:
⚠️  1 endpoint(s) were removed:
   - GET /products/{id}
   This will delete 1 test file(s)

Deleted: products-id-get.spec.ts

✅ All tests are up to date - nothing to generate!

💾 Saved generation metadata
```

### 4. Result

```
tests/generated/
├── products-get.spec.ts          # unchanged
├── users-get.spec.ts             # unchanged
└── orders-post.spec.ts           # unchanged

# products-id-get.spec.ts was deleted ❌
```

## Real-World Scenario: Team Workflow

### Developer A: Morning Work

```bash
# Pull latest spec changes
git pull

# Preview what changed
npm run generate -- -s ./openapi.yaml --dry-run

# Output:
# Would generate tests for NEW endpoints:
#   ✅ POST /products
#   ✅ DELETE /products/{id}
# Would regenerate tests for MODIFIED endpoints:
#   🔄 GET /products (added filtering)

# Generate tests
npm run generate -- -s ./openapi.yaml

# Commit
git add tests/generated .agentbank-cache
git commit -m "feat: add product creation and deletion tests"
git push
```

### Developer B: Afternoon Work

```bash
# Pull changes
git pull

# Check status
npm run generate -- -s ./openapi.yaml

# Output:
# ✅ All tests are up to date - nothing to generate!

# Make your own changes to spec
# ... edit openapi.yaml ...

# Preview
npm run generate -- -s ./openapi.yaml --dry-run

# Generate
npm run generate -- -s ./openapi.yaml

# Commit
git add tests/generated .agentbank-cache
git commit -m "feat: add user authentication endpoints"
git push
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Generate Tests

on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'package.json'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Restore metadata cache
      - name: Cache AgentBank metadata
        uses: actions/cache@v3
        with:
          path: .agentbank-cache
          key: agentbank-${{ hashFiles('openapi.yaml') }}
          restore-keys: |
            agentbank-

      - name: Install dependencies
        run: npm ci

      # Dry run to check changes
      - name: Preview changes
        run: npm run generate -- -s ./openapi.yaml --dry-run

      # Generate tests
      - name: Generate tests
        run: npm run generate -- -s ./openapi.yaml

      # Run tests
      - name: Run generated tests
        run: npm test

      # Commit if changed
      - name: Commit changes
        run: |
          git config user.name "AgentBank Bot"
          git config user.email "bot@example.com"
          git add tests/generated .agentbank-cache
          git diff --staged --quiet || git commit -m "chore: regenerate tests"
```

## Summary

This example demonstrates:

1. ✅ **First generation**: Creates metadata
2. ✅ **No changes**: Skips all tests (fast!)
3. ✅ **New endpoint**: Only generates new tests
4. ✅ **Modified endpoint**: Only regenerates changed
5. ✅ **Manual changes**: Detects and preserves
6. ✅ **Removed endpoint**: Deletes with warning
7. ✅ **Dry run**: Preview before applying
8. ✅ **Team workflow**: Share metadata via git
9. ✅ **CI/CD**: Automated with caching

**Key Takeaway**: Incremental generation saves time and preserves your work! 🚀
