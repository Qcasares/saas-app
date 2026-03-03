---
name: sherlock-trader-bridge
description: Integration layer connecting Sherlock research intelligence to Trader execution. Converts intel reports into actionable trade signals with risk validation, executes orders, and manages profit-taking. Use when research needs to flow into trading decisions or when automated trade execution from signals is required.
requires:
  bins:
    - python3
  files:
    - skills/trader/config/trader-config.json
    - intel/SHERLOCK-*.md
---

# Sherlock-Trader Bridge

*Research-driven trading execution with automated profit management.*

## Overview

This bridge creates a seamless pipeline:
```
Sherlock Intel → Signal Extraction → Risk Validation → Order Execution → Position Monitoring → Profit Taking
```

## Signal Flow

### 1. Sherlock Generates Intel
```bash
python3 skills/sherlock/scripts/daily_sweep.py
# Outputs: intel/SHERLOCK-YYYY-MM-DD.md
```

### 2. Bridge Extracts Signals
```bash
python3 skills/sherlock-trader-bridge/scripts/extract_signals.py \
  --intel intel/SHERLOCK-2026-03-03.md \
  --output signals/pending-signals.json
```

### 3. Risk Validation
```bash
python3 skills/sherlock-trader-bridge/scripts/validate_signals.py \
  --config skills/trader/config/trader-config.json \
  --signals signals/pending-signals.json \
  --output signals/validated-signals.json
```

### 4. Execute Trades
```bash
python3 skills/sherlock-trader-bridge/scripts/execute_signals.py \
  --signals signals/validated-signals.json \
  --mode live  # or simulation
```

### 5. Monitor & Profit Take
```bash
python3 skills/sherlock-trader-bridge/scripts/monitor_positions.py
```

## Signal Schema

```json
{
  "signal_id": "sig-20260303-001",
  "source": "sherlock",
  "timestamp": "2026-03-03T09:45:00Z",
  "asset": "NEAR-USD",
  "direction": "LONG",
  "confidence": 0.85,
  "setup_type": "momentum_breakout",
  "entry": {
    "price": 1.34,
    "type": "market",
    "urgency": "immediate"
  },
  "targets": [
    {"price": 1.45, "size_pct": 0.50, "label": "TP1"},
    {"price": 1.55, "size_pct": 0.50, "label": "TP2"}
  ],
  "stop_loss": 1.24,
  "position_size": {
    "max_risk_pct": 0.02,
    "max_position_pct": 0.10
  },
  "rationale": "Anomaly: +14% on $20M volume, validator program catalyst",
  "timeframe": "swing",
  "expiration": "2026-03-04T09:45:00Z"
}
```

## Risk Validation Rules

The bridge enforces these before execution:

| Rule | Action on Violation |
|------|-------------------|
| Asset in approved_pairs | Reject signal |
| Position size ≤ max_position_pct | Reduce size |
| Risk ≤ max_risk_pct | Reject or reduce |
| Stop loss required | Add default (-5%) |
| At least 1 profit target | Add default (+8%) |
| Daily loss limit not exceeded | Queue for tomorrow |

## Automated Profit Taking

### Position Monitoring
- Check every 5 minutes during market hours
- Track unrealized P&L vs targets
- Auto-exit on target hit or stop loss

### Profit Taking Strategy
```
Target 1 (50% position): +8% from entry
Target 2 (30% position): +15% from entry  
Target 3 (20% position): +25% from entry or trailing stop
```

### Trailing Stop Activation
- After TP1 hits: Activate trailing stop at -3%
- After TP2 hits: Tighten to -1.5%
- After TP3 hits: Tighten to -0.5% (protect gains)

## Squad Coordination

### KingKong (Orchestrator)
- Reviews high-confidence signals before execution
- Overrides for market conditions
- Emergency stop on system issues

### Sherlock → Bridge
- Provides intel with clear signals
- Flags anomalies and catalysts
- Updates confidence scores

### Bridge → Trader
- Executes validated signals
- Logs all actions
- Reports P&L

## Commands

### Run Full Pipeline
```bash
python3 skills/sherlock-trader-bridge/scripts/full_pipeline.py
```

### Manual Signal Entry
```bash
python3 skills/sherlock-trader-bridge/scripts/create_signal.py \
  --asset NEAR-USD \
  --direction LONG \
  --entry 1.34 \
  --stop 1.24 \
  --target 1.45 \
  --risk 0.02
```

### Emergency Close All
```bash
python3 skills/sherlock-trader-bridge/scripts/emergency_close.py
```

### View Active Positions
```bash
python3 skills/sherlock-trader-bridge/scripts/positions.py --active
```

### View P&L Report
```bash
python3 skills/sherlock-trader-bridge/scripts/pnl_report.py --today
```

## Configuration

Edit `config/bridge-config.json`:

```json
{
  "signal_threshold": 0.75,
  "auto_execute": false,
  "require_approval_above_usd": 500,
  "profit_taking": {
    "enabled": true,
    "tp1_pct": 0.08,
    "tp2_pct": 0.15,
    "tp3_pct": 0.25,
    "trailing_after_tp1": true
  },
  "notifications": {
    "on_signal": true,
    "on_entry": true,
    "on_exit": true,
    "on_target_hit": true,
    "on_stop_loss": true
  }
}
```

## Files

- `scripts/extract_signals.py` — Parse Sherlock intel into signals
- `scripts/validate_signals.py` — Risk check and sizing
- `scripts/execute_signals.py` — Place orders via Trader
- `scripts/monitor_positions.py` — Profit taking and stops
- `scripts/full_pipeline.py` — Run complete flow
- `config/bridge-config.json` — Bridge settings

---

*Research without execution is just entertainment. Execution without research is just gambling.*
