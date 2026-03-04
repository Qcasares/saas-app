#!/usr/bin/env python3
"""
pipeline-deploy: Deploy Prefect pipelines with environment-aware configuration.
Handles deployment creation, scheduling, and environment-specific settings.
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

WORKSPACE = Path(os.environ.get("OPENCLAW_WORKSPACE", Path.home() / ".openclaw/workspace"))
DEPLOYMENTS_DIR = WORKSPACE / "deployments"
CONFIG_FILE = WORKSPACE / "config" / "pipeline-deploy.json"

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {level}: {message}")

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {
        "environments": {
            "dev": {"work_pool": "default", "concurrency": 1},
            "staging": {"work_pool": "default", "concurrency": 2},
            "prod": {"work_pool": "production", "concurrency": 5}
        },
        "default_environment": "dev"
    }

def detect_flow_entrypoint(flow_path: Path) -> str | None:
    """Auto-detect the @flow decorated function in a Python file."""
    try:
        with open(flow_path) as f:
            content = f.read()
        
        # Look for @flow decorator followed by function definition
        import re
        pattern = r'@flow(?:\([^)]*\))?\s*\n\s*def\s+(\w+)'
        matches = re.findall(pattern, content)
        
        if matches:
            return matches[0]  # Return first match
    except Exception as e:
        log(f"Could not parse flow file: {e}", "WARN")
    
    return None

def create_deployment_config(
    flow_path: Path,
    name: str,
    environment: str,
    schedule: str | None = None,
    params: dict | None = None
) -> dict:
    """Create deployment configuration."""
    config = load_config()
    env_config = config["environments"].get(environment, config["environments"]["dev"])
    
    # Auto-detect entrypoint
    entrypoint = detect_flow_entrypoint(flow_path)
    if entrypoint:
        log(f"Auto-detected flow entrypoint: {entrypoint}")
    else:
        entrypoint = "main"  # Default assumption
        log(f"Using default entrypoint: {entrypoint}")
    
    deployment = {
        "name": name,
        "flow_path": str(flow_path),
        "entrypoint": entrypoint,
        "environment": environment,
        "work_pool": env_config["work_pool"],
        "concurrency": env_config["concurrency"],
        "created_at": datetime.now().isoformat(),
        "params": params or {}
    }
    
    if schedule:
        deployment["schedule"] = schedule
    
    return deployment

def save_deployment(deployment: dict):
    """Save deployment configuration to file."""
    DEPLOYMENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    filename = f"{deployment['name']}.json"
    filepath = DEPLOYMENTS_DIR / filename
    
    with open(filepath, "w") as f:
        json.dump(deployment, f, indent=2)
    
    log(f"Deployment saved: {filepath}")
    return filepath

def deploy_to_prefect(deployment: dict) -> bool:
    """Deploy to Prefect using CLI commands."""
    flow_path = Path(deployment["flow_path"])
    entrypoint = deployment["entrypoint"]
    name = deployment["name"]
    
    # Build prefect deploy command
    cmd = [
        "prefect", "deploy",
        str(flow_path),
        f"{entrypoint}:{name}",
        "--pool", deployment["work_pool"]
    ]
    
    if "schedule" in deployment:
        cmd.extend(["--cron", deployment["schedule"]])
    
    log(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=flow_path.parent)
        
        if result.stdout:
            print(result.stdout)
        
        if result.returncode == 0:
            log(f"Deployment '{name}' created successfully")
            return True
        else:
            log(f"Deployment failed: {result.stderr}", "ERROR")
            return False
            
    except FileNotFoundError:
        log("Prefect CLI not found. Is Prefect installed?", "ERROR")
        return False
    except Exception as e:
        log(f"Deployment error: {e}", "ERROR")
        return False

def list_deployments():
    """List all saved deployments."""
    if not DEPLOYMENTS_DIR.exists():
        print("No deployments found.")
        return
    
    print(f"{'Name':<20} {'Environment':<12} {'Schedule':<20} {'Flow Path'}")
    print("-" * 80)
    
    for filepath in sorted(DEPLOYMENTS_DIR.glob("*.json")):
        with open(filepath) as f:
            deployment = json.load(f)
        
        schedule = deployment.get("schedule", "-")
        if len(schedule) > 18:
            schedule = schedule[:15] + "..."
        
        flow_path = deployment["flow_path"]
        if len(flow_path) > 30:
            flow_path = "..." + flow_path[-27:]
        
        print(f"{deployment['name']:<20} {deployment['environment']:<12} {schedule:<20} {flow_path}")

def main():
    parser = argparse.ArgumentParser(
        description="Deploy Prefect pipelines with environment-aware configuration"
    )
    parser.add_argument("flow", nargs="?", help="Path to flow file")
    parser.add_argument("--name", "-n", help="Deployment name")
    parser.add_argument("--env", "-e", choices=["dev", "staging", "prod"],
                        default="dev", help="Target environment")
    parser.add_argument("--schedule", "-s", help="Cron schedule (e.g., '0 9 * * *')")
    parser.add_argument("--param", "-p", action="append", nargs=2,
                        metavar=("KEY", "VALUE"),
                        help="Default parameters")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List all deployments")
    parser.add_argument("--apply", "-a", action="store_true",
                        help="Apply deployment to Prefect immediately")
    
    args = parser.parse_args()
    
    if args.list:
        list_deployments()
        return 0
    
    if not args.flow:
        parser.error("flow path is required (unless using --list)")
    
    if not args.name:
        # Auto-generate name from flow filename
        args.name = Path(args.flow).stem
        log(f"Using auto-generated deployment name: {args.name}")
    
    flow_path = Path(args.flow).expanduser().resolve()
    
    if not flow_path.exists():
        log(f"Flow file not found: {flow_path}", "ERROR")
        return 1
    
    # Parse parameters
    params = {}
    if args.param:
        for key, value in args.param:
            params[key] = value
    
    # Create deployment config
    deployment = create_deployment_config(
        flow_path=flow_path,
        name=args.name,
        environment=args.env,
        schedule=args.schedule,
        params=params
    )
    
    # Save deployment
    save_deployment(deployment)
    
    # Optionally apply to Prefect
    if args.apply:
        success = deploy_to_prefect(deployment)
        return 0 if success else 1
    else:
        log("Deployment config created. Use --apply to deploy to Prefect.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
