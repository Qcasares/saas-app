#!/usr/bin/env python3
# Telegram /price command handler
# Outputs formatted price report for Telegram

import json
import subprocess
import os
from datetime import datetime

# Get the actual home directory
HOME = os.path.expanduser('~')
VENV_PYTHON = os.path.join(HOME, '.openclaw/workspace/.venv/bin/python')
SCANNER = os.path.join(HOME, '.openclaw/workspace/skills/trader/scripts/coinbase-scanner.py')
DATA_FILE = os.path.join(HOME, '.openclaw/workspace/trading/MARKET-ANALYSIS.json')

# Run scanner first
subprocess.run([VENV_PYTHON, SCANNER], capture_output=True)

# Load the generated JSON
try:
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    btc = data['prices']['BTC-USD']['price']
    eth = data['prices']['ETH-USD']['price']
    sol = data['prices']['SOL-USD']['price']
    
    # Critical levels
    BTC_FLOOR = 66385
    BTC_DANGER = 66000
    BTC_RECLAIM = 68200
    SOL_STOP = 78.75
    SOL_BREAKOUT = 90.0
    SOL_ENTRY = 87.50
    
    # Calculate distances
    dist_floor = btc - BTC_FLOOR
    dist_danger = btc - BTC_DANGER
    dist_reclaim = BTC_RECLAIM - btc
    
    sol_dist_stop = sol - SOL_STOP
    sol_dist_breakout = SOL_BREAKOUT - sol
    sol_pnl = ((sol - SOL_ENTRY) / SOL_ENTRY) * 100
    
    # Format output
    print("📊 *INSTANT PRICE CHECK*")
    print(f"⏰ {datetime.now().strftime('%H:%M %Z')} | {datetime.now().strftime('%d %b %Y')}")
    print("")
    print("💰 *Live Prices:*")
    print(f"• BTC: ${btc:,.2f}")
    print(f"• ETH: ${eth:,.2f}")
    print(f"• SOL: ${sol:,.2f} (*{sol_pnl:+.2f}%*)")
    print("")
    
    # BTC status
    if btc < BTC_FLOOR:
        print(f"🚨 *BTC BELOW STRATEGY FLOOR*")
        print(f"   Floor: ${BTC_FLOOR:,.0f} | Below by: ${abs(dist_floor):,.2f}")
    elif btc < BTC_FLOOR + 200:
        print(f"⚠️ *BTC CRITICAL: ${dist_floor:,.2f} above floor*")
    else:
        print(f"✅ BTC: ${dist_floor:,.2f} above floor")
    
    print(f"   → ${dist_danger:,.2f} to danger zone (${BTC_DANGER:,.0f})")
    print(f"   → ${dist_reclaim:,.2f} to reclaim (${BTC_RECLAIM:,.0f})")
    print("")
    
    # SOL status
    if sol <= SOL_STOP:
        print(f"🛑 *SOL STOP LOSS HIT! Exit now.*")
    elif sol < SOL_STOP + 2:
        print(f"⚠️ *SOL Near Stop: ${sol_dist_stop:.2f} buffer remaining*")
    elif sol >= SOL_BREAKOUT:
        print(f"🚀 *SOL BREAKOUT! Above ${SOL_BREAKOUT:.2f}*")
    else:
        print(f"🟡 SOL: ${sol_dist_stop:.2f} to stop | ${sol_dist_breakout:.2f} to breakout")
    
    print("")
    print("⏱️ Auto-check: every 15 min")
    print("📉 Funding: coinglass.com/FundingRate")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Try again in a moment...")