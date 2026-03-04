#!/usr/bin/env python3
"""
Position Monitor & Alert System
Monitors active positions for target hits, stop losses, and abnormal conditions.
Sends Telegram alerts for important events.
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Config
DEFAULT_POSITIONS = "trading/active-positions.json"
DEFAULT_PRICES = "trading/MARKET-ANALYSIS.json"
ALERT_LOG = "trading/logs/position-alerts.log"
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "8135433560")

class PositionMonitor:
    def __init__(self, positions_file: str = DEFAULT_POSITIONS, prices_file: str = DEFAULT_PRICES):
        self.positions_file = Path(positions_file)
        self.prices_file = Path(prices_file)
        self.positions: List[Dict] = []
        self.prices: Dict = {}
        self.alerts: List[Dict] = []
        
    def load_data(self) -> bool:
        """Load positions and price data."""
        try:
            if self.positions_file.exists():
                with open(self.positions_file) as f:
                    self.positions = json.load(f)
            else:
                print(f"⚠️  Positions file not found: {self.positions_file}")
                return False
                
            if self.prices_file.exists():
                with open(self.prices_file) as f:
                    self.prices = json.load(f)
            else:
                print(f"⚠️  Prices file not found: {self.prices_file}")
                return False
                
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def get_current_price(self, asset: str) -> Optional[float]:
        """Get current price for an asset from market data."""
        price_data = self.prices.get("prices", {})
        
        # Try exact match first
        if asset in price_data:
            return price_data[asset].get("price")
        
        # Try variants (e.g., FAI-USDC -> FAI-USD)
        base = asset.split("-")[0]
        for key, data in price_data.items():
            if key.startswith(base):
                return data.get("price")
        
        return None
    
    def calculate_pnl(self, position: Dict, current_price: float) -> Dict:
        """Calculate P&L for a position."""
        entry = position.get("entry_price", 0)
        direction = position.get("direction", "LONG")
        position_value = position.get("position_value", 0)
        
        if direction == "LONG":
            pnl_pct = (current_price - entry) / entry if entry else 0
        else:
            pnl_pct = (entry - current_price) / entry if entry else 0
            
        pnl_usd = pnl_pct * position_value
        
        return {
            "pnl_pct": pnl_pct,
            "pnl_usd": pnl_usd,
            "current_price": current_price,
            "entry_price": entry
        }
    
    def check_targets(self, position: Dict, pnl_data: Dict) -> List[Dict]:
        """Check if any targets or stop loss have been hit."""
        alerts = []
        asset = position.get("asset", "UNKNOWN")
        direction = position.get("direction", "LONG")
        current_price = pnl_data["current_price"]
        
        # Check stop loss
        stop_loss = position.get("stop_loss")
        if stop_loss:
            if direction == "LONG" and current_price <= stop_loss:
                alerts.append({
                    "level": "CRITICAL",
                    "type": "STOP_LOSS_HIT",
                    "asset": asset,
                    "message": f"🚨 STOP LOSS HIT: {asset} at ${current_price:.4f} (SL: ${stop_loss:.4f})",
                    "pnl_pct": pnl_data["pnl_pct"],
                    "action": "CLOSE_POSITION"
                })
            elif direction == "SHORT" and current_price >= stop_loss:
                alerts.append({
                    "level": "CRITICAL", 
                    "type": "STOP_LOSS_HIT",
                    "asset": asset,
                    "message": f"🚨 STOP LOSS HIT: {asset} at ${current_price:.4f} (SL: ${stop_loss:.4f})",
                    "pnl_pct": pnl_data["pnl_pct"],
                    "action": "CLOSE_POSITION"
                })
        
        # Check take profit targets
        targets = position.get("targets", [])
        for i, target in enumerate(targets):
            tp_price = target.get("price")
            label = target.get("label", f"TP{i+1}")
            hit_flag = f"tp{i+1}_hit"
            
            if tp_price and not position.get(hit_flag, False):
                if direction == "LONG" and current_price >= tp_price:
                    size_pct = target.get("size_pct", 0.5)
                    alerts.append({
                        "level": "PROFIT",
                        "type": "TAKE_PROFIT_HIT",
                        "asset": asset,
                        "message": f"✅ {label} HIT: {asset} at ${current_price:.4f} (Target: ${tp_price:.4f}). Close {size_pct*100:.0f}% of position",
                        "pnl_pct": pnl_data["pnl_pct"],
                        "action": "PARTIAL_CLOSE",
                        "close_pct": size_pct
                    })
                elif direction == "SHORT" and current_price <= tp_price:
                    size_pct = target.get("size_pct", 0.5)
                    alerts.append({
                        "level": "PROFIT",
                        "type": "TAKE_PROFIT_HIT", 
                        "asset": asset,
                        "message": f"✅ {label} HIT: {asset} at ${current_price:.4f} (Target: ${tp_price:.4f}). Close {size_pct*100:.0f}% of position",
                        "pnl_pct": pnl_data["pnl_pct"],
                        "action": "PARTIAL_CLOSE",
                        "close_pct": size_pct
                    })
        
        return alerts
    
    def check_abnormal_conditions(self, position: Dict, pnl_data: Dict) -> List[Dict]:
        """Check for abnormal market conditions."""
        alerts = []
        asset = position.get("asset", "UNKNOWN")
        pnl_pct = pnl_data["pnl_pct"]
        
        # Large unrealized loss warning (>5%)
        if pnl_pct < -0.05:
            alerts.append({
                "level": "WARNING",
                "type": "LARGE_LOSS",
                "asset": asset,
                "message": f"⚠️  Large unrealized loss on {asset}: {pnl_pct*100:.2f}%",
                "pnl_pct": pnl_pct
            })
        
        # Large unrealized gain notification (>10%)
        if pnl_pct > 0.10:
            alerts.append({
                "level": "INFO",
                "type": "LARGE_GAIN",
                "asset": asset,
                "message": f"🎯 Strong profit on {asset}: +{pnl_pct*100:.2f}%. Consider taking profits",
                "pnl_pct": pnl_pct
            })
            
        return alerts
    
    def send_telegram_alert(self, alert: Dict) -> bool:
        """Send alert via Telegram."""
        try:
            # Check if telegram-send is available
            import subprocess
            
            message = alert["message"]
            if alert.get("pnl_pct"):
                emoji = "🟢" if alert["pnl_pct"] > 0 else "🔴"
                message += f"\n{emoji} P&L: {alert['pnl_pct']*100:+.2f}%"
            
            # Use telegram-send or similar tool
            result = subprocess.run(
                ["telegram-send", message],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except FileNotFoundError:
            # telegram-send not installed, just log
            return False
        except Exception as e:
            print(f"❌ Failed to send Telegram alert: {e}")
            return False
    
    def log_alert(self, alert: Dict):
        """Log alert to file."""
        log_path = Path(ALERT_LOG)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            **alert
        }
        
        with open(log_path, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def run(self) -> Dict:
        """Run the position monitor."""
        print("🔍 Position Monitor Starting...")
        print("=" * 50)
        
        if not self.load_data():
            return {"status": "error", "reason": "Failed to load data"}
        
        if not self.positions:
            print("📭 No active positions to monitor")
            return {"status": "no_positions", "alerts": []}
        
        print(f"📊 Monitoring {len(self.positions)} active position(s)")
        print()
        
        all_alerts = []
        
        for position in self.positions:
            asset = position.get("asset", "UNKNOWN")
            current_price = self.get_current_price(asset)
            
            if not current_price:
                print(f"⚠️  No price data for {asset}")
                continue
            
            # Calculate P&L
            pnl_data = self.calculate_pnl(position, current_price)
            
            # Print status
            pnl_emoji = "🟢" if pnl_data["pnl_pct"] > 0 else "🔴" if pnl_data["pnl_pct"] < 0 else "⚪"
            print(f"{pnl_emoji} {asset}: ${current_price:.4f} | P&L: {pnl_data['pnl_pct']*100:+.2f}% (${pnl_data['pnl_usd']:+.2f})")
            
            # Check for alerts
            target_alerts = self.check_targets(position, pnl_data)
            abnormal_alerts = self.check_abnormal_conditions(position, pnl_data)
            
            for alert in target_alerts + abnormal_alerts:
                all_alerts.append(alert)
                self.log_alert(alert)
                
                # Print alert
                print(f"   {alert['message']}")
                
                # Try to send Telegram notification for critical alerts
                if alert['level'] in ['CRITICAL', 'PROFIT']:
                    self.send_telegram_alert(alert)
        
        print()
        print("=" * 50)
        print(f"✅ Monitor complete. {len(all_alerts)} alert(s) generated.")
        
        return {
            "status": "success",
            "positions_monitored": len(self.positions),
            "alerts": all_alerts,
            "timestamp": datetime.now().isoformat()
        }


def main():
    monitor = PositionMonitor()
    result = monitor.run()
    
    # Also output JSON for automation
    print("\n📋 JSON Output:")
    print(json.dumps(result, indent=2))
    
    # Exit with error code if critical alerts
    critical_count = sum(1 for a in result.get("alerts", []) if a.get("level") == "CRITICAL")
    if critical_count > 0:
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
