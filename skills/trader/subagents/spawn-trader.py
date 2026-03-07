#!/usr/bin/env python3
"""
Trading Subagent Launcher
Spawns isolated subagents for parallel trading operations
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

WORKSPACE = Path("/Users/quentincasares/.openclaw/workspace")
CONFIG_PATH = WORKSPACE / "skills/trader/config/trader-config.json"
TASKS_PATH = WORKSPACE / "skills/trader/subagents/tasks"
LOGS_PATH = WORKSPACE / "skills/trader/logs/subagent-runs"

def load_config():
    """Load trader configuration"""
    with open(CONFIG_PATH) as f:
        return json.load(f)

def load_task(task_name: str) -> dict:
    """Load task definition"""
    task_file = TASKS_PATH / f"{task_name}.json"
    with open(task_file) as f:
        return json.load(f)

def spawn_subagent(
    task_def: dict,
    label_suffix: str = None,
    dry_run: bool = False
) -> dict:
    """
    Spawn a trading subagent via OpenClaw sessions spawn
    
    Args:
        task_def: Task definition dict
        label_suffix: Optional suffix for session label
        dry_run: If True, print command without executing
    
    Returns:
        dict with spawn result
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    label = f"trader-{task_def['name']}"
    if label_suffix:
        label = f"{label}-{label_suffix}"
    label = f"{label}-{timestamp}"
    
    # Build spawn command
    cmd = [
        "openclaw", "sessions", "spawn",
        "--runtime", "subagent",
        "--agentId", task_def.get("agent_id", "trader"),
        "--label", label,
        "--mode", task_def.get("mode", "run"),
        "--task", task_def["task"]
    ]
    
    if task_def.get("timeout"):
        cmd.extend(["--timeout", str(task_def["timeout"])])
    
    if task_def.get("thread"):
        cmd.append("--thread")
    
    result = {
        "label": label,
        "command": " ".join(cmd),
        "timestamp": timestamp,
        "dry_run": dry_run
    }
    
    if dry_run:
        print(f"[DRY RUN] Would execute:")
        print(f"  {' '.join(cmd)}")
        return result
    
    # Execute spawn
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        result["returncode"] = proc.returncode
        result["stdout"] = proc.stdout
        result["stderr"] = proc.stderr
        result["success"] = proc.returncode == 0
        
        # Log result
        log_file = LOGS_PATH / f"{label}.json"
        with open(log_file, "w") as f:
            json.dump(result, f, indent=2, default=str)
        
        return result
        
    except subprocess.TimeoutExpired:
        result["error"] = "Spawn command timed out"
        result["success"] = False
        return result
    except Exception as e:
        result["error"] = str(e)
        result["success"] = False
        return result

def spawn_parallel_scans(dry_run: bool = False) -> list:
    """
    Spawn parallel scanner subagents for morning scan
    - scanner: Fetch market data
    - analyst: Technical analysis
    - risk: Portfolio risk check
    """
    tasks = ["scanner", "analyst", "risk-check"]
    results = []
    
    for task_name in tasks:
        task_def = load_task(f"morning-{task_name}")
        result = spawn_subagent(task_def, dry_run=dry_run)
        results.append(result)
        
        if not dry_run:
            print(f"Spawned {task_name}: {result['label']}")
    
    return results

def check_dependencies() -> dict:
    """
    Check pre-flight dependencies before spawning trader
    Returns status dict
    """
    intel_file = WORKSPACE / "intel/DAILY-INTEL.md"
    max_age_minutes = 120  # 2 hours
    
    status = {
        "intel_fresh": False,
        "intel_age_minutes": None,
        "can_proceed": False
    }
    
    if not intel_file.exists():
        status["error"] = "intel/DAILY-INTEL.md missing"
        return status
    
    # Check file age
    file_mtime = intel_file.stat().st_mtime
    age_minutes = (datetime.utcnow().timestamp() - file_mtime) / 60
    status["intel_age_minutes"] = round(age_minutes, 1)
    
    # Check for today's date in file
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    with open(intel_file) as f:
        content = f.read()
        has_today = today_str in content
    
    status["intel_fresh"] = age_minutes <= max_age_minutes and has_today
    status["can_proceed"] = status["intel_fresh"]
    
    if not status["can_proceed"]:
        status["block_reason"] = f"Intel stale ({age_minutes:.0f}min old) or missing today's date"
    
    return status

def main():
    parser = argparse.ArgumentParser(description="Trading Subagent Launcher")
    parser.add_argument("task", help="Task to spawn (e.g., morning-scan, continuous-monitor)")
    parser.add_argument("--dry-run", action="store_true", help="Print command without executing")
    parser.add_argument("--parallel", action="store_true", help="Spawn parallel subagents (for scans)")
    parser.add_argument("--skip-deps", action="store_true", help="Skip dependency checks")
    
    args = parser.parse_args()
    
    # Check dependencies unless skipped
    if not args.skip_deps and args.task in ["morning-scan", "midday-scan", "evening-scan"]:
        deps = check_dependencies()
        if not deps["can_proceed"]:
            print(f"🚫 BLOCKED: {deps.get('block_reason', 'Dependency check failed')}")
            print(f"   Intel age: {deps.get('intel_age_minutes', 'N/A')} minutes")
            sys.exit(1)
        print(f"✅ Dependencies satisfied (intel {deps['intel_age_minutes']}min old)")
    
    if args.parallel and args.task == "morning-scan":
        # Spawn parallel scanners
        results = spawn_parallel_scans(dry_run=args.dry_run)
        
        if args.dry_run:
            print(f"\nWould spawn {len(results)} parallel subagents")
        else:
            print(f"\nSpawned {len(results)} parallel subagents:")
            for r in results:
                status = "✅" if r.get("success") else "❌"
                print(f"  {status} {r['label']}")
    else:
        # Single task spawn
        task_def = load_task(args.task)
        result = spawn_subagent(task_def, dry_run=args.dry_run)
        
        if args.dry_run:
            print(f"\n[DRY RUN] Command prepared")
        else:
            status = "✅ Success" if result.get("success") else "❌ Failed"
            print(f"\n{status}: {result['label']}")
            if result.get("error"):
                print(f"   Error: {result['error']}")
    
    # Write spawn log
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "task": args.task,
        "dry_run": args.dry_run,
        "parallel": args.parallel,
        "results": results if args.parallel else [result]
    }
    
    spawn_log = LOGS_PATH / "spawn-history.jsonl"
    with open(spawn_log, "a") as f:
        f.write(json.dumps(log_entry, default=str) + "\n")

if __name__ == "__main__":
    main()
