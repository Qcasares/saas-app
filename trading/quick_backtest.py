#!/usr/bin/env python3
"""Quick backtest: Mean reversion after -5% to -15% dips"""
import random

# Simulated VVV 90-day daily returns (based on typical altcoin vol)
# Mean: 0.2%, Std: 8%, fat tails
random.seed(42)
returns = [random.gauss(0.002, 0.08) for _ in range(90)]

# Add some regime changes
for i in range(20, 30):  # Volatile period
    returns[i] = random.gauss(-0.005, 0.15)
for i in range(60, 70):  # Another volatile period  
    returns[i] = random.gauss(0.01, 0.12)

# Backtest parameters
DIP_THRESHOLD_LOW = -0.05   # -5%
DIP_THRESHOLD_HIGH = -0.15  # -15%
STOP_LOSS = -0.05           # -5%
TP1 = 0.075                 # +7.5%
TP2 = 0.125                 # +12.5%
TP3 = 0.20                  # +20%

# Walk forward
signals = []
for i in range(1, len(returns)):
    if DIP_THRESHOLD_LOW > returns[i] > DIP_THRESHOLD_HIGH:
        # Simulate holding for 5 days or until hit target/stop
        entry = 0
        exit_pnl = 0
        hit = None
        
        for j in range(1, 6):  # Check next 5 days
            if i + j >= len(returns):
                break
            
            cumulative = sum(returns[i+1:i+j+1])
            
            if cumulative <= STOP_LOSS:
                exit_pnl = STOP_LOSS
                hit = 'stop'
                break
            elif cumulative >= TP3:
                exit_pnl = TP3
                hit = 'tp3'
                break
            elif cumulative >= TP2 and hit is None:
                hit = 'tp2_running'
            elif cumulative >= TP1 and hit is None:
                hit = 'tp1_running'
        
        if hit is None:
            hit = 'timeout'
            exit_pnl = sum(returns[i+1:i+6]) if i+5 < len(returns) else 0
        elif hit in ['tp1_running', 'tp2_running']:
            exit_pnl = sum(returns[i+1:i+6]) if i+5 < len(returns) else 0
            
        signals.append({
            'day': i,
            'dip': returns[i],
            'result': hit,
            'pnl': exit_pnl
        })

# Results
wins = [s for s in signals if s['pnl'] > 0]
losses = [s for s in signals if s['pnl'] <= 0]
avg_win = sum(s['pnl'] for s in wins) / len(wins) if wins else 0
avg_loss = sum(s['pnl'] for s in losses) / len(losses) if losses else 0
total_pnl = sum(s['pnl'] for s in signals)

print(f"=== MEAN REVERSION BACKTEST (90 days) ===")
print(f"Total signals: {len(signals)}")
print(f"Win rate: {len(wins)}/{len(signals)} ({100*len(wins)/len(signals):.0f}%)")
print(f"Avg win: +{avg_win*100:.1f}%")
print(f"Avg loss: {avg_loss*100:.1f}%")
print(f"Total return: {total_pnl*100:.1f}%")
print(f"Expectancy per trade: {total_pnl/len(signals)*100:.2f}%")
print()
print("Hit distribution:")
from collections import Counter
for k,v in Counter(s['result'] for s in signals).items():
    print(f"  {k}: {v}")
