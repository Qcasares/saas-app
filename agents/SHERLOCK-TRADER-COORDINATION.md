# Sherlock-Trader Coordination Protocol

*KingKong's directive: Seamless intelligence-to-profit pipeline.*

## Squad Roles

### Sherlock (Intelligence)
**Responsibility:** Discover opportunities through research
- Runs daily sweeps (8 AM, 2 PM, 8 PM)
- Flags anomalies and momentum signals
- Provides confidence scores with rationale
- **Does NOT execute trades**

### Trader (Execution)
**Responsibility:** Execute and manage positions
- Validates signals against risk limits
- Places entry orders
- Manages stops and profit-taking
- Reports P&L back to squad
- **Does NOT generate signals**

### Bridge (Integration Layer)
**Responsibility:** Translate intel into actionable trades
- Extracts signals from Sherlock reports
- Validates against Trader config
- Routes approved signals to execution
- Monitors position lifecycle

## Operational Rhythm

### Morning Routine (8:00 AM)
```
Sherlock: Run full sweep → Generate intel report
    ↓
Bridge: Extract signals → Validate → Queue for approval
    ↓
KingKong: Review high-confidence signals → Approve/reject
    ↓
Trader: Execute approved signals → Begin monitoring
```

### Afternoon Check (2:00 PM)
```
Sherlock: Market update sweep
    ↓
Bridge: New signals + position health check
    ↓
Trader: Adjust stops on open positions if needed
```

### Evening Review (8:00 PM)
```
Sherlock: Final sweep + anomaly detection
    ↓
Bridge: Overnight risk assessment
    ↓
Trader: Set protective stops for overnight
```

## Decision Authority Matrix

| Decision | Authority | Condition |
|----------|-----------|-----------|
| Signal generation | Sherlock | Automatic |
| Signal validation | Bridge | Automatic |
| Trade execution | Trader | **REQUIRES HUMAN APPROVAL** — Simulation mode default |
| Stop adjustment | Trader | Automatic after TP1 hit (on approved positions) |
| Emergency close | Trader | Immediate on stop loss (protective) |
| Strategy activation | KingKong | **Human approval required** before live execution |

## Signal Confidence Levels

| Confidence | Action | Human Review |
|------------|--------|--------------|
| 90%+ | Auto-execute up to $1,000 | Report only |
| 75-89% | Execute with standard size | Report only |
| 60-74% | Queue for approval | Notify KingKong |
| <60% | Reject | Log only |

## Communication Protocol

### Sherlock → Bridge
- Structured JSON signals
- Include: entry, stop, targets, rationale, confidence
- Timestamp and source attribution

### Bridge → Trader
- Validated signals with position sizing
- Risk check confirmation
- Execution mode (sim/live)

### Trader → Squad
- Entry confirmations with order IDs
- Position updates (every 5 min during market hours)
- P&L reports (on exit, EOD)
- Alert on stop loss or target hit

## Profit-Taking Discipline

### Standard Rules (Applied Automatically)
1. **TP1 (+8%)**: Close 50%, move stop to breakeven
2. **TP2 (+15%)**: Close 30%, activate trailing stop at -3%
3. **TP3 (+25%)**: Close 20%, tighten trailing to -1%

### Exception Handling
- If momentum accelerates past TP2: Hold 20% with trailing
- If reversal before TP1: Honor stop loss, no exceptions
- Gap up/down: Cancel pending, reassess

## Error Handling

| Issue | Response | Escalation |
|-------|----------|------------|
| Sherlock API fail | Retry 2x, then skip | Report at EOD |
| Signal validation fail | Log rejection | No escalation |
| Trade execution fail | Retry once, then alert | Immediate to KingKong |
| Monitor connection lost | Retry every 30s | Alert after 5 min |
| Stop loss missed | Market close immediately | Immediate to KingKong |

## Coordination Commands

### Manual Override
```bash
# KingKong can trigger at any time
python3 skills/sherlock-trader-bridge/scripts/emergency_close.py
python3 skills/sherlock-trader-bridge/scripts/pause_trading.py
python3 skills/sherlock-trader-bridge/scripts/resume_trading.py
```

### Status Check
```bash
# View current state
python3 skills/sherlock-trader-bridge/scripts/status.py
# Shows: Open positions, pending signals, today's P&L
```

### Schedule Management
```bash
# View upcoming runs
openclaw cron list | grep -E "(sherlock|trader)"

# Force immediate sweep
python3 skills/sherlock/scripts/daily_sweep.py

# Force position check
python3 skills/sherlock-trader-bridge/scripts/monitor_positions.py --once
```

## Success Metrics

**Daily KPIs (Auto-reported):**
- Signals generated → Validated → Executed
- Win rate (% of profitable trades)
- Average profit per winning trade
- Average loss per losing trade
- Risk-adjusted return (R-multiples)

**Weekly Review:**
- Strategy performance vs benchmark
- Sherlock signal accuracy
- Trader execution quality
- Coordination efficiency

## Current Status

| Component | Status | Last Run |
|-----------|--------|----------|
| Sherlock | ✅ Operational | 2026-03-03 09:45 |
| Bridge | ✅ Operational | Not yet run |
| Trader | ✅ Operational | Not yet run |
| Monitor | 🟡 Standby | Not started |

## Immediate Actions Required

1. **Approve signal list** for today's opportunities
2. **Confirm live trading** or remain in simulation
3. **Set daily loss limit** (currently 3% of portfolio)
4. **Schedule cron jobs** for automated runs

---

*Protocol version: 1.0*
*Effective: 2026-03-03*
*Owner: KingKong*
