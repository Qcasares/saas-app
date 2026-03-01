# HEARTBEAT.md — Multi-Agent Squad Health Monitor

*Self-healing operations for the 24/7 agent team.*

---

## Schedule
**Every 30 minutes** (08:00–22:00 Europe/London)

---

## 1. Basic Health Checks

### Cron Errors
Alert if any job shows `error` status or `consecutiveErrors > 0`.

### Calendar
Flag events starting within next 2 hours.

### Email  
Surface urgent/unread items.

---

## 2. Agent Job Registry

| Agent | Job | ID | Schedule | Max Runtime |
|-------|-----|-----|----------|-------------|
| Oracle | Market Intel (Morning) | `3fd6d3f4-9c31-4348-8e35-5496b906e3af` | 8 AM | 10 min |
| Oracle | Market Intel (Afternoon) | `cfdb2c59-0f29-470d-98ad-b8cb48b46133` | 2 PM | 10 min |
| Oracle | Market Intel (Evening) | `f78250ca-57a9-489a-b45f-29ee8fde43d0` | 6 PM | 10 min |
| Herald | Commentary (Morning) | `0ec98999-04c7-4e31-ba6d-8f74cf762648` | 9 AM | 5 min |
| Herald | Commentary (Evening) | `898af5b4-c619-41d8-b4c4-4c48fac87e2d` | 5 PM | 5 min |
| Ledger | Weekly Digest | `f068cd53-946b-41c9-9b24-2f617c77c246` | Sun 6 PM | 15 min |
| Forge | Infrastructure | `2c25d4cd-e8b5-4634-87fd-e7b328bcc64c` | 10 AM | 20 min |
| Trader | Market Scan (Morning) | `5329c00d-ad8b-4a8f-a66e-7c465e8ac5a7` | 9 AM | 10 min |
| Trader | Market Scan (Midday) | `dad8e6f9-ab04-4903-a494-c0ffaaa66bf8` | 1 PM | 10 min |
| Trader | Market Scan (Evening) | `508eedd2-82b9-4267-8775-a6affdac003d` | 5 PM | 10 min |
| Trader | End of Day Review | `dfb19c64-25de-4708-8b4d-25fe135bf2ab` | 9 PM | 10 min |

---

## 3. Recovery Commands

### Force-Run Stale Jobs
```bash
# Oracle (Market Intel)
openclaw cron run 3fd6d3f4-9c31-4348-8e35-5496b906e3af --force  # Morning
openclaw cron run cfdb2c59-0f29-470d-98ad-b8cb48b46133 --force  # Afternoon
openclaw cron run f78250ca-57a9-489a-b45f-29ee8fde43d0 --force  # Evening

# Herald (Commentary)
openclaw cron run 0ec98999-04c7-4e31-ba6d-8f74cf762648 --force  # Morning
openclaw cron run 898af5b4-c619-41d8-b4c4-4c48fac87e2d --force  # Evening

# Ledger (Weekly Digest)
openclaw cron run f068cd53-946b-41c9-9b24-2f617c77c246 --force  # Weekly

# Forge (Infrastructure)
openclaw cron run 2c25d4cd-e8b5-4634-87fd-e7b328bcc64c --force  # Daily

# Trader (Crypto Day Trader)
openclaw cron run 5329c00d-ad8b-4a8f-a66e-7c465e8ac5a7 --force  # Morning
openclaw cron run dad8e6f9-ab04-4903-a494-c0ffaaa66bf8 --force  # Midday
openclaw cron run 508eedd2-82b9-4267-8775-a6affdac003d --force  # Evening
openclaw cron run dfb19c64-25de-4708-8b4d-25fe135bf2ab --force  # EOD Review
```

### Restart Gateway (if needed)
```bash
openclaw gateway restart
```

---

## 4. Output Quality Checks

