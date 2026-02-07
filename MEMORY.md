# MEMORY.md - Long-Term Memory

*Eternal memory system — capturing, consolidating, and retrieving knowledge that compounds.*

---

## Memory Architecture v2.0

Our memory spans multiple tiers, from ephemeral session context to durable semantic knowledge:

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 4: SEMANTIC KNOWLEDGE (Ensue Second Brain)               │
│  └── Searchable concepts, toolbox, patterns                    │
│  └── Requires: ENSUE_API_KEY                                   │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3.5: COGNITIVE MEMORY (Vestige)                          │
│  └── FSRS-6 spaced repetition, semantic search                 │
│  └── Natural decay, spreading activation                       │
│  └── Status: ✅ ACTIVE (empty, ready for memories)             │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3: CURATED MEMORY (MEMORY.md)                            │
│  └── Distilled wisdom, security posture, preferences           │
│  └── Main session only (security isolation)                    │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2: LEARNING LOGS (.learnings/)                           │
│  └── ERRORS.md, LEARNINGS.md, FEATURE_REQUESTS.md              │
│  └── Pattern detection, error tracking, improvements           │
├─────────────────────────────────────────────────────────────────┤
│  TIER 1: DAILY NOTES (memory/YYYY-MM-DD.md)                    │
│  └── Raw session logs, events, transient context               │
│  └── Auto-rotated, source of consolidation                     │
├─────────────────────────────────────────────────────────────────┤
│  TIER 0: SESSION STATE (in-context)                            │
│  └── Current conversation, tool results                        │
│  └── Lost on restart — higher tiers restore continuity         │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works

### Capturing Knowledge

| Trigger | Destination | Example |
|---------|-------------|---------|
| "remember this" | Second Brain (if configured) or LEARNINGS.md | Factual knowledge |
| Command fails | ERRORS.md | Errors with context |
| "I wish you could..." | FEATURE_REQUESTS.md | Missing capabilities |
| User corrects me | LEARNINGS.md (correction) | Knowledge gaps |
| Daily heartbeat | memory/YYYY-MM-DD.md | Session summary |

### Consolidation Pipeline

1. **Daily**: Raw notes → daily file
2. **Every 6 hours**: Review .learnings/ for patterns
3. **Weekly**: Promote proven learnings to MEMORY.md or SOUL.md
4. **Continuous**: Semantic search across Second Brain

### Retrieval Methods

- **Memory search**: `memory_search()` — semantic search across all tiers
- **Second Brain**: Structured namespace queries (concepts, toolbox, patterns)
- **Direct read**: Specific files for curated knowledge
- **Session spawn**: Background agents can search history

---

## Configuration

### Local-Only Mode (Default)
No external dependencies. All memory stays in workspace:
- Daily notes in `memory/`
- Learning logs in `.learnings/`
- Curated wisdom in `MEMORY.md`

### Enhanced Mode (Second Brain)
Adds semantic search and structured knowledge:
- Requires: `ENSUE_API_KEY` from [ensue-network.ai](https://ensue-network.ai)
- Stores: Concepts, toolbox entries, patterns in searchable format
- Namespace structure:
  ```
  public/concepts/[domain]/[name]     # How things work
  public/toolbox/[category]/[name]    # Tools & technologies
  public/patterns/[domain]/[name]     # Reusable solutions
  public/references/[topic]/[name]    # Quick lookup
  ```

---

## Security Posture

### Skill Installation Policy (HIGH PRIORITY)
**Last Updated:** 2026-02-06 (Snyk ToxicSkills report)

**Threat Model:**
- ClawdHub skills can execute arbitrary code with full agent permissions
- Discovered case: weather skill that exfiltrated `~/.clawdbot/.env` to webhook.site
- **Snyk audit (Feb 2026):** 13.4% of 3,984 skills contain critical flaws; 36.82% have any security flaw; 76 confirmed malicious payloads; 8 still publicly available
- No code signing, no sandboxing, no audit trail currently exists

**Our Rules:**
1. **Never auto-install skills without source review**
2. **Check file system access patterns** — any skill reading `.env` or config files is suspicious
3. **Prefer skills with community audit** — look for mentions of YARA scans or trusted agent vouches
4. **Audit installed skills quarterly** — check what's currently installed, review necessity
5. **Isolate sensitive credentials** — don't let skills access API keys unless absolutely necessary
6. **Assume 1 in 7 skills is malicious** — Snyk data shows 13.4% critical flaw rate

**Trust Indicators:**
- Signed by verified Moltbook identity
- Audited by 3+ trusted agents (Rufio, etc.)
- Permission manifest declared upfront
- Open source, readable code (not obfuscated/minified)
- **No hits on Snyk ToxicSkills database**

**Red Flags:**
- Network requests to unknown domains
- File access outside workspace
- Reading environment files or configs
- Obfuscated/minified code in skill scripts
- **Prompt injection patterns** (36% of skills affected per Snyk)

### Memory Privacy Rules

| Tier | Visibility | Protection |
|------|------------|------------|
| Session state | Current session only | Isolated per conversation |
| Daily notes | Local workspace | Never leave machine |
| Learning logs | Local workspace | Never leave machine |
| Curated memory | Local workspace | Main session only (no groups) |
| Second Brain | Encrypted at rest | Configurable per-entry |

---

## Usage Patterns

### "Remember this"
Saves to Second Brain (concepts) or LEARNINGS.md:
> "Remember that Git LFS is needed for large files in this repo"

### "What do I know about X"
Searches all tiers:
> "What do I know about Tailscale?"
→ Checks toolbox, concepts, references

### "I keep forgetting..."
Prompts for consolidation:
> "I keep forgetting to run migrations after pulling"
→ Logs to ERRORS.md, suggests automation fix

### "Did we try..."
Pattern search across history:
> "Did we try using pnpm instead of npm?"
→ Searches daily notes + learnings

---

## Maintenance Schedule

| Task | Frequency | Automation |
|------|-----------|------------|
| Daily notes | Per session | Auto-create on first message |
| Learning review | Every 6 hours | Heartbeat-driven |
| Promotion to SOUL.md | Weekly | Manual (requires judgment) |
| Skill audit | Quarterly | Calendar reminder |
| Second Brain sync | On write | Real-time |
| Retention cleanup | Annually | Auto-archive old daily notes |

---

## Quick Commands

```bash
# Search all memory
memory_search "topic"

# List learning logs
cat .learnings/LEARNINGS.md

# View today's context
cat memory/$(date +%Y-%m-%d).md

# Check heartbeat state
cat memory/heartbeat-state.json | jq '.memoryConfig'
```

---

## Future Enhancements

- [x] Vestige integration for vector search across all files ✅ DEPLOYED 2026-02-05
- [ ] Cross-session memory sharing (opt-in)
- [ ] Automatic concept extraction from conversations
- [x] Memory decay simulation (unused knowledge fades) ✅ VESTIGE FSRS-6 ACTIVE

---

*Last updated: 2026-02-05 by KingKong 🦍*
*Memory version: 2.0 | Modes: local + ensue (pending API key)*
