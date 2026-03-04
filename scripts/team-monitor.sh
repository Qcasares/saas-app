#!/bin/bash
# Lightweight team monitor
WORKSPACE="/Users/quentincasares/.openclaw/workspace"

# Run system monitor
bash "$WORKSPACE/trading/system-monitor.sh" >/dev/null 2>&1

# File ages (minutes)
now=$(date +%s)
intel="$WORKSPACE/intel/DAILY-INTEL.md"
market="$WORKSPACE/trading/MARKET-ANALYSIS.md"
positions="$WORKSPACE/trading/active-positions.json"

age_min() {
  f="$1"
  if [ -f "$f" ]; then
    ts=$(stat -f %m "$f")
    echo $(( (now - ts) / 60 ))
  else
    echo "NA"
  fi
}

intel_age=$(age_min "$intel")
market_age=$(age_min "$market")
positions_age=$(age_min "$positions")

# Positions count
pos_count=0
if [ -f "$positions" ]; then
  pos_count=$(python3 - <<'PY'
import json
import os
p=os.path.expanduser('~/.openclaw/workspace/trading/active-positions.json')
try:
    data=json.load(open(p))
    print(len(data))
except Exception:
    print(0)
PY
  )
fi

# Output summary
status="GREEN"
msg="Team Monitor: OK"

if [ "$market_age" != "NA" ] && [ "$market_age" -gt 180 ]; then
  status="YELLOW"; msg="Market analysis stale (${market_age}m)";
fi
if [ "$intel_age" != "NA" ] && [ "$intel_age" -gt 360 ]; then
  status="YELLOW"; msg="Intel stale (${intel_age}m)";
fi

printf "%s | %s | Intel age: %sm | Market age: %sm | Positions: %s\n" "$status" "$msg" "$intel_age" "$market_age" "$pos_count"
