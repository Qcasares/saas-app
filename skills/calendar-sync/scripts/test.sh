#!/bin/bash
#
# Test suite for calendar-sync skill
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEST_DIR="/tmp/calendar-sync-test-$$"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

passed=0
failed=0

# Test framework
assert() {
    if eval "$2"; then
        echo -e "${GREEN}✓${NC} $1"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $1"
        echo "  Command: $2"
        ((failed++))
    fi
}

assert_file_exists() {
    if [[ -f "$1" ]]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((passed++))
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((failed++))
    fi
}

assert_json_valid() {
    if jq empty "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Valid JSON: $1"
        ((passed++))
    else
        echo -e "${RED}✗${NC} Invalid JSON: $1"
        ((failed++))
    fi
}

# Setup
echo "Setting up test environment..."
mkdir -p "$TEST_DIR"
cp -r "$SKILL_DIR"/* "$TEST_DIR/"

# Test 1: File structure
echo ""
echo "=== Test 1: File Structure ==="
assert_file_exists "$TEST_DIR/SKILL.md"
assert_file_exists "$TEST_DIR/scripts/sync.sh"
assert_file_exists "$TEST_DIR/scripts/compare.js"
assert_file_exists "$TEST_DIR/scripts/setup-cron.sh"

# Test 2: JSON parsing
echo ""
echo "=== Test 2: JSON Handling ==="

# Create test events
cat > "$TEST_DIR/test_apple.json" << 'EOF'
[
  {
    "uid": "test_apple_1",
    "title": "Test Meeting",
    "start": "2026-02-10T10:00:00",
    "end": "2026-02-10T11:00:00",
    "location": "Office",
    "description": "Test description"
  },
  {
    "uid": "test_apple_2",
    "title": "Lunch with Team",
    "start": "2026-02-10T12:00:00",
    "end": "2026-02-10T13:00:00"
  }
]
EOF

cat > "$TEST_DIR/test_google.json" << 'EOF'
[
  {
    "uid": "test_google_1",
    "title": "Test Meeting",
    "start": "2026-02-10T10:00:00Z",
    "end": "2026-02-10T11:00:00Z"
  },
  {
    "uid": "test_google_2",
    "title": "Doctor Appointment",
    "start": "2026-02-11T14:00:00Z",
    "end": "2026-02-11T15:00:00Z"
  }
]
EOF

cat > "$TEST_DIR/test_state.json" << 'EOF'
{
  "uid_map": {},
  "last_sync": null
}
EOF

assert_json_valid "$TEST_DIR/test_apple.json"
assert_json_valid "$TEST_DIR/test_google.json"
assert_json_valid "$TEST_DIR/test_state.json"

# Test 3: Comparison logic
echo ""
echo "=== Test 3: Event Comparison ==="

cd "$TEST_DIR"
result=$(node scripts/compare.js test_apple.json test_google.json test_state.json)

# Check output structure
assert "Returns valid JSON" "echo '$result' | jq empty"

# Check that "Lunch with Team" needs to go to Google
to_google=$(echo "$result" | jq '[.toGoogle[] | select(.title == "Lunch with Team")] | length')
assert "Lunch with Team → Google" "[[ $to_google -eq 1 ]]"

# Check that "Doctor Appointment" needs to go to Apple  
to_apple=$(echo "$result" | jq '[.toApple[] | select(.title == "Doctor Appointment")] | length')
assert "Doctor Appointment → Apple" "[[ $to_apple -eq 1 ]]"

# Check that "Test Meeting" is NOT in either list (already synced)
test_meeting_google=$(echo "$result" | jq '[.toGoogle[] | select(.title == "Test Meeting")] | length')
test_meeting_apple=$(echo "$result" | jq '[.toApple[] | select(.title == "Test Meeting")] | length')
assert "Test Meeting already synced (not in toGoogle)" "[[ $test_meeting_google -eq 0 ]]"
assert "Test Meeting already synced (not in toApple)" "[[ $test_meeting_apple -eq 0 ]]"

# Test 4: Script permissions
echo ""
echo "=== Test 4: Script Permissions ==="
assert "sync.sh is executable" "[[ -x $TEST_DIR/scripts/sync.sh ]]"
assert "setup-cron.sh is executable" "[[ -x $TEST_DIR/scripts/setup-cron.sh ]]"

# Test 5: Configuration handling
echo ""
echo "=== Test 5: Configuration ==="
mkdir -p "$TEST_DIR/config"
cat > "$TEST_DIR/config/sync-config.json" << 'EOF'
{
  "apple_calendar": "TestCal",
  "google_calendar": "test@gmail.com",
  "sync_deletions": false,
  "conflict_resolution": "newer_wins",
  "dry_run": true
}
EOF
assert_json_valid "$TEST_DIR/config/sync-config.json"

# Test 6: Edge cases
echo ""
echo "=== Test 6: Edge Cases ==="

# Empty events
empty_result=$(echo '{"appleEvents":[],"googleEvents":[]}' | jq '.')
assert "Handles empty calendars" "[[ $(echo '$empty_result' | jq '.appleEvents | length') -eq 0 ]]"

# All-day events
cat > "$TEST_DIR/test_allday.json" << 'EOF'
[{
  "uid": "allday_1",
  "title": "All Day Event",
  "start": "2026-02-15",
  "end": "2026-02-16"
}]
EOF
assert_json_valid "$TEST_DIR/test_allday.json"

# Test 7: Duplicate detection
echo ""
echo "=== Test 7: Duplicate Detection ==="

cat > "$TEST_DIR/test_dup_apple.json" << 'EOF'
[{
  "uid": "dup_test",
  "title": "Duplicate Event",
  "start": "2026-02-20T10:00:00"
}]
EOF

cat > "$TEST_DIR/test_dup_google.json" << 'EOF'
[{
  "uid": "dup_google_id",
  "title": "Duplicate Event",
  "start": "2026-02-20T10:00:00Z"
}]
EOF

dup_result=$(node scripts/compare.js test_dup_apple.json test_dup_google.json test_state.json)
dup_to_google=$(echo "$dup_result" | jq '.toGoogle | length')
dup_to_apple=$(echo "$dup_result" | jq '.toApple | length')

assert "Duplicate not sent to Google" "[[ $dup_to_google -eq 0 ]]"
assert "Duplicate not sent to Apple" "[[ $dup_to_apple -eq 0 ]]"

# Cleanup
rm -rf "$TEST_DIR"

# Summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [[ $failed -eq 0 ]]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
