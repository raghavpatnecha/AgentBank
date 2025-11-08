# Memory Management Strategy for API Test Agent

## The Problem

**Context Window Reality:**
- 85+ documentation files created
- 10-week project (48 tasks across 6 features)
- Claude's context window will fill up quickly
- Risk of forgetting decisions, patterns, and progress

## The Solution: Multi-Layer Memory System

### Layer 1: Claude Flow Memory (Primary Memory)

Claude Flow's ReasoningBank and AgentDB are our PRIMARY external memory. Use aggressively.

#### What to Store

**1. Every Decision Made**
```bash
# After making any architectural decision
./claude-flow memory store-vector decision_openapi_parser \
  "Decided to use swagger-parser library because it handles references automatically. Alternatives considered: openapi-typescript (too low-level), custom parser (too much work)" \
  --namespace decisions \
  --metadata '{"feature":"parser","date":"2025-01-08","impact":"high"}' \
  --reasoningbank
```

**2. Every Pattern That Works**
```bash
# After implementing something successfully
./claude-flow memory store-vector pattern_error_handling \
  "Use custom error classes: FileNotFoundError, ParseError. Always include context in error messages. Code: class ParseError extends Error { constructor(msg, context) {...} }" \
  --namespace patterns \
  --metadata '{"type":"error-handling","feature":"all"}' \
  --reasoningbank
```

**3. Every Failure/Lesson Learned**
```bash
# When something doesn't work
./claude-flow memory store-vector antipattern_circular_refs \
  "Tried recursive schema resolution without cycle detection - caused stack overflow. Solution: Track visited refs in Set. DO NOT: naive recursion" \
  --namespace lessons \
  --metadata '{"failed":true,"feature":"parser"}' \
  --reasoningbank
```

**4. Every Task Completed**
```bash
# After finishing a task
./claude-flow memory store-vector task_1_1_complete \
  "Task 1.1 Project Setup: Created package.json, tsconfig.json (strict mode), ESLint config, Vitest setup. Files: package.json, tsconfig.json, .eslintrc.js. Next: Task 1.2 File Loading" \
  --namespace progress \
  --metadata '{"task":"1.1","feature":"parser","status":"done","date":"2025-01-08"}' \
  --reasoningbank
```

**5. File Locations**
```bash
# Map of what's where
./claude-flow memory store-vector file_map \
  "OpenAPI parser: src/core/openapi-parser.ts. Types: src/types/openapi-types.ts. Tests: tests/unit/openapi-parser.test.ts. Config: tsconfig.json at root" \
  --namespace files \
  --reasoningbank
```

### Layer 2: Checkpoint Files (Read on Context Loss)

Create checkpoint files that capture state at key milestones.

#### Status Checkpoint (Updated Frequently)

```bash
# Create .checkpoints/ directory
mkdir -p .checkpoints

# After each task, update checkpoint
cat > .checkpoints/CURRENT_STATUS.md << 'EOF'
# Current Status: 2025-01-08 15:30

## Last Completed
- Task 1.1: Project Setup ✅
- Task 1.2: File Loading ✅

## Currently Working On
- Task 1.3: OpenAPI 3.0 Parsing (50% done)
- File: src/core/openapi-parser.ts
- Stuck on: Reference resolution for circular schemas

## Next Up
- Task 1.3: Complete reference resolution
- Task 1.4: OpenAPI 3.1 support

## Decisions Made
1. Using swagger-parser library (handles refs)
2. Custom error classes (FileNotFoundError, ParseError)
3. Vitest for testing (faster than Jest)

## Files Created
- src/core/openapi-parser.ts (150 lines)
- src/types/openapi-types.ts (80 lines)
- tests/unit/openapi-parser.test.ts (120 lines)

## Memory Keys to Query
- decision_openapi_parser
- pattern_error_handling
- task_1_1_complete
- task_1_2_complete
EOF
```

#### Feature Checkpoint (Updated Per Feature)

