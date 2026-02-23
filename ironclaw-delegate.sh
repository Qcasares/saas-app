#!/bin/bash
# Ironclaw wrapper for KingKong
# Usage: ./ironclaw-delegate.sh "your question here"

set -e

# Ensure GITHUB_TOKEN is available for GitHub tool
export GITHUB_TOKEN="${GITHUB_TOKEN:-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}"

# Run ironclaw with the provided message
if [ -z "$1" ]; then
    echo "Usage: $0 \"your question here\""
    echo ""
    echo "Examples:"
    echo "  $0 \"What time is it in Tokyo?\""
    echo "  $0 \"List my calendars\""
    echo "  $0 \"Check my GitHub notifications\""
    exit 1
fi

ironclaw -m "$@"
