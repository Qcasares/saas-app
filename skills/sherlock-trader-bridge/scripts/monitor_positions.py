#!/usr/bin/env python3
"""
Monitor active positions and execute profit-taking
Runs continuously, checks positions every 5 minutes
"""
import json
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/skills/trader/scripts')

def load_positions():
    """Load active positions"""
    path = Path('trading/active-positions.json')
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)

def save_positions(positions):
    """Save active positions"""
    path = Path('trading/active-positions.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(positions, f, indent=2)

def get_current_price(asset):
    """Get current price from Coinbase"""
    try:
        from coinbase_trader import CoinbaseTrader
        trader = CoinbaseTrader(simulation=True)  # Just for price fetch
        price_data = trader.get_price(asset)
        return price_data['price']
    except Exception as e:
        print(f"  ⚠️ Could not fetch price for {asset}: {e}")
        return None

def check_position(position, current_price):
    """Check position against targets and stops"""
    asset = position['asset']
    direction = position['direction']
    entry = position['entry_price']
    targets = position['targets']
    stop = position['stop_loss']
    
    actions = []
    
    if direction == 'LONG':
        pnl_pct = (current_price - entry) / entry
        
        # Check stop loss
        if current_price <= stop:
            actions.append({
                'action': 'CLOSE_ALL',
                'reason': 'stop_loss',
                'price': current_price,
                'pnl_pct': pnl_pct
            })
            return actions
        
        # Check targets
        if not position.get('tp1_hit') and len(targets) >= 1:
            if current_price >= targets[0]['price']:
                actions.append({
                    'action': 'TAKE_PROFIT_1',
                    'size_pct': targets[0]['size_pct'],
                    'price': current_price,
                    'pnl_pct': pnl_pct
                })
        
        if position.get('tp1_hit') and not position.get('tp2_hit') and len(targets) >= 2:
            if current_price >= targets[1]['price']:
                actions.append({
                    'action': 'TAKE_PROFIT_2',
                    'size_pct': targets[1]['size_pct'],
                    'price': current_price,
                    'pnl_pct': pnl_pct
                })
        
        # Trailing stop logic
        if position.get('trailing_active') and position.get('trailing_stop'):
            if current_price <= position['trailing_stop']:
                actions.append({
                    'action': 'CLOSE_ALL',
                    'reason': 'trailing_stop',
                    'price': current_price,
                    'pnl_pct': pnl_pct
                })
    
    else:  # SHORT
        pnl_pct = (entry - current_price) / entry
        
        # Inverse logic for shorts
        if current_price >= stop:  # Stop is above entry for shorts
            actions.append({
                'action': 'CLOSE_ALL',
                'reason': 'stop_loss',
                'price': current_price,
                'pnl_pct': pnl_pct
            })
            return actions
        
        if not position.get('tp1_hit') and len(targets) >= 1:
            if current_price <= targets[0]['price']:
                actions.append({
                    'action': 'TAKE_PROFIT_1',
                    'size_pct': targets[0]['size_pct'],
                    'price': current_price,
                    'pnl_pct': pnl_pct
                })
    
    return actions

def execute_action(position, action, mode='simulation'):
    """Execute a trading action"""
    asset = position['asset']
    action_type = action['action']
    
    print(f"    🎯 {action_type}: {asset} @ ${action['price']:.6f} ({action['pnl_pct']:+.2%})")
    
    # In simulation, just log
    if mode == 'simulation':
        return {
            'executed': True,
            'mode': 'simulation',
            'action': action_type,
            'price': action['price']
        }
    
    # Live execution would go here
    return {'executed': False, 'reason': 'Live mode not implemented in monitor'}

def update_position(position, action):
    """Update position state after action"""
    action_type = action['action']
    
    if action_type == 'TAKE_PROFIT_1':
        position['tp1_hit'] = True
        position['trailing_active'] = True
        # Set initial trailing stop at entry price (breakeven)
        position['trailing_stop'] = position['entry_price']
        
    elif action_type == 'TAKE_PROFIT_2':
        position['tp2_hit'] = True
        # Tighten trailing stop
        if position['direction'] == 'LONG':
            position['trailing_stop'] = position['targets'][0]['price'] * 0.97  # 3% below TP1
        
    elif action_type == 'CLOSE_ALL':
        position['status'] = 'closed'
        position['closed_at'] = datetime.now().isoformat()
        position['close_price'] = action['price']
        position['final_pnl_pct'] = action['pnl_pct']
        position['close_reason'] = action['reason']

def monitor_cycle(mode='simulation'):
    """Run one monitoring cycle"""
    positions = load_positions()
    open_positions = [p for p in positions if p.get('status') == 'open']
    
    if not open_positions:
        print("  ℹ️ No open positions to monitor")
        return
    
    print(f"\n🔍 Monitoring {len(open_positions)} positions...")
    
    for position in open_positions:
        asset = position['asset']
        current_price = get_current_price(asset)
        
        if current_price is None:
            continue
        
        entry = position['entry_price']
        pnl_pct = (current_price - entry) / entry if position['direction'] == 'LONG' else (entry - current_price) / entry
        
        print(f"  {asset}: ${current_price:.6f} ({pnl_pct:+.2%})")
        
        # Check for actions
        actions = check_position(position, current_price)
        
        for action in actions:
            result = execute_action(position, action, mode)
            if result['executed']:
                update_position(position, action)
    
    # Save updated positions
    save_positions(positions)
    
    # Report summary
    still_open = len([p for p in positions if p.get('status') == 'open'])
    closed = len([p for p in positions if p.get('status') == 'closed'])
    print(f"  📊 Open: {still_open} | Closed: {closed}")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['simulation', 'live'], default='simulation')
    parser.add_argument('--interval', type=int, default=300, help='Check interval in seconds (default: 300 = 5min)')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    args = parser.parse_args()
    
    print(f"🎯 Position Monitor Started")
    print(f"   Mode: {args.mode.upper()}")
    print(f"   Interval: {args.interval}s")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if args.once:
        monitor_cycle(args.mode)
        return
    
    # Continuous monitoring
    try:
        while True:
            monitor_cycle(args.mode)
            print(f"\n⏱️  Next check in {args.interval}s...")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n\n🛑 Monitor stopped by user")

if __name__ == '__main__':
    main()
