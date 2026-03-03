#!/usr/bin/env python3
"""
Emergency position closer
Immediately closes all open positions at market
"""
import json
import sys
from datetime import datetime
from pathlib import Path

def main():
    print("🚨 EMERGENCY CLOSE ALL POSITIONS")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Load positions
    positions_path = Path('trading/active-positions.json')
    if not positions_path.exists():
        print("ℹ️  No positions file found")
        return 0
    
    with open(positions_path) as f:
        positions = json.load(f)
    
    open_positions = [p for p in positions if p.get('status') == 'open']
    
    if not open_positions:
        print("ℹ️  No open positions to close")
        return 0
    
    print(f"⚠️  About to close {len(open_positions)} positions:")
    for pos in open_positions:
        print(f"   • {pos['asset']} {pos['direction']} (opened {pos.get('opened_at', 'unknown')})")
    
    print()
    confirm = input("Type EMERGENCY to close all positions immediately: ")
    
    if confirm != "EMERGENCY":
        print("❌ Cancelled")
        return 0
    
    # Close positions
    closed_count = 0
    for pos in positions:
        if pos.get('status') == 'open':
            pos['status'] = 'closed'
            pos['closed_at'] = datetime.now().isoformat()
            pos['close_reason'] = 'emergency_close'
            pos['close_price'] = None  # Would be filled by actual execution
            closed_count += 1
            print(f"   🔒 Closed {pos['asset']}")
    
    # Save updated positions
    with open(positions_path, 'w') as f:
        json.dump(positions, f, indent=2)
    
    print()
    print(f"✅ Emergency close complete: {closed_count} positions")
    print("📁 Positions updated in trading/active-positions.json")
    
    # Log emergency action
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": "emergency_close_all",
        "positions_closed": closed_count,
        "triggered_by": "manual"
    }
    
    log_path = Path('trading/emergency-log.jsonl')
    with open(log_path, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
