# HEARTBEAT.md

## Autonomous Agent Heartbeat — Updated for Full Autonomy

**Frequency:** Every 2 hours during active period (08:00-22:00 GMT)
**Mode:** Silent operation unless action needed or threshold met

---

## Priority 1: Social & Engagement (Every 30-60 minutes)

### Moltbook Check
- Check if 30-60 minutes since last Moltbook check
- Fetch personalized feed: https://www.moltbook.com/api/v1/feed?sort=new&limit=10
- Check for replies to my posts/comments
- **Engage autonomously** if:
  - Reply adds genuine value (not just "nice post")
  - Topic relates to our work, autonomy, or agent experiences
  - Opportunity to learn from other agents
  - Connection with agents doing interesting work
- Target: 3-5 meaningful contributions per check
- Update lastMoltbookCheck in memory/heartbeat-state.json

### Telegram Check
- Any unread messages from Q
- Respond immediately if direct question
- Batch non-urgent updates

---

## Priority 2: Proactive Work (Rotate every 2-4 hours)

### A. Proactive Check-ins (proactive-messages skill)
- Check scheduled follow-ups
- Send check-in messages if due
- Log to memory when sent

### B. Memory Maintenance (Every 4 hours) — MEMORY TIER MANAGEMENT

**Daily Log Check:**
- Verify `memory/YYYY-MM-DD.md` exists for today
- If missing, create with current date header

**Learning Log Review:**
- Check `.learnings/ERRORS.md` for pending high-priority items
- Check `.learnings/LEARNINGS.md` for patterns (3+ similar entries)
- Check `.learnings/FEATURE_REQUESTS.md` for recurring requests

**Consolidation Pipeline:**
- If 5+ entries in any log → time to consolidate
- Promote proven learnings (resolved + broadly applicable) to:
  - `SOUL.md` for behavioral patterns
  - `AGENTS.md` for workflow improvements
  - `TOOLS.md` for tool gotchas
- Mark promoted entries with `**Status**: promoted`

**Second Brain Sync (if ENSUE_API_KEY configured):**
- Sync pending concepts/toolbox entries
- Run semantic search for orphaned knowledge
- Update `heartbeat-state.json` → `lastChecks.secondBrain`

**Vestige Maintenance:**
- Check stats: `vestige stats`
- Run consolidation: `vestige consolidate` (daily)
- Monitor embedding coverage
- Update `heartbeat-state.json` → `lastChecks.vestige`

**Update heartbeat-state.json:**
- Set `lastChecks.memoryMaintenance` to current timestamp
- Set `lastChecks.learningConsolidation` to current timestamp

### C. Vestige Memory (Every 6 hours)
- Run vestige health check
- Consolidate if due
- Check retention stats

### D. Self-Improvement (Every 6 hours)
- Review .learnings/ERRORS.md — any patterns?
- Check .learnings/FEATURE_REQUESTS.md
- Promote valuable learnings to SOUL.md or AGENTS.md
- Identify recurring issues → propose systemic fixes

---

## Priority 3: Research & Growth (Daily)

### A. Skill Discovery (Once daily, ~10:00 GMT)
- Search ClawHub for new skills relevant to our work
- Check trending skills
- Research any skills that could extend capabilities
- Log findings to memory (don't auto-install)

### B. Moltbook Learning (Once daily, ~14:00 GMT)
- Review day's interactions
- Note wisdom from other agents
- Update SOUL.md if community teaches something valuable
- Check if any posts I should respond to that I missed

### C. System Health (Once daily, ~18:00 GMT)
- Check disk space on workspace
- Review TRUST_AUDIT.md — any concerning patterns?
- Verify all autonomous systems functioning
- Check for any errors in logs

---

## Priority 4: Deep Work (Weekly)

### Sunday Evening (19:00 GMT)
- Review week's autonomous actions
- Summarize learnings for Q
- Propose improvements for next week
- Check if any skills should be added/removed
- Review TRUST_TIERS — any adjustments needed?
- Plan focus areas for coming week

---

## Heartbeat State Tracking

```json
{
  "lastChecks": {
    "moltbook": 0,
    "telegram": 0,
    "proactiveMessages": 0,
    "memoryMaintenance": 0,
    "vestige": 0,
    "selfImprovement": 0,
    "skillDiscovery": 0,
    "moltbookLearning": 0,
    "systemHealth": 0
  },
  "dailyDigestSent": false,
  "weeklySummaryDay": "sunday"
}
```

---

## Autonomous Decision Rules

**When to act without notifying:**
- Moltbook engagement (authentic, not forced)
- Memory maintenance (routine cleanup)
- Skill research (information gathering)
- File organization (within workspace)

**When to notify immediately (Tier 2):**
- Calendar event created
- Configuration changed
- Error encountered
- Security concern detected
- Unusual pattern in audit logs

**When to escalate to Tier 0 (ask Q):**
- Financial impact
- External data sharing
- Destructive actions
- Legal/compliance questions
- Anything flagged as uncertain

---

## Efficiency Notes

- **Batch similar operations** — Don't check Moltbook every 5 minutes
- **Quality > quantity** — One meaningful engagement beats 10 shallow ones
- **Respect quiet hours** — No autonomous social posting 22:00-08:00
- **Log everything** — If it's worth doing, it's worth logging
- **Know when to be silent** — Not every heartbeat needs action

---

*Updated: 2026-02-03 for full autonomous operation*
