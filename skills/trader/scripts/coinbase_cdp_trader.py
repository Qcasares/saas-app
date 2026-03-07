#!/usr/bin/env python3
"""
Coinbase CDP API Client (Coinbase Developer Platform)
Uses CDP API keys (different from Advanced Trade API)
"""
import os
import sys
import json
import base64
import hashlib
import hmac
import time
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List

class CoinbaseCDPTrader:
    """Coinbase CDP API wrapper for automated trading"""
    
    BASE_URL = "https://api.coinbase.com"
    
    def __init__(self, simulation: bool = True):
        self.api_key = os.getenv('COINBASE_API_KEY', '').strip().strip('"').strip("'")
        self.api_secret = os.getenv('COINBASE_API_SECRET', '').strip().strip('"').strip("'")
        self.simulation = simulation
        
        if not self.api_key or not self.api_secret:
            print("⚠️  Warning: COINBASE_API_KEY or COINBASE_API_SECRET not set")
            print("    Running in simulation mode only")
            self.simulation = True
    
    def _generate_signature(self, timestamp: str, method: str, path: str, body: str = "") -> str:
        """Generate JWT signature for CDP API"""
        message = timestamp + method.upper() + path + body
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _make_request(self, method: str, path: str, body: str = "") -> Dict:
        """Make authenticated request to CDP API"""
        timestamp = str(int(time.time()))
        signature = self._generate_signature(timestamp, method, path, body)
        
        headers = {
            "accept": "application/json",
            "CB-ACCESS-KEY": self.api_key,
            "CB-ACCESS-SIGN": signature,
            "CB-ACCESS-TIMESTAMP": timestamp,
            "Content-Type": "application/json"
        }
        
        url = f"{self.BASE_URL}{path}"
        
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, data=body, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    def get_accounts(self) -> List[Dict]:
        """Get all account balances"""
        try:
            data = self._make_request("GET", "/v2/accounts")
            accounts = []
            for acc in data.get('data', []):
                balance = float(acc.get('balance', {}).get('amount', 0))
                if balance > 0:
                    accounts.append({
                        'currency': acc.get('balance', {}).get('currency', 'UNKNOWN'),
                        'balance': balance,
                        'available': balance,
                        'hold': 0
                    })
            return accounts
        except Exception as e:
            print(f"❌ Error fetching accounts: {e}")
            return []
    
    def get_price(self, product_id: str = 'BTC-USD') -> Dict[str, Any]:
        """Get current price for a trading pair"""
        try:
            # Use public API for prices (no auth needed)
            base, quote = product_id.split('-')
            url = f"{self.BASE_URL}/v2/exchange-rates?currency={base}"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            usd_rate = float(data['data']['rates']['USD'])
            return {
                'product_id': product_id,
                'price': usd_rate,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Error fetching price: {e}")
            return {'product_id': product_id, 'price': 0, 'error': str(e)}
    
    def place_market_order(
        self,
        product_id: str,
        side: str,
        amount: float,
        amount_type: str = 'quote'
    ) -> Dict:
        """Place a market order"""
        if self.simulation:
            return {
                'simulation': True,
                'product_id': product_id,
                'side': side,
                'amount': amount,
                'amount_type': amount_type,
                'status': 'simulated'
            }
        
        # Build order payload
        payload = {
            "type": "market",
            "side": side.lower(),
            "product_id": product_id,
        }
        
        if amount_type == 'quote':
            payload["funds"] = str(amount)
        else:
            payload["size"] = str(amount)
        
        body = json.dumps(payload)
        result = self._make_request("POST", "/v2/orders", body)
        
        self._log_order({
            'order_id': result.get('id', 'unknown'),
            **payload,
            'status': result.get('status', 'unknown')
        })
        
        return result
    
    def _log_order(self, order: Dict):
        """Log order to file"""
        log_dir = os.path.expanduser('~/.openclaw/workspace/trading/logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_path = os.path.join(log_dir, 'orders-cdp.jsonl')
        with open(log_path, 'a') as f:
            f.write(json.dumps({
                'timestamp': datetime.now().isoformat(),
                'simulation': self.simulation,
                **order
            }) + '\n')
    
    def validate_connection(self) -> bool:
        """Test API connection"""
        try:
            accounts = self.get_accounts()
            print(f"✅ Connected to Coinbase CDP API")
            print(f"   Found {len(accounts)} accounts with balances")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False


def main():
    """Test the CDP trader"""
    import argparse
    parser = argparse.ArgumentParser(description='Coinbase CDP Trader CLI')
    parser.add_argument('command', choices=['test', 'price', 'accounts'])
    parser.add_argument('--pair', default='BTC-USD')
    parser.add_argument('--live', action='store_true')
    
    args = parser.parse_args()
    
    trader = CoinbaseCDPTrader(simulation=not args.live)
    
    if args.command == 'test':
        trader.validate_connection()
    elif args.command == 'price':
        price_data = trader.get_price(args.pair)
        print(f"{args.pair}: ${price_data.get('price', 0):,.2f}")
    elif args.command == 'accounts':
        accounts = trader.get_accounts()
        print(f"Accounts with balances: {len(accounts)}")
        for acc in accounts:
            print(f"  {acc['currency']}: {acc['balance']}")


if __name__ == '__main__':
    main()
