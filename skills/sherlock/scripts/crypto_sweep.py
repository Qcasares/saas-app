#!/usr/bin/env python3
"""
Crypto market sweep — top movers, volume anomalies
Uses Coinbase API for reliable data
"""
import json
import os
import sys
from datetime import datetime

# Add workspace to path for coinbase client
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.13/site-packages')

try:
    from coinbase.rest import RESTClient
except ImportError:
    print(json.dumps({"error": "coinbase module not available"}))
    sys.exit(1)

def get_client():
    """Initialize Coinbase client with credentials"""
    api_key = os.environ.get('COINBASE_API_KEY', '577c27e6-22e2-4901-af7e-9caa79720505')
    api_secret = os.environ.get('COINBASE_API_SECRET', '''-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----''')
    return RESTClient(api_key=api_key, api_secret=api_secret)

def main():
    results = {
        "source": "crypto_markets",
        "timestamp": datetime.utcnow().isoformat(),
        "top_gainers": [],
        "top_losers": [],
        "volume_leaders": [],
        "anomalies": []
    }
    
    try:
        client = get_client()
        
        resp = client.get_products()
        products = resp.products
        
        stable = {'USDC','USDT','DAI','TUSD','USDP','FDUSD','PYUSD','EURC','GUSD','PAXG','USDS'}
        rows = []
        
        for p in products:
            if p.quote_currency_id != 'USD' or p.product_type != 'SPOT':
                continue
            if p.status != 'online' or p.is_disabled or p.trading_disabled:
                continue
            if p.base_currency_id in stable:
                continue
            
            try:
                chg = float(p.price_percentage_change_24h or 0)
                volq = float(p.approximate_quote_24h_volume or 0)
                price = float(p.price or 0)
                
                if volq > 1000000:  # Min $1M volume
                    rows.append({
                        'symbol': p.product_id,
                        'price': price,
                        'change_24h': round(chg, 2),
                        'volume_24h': round(volq, 2),
                        'base': p.base_currency_id
                    })
            except:
                continue
        
        # Sort by change
        by_change = sorted(rows, key=lambda x: x['change_24h'], reverse=True)
        results['top_gainers'] = by_change[:10]
        results['top_losers'] = by_change[-10:][::-1]
        
        # Sort by volume
        by_vol = sorted(rows, key=lambda x: x['volume_24h'], reverse=True)
        results['volume_leaders'] = by_vol[:10]
        
        # Anomalies: high volume + high volatility
        for r in rows:
            if abs(r['change_24h']) > 10 and r['volume_24h'] > 10000000:
                results['anomalies'].append(r)
        
    except Exception as e:
        results['error'] = str(e)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
