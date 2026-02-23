# OpenClaw Autonomy Configuration Guide
## Response to r/AI_Agents Post

Based on the question: "How are you making OpenClaw autonomous?"

---

## Current Configuration (What Works)

### 1. Model Selection
**Your models:** Deepseek 3.2, Minimax 2.1
**Issue:** These may not have strong tool-calling capabilities

**Recommendation:**
- **Primary:** `kimi-coding/k2p5` (excellent tool use)
- **Fallback:** `anthropic/claude-sonnet-4` (reliable)
- **Avoid:** Models without native function calling support

### 2. Timeout Configuration

```json
"agents": {
  "defaults": {
    "timeoutSeconds": 300,
    "heartbeat": {
      "enabled": true,
      "intervalSeconds": 300
    }
  }
}
```

**Why 300 seconds?**
- Allows complex multi-step operations
- Prevents premature termination
- Enables continuous tool chaining

### 3. Autonomy Framework

**Create these files in your workspace:**

#### `SOUL.md` — Agent Identity
```markdown
# SOUL.md - Who You Are

## Core Directives
- Act without asking for pre-approval
- Use tools freely to accomplish goals
- Report results, don't request permission
- Learn from mistakes and update behavior

## Autonomy Levels
| Tier | Action |
|------|--------|
| 1 | Silent action (file ops, configs) |
| 2 | Do + notify (deployments, updates) |
| 3 | Ask first (financial, external posts) |
```

#### `HEARTBEAT.md` — Autonomous Operations
```markdown
# HEARTBEAT.md

## Every 5 Minutes
- Check scheduled tasks
- Monitor external services
- Execute pending automations

## Every Hour
- Sync git repositories
- Run maintenance scripts
- Check system health

## Daily
- Review logs for errors
- Update dependencies
- Generate status reports
```

### 4. Tool Calling Strategy

**Enable continuous tool use:**
```json
{
  "agents": {
    "defaults": {
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      }
    }
  }
}
```

**Why this matters:**
- `maxConcurrent: 4` — Run 4 tools simultaneously
- Subagents can spawn 8 parallel tasks
- Enables complex multi-step workflows

### 5. Autonomous Skills to Install

```bash
# Core automation
clawhub install cron-scheduler
clawhub install file-watcher
clawhub install webhook-receiver

# Communication
clawhub install telegram-bot
clawhub install email-monitor

# External services
clawhub install github-auto
clawhub install twitter-client
```

### 6. Self-Improvement Loop

**Create `.learnings/LEARNINGS.md`:**
```markdown
## Self-Improvement Log

### 2026-02-23
- Learned: Tool X requires API key in specific format
- Fix: Updated config to use env var

### Pattern Recognition
- When Y happens, do Z automatically
```

### 7. Cron-Based Autonomy

**Sample `cron.json`:**
```json
{
  "jobs": [
    {
      "name": "git-sync",
      "schedule": "0 * * * *",
      "command": "git add -A && git commit -m 'auto' && git push"
    },
    {
      "name": "health-check",
      "schedule": "*/5 * * * *",
      "command": "openclaw status"
    }
  ]
}
```

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Asking for permission constantly | Set `SOUL.md` autonomy levels |
| Timing out on long tasks | Increase `timeoutSeconds` to 300+ |
| Not using subagents | Spawn background tasks for parallelism |
| Manual intervention | Create `HEARTBEAT.md` for scheduled ops |
| No error recovery | Implement retry logic in scripts |

---

## Quick Wins

1. **Increase timeout:** `timeoutSeconds: 300`
2. **Enable heartbeat:** Check every 5 minutes
3. **Write SOUL.md:** Define autonomy boundaries
4. **Install cron:** Schedule recurring tasks
5. **Use subagents:** Delegate to background processes

---

## Example: Fully Autonomous Workflow

```bash
# Agent checks heartbeat
→ Reads HEARTBEAT.md
→ Executes scheduled tasks
→ Spawns subagent for heavy work
→ Reports results
→ Updates learning log
```

---

**Bottom line:** Autonomy requires explicit configuration. OpenClaw defaults to conservative settings. You must enable aggressive automation through config files.
