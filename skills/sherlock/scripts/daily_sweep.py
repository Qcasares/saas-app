#!/usr/bin/env python3
"""
Daily sweep orchestrator — runs all Sherlock intelligence gathering
Usage: python3 daily_sweep.py [--output-dir intel/]
"""
import subprocess
import json
import os
import sys
from datetime import datetime

def run_sweep(script_name, output_dir="/tmp"):
    """Run a sweep script and save output"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    script_path = f"/Users/quentincasares/.openclaw/workspace/skills/sherlock/scripts/{script_name}"
    # Map script names to what synthesize.py expects
    name_map = {
        "hn_sweep.py": "hn",
        "github_trending.py": "github",
        "coingecko_sweep.py": "coingecko",
        "messari_sweep.py": "messari",
        "crypto_news_enhanced.py": "news_plus",
        "crypto_sweep.py": "crypto",
        "news_sweep.py": "news"
    }
    base_name = name_map.get(script_name, script_name.replace('.py', ''))
    output_path = f"{output_dir}/sherlock_{base_name}_{today}.json"
    
    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✅ {script_name}: {len(data)} keys")
            return True
        else:
            print(f"❌ {script_name}: {result.stderr[:100]}")
            return False
            
    except Exception as e:
        print(f"❌ {script_name}: {str(e)[:100]}")
        return False

def main():
    sweeps = [
        "hn_sweep.py",
        "github_trending.py",
        "coingecko_sweep.py",
        "messari_sweep.py",
        "crypto_news_enhanced.py",
        "crypto_sweep.py",
        "news_sweep.py"
    ]
    
    print(f"🔍 Sherlock Daily Sweep — {datetime.utcnow().isoformat()}\n")
    print("Running intelligence gathering...\n")
    
    results = {}
    for sweep in sweeps:
        success = run_sweep(sweep)
        results[sweep] = success
    
    print("\n📝 Synthesizing report...\n")
    
    # Run synthesis
    synth_path = "/Users/quentincasares/.openclaw/workspace/skills/sherlock/scripts/synthesize.py"
    try:
        result = subprocess.run(
            [sys.executable, synth_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"Synthesis error: {result.stderr}")
    except Exception as e:
        print(f"Synthesis failed: {e}")
    
    # Summary
    success_count = sum(results.values())
    print(f"\n{'='*50}")
    print(f"Sweep complete: {success_count}/{len(sweeps)} modules successful")
    print(f"Report: intel/SHERLOCK-{datetime.utcnow().strftime('%Y-%m-%d')}.md")

if __name__ == "__main__":
    main()
