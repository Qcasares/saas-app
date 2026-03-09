#!/bin/bash
# Strategy Controller - runs every 4 hours
# Evaluates signals and executes trades based on strategy rules

export HOME=/Users/quentincasares
export COINBASE_API_KEY="432cda88-4de6-4a58-ae8c-1dea14119479"
export COINBASE_API_SECRET='-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIDywfq18lwMOodL1pNMzL1NmIdvZLFXcxFw+atlvOiHGoAoGCCqGSM49
AwEHoUQDQgAExgvSOZA9qAoGokMf5iKDoxHkhRs+Yl9qt78uj6j01MIkO3O/51G2
meNx1DJJpLkMqcS48OHYOaF8PU8me+96+g==
-----END EC PRIVATE KEY-----'
export TRADER_SIMULATION=false

cd "$HOME/.openclaw/workspace"

# Run strategy controller
python3 skills/trader/scripts/strategy-controller.py 2>&1 | tee -a trading/logs/strategy.log

# Send Telegram notification if trades executed
if grep -q "SIGNAL:" trading/logs/strategy.log; then
    echo "Trade signals generated - check logs" | telegram-send --stdin 2>/dev/null || true
fi
