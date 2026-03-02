#!/usr/bin/env python3
"""
Coinbase Advanced Trade API Client
Updated to use official Coinbase SDK with JWT authentication
"""
import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional, List

# Add virtual environment path for coinbase SDK
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/.venv/lib/python3.13/site-packages'))

try:
    from coinbase.rest import RESTClient
except ImportError:
    raise ImportError("coinbase-advanced-py not installed. Run: pip install coinbase-advanced-py")

class CoinbaseTrader:
    """Coinbase Advanced Trade API wrapper for automated trading"""
    
    def __init__(self, simulation: bool = True):
        """
        Initialize Coinbase Trader
        
        Args:
            simulation: If True, orders are logged but not executed
        """
        self.api_key = os.getenv('COINBASE_API_KEY')
        self.api_secret = os.getenv('COINBASE_API_SECRET')
        self.simulation = simulation or os.getenv('TRADER_SIMULATION', 'true').lower() == 'true'
        
        if not self.api_key or not self.api_secret:
            raise ValueError("COINBASE_API_KEY and COINBASE_API_SECRET must be set in environment")
        
        # Initialize official SDK client
        self.client = RESTClient(api_key=self.api_key, api_secret=self.api_secret)
        
        # Load configuration
        self.config = self._load_config()
        
    def _load_config(self) -> Dict:
        """Load trader configuration"""
        config_path = os.path.expanduser('~/.openclaw/workspace/skills/trader/config/trader-config.json')
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                'mode': 'simulation',
                'risk_limits': {
                    'max_position_pct': 0.01,
                    'daily_loss_limit_pct': 0.03,
                    'approved_pairs': ['BTC-USD', 'ETH-USD']
                }
            }
    
    def get_accounts(self) -> List[Dict]:
        """Get all account balances"""
        response = self.client.get_accounts()
        accounts = []
        for acc in response.accounts:
            bal = acc.available_balance
            balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
            hold = float(acc.hold['value'] if isinstance(acc.hold, dict) else acc.hold.value)
            accounts.append({
                'currency': acc.currency,
                'balance': balance,
                'hold': hold,
                'available': balance - hold
            })
        return accounts
    
    def get_price(self, product_id: str = 'BTC-USD') -> Dict[str, Any]:
        """Get current price for a trading pair"""
        product = self.client.get_product(product_id)
        return {
            'product_id': product_id,
            'price': float(product.price),
            'bid': float(getattr(product, 'bid', 0)),
            'ask': float(getattr(product, 'ask', 0)),
            'volume_24h': float(getattr(product, 'volume_24h', 0)),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_portfolio_value(self) -> Dict[str, float]:
        """Calculate total portfolio value in USD"""
        accounts = self.get_accounts()
        total_value = 0.0
        holdings = {}
        
        for account in accounts:
            currency = account['currency']
            balance = account['balance']
            
            if balance > 0:
                if currency == 'USD' or currency == 'USDC':
                    value = balance
                else:
                    # Get USD value
                    try:
                        price_data = self.get_price(f"{currency}-USD")
                        value = balance * price_data['price']
                    except Exception:
                        value = 0  # Can't price this asset
                
                holdings[currency] = {
                    'balance': balance,
                    'usd_value': value
                }
                total_value += value
        
        return {
            'total_usd': total_value,
            'holdings': holdings
        }
    
    def place_market_order(
        self,
        product_id: str,
        side: str,  # 'BUY' or 'SELL'
        amount: float,
        amount_type: str = 'quote'  # 'quote' (USD) or 'base' (crypto)
    ) -> Dict:
        """
        Place a market order
        
        Args:
            product_id: Trading pair (e.g., 'BTC-USD')
            side: 'BUY' or 'SELL'
            amount: Amount to trade
            amount_type: 'quote' for USD amount, 'base' for crypto amount
        """
        if self.simulation:
            result = {
                'simulation': True,
                'product_id': product_id,
                'side': side,
                'amount': amount,
                'amount_type': amount_type,
                'status': 'simulated'
            }
            self._log_order(result)
            return result
        
        # Live trading
        side_upper = side.upper()
        
        if side_upper == 'BUY':
            if amount_type == 'quote':
                order = self.client.market_order_buy(
                    product_id=product_id,
                    quote_size=str(amount)
                )
            else:
                order = self.client.market_order_buy(
                    product_id=product_id,
                    base_size=str(amount)
                )
        else:  # SELL
            if amount_type == 'base':
                order = self.client.market_order_sell(
                    product_id=product_id,
                    base_size=str(amount)
                )
            else:
                # Need to calculate base amount from quote
                price_data = self.get_price(product_id)
                base_amount = amount / price_data['price']
                order = self.client.market_order_sell(
                    product_id=product_id,
                    base_size=str(base_amount)
                )
        
        result = {
            'order_id': getattr(order, 'order_id', 'unknown'),
            'product_id': product_id,
            'side': side,
            'amount': amount,
            'status': getattr(order, 'status', 'unknown')
        }
        
        self._log_order(result)
        return result
    
    def place_limit_order(
        self,
        product_id: str,
        side: str,
        base_size: float,
        limit_price: float
    ) -> Dict:
        """Place a limit order"""
        if self.simulation:
            result = {
                'simulation': True,
                'type': 'limit_order',
                'product_id': product_id,
                'side': side,
                'base_size': base_size,
                'limit_price': limit_price
            }
            self._log_order(result)
            return result
        
        # Live limit order
        order = self.client.limit_order_gtc(
            product_id=product_id,
            side=side.upper(),
            base_size=str(base_size),
            limit_price=str(limit_price)
        )
        
        result = {
            'order_id': getattr(order, 'order_id', 'unknown'),
            'product_id': product_id,
            'side': side,
            'base_size': base_size,
            'limit_price': limit_price,
            'status': getattr(order, 'status', 'unknown')
        }
        
        self._log_order(result)
        return result
    
    def get_open_orders(self) -> List[Dict]:
        """Get list of open orders"""
        response = self.client.get_orders()
        orders = []
        for order in getattr(response, 'orders', []):
            orders.append({
                'order_id': getattr(order, 'order_id', 'unknown'),
                'product_id': getattr(order, 'product_id', 'unknown'),
                'side': getattr(order, 'side', 'unknown'),
                'status': getattr(order, 'status', 'unknown')
            })
        return orders
    
    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an open order"""
        if self.simulation:
            return {'simulation': True, 'action': 'cancel', 'order_id': order_id}
        
        result = self.client.cancel_orders(order_ids=[order_id])
        return {'order_id': order_id, 'result': result}
    
    def market_scan(self, pairs: List[str] = None) -> Dict[str, Dict]:
        """
        Scan market prices for multiple trading pairs
        
        Returns price data for approved pairs from config
        """
        if pairs is None:
            pairs = self.config.get('risk_limits', {}).get('approved_pairs', ['BTC-USD', 'ETH-USD'])
        
        results = {}
        for pair in pairs:
            try:
                results[pair] = self.get_price(pair)
            except Exception as e:
                results[pair] = {'error': str(e)}
        
        return results
    
    def _log_order(self, order: Dict):
        """Log order to file"""
        log_dir = os.path.expanduser('~/.openclaw/workspace/trading/logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_path = os.path.join(log_dir, 'orders.jsonl')
        with open(log_path, 'a') as f:
            f.write(json.dumps({
                'timestamp': datetime.now().isoformat(),
                'simulation': self.simulation,
                **order
            }) + '\n')
    
    def generate_market_report(self) -> str:
        """Generate a formatted market report"""
        lines = []
        lines.append("📊 COINBASE MARKET REPORT")
        lines.append("=" * 50)
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        
        # Portfolio
        lines.append("💰 PORTFOLIO")
        lines.append("-" * 30)
        try:
            portfolio = self.get_portfolio_value()
            lines.append(f"Total Value: ${portfolio['total_usd']:,.2f}")
            lines.append("")
            for currency, data in portfolio['holdings'].items():
                if data['usd_value'] > 0.01:
                    lines.append(f"  {currency:6} {data['balance']:12.6f} (${data['usd_value']:,.2f})")
        except Exception as e:
            lines.append(f"Error loading portfolio: {e}")
        
        lines.append("")
        
        # Market Prices
        lines.append("📈 MARKET PRICES")
        lines.append("-" * 30)
        try:
            prices = self.market_scan()
            for pair, data in prices.items():
                if 'error' in data:
                    lines.append(f"  {pair}: Error - {data['error']}")
                else:
                    lines.append(f"  {pair}: ${data['price']:,.2f}")
        except Exception as e:
            lines.append(f"Error loading prices: {e}")
        
        lines.append("")
        lines.append(f"Mode: {'🔒 SIMULATION' if self.simulation else '🔴 LIVE TRADING'}")
        
        return '\n'.join(lines)


def main():
    """CLI interface for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Coinbase Trader CLI')
    parser.add_argument('command', choices=['test', 'price', 'accounts', 'portfolio', 'scan', 'report'])
    parser.add_argument('--pair', default='BTC-USD', help='Trading pair (e.g., BTC-USD)')
    parser.add_argument('--live', action='store_true', help='Enable live trading (default: simulation)')
    
    args = parser.parse_args()
    
    # Set simulation mode
    if not args.live:
        os.environ['TRADER_SIMULATION'] = 'true'
    
    trader = CoinbaseTrader(simulation=not args.live)
    
    if args.command == 'test':
        print("🔌 Testing Coinbase Trader Connection...")
        accounts = trader.get_accounts()
        print(f"✅ Connected! Found {len(accounts)} accounts")
        print(f"📊 Mode: {'Simulation' if trader.simulation else 'LIVE'}")
    
    elif args.command == 'price':
        price_data = trader.get_price(args.pair)
        print(f"{args.pair}: ${price_data['price']:,.2f}")
    
    elif args.command == 'accounts':
        accounts = trader.get_accounts()
        print("Account Balances:")
        print("-" * 40)
        for acc in accounts:
            if acc['balance'] > 0:
                print(f"  {acc['currency']:10} {acc['balance']:15} (available: {acc['available']})")
    
    elif args.command == 'portfolio':
        portfolio = trader.get_portfolio_value()
        print(f"Total Value: ${portfolio['total_usd']:,.2f}")
        print("\nHoldings:")
        for currency, data in portfolio['holdings'].items():
            if data['usd_value'] > 0.01:
                print(f"  {currency}: {data['balance']:.6f} (${data['usd_value']:.2f})")
    
    elif args.command == 'scan':
        results = trader.market_scan()
        print("Market Scan:")
        for pair, data in results.items():
            if 'error' in data:
                print(f"  {pair}: Error")
            else:
                print(f"  {pair}: ${data['price']:,.2f}")
    
    elif args.command == 'report':
        print(trader.generate_market_report())


if __name__ == '__main__':
    main()
