#!/usr/bin/env python3
"""Auto-execute stops and take-profits for active positions"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/skills/trader/scripts')
os.environ['TRADER_SIMULATION'] = 'false'

from coinbase_trader import CoinbaseTrader
import uuid

def main():
    trader = CoinbaseTrader(simulation=False)
    
    # Load positions
    positions_path = Path('/Users/quentincasares/.openclaw/workspace/trading/active-positions.json')
    if not positions_path.exists():
        print("No positions to monitor")
        return
    
    with open(positions_path) as f:
        positions = json.load(f)
    
    print(f"Monitoring {len(positions)} positions...")
    
    updated_positions = []
    actions_taken = []
    
    for pos in positions:
        asset = pos['asset']
        entry = pos['entry_price']
        stop = pos['stop_loss']
        tp1 = pos['targets'][0]['price'] if pos['targets'] else entry * 1.5
        tp2 = pos['targets'][1]['price'] if len(pos['targets']) > 1 else entry * 2.0
        
        # Get current price
        try:
            product = trader.client.get_product(asset)
            current = float(product.price)
            change_pct = (current - entry) / entry * 100
            
            print(f"\n{asset}: ${current:.4f} ({change_pct:+.2f}% from entry)")
            
            # Check stop loss
            if current <= stop:
                print(f"   🛑 STOP HIT! Executing sell...")
                size = pos['position_size']
                
                order = trader.client.market_order_sell(
                    product_id=asset,
                    base_size=str(round(size, 6)),
                    client_order_id=str(uuid.uuid4())
                )
                
                if order.success:
                    print(f"   ✅ Sold {size} {asset}")
                    pos['status'] = 'closed_stop'
                    pos['exit_price'] = current
                    pos['exit_time'] = datetime.now().isoformat()
                    pos['pnl_pct'] = change_pct
                    actions_taken.append(f"STOP: {asset} @ ${current:.4f} ({change_pct:.2f}%)")
                else:
                    print(f"   ❌ Sell failed")
                    updated_positions.append(pos)
                    
            # Check TP1 (sell 50%)
            elif current >= tp1 and not pos.get('tp1_hit'):
                print(f"   🎯 TP1 HIT! Scaling out 50%...")
                size = pos['position_size'] * 0.5
                
                order = trader.client.market_order_sell(
                    product_id=asset,
                    base_size=str(round(size, 6)),
                    client_order_id=str(uuid.uuid4())
                )
                
                if order.success:
                    print(f"   ✅ Sold 50% ({size} {asset})")
                    pos['tp1_hit'] = True
                    pos['tp1_price'] = current
                    pos['tp1_time'] = datetime.now().isoformat()
                    actions_taken.append(f"TP1: {asset} @ ${current:.4f}")
                    updated_positions.append(pos)
                else:
                    print(f"   ❌ Sell failed")
                    updated_positions.append(pos)
                    
            # Check TP2 (sell remaining)
            elif current >= tp2 and not pos.get('tp2_hit'):
                print(f"   🎯 TP2 HIT! Closing position...")
                size = pos['position_size']
                if pos.get('tp1_hit'):
                    size = size * 0.5  # Only 50% left
                
                order = trader.client.market_order_sell(
                    product_id=asset,
                    base_size=str(round(size, 6)),
                    client_order_id=str(uuid.uuid4())
                )
                
                if order.success:
                    print(f"   ✅ Closed position ({size} {asset})")
                    pos['tp2_hit'] = True
                    pos['status'] = 'closed_tp2'
                    pos['exit_price'] = current
                    pos['exit_time'] = datetime.now().isoformat()
                    pos['pnl_pct'] = change_pct
                    actions_taken.append(f"TP2: {asset} @ ${current:.4f} ({change_pct:.2f}%)")
                else:
                    print(f"   ❌ Sell failed")
                    updated_positions.append(pos)
            else:
                # No action needed
                updated_positions.append(pos)
                
        except Exception as e:
            print(f"   Error checking {asset}: {e}")
            updated_positions.append(pos)
    
    # Save updated positions
    with open(positions_path, 'w') as f:
        json.dump(updated_positions, f, indent=2)
    
    # Log actions
    if actions_taken:
        log_path = Path('/Users/quentincasares/.openclaw/workspace/trading/auto-executions.log')
        with open(log_path, 'a') as f:
            for action in actions_taken:
                f.write(f"{datetime.now().isoformat()}: {action}\n")
        print(f"\n📊 Actions taken: {len(actions_taken)}")
        for action in actions_taken:
            print(f"   {action}")
    else:
        print("\n📊 No actions needed")

if __name__ == '__main__':
    main()
