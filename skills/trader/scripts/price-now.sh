#!/bin/bash
# Emergency Price Check - Quick manual market snapshot
# Usage: ./price-now.sh

echo "🚨 EMERGENCY PRICE CHECK"
echo "========================"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Run the scanner
~/.openclaw/workspace/.venv/bin/python ~/.openclaw/workspace/skills/trader/scripts/coinbase-scanner.py

echo ""
echo "📊 KEY LEVELS STATUS:"
echo "---------------------"

# Read current prices and check against critical levels
python3 << 'PYEOF'
import json
from datetime import datetime

# Load current prices
try:
    with open('/Users/quentincasares/.openclaw/workspace/trading/MARKET-ANALYSIS.json', 'r') as f:
        data = json.load(f)
    
    btc_price = data['prices']['BTC-USD']['price']
    sol_price = data['prices']['SOL-USD']['price']
    
    # Critical levels
    BTC_FLOOR = 66385
    BTC_DANGER = 66000
    BTC_RECLAIM = 68200
    SOL_STOP = 78.75
    SOL_BREAKOUT = 90.0
    
    # Check BTC
    btc_dist_floor = btc_price - BTC_FLOOR
    btc_dist_danger = btc_price - BTC_DANGER
    btc_dist_reclaim = BTC_RECLAIM - btc_price
    
    print(f"BTC: ${btc_price:,.2f}")
    if btc_price < BTC_FLOOR:
        print(f"  🚨 BELOW STRATEGY FLOOR (${BTC_FLOOR:,.0f})")
        print(f"  📉 Distance to floor: ${abs(btc_dist_floor):,.2f}")
    elif btc_price < BTC_FLOOR + 200:
        print(f"  ⚠️  CRITICAL PROXIMITY to floor")
        print(f"  📏 ${btc_dist_floor:,.2f} above ${BTC_FLOOR:,.0f}")
    else:
        print(f"  ✅ Above floor: +${btc_dist_floor:,.2f}")
    
    print(f"  → ${abs(btc_dist_danger):,.2f} {'above' if btc_dist_danger > 0 else 'below'} danger zone (${BTC_DANGER:,.0f})")
    print(f"  → ${btc_dist_reclaim:,.2f} to reclaim target (${BTC_RECLAIM:,.0f})")
    
    print()
    
    # Check SOL
    sol_entry = 87.50
    sol_pnl = ((sol_price - sol_entry) / sol_entry) * 100
    
    print(f"SOL: ${sol_price:,.2f}")
    print(f"  Entry: ${sol_entry:.2f} | P&L: {sol_pnl:+.2f}%")
    
    if sol_price <= SOL_STOP:
        print(f"  🛑 STOP LOSS HIT! (${SOL_STOP:.2f})")
    elif sol_price < SOL_STOP + 2:
        print(f"  ⚠️  Near stop loss: ${sol_price - SOL_STOP:.2f} above ${SOL_STOP:.2f}")
    elif sol_price >= SOL_BREAKOUT:
        print(f"  🚀 BREAKOUT! Above ${SOL_BREAKOUT:.2f}")
    else:
        dist_breakout = SOL_BREAKOUT - sol_price
        print(f"  → ${dist_breakout:.2f} to breakout (${SOL_BREAKOUT:.2f})")
    
except Exception as e:
    print(f"Error reading data: {e}")
PYEOF

echo ""
echo "📱 Next 15-min alert: $(date -v+15M '+%H:%M %Z' 2>/dev/null || date -d '+15 minutes' '+%H:%M %Z')"