#!/bin/bash
# Trader Pre-Flight Check Script
# Conservative enforcement: No trades without fresh research

INTEL_FILE="intel/DAILY-INTEL.md"
MAX_AGE_MINUTES=120  # 2 hours strict for trading

if [ ! -f "$INTEL_FILE" ]; then
  echo "🚫 BLOCKED: intel/DAILY-INTEL.md missing"
  exit 1
fi

# Get file age in minutes (cross-platform stat)
if command -v stat >/dev/null 2>&1; then
  # macOS stat
  FILE_MTIME=$(stat -f %m "$INTEL_FILE" 2>/dev/null)
  if [ $? -ne 0 ]; then
    # Linux stat
    FILE_MTIME=$(stat -c %Y "$INTEL_FILE" 2>/dev/null)
  fi
fi

CURRENT_TIME=$(date +%s)
FILE_AGE_MIN=$(( (CURRENT_TIME - FILE_MTIME) / 60 ))

if [ "$FILE_AGE_MIN" -gt "$MAX_AGE_MINUTES" ]; then
  echo "🚫 BLOCKED: Research stale (${FILE_AGE_MIN}min old, max ${MAX_AGE_MINUTES}min)"
  echo "   Last Sherlock run: $(date -r $FILE_MTIME '+%Y-%m-%d %H:%M' 2>/dev/null || date -d @$FILE_MTIME '+%Y-%m-%d %H:%M')"
  exit 1
fi

if ! grep -q "$(date +%Y-%m-%d)" "$INTEL_FILE"; then
  echo "🚫 BLOCKED: intel file missing today's date"
  exit 1
fi

echo "✅ Research fresh (${FILE_AGE_MIN}min old), proceeding"
exit 0
