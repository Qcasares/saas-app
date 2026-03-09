#!/bin/bash
# Daily P&L Report - runs at 9 PM daily
# Calculates daily performance and sends summary

export HOME=/Users/quentincasares
export COINBASE_API_KEY="432cda88-4de6-4a58-ae8c-1dea14119479"
export COINBASE_API_SECRET='-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIDywfq18lwMOodL1pNMzL1NmIdvZLFXcxFw+atlvOiHGoAoGCCqGSM49
AwEHoUQDQgAExgvSOZA9qAoGokMf5iKDoxHkhRs+Yl9qt78uj6j01MIkO3O/51G2
meNx1DJJpLkMqcS48OHYOaF8PU8me+96+g==
-----END EC PRIVATE KEY-----'

cd "$HOME/.openclaw/workspace"

# Generate EOD report
python3 skills/trader/scripts/coinbase-trader.py report --live 2>&1 | tee trading/logs/daily-report-$(date +%Y%m%d).log

# Archive old logs (keep 30 days)
find trading/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
