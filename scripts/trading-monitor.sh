#!/bin/bash
# Autonomous Crypto Trading Monitor
# Runs every hour to check market conditions and execute strategies

# Configuration
LOG_FILE="$HOME/.openclaw/workspace/memory/trading-logs/$(date +%Y-%m-%d)-trades.log"
RESEARCH_DIR="$HOME/.openclaw/workspace/memory/trading-research"
ALERT_THRESHOLD=5  # Alert if portfolio moves >5%
BANKR_BIN="/opt/homebrew/bin/bankr"

# Ensure PATH includes Homebrew for cron/launchd
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Ensure log directory exists
mkdir -p "$HOME/.openclaw/workspace/memory/trading-logs"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get current portfolio balance
log "=== Trading Monitor Check ==="
log "Checking portfolio balance..."

BALANCE_OUTPUT=$($BANKR_BIN prompt "What is my total portfolio balance in USD?" 2>/dev/null)
log "Balance: $BALANCE_OUTPUT"

# Get top movers
log "Checking top movers..."
MOVERS=$($BANKR_BIN prompt "Show me the top 5 tokens with highest price increase in the last 24 hours on Base" 2>/dev/null)
log "Top movers: $MOVERS"

# Check for limit order triggers (manual monitoring until automated)
log "Checking market conditions..."

# Log completion
log "Monitor check complete. Next check in 1 hour."
echo "---" >> "$LOG_FILE"
