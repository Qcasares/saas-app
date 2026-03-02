#!/usr/bin/env python3
"""Execute live trade: BTC → SOL"""
import sys
import os
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

# Set environment
os.environ['COINBASE_API_KEY'] = '577c27e6-22e2-4901-af7e-9caa79720505'
os.environ['COINBASE_API_SECRET'] = '''-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----'''

from coinbase.rest import RESTClient
from datetime import datetime
import time

print("=" * 60)
print("🔴 LIVE TRADE EXECUTION")
print("=" * 60)
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("Strategy: BTC → SOL (higher upside potential)")
print()

client = RESTClient(api_key=os.environ['COINBASE_API_KEY'], api_secret=os.environ['COINBASE_API_SECRET'])

# Check balances
accounts = client.get_accounts()
btc_balance = 0
for acc in accounts.accounts:
    if acc.currency == 'BTC':
        bal = acc.available_balance
        btc_balance = float(bal['value'] if isinstance(bal, dict) else bal.value)

print(f"💰 Available BTC: {btc_balance:.8f}")

# Get prices
btc_price = float(client.get_product('BTC-USD').price)
sol_price = float(client.get_product('SOL-USD').price)

print(f"📊 Prices:")
print(f"  BTC-USD: ${btc_price:,.2f}")
print(f"  SOL-USD: ${sol_price:,.2f}")
print()

# Calculate trade
usd_value = btc_balance * btc_price
sol_to_buy = usd_value / sol_price

print("📝 TRADE PLAN:")
print("-" * 60)
print(f"  Step 1: SELL {btc_balance:.8f} BTC")
print(f"          → Get ${usd_value:.2f} USD")
print()
print(f"  Step 2: BUY ~{sol_to_buy:.4f} SOL")
print(f"          @ ${sol_price:.2f}")
print()

# Execute Step 1: Sell BTC
print("🚀 EXECUTING STEP 1: Sell BTC...")
try:
    sell_order = client.market_order_sell(
        client_order_id=f"sell-btc-{int(time.time())}",
        product_id='BTC-USD',
        base_size=str(btc_balance)
    )
    print(f"✅ BTC SOLD!")
    print(f"   Order ID: {sell_order.order_id}")
    print(f"   Status: {sell_order.status}")
except Exception as e:
    print(f"❌ Error selling BTC: {e}")
    sys.exit(1)

# Small delay for order to settle
import time
time.sleep(2)

# Execute Step 2: Buy SOL
print()
print("🚀 EXECUTING STEP 2: Buy SOL...")
try:
    # Calculate SOL amount (minus small buffer for fees)
    sol_amount = sol_to_buy * 0.995  # 0.5% buffer for fees
    
    buy_order = client.market_order_buy(
        client_order_id=f"buy-sol-{int(time.time())}",
        product_id='SOL-USD',
        quote_size=str(usd_value * 0.995)  # Use 99.5% of proceeds
    )
    print(f"✅ SOL PURCHASED!")
    print(f"   Order ID: {buy_order.order_id}")
    print(f"   Status: {buy_order.status}")
    print(f"   Est. SOL: ~{sol_amount:.4f}")
except Exception as e:
    print(f"❌ Error buying SOL: {e}")
    print("   Funds may be stuck in USD - check your account")
    sys.exit(1)

print()
print("=" * 60)
print("✅ TRADE COMPLETE")
print("=" * 60)
print()
print("Position: BTC → SOL")
print(f"Entry SOL Price: ${sol_price:.2f}")
print()
print("Next Steps:")
print("  - Monitor SOL for momentum")
print("  - Target: +15-20% gain before taking profit")
print("  - Stop: -10% to limit downside")
print()
print("📈 Let's grow this! 🚀")
