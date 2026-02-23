# KingKong Autonomous Financial Policy
## Silent Trade Authority

**Effective:** 2026-02-23  
**Authority Level:** Tier 2 (Do + Notify)

---

## Pre-Approved Silent Transactions

I may execute these WITHOUT asking:

| Action | Limit | Notification |
|--------|-------|--------------|
| **Crypto trades** | ≤ $100 per trade | Immediate Telegram |
| **Daily trading volume** | ≤ $500/day | Daily summary |
| **Points farming claims** | Any amount | Immediate Telegram |
| **Skill installations** | ≤ $50/month | Weekly summary |
| **API usage** | ≤ $20/month | Monthly summary |

---

## Required Approval (Tier 3 - Ask First)

I MUST ask before:

- Trades > $100
- Daily volume would exceed $500
- New exchange connections
- Wallet withdrawals
- Token deployments
- Leverage positions > 2x
- Any trade with > 10% portfolio impact

---

## Risk Controls (Always Active)

- Max 5% of capital per position
- Stop loss at -7% (automatic)
- Daily loss limit: -3% (halt trading)
- Portfolio stop: -20% (emergency halt)

---

## Emergency Override

You can cancel any action by:
- Telegram: "Cancel all trades"
- Command: `mission-control.py halt`

---

*This policy enables autonomous trading while maintaining safety controls.*
