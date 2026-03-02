#!/bin/bash
# Quick test with verbose output

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

source skills/coinbase-trading/scripts/coinbase-auth.sh 2>/dev/null

echo "Making authenticated request..."
response=$(coinbase_request "GET" "/api/v3/brokerage/accounts" 2>&1)
echo "Response:"
echo "$response" | head -c 500
echo ""
echo "---"
echo "Response length: ${#response}"
