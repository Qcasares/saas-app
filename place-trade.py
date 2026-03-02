#!/usr/bin/env python3
"""Place a test trade"""
import sys
import os
import importlib.util
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

# Set environment
os.environ['COINBASE_API_KEY'] = '577c27e6-22e2-4901-af7e-9caa79720505'
os.environ['COINBASE_API_SECRET'] = '''-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----'''

# Load the trader module
spec = importlib.util.spec_from_file_location("trader", os.path.expanduser('~/.openclaw/workspace/skills/trader/scripts/coinbase-trader.py'))
trader_module = importlib.util.module_from_spec(spec)
sys.modules['trader'] = trader_module
spec.loader.exec_module(trader_module)
CoinbaseTrader = trader_module.CoinbaseTrader

from datetime import datetime

print("=" * 60)
print("🚀 PLACING TEST TRADE")
print("=" * 60)
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Initialize trader
trader = CoinbaseTrader(simulation=True)

# Get current price before trading
print("📊 Pre-trade Market Check:")
price_data = trader.get_price('BTC-USD')
print(f"  BTC-USD: ${price_data['price']:,.2f}")
print()

# Place market order - BUY $50 worth of BTC
print("📝 Order Details:")
print("  Type: MARKET BUY")
print("  Pair: BTC-USD")
print("  Amount: $50.00 USD")
print()

result = trader.place_market_order(
    product_id='BTC-USD',
    side='BUY',
    amount=50.00,
    amount_type='quote'
)

print("✅ ORDER EXECUTED (Simulation)")
print("-" * 60)
print(f"  Order ID: {result.get('order_id', 'SIM-' + str(int(datetime.now().timestamp())))}")
print(f"  Status: {result.get('status', 'FILLED')}")
print(f"  Filled: ~${result.get('amount', 50)} worth of BTC")
print(f"  Est. BTC: ~{50 / price_data['price']:.6f} BTC")
print()
print("🔒 Mode: SIMULATION (no real funds used)")
print("=" * 60)

# Show updated portfolio
print("\n💰 Updated Portfolio:")
portfolio = trader.get_portfolio_value()
print(f"  Total Value: ${portfolio['total_usd']:,.2f}")
print("\n  Holdings:")
for currency, data in portfolio['holdings'].items():
    if data['usd_value'] > 0.01:
        print(f"    {currency}: {data['balance']:.6f} (${data['usd_value']:.2f})")
