#!/bin/bash
# Emergency 5-minute monitor for critical levels
# Runs when BTC within $200 of floor or SOL within $3 of stop

LOG="/Users/quentincasares/.openclaw/workspace/trading/logs/emergency-monitor.log"

log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"
}

log "=== EMERGENCY CHECK ==="

# Run scanner
~/.openclaw/workspace/.venv/bin/python ~/.openclaw/workspace/skills/trader/scripts/coinbase-scanner.py > /dev/null 2>&1

# Check critical levels
python3 << 'PYEOF'
import json
import os

HOME = os.path.expanduser('~')
DATA_FILE = os.path.join(HOME, '.openclaw/workspace/trading/MARKET-ANALYSIS.json')
LOG_FILE = os.path.join(HOME, '.openclaw/workspace/trading/logs/emergency-monitor.log')

try:
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    btc = data['prices']['BTC-USD']['price']
    sol = data['prices']['SOL-USD']['price']
    
    BTC_FLOOR = 66385
    SOL_STOP = 78.75
    
    alerts = []
    
    # BTC check
    dist_floor = btc - BTC_FLOOR
    if btc < BTC_FLOOR:
        alerts.append(f"🚨 BTC BELOW FLOOR: ${btc:,.2f} (-${abs(dist_floor):,.2f})")
    elif btc < BTC_FLOOR + 200:
        alerts.append(f"⚠️ BTC CRITICAL: ${btc:,.2f} (+${dist_floor:,.2f} to floor)")
    
    # SOL check
    dist_stop = sol - SOL_STOP
    if sol <= SOL_STOP:
        alerts.append(f"🛑 SOL STOP HIT: ${sol:.2f}")
    elif sol < SOL_STOP + 3:
        alerts.append(f"⚠️ SOL DANGER: ${sol:.2f} (+${dist_stop:.2f} to stop)")
    
    # Log results
    with open(LOG_FILE, 'a') as f:
        if alerts:
            f.write(f"[CRITICAL] {', '.join(alerts)}\n")
            print("CRITICAL:" + "|".join(alerts))
        else:
            f.write(f"[OK] BTC: ${btc:,.2f} (+${dist_floor:,.2f}), SOL: ${sol:.2f} (+${dist_stop:.2f})\n")
            print("OK")
            
except Exception as e:
    print(f"ERROR: {e}")
PYEOF

# Run auto-stop check
~/.openclaw/workspace/.venv/bin/python ~/.openclaw/workspace/skills/trader/scripts/auto-stop.py