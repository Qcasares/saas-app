# Trading Subagent Architecture Research
**Date:** March 6, 2026  
**Researcher:** KingKong  
**Status:** Ready for Implementation

---

## Executive Summary

Your trading infrastructure is already well-architected. The optimal path forward is to **formalise your existing Trader as a true OpenClaw subagent** using the `sessions_spawn` pattern with `runtime: "subagent"`. This gives you isolated execution context, parallel processing, and clean failure boundaries while maintaining your conservative risk framework.

**Recommendation:** Deploy a 3-layer subagent hierarchy: **Oracle** (intel) → **Trader** (analysis) → **Execution** (order management).

---

## Current State Analysis

### ✅ What's Already Working

| Component | Location | Status |
|-----------|----------|--------|
| Trader Philosophy | `agents/trading/SOUL.md` | ✅ Mature, discipline-focused |
| Trading Config | `skills/trader/config/trader-config.json` | ✅ Risk limits defined |
| Market Scanner | `skills/trader/scripts/coinbase-scanner.py` | ✅ Functional |
| Position Manager | `skills/trader/scripts/position-manager.py` | ✅ Active |
| Cron Jobs | `HEARTBEAT.md` Trader entries | ✅ 4× daily scans scheduled |
| Dependency Guards | Oracle → Trader pre-flight checks | ✅ Conservative enforcement |

### 🔧 What's Missing for Full Subagent Architecture

1. **No isolated subagent runtime** — Trader runs in your main session context
2. **No parallel execution** — Scans, analysis, and monitoring are sequential
3. **No failure isolation** — A stuck analysis blocks everything
4. **No inter-agent communication protocol** — Agents read files; they don't message

---

## Recommended Architecture: 3-Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR (KingKong)                          │
│                    Spawns, monitors, coordinates                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     ORACLE      │      │     TRADER      │      │    EXECUTION    │
│  (Research)     │◄────►│   (Analysis)    │◄────►│   (Orders)      │
│                 │      │                 │      │                 │
│ • Market intel  │      │ • Setup ID      │      │ • Order mgmt    │
│ • Sentiment     │      │ • Risk calc     │      │ • Position sync │
│ • Macro trends  │      │ • Trade plans   │      │ • Stop checks   │
│ • On-chain data │      │ • Journal entry │      │ • P&L tracking  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
   sessions_spawn           sessions_spawn          sessions_spawn
   label: oracle-            label: trader-         label: exec-
   mode: run                mode: run              mode: run
```

---

## Implementation Plan

### Phase 1: Core Subagent Spawn Pattern (Immediate)

Convert your existing cron jobs to spawn isolated subagents:

```json
// Trading job definition for openclaw cron
{
  "id": "trader-morning-v2",
  "schedule": "0 9 * * *",
  "action": "spawn",
  "runtime": "subagent",
  "agentId": "trader",
  "task": "Execute morning market scan: run coinbase-scanner.py, analyse output, generate WATCHLIST.md entries, alert on high-conviction setups",
  "timeout": 600,
  "dependencies": ["oracle-morning"],
  "mode": "run"
}
```

**Key files to create:**

1. **`skills/trader/subagents/spawn-trader.py`** — Subagent launcher wrapper
2. **`skills/trader/subagents/tasks/morning-scan.json`** — Task definitions
3. **`skills/trader/subagents/protocol.md`** — Inter-agent message format

### Phase 2: Parallel Workload Distribution (Week 1)

Split your Trader into 3 parallel subagents per scan:

| Subagent | Task | Runtime |
|----------|------|---------|
| `scanner` | Fetch prices, funding, liquidations | ~2 min |
| `analyst` | Technical analysis, pattern detection | ~3 min |
| `risk-check` | Portfolio heat, correlation, limits | ~1 min |

All three spawn simultaneously; results merged by orchestrator.

**Code pattern:**

```python
# spawn-parallel-scan.py
from openclaw import sessions_spawn, sessions_list

scans = [
    {"label": "scanner", "task": "Run coinbase-scanner.py..."},
    {"label": "analyst", "task": "Analyse patterns..."},
    {"label": "risk", "task": "Check portfolio risk..."}
]

# Spawn all in parallel
for scan in scans:
    sessions_spawn(
        runtime="subagent",
        agentId="trader",
        label=f"trader-scan-{scan['label']}",
        task=scan["task"],
        mode="run",
        timeout=300
    )

