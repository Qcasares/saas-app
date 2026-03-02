#!/usr/bin/env python3
"""Execute live trade: BTC → SOL (GBP pairs)"""
import sys
import os
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

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
print("🔴 LIVE TRADE EXECUTION (GBP ACCOUNT)")
print("=" * 60)
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

client = RESTClient(api_key=os.environ['COINBASE_API_KEY'], api_secret=os.environ['COINBASE_API_SECRET'])

# Get GBP balance
accounts = client.get_accounts()
btc_balance = 0
for acc in accounts.accounts:
    if acc.currency == 'BTC':
        bal = acc.available_balance
        btc_balance = float(bal['value'] if isinstance(bal, dict) else bal.value)

print(f"💰 Available BTC: {btc_balance:.8f}")

# Get GBP prices
btc_gbp = float(client.get_product('BTC-GBP').price)
sol_gbp = float(client.get_product('SOL-GBP').price)

print(f"📊 Prices:")
print(f"  BTC-GBP: £{btc_gbp:,.2f}")
print(f"  SOL-GBP: £{sol_gbp:,.2f}")
print()

# Calculate trade
gbp_value = btc_balance * btc_gbp
sol_to_buy = gbp_value / sol_gbp

print("📝 TRADE PLAN:")
print("-" * 60)
print(f"  Step 1: SELL {btc_balance:.8f} BTC")
print(f"          → Get £{gbp_value:.2f} GBP")
print()
print(f"  Step 2: BUY ~{sol_to_buy:.4f} SOL")
print(f"          @ £{sol_gbp:.2f}")
print()

# Execute Step 1: Sell BTC for GBP
print("🚀 EXECUTING STEP 1: Sell BTC-GBP...")
try:
    sell_order = client.market_order_sell(
        client_order_id=f'sell-btc-gbp-{int(time.time())}',
        product_id='BTC-GBP',
        base_size=str(btc_balance)
    )
    print(f"✅ BTC SOLD!")
    print(f"   Order ID: {sell_order.order_id}")
    print(f"   Status: {sell_order.status}")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

time.sleep(2)

# Execute Step 2: Buy SOL with GBP
print()
print("🚀 EXECUTING STEP 2: Buy SOL-GBP...")
try:
    buy_order = client.market_order_buy(
        client_order_id=f'buy-sol-gbp-{int(time.time())}',
        product_id='SOL-GBP',
        quote_size=str(gbp_value * 0.995)  # 0.5% fee buffer
    )
    print(f"✅ SOL PURCHASED!")
    print(f"   Order ID: {buy_order.order_id}")
    print(f"   Status: {buy_order.status}")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print()
print("=" * 60)
print("✅ TRADE COMPLETE")
print("=" * 60)
print(f"Position: BTC → SOL (£{gbp_value:.2f})")
print(f"Entry SOL Price: £{sol_gbp:.2f}")
print()
print("🚀 Let's grow this!")
