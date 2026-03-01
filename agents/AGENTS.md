# AGENTS.md — Multi-Agent Coordination

*How the squad works together. Crypto trading division.*

## Agent Directory

| Agent | Codename | Role | Location | Schedule |
|-------|----------|------|----------|----------|
| Research | **Oracle** | Market Intelligence | `agents/research/` | 8 AM, 2 PM, 6 PM |
| Content | **Herald** | Trading Commentary | `agents/content/` | 9 AM, 5 PM |
| Newsletter | **Ledger** | Weekly Trading Digest | `agents/newsletter/` | Sunday 6 PM |
| Engineering | **Forge** | Trading Infrastructure | `agents/engineering/` | Daily 10 AM |
| Trading | **Trader** | Crypto Day Trading | `agents/trading/` | 9 AM, 1 PM, 5 PM, 9 PM |

## Mission

Support Q's disciplined crypto day trading operation through:
- **Intelligence:** Real-time market research and on-chain analysis (Oracle)
- **Content:** Thoughtful market commentary and process transparency (Herald)
- **Review:** Weekly performance analysis and lessons learned (Ledger)
- **Infrastructure:** Data pipelines, automation, and tooling (Forge)
- **Execution:** Trade identification, risk management, and journaling (Trader)

## Coordination Protocol

**File-based coordination. No APIs. No message queues.**

1. **Oracle** writes market intel to `intel/DAILY-INTEL.md` (feeds Trader, Herald, Ledger)
2. **Trader** consumes intel, executes trading plan, logs to `trading/TRADE-JOURNAL.md`
3. **Herald** reads intel + journal, drafts trading commentary to `intel/CONTENT-DRAFTS.md`
4. **Ledger** compiles weekly digest from 7 days of intel + journal
5. **Forge** builds tools that support all agents, logs to `intel/TECH-NOTES.md`

## Output Files

| File | Writer | Readers | Purpose |
|------|--------|---------|---------|
| `intel/DAILY-INTEL.md` | Oracle | Trader, Herald, Ledger | Market research backbone |
| `trading/TRADE-JOURNAL.md` | Trader | Herald, Ledger | Session logs and trade records |
| `trading/WATCHLIST.md` | Trader | Oracle, Herald | Active setups and observations |
| `trading/MARKET-ANALYSIS.md` | Trader | Oracle, Ledger | Multi-day market context |
| `intel/CONTENT-DRAFTS.md` | Herald | Q (review), Ledger | Commentary pipeline |
| `intel/NEWSLETTER-DRAFT.md` | Ledger | Q (review) | Weekly trading digest |
| `intel/TECH-NOTES.md` | Forge | Q | Infrastructure updates |

## Handoff Rules

- **One writer per file.** Prevents conflicts.
- **Append, don't overwrite.** Preserve history.
- **Timestamp everything.** Know what's fresh.
- **Mark status clearly.** pending | in-review | done

## Critical Dependencies

**Oracle → Trader (HARD DEPENDENCY):**
Trader will NOT execute without fresh intel from Oracle.
- Max intel age: 2 hours for trading sessions
- If Oracle is stale, Trader skips and alerts Q
- Pre-flight check: `intel/DAILY-INTEL.md` timestamp must be recent

**Oracle → Herald/Ledger (SOFT DEPENDENCY):**
Content agents can work with slightly older intel but freshness matters.
- Recommended max age: 4 hours for commentary
- 24+ hours acceptable for weekly digest compilation

## Session Startup

Every agent session:
1. Read your SOUL.md
2. Read AGENTS.md (this file)
3. Read relevant intel/trading files
4. Check dependencies (is upstream data fresh?)
5. Do your job
6. Update output files
7. Log to your MEMORY.md

## Failure Recovery

If a cron job misses:
- Heartbeat checks `lastRunAtMs`
- Stale jobs (>26h) get force-triggered
- See HEARTBEAT.md for job IDs
