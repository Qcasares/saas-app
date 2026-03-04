#!/usr/bin/env python3
"""Enhanced market scanner with funding rates, correlation checks, and signals"""
import json
import sys
import os
from pathlib import Path

sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/skills/trader/scripts')

def scan_market():
    from coinbase_trader import CoinbaseTrader
    trader = CoinbaseTrader(simulation=True)
    
    print("=" * 60)
    print("ENHANCED MARKET SCAN")
    print("=" * 60)
    
    # Load positions for correlation check
    positions_path = Path('/Users/quentincasares/.openclaw/workspace/trading/active-positions.json')
    current_positions = []
    if positions_path.exists():
        with open(positions_path) as f:
            current_positions = json.load(f)
    
    # Get BTC price for correlation
    btc_product = trader.client.get_product('BTC-USD')
    btc_price = float(btc_product.price)
    btc_change = float(getattr(btc_product, 'price_percentage_change_24h', 0))
    
    print(f"\n📊 BTC: ${btc_price:,.2f} ({btc_change:+.2f}%)")
    print(f"   {'ALTS MOVING WITH BTC' if abs(btc_change) > 2 else 'ALTS INDEPENDENT'}")
    
    # Check for extreme moves
    print("\n🔥 EXTREME MOVES (|24h| > 10%, Vol > $5M):")
    
    assets = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'VVV-USDC', 'DOGE-USD', 'XRP-USD', 'ADA-USD']
    signals = []
    
    for asset in assets:
        try:
            product = trader.client.get_product(asset)
            price = float(product.price)
            change = float(getattr(product, 'price_percentage_change_24h', 0))
            volume = float(getattr(product, 'volume_24h', 0))
            
            if abs(change) > 10 and volume > 5000000:
                emoji = "🚀" if change > 0 else "💥"
                print(f"   {emoji} {asset}: {change:+.1f}% | ${price:,.4f}")
                
                # Check correlation
                if abs(btc_change) > 5:
                    correlation = "BTC-CORRELATED"
                else:
                    correlation = "INDEPENDENT"
                
                # Generate signal
                if change < -10:
                    signals.append({
                        'asset': asset,
                        'type': 'DIP_BUY',
                        'price': price,
                        'change': change,
                        'correlation': correlation,
                        'conviction': 'HIGH' if abs(change) > 15 else 'MEDIUM'
                    })
                elif change > 15:
                    signals.append({
                        'asset': asset,
                        'type': 'MOMENTUM',
                        'price': price,
                        'change': change,
                        'correlation': correlation,
                        'conviction': 'MEDIUM'
                    })
                    
        except Exception as e:
            pass
    
    # Position correlation check
    print(f"\n📈 CURRENT POSITIONS ({len(current_positions)}):")
    alt_count = sum(1 for p in current_positions if p['asset'] not in ['BTC-USDC', 'BTC-USD'])
    print(f"   Alts: {alt_count}/5 | BTC correlation risk: {'HIGH' if alt_count > 2 else 'MEDIUM' if alt_count > 1 else 'LOW'}")
    
    # Signals summary
    if signals:
        print(f"\n🎯 SIGNALS ({len(signals)}):")
        for sig in signals:
            print(f"   {sig['type']}: {sig['asset']} @ ${sig['price']:.4f}")
            print(f"      Conviction: {sig['conviction']} | {sig['correlation']}")
    else:
        print("\n🎯 No high-conviction signals")
    
    print("\n" + "=" * 60)
    
    return signals

if __name__ == '__main__':
    scan_market()
