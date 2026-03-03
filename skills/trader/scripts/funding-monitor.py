#!/usr/bin/env python3
"""
Funding Rate Monitor - Check Coinbase futures funding rates
"""
import os
import sys
import json
import requests
from datetime import datetime

sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

def get_coinbase_futures_stats():
    """Get futures stats from Coinbase API"""
    try:
        # Coinbase Advanced Trade API endpoint for futures
        url = "https://api.coinbase.com/api/v3/brokerage/products"
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        
        # Filter for perpetual futures
        futures = []
        for product in data.get('products', []):
            if 'PERPETUAL' in product.get('product_id', ''):
                futures.append({
                    'symbol': product.get('product_id'),
                    'mark_price': product.get('price'),
                    'funding_rate': product.get('funding_rate', 'N/A'),
                    'open_interest': product.get('open_interest_usd', 'N/A'),
                    'volume_24h': product.get('volume_24h', 'N/A')
                })
        
        return futures
    except Exception as e:
        print(f"Error fetching futures: {e}")
        return []

def get_alternative_funding_data():
    """Get funding data from alternative sources"""
    try:
        # Use CoinGlass API (free tier available)
        # Or CoinCodex for basic funding data
        
        # For now, return warning about manual check
        return {
            "note": "For live funding rates, check:",
            "sources": [
                "https://coinglass.com/FundingRate",
                "https://www.coincodex.com/futures/",
                "Coinbase Advanced Trade dashboard"
            ],
            "btc_context": "Watch for: Negative funding = shorts pay longs (bearish). Positive funding = longs pay shorts (bullish). Extreme values (>0.01% or <-0.01%) often signal reversals."
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    print("🔍 Funding Rate Monitor")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S GMT')}")
    print()
    
    # Try to get futures data
    futures = get_coinbase_futures_stats()
    if futures:
        print("📊 Perpetual Futures:")
        for f in futures[:5]:
            print(f"  {f['symbol']}: ${f['mark_price']} | Funding: {f['funding_rate']}")
    else:
        print("⚠️  Live funding data unavailable via API")
    
    print()
    alt_data = get_alternative_funding_data()
    print(alt_data.get('btc_context', ''))
    print()
    print("🔗 Quick Links:")
    for source in alt_data.get('sources', []):
        print(f"  • {source}")
