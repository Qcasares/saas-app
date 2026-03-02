#!/usr/bin/env python3
# Test Coinbase API using official SDK

import sys
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.13/site-packages')

from coinbase.rest import RESTClient

# Load from .env manually
api_key = "577c27e6-22e2-4901-af7e-9caa79720505"
api_secret = """-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----"""

print("🔌 Connecting to Coinbase Advanced Trade API...")

try:
    client = RESTClient(api_key=api_key, api_secret=api_secret)
    
    print("📊 Fetching accounts...")
    response = client.get_accounts()
    accounts = response.accounts
    
    print(f"\n✅ SUCCESS! Found {len(accounts)} accounts")
    print("\n💰 Account Balances:")
    print("-" * 45)
    
    has_balance = False
    for account in accounts:
        currency = account.get('currency', 'Unknown')
        balance_data = account.get('available_balance', {})
        value = balance_data.get('value', '0')
        
        if float(value) > 0:
            has_balance = True
            print(f"  {currency:10} {value:20}")
    
    if not has_balance:
        print("  (No non-zero balances found)")
    
    print("-" * 45)
    
    # Get BTC price
    print("\n📈 BTC Price:")
    product = client.get_product('BTC-USD')
    price = product.get('price', 'N/A')
    print(f"  BTC-USD: ${price}")
    
    print("\n🚀 Coinbase API is fully configured!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