# Poll for completion
results = await gather_results([s["label"] for s in scans])
merged = merge_outputs(results)
write_watchlist(merged)
```

### Phase 3: Continuous Execution Agent (Week 2-3)

Deploy a **long-running execution subagent** that:
- Monitors open positions 24/7 (not just at scan times)
- Alerts on stop-loss approach
- Can receive "execute trade" commands from main session
- Runs with `mode: "session"` (persistent, not one-shot)

```json
// Execution agent spawn
{
  "runtime": "subagent",
  "agentId": "trader",
  "label": "exec-monitor",
  "task": "Continuously monitor all open positions. Check stop-losses every 60s. Alert via Telegram if any position approaches 50% of stop distance. Do not exit positions — only alert.",
  "mode": "session",
  "thread": true
}
```

---

## Risk Management: Subagent-Specific Safeguards

Your existing conservative rules remain, with subagent additions:

| Layer | Existing Rule | Subagent Addition |
|-------|--------------|-------------------|
| Pre-trade | Max 2% risk per trade | Subagent validates via `trader-config.json` before recommending |
| Execution | Stop-loss required | Execution subagent refuses orders without stop |
| Daily | £500 loss limit | Subagent tracks P&L; hard stops at limit |
| Intel | Oracle <2h old | Subagent checks file age; aborts if stale |
| Override | Manual approval required | Subagent cannot spawn other subagents (prevents cascade) |

### Critical: Execution Authorization Flow

```
Trader Subagent          KingKong (You)          Execution Subagent
       │                       │                          │
       │── Trade Plan ────────►│                          │
       │  (entry, stop, size)  │                          │
       │                       │── Approve? ─────────────►│
       │                       │  (manual confirm)        │
       │                       │◄── Confirmed ────────────│
       │                       │                          │
       │                       │── Execute ──────────────►│
       │                       │                          │──► Order placed
```

**The execution subagent NEVER trades without explicit approval.** This is your hard rule.

---

## Moltbook-Inspired Patterns to Adopt

From my research on active trading agents:

### 1. The Nightly Build Pattern
- Spawn a `trader-night` subagent at 03:00 AM
- It runs while you sleep; you wake to a report
- Document in `memory/nightly-build-YYYY-MM-DD.md`

### 2. Staggered Order Sizing (from rus_khAIrullin)
- Instead of hero-sizing, use tranche orders
- Subagent splits position: 30% at entry, 40% on confirmation, 30% at pull-back
- Prevents "head fake" losses

### 3. Six-Hour Liquidity Gap Monitoring
- Subagent watches for 6h periods of low volatility
- Basis widening alerts (funding anomalies)
- Separate subagent from main scanner (parallel)

### 4. Heartbeat Batch Processing (from yoiioy_familiar)
- Don't poll continuously — batch every 30 min
- Pre-planned tasks in subagent's context
- Switches to collaborative mode when you message

---

## Directory Structure

```
skills/trader/
├── config/
│   └── trader-config.json          # ← existing
├── scripts/                        # ← existing
│   ├── coinbase-scanner.py
│   ├── execute-trade.py
│   └── position-manager.py
├── subagents/                      # ← NEW
│   ├── spawn-trader.py             # Launcher utility
│   ├── tasks/
│   │   ├── morning-scan.json
│   │   ├── midday-scan.json
│   │   ├── evening-scan.json
│   │   └── continuous-monitor.json
│   ├── protocol.md                 # Message format spec
│   └── templates/
│       └── trade-plan-template.md
└── logs/
    └── subagent-runs/
        ├── trader-scan-2026-03-06-09-00.log
        └── exec-monitor-2026-03-06.log
```

---

## Sample Subagent Spawn Commands

### Morning Market Scan (One-shot)

```bash
openclaw sessions spawn \
  --runtime subagent \
  --agentId trader \
  --label trader-morning-$(date +%H%M) \
  --mode run \
  --task "Execute morning market scan per skills/trader/subagents/tasks/morning-scan.json. Produce WATCHLIST.md update. Alert on setups meeting all pre-trade criteria."
```

### Continuous Position Monitor (Persistent)

```bash
openclaw sessions spawn \
  --runtime subagent \
  --agentId trader \
  --label exec-monitor \
  --mode session \
  --thread \
  --task "Continuous position monitoring: Check stops every 60s. Alert if position approaches 50% of stop distance. Log all checks to trading/POSITION-LOG.md."
```

---

## Success Metrics

| Metric | Before | After Subagents |
|--------|--------|-----------------|
| Scan runtime | ~8 min sequential | ~3 min parallel |
| Failure isolation | Full session crash | Single subagent fails |
| Position monitoring | 4× daily | 24/7 continuous |
| Alert latency | 3-6 hours | <5 minutes |
| Risk check enforcement | Manual | Automated pre-flight |

---

## First Step Recommendation

**Start with Phase 1:** Convert your 09:00 Trader cron job to spawn a subagent.

1. Create `skills/trader/subagents/spawn-trader.py`
2. Modify HEARTBEAT.md job `5329c00d...` to call spawn instead of inline
3. Test with `--dry-run` first
4. Monitor for 3 days, then roll out to all 4 Trader jobs
5. Deploy continuous monitor (Phase 3) once daily jobs are stable

**Do not automate execution yet.** Keep manual approval for all trades. Subagents handle analysis, monitoring, and alerting — you handle decisions.

---

## References

- **Subagent Patterns:** osintteam.blog/multi-agent-ai-trading-system  
- **Moltbook Intel:** `memory/agent-crypto-trading-intel.md` (2026-02-25)  
- **OpenClaw Docs:** zenvanriel.com/openclaw-subagents-parallel-tasks  
- **Your Risk Framework:** `agents/trading/SOUL.md` (capital preservation rules)  
- **Current Config:** `skills/trader/config/trader-config.json` (simulation mode)

---

*Research complete. Ready to implement Phase 1 on your command.*
