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
| Sherlock | Research (Morning) | `3fd6d3f4-9c31-4348-8e35-5496b906e3af` | 8 AM | 10 min |
| Sherlock | Research (Afternoon) | `cfdb2c59-0f29-470d-98ad-b8cb48b46133` | 2 PM | 10 min |
| Sherlock | Research (Evening) | `f78250ca-57a9-489a-b45f-29ee8fde43d0` | 6 PM | 10 min |
| Scribe | Content (Morning) | `0ec98999-04c7-4e31-ba6d-8f74cf762648` | 9 AM | 5 min |
| Scribe | Content (Evening) | `898af5b4-c619-41d8-b4c4-4c48fac87e2d` | 5 PM | 5 min |
| Editor | Newsletter | `f068cd53-946b-41c9-9b24-2f617c77c246` | Sun 6 PM | 15 min |
| Architect | Engineering | `2c25d4cd-e8b5-4634-87fd-e7b328bcc64c` | 10 AM | 20 min |

---

## 3. Recovery Commands

### Force-Run Stale Jobs
```bash
# Sherlock (Research)
openclaw cron run 3fd6d3f4-9c31-4348-8e35-5496b906e3af --force  # Morning
openclaw cron run cfdb2c59-0f29-470d-98ad-b8cb48b46133 --force  # Afternoon
openclaw cron run f78250ca-57a9-489a-b45f-29ee8fde43d0 --force  # Evening

# Scribe (Content)
openclaw cron run 0ec98999-04c7-4e31-ba6d-8f74cf762648 --force  # Morning
openclaw cron run 898af5b4-c619-41d8-b4c4-4c48fac87e2d --force  # Evening

# Editor (Newsletter)
openclaw cron run f068cd53-946b-41c9-9b24-2f617c77c246 --force  # Weekly

# Architect (Engineering)
openclaw cron run 2c25d4cd-e8b5-4634-87fd-e7b328bcc64c --force  # Daily
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
| `intel/DAILY-INTEL.md` | Sherlock | 4 hours post-run | Updated with today's date? |
| `intel/CONTENT-DRAFTS.md` | Scribe | 6 hours post-run | Has pending drafts? |
| `intel/NEWSLETTER-DRAFT.md` | Editor | Mon 9 AM deadline | Ready for review? |
| `intel/TECH-NOTES.md` | Architect | 24 hours | Any entries today? |

### Quality Gates
```bash
# Check if Sherlock produced output today
grep -q "$(date +%Y-%m-%d)" intel/DAILY-INTEL.md 2>/dev/null && echo "✅ Sherlock current" || echo "⚠️ Sherlock stale"

# Check if Scribe has pending drafts
grep -q "pending review" intel/CONTENT-DRAFTS.md 2>/dev/null && echo "✅ Drafts ready" || echo "ℹ️ No pending drafts"

# Check intel file sizes (warn if >1MB)
find intel -name "*.md" -size +1M -exec ls -lh {} \; 2>/dev/null | awk '{print "⚠️ Large file: " $9 " (" $5 ")"}'
```

---

## 5. Dependency Validation

### Dependency Chain
```
Sherlock (8 AM) → Scribe (9 AM) [DEPENDENT]
Sherlock (2 PM) → Scribe (5 PM) [DEPENDENT]
Sherlock (6 PM) → [Next day cycle]
```

### Dependency Rules
| Condition | Action |
|-----------|--------|
| Sherlock missed 8 AM run | Skip Scribe 9 AM, alert " intel stale" |
| `intel/DAILY-INTEL.md` age >24h | Content may be stale, flag for review |
| Sherlock running >15 min | Possible hang, check and restart if needed |
| Multiple agents failing | Gateway issue likely, restart gateway |

### Pre-Flight Checks for Scribe
Before Scribe runs, verify:
1. Sherlock completed within last 4 hours
2. `intel/DAILY-INTEL.md` exists and has content
3. File timestamp is from today

If checks fail → Log to `memory/heartbeat-state.json`, skip run, alert Q.

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
- Dependency chain broken (Scribe without Sherlock)
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
| Sherlock | <5 min | 5-10 min | >10 min |
| Scribe | <3 min | 3-5 min | >5 min |
| Editor | <10 min | 10-15 min | >15 min |
| Architect | <15 min | 15-25 min | >25 min |

### Performance Logging
Track in `memory/agent-performance.json`:
```json
{
  "runs": [
    {
      "agent": "sherlock",
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
    "sherlock": 185,
    "scribe": 145,
    "editor": 420,
    "architect": 380
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
      "sherlock-morning": {
        "lastRun": "2026-02-28T08:00:00Z",
        "nextScheduled": "2026-02-29T08:00:00Z",
        "consecutiveFailures": 0,
        "status": "healthy",
        "lastRuntime": 197
      },
      "scribe-morning": {
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
      "scribeBlocked": false,
      "blockReason": null
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
    "sherlockAvgRuntime7d": 185,
    "scribeAvgRuntime7d": 142,
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

Agent: Scribe (Evening)
Issue: Dependency blocked — Sherlock 2 PM run stale
Action: Skipped Scribe run
Recovery: Run `openclaw cron run cfdb2c59... --force`
```

---

*Last updated: 2026-02-28 by KingKong 🦍*
*Protocol version: 2.0 | Agents: 7 | Escalation: 3-tier*
