#!/usr/bin/env python3
"""
KINGKONG Crypto Command Center
Real-time market monitoring using CoinGecko
"""

import requests
import json
from datetime import datetime
from pathlib import Path

# Config
WATCHLIST = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'ripple', 'cardano', 'avalanche-2', 'chainlink']
ALERT_THRESHOLD_PCT = 3

# Paths
WORKSPACE = Path.home() / '.openclaw' / 'workspace'
DATA_DIR = WORKSPACE / 'trading'
DATA_DIR.mkdir(exist_ok=True)

class CryptoCommandCenter:
    def __init__(self):
        self.prices = {}
        self.prev_prices = self.load_previous()
        self.api = "https://api.coingecko.com/api/v3"
        
    def load_previous(self):
        price_file = DATA_DIR / 'prices.json'
        if price_file.exists():
            with open(price_file) as f:
                return json.load(f)
        return {}
    
    def save_prices(self):
        price_file = DATA_DIR / 'prices.json'
        with open(price_file, 'w') as f:
            json.dump(self.prices, f, indent=2)
    
    def fetch_prices(self):
        """Fetch current prices for watchlist"""
        try:
            url = f"{self.api}/coins/markets"
            params = {
                'vs_currency': 'usd',
                'ids': ','.join(WATCHLIST),
                'order': 'market_cap_desc',
                'per_page': len(WATCHLIST),
                'page': 1,
                'sparkline': False,
                'price_change_percentage': '24h'
            }
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()
            
            for coin in data:
                self.prices[coin['id']] = {
                    'symbol': coin['symbol'].upper(),
                    'price': coin['current_price'],
                    'volume': coin['total_volume'],
                    'change_24h': coin.get('price_change_percentage_24h', 0),
                    'market_cap': coin['market_cap'],
                    'timestamp': datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Error fetching: {e}")
            
        self.save_prices()
        return self.prices
    
    def check_alerts(self):
        """Check for significant price movements"""
        alerts = []
        for coin_id, data in self.prices.items():
            if coin_id not in self.prev_prices:
                continue
                
            prev = self.prev_prices[coin_id].get('price', 0)
            curr = data['price']
            if prev > 0:
                pct_change = ((curr - prev) / prev) * 100
                if abs(pct_change) >= ALERT_THRESHOLD_PCT:
                    alerts.append({
                        'symbol': data['symbol'],
                        'direction': '📈' if pct_change > 0 else '📉',
                        'pct': round(pct_change, 2),
                        'price': curr
                    })
        return alerts
    
    def get_market_summary(self):
        """Get overall market status"""
        valid_prices = [d for d in self.prices.values()]
        if not valid_prices:
            return {'market_sentiment': '⚪ UNKNOWN'}
            
        avg_change = sum(d.get('change_24h', 0) for d in valid_prices) / len(valid_prices)
        total_volume = sum(d.get('volume', 0) for d in valid_prices)
        
        return {
            'timestamp': datetime.now().isoformat(),
            'pairs_tracked': len(valid_prices),
            'total_volume_24h': total_volume,
            'avg_change_24h': avg_change,
            'market_sentiment': '🟢 BULLISH' if avg_change > 2 else '🔴 BEARISH' if avg_change < -2 else '⚪ NEUTRAL'
        }
    
    def run(self):
        """Main loop"""
        print("🦍 KINGKONG Crypto Command Center")
        print("=" * 50)
        
        self.fetch_prices()
        
        if not self.prices:
            print("❌ Failed to fetch prices")
            return
        
        # Display prices
        print(f"\n{'Coin':<8} {'Price':<14} {'24h %':<10} {'Volume (M)'}")
        print("-" * 50)
        for coin_id, data in self.prices.items():
            vol_m = data.get('volume', 0) / 1_000_000
            print(f"{data['symbol']:<8} ${data['price']:>10.2f} {data['change_24h']:>+7.2f}% ${vol_m:>6.1f}M")
        
        # Market summary
        summary = self.get_market_summary()
        print(f"\n📊 Market: {summary['market_sentiment']} | Avg 24h: {summary['avg_change_24h']:+.2f}%")
        
        # Alerts
        alerts = self.check_alerts()
        if alerts:
            print("\n🚨 ALERTS:")
            for a in alerts:
                print(f"  {a['direction']} {a['symbol']}: {a['pct']:+.2f}% (${a['price']})")
        
        # Save for next run
        self.save_prices()
        
        return self.prices, alerts

if __name__ == '__main__':
    center = CryptoCommandCenter()
    center.run()
