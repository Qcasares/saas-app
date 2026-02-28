#!/bin/bash
# check-agent-health.sh — Quick health check for agent squad
# Usage: ./scripts/check-agent-health.sh

set -e

WORKSPACE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
STATE_FILE="$WORKSPACE/memory/heartbeat-state.json"
PERF_FILE="$WORKSPACE/memory/agent-performance.json"
INTEL_DIR="$WORKSPACE/intel"

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TODAY=$(date +%Y-%m-%d)

echo "🦍 Agent Squad Health Check — $NOW"
echo "=================================="

# Check 1: Cron job status
echo ""
echo "📋 Cron Job Status:"
openclaw cron list 2>/dev/null | grep -E "(Sherlock|Scribe|Editor|Architect)" || echo "   Unable to fetch cron status"

# Check 2: Output file freshness
echo ""
echo "📄 Output File Status:"

# Daily intel freshness
if [ -f "$INTEL_DIR/DAILY-INTEL.md" ]; then
  INTEL_AGE=$(( ($(date +%s) - $(stat -c %Y "$INTEL_DIR/DAILY-INTEL.md" 2>/dev/null || stat -f %m "$INTEL_DIR/DAILY-INTEL.md")) / 3600 ))
  if grep -q "$TODAY" "$INTEL_DIR/DAILY-INTEL.md" 2>/dev/null; then
    echo "   ✅ DAILY-INTEL.md: Fresh ($INTEL_AGE hours old, today's content)"
  else
    echo "   ⚠️  DAILY-INTEL.md: Stale ($INTEL_AGE hours old, no today's content)"
  fi
else
  echo "   ❌ DAILY-INTEL.md: Missing"
fi

# Content drafts pending
if [ -f "$INTEL_DIR/CONTENT-DRAFTS.md" ]; then
  DRAFT_COUNT=$(grep -c "pending review" "$INTEL_DIR/CONTENT-DRAFTS.md" 2>/dev/null || echo "0")
  echo "   ℹ️  CONTENT-DRAFTS.md: $DRAFT_COUNT drafts pending review"
else
  echo "   ℹ️  CONTENT-DRAFTS.md: No drafts yet"
fi

# Check 3: Resource usage
echo ""
echo "💾 Resource Usage:"

INTEL_SIZE=$(du -sm "$INTEL_DIR" 2>/dev/null | cut -f1 || echo "0")
WORKSPACE_SIZE=$(du -sm "$WORKSPACE" 2>/dev/null | cut -f1 || echo "0")
OLD_LOGS=$(find "$WORKSPACE/memory" -name "*.md" -mtime +30 -type f 2>/dev/null | wc -l | tr -d ' ')

echo "   intel/ directory: ${INTEL_SIZE}MB"
echo "   Workspace total: ${WORKSPACE_SIZE}MB"

if [ "$INTEL_SIZE" -gt 100 ]; then
  echo "   ⚠️  intel/ >100MB — run: ./scripts/archive-old-intel.sh"
fi

if [ "$WORKSPACE_SIZE" -gt 500 ]; then
  echo "   ⚠️  Workspace >500MB — cleanup recommended"
fi

if [ "$OLD_LOGS" -gt 0 ]; then
  echo "   ⚠️  $OLD_LOGS old log files (>30 days)"
fi

# Check 4: State file integrity
echo ""
echo "🔍 State Files:"
if [ -f "$STATE_FILE" ]; then
  echo "   ✅ heartbeat-state.json exists"
  if command -v jq >/dev/null 2>&1; then
    ALERT_COUNT=$(jq '.checks.alerts | to_entries | map(.value | length) | add' "$STATE_FILE" 2>/dev/null || echo "0")
    if [ "$ALERT_COUNT" -gt 0 ]; then
      echo "   ⚠️  $ALERT_COUNT active alerts in state file"
    else
      echo "   ✅ No active alerts"
    fi
  fi
else
  echo "   ❌ heartbeat-state.json missing"
fi

if [ -f "$PERF_FILE" ]; then
  echo "   ✅ agent-performance.json exists"
else
  echo "   ❌ agent-performance.json missing"
fi

# Check 5: Dependencies
echo ""
echo "🔗 Dependency Chain:"
SHERLOCK_6PM="2026-02-28T18:00:00Z"
SHERLOCK_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$SHERLOCK_6PM" +%s 2>/dev/null || date -d "$SHERLOCK_6PM" +%s 2>/dev/null || echo "0")
NOW_EPOCH=$(date +%s)

if [ "$NOW_EPOCH" -lt "$SHERLOCK_EPOCH" ]; then
  echo "   ⏳ Sherlock 6 PM run scheduled in $(( (SHERLOCK_EPOCH - NOW_EPOCH) / 60 )) minutes"
else
  echo "   ⏰ Sherlock 6 PM run should have completed"
  # Check if Scribe 5 PM had intel to work with
  if [ -f "$INTEL_DIR/DAILY-INTEL.md" ]; then
    INTEL_TIME=$(stat -c %Y "$INTEL_DIR/DAILY-INTEL.md" 2>/dev/null || stat -f %m "$INTEL_DIR/DAILY-INTEL.md")
    if [ "$INTEL_TIME" -gt "$((NOW_EPOCH - 3600))" ]; then
      echo "   ✅ Fresh intel available for Scribe"
    else
      echo "   ⚠️  Intel may be stale for Scribe dependency"
    fi
  fi
fi

echo ""
echo "=================================="
echo "Health check complete."
