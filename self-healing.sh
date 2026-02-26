#!/bin/bash
# KingKong Self-Healing System
# Auto-restarts failed services and reports issues

LOG_FILE="/tmp/self-healing.log"
ALERT_LOG="/tmp/self-healing-alerts.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Self-healing check started" >> $LOG_FILE

# Services to monitor
SERVICES=(
  "com.crypto.alpha.hunter:Crypto X Bot"
  "com.moltbook.autonomous:Moltbook Bot"
  "com.kingkong.crypto.trader:Crypto Trader"
  "com.ironclaw.portforward:Ironclaw Port Forward"
  "com.tailscale.funnel.ironclaw:Tailscale Funnel"
)

RESTARTED=0
FAILED=()

for service_info in "${SERVICES[@]}"; do
  IFS=':' read -r service_name service_desc <<< "$service_info"
  
  # Check if service is running
  status=$(launchctl list | grep "$service_name" | awk '{print $1}')
  
  if [ "$status" = "-" ] || [ -z "$status" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $service_desc is stopped, restarting..." >> $LOG_FILE
    launchctl start "$service_name" 2>/dev/null
    sleep 2
    
    # Verify restart
    new_status=$(launchctl list | grep "$service_name" | awk '{print $1}')
    if [ "$new_status" != "-" ] && [ -n "$new_status" ]; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') - ✓ $service_desc restarted successfully" >> $LOG_FILE
      ((RESTARTED++))
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') - ✗ $service_desc failed to restart" >> $LOG_FILE
      FAILED+=("$service_desc")
    fi
  fi
done

# Check Bankr API
BANKR_BIN="/opt/homebrew/bin/bankr"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! $BANKR_BIN whoami >/dev/null 2>&1; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Bankr API check failed" >> $LOG_FILE
  FAILED+=("Bankr API")
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - WARNING: Disk usage at ${DISK_USAGE}%" >> $ALERT_LOG
fi

# Send alert if failures detected
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: Failed services: ${FAILED[*]}" >> $ALERT_LOG
fi

# Summary
echo "$(date '+%Y-%m-%d %H:%M:%S') - Check complete: $RESTARTED restarted, ${#FAILED[@]} failures" >> $LOG_FILE
