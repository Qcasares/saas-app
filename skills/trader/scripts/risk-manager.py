#!/usr/bin/env python3
"""
Trader Risk Manager - Execution safety layer
All trade orders pass through this validator
"""
import os
import json
import sys
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Risk limits (conservative)
MAX_POSITION_PCT = 0.01  # 1% of portfolio
DAILY_LOSS_LIMIT_PCT = 0.03  # 3% daily stop
ALLOWED_PAIRS = {'BTC-USD', 'ETH-USD', 'BTC-USDC', 'ETH-USDC'}
REQUIRE_APPROVAL_ABOVE = 500  # USD
SIMULATION_MODE = os.getenv('TRADER_SIMULATION', 'true').lower() == 'true'

class RiskManager:
    def __init__(self, portfolio_value: float = 10000):
        self.portfolio_value = portfolio_value
        self.daily_log_path = os.path.expanduser(
            '~/.openclaw/workspace/trading/logs/daily-pnl.json'
        )
        self.positions_path = os.path.expanduser(
            '~/.openclaw/workspace/trading/POSITIONS.json'
        )
        
    def validate_trade(self, trade: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates a trade against risk rules
        Returns: {'approved': bool, 'reason': str, 'simulation': bool}
        """
        symbol = trade.get('symbol', '')
        size_usd = trade.get('size_usd', 0)
        side = trade.get('side', '')  # 'buy' or 'sell'
        
        # Check 1: Simulation mode
        if SIMULATION_MODE:
            return {
                'approved': True,
                'reason': 'SIMULATION MODE - Paper trade only',
                'simulation': True,
                'warnings': []
            }
        
        warnings = []
        
        # Check 2: Allowed pairs
        if symbol not in ALLOWED_PAIRS:
            return {
                'approved': False,
                'reason': f'Rejected: {symbol} not in allowed pairs {ALLOWED_PAIRS}',
                'simulation': False,
                'warnings': []
            }
        
        # Check 3: Position size
        position_pct = size_usd / self.portfolio_value
        if position_pct > MAX_POSITION_PCT:
            return {
                'approved': False,
                'reason': f'Rejected: Position {position_pct:.2%} exceeds max {MAX_POSITION_PCT:.2%}',
                'simulation': False,
                'warnings': []
            }
        
        if position_pct > 0.005:  # Warn if >0.5%
            warnings.append(f'Large position: {position_pct:.2%} of portfolio')
        
        # Check 4: Daily loss limit
        daily_pnl = self._get_daily_pnl()
        if daily_pnl < -self.portfolio_value * DAILY_LOSS_LIMIT_PCT:
            return {
                'approved': False,
                'reason': f'Rejected: Daily loss limit reached ({daily_pnl/self.portfolio_value:.2%})',
                'simulation': False,
                'warnings': []
            }
        
        # Check 5: Approval threshold
        requires_approval = size_usd > REQUIRE_APPROVAL_ABOVE
        
        return {
            'approved': True,
            'reason': 'Approved with warnings' if warnings else 'Approved',
            'simulation': False,
            'warnings': warnings,
            'requires_approval': requires_approval,
            'position_pct': position_pct
        }
    
    def _get_daily_pnl(self) -> float:
        """Calculate today's P&L"""
        try:
            with open(self.daily_log_path, 'r') as f:
                log = json.load(f)
            today = datetime.now().strftime('%Y-%m-%d')
            return log.get(today, {}).get('realized_pnl', 0)
        except:
            return 0
    
    def log_trade(self, trade: Dict[str, Any], result: Dict[str, Any]):
        """Log trade to journal"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'trade': trade,
            'validation': result,
            'simulation': result.get('simulation', True)
        }
        
        log_path = os.path.expanduser(
            '~/.openclaw/workspace/trading/logs/executed-trades.jsonl'
        )
        with open(log_path, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

if __name__ == '__main__':
    # CLI usage for testing
    if len(sys.argv) < 2:
        print("Usage: risk-manager.py '<trade_json>'")
        sys.exit(1)
    
    trade = json.loads(sys.argv[1])
    rm = RiskManager()
    result = rm.validate_trade(trade)
    print(json.dumps(result, indent=2))
