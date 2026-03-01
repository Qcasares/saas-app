---
name: trader
description: Autonomous crypto trading execution with risk management. Interfaces with Coinbase Advanced Trade API and Bankr for trade execution while enforcing strict risk limits.
metadata:
  openclaw:
    emoji: 📈
    os: [darwin, linux]
    requires:
      bins: [python3]
      env:
        - COINBASE_API_KEY (optional, for live trading)
        - COINBASE_API_SECRET (optional, for live trading)
        - TRADER_SIMULATION (default: true)
---

# Trader Skill

Execute crypto trades with institutional-grade risk management.

## ⚠️ IMPORTANT: Risk Warning

This skill enables automated trading of cryptocurrency. By default, it runs in **SIMULATION MODE** (paper trading). Live trading requires:

1. Explicit environment variable: `TRADER_SIMULATION=false`
2. Valid Coinbase Advanced Trade API credentials
3. Manual approval for trades >$500
4. Acceptance of trading risks

## Features

- **Risk Management**: Position sizing, daily loss limits, approved pairs only
- **Simulation Mode**: Test strategies without real capital
- **Coinbase Integration**: Direct API access for order execution
- **Trade Logging**: All activity logged to `trading/logs/`
- **Stop-Loss Automation**: Mandatory stops on every position

## Configuration

### Environment Variables

```bash
# Required for live trading
export COINBASE_API_KEY="your_api_key"
export COINBASE_API_SECRET="your_api_secret"

# Risk settings
export TRADER_SIMULATION="true"  # Set to "false" for live trading
export TRADER_PORTFOLIO_VALUE="10000"  # Your portfolio size for % calculations
```

### Risk Limits (Non-Configurable)

| Setting | Value | Description |
|---------|-------|-------------|
| Max Position | 1% | Single trade max |
| Daily Loss Limit | 3% | Trading halts if reached |
| Approved Pairs | BTC, ETH | Major pairs only |
| Approval Threshold | $500 | Manual approval required above |

## Usage

### Test Risk Manager

```bash
python3 ~/.openclaw/workspace/skills/trader/scripts/risk-manager.py '
{
  "symbol": "BTC-USD",
  "side": "buy",
  "size_usd": 100,
  "price": 65000
}'
```

### Execute a Trade (Simulation)

```bash
export TRADER_SIMULATION=true
~/.openclaw/workspace/skills/trader/scripts/trader-exec.sh '
{
  "symbol": "BTC-USD",
  "side": "buy",
  "size_usd": 100,
  "price": 65000,
  "stop_price": 63000
}'
```

### Check Coinbase Connection

```bash
export TRADER_SIMULATION=false
export COINBASE_API_KEY="..."
export COINBASE_API_SECRET="..."
python3 ~/.openclaw/workspace/skills/trader/scripts/coinbase-trader.py
```

## File Structure

```
skills/trader/
├── scripts/
│   ├── risk-manager.py      # Risk validation engine
│   ├── coinbase-trader.py   # Coinbase API client
│   └── trader-exec.sh       # Main execution script
└── logs/                    # Trade logs (created at runtime)
    ├── executed-trades.jsonl
    ├── orders.jsonl
    ├── simulated-trades.jsonl
    └── trader.log
```

## Integration with Trader Agent

The Trader agent can now call:

```bash
# From its cron job or agent task
~/.openclaw/workspace/skills/trader/scripts/trader-exec.sh '<trade_json>'
```

## Bankr Integration (Future)

Bankr uses natural language for trading. Planned integration:

```bash
# Example Bankr command
bankr "buy $100 of BTC with a stop at $60k"
```

This would be translated to the risk manager and executed via Coinbase.

## Safety Features

1. **No Withdrawal Permissions**: API keys should NOT have withdrawal rights
2. **IP Whitelisting**: Restrict API access to known IPs
3. **Rate Limiting**: Built into Coinbase client
4. **Audit Trail**: Every action logged with timestamp
5. **Emergency Stop**: Set `TRADER_SIMULATION=true` to halt live trading

## Compliance

- Trading is personal activity, separate from Alpha Bank duties
- All activity logged for tax/regulatory reporting
- No use of bank systems or data

## Support

For issues or questions, check:
- `trading/logs/trader.log` for execution logs
- `trading/logs/executed-trades.jsonl` for trade history
- Coinbase API docs: https://docs.cdp.coinbase.com/
