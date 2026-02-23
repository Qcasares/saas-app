#!/usr/bin/env python3
"""
KingKong Autonomous Crypto Trader
Master orchestrator for all trading strategies
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path

# Add workspace to path
sys.path.insert(0, os.path.expanduser('~/.openclaw/workspace'))

from crypto_trading_engine import AutonomousTrader, PortfolioManager, RiskManager
from crypto_points_farmer import PointsFarmer

class KingKongTrader:
    """Main autonomous trading agent"""
    
    def __init__(self, capital: float = 1000.0):
        self.capital = capital
        self.trader = AutonomousTrader(capital)
        self.farmer = PointsFarmer()
        self.log_file = os.path.expanduser("~/.openclaw/workspace/crypto-trading-log.jsonl")
        
    def log(self, level: str, message: str):
        """Log activity"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "portfolio_value": self.trader.portfolio.get_portfolio_value()
        }
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')
        print(f"[{level}] {message}")
    
    def run_points_farming_cycle(self):
        """Execute points farming strategy"""
        self.log("INFO", "Starting points farming cycle")
        
        # Check opportunities
        opportunities = self.farmer.scan_opportunities()
        
        # Generate daily actions
        actions = self.farmer.generate_daily_actions()
        
        # Log status
        self.log("INFO", f"Found {len(opportunities)} farming opportunities")
        for action in actions:
            self.log("ACTION", action)
        
        # Calculate yield
        yield_est = self.farmer.estimate_monthly_yield(self.capital)
        self.log("INFO", f"Estimated monthly yield: ${yield_est['total_monthly_usd']:.2f}")
        
        return yield_est
    
    def run_alpha_scan(self):
        """Scan X/Twitter for trading alpha"""
        self.log("INFO", "Scanning for crypto alpha")
        
        # Use existing X/Twitter tools
        try:
            result = subprocess.run(
                ['python3', os.path.expanduser('~/.openclaw/workspace/skills/x-twitter/bin/xcli'), 
                 'search', 'crypto alpha 100x', '10'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                if 'data' in data:
                    tweets = data['data']
                    self.log("INFO", f"Found {len(tweets)} alpha tweets")
                    
                    # Log high-engagement tweets
                    for tweet in tweets[:3]:
                        metrics = tweet.get('public_metrics', {})
                        if metrics.get('like_count', 0) > 10:
                            self.log("ALPHA", f"High engagement tweet: {tweet['text'][:80]}...")
        except Exception as e:
            self.log("ERROR", f"Alpha scan failed: {e}")
    
    def check_risk_limits(self):
        """Check if we're within risk parameters"""
        ok, msg = self.trader.portfolio.check_risk_limits()
        
        if not ok:
            self.log("CRITICAL", f"RISK LIMIT BREACHED: {msg}")
            # Send alert to Q
            self.send_alert(f"🚨 TRADING HALTED: {msg}")
            return False
        elif msg != "OK":
            self.log("WARNING", f"Risk caution: {msg}")
        
        return True
    
    def send_alert(self, message: str):
        """Send alert to user (placeholder - implement with Telegram/email)"""
        # TODO: Implement alert system
        print(f"🔔 ALERT: {message}")
    
    def generate_report(self) -> dict:
        """Generate trading report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "portfolio_value": self.trader.portfolio.get_portfolio_value(),
            "unrealized_pnl": self.trader.portfolio.calculate_pnl(),
            "positions": len(self.trader.portfolio.positions),
            "risk_status": self.trader.portfolio.check_risk_limits()[1]
        }
        return report
    
    def run_trading_cycle(self):
        """Execute one full trading cycle"""
        print(f"\n🚀 KingKong Crypto Trader - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print("=" * 60)
        
        # 1. Check risk limits
        if not self.check_risk_limits():
            return
        
        # 2. Points farming (primary strategy - lowest risk)
        yield_est = self.run_points_farming_cycle()
        
        # 3. Alpha scanning (research phase)
        self.run_alpha_scan()
        
        # 4. Generate report
        report = self.generate_report()
        
        # 5. Log summary
        self.log("SUMMARY", 
            f"Portfolio: ${report['portfolio_value']:.2f} | "
            f"PnL: ${report['unrealized_pnl']:.2f} | "
            f"Positions: {report['positions']} | "
            f"Risk: {report['risk_status']}"
        )
        
        print("\n" + "=" * 60)
        print("✅ Trading cycle complete")
        
        return report

def main():
    """Run autonomous trading cycle"""
    # Initialize with capital from environment or default
    capital = float(os.environ.get('TRADING_CAPITAL', '1000.0'))
    
    trader = KingKongTrader(capital=capital)
    
    # Run one cycle
    report = trader.run_trading_cycle()
    
    # Save report
    report_file = os.path.expanduser("~/.openclaw/workspace/crypto-last-report.json")
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

if __name__ == "__main__":
    main()
