#!/bin/bash
# archive-old-intel.sh — Archive intel files older than 30 days
# Run via: ./scripts/archive-old-intel.sh

set -e

WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
INTEL_DIR="$WORKSPACE/intel"
ARCHIVE_DIR="$INTEL_DIR/archive/$(date +%Y-%m)"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Find and archive old files
ARCHIVED_COUNT=0
while IFS= read -r file; do
  if [ -n "$file" ]; then
    mv "$file" "$ARCHIVE_DIR/"
    ((ARCHIVED_COUNT++))
  fi
done < <(find "$INTEL_DIR" -maxdepth 1 -name "*.md" -mtime +30 -type f 2>/dev/null)

if [ "$ARCHIVED_COUNT" -gt 0 ]; then
  echo "✅ Archived $ARCHIVED_COUNT old intel files to $ARCHIVE_DIR"
else
  echo "ℹ️ No files older than 30 days to archive"
fi

# Compress archive if it's getting large
ARCHIVE_SIZE=$(du -sm "$ARCHIVE_DIR" 2>/dev/null | cut -f1 || echo "0")
if [ "$ARCHIVE_SIZE" -gt 50 ]; then
  echo "📦 Compressing archive (size: ${ARCHIVE_SIZE}MB)..."
  tar -czf "$ARCHIVE_DIR.tar.gz" -C "$INTEL_DIR/archive" "$(basename "$ARCHIVE_DIR")"
  rm -rf "$ARCHIVE_DIR"
  echo "✅ Compressed to $(basename "$ARCHIVE_DIR").tar.gz"
fi
