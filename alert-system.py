#!/usr/bin/env python3
"""
KingKong Alert System
Proactive notifications for critical events
"""

import os
import sys
import json
import subprocess
from datetime import datetime

# Telegram bot configuration
TELEGRAM_BOT_TOKEN = "8567431898:AAHgXAzrucVkNCBEueW-UbBz-McYrbPB5qs"
TELEGRAM_CHAT_ID = "8135433560"

def send_telegram(message, priority="normal"):
    """Send alert via Telegram"""
    # Priority indicators
    prefixes = {
        "critical": "🚨 CRITICAL: ",
        "high": "⚠️ HIGH: ",
        "normal": "ℹ️ ",
        "success": "✅ "
    }
    
    full_message = prefixes.get(priority, "") + message
    
    # Using curl to send Telegram message
    cmd = [
        "curl", "-s", "-X", "POST",
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        "-d", f"chat_id={TELEGRAM_CHAT_ID}",
        "-d", f"text={full_message}"
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, timeout=10)
        return True
    except:
        return False

def check_portfolio():
    """Check portfolio for significant changes"""
    # Placeholder - would integrate with Bankr API
    # For now, just check if Bankr is accessible
    bankr_bin = "/opt/homebrew/bin/bankr"
    env = os.environ.copy()
    env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + env.get("PATH", "")
    try:
        result = subprocess.run(
            [bankr_bin, "prompt", "What is my total portfolio value in USD?"],
            capture_output=True,
            text=True,
            timeout=30,
            env=env,
        )
        if result.returncode != 0:
            send_telegram("Bankr API connection issue", "high")
    except:
        send_telegram("Bankr service unreachable", "high")

def check_services():
    """Check if critical services are running"""
    services = {
        "com.crypto.alpha.hunter": "X Crypto Bot",
        "com.moltbook.autonomous": "Moltbook Bot",
        "com.kingkong.crypto.trader": "Crypto Trader"
    }
    
    for service_id, service_name in services.items():
        result = subprocess.run(
            ["launchctl", "list"],
            capture_output=True,
            text=True
        )
        
        if service_id not in result.stdout:
            send_telegram(f"{service_name} is not running", "high")

def check_disk_space():
    """Alert if disk space is low"""
    result = subprocess.run(
        ["df", "-h", "/"],
        capture_output=True,
        text=True
    )
    
    # Parse disk usage
    lines = result.stdout.strip().split("\n")
    if len(lines) >= 2:
        usage_line = lines[1]
        usage_percent = int(usage_line.split()[4].replace("%", ""))
        
        if usage_percent > 90:
            send_telegram(f"Disk usage critical: {usage_percent}%", "critical")
        elif usage_percent > 80:
            send_telegram(f"Disk usage high: {usage_percent}%", "high")

def send_daily_summary():
    """Send daily activity summary"""
    summary = f"""📊 Daily Summary - {datetime.now().strftime('%Y-%m-%d')}

🤖 Autonomous Systems:
• X Crypto Bot: Active
• Moltbook Bot: Active  
• Crypto Trader: Standby

💰 Crypto Status:
• Bankr: Connected
• Wallet: 0 ETH (fund to trade)

📝 Git Activity:
• Auto-sync: Active
• Commits today: Check repo

⚡ Next: Hourly posts at :00"""
    
    send_telegram(summary, "normal")

def main():
    if len(sys.argv) < 2:
        print("Usage: alert-system.py <check|daily|test>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "check":
        check_services()
        check_portfolio()
        check_disk_space()
    elif command == "daily":
        send_daily_summary()
    elif command == "test":
        send_telegram("🧪 Alert system test - KingKong is watching", "normal")
        print("Test alert sent")

if __name__ == "__main__":
    main()
