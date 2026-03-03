#!/usr/bin/env python3
"""
Execute Trade - BTC Long Entry
Reclaim of $68,200 confirmed, entering with stop at Strategy Floor
"""
import os
import json
from datetime import datetime

HOME = os.path.expanduser('~')
TRADE_LOG = os.path.join(HOME, '.openclaw/workspace/trading/logs/executed-trades.jsonl')

# Trade parameters
TRADE = {
    "timestamp": datetime.now().isoformat(),
    "action": "BUY",
    "symbol": "BTC-USD",
    "entry_price": 68396.32,
    "stop_loss": 66385,
    "take_profit": 72000,
    "size_usd": 100,
    "size_btc": round(100 / 68396.32, 6),
    "risk_usd": round(100 * (68396.32 - 66385) / 68396.32, 2),
    "risk_pct": 2.94,
    "reason": "BTC reclaimed $68,200 Strategy level, bullish structure restored",
    "status": "SIMULATED"
}

print("🚀 EXECUTING TRADE")
print("=" * 50)
print(f"Action: {TRADE['action']} {TRADE['symbol']}")
print(f"Entry: ${TRADE['entry_price']:,.2f}")
print(f"Size: ${TRADE['size_usd']} ({TRADE['size_btc']} BTC)")
print(f"Stop: ${TRADE['stop_loss']:,.2f}")
print(f"Target: ${TRADE['take_profit']:,.2f}")
print(f"Risk: ${TRADE['risk_usd']} ({TRADE['risk_pct']}%)")
print(f"Reason: {TRADE['reason']}")
print(f"Mode: {TRADE['status']}")
print("=" * 50)

# Log the trade
os.makedirs(os.path.dirname(TRADE_LOG), exist_ok=True)
with open(TRADE_LOG, 'a') as f:
    f.write(json.dumps(TRADE) + '\n')

print(f"\n✅ Trade logged to: {TRADE_LOG}")
print(f"⏰ Entry time: {TRADE['timestamp']}")