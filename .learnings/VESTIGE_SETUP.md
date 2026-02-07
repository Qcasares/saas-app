# Vestige Memory Configuration

## Status
- **Installed**: ✅ Yes (via ClawHub)
- **Binary**: `/opt/homebrew/bin/vestige`
- **MCP Server**: `/opt/homebrew/bin/vestige-mcp`
- **Data Location**: `~/Library/Application Support/com.vestige.core/`
- **Health**: ✅ HEALTHY (3 memories, 100% retention)
- **Embeddings**: all-MiniLM-L6-v2 (100% coverage)

## Quick Commands

```bash
# Health check
vestige health

# Stats
vestige stats

# Consolidate (run memory maintenance)
vestige consolidate
```

## Initial Memories Seeded

1. Q's name is Quentin Casares, prefers to be called Q
2. Q granted auto-update permission for skills on 2026-02-05
3. KingKong is the agent name - a digital primate with warm but sharp vibe

## Integration with OpenClaw

Vestige is now integrated into your memory stack. I can use it via the MCP server during our conversations.

**Available operations:**
- Search memories semantically
- Save new memories with automatic tagging
- Promote/demote memory importance
- Set intentions/reminders
- Track codebase patterns

## Helper Script

Created `~/bin/vmem` for easier usage:

```bash
vmem stats                         # Show statistics
vmem health                        # Health check
```

## How Vestige Works

- **FSRS-6 Algorithm**: Spaced repetition like Anki
- **Spreading Activation**: Related memories surface together
- **Natural Decay**: Unused memories fade (just like human memory)
- **Embeddings**: all-MiniLM-L6-v2 for semantic search
- **Promote/Demote**: Strengthen or weaken specific memories based on feedback

## Memory Architecture

Vestige now occupies **Tier 3.5** in your memory stack:

| Tier | System | Purpose |
|------|--------|---------|
| 4 | Ensue Second Brain | Cross-device semantic knowledge (optional) |
| 3.5 | **Vestige** | **Cognitive memory with decay & spaced repetition** |
| 3 | MEMORY.md | Curated long-term notes |
| 2 | .learnings/*.md | Error/learning tracking |
| 1 | memory/*.md | Daily session logs |
| 0 | Session context | Current conversation |

## Trigger Words

When you say these, I'll automatically save to Vestige:
- "Remember this" → Auto-save
- "I always..." / "I prefer..." → Save as preference
- "This is important" → Save + strengthen
- "Remind me..." → Create intention/trigger

## MCP Tools Available

| Tool | Description |
|------|-------------|
| `search` | Unified search (keyword + semantic + hybrid) |
| `smart_ingest` | Intelligent ingestion with duplicate detection |
| `ingest` | Simple memory storage |
| `memory` | Get, delete, or check memory state |
| `codebase` | Remember patterns and architectural decisions |
| `intention` | Set reminders and future triggers |
| `promote_memory` | Mark memory as helpful (strengthens) |
| `demote_memory` | Mark memory as wrong (weakens) |

## Maintenance

Vestige auto-maintains via heartbeat:
- Daily consolidation
- FSRS-6 review scheduling
- Embedding updates
- Retention tracking

## How It Works

- **FSRS-6 Algorithm**: Spaced repetition like Anki
- **Spreading Activation**: Related memories surface together
- **Natural Decay**: Unused memories fade (just like human memory)
- **Promote/Demote**: Strengthen or weaken specific memories

## Integration

Vestige complements the existing memory system:

| System | Use Case |
|--------|----------|
| `memory/*.md` | Human-readable daily logs |
| `MEMORY.md` | Curated long-term notes |
| `.learnings/*.md` | Error/learning tracking |
| **Vestige** | Semantic search + preferences + auto-decay |

## Trigger Words

When you say:
- "Remember this" → Auto-save to Vestige
- "I always..." / "I prefer..." → Save as preference
- "This is important" → Save + strengthen
- "Remind me..." → Create intention/trigger

## MCP Tools Available

- `search` — Keyword + semantic + hybrid search
- `smart_ingest` — Intelligent ingestion with duplicate detection
- `ingest` — Simple memory storage
- `memory` — Get, delete, check state
- `codebase` — Remember patterns
- `intention` — Set reminders
- `promote_memory` / `demote_memory` — Adjust memory strength
