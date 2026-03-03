#!/usr/bin/env python3
"""
Validate trading signals against risk configuration
Applies position sizing and risk limits
"""
import json
import sys
from pathlib import Path

def load_config(config_path):
    with open(config_path) as f:
        return json.load(f)

def validate_signals(signals_data, config):
    """Validate and adjust signals based on risk config"""
    validated = []
    rejected = []
    
    risk_limits = config.get('risk_limits', {})
    approved_pairs = set(risk_limits.get('approved_pairs', []))
    max_position_pct = risk_limits.get('max_position_pct', 0.10)
    max_risk_pct = risk_limits.get('max_risk_pct', 0.02)
    
    for signal in signals_data.get('signals', []):
        asset = signal['asset']
        issues = []
        
        # Check 1: Asset approved
        if asset not in approved_pairs:
            issues.append(f"Asset {asset} not in approved_pairs")
        
        # Check 2: Has entry price or requires manual entry
        if signal.get('requires_manual_entry'):
            signal['status'] = 'manual_review'
            signal['notes'] = 'Requires manual price entry'
            validated.append(signal)
            continue
        
        if not signal.get('entry', {}).get('price'):
            issues.append("No entry price specified")
        
        # Check 3: Has stop loss
        if not signal.get('stop_loss'):
            # Add default stop loss (5% below entry)
            entry = signal.get('entry', {}).get('price', 0)
            if entry:
                signal['stop_loss'] = round(entry * 0.95, 6)
                signal['notes'] = signal.get('notes', '') + '; Auto-added 5% stop loss'
        
        # Check 4: Has profit targets
        if not signal.get('targets') or len(signal['targets']) == 0:
            entry = signal.get('entry', {}).get('price', 0)
            if entry:
                signal['targets'] = [
                    {"price": round(entry * 1.08, 6), "size_pct": 0.50, "label": "TP1"},
                    {"price": round(entry * 1.15, 6), "size_pct": 0.50, "label": "TP2"}
                ]
                signal['notes'] = signal.get('notes', '') + '; Auto-added profit targets'
        
        # Check 5: Position sizing
        position_config = signal.get('position_size', {})
        signal_risk_pct = position_config.get('max_risk_pct', max_risk_pct)
        signal_position_pct = position_config.get('max_position_pct', max_position_pct)
        
        if signal_position_pct > max_position_pct:
            signal['position_size']['max_position_pct'] = max_position_pct
            signal['notes'] = signal.get('notes', '') + f'; Position size reduced to {max_position_pct:.0%}'
        
        if signal_risk_pct > max_risk_pct:
            signal['position_size']['max_risk_pct'] = max_risk_pct
            signal['notes'] = signal.get('notes', '') + f'; Risk reduced to {max_risk_pct:.0%}'
        
        # Check 6: Confidence threshold
        if signal['confidence'] < 0.60:
            issues.append(f"Confidence {signal['confidence']:.0%} below 60% threshold")
        
        # Final decision
        if issues:
            signal['status'] = 'rejected'
            signal['rejection_reasons'] = issues
            rejected.append(signal)
        else:
            signal['status'] = 'validated'
            validated.append(signal)
    
    return validated, rejected

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='skills/trader/config/trader-config.json')
    parser.add_argument('--signals', default='signals/pending-signals.json')
    parser.add_argument('--output', default='signals/validated-signals.json')
    args = parser.parse_args()
    
    # Load files
    config = load_config(args.config)
    with open(args.signals) as f:
        signals_data = json.load(f)
    
    # Validate
    validated, rejected = validate_signals(signals_data, config)
    
    # Save results
    output = {
        "validated_at": json.dumps({}),
        "config_source": args.config,
        "summary": {
            "total": len(signals_data.get('signals', [])),
            "validated": len(validated),
            "rejected": len(rejected),
            "manual_review": len([s for s in validated if s.get('status') == 'manual_review'])
        },
        "validated_signals": validated,
        "rejected_signals": rejected
    }
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"✅ Validation complete")
    print(f"  Validated: {len(validated)} signals")
    print(f"  Rejected: {len(rejected)} signals")
    print(f"  Manual review: {len([s for s in validated if s.get('status') == 'manual_review'])} signals")
    
    if validated:
        print(f"\n📊 Ready to execute:")
        for sig in validated:
            if sig.get('status') == 'validated':
                entry = sig.get('entry', {}).get('price', 'manual')
                print(f"  → {sig['asset']} @ ${entry} (risk: {sig['position_size']['max_risk_pct']:.1%})")

if __name__ == '__main__':
    main()
