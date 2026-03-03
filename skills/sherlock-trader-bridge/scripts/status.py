#!/usr/bin/env python3
"""
Sherlock-Trader Bridge Status Monitor
Shows current coordination state across all components
"""
import json
import os
from datetime import datetime
from pathlib import Path

def load_json_safe(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return default

def format_currency(val):
    if val is None:
        return "$0.00"
    return f"${val:,.2f}"

def format_pct(val):
    if val is None:
        return "0.00%"
    return f"{val*100:+.2f}%"

def main():
    print("=" * 70)
    print("🎯 SHERLOCK-TRADER COORDINATION STATUS")
    print("=" * 70)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print()
    
    # 1. Sherlock Status
    print("🔍 SHERLOCK (Intelligence)")
    print("-" * 40)
    intel_files = sorted(Path('intel').glob('SHERLOCK-*.md'))
    if intel_files:
        latest = intel_files[-1]
        mtime = datetime.fromtimestamp(latest.stat().st_mtime)
        age_hours = (datetime.now() - mtime).total_seconds() / 3600
        status = "🟢 Fresh" if age_hours < 4 else "🟡 Stale" if age_hours < 8 else "🔴 Old"
        print(f"  Latest intel: {latest.name}")
        print(f"  Generated: {mtime.strftime('%H:%M')} ({age_hours:.1f}h ago) {status}")
    else:
        print("  ⚠️  No intel files found")
    
    # 2. Bridge / Signals
    print()
    print("🌉 BRIDGE (Signal Processing)")
    print("-" * 40)
    
    pending = load_json_safe('signals/pending-signals.json', {})
    validated = load_json_safe('signals/validated-signals.json', {})
    
    pending_count = pending.get('signal_count', 0)
    validated_signals = validated.get('validated_signals', [])
    ready_count = len([s for s in validated_signals if s.get('status') == 'validated'])
    rejected_count = len(validated.get('rejected_signals', []))
    
    print(f"  Pending signals: {pending_count}")
    print(f"  Validated (ready): {ready_count}")
    print(f"  Rejected: {rejected_count}")
    
    if ready_count > 0:
        print(f"\n  📊 Ready to execute:")
        for sig in validated_signals[:3]:
            if sig.get('status') == 'validated':
                print(f"    • {sig['asset']} {sig['direction']} @ ${sig['entry']['price']:.4f} ({sig['confidence']:.0%} confidence)")
        if ready_count > 3:
            print(f"    ... and {ready_count - 3} more")
    
    # 3. Trader / Positions
    print()
    print("💼 TRADER (Execution & Positions)")
    print("-" * 40)
    
    positions = load_json_safe('trading/active-positions.json', [])
    executions = load_json_safe('trading/executions.json', [])
    
    open_positions = [p for p in positions if p.get('status') == 'open']
    closed_positions = [p for p in positions if p.get('status') == 'closed']
    
    print(f"  Open positions: {len(open_positions)}")
    print(f"  Closed today: {len(closed_positions)}")
    
    if open_positions:
        print(f"\n  📈 Active positions:")
        # Get current prices and calculate P&L
        for pos in open_positions:
            entry = pos.get('entry_price', 0)
            # Try to get current price
            current = entry  # Placeholder
            pnl = 0
            print(f"    • {pos['asset']} @ ${entry:.4f} ({pnl:+.2%})")
            print(f"      Targets: ${pos['targets'][0]['price']:.4f} / ${pos['targets'][1]['price']:.4f}")
            print(f"      Stop: ${pos['stop_loss']:.4f}")
    
    if closed_positions:
        total_pnl = sum(p.get('final_pnl_pct', 0) for p in closed_positions)
        avg_pnl = total_pnl / len(closed_positions) if closed_positions else 0
        print(f"\n  💰 Today's closed P&L: {avg_pnl:+.2%} avg")
    
    # 4. System Health
    print()
    print("🏥 SYSTEM HEALTH")
    print("-" * 40)
    
    # Check config files exist
    configs = {
        'Trader config': 'skills/trader/config/trader-config.json',
        'Bridge config': 'skills/sherlock-trader-bridge/config/bridge-config.json'
    }
    
    for name, path in configs.items():
        status = "✅" if Path(path).exists() else "❌"
        print(f"  {status} {name}")
    
    # Check API connectivity (simulation mode indicator)
    trader_config = load_json_safe('skills/trader/config/trader-config.json', {})
    mode = trader_config.get('mode', 'unknown')
    mode_emoji = "🔒" if mode == 'simulation' else "🔴"
    print(f"  {mode_emoji} Trading mode: {mode.upper()}")
    
    # 5. Action Summary
    print()
    print("⚡ RECOMMENDED ACTIONS")
    print("-" * 40)
    
    actions = []
    
    if ready_count > 0 and len(open_positions) < 3:
        actions.append(f"Execute {ready_count} validated signals")
    
    if len(open_positions) > 0:
        actions.append(f"Monitor {len(open_positions)} open positions")
    
    if age_hours > 4:
        actions.append("Run fresh Sherlock sweep")
    
    if not actions:
        actions.append("System idle - awaiting signals")
    
    for i, action in enumerate(actions, 1):
        print(f"  {i}. {action}")
    
    print()
    print("=" * 70)
    print("Commands:")
    print("  Run pipeline:  python3 skills/sherlock-trader-bridge/scripts/full_pipeline.py")
    print("  Check monitor: python3 skills/sherlock-trader-bridge/scripts/monitor_positions.py --once")
    print("  View details:  cat trading/active-positions.json | jq '.[]'")
    print("=" * 70)

if __name__ == '__main__':
    main()
