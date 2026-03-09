#!/bin/bash
# Hourly Market Scan for Trader Agent
# Runs every hour to update price data and market analysis

export HOME=/Users/quentincasares
export COINBASE_API_KEY="432cda88-4de6-4a58-ae8c-1dea14119479"
export COINBASE_API_SECRET='-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIDywfq18lwMOodL1pNMzL1NmIdvZLFXcxFw+atlvOiHGoAoGCCqGSM49
AwEHoUQDQgAExgvSOZA9qAoGokMf5iKDoxHkhRs+Yl9qt78uj6j01MIkO3O/51G2
meNx1DJJpLkMqcS48OHYOaF8PU8me+96+g==
-----END EC PRIVATE KEY-----'

cd "$HOME/.openclaw/workspace"

# Update market analysis
python3 skills/trader/scripts/coinbase-scanner.py --output trading/MARKET-ANALYSIS.json 2>&1 | tee -a trading/logs/hourly-scan.log

# Log timestamp
echo "[$(date -Iseconds)] Hourly scan complete" >> trading/logs/hourly-scan.log