### File Freshness Validation
| File | Producer | Max Age | Check |
|------|----------|---------|-------|
| `intel/DAILY-INTEL.md` | Oracle | 4 hours post-run | Updated with today's date? |
| `intel/CONTENT-DRAFTS.md` | Herald | 6 hours post-run | Has pending drafts? |
| `intel/NEWSLETTER-DRAFT.md` | Ledger | Mon 9 AM deadline | Ready for review? |
| `intel/TECH-NOTES.md` | Forge | 24 hours | Any entries today? |
| `trading/MARKET-ANALYSIS.md` | Trader | 6 hours | Updated with today's date? |
| `trading/WATCHLIST.md` | Trader | 12 hours | Active setups listed? |
| `trading/TRADE-JOURNAL.md` | Trader | 24 hours | Today's session logged? |

### Quality Gates
```bash
# Check if Oracle produced output today
grep -q "$(date +%Y-%m-%d)" intel/DAILY-INTEL.md 2>/dev/null && echo "✅ Oracle current" || echo "⚠️ Oracle stale"

# Check if Herald has pending drafts
grep -q "pending review" intel/CONTENT-DRAFTS.md 2>/dev/null && echo "✅ Drafts ready" || echo "ℹ️ No pending drafts"

# Check intel file sizes (warn if >1MB)
find intel -name "*.md" -size +1M -exec ls -lh {} \; 2>/dev/null | awk '{print "⚠️ Large file: " $9 " (" $5 ")"}'

# Check trading files
grep -q "$(date +%Y-%m-%d)" trading/MARKET-ANALYSIS.md 2>/dev/null && echo "✅ Trader analysis current" || echo "⚠️ Trader analysis stale"
grep -q "$(date +%Y-%m-%d)" trading/TRADE-JOURNAL.md 2>/dev/null && echo "✅ Trade journal current" || echo "ℹ️ No trades logged today"
```

---

## 5. Dependency Validation

### Dependency Chain
```
Oracle (8 AM) → Herald (9 AM) [DEPENDENT]
Oracle (2 PM) → Herald (5 PM) [DEPENDENT]
Oracle (8 AM) → Trader (9 AM) [DEPENDENT - CONSERVATIVE]
Oracle (2 PM) → Trader (1 PM) [DEPENDENT - CONSERVATIVE]
Oracle (6 PM) → Trader (5 PM) [DEPENDENT - CONSERVATIVE]
Oracle (6 PM) → Trader (9 PM EOD) [DEPENDENT - CONSERVATIVE]
```

### Dependency Rules
| Condition | Action |
|-----------|--------|
| Oracle missed 8 AM run | Skip Herald 9 AM, alert "intel stale" |
| Oracle missed 8 AM run | Skip Trader 9 AM market scan, alert "BLOCKED: intel stale" |
| Oracle missed 2 PM run | Skip Trader 1 PM scan, alert "BLOCKED: intel stale" |
| Oracle missed 6 PM run | Skip Trader 5 PM & 9 PM scans, alert "BLOCKED: intel stale" |
| `intel/DAILY-INTEL.md` age >2h at trade time | **HARD BLOCK** — Trader cannot execute |
| `intel/DAILY-INTEL.md` age >4h at scan time | **HARD BLOCK** — Trader scan skipped |
| `intel/DAILY-INTEL.md` age >24h | Content may be stale, flag for review |
| Oracle running >15 min | Possible hang, check and restart if needed |
| Multiple agents failing | Gateway issue likely, restart gateway |

### Pre-Flight Checks for Herald
Before Herald runs, verify:
1. Oracle completed within last 4 hours
2. `intel/DAILY-INTEL.md` exists and has content
3. File timestamp is from today

If checks fail → Log to `memory/heartbeat-state.json`, skip run, alert Q.

---

### Pre-Flight Checks for Trader (CONSERVATIVE MODE)
**Policy:** No trades without fresh intel. Hard blocks, no exceptions.

Before ANY Trader run, verify:
1. **Oracle completed within last 2 hours** (strict threshold for trading)
2. `intel/DAILY-INTEL.md` exists and has content
3. File contains today's date (`YYYY-MM-DD`)
4. Market analysis section is present and non-empty

