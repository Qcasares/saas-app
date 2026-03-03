#!/bin/bash
# Telegram /price command handler
# This script outputs a formatted price report for Telegram

echo "📊 *INSTANT PRICE CHECK*"
echo "⏰ $(date '+%H:%M %Z') | $(date '+%d %b %Y')"
echo ""

# Run scanner silently and extract key data
OUTPUT=$(~/.openclaw/workspace/.venv/bin/python ~/.openclaw/workspace/skills/trader/scripts/coinbase-scanner.py 2>&1)

# Extract prices using grep/sed
BTC_PRICE=$(echo "$OUTPUT" | grep "BTC-USD" | grep -o '\$[0-9,]*\.[0-9]*' | head -1 | tr -d '$,' | xargs printf "%.2f")
ETH_PRICE=$(echo "$OUTPUT" | grep "ETH-USD" | grep -o '\$[0-9,]*\.[0-9]*' | head -1 | tr -d '$,' | xargs printf "%.2f")
SOL_PRICE=$(echo "$OUTPUT" | grep "SOL-USD" | grep -o '\$[0-9,]*\.[0-9]*' | head -1 | tr -d '$,' | xargs printf "%.2f")

# Get P&L info
SOL_PNL=$(echo "$OUTPUT" | grep -A1 "SOL:" | grep "P&L" | grep -o '\-[0-9.]*%' || echo "N/A")

# Critical levels
BTC_FLOOR=66385
BTC_DANGER=66000
BTC_RECLAIM=68200
SOL_STOP=78.75
SOL_BREAKOUT=90.0

# Format output
echo "💰 *Live Prices:*"
echo "• BTC: \$$BTC_PRICE"
echo "• ETH: \$$ETH_PRICE"
echo "• SOL: \$$SOL_PRICE (*$SOL_PNL*)"
echo ""

# BTC status
BTC_NUM=$(echo $BTC_PRICE | tr -d ',')
DIST_FLOOR=$(echo "$BTC_NUM - $BTC_FLOOR" | bc)
DIST_RECLAIM=$(echo "$BTC_RECLAIM - $BTC_NUM" | bc)

if (( $(echo "$BTC_NUM < $BTC_FLOOR" | bc -l) )); then
    echo "🚨 *BTC BELOW STRATEGY FLOOR*"
    echo "   Floor: \$$BTC_FLOOR | Distance: \$$DIST_FLOOR"
elif (( $(echo "$BTC_NUM < $BTC_FLOOR + 200" | bc -l) )); then
    echo "⚠️ *BTC CRITICAL: \$$DIST_FLOOR above floor*"
else
    echo "✅ BTC: \$$DIST_FLOOR above floor"
fi

echo "   → \$$(echo "$BTC_NUM - $BTC_DANGER" | bc) to danger zone"
echo "   → \$$DIST_RECLAIM to reclaim target"
echo ""

# SOL status
SOL_NUM=$(echo $SOL_PRICE | tr -d ',')
DIST_STOP=$(echo "$SOL_NUM - $SOL_STOP" | bc)
DIST_BREAKOUT=$(echo "$SOL_BREAKOUT - $SOL_NUM" | bc)

if (( $(echo "$SOL_NUM <= $SOL_STOP" | bc -l) )); then
    echo "🛑 *SOL STOP LOSS HIT!*"
elif (( $(echo "$SOL_NUM < $SOL_STOP + 2" | bc -l) )); then
    echo "⚠️ *SOL Near Stop: \$$DIST_STOP buffer*"
else
    echo "🟡 SOL: \$$DIST_STOP to stop | \$$DIST_BREAKOUT to breakout"
fi

echo ""
echo "⏱️ Auto-check: every 15 min"