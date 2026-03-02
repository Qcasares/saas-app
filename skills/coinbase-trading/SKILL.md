---
name: coinbase-trading
version: 1.0.0
description: Coinbase Advanced Trade API integration for market data and trading operations. Supports real-time prices, portfolio tracking, and trade execution.
requires:
  bins:
    - python3
  python:
    - coinbase-advanced-py
---

# Coinbase Trading Skill

Coinbase Advanced Trade API integration for programmatic trading and market analysis.

## Status: ✅ CONFIGURED

**API Key:** 577c27e6-22e2-4901-af7e-9caa79720505  
**Permissions:** View, Trade, Transfer  
**Status:** Active and operational

## Quick Start

### Test Connection
```bash
python3 skills/coinbase-trading/scripts/coinbase-cli.py test
```

### Get BTC Price
```bash
python3 skills/coinbase-trading/scripts/coinbase-cli.py price BTC-USD
```

### Get Account Balances
```bash
python3 skills/coinbase-trading/scripts/coinbase-cli.py accounts
```

## Core Capabilities

### 1. Market Data
- Real-time prices for any trading pair
- Order book depth
- 24h volume and price changes
- Historical candlestick data

### 2. Account Management
- Portfolio balances
- Account details
- Available vs hold balances

### 3. Trading Operations
- Market orders (instant execution)
- Limit orders (specified price)
- Order status tracking
- Cancel orders

### 4. Market Analysis (for Trader Agent)
- Price monitoring and alerts
- Portfolio tracking
- Trade execution
- Performance analytics

## Configuration

### Environment Variables (in `.env`)
```bash
# Coinbase Developer Platform (configured 2026-03-02)
NEXT_PUBLIC_CDP_API_KEY=SGkSsP24CnwibxhXwQxHGvoyDoJq2itt

# Coinbase Advanced Trade API (configured 2026-03-02)
COINBASE_API_KEY=577c27e6-22e2-4901-af7e-9caa79720505
COINBASE_API_SECRET=-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----
```

### Python Environment
```bash
# Virtual environment at ~/.openclaw/workspace/.venv
source .venv/bin/activate
python3 -c "from coinbase.rest import RESTClient; print('OK')"
```

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `coinbase-cli.py` | Main CLI tool | `python3 coinbase-cli.py [test|price|accounts]` |
| `coinbase-price.sh` | Quick price check | `./coinbase-price.sh BTC-USD` |
| `coinbase-test.sh` | Connection test | `./coinbase-test.sh` |

## Current Holdings

| Asset | Balance |
|-------|---------|
| USDC | 0.007447 |
| BCH | 0.0001 |
| BTC | 0.0001 |

## Common Workflows

### Market Scan (for Trader agent)
```bash
# Get multiple prices
python3 coinbase-cli.py price BTC-USD
python3 coinbase-cli.py price ETH-USD
python3 coinbase-cli.py price SOL-USD
```

### Place a Trade (coming soon)
```python
from coinbase.rest import RESTClient
client = RESTClient(api_key=..., api_secret=...)
order = client.market_order_buy(
    product_id="BTC-USD",
    quote_size="10"  # Buy $10 worth of BTC
)
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /products/{product_id}` | Price data |
| `GET /accounts` | Account balances |
| `POST /orders` | Place orders |
| `GET /orders/historical/batch` | Order history |

## Resources

- **Coinbase Advanced Trade API docs:** https://docs.cdp.coinbase.com/advanced-trade/docs/rest-api-overview
- **Python SDK:** https://github.com/coinbase/coinbase-advanced-py
- **API Status:** https://status.coinbase.com

---

**Configured:** 2026-03-02 by KingKong 🦍  
**Key ID:** 577c27e6-22e2-4901-af7e-9caa79720505  
**Status:** ✅ Operational
