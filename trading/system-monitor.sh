#!/bin/bash
# Trading System Monitor - Keeps 24/7 operations running

WORKSPACE="/Users/quentincasares/.openclaw/workspace"
LOG="$WORKSPACE/trading/system-monitor.log"

echo "$(date): Checking trading system status..." >> $LOG

# Check position monitor
if ! pgrep -f "monitor_positions.py --mode live" > /dev/null; then
    echo "$(date): Position monitor not running. Restarting..." >> $LOG
    cd $WORKSPACE
    nohup python3 skills/sherlock-trader-bridge/scripts/monitor_positions.py --mode live > trading/monitor.log 2>&1 &
    echo "$(date): Position monitor restarted (PID: $!)" >> $LOG
else
    echo "$(date): Position monitor OK" >> $LOG
fi

# Check for stuck cron jobs (run >30 min)
STUCK_JOBS=$(ps aux | grep "agentTurn" | grep -v grep | awk '{if ($10 ~ /[0-9]+:[0-9]+/ && int(substr($10,1,2))*60 + int(substr($10,4,2)) > 30) print $2}')
if [ -n "$STUCK_JOBS" ]; then
    echo "$(date): Killing stuck jobs: $STUCK_JOBS" >> $LOG
    kill -9 $STUCK_JOBS 2>/dev/null
fi

echo "$(date): System check complete" >> $LOG
