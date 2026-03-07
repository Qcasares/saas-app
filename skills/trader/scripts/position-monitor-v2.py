#!/usr/bin/env python3
"""
Position Monitor - Check open positions and alert on stop/target approach
Usage: python3 position-monitor.py [--alert]
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add workspace to path
sys.path.insert(0, str(Path.home() / ".openclaw/workspace"))

from skills.trader.scripts.coinbase_trader import CoinbaseTrader

WORKSPACE = Path.home() / ".openclaw/workspace"
POSITIONS_FILE = WORKSPACE / "trading/active-positions.json"
ALERT_THRESHOLD_PCT = 0.50  # Alert when 50% to stop or target

def load_positions():
    """Load active positions from file"""
    if not POSITIONS_FILE.exists():
        return []
    with open(POSITIONS_FILE) as f:
        return json.load(f)

def get_current_price(trader, product_id):
    """Get current market price"""
    try:
        data = trader.get_price(product_id)
        return data.get('price', 0)
    except Exception as e:
        print(f"❌ Error fetching price for {product_id}: {e}")
        return None

def check_position(position, current_price):
    """Check position status and return alerts"""
    alerts = []
    
    entry = position['entry_price']
    stop = position['stop_loss']
    targets = position.get('targets', [])
    direction = position['direction']
    
    if direction == 'LONG':
        # Calculate distances
        pnl_pct = (current_price - entry) / entry * 100
        distance_to_stop = (current_price - stop) / (entry - stop) if entry != stop else 1
        
        # Check stop approach (when 50% to stop)
        if current_price <= entry + (stop - entry) * 0.5:
            alerts.append(f"🛑 STOP APPROACH: Price ${current_price:.4f} is 50%+ toward stop at ${stop:.4f}")
        
        # Check target approach
        for target in targets:
            tp_price = target['price']
            if current_price >= tp_price * 0.95:  # Within 5% of target
                alerts.append(f"🎯 TARGET {target['label']} APPROACH: ${current_price:.4f} near ${tp_price:.4f}")
        
    else:  # SHORT
        pnl_pct = (entry - current_price) / entry * 100
        
        if current_price >= entry + (stop - entry) * 0.5:
            alerts.append(f"🛑 STOP APPROACH: Price approaching stop at ${stop:.4f}")
        
        for target in targets:
            tp_price = target['price']
            if current_price <= tp_price * 1.05:
                alerts.append(f"🎯 TARGET {target['label']} APPROACH: ${current_price:.4f} near ${tp_price:.4f}")
    
    return {
        'pnl_pct': pnl_pct,
        'current_price': current_price,
        'alerts': alerts,
        'status': 'healthy' if not alerts else 'alert'
    }

def format_position_summary(position, check_result):
    """Format position for display"""
    lines = []
    asset = position['asset']
    entry = position['entry_price']
    current = check_result['current_price']
    pnl = check_result['pnl_pct']
    
    pnl_emoji = "🟢" if pnl >= 0 else "🔴"
    lines.append(f"\n{pnl_emoji} {asset}")
    lines.append(f"   Entry: ${entry:.4f} | Current: ${current:.4f}")
    lines.append(f"   P&L: {pnl:+.2f}%")
    
    if check_result['alerts']:
        for alert in check_result['alerts']:
            lines.append(f"   {alert}")
    
    return '\n'.join(lines)

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--alert', action='store_true', help='Send Telegram alerts')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    args = parser.parse_args()
    
    # Initialize trader (simulation mode for safety)
    trader = CoinbaseTrader(simulation=True)
    
    # Load positions
    positions = load_positions()
    
    if not positions:
        print("📭 No open positions")
        return
    
    results = []
    any_alerts = False
    
    print(f"📊 Position Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    for position in positions:
        asset = position['asset']
        
        # Get current price
        current_price = get_current_price(trader, asset)
        if current_price is None:
            continue
        
        # Check position
        check = check_position(position, current_price)
        results.append({
            'asset': asset,
            'position': position,
            'check': check
        })
        
        if check['alerts']:
            any_alerts = True
        
        if not args.json:
            print(format_position_summary(position, check))
    
    # Summary
    print(f"\n{'=' * 50}")
    print(f"Total positions: {len(positions)}")
    print(f"Positions with alerts: {sum(1 for r in results if r['check']['alerts'])}")
    
    if args.json:
        print(json.dumps(results, indent=2, default=str))
    
    # Send alerts if requested
    if args.alert and any_alerts:
        # This would integrate with Telegram
        alert_msg = f"⚠️ Position Alerts ({len(positions)} monitored)\n"
        for r in results:
            if r['check']['alerts']:
                alert_msg += f"\n{r['asset']}: " + "; ".join(r['check']['alerts'])
        print(f"\n📤 Would send alert:\n{alert_msg}")
    
    return results

if __name__ == '__main__':
    main()
