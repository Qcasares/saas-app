#!/usr/bin/env python3
"""
Extract trading signals from Sherlock intel reports
Parses markdown intel and outputs structured signals
"""
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

def parse_intel_file(filepath):
    """Parse Sherlock intel markdown into structured data"""
    with open(filepath) as f:
        content = f.read()
    
    signals = []
    
    # Extract date from filename or content
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', filepath)
    intel_date = date_match.group(1) if date_match else datetime.now().strftime('%Y-%m-%d')
    
    # Look for crypto momentum signals in Top Gainers table
    crypto_section = re.search(r'### Top Gainers.*?\n\n', content, re.DOTALL)
    if crypto_section:
        # Parse table rows
        table_text = crypto_section.group(0)
        # Match pattern like: FAI-USD | $0.0029 | +98.61% | $4,833,163
        rows = re.findall(r'\|\s*(\w+-USD)\s*\|\s*\$?([\d.,]+)\s*\|\s*([+-]?[\d.]+)%', table_text)
        
        for i, (symbol, price, change) in enumerate(rows[:5]):  # Top 5
            price_val = float(price.replace(',', ''))
            change_val = float(change)
            
            # Determine setup type based on change magnitude
            if change_val > 50:
                setup_type = "parabolic_momentum"
                confidence = 0.65  # High risk, high reward
                urgency = "caution"
            elif change_val > 15:
                setup_type = "momentum_breakout"
                confidence = 0.80
                urgency = "immediate"
            elif change_val > 5:
                setup_type = "trend_continuation"
                confidence = 0.75
                urgency = "standard"
            else:
                continue  # Skip low movers
            
            # Calculate targets and stop
            entry = price_val
            tp1 = entry * 1.08  # 8% target
            tp2 = entry * 1.15  # 15% target
            stop = entry * 0.93  # 7% stop (tight for momentum)
            
            signal = {
                "signal_id": f"sig-{intel_date.replace('-', '')}-{i+1:03d}",
                "source": "sherlock",
                "timestamp": f"{intel_date}T09:00:00Z",
                "asset": symbol,
                "direction": "LONG",
                "confidence": confidence,
                "setup_type": setup_type,
                "entry": {
                    "price": round(entry, 6),
                    "type": "market" if urgency == "immediate" else "limit",
                    "urgency": urgency
                },
                "targets": [
                    {"price": round(tp1, 6), "size_pct": 0.50, "label": "TP1"},
                    {"price": round(tp2, 6), "size_pct": 0.50, "label": "TP2"}
                ],
                "stop_loss": round(stop, 6),
                "position_size": {
                    "max_risk_pct": 0.02,
                    "max_position_pct": 0.05 if change_val > 50 else 0.10
                },
                "rationale": f"{setup_type.replace('_', ' ').title()}: +{change_val}% move detected in Sherlock sweep",
                "timeframe": "scalp" if change_val > 50 else "swing",
                "expiration": (datetime.strptime(intel_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%dT09:00:00Z')
            }
            signals.append(signal)
    
    # Look for anomaly signals
    anomaly_section = re.search(r'### Volume \+ Volatility Anomalies.*?\n\n(.*?)(?=##|$)', content, re.DOTALL)
    if anomaly_section:
        anomaly_text = anomaly_section.group(1)
        anomalies = re.findall(r'\*\*(\w+-USD)\*\*.*?([+-]?[\d.]+)%.*?\$?([\d,]+)', anomaly_text)
        
        for symbol, change, volume in anomalies:
            change_val = float(change)
            if abs(change_val) < 10:  # Only significant anomalies
                continue
                
            # Check if already captured
            existing = [s for s in signals if s['asset'] == symbol]
            if existing:
                # Enhance existing signal
                existing[0]['confidence'] = min(0.90, existing[0]['confidence'] + 0.10)
                existing[0]['rationale'] += f"; Anomaly confirmed: ${volume} volume"
            else:
                # Create new anomaly signal
                entry = None  # Will need manual entry
                signal = {
                    "signal_id": f"sig-{intel_date.replace('-', '')}-a{len(signals)+1:03d}",
                    "source": "sherlock_anomaly",
                    "timestamp": f"{intel_date}T09:00:00Z",
                    "asset": symbol,
                    "direction": "LONG" if change_val > 0 else "SHORT",
                    "confidence": 0.75,
                    "setup_type": "volume_anomaly",
                    "entry": {
                        "price": None,  # Requires manual price
                        "type": "limit",
                        "urgency": "standard"
                    },
                    "targets": [
                        {"price": None, "size_pct": 0.50, "label": "TP1"},
                        {"price": None, "size_pct": 0.50, "label": "TP2"}
                    ],
                    "stop_loss": None,
                    "position_size": {
                        "max_risk_pct": 0.015,
                        "max_position_pct": 0.05
                    },
                    "rationale": f"Volume anomaly: {change_val:+.1f}% on ${volume} volume",
                    "timeframe": "scalp",
                    "requires_manual_entry": True,
                    "expiration": (datetime.strptime(intel_date, '%Y-%m-%d') + timedelta(hours=12)).strftime('%Y-%m-%dT21:00:00Z')
                }
                signals.append(signal)
    
    return signals

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--intel', required=True, help='Path to Sherlock intel markdown file')
    parser.add_argument('--output', default='signals/pending-signals.json', help='Output JSON file')
    args = parser.parse_args()
    
    signals = parse_intel_file(args.intel)
    
    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "source_intel": args.intel,
            "signal_count": len(signals),
            "signals": signals
        }, f, indent=2)
    
    print(f"✅ Extracted {len(signals)} signals from {args.intel}")
    for sig in signals:
        print(f"  → {sig['asset']} {sig['direction']} (confidence: {sig['confidence']:.0%})")
    print(f"📁 Saved to {args.output}")

if __name__ == '__main__':
    main()
