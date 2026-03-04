#!/usr/bin/env python3
"""
prefect-executor: Execute Prefect flows with workspace-aware configuration.
Auto-detects virtual environments, handles logging, and reports execution status.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

WORKSPACE = Path(os.environ.get("OPENCLAW_WORKSPACE", Path.home() / ".openclaw/workspace"))
LOG_DIR = WORKSPACE / "logs"
CONFIG_FILE = WORKSPACE / "config" / "prefect-executor.json"

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {level}: {message}")
    # Also write to log file
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_DIR / "prefect-executor.log", "a") as f:
        f.write(f"[{timestamp}] {level}: {message}\n")

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {
        "default_python": "python3",
        "virtual_envs": {},
        "default_log_level": "INFO"
    }

def find_virtual_env(flow_path: Path) -> Path | None:
    """Auto-detect virtual environment for a flow."""
    # Check for .venv in flow directory
    venv = flow_path.parent / ".venv"
    if venv.exists():
        return venv
    # Check for venv in flow directory
    venv = flow_path.parent / "venv"
    if venv.exists():
        return venv
    # Check workspace root
    venv = WORKSPACE / ".venv"
    if venv.exists():
        return venv
    return None

def get_python_executable(venv: Path | None) -> str:
    """Get Python executable path from virtual environment."""
    if venv is None:
        return "python3"
    if sys.platform == "darwin":
        return str(venv / "bin" / "python")
    return str(venv / "Scripts" / "python.exe" if sys.platform == "win32" else venv / "bin" / "python")

def execute_flow(flow_path: Path, params: dict | None = None, deployment: str | None = None):
    """Execute a Prefect flow."""
    if not flow_path.exists():
        log(f"Flow file not found: {flow_path}", "ERROR")
        return 1
    
    # Auto-detect virtual environment
    venv = find_virtual_env(flow_path)
    python = get_python_executable(venv)
    
    if venv:
        log(f"Using virtual environment: {venv}")
    else:
        log("No virtual environment detected, using system Python")
    
    # Build command
    cmd = [python, str(flow_path)]
    
    if deployment:
        cmd.extend(["--deployment", deployment])
    
    if params:
        for key, value in params.items():
            cmd.extend([f"--{key}", str(value)])
    
    log(f"Executing: {' '.join(cmd)}")
    
    # Execute with timing
    start_time = time.time()
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=flow_path.parent,
            timeout=3600  # 1 hour timeout
        )
        elapsed = time.time() - start_time
        
        # Log output
        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                log(f"[OUT] {line}")
        
        if result.stderr:
            for line in result.stderr.strip().split('\n'):
                log(f"[ERR] {line}", "WARN" if result.returncode == 0 else "ERROR")
        
        log(f"Flow completed in {elapsed:.2f}s with exit code {result.returncode}")
        
        # Save execution record
        record = {
            "timestamp": datetime.now().isoformat(),
            "flow": str(flow_path),
            "params": params,
            "deployment": deployment,
            "exit_code": result.returncode,
            "duration_seconds": elapsed,
            "virtual_env": str(venv) if venv else None
        }
        
        history_file = LOG_DIR / "execution-history.jsonl"
        with open(history_file, "a") as f:
            f.write(json.dumps(record) + "\n")
        
        return result.returncode
        
    except subprocess.TimeoutExpired:
        log("Flow execution timed out after 1 hour", "ERROR")
        return 1
    except Exception as e:
        log(f"Execution failed: {e}", "ERROR")
        return 1

def main():
    parser = argparse.ArgumentParser(
        description="Execute Prefect flows with workspace-aware configuration"
    )
    parser.add_argument("flow", help="Path to flow file (Python script)")
    parser.add_argument("--deployment", "-d", help="Deployment name to use")
    parser.add_argument("--param", "-p", action="append", nargs=2, 
                        metavar=("KEY", "VALUE"),
                        help="Flow parameters (can be used multiple times)")
    parser.add_argument("--list-history", action="store_true",
                        help="Show recent execution history")
    
    args = parser.parse_args()
    
    if args.list_history:
        history_file = LOG_DIR / "execution-history.jsonl"
        if history_file.exists():
            print("Recent execution history:")
            with open(history_file) as f:
                for line in f.readlines()[-10:]:
                    record = json.loads(line)
                    status = "✓" if record["exit_code"] == 0 else "✗"
                    print(f"  {status} {record['timestamp'][:19]} | {record['flow']} | {record['duration_seconds']:.1f}s")
        else:
            print("No execution history found.")
        return 0
    
    # Parse parameters
    params = {}
    if args.param:
        for key, value in args.param:
            params[key] = value
    
    flow_path = Path(args.flow).expanduser().resolve()
    return execute_flow(flow_path, params, args.deployment)

if __name__ == "__main__":
    sys.exit(main())
