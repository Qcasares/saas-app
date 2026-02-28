#!/bin/zsh
# run-trading-agent.sh — Market scan and trade analysis
# Schedule: Multiple times daily during trading hours

export OPENCLAW_WORKSPACE=/Users/quentincasares/.openclaw/workspace
export GOG_ACCOUNT=qcasares@gmail.com

cd "$OPENCLAW_WORKSPACE"

# Ensure trading directory exists
mkdir -p trading

# Spawn sub-agent with trading context
openclaw sessions spawn \
  --runtime subagent \
  --mode run \
  --label "trading-scan-$(date +%Y%m%d-%H%M)" \
  --task "You are the Crypto Day Trader agent. Read your SOUL.md at agents/trading/SOUL.md and AGENTS.md for your role and framework.

Perform a market scan:
1. Review major crypto markets (BTC, ETH, key altcoins)
2. Identify higher timeframe structure (4H, Daily)
3. Note key support/resistance levels
4. Check Fear & Greed Index and general sentiment
5. Look for valid trade setups meeting all criteria (R:R 1:2, clear technicals, defined stop)
6. Complete pre-trade checklist for any valid setups

Output your findings to:
- trading/MARKET-ANALYSIS.md (daily market assessment)
- trading/WATCHLIST.md (active setups to monitor)
- If valid setup found with all criteria met, document full trade plan

Send brief summary to Q via Telegram at 8135433560 if any Alert or Execute level opportunities exist."