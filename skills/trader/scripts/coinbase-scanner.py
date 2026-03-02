#!/usr/bin/env python3
"""
Coinbase Market Scanner - Real-time data for Trader Agent
Integrates with Coinbase Advanced Trade API for live prices, trends, and alerts
"""
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
from datetime import datetime, timedelta
import json

class CoinbaseMarketScanner:
    """Real-time market scanner using Coinbase Advanced Trade API"""
    
    def __init__(self):
        self.client = RESTClient(
            api_key=os.environ['COINBASE_API_KEY'],
            api_secret=os.environ['COINBASE_API_SECRET']
        )
        self.watchlist = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'SOL-GBP', 'BTC-GBP']
    
    def get_all_prices(self):
        """Get real-time prices for all watched pairs"""
        prices = {}
        for pair in self.watchlist:
            try:
                product = self.client.get_product(pair)
                prices[pair] = {
                    'price': float(product.price),
                    'bid': float(getattr(product, 'bid', 0)),
                    'ask': float(getattr(product, 'ask', 0)),
                    'volume_24h': float(getattr(product, 'volume_24h', 0)),
                    'percent_change_24h': float(getattr(product, 'price_percentage_change_24h', 0)),
                    'timestamp': datetime.now().isoformat()
                }
            except Exception as e:
                prices[pair] = {'error': str(e)}
        return prices
    
    def get_candles(self, product_id, granularity='ONE_HOUR', limit=24):
        """Get recent price candles for technical analysis"""
        try:
            candles = self.client.get_candles(
                product_id=product_id,
                start=int((datetime.now() - timedelta(hours=limit)).timestamp()),
                end=int(datetime.now().timestamp()),
                granularity=granularity
            )
            return candles
        except Exception as e:
            return {'error': str(e)}
    
    def analyze_trend(self, product_id='SOL-USD'):
        """Simple trend analysis using recent candles"""
        candles = self.get_candles(product_id, granularity='ONE_HOUR', limit=12)
        
        if isinstance(candles, dict) and 'error' in candles:
            return {'error': candles['error']}
        
        # Calculate basic trend
        try:
            opens = [float(c.open) for c in candles.candles[-6:]]  # Last 6 hours
            closes = [float(c.close) for c in candles.candles[-6:]]
            
            avg_open = sum(opens) / len(opens)
            avg_close = sum(closes) / len(closes)
            
            change_pct = ((avg_close - avg_open) / avg_open) * 100
            
            # Determine trend
            if change_pct > 2:
                trend = 'BULLISH 📈'
            elif change_pct < -2:
                trend = 'BEARISH 📉'
            else:
                trend = 'NEUTRAL ↔️'
            
            return {
                'trend': trend,
                'change_6h_pct': round(change_pct, 2),
                'current_price': closes[-1],
                'avg_price_6h': round(avg_close, 2)
            }
        except Exception as e:
            return {'error': str(e)}
    
    def check_portfolio_alerts(self):
        """Check portfolio positions against targets"""
        accounts = self.client.get_accounts()
        alerts = []
        
        # Get SOL entry price from earlier trades (would normally be from journal)
        sol_entry = 87.50  # USD
        
        for acc in accounts.accounts:
            if acc.currency == 'SOL':
                bal = acc.available_balance
                balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
                
                if balance > 0:
                    # Get current SOL price
                    price_data = self.client.get_product('SOL-USD')
                    current_price = float(price_data.price)
                    
                    # Calculate gain/loss
                    gain_pct = ((current_price - sol_entry) / sol_entry) * 100
                    gain_usd = balance * (current_price - sol_entry)
                    
                    # Check alerts
                    if gain_pct >= 20:
                        alerts.append({
                            'type': 'PROFIT_TARGET',
                            'asset': 'SOL',
                            'gain_pct': round(gain_pct, 2),
                            'gain_usd': round(gain_usd, 2),
                            'message': f'🎯 SOL hit +{gain_pct:.1f}%! Consider taking profits'
                        })
                    elif gain_pct <= -10:
                        alerts.append({
                            'type': 'STOP_LOSS',
                            'asset': 'SOL', 
                            'loss_pct': round(gain_pct, 2),
                            'loss_usd': round(gain_usd, 2),
                            'message': f'🛑 SOL down {gain_pct:.1f}%! Consider cutting loss'
                        })
                    
                    alerts.append({
                        'type': 'POSITION_UPDATE',
                        'asset': 'SOL',
                        'balance': balance,
                        'current_price': current_price,
                        'entry_price': sol_entry,
                        'gain_pct': round(gain_pct, 2),
                        'gain_usd': round(gain_usd, 2)
                    })
        
        return alerts
    
    def generate_market_report(self):
        """Generate comprehensive market report for Trader Agent"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'prices': self.get_all_prices(),
            'trends': {},
            'alerts': self.check_portfolio_alerts(),
            'recommendations': []
        }
        
        # Analyze trends
        for pair in ['SOL-USD', 'BTC-USD', 'ETH-USD']:
            report['trends'][pair] = self.analyze_trend(pair)
        
        # Generate recommendations
        sol_trend = report['trends'].get('SOL-USD', {})
        if isinstance(sol_trend, dict) and 'trend' in sol_trend:
            if 'BULLISH' in sol_trend['trend']:
                report['recommendations'].append('SOL showing strength - consider adding on dips')
            elif 'BEARISH' in sol_trend['trend']:
                report['recommendations'].append('SOL weakening - monitor for exit signals')
        
        # Check for profit taking
        for alert in report['alerts']:
            if alert['type'] == 'PROFIT_TARGET':
                report['recommendations'].append(f"💰 TAKE PROFIT: {alert['message']}")
            elif alert['type'] == 'STOP_LOSS':
                report['recommendations'].append(f"🛑 STOP LOSS: {alert['message']}")
        
        return report
    
    def save_report(self, report, filepath=None):
        """Save report to file for Trader Agent to read"""
        if filepath is None:
            filepath = '/Users/quentincasares/.openclaw/workspace/trading/MARKET-ANALYSIS.json'
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        return filepath
    
    def print_summary(self, report):
        """Print formatted summary"""
        print("=" * 60)
        print("📊 COINBASE MARKET SCAN")
        print("=" * 60)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S GMT')}")
        print()
        
        # Prices
        print("💰 LIVE PRICES:")
        print("-" * 40)
        for pair, data in report['prices'].items():
            if 'error' not in data:
                emoji = "🚀" if data.get('percent_change_24h', 0) > 0 else "📉"
                print(f"{emoji} {pair:12} ${data['price']:>10,.2f} ({data.get('percent_change_24h', 0):+.2f}%)")
        print()
        
        # Trends
        print("📈 TREND ANALYSIS (6H):")
        print("-" * 40)
        for pair, trend in report['trends'].items():
            if 'error' not in trend:
                print(f"{pair:12} {trend['trend']:12} ({trend['change_6h_pct']:+.2f}%)")
        print()
        
        # Portfolio
        print("💼 PORTFOLIO POSITIONS:")
        print("-" * 40)
        for alert in report['alerts']:
            if alert['type'] == 'POSITION_UPDATE':
                emoji = "🟢" if alert['gain_pct'] > 0 else "🔴"
                print(f"{emoji} {alert['asset']}: ${alert['current_price']:.2f} (Entry: ${alert['entry_price']:.2f})")
                print(f"   P&L: {alert['gain_pct']:+.2f}% (${alert['gain_usd']:+.2f})")
        print()
        
        # Recommendations
        if report['recommendations']:
            print("⚡ RECOMMENDATIONS:")
            print("-" * 40)
            for rec in report['recommendations']:
                print(f"  • {rec}")
            print()
        
        print("=" * 60)


def main():
    """Run market scan and save report"""
    scanner = CoinbaseMarketScanner()
    
    print("🔍 Scanning Coinbase markets...")
    report = scanner.generate_market_report()
    
    # Print to console
    scanner.print_summary(report)
    
    # Save to file
    filepath = scanner.save_report(report)
    print(f"📄 Report saved: {filepath}")
    
    # Also save as markdown for human reading
    md_path = '/Users/quentincasares/.openclaw/workspace/trading/MARKET-ANALYSIS.md'
    with open(md_path, 'w') as f:
        f.write(f"# Market Analysis - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
        f.write("## Live Prices (Coinbase)\n\n")
        for pair, data in report['prices'].items():
            if 'error' not in data:
                f.write(f"- **{pair}**: ${data['price']:,.2f} ({data.get('percent_change_24h', 0):+.2f}% 24h)\n")
        
        f.write("\n## Trends (6H)\n\n")
        for pair, trend in report['trends'].items():
            if 'error' not in trend:
                f.write(f"- **{pair}**: {trend['trend']} ({trend['change_6h_pct']:+.2f}%)\n")
        
        f.write("\n## Portfolio Alerts\n\n")
        for alert in report['alerts']:
            if alert['type'] == 'POSITION_UPDATE':
                f.write(f"- **{alert['asset']}**: ${alert['current_price']:.2f} | P&L: {alert['gain_pct']:+.2f}%\n")
        
        if report['recommendations']:
            f.write("\n## Recommendations\n\n")
            for rec in report['recommendations']:
                f.write(f"- {rec}\n")
    
    print(f"📄 Markdown saved: {md_path}")


if __name__ == '__main__':
    main()
