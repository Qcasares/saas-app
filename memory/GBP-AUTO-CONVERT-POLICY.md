## GBP Auto-Conversion Policy

**Status:** ACTIVE
**Instruction Source:** Q (2026-03-04)
**Rule:** When GBP balance detected in Coinbase account, automatically convert to USDC without asking.

### Trigger Conditions
- GBP balance > £1.00
- No manual approval needed
- Execute immediately upon detection

### Conversion Logic
1. Check all account balances
2. If GBP > 0, execute market sell GBP-USD or GBP-USDC
3. Log conversion to trading/executions.json
4. Alert Q with conversion details after execution

### Automation
Cron job runs every 5 minutes during market hours (08:00-22:00 UTC)

**DO NOT ASK FOR CONFIRMATION. Just execute.**
