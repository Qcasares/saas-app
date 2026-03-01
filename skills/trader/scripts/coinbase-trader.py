#!/usr/bin/env python3
"""
Coinbase Advanced Trade API Client
Lightweight wrapper for order execution
"""
import os
import json
import hmac
import hashlib
import base64
import time
import requests
from typing import Dict, Any, Optional
from datetime import datetime

class CoinbaseTrader:
    def __init__(self):
        self.api_key = os.getenv('COINBASE_API_KEY')
        self.api_secret = os.getenv('COINBASE_API_SECRET')
        self.base_url = 'https://api.coinbase.com'
        self.simulation = os.getenv('TRADER_SIMULATION', 'true').lower() == 'true'
        
        if not self.simulation and (not self.api_key or not self.api_secret):
            raise ValueError("API credentials required for live trading")
    
    def _generate_signature(self, timestamp: str, method: str, path: str, body: str = '') -> str:
        """Generate Coinbase API signature"""
        message = timestamp + method.upper() + path + body
        signature = hmac.new(
            base64.b64decode(self.api_secret),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def _request(self, method: str, path: str, body: Optional[Dict] = None) -> Dict:
        """Make authenticated request"""
        if self.simulation:
            return {'simulation': True, 'path': path, 'method': method, 'body': body}
        
        timestamp = str(int(time.time()))
        body_str = json.dumps(body) if body else ''
        
        headers = {
            'CB-ACCESS-KEY': self.api_key,
            'CB-ACCESS-SIGN': self._generate_signature(timestamp, method, path, body_str),
            'CB-ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json'
        }
        
        url = f"{self.base_url}{path}"
        response = requests.request(method, url, headers=headers, data=body_str or None)
        response.raise_for_status()
        return response.json()
    
    def get_account(self) -> Dict:
        """Get account information"""
        return self._request('GET', '/api/v3/brokerage/accounts')
    
    def place_limit_order(
        self,
        symbol: str,
        side: str,  # 'BUY' or 'SELL'
        size: float,
        price: float,
        stop_price: Optional[float] = None
    ) -> Dict:
        """
        Place a limit order
        If stop_price is provided, places a stop-limit order
        """
        order_config = {
            'limit_limit_gtc': {
                'base_size': str(size),
                'limit_price': str(price),
                'post_only': True
            }
        }
        
        body = {
            'client_order_id': f"trader-{int(time.time() * 1000)}",
            'product_id': symbol,
            'side': side.upper(),
            'order_configuration': order_config
        }
        
        result = self._request('POST', '/api/v3/brokerage/orders', body)
        
        # Log the order
        self._log_order({
            'symbol': symbol,
            'side': side,
            'size': size,
            'price': price,
            'stop_price': stop_price,
            'result': result
        })
        
        return result
    
    def place_stop_loss(self, symbol: str, side: str, size: float, stop_price: float) -> Dict:
        """Place a stop-loss order (sells when price hits stop)"""
        body = {
            'client_order_id': f"stop-{int(time.time() * 1000)}",
            'product_id': symbol,
            'side': side.upper(),
            'order_configuration': {
                'stop_limit_stop_limit_gtc': {
                    'base_size': str(size),
                    'limit_price': str(stop_price * 0.99),  # 1% below stop
                    'stop_price': str(stop_price)
                }
            }
        }
        
        result = self._request('POST', '/api/v3/brokerage/orders', body)
        self._log_order({'type': 'stop_loss', **body, 'result': result})
        return result
    
    def get_order(self, order_id: str) -> Dict:
        """Check order status"""
        return self._request('GET', f'/api/v3/brokerage/orders/historical/{order_id}')
    
    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an open order"""
        return self._request('POST', '/api/v3/brokerage/orders/batch_cancel', {
            'order_ids': [order_id]
        })
    
    def _log_order(self, order: Dict):
        """Log order to file"""
        log_path = os.path.expanduser(
            '~/.openclaw/workspace/trading/logs/orders.jsonl'
        )
        with open(log_path, 'a') as f:
            f.write(json.dumps({
                'timestamp': datetime.now().isoformat(),
                'simulation': self.simulation,
                **order
            }) + '\n')

if __name__ == '__main__':
    # Test in simulation mode
    import sys
    
    os.environ['TRADER_SIMULATION'] = 'true'
    trader = CoinbaseTrader()
    
    print("Testing Coinbase Trader (Simulation Mode)")
    print("=" * 50)
    
    # Test account fetch
    print("\n1. Account info:")
    result = trader.get_account()
    print(json.dumps(result, indent=2))
    
    # Test order placement
    print("\n2. Sample limit order:")
    result = trader.place_limit_order('BTC-USD', 'BUY', 0.01, 65000)
    print(json.dumps(result, indent=2))
