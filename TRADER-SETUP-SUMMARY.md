# Trader Execution System - Setup Complete

## Summary

I've built a complete trading execution infrastructure that enables the Trader agent to execute trades via Coinbase Advanced Trade API with institutional-grade risk management.

## What's Been Built

### 1. Risk Management Layer (`risk-manager.py`)
- **Position sizing**: Max 1% of portfolio per trade
- **Daily loss limit**: 3% (trading halts if breached)
- **Approved pairs only**: BTC-USD, ETH-USD (major pairs)
- **Approval gates**: Trades >$500 require manual approval
- **Simulation mode**: All trades are paper trades by default

### 2. Coinbase Integration (`coinbase-trader.py`)
- Full Coinbase Advanced Trade API client
- Limit orders with post-only protection
- Stop-loss automation
- Order tracking and cancellation
- Comprehensive logging

### 3. Execution Engine (`trader-exec.sh`)
- Main entry point for all trades
- Validates prerequisites
- Routes through risk manager
- Executes via Coinbase or simulation
- Sends Telegram notifications

### 4. Configuration
- Default: **SIMULATION MODE** (safe to test)
- Config file at `skills/trader/config/trader-config.json`
- Environment variables for API keys

## Current Status

```
Mode: SIMULATION (paper trading)
Portfolio: $10,000 (virtual)
Risk Limits: 1% max position, 3% daily loss limit
Approved Pairs: BTC-USD, ETH-USD
```

## Testing the System

### Test 1: Risk Manager
```bash
python3 ~/.openclaw/workspace/skills/trader/scripts/risk-manager.py '
{
  "symbol": "BTC-USD",
  "side": "buy",
  "size_usd": 100,
  "price": 65000
}'
```

### Test 2: Execute Paper Trade
```bash
~/.openclaw/workspace/skills/trader/scripts/trader-exec.sh '
{
  "symbol": "BTC-USD",
  "side": "buy",
  "size_usd": 100,
  "price": 65000,
  "stop_price": 63000
}'
```

## To Enable Live Trading

### Step 1: Get Coinbase Advanced API Keys
1. Go to https://www.coinbase.com/advanced-trade/settings/api
2. Create new API key
3. **CRITICAL**: Only grant these permissions:
   - ✅ View account
   - ✅ Trade (limit orders only)
   - ❌ Withdraw (DO NOT ENABLE)
4. Set IP whitelist to your home IP
5. Copy API key and secret

### Step 2: Configure Environment
Add to `~/.zshrc`:
```bash
# Coinbase Trading
export COINBASE_API_KEY="your_key_here"
export COINBASE_API_SECRET="your_secret_here"
export TRADER_SIMULATION="false"
export TRADER_PORTFOLIO_VALUE="your_actual_portfolio_size"
```

### Step 3: Test Connection
```bash
source ~/.zshrc
python3 ~/.openclaw/workspace/skills/trader/scripts/coinbase-trader.py
```

### Step 4: Start Small
- Begin with $1000 test allocation
- First 30 days: Manual approval for ALL trades
- Review performance before scaling

## Risk Controls (Hardcoded)

These cannot be changed without code modification:

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max position | 1% | Protects against single trade wipeout |
| Daily loss | 3% | Circuit breaker to stop bad days |
| Pairs | BTC, ETH only | Major liquidity, less manipulation |
| Approval >$500 | Required | Human oversight for size |
| Stop-loss | Mandatory | Every position must have exit plan |

## Bankr Integration (Phase 2)

Bankr is an AI trading companion that uses natural language:
- "Buy $100 of BTC with stop at $60k"
- Routes through CoWSwap for best execution
- Uses Coinbase Wallet via Privy

Planned integration:
1. Natural language command parsing
2. Translation to risk manager JSON
3. Execution via Coinbase or Bankr routing

## What You Need to Decide

### 1. Capital Allocation
How much capital to allocate for automated trading?
- Recommendation: Start with 5-10% of liquid crypto portfolio
- Never trade with rent/essential money
- Accept that full loss is possible

### 2. Risk Tolerance
Current settings are conservative (1% max). Options:
- **Conservative** (current): 1% max, 3% daily stop
- **Moderate**: 2% max, 5% daily stop  
- **Aggressive**: 3% max, 10% daily stop (NOT RECOMMENDED)

### 3. Strategy
Current: Mean reversion with RSI/funding rates
- Mean reversion: Buy fear, sell greed
- Trend following: Buy strength, sell weakness
- Hybrid: Context-dependent

### 4. Automation Level
- **Level 1** (recommended): All trades require approval
- **Level 2**: Small trades (<$100) auto-execute
- **Level 3**: Full automation (NOT RECOMMENDED initially)

## Compliance Considerations

As Head of Data at Alpha Bank:
- ✅ This is personal trading activity
- ✅ Uses personal Coinbase account
- ✅ No bank systems or data involved
- ⚠️ Consider disclosure to compliance if required
- ⚠️ Document as personal for tax purposes

## Next Steps

1. **Review** `docs/TRADING-EXECUTION-ARCHITECTURE.md`
2. **Test** simulation mode for 1-2 weeks
3. **Decide** on capital allocation and risk settings
4. **Get** Coinbase API keys (view-only first)
5. **Paper trade** with $1000 virtual for 30 days
6. **Go live** only after proven simulation performance

## Emergency Procedures

### Halt All Trading
```bash
export TRADER_SIMULATION=true
```

### Cancel All Orders
```bash
# Via Coinbase web interface
# Or API call (add to scripts if needed)
```

### View Logs
```bash
tail -f ~/.openclaw/workspace/trading/logs/trader.log
```

## Files Created

```
skills/trader/
├── SKILL.md                      # Skill documentation
├── config/trader-config.json     # Configuration
├── scripts/
│   ├── risk-manager.py           # Risk validation
│   ├── coinbase-trader.py        # Coinbase API client
│   └── trader-exec.sh            # Execution engine

trading/logs/                     # Created at runtime
├── executed-trades.jsonl
├── orders.jsonl
├── simulated-trades.jsonl
└── trader.log

docs/
└── TRADING-EXECUTION-ARCHITECTURE.md  # Architecture doc
```

---

**Ready to test?** Run the simulation test above and let me know the results.
