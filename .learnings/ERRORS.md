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
## [ERR-20260304-003] gbp_auto_convert_no_execution

**Logged**: 2026-03-04T10:32:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
GBP auto-convert script detected GBP but did not execute conversion; no Coinbase transaction created.

### Error
No trade executed; GBP-USD product not supported by Coinbase API.

### Context
- GBP detected: £9.95
- auto_convert_gbp.py only logs conversion
- Coinbase REST error: Product GBP-USD not supported

### Suggested Fix
Query supported GBP pairs via API and execute conversion using available product (e.g., GBP-USDC). If none, alert.

### Metadata
- Reproducible: yes
- Related Files: skills/trader/scripts/auto_convert_gbp.py
- Tags: coinbase, conversion, automation

---
## [ERR-20260304-001] openclaw-cron-run

**Logged**: 2026-03-04T10:58:00+00:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
`openclaw cron run` does not accept `--force` (unknown option).

### Error
```
error: unknown option '--force'
```

### Context
Command attempted: `openclaw cron run <jobId> --force`

### Suggested Fix
Use `openclaw cron run <jobId>` without `--force`.

### Metadata
- Reproducible: yes
- Related Files: HEARTBEAT.md

---
