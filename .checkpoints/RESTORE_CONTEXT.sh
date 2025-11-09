#!/bin/bash
# Restore context when you've lost track

echo "🔄 ============================================"
echo "   CONTEXT RESTORATION SYSTEM"
echo "============================================"
echo ""

echo "📊 1. CURRENT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat .checkpoints/CURRENT_STATUS.md
echo ""

echo "🧠 2. RECENT MEMORY (Last 10 Progress Entries)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./claude-flow memory vector-search "task complete" --namespace progress --k 10 --reasoningbank 2>/dev/null || echo "No progress entries yet"
echo ""

echo "📋 3. RECENT DECISIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./claude-flow memory vector-search "decided" --namespace decisions --k 5 --reasoningbank 2>/dev/null || echo "No decisions stored yet"
echo ""

echo "📁 4. FILES CHANGED RECENTLY (Last 5 commits)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --name-only --pretty=format:"Commit: %s" -5 | head -20
echo ""

echo "🎯 5. WHAT TO DO NEXT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -A 5 "Currently Working On" .checkpoints/CURRENT_STATUS.md
grep -A 5 "Next Steps" .checkpoints/CURRENT_STATUS.md
echo ""

echo "💡 6. USEFUL PATTERNS (If any stored)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./claude-flow memory vector-search "pattern" --namespace patterns --k 5 --reasoningbank 2>/dev/null || echo "No patterns stored yet"
echo ""

echo "🔍 7. GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status --short
echo ""
echo "Branch: $(git branch --show-current)"
echo "Commits: $(git rev-list --count HEAD)"
echo ""

echo "📚 8. MEMORY DATABASE STATS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./claude-flow memory status --reasoningbank 2>/dev/null || echo "Memory system available"
echo ""

echo "✅ ============================================"
echo "   CONTEXT RESTORED"
echo "============================================"
echo ""
echo "You should now know:"
echo "  ✓ What was last done"
echo "  ✓ What you're working on"
echo "  ✓ What decisions were made"
echo "  ✓ Where files are"
echo "  ✓ What patterns to use"
echo "  ✓ What to do next"
echo ""
echo "Quick actions:"
echo "  - Read: .checkpoints/CURRENT_STATUS.md"
echo "  - Read: tasks/master-status.md"
echo "  - Query: ./claude-flow memory vector-search '[topic]' --k 10"
echo ""
