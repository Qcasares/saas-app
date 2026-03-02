#!/bin/bash
# List account balances

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/coinbase-auth.sh" 2>/dev/null || { echo "Error: coinbase-auth.sh not found"; exit 1; }

echo "Fetching account balances..."
echo ""

response=$(coinbase_request "GET" "/api/v3/brokerage/accounts" 2>/dev/null || echo '{"error":"request failed"}')

if echo "$response" | jq -e '.accounts' >/dev/null 2>/dev/null; then
    echo "Accounts with non-zero balances:"
    echo "--------------------------------"
    echo "$response" | jq -r '
        .accounts[] 
        | select((.available | tonumber) > 0 or (.hold | tonumber) > 0) 
        | "\(.currency.code): Available: \(.available), Hold: \(.hold)"
    ' 2>/dev/null | sort
    
    echo ""
    echo "All accounts:"
    echo "$response" | jq -r '.accounts[] | "\(.currency.code): \(.available)"' | sort
else
    echo "Error: $(echo "$response" | jq -r '.error // .message // "Unknown error"')"
    exit 1
fi
