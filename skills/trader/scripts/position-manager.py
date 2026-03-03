#!/usr/bin/env python3
"""
Take Profit / Position Manager
Evaluates current positions and executes take profits or adds to winners
"""
import os
import json
from datetime import datetime

HOME = os.path.expanduser('~')
DATA_FILE = os.path.join(HOME, '.openclaw/workspace/trading/MARKET-ANALYSIS.json')
ACTION_LOG = os.path.join(HOME, '.openclaw/workspace/trading/logs/trading-actions.log')

def log_action(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] {msg}")
    with open(ACTION_LOG, 'a') as f:
        f.write(f"[{ts}] {msg}\n")

def evaluate_positions():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    btc = data['prices']['BTC-USD']['price']
    sol = data['prices']['SOL-USD']['price']
    
    # Key levels
    BTC_RECLAIM = 68200
    SOL_BREAKOUT = 90.0
    SOL_ENTRY = 87.50
    SOL_STOP = 78.75
    
    sol_pnl = ((sol - SOL_ENTRY) / SOL_ENTRY) * 100
    
    actions = []
    
    # BTC Analysis
    if btc > BTC_RECLAIM:
        actions.append(f"🟢 BTC reclaimed ${BTC_RECLAIM:,.0f} (currently ${btc:,.2f})")
        actions.append("   → Bullish structure restored")
        actions.append("   → Can consider new long entries")
    
    # SOL Analysis
    if sol >= SOL_BREAKOUT:
        actions.append(f"🚀 SOL broke out above ${SOL_BREAKOUT}!")
        actions.append("   → Take profit or add to position")
    elif sol > SOL_ENTRY:
        actions.append(f"📈 SOL above entry (${SOL_ENTRY}), P&L: +{sol_pnl:.2f}%")
        actions.append("   → Move stop to breakeven (${:.2f})".format(SOL_ENTRY * 0.995))
    elif sol > SOL_STOP + 5:
        actions.append(f"🟡 SOL holding, P&L: {sol_pnl:.2f}%")
        actions.append(f"   → Buffer to stop: ${sol - SOL_STOP:.2f}")
    else:
        actions.append(f"🔴 SOL close to stop, P&L: {sol_pnl:.2f}%")
    
    return actions, btc, sol, sol_pnl

if __name__ == '__main__':
    log_action("=" * 50)
    log_action("TRADING ACTION EVALUATION")
    log_action("=" * 50)
    
    actions, btc, sol, pnl = evaluate_positions()
    
    for action in actions:
        log_action(action)
    
    # Output for Telegram
    print("\n".join(actions))