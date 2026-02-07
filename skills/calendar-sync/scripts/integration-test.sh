#!/bin/bash
#
# Integration test for calendar-sync (without actual calendar access)
#

echo "=== Calendar Sync Integration Test ==="
echo ""

cd ~/.openclaw/workspace/skills/calendar-sync

# Test 1: Config creation
echo "Test 1: Config file creation"
if [[ -f config/sync-config.json ]]; then
    echo "✓ Config exists"
    cat config/sync-config.json
else
    echo "✗ Config not found"
fi

echo ""
echo "Test 2: State file creation"
if [[ -f data/sync-state.json ]]; then
    echo "✓ State exists"
    cat data/sync-state.json
else
    echo "✗ State not found"
fi

echo ""
echo "Test 3: Event comparison logic"
cat > /tmp/test_a.json << 'EOF'
[{
  "uid": "evt1",
  "title": "Team Standup",
  "start": "2026-02-10T09:00:00",
  "end": "2026-02-10T09:30:00",
  "location": "Zoom",
  "description": "Daily standup"
}]
EOF

cat > /tmp/test_b.json << 'EOF'
[{
  "uid": "evt2",
  "title": "Client Meeting",
  "start": "2026-02-10T14:00:00",
  "end": "2026-02-10T15:00:00",
  "location": "Office"
}]
EOF

result=$(node scripts/compare.js /tmp/test_a.json /tmp/test_b.json '{}')
toGoogle=$(echo "$result" | jq '.toGoogle | length')
toApple=$(echo "$result" | jq '.toApple | length')

echo "  Apple → Google: $toGoogle events"
echo "  Google → Apple: $toApple events"

if [[ $toGoogle -eq 1 && $toApple -eq 1 ]]; then
    echo "✓ Comparison working correctly"
else
    echo "✗ Comparison failed"
fi

echo ""
echo "Test 4: Duplicate detection"
cat > /tmp/test_dup_a.json << 'EOF'
[{
  "uid": "same_event",
  "title": "Weekly Review",
  "start": "2026-02-14T10:00:00"
}]
EOF

cat > /tmp/test_dup_b.json << 'EOF'
[{
  "uid": "same_event_google",
  "title": "Weekly Review",
  "start": "2026-02-14T10:00:00"
}]
EOF

dup_result=$(node scripts/compare.js /tmp/test_dup_a.json /tmp/test_dup_b.json '{}')
dup_toGoogle=$(echo "$dup_result" | jq '.toGoogle | length')
dup_toApple=$(echo "$dup_result" | jq '.toApple | length')

if [[ $dup_toGoogle -eq 0 && $dup_toApple -eq 0 ]]; then
    echo "✓ Duplicate detection working (0 events to sync)"
else
    echo "✗ Duplicate detection failed ($dup_toGoogle to Google, $dup_toApple to Apple)"
fi

echo ""
echo "Test 5: Script syntax validation"
bash -n scripts/sync.sh && echo "✓ sync.sh syntax OK"
bash -n scripts/setup-cron.sh && echo "✓ setup-cron.sh syntax OK"

echo ""
echo "========================================"
echo "Prerequisites for production use:"
echo "========================================"
echo "1. Install icalBuddy: brew install ical-buddy"
echo "2. Configure gog: gog auth add quentin.casares@gmail.com --services calendar"
echo "3. Edit config: config/sync-config.json"
echo "4. Setup cron: ./scripts/setup-cron.sh"
