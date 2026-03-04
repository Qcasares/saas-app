#!/bin/bash
# Cron Health Monitor & Self-Healing System
# Runs every 5 minutes, checks all cron jobs, auto-recovers where possible

WORKSPACE="/Users/quentincasares/.openclaw/workspace"
LOG="$WORKSPACE/logs/cron-health.log"
STATE="$WORKSPACE/memory/cron-health-state.json"
ALERT_COOLDOWN=1800  # 30 min between alerts for same issue

mkdir -p "$WORKSPACE/logs" "$WORKSPACE/memory"
touch "$LOG"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" | tee -a "$LOG"
}

# Initialize state file if missing
if [ ! -f "$STATE" ]; then
    echo '{}' > "$STATE"
fi

# Read current state
read_state() {
    cat "$STATE" 2>/dev/null || echo '{}'
}

write_state() {
    echo "$1" > "$STATE"
}

# Get cron job list
get_cron_jobs() {
    openclaw cron list --json 2>/dev/null | jq -r '.jobs[] | select(.enabled == true) | "\(.id)|\(.name)|\(.state.lastRunStatus // "unknown")|\(.state.consecutiveErrors // 0)|\(.state.lastRunAtMs // 0)"' 2>/dev/null
}

# Check if job is stuck (running > timeout threshold)
is_job_stuck() {
    local job_id="$1"
    local max_runtime_ms="${2:-600000}"  # default 10 min
    
    # Get runningAtMs if exists
    local running_at=$(openclaw cron list --json 2>/dev/null | jq -r ".jobs[] | select(.id == \"$job_id\") | .state.runningAtMs // 0")
    
    if [ "$running_at" != "0" ] && [ -n "$running_at" ]; then
        local now=$(date +%s000)
        local elapsed=$((now - running_at))
        if [ $elapsed -gt $max_runtime_ms ]; then
            echo "true"
            return
        fi
    fi
    echo "false"
}

# Auto-retry logic with exponential backoff
should_retry() {
    local job_id="$1"
    local consecutive_errors="$2"
    local state=$(read_state)
    local last_retry=$(echo "$state" | jq -r ".[\"$job_id\"].lastRetry // 0")
    local now=$(date +%s)
    
    # Exponential backoff: 5min, 10min, 20min, 40min, then hourly
    local backoff=300
    case $consecutive_errors in
        1) backoff=300 ;;   # 5 min
        2) backoff=600 ;;   # 10 min
        3) backoff=1200 ;;  # 20 min
        4) backoff=2400 ;;  # 40 min
        *) backoff=3600 ;;  # 1 hour
    esac
    
    if [ $((now - last_retry)) -gt $backoff ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Main health check
log "=== Cron Health Check Started ==="

error_count=0
fixed_count=0
alert_jobs=""

while IFS='|' read -r job_id job_name last_status consecutive_errors last_run_ms; do
    [ -z "$job_id" ] && continue
    
    log "Checking: $job_name ($job_id)"
    log "  Status: $last_status | Consecutive errors: $consecutive_errors"
    
    # Check if stuck
    stuck=$(is_job_stuck "$job_id")
    if [ "$stuck" = "true" ]; then
        log "  ⚠️ Job appears stuck (running too long)"
        # Kill stuck processes
        pkill -f "$job_id" 2>/dev/null
        log "  🔄 Killed stuck process, will retry"
        ((fixed_count++))
    fi
    
    # Handle error states
    if [ "$last_status" = "error" ] || [ "$consecutive_errors" -gt 0 ]; then
        ((error_count++))
        
        # Check if we should auto-retry
        retry=$(should_retry "$job_id" "$consecutive_errors")
        
        if [ "$retry" = "true" ]; then
            log "  🔄 Auto-retrying job (attempt with backoff)..."
            
            # Update retry timestamp
            state=$(read_state)
            new_state=$(echo "$state" | jq ".[\"$job_id\"].lastRetry = $(date +%s)")
            write_state "$new_state"
            
            # Force run the job
            openclaw cron run "$job_id" --force >/dev/null 2>&1 &
            log "  ✅ Retry initiated"
            ((fixed_count++))
        else
            log "  ⏳ In backoff period, skipping retry"
            alert_jobs="$alert_jobs\n- $job_name (${consecutive_errors} errors)"
        fi
    fi
    
done < <(get_cron_jobs)

# Summary
log "=== Summary ==="
log "Jobs with errors: $error_count"
log "Auto-fixed: $fixed_count"

# Alert if issues remain and not in cooldown
if [ -n "$alert_jobs" ] && [ "$error_count" -gt "$fixed_count" ]; then
    state=$(read_state)
    last_alert=$(echo "$state" | jq -r '.lastAlert // 0')
    now=$(date +%s)
    
    if [ $((now - last_alert)) -gt $ALERT_COOLDOWN ]; then
        # Update alert timestamp
        new_state=$(echo "$state" | jq ".lastAlert = $now")
        write_state "$new_state"
        
        # Send alert (will be picked up by OpenClaw messaging)
        log "🚨 ALERT: Cron jobs need attention:$alert_jobs"
        echo -e "Cron Health Alert:\nJobs needing attention:$alert_jobs" >> "$WORKSPACE/logs/alerts.pending"
    fi
fi

log "=== Check Complete ==="
exit 0
