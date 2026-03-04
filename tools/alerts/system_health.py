#!/usr/bin/env python3
"""
System Health Checker
Validates trading infrastructure health: dependencies, data freshness, API status.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

DEFAULT_PRICES = "trading/MARKET-ANALYSIS.json"
DEFAULT_POSITIONS = "trading/active-positions.json"
DEFAULT_EXECUTIONS = "trading/executions.json"
HEALTH_LOG = "trading/logs/system-health.json"
MAX_DATA_AGE_MINUTES = 15  # Market data should be < 15 min old

class HealthChecker:
    def __init__(self):
        self.checks: List[Dict] = []
        self.overall_status = "HEALTHY"
        
    def log_check(self, name: str, status: str, message: str, details: Optional[Dict] = None):
        """Log a health check result."""
        check = {
            "name": name,
            "status": status,  # HEALTHY, WARNING, CRITICAL
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.checks.append(check)
        
        # Update overall status (worst wins)
        if status == "CRITICAL":
            self.overall_status = "CRITICAL"
        elif status == "WARNING" and self.overall_status == "HEALTHY":
            self.overall_status = "WARNING"
            
    def check_python_dependencies(self):
        """Check required Python packages."""
        required = {
            "coinbase-advanced-py": "Coinbase exchange API",
            "requests": "HTTP requests",
            "pandas": "Data analysis (optional but recommended)"
        }
        
        for package, purpose in required.items():
            try:
                if package == "coinbase-advanced-py":
                    # Special case - module name differs from package
                    __import__("coinbase")
                elif package == "pandas":
                    __import__("pandas")
                else:
                    __import__(package)
                self.log_check(
                    f"dependency_{package}",
                    "HEALTHY",
                    f"✅ {package} is installed ({purpose})"
                )
            except ImportError:
                severity = "CRITICAL" if package == "coinbase-advanced-py" else "WARNING"
                self.log_check(
                    f"dependency_{package}",
                    severity,
                    f"❌ {package} is NOT installed ({purpose})",
                    {"install_command": f"pip install {package}"}
                )
    
    def check_environment_variables(self):
        """Check required environment variables."""
        required = {
            "COINBASE_API_KEY": "Coinbase API authentication",
            "COINBASE_API_SECRET": "Coinbase API authentication"
        }
        
        for var, purpose in required.items():
            value = os.getenv(var)
            if value:
                masked = value[:4] + "..." + value[-4:] if len(value) > 10 else "***"
                self.log_check(
                    f"env_{var}",
                    "HEALTHY",
                    f"✅ {var} is set ({purpose})",
                    {"value_masked": masked}
                )
            else:
                self.log_check(
                    f"env_{var}",
                    "CRITICAL",
                    f"❌ {var} is NOT set ({purpose})",
                    {"action": f"Export {var}=your_value"}
                )
    
    def check_file_exists(self, path: str, description: str, required: bool = True):
        """Check if a file exists."""
        file_path = Path(path)
        if file_path.exists():
            size = file_path.stat().st_size
            self.log_check(
                f"file_{description}",
                "HEALTHY",
                f"✅ {description} exists ({size} bytes)",
                {"path": str(file_path), "size_bytes": size}
            )
            return True
        else:
            severity = "CRITICAL" if required else "WARNING"
            self.log_check(
                f"file_{description}",
                severity,
                f"❌ {description} NOT found",
                {"path": str(file_path)}
            )
            return False
    
    def check_data_freshness(self, path: str, description: str, max_age_minutes: int = MAX_DATA_AGE_MINUTES):
        """Check if data file is fresh."""
        file_path = Path(path)
        if not file_path.exists():
            self.log_check(
                f"freshness_{description}",
                "CRITICAL",
                f"❌ Cannot check freshness - {description} not found"
            )
            return
        
        try:
            with open(file_path) as f:
                data = json.load(f)
            
            # Try to find timestamp in various formats
            timestamp = None
            if isinstance(data, dict):
                timestamp = data.get("timestamp") or data.get("generated_at") or data.get("last_updated")
            
            if not timestamp:
                # Use file modification time
                mtime = file_path.stat().st_mtime
                timestamp = datetime.fromtimestamp(mtime).isoformat()
                source = "file_mtime"
            else:
                source = "data_timestamp"
            
            # Parse timestamp
            try:
                if isinstance(timestamp, str):
                    data_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                else:
                    data_time = datetime.fromtimestamp(timestamp)
            except:
                data_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            now = datetime.now()
            if data_time.tzinfo:
                now = datetime.now(data_time.tzinfo)
            
            age_minutes = (now - data_time).total_seconds() / 60
            
            if age_minutes <= max_age_minutes:
                self.log_check(
                    f"freshness_{description}",
                    "HEALTHY",
                    f"✅ {description} is fresh ({age_minutes:.1f} min old)",
                    {"age_minutes": age_minutes, "max_age": max_age_minutes}
                )
            elif age_minutes <= max_age_minutes * 4:  # 4x threshold = warning
                self.log_check(
                    f"freshness_{description}",
                    "WARNING",
                    f"⚠️  {description} is stale ({age_minutes:.1f} min old)",
                    {"age_minutes": age_minutes, "max_age": max_age_minutes}
                )
            else:
                self.log_check(
                    f"freshness_{description}",
                    "CRITICAL",
                    f"❌ {description} is VERY stale ({age_minutes:.1f} min old)",
                    {"age_minutes": age_minutes, "max_age": max_age_minutes}
                )
                
        except Exception as e:
            self.log_check(
                f"freshness_{description}",
                "WARNING",
                f"⚠️  Error checking {description} freshness: {e}"
            )
    
    def check_git_status(self):
        """Check if workspace is committed."""
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                changes = result.stdout.strip().split("\n") if result.stdout.strip() else []
                if not changes or changes == ['']:
                    self.log_check(
                        "git_status",
                        "HEALTHY",
                        "✅ Workspace is clean (no uncommitted changes)"
                    )
                else:
                    self.log_check(
                        "git_status",
                        "WARNING",
                        f"⚠️  {len(changes)} uncommitted change(s) in workspace",
                        {"uncommitted_files": len(changes)}
                    )
            else:
                self.log_check(
                    "git_status",
                    "WARNING",
                    f"⚠️  Could not check git status: {result.stderr}"
                )
        except Exception as e:
            self.log_check(
                "git_status",
                "WARNING",
                f"⚠️  Git check failed: {e}"
            )
    
    def check_disk_space(self):
        """Check available disk space."""
        try:
            result = subprocess.run(
                ["df", "-h", "."],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                lines = result.stdout.strip().split("\n")
                if len(lines) >= 2:
                    # Parse df output
                    parts = lines[1].split()
                    if len(parts) >= 5:
                        used_pct = parts[4].replace("%", "")
                        try:
                            used = int(used_pct)
                            if used < 80:
                                status = "HEALTHY"
                                msg = f"✅ Disk usage: {used}%"
                            elif used < 90:
                                status = "WARNING"
                                msg = f"⚠️  Disk usage: {used}%"
                            else:
                                status = "CRITICAL"
                                msg = f"❌ Disk usage CRITICAL: {used}%"
                            
                            self.log_check("disk_space", status, msg, {"usage_pct": used})
                        except:
                            pass
        except Exception:
            pass  # Silently skip disk check if it fails
    
    def check_recent_errors(self):
        """Check recent execution errors."""
        exec_file = Path(DEFAULT_EXECUTIONS)
        if not exec_file.exists():
            self.log_check(
                "recent_errors",
                "HEALTHY",
                "✅ No execution log to analyze"
            )
            return
        
        try:
            with open(exec_file) as f:
                executions = json.load(f)
            
            if not executions:
                self.log_check(
                    "recent_errors",
                    "HEALTHY",
                    "✅ No executions recorded"
                )
                return
            
            # Count recent failures (last 24 hours)
            cutoff = datetime.now() - timedelta(hours=24)
            recent_failures = []
            
            for exec in executions[-50:]:  # Check last 50
                ts_str = exec.get("timestamp", "")
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    if ts > cutoff and exec.get("status") == "failed":
                        recent_failures.append(exec)
                except:
                    pass
            
            if not recent_failures:
                self.log_check(
                    "recent_errors",
                    "HEALTHY",
                    "✅ No failures in last 24 hours"
                )
            else:
                # Get unique error types
                errors = {}
                for f in recent_failures:
                    err = f.get("error", "unknown")
                    errors[err] = errors.get(err, 0) + 1
                
                self.log_check(
                    "recent_errors",
                    "WARNING",
                    f"⚠️  {len(recent_failures)} failure(s) in last 24 hours",
                    {"error_breakdown": errors}
                )
                
        except Exception as e:
            self.log_check(
                "recent_errors",
                "WARNING",
                f"⚠️  Could not analyze errors: {e}"
            )
    
    def run(self) -> Dict:
        """Run all health checks."""
        print("🏥 System Health Check Starting...")
        print("=" * 60)
        
        # Run all checks
        self.check_python_dependencies()
        self.check_environment_variables()
        self.check_file_exists(DEFAULT_POSITIONS, "active_positions", required=True)
        self.check_file_exists(DEFAULT_PRICES, "market_prices", required=True)
        self.check_file_exists(DEFAULT_EXECUTIONS, "executions", required=False)
        self.check_data_freshness(DEFAULT_PRICES, "market_prices")
        self.check_git_status()
        self.check_disk_space()
        self.check_recent_errors()
        
        # Compile results
        result = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": self.overall_status,
            "checks": self.checks,
            "summary": {
                "healthy": sum(1 for c in self.checks if c["status"] == "HEALTHY"),
                "warning": sum(1 for c in self.checks if c["status"] == "WARNING"),
                "critical": sum(1 for c in self.checks if c["status"] == "CRITICAL"),
                "total": len(self.checks)
            }
        }
        
        # Print summary
        print()
        for check in self.checks:
            print(f"  {check['message']}")
        
        print()
        print("=" * 60)
        status_emoji = "🟢" if self.overall_status == "HEALTHY" else "🟡" if self.overall_status == "WARNING" else "🔴"
        print(f"{status_emoji} Overall Status: {self.overall_status}")
        print(f"   Healthy: {result['summary']['healthy']}/{result['summary']['total']}")
        print(f"   Warnings: {result['summary']['warning']}/{result['summary']['total']}")
        print(f"   Critical: {result['summary']['critical']}/{result['summary']['total']}")
        
        # Save health log
        log_path = Path(HEALTH_LOG)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(log_path, "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"\n📋 Full report saved to: {HEALTH_LOG}")
        
        return result


def main():
    checker = HealthChecker()
    result = checker.run()
    
    # Print JSON for automation
    print("\n📄 JSON Output:")
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    if result["overall_status"] == "CRITICAL":
        sys.exit(2)
    elif result["overall_status"] == "WARNING":
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
