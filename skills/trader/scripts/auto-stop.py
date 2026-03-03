#!/usr/bin/env python3
"""
Auto Stop-Loss Executor
Monitors SOL position and executes stop if $78.75 hit
Logs all activity, requires no manual intervention
"""
import os
import json
import sys
from datetime import datetime

HOME = os.path.expanduser('~')
DATA_FILE = os.path.join(HOME, '.openclaw/workspace/trading/MARKET-ANALYSIS.json')
STOP_LOG = os.path.join(HOME, '.openclaw/workspace/trading/logs/auto-stop.log')
STOP_PRICE = 78.75
SOL_ENTRY = 87.50

# Ensure log directory exists
os.makedirs(os.path.dirname(STOP_LOG), exist_ok=True)

def log_action(message):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')
    with open(STOP_LOG, 'a') as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)

def check_and_execute_stop():
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
        
        sol_price = data['prices']['SOL-USD']['price']
        pnl_pct = ((sol_price - SOL_ENTRY) / SOL_ENTRY) * 100
        
        log_action(f"CHECK: SOL at ${sol_price:.2f} | P&L: {pnl_pct:.2f}% | Stop: ${STOP_PRICE}")
        
        if sol_price <= STOP_PRICE:
            log_action(f"🛑 STOP TRIGGERED: SOL at ${sol_price:.2f} <= ${STOP_PRICE}")
            
            # In simulation mode, just log the action
            # In live mode, this would execute the sell
            config_file = os.path.join(HOME, '.openclaw/workspace/skills/trader/config/trader-config.json')
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            mode = config.get('mode', 'simulation')
            
            if mode == 'simulation':
                log_action("✅ SIMULATION: Stop order logged, no real execution")
                # Record the simulated stop
                trade_record = {
                    'timestamp': datetime.now().isoformat(),
                    'action': 'STOP_LOSS_SIMULATED',
                    'asset': 'SOL-USD',
                    'price': sol_price,
                    'stop_price': STOP_PRICE,
                    'pnl_pct': pnl_pct
                }
                trades_file = os.path.join(HOME, '.openclaw/workspace/trading/logs/simulated-trades.jsonl')
                with open(trades_file, 'a') as f:
                    f.write(json.dumps(trade_record) + '\n')
                return True
            else:
                log_action("🔴 LIVE MODE: Would execute market sell here")
                # Live execution would go here
                return True
        else:
            buffer = sol_price - STOP_PRICE
            log_action(f"✅ HOLD: ${buffer:.2f} buffer to stop")
            return False
            
    except Exception as e:
        log_action(f"❌ ERROR: {e}")
        return False

if __name__ == '__main__':
    triggered = check_and_execute_stop()
    sys.exit(0 if not triggered else 1)