#!/usr/bin/env python3
"""
Execute validated trading signals via Coinbase Trader
Places orders and manages entries
"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add trader skill and venv to path
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/skills/trader/scripts')
import sys as _sys
site_pkg = f"/Users/quentincasares/.openclaw/workspace/.venv/lib/python{_sys.version_info.major}.{_sys.version_info.minor}/site-packages"
_sys.path.insert(0, site_pkg)

def execute_signal(signal, trader, mode='simulation'):
    """Execute a single trading signal"""
    asset = signal['asset']
    direction = signal['direction']
    entry = signal.get('entry', {})
    entry_price = entry.get('price')
    entry_type = entry.get('type', 'market')
    
    results = {
        'signal_id': signal['signal_id'],
        'asset': asset,
        'direction': direction,
        'timestamp': datetime.now().isoformat(),
        'mode': mode,
        'orders': []
    }
    
    if mode == 'simulation':
        # Simulate execution
        results['orders'].append({
            'type': entry_type,
            'side': 'BUY' if direction == 'LONG' else 'SELL',
            'status': 'simulated',
            'price': entry_price,
            'note': 'Simulation - no real order placed'
        })
        
        # Simulate stop loss order
        if signal.get('stop_loss'):
            results['orders'].append({
                'type': 'stop_loss',
                'side': 'SELL' if direction == 'LONG' else 'BUY',
                'status': 'simulated',
                'price': signal['stop_loss'],
                'note': 'Stop loss order (simulated)'
            })
        
        results['status'] = 'simulated'
        
    else:
        # Live execution via Trader
        try:
            from coinbase_trader import CoinbaseTrader
            
            # Force live mode
            os.environ['TRADER_SIMULATION'] = 'false'
            # Initialize trader
            cb_trader = CoinbaseTrader(simulation=False)
            
            # Get portfolio value for sizing
            portfolio = cb_trader.get_portfolio_value()
            portfolio_value = portfolio['total_usd']
            
            # Calculate position size
            max_position_pct = signal['position_size']['max_position_pct']
            position_value = portfolio_value * max_position_pct
            
            # Ensure minimum viable position ($10)
            if position_value < 10:
                position_value = 10
            
            # Place entry order
            if entry_type == 'market':
                order = cb_trader.place_market_order(
                    product_id=asset,
                    side='BUY' if direction == 'LONG' else 'SELL',
                    amount=position_value,
                    amount_type='quote'
                )
            else:
                # Limit order
                base_size = position_value / entry_price
                order = cb_trader.place_limit_order(
                    product_id=asset,
                    side='BUY' if direction == 'LONG' else 'SELL',
                    base_size=base_size,
                    limit_price=entry_price
                )
            
            results['orders'].append(order)
            results['status'] = 'executed'
            results['position_value'] = position_value
            
            # Note: Stop loss would need to be a separate stop order
            # Coinbase Advanced Trade supports stop orders
            if signal.get('stop_loss'):
                results['orders'].append({
                    'type': 'stop_loss_pending',
                    'price': signal['stop_loss'],
                    'note': 'Stop loss to be placed separately'
                })
                
        except Exception as e:
            results['status'] = 'failed'
            results['error'] = str(e)
    
    return results

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--signals', default='signals/validated-signals.json')
    parser.add_argument('--mode', choices=['simulation', 'live'], default='simulation')
    parser.add_argument('--output', default='trading/executions.json')
    args = parser.parse_args()
    
    # Load validated signals
    with open(args.signals) as f:
        data = json.load(f)
    
    signals = [s for s in data.get('validated_signals', []) if s.get('status') == 'validated']
    
    if not signals:
        print("⚠️ No validated signals to execute")
        return
    
    print(f"🚀 Executing {len(signals)} signals in {args.mode.upper()} mode\n")
    
    executions = []
    
    for signal in signals:
        print(f"  {signal['asset']} {signal['direction']}...")
        result = execute_signal(signal, None, args.mode)
        executions.append(result)
        
        if result['status'] == 'executed':
            print(f"    ✅ Executed (${result.get('position_value', 0):.2f})")
        elif result['status'] == 'simulated':
            print(f"    🔒 Simulated")
        else:
            print(f"    ❌ Failed: {result.get('error', 'Unknown')}")
    
    # Save execution log
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Append to existing log or create new
    existing = []
    if output_path.exists():
        with open(output_path) as f:
            try:
                existing = json.load(f)
            except:
                existing = []
    
    existing.extend(executions)
    
    with open(output_path, 'w') as f:
        json.dump(existing, f, indent=2)
    
    print(f"\n📁 Executions logged to {args.output}")
    
    # Also save active positions for monitoring
    active_positions = []
    for exec_result in executions:
        if exec_result['status'] in ['executed', 'simulated']:
            # Find original signal for target/stop info
            signal = next((s for s in signals if s['signal_id'] == exec_result['signal_id']), None)
            if signal:
                active_positions.append({
                    'signal_id': signal['signal_id'],
                    'asset': signal['asset'],
                    'direction': signal['direction'],
                    'entry_price': signal['entry']['price'],
                    'targets': signal['targets'],
                    'stop_loss': signal['stop_loss'],
                    'position_value': exec_result.get('position_value', 0),
                    'status': 'open',
                    'opened_at': exec_result['timestamp'],
                    'tp1_hit': False,
                    'tp2_hit': False,
                    'trailing_active': False,
                    'trailing_stop': None
                })
    
    positions_path = Path('trading/active-positions.json')
    positions_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(positions_path, 'w') as f:
        json.dump(active_positions, f, indent=2)
    
    print(f"📊 {len(active_positions)} active positions saved for monitoring")

if __name__ == '__main__':
    main()
