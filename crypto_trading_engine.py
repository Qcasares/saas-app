#!/usr/bin/env python3
"""
Crypto Trading Engine - KingKong Autonomous Trader
Base class for exchange connectors and strategies
"""

import os
import json
import time
import hmac
import hashlib
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class ExchangeConnector:
    """Base class for exchange API connections"""
    
    def __init__(self, name: str):
        self.name = name
        self.api_key = None
        self.api_secret = None
        self.base_url = None
        
    def load_credentials(self, env_prefix: str):
        """Load API credentials from environment"""
        self.api_key = os.environ.get(f"{env_prefix}_API_KEY")
        self.api_secret = os.environ.get(f"{env_prefix}_API_SECRET")
        return self.api_key and self.api_secret
    
    def sign_request(self, params: Dict) -> str:
        """Generate API signature - override per exchange"""
        raise NotImplementedError
    
    def make_request(self, method: str, endpoint: str, params: Dict = None) -> Dict:
        """Make authenticated API request"""
        raise NotImplementedError

class PortfolioManager:
    """Track portfolio state and risk metrics"""
    
    def __init__(self, initial_capital: float = 5000.0):
        self.initial_capital = initial_capital
        self.current_value = initial_capital
        self.positions = {}
        self.trade_history = []
        self.daily_pnl = 0.0
        
    def update_price(self, symbol: str, price: float):
        """Update position value with current price"""
        if symbol in self.positions:
            self.positions[symbol]['current_price'] = price
            
    def calculate_pnl(self) -> float:
        """Calculate total unrealized P&L"""
        total = 0.0
        for symbol, pos in self.positions.items():
            if 'current_price' in pos and 'entry_price' in pos:
                pnl = (pos['current_price'] - pos['entry_price']) * pos['size']
                total += pnl
        return total
    
    def get_portfolio_value(self) -> float:
        """Get total portfolio value"""
        return self.initial_capital + self.calculate_pnl()
    
    def check_risk_limits(self) -> Tuple[bool, str]:
        """Check if any risk limits are breached"""
        pnl_pct = (self.calculate_pnl() / self.initial_capital) * 100
        
        if pnl_pct <= -20:
            return False, "CRITICAL: -20% loss - halt trading"
        elif pnl_pct <= -10:
            return False, "WARNING: -10% loss - reduce positions"
        elif pnl_pct <= -7:
            return True, "CAUTION: Approaching stop limit"
        
        return True, "OK"

class RiskManager:
    """Manage position sizing and risk parameters"""
    
    def __init__(self, portfolio: PortfolioManager):
        self.portfolio = portfolio
        self.max_position_pct = 0.05  # 5% per trade
        self.max_strategy_pct = 0.20  # 20% per strategy
        self.stop_loss_pct = 0.07     # -7% stop
        self.take_profit_pct = 0.15   # +15% profit
        
    def calculate_position_size(self, symbol: str, entry_price: float) -> float:
        """Calculate safe position size"""
        max_position_value = self.portfolio.initial_capital * self.max_position_pct
        size = max_position_value / entry_price
        return size
    
    def should_enter_trade(self, symbol: str, strategy: str) -> Tuple[bool, str]:
        """Check if trade should be entered"""
        # Check risk limits
        ok, msg = self.portfolio.check_risk_limits()
        if not ok:
            return False, msg
        
        # Check strategy allocation
        strategy_allocation = self.get_strategy_allocation(strategy)
        if strategy_allocation >= self.max_strategy_pct:
            return False, f"Strategy {strategy} at max allocation"
        
        # Check if already in position
        if symbol in self.portfolio.positions:
            return False, f"Already holding {symbol}"
        
        return True, "OK"
    
    def get_strategy_allocation(self, strategy: str) -> float:
        """Get current allocation for a strategy"""
        # TODO: Track strategy-specific positions
        return 0.0
    
    def set_stop_loss(self, symbol: str, entry_price: float):
        """Calculate stop loss price"""
        return entry_price * (1 - self.stop_loss_pct)
    
    def set_take_profit(self, symbol: str, entry_price: float):
        """Calculate take profit price"""
        return entry_price * (1 + self.take_profit_pct)

class TradingLogger:
    """Log all trading activity"""
    
    def __init__(self, log_dir: str = "/tmp/crypto-trading"):
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        
    def log_trade(self, action: str, symbol: str, size: float, 
                  price: float, strategy: str, reason: str = ""):
        """Log a trade execution"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "symbol": symbol,
            "size": size,
            "price": price,
            "value": size * price,
            "strategy": strategy,
            "reason": reason
        }
        
        # Append to daily log
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(self.log_dir, f"trades-{date_str}.jsonl")
        
        with open(log_file, 'a') as f:
            f.write(json.dumps(entry) + "\n")
    
    def log_alert(self, level: str, message: str):
        """Log an alert or notification"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message
        }
        
        log_file = os.path.join(self.log_dir, "alerts.jsonl")
        with open(log_file, 'a') as f:
            f.write(json.dumps(entry) + "\n")

class AutonomousTrader:
    """Main trading orchestrator"""
    
    def __init__(self, capital: float = 5000.0):
        self.portfolio = PortfolioManager(capital)
        self.risk = RiskManager(self.portfolio)
        self.logger = TradingLogger()
        self.connectors = {}
        self.strategies = {}
        self.running = False
        
    def register_exchange(self, name: str, connector: ExchangeConnector):
        """Register an exchange connector"""
        self.connectors[name] = connector
        
    def register_strategy(self, name: str, strategy_func):
        """Register a trading strategy"""
        self.strategies[name] = strategy_func
        
    def run_cycle(self):
        """Execute one trading cycle"""
        # Check risk limits
        ok, msg = self.portfolio.check_risk_limits()
        if not ok:
            self.logger.log_alert("CRITICAL", msg)
            self.running = False
            return
        
        # Run each strategy
        for name, strategy in self.strategies.items():
            try:
                signals = strategy(self.portfolio, self.risk)
                for signal in signals:
                    self._execute_signal(signal, name)
            except Exception as e:
                self.logger.log_alert("ERROR", f"Strategy {name} failed: {e}")
    
    def _execute_signal(self, signal: Dict, strategy: str):
        """Execute a trading signal"""
        symbol = signal.get('symbol')
        action = signal.get('action')  # 'buy', 'sell'
        price = signal.get('price')
        
        if action == 'buy':
            # Check if should enter
            should_enter, reason = self.risk.should_enter_trade(symbol, strategy)
            if not should_enter:
                self.logger.log_alert("INFO", f"Skipped {symbol}: {reason}")
                return
            
            # Calculate position size
            size = self.risk.calculate_position_size(symbol, price)
            
            # Log and execute
            self.logger.log_trade("BUY", symbol, size, price, strategy)
            
            # Update portfolio
            self.portfolio.positions[symbol] = {
                'size': size,
                'entry_price': price,
                'strategy': strategy,
                'stop_loss': self.risk.set_stop_loss(symbol, price),
                'take_profit': self.risk.set_take_profit(symbol, price)
            }
            
        elif action == 'sell':
            if symbol in self.portfolio.positions:
                pos = self.portfolio.positions[symbol]
                self.logger.log_trade("SELL", symbol, pos['size'], price, strategy)
                del self.portfolio.positions[symbol]

if __name__ == "__main__":
    # Test initialization
    trader = AutonomousTrader(capital=1000.0)
    print("✅ Trading engine initialized")
    print(f"Portfolio value: ${trader.portfolio.get_portfolio_value()}")
