# Getting Started with API Test Agent Development

## Project Initialized with Claude Flow

This project uses Claude Flow for intelligent multi-agent development orchestration.

## What's Been Set Up

### 1. Documentation
- **PRD.md**: Complete product requirements
- **IMPLEMENTATION_PLAN.md**: 10-week development roadmap
- **claude.md**: Development guidelines (linting, no emojis, error handling)
- **CLAUDE_FLOW_STRATEGY.md**: How to use Claude Flow for this project
- **tasks/**: Detailed task breakdowns for all 6 features

### 2. Claude Flow Infrastructure
- **.claude/**: Command documentation and configurations
- **.hive-mind/**: Hive-mind system for complex project coordination
- **.swarm/**: Memory database (ReasoningBank)
- **CLAUDE.md**: Claude Flow configuration
- **.mcp.json**: MCP server configuration
- **claude-flow**: Local executable

### 3. Memory System
- ReasoningBank initialized at `.swarm/memory.db`
- Supports both pattern search and vector search
- Ready for storing development patterns and learnings

## Quick Start

### Check Claude Flow Status

```bash
# Verify installation
./claude-flow --version

# Check memory system
./claude-flow memory status --reasoningbank

# Check hive-mind system
./claude-flow hive-mind status
```

### Start Development: Feature 1 (OpenAPI Parser)

```bash
# Initialize hive-mind for Feature 1
./claude-flow hive-mind spawn \
  "Build OpenAPI 3.0/3.1 and Swagger 2.0 parser with TypeScript" \
  --namespace parser \
  --agents architect,typescript-developer,test-engineer \
  --claude

# Follow with task-by-task execution
# See tasks/feature-1-openapi-parser/tasks.md for detailed tasks
```

### Development Workflow Pattern

For each task:

```bash
# 1. Query existing patterns
./claude-flow memory vector-search "similar to [task]" \
  --namespace parser --k 5

# 2. Execute task
./claude-flow swarm "implement [specific task]" --continue-session

# 3. Store successful patterns
./claude-flow memory store-vector [pattern_name] \
  "Pattern description and example" \
  --namespace parser
```

## Project Structure

```
api-test-agent/
├── docs/                          # Documentation
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── claude.md
│   └── CLAUDE_FLOW_STRATEGY.md
├── tasks/                         # Task tracking
│   ├── master-status.md
│   └── feature-*/tasks.md
├── src/                           # Source code (to be created)
├── tests/                         # Tests (to be created)
├── .claude/                       # Claude Flow commands
├── .hive-mind/                    # Hive-mind system
├── .swarm/                        # Memory database
└── coordination/                  # Coordination configs
```

## Next Steps

### Week 1-2: Feature 1 - OpenAPI Parser

1. Review tasks/feature-1-openapi-parser/tasks.md
2. Start hive-mind session (command above)
3. Execute tasks 1.1 through 1.8
4. Store learnings in memory

### Key Commands

```bash
# Start feature development
./claude-flow hive-mind spawn "[Feature description]" --namespace [ns] --claude

# Continue in same session
./claude-flow swarm "[Task description]" --continue-session

# Query memory
./claude-flow memory vector-search "[query]" --namespace [ns] --k 5

# Store patterns
./claude-flow memory store-vector [key] "[content]" --namespace [ns]

# Check status
./claude-flow hive-mind status

# Resume interrupted session
./claude-flow hive-mind resume [session-id]
```

## Development Guidelines

### Follow claude.md
- No emojis in code
- Explicit error handling
- No fallbacks without logging
- TypeScript strict mode
- ESLint with zero warnings

### Use Memory System
- Store successful patterns
- Query before implementing
- Learn from past mistakes
- Build knowledge base

### Leverage Skills
Just describe what you want:
- "Let's pair program on this"
- "Review code for security"
- "Analyze performance"

## Troubleshooting

### Memory Search Returns 0 Results
```bash
# Check memory status
./claude-flow memory status --reasoningbank

# Verify namespace
./claude-flow memory list --namespace [namespace] --reasoningbank
```

### Hive-Mind Session Stuck
```bash
# Check status
./claude-flow hive-mind status

# Stop and restart
./claude-flow hive-mind stop [session-id]
./claude-flow hive-mind spawn "[Description]" --claude
```

## Resources

- Claude Flow Docs: See .claude/commands/ for all available commands
- Project Strategy: CLAUDE_FLOW_STRATEGY.md
- Task Details: tasks/feature-*/tasks.md
- Development Guide: claude.md

## Ready to Build!

Start with:
```bash
./claude-flow hive-mind spawn \
  "Build OpenAPI parser - Feature 1" \
  --namespace parser \
  --claude
```

Follow the task list and let the hive-mind coordinate the work!
