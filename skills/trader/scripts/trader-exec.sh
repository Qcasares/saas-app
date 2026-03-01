#!/bin/bash
#
# Trader Execution Script
# Main entry point for trade execution with risk management
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$HOME/.openclaw/workspace"
TRADING_DIR="$WORKSPACE_DIR/trading"
LOGS_DIR="$TRADING_DIR/logs"

# Ensure directories exist
mkdir -p "$LOGS_DIR"

# Configuration
SIMULATION_MODE="${TRADER_SIMULATION:-true}"
PORTFOLIO_VALUE="${TRADER_PORTFOLIO_VALUE:-10000}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGS_DIR/trader.log"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log "ERROR: Python3 not found"
        exit 1
    fi
    
    # Check if simulation or live
    if [ "$SIMULATION_MODE" = "true" ]; then
        log "Mode: SIMULATION (paper trading)"
    else
        log "Mode: LIVE TRADING"
        
        # Verify API keys
        if [ -z "$COINBASE_API_KEY" ] || [ -z "$COINBASE_API_SECRET" ]; then
            log "ERROR: Coinbase API credentials not set"
            log "Set COINBASE_API_KEY and COINBASE_API_SECRET"
            exit 1
        fi
        
        # Safety confirmation
        log "⚠️  LIVE TRADING ENABLED"
        log "Portfolio value: $PORTFOLIO_VALUE"
    fi
}

# Execute a trade
execute_trade() {
    local trade_json="$1"
    
    log "Validating trade: $trade_json"
    
    # Run risk manager
    local validation
    validation=$(python3 "$SCRIPT_DIR/risk-manager.py" "$trade_json" 2>&1)
    
    log "Risk validation result:"
    echo "$validation" | tee -a "$LOGS_DIR/trader.log"
    
    # Check if approved
    if echo "$validation" | grep -q '"approved": true'; then
        log "Trade approved"
        
        # Check if simulation
        if echo "$validation" | grep -q '"simulation": true'; then
            log "Executing SIMULATION trade"
            echo "$validation" >> "$LOGS_DIR/simulated-trades.jsonl"
        else
            log "Executing LIVE trade"
            
            # Check if manual approval required
            if echo "$validation" | grep -q '"requires_approval": true'; then
                log "⚠️  MANUAL APPROVAL REQUIRED for trade >$500"
                log "Trade queued for approval"
                echo "$validation" >> "$LOGS_DIR/pending-approval.jsonl"
                
                # Send notification to Telegram
                # This would call a notification script
                return 0
            fi
            
            # Execute via Coinbase
            python3 "$SCRIPT_DIR/coinbase-trader.py" <<< "$trade_json" 2>&1 | tee -a "$LOGS_DIR/trader.log"
        fi
        
        return 0
    else
        log "Trade REJECTED"
        return 1
    fi
}

# Main entry point
main() {
    log "=" && log "Trader Execution Script Started" && log "="
    
    check_prerequisites
    
    # If called with a trade JSON, execute it
    if [ -n "$1" ]; then
        execute_trade "$1"
    else
        log "No trade provided. Usage: $0 '{\"symbol\": \"BTC-USD\", ...}'"
        
        # Run diagnostics
        log "Running diagnostics..."
        python3 "$SCRIPT_DIR/coinbase-trader.py" 2>&1 | head -50 | tee -a "$LOGS_DIR/trader.log"
    fi
    
    log "=" && log "Trader Execution Complete" && log "="
}

main "$@"
