## [ERR-20260304-002] coinbase_account_unfunded

**Logged**: 2026-03-04T08:45:00Z
**Priority**: critical
**Status**: pending
**Area**: infra

### Summary
Coinbase account has insufficient funds for trading. Portfolio value $36.58, USDC balance $0.03.

### Error
Live trade execution failed: "account is not available"

### Context
- Attempted VVV-USD long position ($500 target)
- Account has VVV, NEAR, FAI positions but no USDC
- VVV price now $6.29 (entry $6.16 missed)

### Account Status
- Portfolio: $36.58
- USDC: $0.03 (needs $500+ for target position)
- Existing positions: FAI 1399 units, NEAR 3.558 units

### Suggested Fix
1. Fund account with USDC for trading
2. Set all trading to SIMULATION mode until funded
3. Create alert when USDC balance > $100
4. Update risk parameters to match actual balance

### Metadata
- Reproducible: yes
- Related Files: trading/RISK-PARAMETERS.json
- Tags: coinbase, funding, live-trading

---
