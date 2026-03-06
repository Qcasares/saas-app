#!/usr/bin/env python3
"""Quick trade executor for Coinbase"""
import os
import sys
import uuid
from coinbase.rest import RESTClient

# Load credentials
api_key = os.getenv('COINBASE_API_KEY')
api_secret = os.getenv('COINBASE_API_SECRET')

if not api_key or not api_secret:
    print("Missing COINBASE_API_KEY or COINBASE_API_SECRET")
    sys.exit(1)

client = RESTClient(api_key, api_secret)

# Get args
if len(sys.argv) < 4:
    print("Usage: trade.py <buy|sell> <product_id> <amount> [quote|base]")
    sys.exit(1)

side = sys.argv[1].lower()
product_id = sys.argv[2]
amount = sys.argv[3]
size_type = sys.argv[4] if len(sys.argv) > 4 else "quote"  # default to quote (USD)
client_order_id = str(uuid.uuid4())

print(f"{side.upper()} {amount} {product_id} ({size_type} size)...")

try:
    if size_type == "base":
        # BTC amount
        if side == "buy":
            order = client.market_order_buy(
                product_id=product_id,
                base_size=amount,
                client_order_id=client_order_id
            )
        else:
            order = client.market_order_sell(
                product_id=product_id,
                base_size=amount,
                client_order_id=client_order_id
            )
    else:
        # USD amount
        if side == "buy":
            order = client.market_order_buy(
                product_id=product_id,
                quote_size=amount,
                client_order_id=client_order_id
            )
        else:
            order = client.market_order_sell(
                product_id=product_id,
                quote_size=amount,
                client_order_id=client_order_id
            )
    print(f"✅ Order placed: {order}")
except Exception as e:
    print(f"❌ Error: {e}")
