# Trading Execution Architecture

## Overview
Enable Trader agent to execute trades via Bankr/Coinbase while maintaining strict risk controls.

## Risk Framework (Non-Negotiable)

### Tier 1: Simulation Mode (Default)
- All trades are paper trades
- Tracks performance without real capital
- Validates strategy before live deployment

### Tier 2: Limited Live Trading (Requires Explicit Enable)
- Max 1% of portfolio per trade (vs 2% in SOUL.md)
- Daily loss limit: 3% of portfolio
- Only BTC/ETH major pairs
- Mandatory stop-loss on every trade
- Human approval required for entries >$500

### Tier 3: Full Autonomy (NOT RECOMMENDED)
- Would require explicit override
- Not proposed at this time

## Required Setup

### 1. Coinbase Advanced Trade API
```bash
# Create API key at:
# https://www.coinbase.com/advanced-trade/settings/api
# Permissions needed:
# - View account
# - Trade (limit orders only, no market orders)
# - NOT Withdraw

export COINBASE_API_KEY=""
export COINBASE_API_SECRET=""
```

### 2. Bankr Integration
- Bankr uses natural language commands
- Integrates with Coinbase Wallet via Privy
- Requires wallet connection approval

### 3. Risk Controls (Code-Level)
```python
MAX_POSITION_SIZE_PCT = 0.01  # 1% max
DAILY_LOSS_LIMIT_PCT = 0.03   # 3% daily stop
ALLOWED_PAIRS = ['BTC-USD', 'ETH-USD']
REQUIRE_APPROVAL_ABOVE = 500  # USD
```

## Proposed Workflow

1. **Analysis** (Current)
   - Trader analyzes market
   - Identifies setup
   - Writes to WATCHLIST.md

2. **Signal Generation** (New)
   - Trader decides: SIMULATION or LIVE
   - If LIVE: Checks daily loss limit
   - Generates trade plan with stop/target

3. **Approval Layer** (New)
   - For simulation: Auto-execute
   - For live trades <$500: Notify Q, execute if no response in 5 min
   - For live trades >$500: Require explicit approval

4. **Execution** (New)
   - Post order via Coinbase Advanced API
   - Log to TRADE-JOURNAL.md
   - Set stop-loss immediately

5. **Monitoring** (New)
   - Hourly position checks
   - Daily P&L summary
   - Alert if daily loss limit approached

## Implementation Phases

### Phase 1: Simulation (This Week)
- Build paper trading system
- Track hypothetical performance
- Validate strategy

### Phase 2: Limited Live (After 30 days positive sim)
- $1000 test capital
- Max 1% positions
- BTC/ETH only
- Manual approval for all trades

### Phase 3: Expanded (After 90 days profitable)
- Increase capital allocation
- Consider additional pairs
- Implement auto-approval for small positions

## Security Measures

1. **API Key Restrictions**
   - No withdrawal permissions
   - IP whitelisting
   - Rate limiting

2. **Wallet Security**
   - Separate trading wallet (not main holdings)
   - Multi-sig for large transfers
   - Regular key rotation

3. **Monitoring**
   - Real-time alerts for all trades
   - Daily reconciliation
   - Weekly strategy review

## Compliance Considerations

As Head of Data at Alpha Bank:
- Personal trading must not conflict with duties
- Consider disclosure requirements
- Maintain clear separation from bank systems
- Document as personal activity

## Next Steps

1. Q to confirm risk tolerance and capital allocation
2. Set up Coinbase Advanced API (view-only first)
3. Build simulation layer
4. 30-day paper trade validation
5. Gradual live deployment

---
**Approval Required:** This document must be reviewed and approved before any live trading capability is implemented.
