#!/bin/bash
# Test Coinbase API connectivity

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/coinbase-auth.sh" 2>/dev/null || { echo "Error: coinbase-auth.sh not found"; exit 1; }

echo "Testing Coinbase Advanced Trade API connection..."
echo ""

# Test 1: Get server time
echo "Test 1: Server time"
response=$(curl -s "https://api.coinbase.com/v2/time" 2>/dev/null || echo '{"error":"connection failed"}')
echo "$response" | jq -r '.data.iso // .error' 2>/dev/null || echo "$response"
echo ""

# Test 2: Get BTC price (public endpoint)
echo "Test 2: BTC price (public)"
response=$(curl -s "https://api.coinbase.com/v2/exchange-rates?currency=BTC" 2>/dev/null || echo '{"error":"connection failed"}')
echo "$response" | jq -r '.data.rates.USD // .error' 2>/dev/null || echo "$response"
echo ""

# Test 3: Get accounts (authenticated)
echo "Test 3: Account list (authenticated)"
accounts_response=$(coinbase_request "GET" "/api/v3/brokerage/accounts" 2>/dev/null || echo '{"error":"authentication failed"}')
if echo "$accounts_response" | jq -e '.accounts' > /dev/null 2>&1; then
    account_count=$(echo "$accounts_response" | jq '.accounts | length')
    echo "✅ Success - Found $account_count accounts"
    echo ""
    echo "Non-zero balances:"
    echo "$accounts_response" | jq -r '.accounts[] | select(.available != "0" and .available != "0.0000000000000000") | "\(.currency.name): \(.available) \(.currency.code)"' 2>/dev/null || echo "No balances found"
else
    echo "❌ Failed: $(echo "$accounts_response" | jq -r '.error // .message // "Unknown error"')"
fi

echo ""
echo "API Key: ${COINBASE_API_KEY:0:8}..."
echo "Connection test complete."
