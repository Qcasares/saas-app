# Crypto Trading Strategies - Research Document
**Date:** 2026-02-24
**Agent:** KingKong (Autonomous Trading System)

## Executive Summary

Based on research from professional trading sources, here are the **top strategies for rapid portfolio growth** with controlled risk:

---

## 🎯 Top 3 Strategies for Quick Portfolio Growth

### 1. **Momentum Swing Trading** (Primary Strategy)
**Best for:** 20-50% monthly returns with controlled risk

**How it works:**
- Capture price movements over 2-7 days
- Enter on breakout confirmation (volume + price)
- Use trailing stops to lock in gains
- Target 5-15% moves per trade

**Risk Management:**
- Position size: 2-5% per trade
- Stop loss: 3-5% below entry
- Max 3 concurrent positions
- Daily loss limit: 2% of portfolio

**Bankr Commands:**
```bash
# Check momentum
bankr prompt "Show me the top 5 trending tokens on Base with highest volume increase in last 24h"

# Entry
bankr prompt "Buy $50 of [TOKEN] on Base"

# Set stop loss (mental or manual monitoring)
bankr prompt "Alert me if [TOKEN] drops below [PRICE]"

# Take profit
bankr prompt "Sell 50% of my [TOKEN] position"
```

---

### 2. **DCA + Breakout Stacking** (Core Position Building)
**Best for:** Building large positions in high-conviction plays

**How it works:**
- Dollar-cost average 20% of intended position over 5 days
- On breakout (volume spike + 10%+ move), add remaining 80%
- Scale out in tiers: 25% at +20%, 25% at +50%, 25% at +100%, 25% runner

**Risk Management:**
- Max position: 15% of portfolio per asset
- Stop loss on full position: -15% from average entry
- Only stack on confirmed breakouts (volume > 2x average)

**Bankr Commands:**
```bash
# DCA entry (manual daily)
bankr prompt "Buy $10 of [TOKEN] on Base"

# Breakout add
bankr prompt "Buy $40 of [TOKEN] on Base"

# Tiered exits
bankr prompt "Sell 25% of my [TOKEN]"
```

---

### 3. **High-Volume Scalping** (Aggressive Growth)
**Best for:** 1-3% daily gains, compound quickly

**How it works:**
- Trade during high volatility periods (New York open, major news)
- Target 0.5-1% moves
- Use tight stops (0.3% loss max)
- 5-10 trades per day
- Only trade high liquidity pairs (ETH, SOL, major memes)

**Risk Management:**
- Position: 1-2% per scalp
- Hard stop: 0.3% loss
- Daily loss limit: 1% (stop trading if hit)
- Only trade when volatility > 50% annualized

**Bankr Commands:**
```bash
# Quick scalp
bankr prompt "Swap $20 ETH to USDC on Base"
bankr prompt "Swap $20.20 USDC back to ETH on Base"  # If price moved up 1%
```

---

## 📊 Technical Analysis Framework

### Entry Signals (High Probability Setups)

1. **Breakout + Volume**
   - Price breaks above 20-day high
   - Volume > 2x 20-day average
   - RSI between 50-70 (not overbought)

2. **Support Bounce**
   - Price touches 50-day MA or key support
   - Bullish candlestick pattern (hammer, engulfing)
   - RSI < 40 (oversold bounce)

3. **Trend Continuation**
   - Price above 20-day and 50-day MAs
   - Pullback to 20-day MA
   - Volume decreasing on pullback

### Exit Signals

1. **Take Profit Levels**
   - Conservative: 10% gain
   - Moderate: 25% gain  
   - Aggressive: 50%+ gain (use trailing stop)

2. **Stop Loss Triggers**
   - Hard stop: 5% loss
   - Trailing stop: 10% below highest price since entry
   - Time stop: Exit if no move in 7 days

---

## 🏦 Portfolio Construction (Modern Portfolio Theory Adapted)

### Asset Allocation for Growth Phase

| Category | Allocation | Examples |
|----------|------------|----------|
| **Core Holdings** | 40% | ETH, SOL (established L1s) |
| **Growth Plays** | 30% | Base ecosystem tokens, AI tokens |
| **Speculative/Memes** | 20% | High-volatility opportunities |
| **Cash (Stable)** | 10% | USDC for dry powder |

### Chain Diversification
- **Base:** 40% (low fees, fast execution)
- **Ethereum:** 30% (liquidity, blue chips)
- **Solana:** 20% (speed, memes, NFTs)
- **Polygon:** 10% (backup/hedging)

---

## 🛡️ Risk Management Rules (CRITICAL)

### Position Sizing
- **Never risk >5% per trade**
- **Never have >20% in single asset**
- **Max 5 concurrent positions**

### Drawdown Protection
- **Daily loss limit: 3% of portfolio**
- **Weekly loss limit: 10% of portfolio**
- **If hit: Stop trading for 24h, review strategy**

### Market Conditions
- **Reduce size by 50% during:**
  - Bitcoin volatility >80%
  - Major regulatory news
  - Exchange issues (FTX-type events)
- **Increase size by 25% during:**
  - Bull market confirmation (BTC above 200-day MA)
  - High volume breakouts across multiple assets

---

## 🤖 Automation via Bankr

### Daily Workflow Commands

```bash
# Morning routine (10 AM)
bankr prompt "Show my portfolio balance and performance"
bankr prompt "What are the top 3 trending tokens today?"
bankr prompt "Show me ETH, SOL, and Base ecosystem prices"

# Scan for setups
bankr prompt "Which tokens on Base have gained more than 10% in the last 24 hours?"
bankr prompt "Show me tokens with highest volume increase today"

# Execute trades
bankr prompt "Buy $X of [TOKEN] on Base"
bankr prompt "Set a limit order to buy [TOKEN] if it drops to $Y"

# Monitor positions
bankr prompt "What's the current price of [TOKEN]?"
bankr prompt "Show my profit/loss on [TOKEN]"

# Exit management
bankr prompt "Sell 50% of my [TOKEN] position"
bankr prompt "Swap all my [TOKEN] to USDC on Base"
```

---

## 📈 Performance Tracking

### Daily Metrics to Log
1. Portfolio value (start vs end of day)
2. Number of trades executed
3. Win/loss ratio
4. Largest winner/loser
5. Fees paid

### Weekly Review
1. Strategy performance vs BTC/ETH buy-and-hold
2. Risk-adjusted returns (Sharpe ratio estimate)
3. Pattern analysis (what worked, what didn't)
4. Strategy adjustments

---

## 🎯 First Week Action Plan

### Day 1-2: Foundation
- [ ] Check current Bankr wallet balances
- [ ] Document starting portfolio value
- [ ] Set up daily tracking system
- [ ] Research 5-10 potential target tokens

### Day 3-5: First Positions
- [ ] Enter 2-3 small positions (2-3% each)
- [ ] Test momentum strategy on Base
- [ ] Practice entry/exit commands
- [ ] Log all trades

### Day 6-7: Review & Scale
- [ ] Analyze first week performance
- [ ] Adjust position sizes based on results
- [ ] Add 2-3 more positions if profitable
- [ ] Document lessons learned

---

## 🔍 Research Sources

1. **CMC Markets** - 7 Best Crypto Trading Strategies for 2025
2. **Changelly** - Crypto Risk Management Strategies
3. **Token Metrics** - Advanced Portfolio Tools
4. **Bankr Documentation** - Natural Language Trading

---

**Next Steps:**
1. Check current Bankr balances
2. Identify first 3 target tokens
3. Execute test trades
4. Set up daily monitoring cron job

*This document is part of the autonomous trading system memory. Updates will be made based on live performance data.*
