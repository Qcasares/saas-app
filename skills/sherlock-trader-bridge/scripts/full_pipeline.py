#!/usr/bin/env python3
"""
Full pipeline: Sherlock intel → Trade execution
Orchestrates the complete flow from research to orders
"""
import subprocess
import sys
import os
from datetime import datetime
from pathlib import Path

def run_step(script, args=None, description=""):
    """Run a pipeline step"""
    cmd = [sys.executable, script]
    if args:
        cmd.extend(args)
    
    print(f"\n{'='*60}")
    print(f"▶️  {description}")
    print(f"{'='*60}")
    
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['simulation', 'live'], default='simulation')
    parser.add_argument('--skip-sherlock', action='store_true', help='Skip Sherlock sweep, use existing intel')
    parser.add_argument('--intel-file', help='Specific intel file to use')
    args = parser.parse_args()
    
    print("🚀 Sherlock-Trader Full Pipeline")
    print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Mode: {args.mode.upper()}")
    print(f"   Working Directory: {os.getcwd()}")
    
    # Step 1: Run Sherlock sweep (unless skipped)
    if not args.skip_sherlock:
        if not run_step(
            'skills/sherlock/scripts/daily_sweep.py',
            description="Step 1: Sherlock Intelligence Gathering"
        ):
            print("❌ Sherlock sweep failed")
            return 1
    else:
        print("\n⏭️  Skipping Sherlock sweep (using existing intel)")
    
    # Determine intel file to use
    today = datetime.now().strftime('%Y-%m-%d')
    intel_file = args.intel_file or f'intel/SHERLOCK-{today}.md'
    
    if not Path(intel_file).exists():
        print(f"❌ Intel file not found: {intel_file}")
        return 1
    
    # Step 2: Extract signals from intel
    if not run_step(
        'skills/sherlock-trader-bridge/scripts/extract_signals.py',
        ['--intel', intel_file, '--output', 'signals/pending-signals.json'],
        description="Step 2: Extract Trading Signals"
    ):
        print("❌ Signal extraction failed")
        return 1
    
    # Check if any signals were extracted
    if not Path('signals/pending-signals.json').exists():
        print("⚠️  No signals file generated")
        return 1
    
    import json
    with open('signals/pending-signals.json') as f:
        pending = json.load(f)
    
    if pending.get('signal_count', 0) == 0:
        print("\n⚠️  No signals extracted from intel")
        return 0
    
    # Step 3: Validate signals
    if not run_step(
        'skills/sherlock-trader-bridge/scripts/validate_signals.py',
        [
            '--config', 'skills/trader/config/trader-config.json',
            '--signals', 'signals/pending-signals.json',
            '--output', 'signals/validated-signals.json'
        ],
        description="Step 3: Risk Validation"
    ):
        print("❌ Signal validation failed")
        return 1
    
    # Check validated signals
    with open('signals/validated-signals.json') as f:
        validated = json.load(f)
    
    ready_count = len([s for s in validated.get('validated_signals', []) if s.get('status') == 'validated'])
    
    if ready_count == 0:
        print("\n⚠️  No signals passed validation")
        return 0
    
    # Step 4: Execute signals
    print(f"\n{'='*60}")
    print(f"▶️  Step 4: Execute Trades ({args.mode.upper()} MODE)")
    print(f"{'='*60}")
    print(f"   Ready to execute: {ready_count} signals")
    
    if args.mode == 'live':
        print("\n⚠️  LIVE TRADING MODE")
        confirm = input("   Confirm execution? Type 'LIVE' to proceed: ")
        if confirm != 'LIVE':
            print("   ❌ Cancelled")
            return 0
    
    if not run_step(
        'skills/sherlock-trader-bridge/scripts/execute_signals.py',
        [
            '--signals', 'signals/validated-signals.json',
            '--mode', args.mode,
            '--output', 'trading/executions.json'
        ],
        description="Executing Orders"
    ):
        print("❌ Trade execution failed")
        return 1
    
    # Step 5: Start monitoring (if positions opened)
    print(f"\n{'='*60}")
    print(f"▶️  Step 5: Position Monitoring")
    print(f"{'='*60}")
    
    if Path('trading/active-positions.json').exists():
        with open('trading/active-positions.json') as f:
            positions = json.load(f)
        
        if positions:
            print(f"   {len(positions)} positions to monitor")
            print(f"\n   Run monitor in background:")
            print(f"   python3 skills/sherlock-trader-bridge/scripts/monitor_positions.py --mode {args.mode}")
            
            # Do one immediate check
            run_step(
                'skills/sherlock-trader-bridge/scripts/monitor_positions.py',
                ['--mode', args.mode, '--once'],
                description="Initial Position Check"
            )
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Pipeline Complete")
    print(f"{'='*60}")
    print(f"   Signals extracted: {pending.get('signal_count', 0)}")
    print(f"   Signals validated: {ready_count}")
    print(f"   Mode: {args.mode.upper()}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"\n📁 Output Files:")
    print(f"   - {intel_file}")
    print(f"   - signals/pending-signals.json")
    print(f"   - signals/validated-signals.json")
    print(f"   - trading/executions.json")
    print(f"   - trading/active-positions.json")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
