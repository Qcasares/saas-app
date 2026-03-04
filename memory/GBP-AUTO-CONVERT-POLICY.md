## GBP Auto-Conversion Policy

**Status:** ✅ ACTIVE - WORKING
**Instruction Source:** Q (2026-03-04)
**Rule:** Auto-convert GBP when detected

### SOLUTION FOUND
Using **USDC-GBP** trading pair via Coinbase Advanced Trade API.

### How It Works
1. Detects GBP balance > £0.01
2. Places limit order on USDC-GBP pair (buy USDC with GBP)
3. Converts ~99% of GBP balance to USDC
4. Logs conversion to executions.json

### Conversion History
- **2026-03-04 10:43**: Converted ~£8 → 6 USDC ✅
- **Current status**: 11 USDC available for trading

### Notes
- USDC-GBP is "limit only" - no market orders
- Orders placed 0.5% above market price to ensure fill
- Small amount reserved for fees
