#!/bin/bash
# Update status checkpoint after completing work

CURRENT_DATE=$(date +"%Y-%m-%d %H:%M")

cat > .checkpoints/CURRENT_STATUS.md << EOL
# Current Status: ${CURRENT_DATE}

## Last Activity
$(git log -1 --pretty=format:"- Commit: %s (%ar)" 2>/dev/null || echo "No commits yet")

## Files Changed Recently
$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -10 || echo "No recent changes")

## Git Stats
- Branch: $(git branch --show-current 2>/dev/null || echo "No branch")
- Commits: $(git rev-list --count HEAD 2>/dev/null || echo "0")
- Files tracked: $(git ls-files | wc -l)

## Memory Stats
$(./claude-flow memory status --reasoningbank 2>/dev/null || echo "Memory system initialized")

## Quick Restore Commands
\`\`\`bash
# Restore context for current work:
./claude-flow memory vector-search "last working" --namespace progress --k 10
./claude-flow memory list --namespace decisions --reasoningbank
\`\`\`

## Tasks Status Summary
$(cat tasks/master-status.md 2>/dev/null | grep -A 2 "Feature Summary" | head -10 || echo "See tasks/master-status.md")

---
*Auto-updated by .checkpoints/update-status.sh*
EOL

echo "✅ Status checkpoint updated at ${CURRENT_DATE}"
echo "📄 File: .checkpoints/CURRENT_STATUS.md"
