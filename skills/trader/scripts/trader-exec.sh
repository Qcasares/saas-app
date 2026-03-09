#!/bin/bash
# Trader wrapper script with environment setup
# Usage: trader-exec.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load environment from .env
set -a
source "$WORKSPACE_DIR/.env"
set +a

# Set Python path
export PYTHONPATH="$WORKSPACE_DIR/.venv/lib/python3.13/site-packages:$PYTHONPATH"

# Run the trader
"$WORKSPACE_DIR/.venv/bin/python3" "$SCRIPT_DIR/coinbase-trader.py" "$@"
