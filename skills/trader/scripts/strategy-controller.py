#!/usr/bin/env python3
"""
Autonomous Trading Strategy Controller
Manages entry/exit decisions based on technical signals and risk parameters
"""
import os
import sys
import json
import subprocess
from datetime import datetime

HOME = os.path.expanduser('~')
WORKSPACE = os.path.join(HOME, '.openclaw/workspace')
CONFIG_PATH = os.path.join(WORKSPACE, 'skills/trader/config/trader-config.json')
LOG_PATH = os.path.join(WORKSPACE, 'trading/logs/strategy.log')
ACTION_LOG = os.path.join(WORKSPACE, 'trading/logs/trading-actions.jsonl')

# Strategy Parameters
STRATEGY = {
    "name": "Mean Reversion with Trend",
    "timeframes": ["1h", "4h", "1d"],
    "risk_per_trade": 0.02,  # 2% max
    "max_positions": 3,
    "pairs": ["BTC-USD", "ETH-USD", "SOL-USD"],
    "min_confidence": 0.6,
}

# Entry Rules
LONG_SETUPS = {
    "BTC-USD": {"entry": 68000, "stop": 66000, "target": 72000, "confidence": 0},
    "ETH-USD": {"entry": 1900, "stop": 1850, "target": 2100, "confidence": 0},
    "SOL-USD": {"entry": 80, "stop": 78, "target": 88, "confidence": 0},
}

SHORT_SETUPS = {
    "ETH-USD": {"entry": 1850, "stop": 1900, "target": 1700, "confidence": 0},
    "SOL-USD": {"entry": 78, "stop": 80, "target": 70, "confidence": 0},
}

def log(msg):
    ts = datetime.now().isoformat()
    print(f"[{ts}] {msg}")
    with open(LOG_PATH, 'a') as f:
        f.write(f"[{ts}] {msg}\n")

def get_prices():
    """Fetch current prices from Coinbase"""
    prices = {}
    for pair in STRATEGY["pairs"]:
        try:
            result = subprocess.run(
                [sys.executable, f"{WORKSPACE}/skills/trader/scripts/coinbase-trader.py", 
                 "price", "--pair", pair, "--live"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                # Parse "BTC-USD: $67,046.59"
                price_str = result.stdout.strip().split('$')[1].replace(',', '')
                prices[pair] = float(price_str)
        except Exception as e:
            log(f"Error fetching {pair}: {e}")
    return prices

def get_portfolio():
    """Get current portfolio value and positions"""
    try:
        result = subprocess.run(
            [sys.executable, f"{WORKSPACE}/skills/trader/scripts/coinbase-trader.py", 
             "portfolio", "--live"],
            capture_output=True, text=True, timeout=10
        )
        # Parse output for total value
        for line in result.stdout.split('\n'):
            if 'Total Value:' in line:
                value = float(line.split('$')[1].replace(',', ''))
                return value
    except Exception as e:
        log(f"Error fetching portfolio: {e}")
    return 0

def evaluate_signals(prices):
    """Generate trading signals based on price action"""
    signals = []
    
    for pair, price in prices.items():
        # Check long setups
        if pair in LONG_SETUPS:
            setup = LONG_SETUPS[pair]
            if price <= setup["entry"] and price > setup["stop"]:
                risk = price - setup["stop"]
                reward = setup["target"] - price
                rr = reward / risk if risk > 0 else 0
                confidence = min(1.0, rr / 2)  # R:R scaled to confidence
                
                signals.append({
                    "pair": pair,
                    "direction": "LONG",
                    "entry": price,
                    "stop": setup["stop"],
                    "target": setup["target"],
                    "risk_reward": rr,
                    "confidence": confidence,
                    "action": "BUY" if confidence >= STRATEGY["min_confidence"] else "WATCH"
                })
        
        # Check short setups (if supported)
        if pair in SHORT_SETUPS:
            setup = SHORT_SETUPS[pair]
            if price >= setup["entry"]:
                signals.append({
                    "pair": pair,
                    "direction": "SHORT",
                    "entry": price,
                    "stop": setup["stop"],
                    "target": setup["target"],
                    "confidence": 0.5,
                    "action": "WATCH"
                })
    
    return signals

def calculate_position_size(portfolio_value, confidence, risk_per_trade):
    """Calculate position size based on risk and confidence"""
    max_risk = portfolio_value * risk_per_trade
    # Scale by confidence
    position_risk = max_risk * confidence
    return position_risk

def execute_signal(signal, portfolio_value):
    """Execute a trading signal"""
    if signal["action"] != "BUY":
        return None
    
    # Calculate position
    size_usd = calculate_position_size(
        portfolio_value, 
        signal["confidence"],
        STRATEGY["risk_per_trade"]
    )
    
    # Cap at available USDC (rough estimate)
    max_position = portfolio_value * 0.25  # 25% max per position
    size_usd = min(size_usd, max_position, 5.0)  # Hard cap $5 for small account
    
    if size_usd < 1.0:
        log(f"Position size ${size_usd:.2f} too small, skipping")
        return None
    
    trade = {
        "timestamp": datetime.now().isoformat(),
        "pair": signal["pair"],
        "action": signal["action"],
        "direction": signal["direction"],
        "entry_price": signal["entry"],
        "size_usd": round(size_usd, 2),
        "stop_loss": signal["stop"],
        "take_profit": signal["target"],
        "confidence": signal["confidence"],
        "risk_reward": signal["risk_reward"],
        "strategy": STRATEGY["name"]
    }
    
    log(f"🎯 SIGNAL: {signal['pair']} {signal['direction']} at ${signal['entry']:.2f}")
    log(f"   Size: ${size_usd:.2f} | Stop: ${signal['stop']:.2f} | Target: ${signal['target']:.2f}")
    log(f"   R:R = {signal['risk_reward']:.2f} | Confidence = {signal['confidence']:.1%}")
    
    # Log action
    with open(ACTION_LOG, 'a') as f:
        f.write(json.dumps(trade) + '\n')
    
    return trade

def main():
    log("=" * 60)
    log("AUTONOMOUS STRATEGY CONTROLLER")
    log("=" * 60)
    
    # Get market data
    prices = get_prices()
    portfolio = get_portfolio()
    
    log(f"Portfolio Value: ${portfolio:.2f}")
    log("Current Prices:")
    for pair, price in prices.items():
        log(f"  {pair}: ${price:,.2f}")
    
    # Generate signals
    signals = evaluate_signals(prices)
    
    if not signals:
        log("No actionable signals")
        return
    
    log(f"\nGenerated {len(signals)} signals:")
    for sig in signals:
        log(f"  {sig['pair']}: {sig['action']} ({sig['direction']}) - Confidence: {sig['confidence']:.1%}")
    
    # Execute high-confidence signals
    executed = []
    for signal in signals:
        if signal["confidence"] >= STRATEGY["min_confidence"]:
            trade = execute_signal(signal, portfolio)
            if trade:
                executed.append(trade)
    
    log(f"\nExecuted {len(executed)} trades")
    log("=" * 60)

if __name__ == '__main__':
    main()