```bash
cat > .checkpoints/FEATURE_1_PARSER.md << 'EOF'
# Feature 1: OpenAPI Parser - Status

## Progress: 2/8 tasks complete (25%)

## Completed Tasks
1. ✅ Task 1.1: Project Setup
   - Memory: task_1_1_complete
   - Files: package.json, tsconfig.json, .eslintrc.js

2. ✅ Task 1.2: File Loading
   - Memory: task_1_2_complete
   - Files: src/core/file-loader.ts
   - Pattern: pattern_file_loading

## In Progress
3. 🔄 Task 1.3: OpenAPI 3.0 Parsing (50%)
   - Files: src/core/openapi-parser.ts
   - Blocker: Circular reference resolution
   - Memory: Look for pattern_schema_resolution

## Key Decisions
- swagger-parser library chosen (memory: decision_openapi_parser)
- Custom error classes (memory: pattern_error_handling)

## Code Statistics
- Lines written: ~350
- Tests written: 120
- Coverage: 85%

## Next Session: Query These
./claude-flow memory vector-search "schema resolution" --namespace patterns --k 5
./claude-flow memory vector-search "circular reference" --namespace lessons --k 3
EOF
```

### Layer 3: Automated Status Updates

Create a script that updates status automatically:

```bash
cat > .checkpoints/update-status.sh << 'EOF'
#!/bin/bash
# Update status checkpoint

CURRENT_DATE=$(date +"%Y-%m-%d %H:%M")

cat > .checkpoints/CURRENT_STATUS.md << EOL
# Current Status: ${CURRENT_DATE}

## Last Activity
$(git log -1 --pretty=format:"- Commit: %s (%ar)")

## Files Changed Recently
$(git diff --name-only HEAD~1 HEAD | head -5)

## Git Stats
- Branch: $(git branch --show-current)
- Commits: $(git rev-list --count HEAD)
- Files tracked: $(git ls-files | wc -l)

## Memory Stats
$(./claude-flow memory status --reasoningbank 2>/dev/null || echo "Memory system not available")

## Quick Restore Commands
# Restore context for current work:
./claude-flow memory vector-search "last working" --namespace progress --k 10
./claude-flow memory list --namespace decisions --reasoningbank

## Tasks Status
$(cat tasks/master-status.md | grep "Progress:" | head -10)
EOL

echo "✅ Status updated at ${CURRENT_DATE}"
EOF

chmod +x .checkpoints/update-status.sh
```

### Layer 4: Session Restoration Workflow

**When Context is Lost (THIS IS CRITICAL):**

Create a restore script:

```bash
cat > .checkpoints/RESTORE_CONTEXT.sh << 'EOF'
#!/bin/bash
# Restore context when you've lost track

echo "🔄 Restoring Context..."
echo ""

echo "📊 1. CHECK CURRENT STATUS"
cat .checkpoints/CURRENT_STATUS.md
echo ""

echo "🧠 2. QUERY RECENT MEMORY"
echo "Recent progress:"
./claude-flow memory vector-search "task complete" --namespace progress --k 10 --reasoningbank
echo ""

echo "📋 3. RECENT DECISIONS"
./claude-flow memory vector-search "decided" --namespace decisions --k 5 --reasoningbank
echo ""

echo "📁 4. FILES CHANGED RECENTLY"
git diff --stat HEAD~5 HEAD
echo ""

echo "🎯 5. WHAT TO DO NEXT"
cat .checkpoints/CURRENT_STATUS.md | grep -A 5 "Currently Working On"
echo ""

echo "💡 6. PATTERNS TO REFERENCE"
./claude-flow memory vector-search "pattern" --namespace patterns --k 5 --reasoningbank
echo ""

echo "✅ Context restored! You should now know:"
echo "   - What was last done"
echo "   - What you're working on"
echo "   - What decisions were made"
echo "   - Where files are"
echo "   - What patterns to use"
EOF

chmod +x .checkpoints/RESTORE_CONTEXT.sh
```

## Practical Usage Workflow

### Every Time You Start Work

```bash
# 1. Restore context
./.checkpoints/RESTORE_CONTEXT.sh

# 2. Read current status
cat .checkpoints/CURRENT_STATUS.md

# 3. Query memory for current task
./claude-flow memory vector-search "[current task]" --namespace all --k 10
```

### While Working

```bash
# Store EVERYTHING important
./claude-flow memory store-vector [key] "[description]" --namespace [ns] --reasoningbank

# Examples:
./claude-flow memory store-vector found_bug_in_parser "Bug: swagger-parser doesn't handle empty schemas. Workaround: check if schema exists before parsing" --namespace lessons
```

### Before Ending Session

```bash
# 1. Update status checkpoint
./.checkpoints/update-status.sh

# 2. Update feature checkpoint
# Manually update .checkpoints/FEATURE_X.md with current status

# 3. Store final state
./claude-flow memory store-vector session_end_$(date +%Y%m%d) \
  "Ending session. Completed: [X]. Working on: [Y]. Next: [Z]. Files: [list]" \
  --namespace progress --reasoningbank

# 4. Commit everything
git add . && git commit -m "checkpoint: [what was done]"
```

