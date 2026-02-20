#!/bin/bash
# Git Auto-Sync Script
# Commits and pushes workspace changes hourly

set -e

cd "$HOME/.openclaw/workspace"

# Check if git repo
if [ ! -d .git ]; then
    echo "❌ Not a git repository"
    exit 1
fi

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Check for merge conflicts before committing
if git diff --name-only --diff-filter=U | grep -q .; then
    echo "⚠️  MERGE CONFLICTS DETECTED:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "Please resolve conflicts manually"
    # Send notification
    # message action:send message="Git auto-sync: MERGE CONFLICTS detected. Please resolve manually."
    exit 1
fi

# Stage all changes
git add -A

# Check for sensitive data in staged files
if git diff --cached --name-only | grep -qE '\.env|secret|token|key|password'; then
    echo "⚠️  WARNING: Potential sensitive files detected:"
    git diff --cached --name-only | grep -E '\.env|secret|token|key|password'
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborting"
        exit 1
    fi
fi

# Commit with timestamp
commit_msg="Auto-sync: $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$commit_msg" --no-verify

# Create tag
tag_name="sync-$(date +%Y%m%d-%H%M%S)"
git tag "$tag_name"

# Push with error handling
if ! git push origin HEAD 2>&1; then
    echo "❌ Push failed - possible conflict with remote"
    # Pull and attempt merge
    if git pull --no-rebase origin HEAD 2>&1; then
        git push origin HEAD
        echo "✅ Resolved and pushed"
    else
        echo "❌ Automatic resolution failed"
        exit 1
    fi
else
    echo "✅ Synced: $commit_msg (tag: $tag_name)"
fi
