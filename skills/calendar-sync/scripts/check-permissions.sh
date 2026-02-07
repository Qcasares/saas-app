#!/bin/bash
#
# Check calendar permissions and provide guidance
#

echo "Checking Calendar permissions..."
echo ""

# Test icalBuddy
echo "Testing icalBuddy..."
if ! command -v icalBuddy > /dev/null 2>&1; then
    echo "❌ icalBuddy not installed"
    echo "   Install: brew install ical-buddy"
    exit 1
fi

echo "✓ icalBuddy installed ($(icalBuddy --version 2>&1))"
echo ""

# Test Calendar app access
echo "Testing Calendar app access..."

# Try AppleScript approach
timeout_result=$(osascript -e '
try
    tell application "Calendar" to get name of first calendar
    return "success"
on error errMsg
    return "error: " & errMsg
end try' 2>&1)

if [[ "$timeout_result" == *"success"* ]]; then
    echo "✓ Calendar app accessible via AppleScript"
    
    # Get calendar names
    calendars=$(osascript -e 'tell application "Calendar" to get name of calendars' 2>&1)
    echo "   Available calendars: $calendars"
    
elif [[ "$timeout_result" == *"error"* ]]; then
    echo "❌ Calendar app permission issue"
    echo "   Error: $timeout_result"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Open System Settings → Privacy & Security → Automation"
    echo "   2. Find Terminal (or your terminal app)"
    echo "   3. Enable 'Calendar' permission"
    echo "   4. Or run: tccutil reset Calendar"
    echo ""
    echo "   Alternatively, grant Full Disk Access to Terminal:"
    echo "   System Settings → Privacy & Security → Full Disk Access"
    
else
    echo "⚠️  Calendar app not responding (timeout)"
    echo "   This usually means permission is needed"
    echo ""
    echo "🔧 Quick fix: Open Calendar app manually, then retry"
fi

echo ""
echo "Testing Google Calendar access..."
if [[ -f ~/Library/Application\ Support/gogcli/tokens.json ]]; then
    access_token=$(cat ~/Library/Application\ Support/gogcli/tokens.json 2>/dev/null | jq -r '.["quentin.casares@gmail.com"].access_token // empty')
    if [[ -n "$access_token" ]]; then
        count=$(curl -s "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10" \
            -H "Authorization: Bearer $access_token" 2>/dev/null | jq '.items | length')
        echo "✓ Google Calendar accessible ($count recent events found)"
    else
        echo "❌ Google auth token not found"
        echo "   Run: gog auth add quentin.casares@gmail.com --services calendar"
    fi
else
    echo "❌ gog not configured"
    echo "   Run: gog auth add quentin.casares@gmail.com --services calendar"
fi
