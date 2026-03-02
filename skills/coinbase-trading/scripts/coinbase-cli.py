#!/usr/bin/env python3
"""
Coinbase Trading CLI - Market data and trading operations
"""
import sys
import os
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

from coinbase.rest import RESTClient
from datetime import datetime

def get_client():
    """Initialize Coinbase client from environment"""
    api_key = os.environ.get('COINBASE_API_KEY', '577c27e6-22e2-4901-af7e-9caa79720505')
    api_secret = os.environ.get('COINBASE_API_SECRET', '''-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----''')
    return RESTClient(api_key=api_key, api_secret=api_secret)

def get_price(client, product_id='BTC-USD'):
    """Get current price for a trading pair"""
    product = client.get_product(product_id)
    return {
        'price': product.price,
        'bid': getattr(product, 'bid', 'N/A'),
        'ask': getattr(product, 'ask', 'N/A'),
        'volume_24h': getattr(product, 'volume_24h', 'N/A')
    }

def get_accounts(client):
    """Get account balances"""
    response = client.get_accounts()
    accounts = []
    for acc in response.accounts:
        bal = acc.available_balance
        balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
        accounts.append({
            'currency': acc.currency,
            'balance': balance,
            'hold': float(acc.hold['value'] if isinstance(acc.hold, dict) else acc.hold.value)
        })
    return accounts

def main():
    if len(sys.argv) < 2:
        print("Usage: coinbase-cli.py [price|accounts|test] [args...]")
        sys.exit(1)
    
    cmd = sys.argv[1]
    client = get_client()
    
    if cmd == 'price':
        product = sys.argv[2] if len(sys.argv) > 2 else 'BTC-USD'
        data = get_price(client, product)
        print(f"{product}:")
        print(f"  Price: ${data['price']}")
        if data['bid'] != 'N/A':
            print(f"  Bid:   ${data['bid']}")
            print(f"  Ask:   ${data['ask']}")
    
    elif cmd == 'accounts':
        accounts = get_accounts(client)
        print("Account Balances:")
        print("-" * 35)
        for acc in accounts:
            if acc['balance'] > 0 or acc['hold'] > 0:
                print(f"  {acc['currency']:10} {acc['balance']:15} (hold: {acc['hold']})")
    
    elif cmd == 'test':
        print("🔌 Testing Coinbase API connection...")
        response = client.get_accounts()
        print(f"✅ Connected! Found {len(response.accounts)} accounts")
        
        btc = client.get_product('BTC-USD')
        print(f"📈 BTC Price: ${btc.price}")
    
    else:
        print(f"Unknown command: {cmd}")
        print("Commands: price, accounts, test")

if __name__ == '__main__':
    main()
