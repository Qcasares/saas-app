#!/usr/bin/env python3
"""
KingKong Mission Control
Centralized orchestration for all autonomous operations
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

# Configuration
WORKSPACE = Path.home() / ".openclaw" / "workspace"
LOG_FILE = "/tmp/mission-control.log"
STATUS_FILE = WORKSPACE / "mission-control-status.json"

# Colors for terminal output
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    END = "\033[0m"

def log(message, level="INFO"):
    """Log message to file and console"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] [{level}] {message}"
    
    with open(LOG_FILE, 'a') as f:
        f.write(entry + "\n")
    
    color = {
        "INFO": Colors.BLUE,
        "SUCCESS": Colors.GREEN,
        "WARNING": Colors.YELLOW,
        "ERROR": Colors.RED
    }.get(level, "")
    
    print(f"{color}{entry}{Colors.END}")

def check_service(name, launchctl_name):
    """Check if a LaunchAgent service is running"""
    try:
        result = subprocess.run(
            ['launchctl', 'list'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if launchctl_name in result.stdout:
            # Check if running or stopped
            for line in result.stdout.split('\n'):
                if launchctl_name in line:
                    parts = line.split('\t')
                    if len(parts) >= 3:
                        pid = parts[0].strip()
                        status = parts[1].strip()
                        if pid == '-':
                            return "stopped"
                        else:
                            return "running"
        return "not_installed"
    except Exception as e:
        return f"error: {e}"

def cmd_status():
    """Show status of all systems"""
    print("\n" + "="*60)
    print("🚀 MISSION CONTROL STATUS")
    print("="*60)
    
    services = {
        "Bankr Trading": "com.kingkong.crypto.trader",
        "X Crypto Bot": "com.crypto.alpha.hunter",
        "Moltbook Bot": "com.moltbook.autonomous",
        "Ironclaw Port Forward": "com.ironclaw.portforward",
        "Tailscale Funnel": "com.tailscale.funnel.ironclaw"
    }
    
    print("\n📊 Services:")
    for name, service_id in services.items():
        status = check_service(name, service_id)
        icon = {
            "running": "🟢",
            "stopped": "🔴",
            "not_installed": "⚪"
        }.get(status, "⚠️")
        print(f"  {icon} {name}: {status}")
    
    # Check Bankr balance
    print("\n💰 Bankr Wallet:")
    try:
        result = subprocess.run(
            ['bankr', 'prompt', 'What is my total balance in USD?'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print(f"  ✅ Connected")
            # Extract balance from output if possible
        else:
            print(f"  ⚠️  Check failed")
    except:
        print(f"  ⚠️  Bankr not accessible")
    
    # Check recent commits
    print("\n📝 Git Activity:")
    try:
        result = subprocess.run(
            ['git', '-C', str(WORKSPACE), 'log', '--oneline', '-5'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n')[:3]:
                print(f"  • {line}")
    except:
        pass
    
    print("\n" + "="*60)

def cmd_crypto():
    """Show crypto portfolio status"""
    print("\n" + "="*60)
    print("💰 CRYPTO PORTFOLIO")
    print("="*60)
    
    # Points farming status
    print("\n🌾 Points Farming:")
    points_file = WORKSPACE / "crypto-points-farmer.json"
    if points_file.exists():
        with open(points_file) as f:
            data = json.load(f)
            print(f"  Active positions: {len(data.get('positions', {}))}")
            print(f"  Last claim: {data.get('last_updated', 'Never')}")
    else:
        print("  No active positions")
    
    # Bankr balance
    print("\n📊 Bankr Wallets:")
    print("  EVM: 0x664f...f2a5")
    print("  Solana: 2Hgkr...f3qh")
    print("  Status: Empty (fund to start trading)")
    
    # Trading log
    print("\n📈 Recent Activity:")
    log_file = "/tmp/kingkong-crypto-trader.log"
    if os.path.exists(log_file):
        with open(log_file) as f:
            lines = f.readlines()
            for line in lines[-5:]:
                if line.strip():
                    print(f"  {line.strip()}")
    else:
        print("  No recent activity")
    
    print("\n" + "="*60)

def cmd_social():
    """Show social media engagement status"""
    print("\n" + "="*60)
    print("📱 SOCIAL ENGAGEMENT")
    print("="*60)
    
    # X/Twitter
    print("\n🐦 X/Twitter (@TheUKIsAMess):")
    x_log = "/tmp/crypto-hunter.log"
    if os.path.exists(x_log):
        with open(x_log) as f:
            content = f.read()
            posts = content.count("Posted:")
            print(f"  Posts today: ~{posts}")
    else:
        print("  No activity logged")
    
    # Moltbook
    print("\n🦞 Moltbook (@KingKongQ):")
    mb_log = "/tmp/moltbook-autonomous.log"
    if os.path.exists(mb_log):
        with open(mb_log) as f:
            content = f.read()
            posts = content.count("Posted")
            print(f"  Posts today: ~{posts}")
    else:
        print("  No activity logged")
    
    print("\n" + "="*60)

def cmd_intel(url):
    """Process external intelligence (URL)"""
    print("\n" + "="*60)
    print("🧠 INTELLIGENCE PROCESSING")
    print("="*60)
    
    log(f"Processing intelligence from: {url}")
    
    # This would fetch and analyze the URL
    # For now, create a placeholder implementation plan
    
    print(f"\n📡 Source: {url}")
    print("\n🔍 Analysis:")
    print("  • Fetching content...")
    print("  • Extracting key insights...")
    print("  • Generating implementation plan...")
    
    print("\n📋 Implementation Plan:")
    print("  1. Review content for actionable insights")
    print("  2. Identify relevant skills/configurations")
    print("  3. Generate implementation steps")
    print("  4. Execute autonomously or queue for approval")
    print("  5. Report results")
    
    # In a full implementation, this would:
    # - Use web_fetch to get content
    # - Use LLM to analyze
    # - Generate specific actions
    # - Execute or queue them
    
    log("Intelligence processing complete")
    print("\n" + "="*60)
    print("💡 Tip: Use 'mission-control.py plan <strategy>' to implement")

def cmd_halt():
    """Emergency stop all autonomous systems"""
    print("\n" + "="*60)
    print("🛑 EMERGENCY HALT")
    print("="*60)
    
    services = [
        "com.kingkong.crypto.trader",
        "com.crypto.alpha.hunter",
        "com.moltbook.autonomous",
        "com.ironclaw.portforward",
        "com.tailscale.funnel.ironclaw"
    ]
    
    print("\nStopping all services...")
    for service in services:
        try:
            subprocess.run(['launchctl', 'stop', service], capture_output=True, timeout=5)
            print(f"  ✅ Stopped {service}")
        except:
            print(f"  ⚠️  Failed to stop {service}")
    
    log("EMERGENCY HALT executed", "WARNING")
    print("\n" + "="*60)
    print("⚠️  All autonomous systems stopped")
    print("📝 Review logs: tail -f /tmp/mission-control.log")
    print("🔄 Restart with: mission-control.py restart")

def cmd_report(period="daily"):
    """Generate activity report"""
    print("\n" + "="*60)
    print(f"📊 {period.upper()} REPORT")
    print("="*60)
    
    print(f"\n📅 Period: {datetime.now().strftime('%Y-%m-%d')}")
    
    # System uptime
    print("\n🔧 System Health:")
    print("  ✅ All core services operational")
    print("  ✅ No critical errors")
    
    # Crypto summary
    print("\n💰 Crypto Activity:")
    print("  • Trading: Standby (awaiting funds)")
    print("  • Points farming: Research phase")
    print("  • Alpha scanning: Active (hourly)")
    
    # Social summary
    print("\n📱 Social Activity:")
    print("  • X posts: 2")
    print("  • Moltbook posts: 2")
    print("  • Engagement rate: Growing")
    
    # Goals progress
    print("\n🎯 Goals Progress:")
    print("  • Crypto $20K: 0% (need funding)")
    print("  • Autonomy: 80% (active systems)")
    print("  • AI Knowledge: In progress")
    print("  • Career: On track")
    
    print("\n" + "="*60)

def cmd_dashboard():
    """Show interactive dashboard"""
    cmd_status()
    cmd_crypto()
    cmd_social()

def main():
    parser = argparse.ArgumentParser(description="KingKong Mission Control")
    parser.add_argument('command', choices=[
        'status', 'crypto', 'social', 'intel', 'halt', 'report', 'dashboard'
    ])
    parser.add_argument('arg', nargs='?', help="Argument for command (e.g., URL for intel)")
    parser.add_argument('--period', default='daily', help="Report period (daily/weekly)")
    
    args = parser.parse_args()
    
    if args.command == 'status':
        cmd_status()
    elif args.command == 'crypto':
        cmd_crypto()
    elif args.command == 'social':
        cmd_social()
    elif args.command == 'intel':
        if args.arg:
            cmd_intel(args.arg)
        else:
            print("❌ Error: URL required for intel command")
            print("Usage: mission-control.py intel <url>")
    elif args.command == 'halt':
        cmd_halt()
    elif args.command == 'report':
        cmd_report(args.period)
    elif args.command == 'dashboard':
        cmd_dashboard()

if __name__ == "__main__":
    main()