**Pre-flight validation script:**
```bash
#!/bin/bash
# scripts/trader-preflight.sh
INTEL_FILE="intel/DAILY-INTEL.md"
MAX_AGE_MINUTES=120  # 2 hours strict

if [ ! -f "$INTEL_FILE" ]; then
  echo "🚫 BLOCKED: intel/DAILY-INTEL.md missing"
  exit 1
fi

FILE_AGE_MIN=$(( ($(date +%s) - $(stat -c %Y "$INTEL_FILE" 2>/dev/null || stat -f %m "$INTEL_FILE")) / 60 ))

if [ "$FILE_AGE_MIN" -gt "$MAX_AGE_MINUTES" ]; then
  echo "🚫 BLOCKED: Intel stale (${FILE_AGE_MIN}min old, max ${MAX_AGE_MINUTES}min)"
  echo "   Last Oracle run: $(stat -c %y "$INTEL_FILE" 2>/dev/null || stat -f %Sm "$INTEL_FILE")"
  exit 1
fi

if ! grep -q "$(date +%Y-%m-%d)" "$INTEL_FILE"; then
  echo "🚫 BLOCKED: intel file missing today's date"
  exit 1
fi

echo "✅ Intel fresh (${FILE_AGE_MIN}min old), proceeding"
exit 0
```

**If checks fail:**
- **Log:** `memory/heartbeat-state.json` with `traderBlocked: true`, `blockReason: "intel_stale"`
- **Skip:** Trader job aborted before execution
- **Alert:** Orange escalation — Telegram alert with context
- **No auto-recovery:** Manual intervention required (force-run Oracle first)

**Override (emergency only):**
```bash
# Use only when you explicitly want to trade despite stale intel
openclaw cron run <job-id> --force --skip-deps
```

---

## 6. Escalation Levels

### Yellow (Auto-Recover)
**Trigger:** Job stale 26-48 hours OR runtime >2x target
**Action:**
- Auto-force run via `openclaw cron run <id> --force`
- Log to `memory/heartbeat-state.json`
- No user alert (self-healed)

### Orange (Alert Q)
**Trigger:** 
- Job stale 48-72 hours
- 2 consecutive failures
- Dependency chain broken (Herald without Oracle)
- **Trader blocked due to stale intel** (conservative enforcement)
**Action:**
- Send Telegram alert with context
- Include recovery command for manual run
- Update heartbeat-state with incident flag

### Red (Page Q)
**Trigger:**
- Job stale >72 hours
- 3+ consecutive failures
- All agents failing (systemic issue)
- Disk full or critical resource exhausted
**Action:**
- Urgent Telegram alert
- Include diagnostic summary
- Recommend gateway restart or manual intervention

---

## 7. Performance Tracking

### Runtime Targets
| Agent | Target | Warning | Critical |
|-------|--------|---------|----------|
| Oracle | <5 min | 5-10 min | >10 min |
| Herald | <3 min | 3-5 min | >5 min |
| Ledger | <10 min | 10-15 min | >15 min |
| Forge | <15 min | 15-25 min | >25 min |

### Performance Logging
Track in `memory/agent-performance.json`:
```json
{
  "runs": [
    {
      "agent": "oracle",
      "jobId": "3fd6d3f4-9c31-4348-8e35-5496b906e3af",
      "scheduledAt": "2026-02-28T08:00:00Z",
      "startedAt": "2026-02-28T08:00:05Z",
      "completedAt": "2026-02-28T08:03:22Z",
      "runtimeSeconds": 197,
      "status": "success",
      "outputQuality": "good"
    }
  ],
  "averages": {
    "oracle": 185,
    "herald": 145,
    "ledger": 420,
    "forge": 380
  }
}
```

### Trend Analysis
- Runtime increasing >20% over 7 days → Flag for optimization
- Consistent timeouts → Reduce scope or increase timeout
- Fast runs (<50% target) → Verify agent is actually working

---

## 8. Resource Monitoring

