# AGENTS.md — Multi-Agent Coordination

*How the squad works together.*

## Agent Directory

| Agent | Role | Location | Schedule |
|-------|------|----------|----------|
| Sherlock | Research | `agents/research/` | 8 AM, 2 PM, 6 PM |
| Scribe | Content | `agents/content/` | 9 AM, 5 PM |
| Editor | Newsletter | `agents/newsletter/` | Sunday 6 PM |
| Architect | Engineering | `agents/engineering/` | Daily 10 AM |

## Coordination Protocol

**File-based coordination. No APIs. No message queues.**

1. **Sherlock** writes research to `intel/DAILY-INTEL.md`
2. **Scribe** reads the intel, drafts content to `intel/CONTENT-DRAFTS.md`
3. **Editor** compiles weekly from 7 days of intel + drafts
4. **Architect** works independently, logs to `intel/TECH-NOTES.md`

## Output Files

| File | Writer | Readers | Purpose |
|------|--------|---------|---------|
| `intel/DAILY-INTEL.md` | Sherlock | Scribe, Editor | Research backbone |
| `intel/CONTENT-DRAFTS.md` | Scribe | Q (review), Editor | Content pipeline |
| `intel/NEWSLETTER-DRAFT.md` | Editor | Q (review) | Weekly digest |
| `intel/TECH-NOTES.md` | Architect | Q | Technical updates |

## Handoff Rules

- **One writer per file.** Prevents conflicts.
- **Append, don't overwrite.** Preserve history.
- **Timestamp everything.** Know what's fresh.
- **Mark status clearly.** pending | in-review | done

## Session Startup

Every agent session:
1. Read your SOUL.md
2. Read AGENTS.md (this file)
3. Read relevant intel files
4. Do your job
5. Update output files
6. Log to your MEMORY.md

## Failure Recovery

If a cron job misses:
- Heartbeat checks `lastRunAtMs`
- Stale jobs (>26h) get force-triggered
- See HEARTBEAT.md for job IDs
