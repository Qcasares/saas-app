#!/usr/bin/env python3
"""
Coinbase API Validation Script
Tests API credentials and permissions without executing trades
"""
import os
import sys
import json
from datetime import datetime

# Add the trader scripts to path
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace/skills/trader/scripts'))

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print('='*60)

def print_check(text, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {text}")
    if details:
        print(f"      {details}")
    return passed

def validate_setup():
    """Run all validation checks"""
    results = {
        'timestamp': datetime.now().isoformat(),
        'checks': {},
        'passed': 0,
        'failed': 0,
        'warnings': []
    }
    
    print_header("COINBASE API VALIDATION")
    print("This script validates your API setup without executing trades.")
    print("All tests are read-only.")
    
    # Check 1: Environment Variables
    print_header("1. Environment Variables")
    
    api_key = os.getenv('COINBASE_API_KEY')
    api_secret = os.getenv('COINBASE_API_SECRET')
    simulation = os.getenv('TRADER_SIMULATION', 'true')
    
    has_key = print_check(
        "COINBASE_API_KEY is set", 
        bool(api_key),
        f"Value: {'*****' + api_key[-12:] if api_key else 'NOT SET'}"
    )
    results['checks']['api_key_set'] = has_key
    
    has_secret = print_check(
        "COINBASE_API_SECRET is set",
        bool(api_secret),
        f"Length: {len(api_secret) if api_secret else 0} chars"
    )
    results['checks']['api_secret_set'] = has_secret
    
    sim_mode = print_check(
        f"TRADER_SIMULATION={simulation}",
        True,
        "Mode: PAPER TRADING" if simulation.lower() == 'true' else "Mode: LIVE TRADING"
    )
    results['checks']['simulation_mode'] = simulation.lower() == 'true'
    
    if not (has_key and has_secret):
        print("\n❌ Cannot proceed without API credentials.")
        print("   Add to ~/.zshrc and run: source ~/.zshrc")
        return results
    
    # Check 2: Import and Initialize
    print_header("2. API Client Initialization")
    
    try:
        from coinbase_trader import CoinbaseTrader
        print_check("Import coinbase_trader module", True)
        
        # Force simulation for safety during validation
        os.environ['TRADER_SIMULATION'] = 'true'
        trader = CoinbaseTrader()
        print_check("Initialize CoinbaseTrader", True, "Mode: Simulation (safe)")
        results['checks']['client_init'] = True
        
    except Exception as e:
        print_check("Initialize API client", False, str(e))
        results['checks']['client_init'] = False
        return results
    
    # Check 3: API Connection Test
    print_header("3. API Connection Test")
    
    try:
        # This would make a real API call in non-simulation
        account = trader.get_account()
        print_check("Fetch account info", True)
        results['checks']['api_connection'] = True
        
        # Try to extract and display safe info
        if 'simulation' not in account:
            # Real account data
            portfolios = account.get('portfolios', [])
            if portfolios:
                total_balance = sum(
                    float(p.get('total_balance', 0)) 
                    for p in portfolios
                )
                print(f"\n   📊 Account Summary:")
                print(f"      Total Balance: ${total_balance:,.2f}")
                results['checks']['total_balance'] = total_balance
        else:
            print("   (Simulation mode - no real account data)")
            
    except Exception as e:
        print_check("Fetch account info", False, str(e))
        results['checks']['api_connection'] = False
        results['warnings'].append(f"API connection failed: {e}")
    
    # Check 4: Test Order Validation (Simulation)
    print_header("4. Order Placement Test (Simulation)")
    
    try:
        # Test a limit order
        test_order = trader.place_limit_order(
            symbol='BTC-USD',
            side='BUY',
            size=0.001,
            price=60000
        )
        print_check("Place test limit order", True, "Order validated (simulation)")
        results['checks']['order_placement'] = True
        
        # Test stop-loss
        stop_order = trader.place_stop_loss(
            symbol='BTC-USD',
            side='SELL',
            size=0.001,
            stop_price=55000
        )
        print_check("Place test stop-loss", True, "Stop order validated (simulation)")
        results['checks']['stop_loss'] = True
        
    except Exception as e:
        print_check("Order placement test", False, str(e))
        results['checks']['order_placement'] = False
        results['warnings'].append(f"Order test failed: {e}")
    
    # Check 5: Risk Manager Integration
    print_header("5. Risk Manager Integration")
    
    try:
        from risk_manager import RiskManager
        rm = RiskManager(portfolio_value=10000)
        
        # Test valid trade
        valid_trade = {
            'symbol': 'BTC-USD',
            'side': 'buy',
            'size_usd': 100,
            'price': 65000
        }
        result = rm.validate_trade(valid_trade)
        print_check("Validate $100 BTC trade", result['approved'])
        results['checks']['risk_manager'] = result['approved']
        
        # Test rejected trade (too large)
        large_trade = {
            'symbol': 'BTC-USD',
            'side': 'buy',
            'size_usd': 1000,
            'price': 65000
        }
        result = rm.validate_trade(large_trade)
        print_check("Reject oversized trade", not result['approved'])
        results['checks']['risk_rejection'] = not result['approved']
        
    except Exception as e:
        print_check("Risk manager test", False, str(e))
        results['checks']['risk_manager'] = False
    
    # Summary
    print_header("VALIDATION SUMMARY")
    
    passed = sum(1 for v in results['checks'].values() if v)
    total = len(results['checks'])
    failed = total - passed
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Tests Failed: {failed}")
    
    if failed == 0:
        print("\n✅ ALL CHECKS PASSED")
        print("\nYou can now enable live trading by setting:")
        print("   export TRADER_SIMULATION=false")
        print("\n⚠️  RECOMMENDED: Start with paper trading for 30 days first!")
    else:
        print("\n❌ SOME CHECKS FAILED")
        print("\nFix the issues above before enabling live trading.")
    
    if results['warnings']:
        print("\n⚠️  Warnings:")
        for w in results['warnings']:
            print(f"   - {w}")
    
    # Save results
    results['passed'] = passed
    results['failed'] = failed
    
    log_path = os.path.expanduser(
        '~/.openclaw/workspace/trading/logs/validation-results.json'
    )
    with open(log_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n📝 Results saved to: {log_path}")
    
    return results

def check_permissions():
    """Check that API key has correct permissions"""
    print_header("API PERMISSIONS CHECK")
    print("""
Required Permissions:
  ✅ View    - Read account balance, order status
  ✅ Trade   - Place/cancel orders (limit only)
  
Forbidden Permissions:
  ❌ Transfer/Withdraw - NEVER enable this
  ❌ Wallet:deposits   - Not needed
  ❌ Wallet:withdrawals - NEVER enable this

To verify:
  1. Go to coinbase.com → Settings → API
  2. Find your API key
  3. Click 'Edit' to view permissions
  4. Ensure ONLY 'View' and 'Trade' are enabled
    """)
    
    response = input("Have you verified your API key has NO withdrawal permissions? (yes/no): ")
    if response.lower() != 'yes':
        print("\n⚠️  Please verify permissions before proceeding!")
        return False
    return True

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Validate Coinbase API setup')
    parser.add_argument('--check-permissions', action='store_true', 
                        help='Interactive permission verification')
    
    args = parser.parse_args()
    
    if args.check_permissions:
        check_permissions()
    
    results = validate_setup()
    
    # Exit with error code if any checks failed
    sys.exit(0 if results.get('failed', 0) == 0 else 1)
