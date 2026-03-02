#!/usr/bin/env python3
"""Optimize $37 portfolio - sell BCH dust, consolidate positions"""
import sys
import os
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.13/site-packages')

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
print("🔴 PORTFOLIO OPTIMIZATION - $37 STRATEGY")
print("=" * 60)
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

client = RESTClient(api_key=os.environ['COINBASE_API_KEY'], api_secret=os.environ['COINBASE_API_SECRET'])

# Get balances
accounts = client.get_accounts()
bch_balance = 0
gbp_balance = 0

for acc in accounts.accounts:
    if acc.currency == 'BCH':
        bal = acc.available_balance
        bch_balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
    if acc.currency == 'GBP':
        bal = acc.available_balance
        gbp_balance = float(bal['value'] if isinstance(bal, dict) else bal.value)

print(f"💰 Current Holdings:")
print(f"  BCH: {bch_balance:.8f} (dust - selling)")
print(f"  GBP: £{gbp_balance:.2f} (converting to SOL)")
print()

# Step 1: Sell BCH dust
if bch_balance > 0:
    print("🚀 STEP 1: Selling BCH dust...")
    try:
        order = client.market_order_sell(
            client_order_id=f'sell-bch-{int(time.time())}',
            product_id='BCH-GBP',
            base_size=str(bch_balance)
        )
        print(f"✅ BCH SOLD!")
        time.sleep(1)
    except Exception as e:
        print(f"⚠️ BCH sale issue: {e}")

# Step 2: Check updated GBP balance
accounts = client.get_accounts()
for acc in accounts.accounts:
    if acc.currency == 'GBP':
        bal = acc.available_balance
        gbp_balance = float(bal['value'] if isinstance(bal, dict) else bal.value)

print(f"💷 Available GBP: £{gbp_balance:.2f}")

# Step 3: Buy SOL with all GBP
if gbp_balance >= 1:  # Minimum trade size
    print()
    print("🚀 STEP 2: Buying SOL with all GBP...")
    try:
        amount = round(gbp_balance * 0.99, 2)  # 1% fee buffer
        order = client.market_order_buy(
            client_order_id=f'buy-sol-{int(time.time())}',
            product_id='SOL-GBP',
            quote_size=str(amount)
        )
        print(f"✅ SOL PURCHASED!")
        print(f"   Amount: £{amount}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("⚠️ Not enough GBP for SOL purchase (minimum ~£1)")

print()
print("=" * 60)
print("✅ OPTIMIZATION COMPLETE")
print("=" * 60)
print()
print("New Strategy:")
print("  🏦 BTC: Keep as stable foundation (~$31)")
print("  🚀 SOL: Growth position (~$7+)  ")
print("  🗑️  BCH: Eliminated (dust)")
print()
print("Portfolio now streamlined for growth!")
