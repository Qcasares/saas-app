#!/bin/bash
# Trader wrapper script with environment setup
# Usage: trader-exec.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load environment from .env
export COINBASE_API_KEY="577c27e6-22e2-4901-af7e-9caa79720505"
export COINBASE_API_SECRET='-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----'

# Set Python path
export PYTHONPATH="$WORKSPACE_DIR/.venv/lib/python3.13/site-packages:$PYTHONPATH"

# Run the trader
"$WORKSPACE_DIR/.venv/bin/python3" "$SCRIPT_DIR/coinbase-trader.py" "$@"
