#!/usr/bin/env python3
"""
Position Monitor - Public Price Data (No API keys needed)
Fetches prices from Coinbase public API
"""

import json
import sys
import os
import requests
from datetime import datetime
from pathlib import Path

WORKSPACE = Path.home() / ".openclaw/workspace"
POSITIONS_FILE = WORKSPACE / "trading/active-positions.json"
LOG_FILE = WORKSPACE / "trading/logs/position-monitor.log"

def log(msg):
    """Log to file and stdout"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    
    # Append to log
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def load_positions():
    """Load active positions from file"""
    if not POSITIONS_FILE.exists():
        return []
    with open(POSITIONS_FILE) as f:
        return json.load(f)

def get_price_public(product_id):
    """Get current price from Coinbase public API"""
    try:
        url = f"https://api.coinbase.com/v2/exchange-rates?currency={product_id.split('-')[0]}"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        
        # Get USD rate
        usd_rate = float(data['data']['rates']['USD'])
        return usd_rate
    except Exception as e:
        # Fallback to CoinGecko
        try:
            coin = product_id.split('-')[0].lower()
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies=usd"
            resp = requests.get(url, timeout=10)
            data = resp.json()
            return data[coin]['usd']
        except:
            return None

def check_position(position, current_price):
    """Check position status and return analysis"""
    entry = position['entry_price']
    stop = position['stop_loss']
    targets = position.get('targets', [])
    direction = position['direction']
    size = position['position_value']
    
    if direction == 'LONG':
        pnl_usd = size * ((current_price - entry) / entry)
        pnl_pct = (current_price - entry) / entry * 100
        
        # Distance metrics
        distance_to_stop_pct = (current_price - stop) / (entry - stop) * 100 if entry != stop else 100
        distance_to_tp1 = ((targets[0]['price'] - current_price) / current_price * 100) if targets else None
        
        alerts = []
        if current_price <= stop * 1.02:  # Within 2% of stop
            alerts.append(f"🛑 CRITICAL: Near stop loss (${stop:.4f})")
        elif current_price <= entry - (entry - stop) * 0.5:
            alerts.append(f"⚠️ STOP APPROACH: 50% to stop")
        
        for t in targets:
            if current_price >= t['price'] * 0.97:  # Within 3% of target
                alerts.append(f"🎯 TARGET {t['label']}: ${t['price']:.4f}")
    else:  # SHORT
        pnl_usd = size * ((entry - current_price) / entry)
        pnl_pct = (entry - current_price) / entry * 100
        alerts = []
    
    return {
        'pnl_usd': pnl_usd,
        'pnl_pct': pnl_pct,
        'current_price': current_price,
        'distance_to_stop': distance_to_stop_pct if direction == 'LONG' else None,
        'distance_to_tp1': distance_to_tp1,
        'alerts': alerts
    }

def format_position(position, analysis):
    """Format position for display"""
    asset = position['asset']
    entry = position['entry_price']
    current = analysis['current_price']
    pnl_pct = analysis['pnl_pct']
    pnl_usd = analysis['pnl_usd']
    
    emoji = "🟢" if pnl_pct >= 0 else "🔴"
    
    lines = [
        f"\n{emoji} {asset}",
        f"   Entry: ${entry:.4f} → Current: ${current:.4f}",
        f"   P&L: {pnl_pct:+.2f}% (${pnl_usd:+.2f})",
    ]
    
    if analysis['alerts']:
        for alert in analysis['alerts']:
            lines.append(f"   {alert}")
    
    return '\n'.join(lines)

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--alert', action='store_true', help='Alert on conditions')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    args = parser.parse_args()
    
    log("📊 Position Monitor Starting...")
    
    positions = load_positions()
    if not positions:
        log("📭 No open positions")
        return
    
    log(f"Monitoring {len(positions)} position(s)")
    
    results = []
    total_pnl = 0
    
    for pos in positions:
        asset = pos['asset']
        
        # Get price
        price = get_price_public(asset)
        if price is None:
            log(f"❌ Could not fetch price for {asset}")
            continue
        
        # Analyze
        analysis = check_position(pos, price)
        total_pnl += analysis['pnl_usd']
        
        results.append({
            'asset': asset,
            'position': pos,
            'analysis': analysis
        })
        
        if not args.json:
            log(format_position(pos, analysis))
    
    # Summary
    log(f"\n{'='*50}")
    log(f"Total P&L: ${total_pnl:+.2f}")
    log(f"Positions monitored: {len(results)}")
    
    if args.json:
        print(json.dumps(results, indent=2, default=str))
    
    return results

if __name__ == '__main__':
    main()