### When Context is Lost (NEW SESSION)

```bash
# THE RECOVERY WORKFLOW

# 1. Run restore script
./.checkpoints/RESTORE_CONTEXT.sh

# 2. Read output carefully

# 3. Query specific areas
./claude-flow memory vector-search "what I was working on" --namespace progress --k 5
./claude-flow memory vector-search "parser implementation" --namespace patterns --k 5

# 4. Read relevant checkpoint
cat .checkpoints/FEATURE_1_PARSER.md

# 5. Read task file
cat tasks/feature-1-openapi-parser/tasks.md

# 6. Check git log
git log --oneline -10

# NOW YOU KNOW EVERYTHING
```

## Memory Namespaces Organization

```
Namespaces Strategy:

decisions/     - Architectural decisions, library choices
patterns/      - Working code patterns, successful approaches
lessons/       - Failed attempts, bugs found, antipatterns
progress/      - Task completions, session states
files/         - File locations, project structure
parser/        - Feature 1 specific knowledge
generator/     - Feature 2 specific knowledge
executor/      - Feature 3 specific knowledge
ai/            - Feature 4 specific knowledge
github/        - Feature 5 specific knowledge
reporting/     - Feature 6 specific knowledge
shared/        - Cross-cutting concerns
```

## Concrete Example: How This Prevents Getting Lost

### Scenario: Context Lost After 1000 Messages

**What NOT to do:**
- Panic
- Start from scratch
- Guess what was done
- Re-read all 85 files

**What TO do:**

```bash
# Step 1: Run restore
./.checkpoints/RESTORE_CONTEXT.sh

# Output will show:
# - Last commit: "feat: implement OpenAPI 3.0 parser"
# - Files changed: src/core/openapi-parser.ts, tests/...
# - Current task: Task 1.3 (reference resolution)
# - Memory shows: 5 patterns stored, 3 decisions made

# Step 2: Query memory for context
./claude-flow memory vector-search "parser" --namespace progress --k 10

# Output:
# - task_1_1_complete: "Created project structure"
# - task_1_2_complete: "File loading works"
# - decision_openapi_parser: "Using swagger-parser"
# - pattern_error_handling: "Custom error classes"

# Step 3: Read specific checkpoint
cat .checkpoints/FEATURE_1_PARSER.md

# Shows:
# - 2/8 tasks done
# - Currently on Task 1.3
# - Stuck on circular refs

# Step 4: Query for solution
./claude-flow memory vector-search "circular reference" --namespace lessons

# Output:
# - antipattern_circular_refs: "Use Set to track visited"

# CONTEXT FULLY RESTORED IN 2 MINUTES
```

## Storage Requirements

**Memory Database:**
- Each entry: ~500 bytes
- 1000 entries: ~500KB
- Expected: ~2000 entries by project end = 1MB
- Totally manageable

**Checkpoint Files:**
- Each checkpoint: ~2KB
- 6 feature checkpoints: ~12KB
- 1 current status: ~2KB
- Total: ~20KB
- Negligible

## Best Practices

### DO:
- ✅ Store every decision immediately
- ✅ Store every working pattern
- ✅ Store every bug/lesson learned
- ✅ Update checkpoints after each task
- ✅ Commit frequently with descriptive messages
- ✅ Run restore script when returning to work

### DON'T:
- ❌ Rely on memory alone
- ❌ Forget to store patterns that work
- ❌ Skip updating checkpoints
- ❌ Leave sessions without storing state
- ❌ Assume you'll remember next time

## Critical Files to ALWAYS Check

When context is lost, read these in order:

1. `.checkpoints/CURRENT_STATUS.md` - What's happening NOW
2. `.checkpoints/FEATURE_X.md` - Current feature status
3. `tasks/master-status.md` - Overall progress
4. Memory queries - Stored knowledge

## Summary

### Memory Strategy in One Sentence:
**Store everything in Claude Flow memory immediately, update checkpoints after each task, and use the restore script to recover context in under 2 minutes.**

### The Workflow:
```
Start session → Restore context → Work → Store learnings → Update checkpoints → Commit
↑                                                                                    ↓
└────────────────────────────── Repeat ─────────────────────────────────────────────┘
```

### Success Metrics:
- Time to restore context: < 2 minutes
- Information loss: 0%
- Ability to resume: 100%

This is a robust, battle-tested approach that prevents context loss entirely.
