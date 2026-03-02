#!/bin/bash
# Get current price for a trading pair

set -e

PRODUCT_ID="${1:-BTC-USD}"
CURRENCY=$(echo "$PRODUCT_ID" | cut -d'-' -f1)
QUOTE=$(echo "$PRODUCT_ID" | cut -d'-' -f2)

echo "Fetching price for $PRODUCT_ID..."

# Use public exchange rates endpoint (no auth required)
response=$(curl -s "https://api.coinbase.com/v2/exchange-rates?currency=${CURRENCY}" 2>/dev/null || echo '{"error":"connection failed"}')

if echo "$response" | jq -e ".data.rates.${QUOTE}" >/dev/null 2>/dev/null; then
    rate=$(echo "$response" | jq -r ".data.rates.${QUOTE}")
    
    echo ""
    echo "1 $CURRENCY = \$$rate $QUOTE"
    
    # Also show inverse rate
    if command -v bc >/dev/null 2>&1; then
        inverse=$(echo "scale=8; 1 / $rate" | bc 2>/dev/null || echo "N/A")
        [ "$inverse" != "N/A" ] && echo "1 $QUOTE = $inverse $CURRENCY"
    fi
else
    error=$(echo "$response" | jq -r '.error // .message // "Unknown error"')
    echo "Error: $error"
    
    # Show available rates if currency not found
    if echo "$error" | grep -qi "currency"; then
        echo ""
        echo "Available base currencies:"
        curl -s "https://api.coinbase.com/v2/currencies" 2>/dev/null | jq -r '.data[].id' 2>/dev/null | head -20
    fi
    exit 1
fi
