#!/usr/bin/env python3
"""Auto-convert GBP to USDC when detected. Uses USDC-GBP pair."""
import os
import sys
import json
from datetime import datetime
from pathlib import Path

sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/skills/trader/scripts')

def main():
    try:
        from coinbase_trader import CoinbaseTrader
        import uuid
        
        # Force live mode
        os.environ['TRADER_SIMULATION'] = 'false'
        trader = CoinbaseTrader(simulation=False)
        
        accounts = trader.get_accounts()
        gbp_account = next((a for a in accounts if a['currency'] == 'GBP'), None)
        
        if not gbp_account or gbp_account['available'] <= 0.01:
            print("No GBP to convert")
            return
        
        gbp_balance = gbp_account['available']
        
        # Skip if negative balance (from previous trades)
        if gbp_balance <= 0:
            print(f"GBP balance is {gbp_balance:.4f}, skipping")
            return
        
        print(f"GBP detected: £{gbp_balance:.2f}")
        
        # Get current price
        product = trader.client.get_product('USDC-GBP')
        price = float(product.price)
        
        # Calculate USDC to buy (use 99% to account for fees/spread)
        gbp_to_use = gbp_balance * 0.99
        usdc_amount = gbp_to_use / price
        
        # Place limit order 0.5% above market to ensure fill
        limit_price = price * 1.005
        
        # Respect base_increment precision (0.01 for USDC)
        usdc_amount_rounded = round(usdc_amount, 2)
        # Respect quote_increment precision (0.0001 for GBP)
        limit_price_rounded = round(limit_price, 4)
        
        print(f"Converting: £{gbp_to_use:.2f} → ~{usdc_amount_rounded:.2f} USDC")
        print(f"Rate: 1 USDC = £{price:.4f}")
        
        order = trader.client.limit_order_gtc(
            product_id='USDC-GBP',
            side='BUY',
            base_size=str(usdc_amount_rounded),
            limit_price=str(limit_price_rounded),
            client_order_id=str(uuid.uuid4())
        )
        
        if order.success:
            print(f"✅ Conversion successful!")
            conversion = {
                "timestamp": datetime.now().isoformat(),
                "type": "gbp_to_usdc",
                "gbp_amount": gbp_to_use,
                "expected_usdc": usdc_amount,
                "rate": price,
                "status": "executed"
            }
        else:
            print(f"❌ Conversion failed")
            conversion = {
                "timestamp": datetime.now().isoformat(),
                "type": "gbp_to_usdc",
                "gbp_amount": gbp_balance,
                "status": "failed"
            }
        
        # Log to executions
        exec_path = Path('/Users/quentincasares/.openclaw/workspace/trading/executions.json')
        existing = []
        if exec_path.exists():
            with open(exec_path) as f:
                try:
                    existing = json.load(f)
                except:
                    existing = []
        
        existing.append(conversion)
        with open(exec_path, 'w') as f:
            json.dump(existing, f, indent=2)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
