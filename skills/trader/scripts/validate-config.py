#!/usr/bin/env python3
"""
Full Configuration Validator for Trading System
Validates all components: API, positions, config, subagents
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

WORKSPACE = Path.home() / ".openclaw/workspace"

def log_check(name: str, status: bool, details: str = ""):
    """Log validation check"""
    emoji = "✅" if status else "❌"
    print(f"{emoji} {name}")
    if details:
        print(f"   {details}")
    return status

def validate_env():
    """Validate environment variables"""
    print("\n🔐 Environment Variables")
    print("-" * 50)
    
    key = os.getenv('COINBASE_API_KEY', '').strip()
    secret = os.getenv('COINBASE_API_SECRET', '').strip()
    
    results = []
    results.append(log_check(
        "COINBASE_API_KEY set",
        bool(key),
        f"Length: {len(key)} chars" if key else "Not set"
    ))
    
    results.append(log_check(
        "COINBASE_API_SECRET set",
        bool(secret),
        f"Length: {len(secret)} chars" if secret else "Not set"
    ))
    
    results.append(log_check(
        "Key format valid (UUID)",
        len(key) == 36 and key.count('-') == 4,
        f"Key ID: {key[:8]}...{key[-4:]}" if key else ""
    ))
    
    return all(results)

def validate_config():
    """Validate trader configuration"""
    print("\n⚙️  Trader Configuration")
    print("-" * 50)
    
    config_path = WORKSPACE / "skills/trader/config/trader-config.json"
    
    if not config_path.exists():
        return log_check("Config file exists", False, f"Not found: {config_path}")
    
    try:
        with open(config_path) as f:
            config = json.load(f)
    except json.JSONDecodeError as e:
        return log_check("Valid JSON", False, str(e))
    
    results = []
    results.append(log_check("Config loads successfully", True))
    results.append(log_check("Version field", "version" in config))
    results.append(log_check("Mode field", "mode" in config, f"Mode: {config.get('mode', 'N/A')}"))
    results.append(log_check("Risk limits defined", "risk_limits" in config))
    results.append(log_check("Approved pairs list", "approved_pairs" in config.get("risk_limits", {})))
    results.append(log_check("API config", "api" in config, f"Key: {config.get('api', {}).get('key_id', 'N/A')[:12]}..."))
    
    return all(results)

def validate_positions():
    """Validate position files"""
    print("\n📊 Positions")
    print("-" * 50)
    
    positions_path = WORKSPACE / "trading/active-positions.json"
    
    if not positions_path.exists():
        log_check("Positions file exists", False)
        return []
    
    try:
        with open(positions_path) as f:
            positions = json.load(f)
    except Exception as e:
        log_check("Valid JSON", False, str(e))
        return []
    
    log_check("Positions file loads", True, f"{len(positions)} position(s)")
    
    for pos in positions:
        asset = pos.get('asset', 'UNKNOWN')
        print(f"   • {asset}: ${pos.get('position_value', 0)} @ ${pos.get('entry_price', 0)}")
    
    return positions

def validate_scripts():
    """Validate trading scripts"""
    print("\n📜 Trading Scripts")
    print("-" * 50)
    
    scripts = [
        ("coinbase_trader.py", "Advanced Trade API client"),
        ("coinbase_cdp_trader.py", "CDP API client"),
        ("position-monitor-public.py", "Public price monitor"),
        ("coinbase-scanner.py", "Market scanner"),
    ]
    
    results = []
    for script, desc in scripts:
        path = WORKSPACE / f"skills/trader/scripts/{script}"
        exists = path.exists()
        executable = os.access(path, os.X_OK) if exists else False
        status = exists and executable
        results.append(log_check(
            f"{script}",
            status,
            desc if status else f"Missing or not executable"
        ))
    
    return all(results)

def validate_subagents():
    """Validate subagent infrastructure"""
    print("\n🤖 Subagent Infrastructure")
    print("-" * 50)
    
    paths = [
        WORKSPACE / "skills/trader/subagents/spawn-trader.py",
        WORKSPACE / "skills/trader/subagents/tasks/morning-scan.json",
        WORKSPACE / "skills/trader/subagents/tasks/morning-scanner.json",
        WORKSPACE / "skills/trader/subagents/tasks/morning-analyst.json",
        WORKSPACE / "skills/trader/subagents/tasks/morning-risk-check.json",
    ]
    
    results = []
    for path in paths:
        exists = path.exists()
        results.append(log_check(
            path.name,
            exists,
            "Created" if exists else "Missing"
        ))
    
    return all(results)

def validate_journal():
    """Validate trade journal"""
    print("\n📓 Trade Journal")
    print("-" * 50)
    
    journal_path = WORKSPACE / "trading/TRADE-JOURNAL.md"
    
    if not journal_path.exists():
        return log_check("Journal exists", False)
    
    with open(journal_path) as f:
        content = f.read()
    
    # Check for recent entries
    today = datetime.now().strftime("%Y-%m-%d")
    has_today = today in content
    has_march = "2026-03-" in content
    
    log_check("Journal file exists", True)
    log_check("Recent entries (March 2026)", has_march)
    log_check("Today's entry", has_today, f"Date: {today}")
    
    return has_march

def validate_api_connection():
    """Test API connection with public endpoint"""
    print("\n🔌 API Connection Test")
    print("-" * 50)
    
    try:
        import requests
        
        # Test public API (no auth needed)
        url = "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
        resp = requests.get(url, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            btc_price = 1 / float(data['data']['rates']['USD'])
            log_check("Public API reachable", True, f"BTC price: ${btc_price:,.2f}")
            return True
        else:
            log_check("Public API reachable", False, f"Status: {resp.status_code}")
            return False
            
    except Exception as e:
        log_check("API test", False, str(e))
        return False

def main():
    """Run full validation"""
    print("=" * 60)
    print("🦍 TRADING SYSTEM VALIDATION")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Workspace: {WORKSPACE}")
    
    results = {
        "Environment": validate_env(),
        "Configuration": validate_config(),
        "Scripts": validate_scripts(),
        "Subagents": validate_subagents(),
        "Journal": validate_journal(),
        "API Connection": validate_api_connection(),
    }
    
    positions = validate_positions()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 VALIDATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, status in results.items():
        emoji = "✅" if status else "❌"
        print(f"{emoji} {name}")
    
    print(f"\nScore: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All systems validated and ready!")
    elif passed >= total * 0.8:
        print("\n⚠️  Most systems ready. Review failures above.")
    else:
        print("\n❌ Multiple issues found. Fix before trading.")
    
    # Position summary
    if positions:
        print(f"\n📊 Open Positions: {len(positions)}")
        total_value = sum(p.get('position_value', 0) for p in positions)
        print(f"   Total exposure: ${total_value:.2f}")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