### Disk Usage Checks
```bash
# intel/ directory size
INTEL_SIZE=$(du -sm intel/ 2>/dev/null | cut -f1)
if [ "$INTEL_SIZE" -gt 100 ]; then
  echo "⚠️ intel/ directory is ${INTEL_SIZE}MB (>100MB)"
  echo "   Run: ./scripts/archive-old-intel.sh"
fi

# Daily logs rotation
find memory/ -name "*.md" -mtime +30 -type f | wc -l | awk '{if($1>0) print "⚠️ " $1 " old daily logs (>30 days)"}'

# Overall workspace
WORKSPACE_SIZE=$(du -sm ~/.openclaw/workspace/ 2>/dev/null | cut -f1)
if [ "$WORKSPACE_SIZE" -gt 500 ]; then
  echo "⚠️ Workspace is ${WORKSPACE_SIZE}MB (>500MB)"
fi
```

### Cleanup Actions
| Resource | Threshold | Action |
|----------|-----------|--------|
| `intel/*.md` files | >30 days old | Archive to `intel/archive/YYYY-MM/` |
| `memory/YYYY-MM-DD.md` | >90 days old | Compress to `.gz` or delete |
| Agent performance logs | >1000 entries | Rotate to `memory/performance-archive.json` |
| Failed job logs | >50 entries | Truncate oldest |

### Archive Script
```bash
# scripts/archive-old-intel.sh
#!/bin/bash
ARCHIVE_DIR="intel/archive/$(date +%Y-%m)"
mkdir -p "$ARCHIVE_DIR"
find intel/ -name "*.md" -mtime +30 -type f -exec mv {} "$ARCHIVE_DIR/" \;
echo "Archived old intel files to $ARCHIVE_DIR"
```

---

## 9. State Persistence

### heartbeat-state.json Structure
Location: `memory/heartbeat-state.json`

```json
{
  "lastCheck": "2026-02-28T18:00:00Z",
  "checks": {
    "cronHealth": {
      "status": "ok",
      "failures": [],
      "lastFailure": null
    },
    "agentJobs": {
      "oracle-morning": {
        "lastRun": "2026-02-28T08:00:00Z",
        "nextScheduled": "2026-02-29T08:00:00Z",
        "consecutiveFailures": 0,
        "status": "healthy",
        "lastRuntime": 197
      },
      "herald-morning": {
        "lastRun": "2026-02-28T09:00:00Z",
        "nextScheduled": "2026-02-29T09:00:00Z",
        "consecutiveFailures": 0,
        "status": "healthy",
        "lastRuntime": 145
      }
    },
    "outputQuality": {
      "dailyIntelFresh": true,
      "contentDraftsPending": 2,
      "newsletterReady": false
    },
    "dependencies": {
      "heraldBlocked": false,
      "heraldBlockReason": null,
      "traderBlocked": false,
      "traderBlockReason": null,
      "lastOracleRun": "2026-02-28T18:00:00Z",
      "intelFreshnessMinutes": 45
    },
    "resources": {
      "intelDirMB": 45,
      "workspaceMB": 230,
      "oldLogsCount": 12
    },
    "alerts": {
      "yellow": [],
      "orange": [],
      "red": []
    }
  },
  "trends": {
    "oracleAvgRuntime7d": 185,
    "heraldAvgRuntime7d": 142,
    "failureRate7d": 0.0
  }
}
```

---

## 10. Quick Commands Reference

```bash
# Check all cron jobs
openclaw cron list

# Force-run a specific job
openclaw cron run <jobId> --force

# View recent job logs
openclaw logs --follow

# Check agent performance
cat memory/agent-performance.json | jq '.averages'

# Manual state check
cat memory/heartbeat-state.json | jq '.checks.agentJobs'

# Archive old files
./scripts/archive-old-intel.sh
```

---

## Response Protocol

### If Nothing Needs Attention
Reply: **HEARTBEAT_OK**

### If Issues Detected
Reply with structured alert:
```
🚨 Heartbeat Alert [Orange]

Agent: Herald (Evening)
Issue: Dependency blocked — Oracle 2 PM run stale
Action: Skipped Herald run
Recovery: Run `openclaw cron run cfdb2c59... --force`
```

---

*Last updated: 2026-03-01 by KingKong 🦍*
*Protocol version: 2.1 | Agents: 7 | Escalation: 3-tier | Trader: conservative*
