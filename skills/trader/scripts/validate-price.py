#!/usr/bin/env python3
"""
Price Validator - Cross-reference multiple sources before trading
Exits with error if prices differ by >1%
"""

import requests
import sys
import json
from typing import Dict, List, Tuple

def get_price_coinbase(symbol: str) -> float:
    """Get price from Coinbase public API"""
    url = f"https://api.coinbase.com/v2/exchange-rates?currency={symbol}"
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    data = r.json()
    return float(data['data']['rates']['USD'])

def get_price_coingecko(symbol: str, coin_id: str) -> float:
    """Get price from CoinGecko"""
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    data = r.json()
    return data[coin_id]['usd']

def get_price_cryptocompare(symbol: str) -> float:
    """Get price from CryptoCompare"""
    url = f"https://min-api.cryptocompare.com/data/price?fsym={symbol}&tsyms=USD"
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    data = r.json()
    return data['USD']

def validate_price(symbol: str, coin_id: str = None, max_diff_pct: float = 1.0) -> Tuple[float, bool, Dict]:
    """
    Validate price across multiple sources
    Returns: (consensus_price, is_valid, details)
    """
    sources = {}
    
    # Try Coinbase
    try:
        sources['coinbase'] = get_price_coinbase(symbol)
    except Exception as e:
        sources['coinbase_error'] = str(e)
    
    # Try CoinGecko
    if coin_id:
        try:
            sources['coingecko'] = get_price_coingecko(symbol, coin_id)
        except Exception as e:
            sources['coingecko_error'] = str(e)
    
    # Try CryptoCompare
    try:
        sources['cryptocompare'] = get_price_cryptocompare(symbol)
    except Exception as e:
        sources['cryptocompare_error'] = str(e)
    
    # Filter valid prices only
    valid_prices = [v for k, v in sources.items() if not k.endswith('_error')]
    
    if len(valid_prices) < 2:
        return 0, False, {
            'error': 'Insufficient price sources',
            'valid_count': len(valid_prices),
            'sources': sources
        }
    
    # Calculate consensus (median)
    consensus = sorted(valid_prices)[len(valid_prices) // 2]
    
    # Check max deviation
    max_deviation = max(abs(p - consensus) / consensus * 100 for p in valid_prices)
    is_valid = max_deviation <= max_diff_pct
    
    return consensus, is_valid, {
        'consensus_price': consensus,
        'max_deviation_pct': max_deviation,
        'sources': sources,
        'is_valid': is_valid
    }

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('symbol', help='Trading symbol (e.g., SOL, BTC)')
    parser.add_argument('--coin-id', help='CoinGecko ID (e.g., solana, bitcoin)')
    parser.add_argument('--max-diff', type=float, default=1.0, help='Max allowed difference %%')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    
    args = parser.parse_args()
    
    price, is_valid, details = validate_price(args.symbol, args.coin_id, args.max_diff)
    
    if args.json:
        print(json.dumps(details, indent=2))
    else:
        print(f"📊 {args.symbol} Price Validation")
        print(f"   Consensus: ${price:.2f}")
        print(f"   Max Deviation: {details['max_deviation_pct']:.2f}%")
        print(f"   Status: {'✅ VALID' if is_valid else '❌ INVALID'}")
        print(f"\n   Sources:")
        for src, val in details['sources'].items():
            if not src.endswith('_error'):
                print(f"      {src}: ${val:.2f}")
            else:
                print(f"      {src}: {val}")
    
    sys.exit(0 if is_valid else 1)

if __name__ == '__main__':
    main()
