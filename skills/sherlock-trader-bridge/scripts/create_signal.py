#!/usr/bin/env python3
"""
Manual signal creation
For when KingKong wants to enter a trade directly
"""
import json
import argparse
from datetime import datetime
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='Create manual trading signal')
    parser.add_argument('--asset', required=True, help='Trading pair (e.g., BTC-USD)')
    parser.add_argument('--direction', choices=['LONG', 'SHORT'], required=True)
    parser.add_argument('--entry', type=float, required=True, help='Entry price')
    parser.add_argument('--stop', type=float, required=True, help='Stop loss price')
    parser.add_argument('--target', type=float, required=True, help='First target price')
    parser.add_argument('--target2', type=float, help='Second target price (optional)')
    parser.add_argument('--risk', type=float, default=0.02, help='Max risk % (default: 0.02)')
    parser.add_argument('--confidence', type=float, default=0.80, help='Confidence 0-1 (default: 0.80)')
    parser.add_argument('--rationale', default='Manual entry', help='Trade rationale')
    parser.add_argument('--output', default='signals/manual-signal.json')
    
    args = parser.parse_args()
    
    signal = {
        "signal_id": f"sig-manual-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "source": "manual",
        "timestamp": datetime.now().isoformat(),
        "asset": args.asset,
        "direction": args.direction,
        "confidence": args.confidence,
        "setup_type": "manual_entry",
        "entry": {
            "price": args.entry,
            "type": "limit",
            "urgency": "standard"
        },
        "targets": [
            {"price": args.target, "size_pct": 0.50, "label": "TP1"},
            {"price": args.target2 or args.target * 1.08, "size_pct": 0.50, "label": "TP2"}
        ],
        "stop_loss": args.stop,
        "position_size": {
            "max_risk_pct": args.risk,
            "max_position_pct": 0.10
        },
        "rationale": args.rationale,
        "timeframe": "swing",
        "status": "validated",
        "requires_approval": True
    }
    
    # Save signal
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(signal, f, indent=2)
    
    print("✅ Manual signal created")
    print(f"   Asset: {args.asset} {args.direction}")
    print(f"   Entry: ${args.entry}")
    print(f"   Stop: ${args.stop} ({(args.stop/args.entry-1)*100:+.1f}%)")
    print(f"   Target 1: ${args.target}")
    print(f"📁 Saved to {args.output}")
    print()
    print("To execute:")
    print(f"  python3 skills/sherlock-trader-bridge/scripts/execute_signals.py \\")
    print(f"    --signals {args.output} --mode simulation")

if __name__ == '__main__':
    main()
