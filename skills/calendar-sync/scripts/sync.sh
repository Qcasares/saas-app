#!/bin/bash
#
# Calendar Sync - Bidirectional Apple ↔ Google sync
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SKILL_DIR/config/sync-config.json"
STATE_FILE="$SKILL_DIR/data/sync-state.json"
LOG_FILE="$SKILL_DIR/data/sync.log"
TMP_DIR="/tmp/calendar-sync-$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup on exit
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$TMP_DIR"

# Load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log "Creating default config..."
        mkdir -p "$(dirname "$CONFIG_FILE")"
        cat > "$CONFIG_FILE" << 'EOF'
{
  "apple_calendar": "Personal",
  "google_calendar": "primary",
  "sync_deletions": false,
  "conflict_resolution": "newer_wins",
  "dry_run": false,
  "sync_window_days": 90
}
EOF
    fi
    
    APPLE_CAL=$(jq -r '.apple_calendar // "Personal"' "$CONFIG_FILE")
    GOOGLE_CAL=$(jq -r '.google_calendar // "primary"' "$CONFIG_FILE")
    SYNC_DELETIONS=$(jq -r '.sync_deletions // false' "$CONFIG_FILE")
    CONFLICT_RES=$(jq -r '.conflict_resolution // "newer_wins"' "$CONFIG_FILE")
    DRY_RUN=${DRY_RUN:-$(jq -r '.dry_run // false' "$CONFIG_FILE")}
    SYNC_WINDOW=$(jq -r '.sync_window_days // 90' "$CONFIG_FILE")
}

# Initialize state file
init_state() {
    if [[ ! -f "$STATE_FILE" ]]; then
        log "Creating initial sync state..."
        mkdir -p "$(dirname "$STATE_FILE")"
        echo '{"uid_map": {}, "last_sync": null, "event_hashes": {}}' > "$STATE_FILE"
    fi
}

# Export Apple Calendar to ICS
export_apple() {
    log "Exporting Apple Calendar: $APPLE_CAL"
    
    if ! command -v icalBuddy &> /dev/null; then
        error "icalBuddy not found. Install with: brew install ical-buddy"
        exit 1
    fi
    
    local output_file="$TMP_DIR/apple_events.json"
    
    # Get events from Apple Calendar (next 90 days)
    # Note: This may hang if Calendar app permissions are not granted
    log "Fetching events from Apple Calendar (this may take a moment)..."
    
    # Use timeout to prevent hanging indefinitely
    if ! timeout 30 icalBuddy --json --includeCals "$APPLE_CAL" \
        --dateFormat "%Y-%m-%d" \
        --timeFormat "%H:%M:%S" \
        --propertyOrder "datetime,title,location,description,url,uid" \
        --exclude "attendees,alarms" \
        eventsToday+${SYNC_WINDOW} > "$output_file" 2>/dev/null; then
        warn "Could not access Apple Calendar (permission issue or timeout)"
        warn "To fix: Grant Calendar access to Terminal in System Settings → Privacy → Automation"
        echo "[]" > "$output_file"
    fi
    
    # If empty or failed, create empty array
    if [[ ! -s "$output_file" ]] || ! jq empty "$output_file" 2>/dev/null; then
        echo "[]" > "$output_file"
    fi
    
    # Convert to standardized format
    cat "$output_file" | jq '[.[] | select(.title != null) | {
        uid: (.uid // .["apple-uid"] // ("apple_" + (.title | @sha1))),
        title: .title,
        start: (.startDate // .datetime),
        end: (.endDate // .datetime),
        location: (.location // ""),
        description: (.description // ""),
        url: (.url // ""),
        last_modified: (.lastModified // ""),
        source: "apple"
    }]' > "$TMP_DIR/apple_normalized.json"
    
    local count=$(jq 'length' "$TMP_DIR/apple_normalized.json")
    if [[ $count -eq 0 ]]; then
        warn "No Apple Calendar events found (permission issue or empty calendar)"
    else
        success "Apple Calendar: $count events exported"
    fi
}

# Export Google Calendar via gog
export_google() {
    log "Exporting Google Calendar: $GOOGLE_CAL"
    
    if ! command -v gog &> /dev/null; then
        error "gog not found. Please install gog skill first."
        exit 1
    fi
    
    local output_file="$TMP_DIR/google_events.json"
    local start_date=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local end_date=$(date -u -v+${SYNC_WINDOW}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+${SYNC_WINDOW} days" +%Y-%m-%dT%H:%M:%SZ)
    
    # Use direct API call since gog calendar command might not support full export
    local access_token=$(cat ~/Library/Application\ Support/gogcli/tokens.json 2>/dev/null | jq -r '.["quentin.casares@gmail.com"].access_token // empty')
    
    if [[ -z "$access_token" ]]; then
        error "No Google authentication found. Run: gog auth add quentin.casares@gmail.com --services calendar"
        exit 1
    fi
    
    curl -s "https://www.googleapis.com/calendar/v3/calendars/$GOOGLE_CAL/events?timeMin=$start_date&timeMax=$end_date&maxResults=2500" \
        -H "Authorization: Bearer $access_token" \
        -H "Accept: application/json" > "$output_file" 2>/dev/null || echo '{"items":[]}' > "$output_file"
    
    # Convert to standardized format
    cat "$output_file" | jq '[.items[]? | select(.status != "cancelled") | {
        uid: (.id // .iCalUID // ("google_" + (.summary | @sha1))),
        title: .summary,
        start: (.start.dateTime // .start.date),
        end: (.end.dateTime // .end.date),
        location: (.location // ""),
        description: (.description // ""),
        url: ("https://www.google.com/calendar/event?eid=" + (.id | @uri) // ""),
        last_modified: (.updated // ""),
        source: "google"
    }]' > "$TMP_DIR/google_normalized.json"
    
    local count=$(jq 'length' "$TMP_DIR/google_normalized.json")
    success "Google Calendar: $count events exported"
}

# Generate hash for event comparison
hash_event() {
    local title="$1"
    local start="$2"
    echo "${title}:${start}" | sha256sum | cut -d' ' -f1 | head -c 16
}

# Build UID mapping from state
build_uid_map() {
    cat "$STATE_FILE" | jq '.uid_map // {}' > "$TMP_DIR/uid_map.json"
}

# Find new events to sync
find_changes() {
    log "Analyzing changes..."
    
    # Load current state
    build_uid_map
    
    # Use compare.js for event comparison
    node "$SCRIPT_DIR/compare.js" \
        "$TMP_DIR/apple_normalized.json" \
        "$TMP_DIR/google_normalized.json" \
        "$STATE_FILE" \
        > "$TMP_DIR/compare_result.json" 2>/dev/null || echo '{"toGoogle":[],"toApple":[],"stats":{}}' > "$TMP_DIR/compare_result.json"
    
    # Extract results
    jq '.toGoogle // []' "$TMP_DIR/compare_result.json" > "$TMP_DIR/to_create_in_google.json"
    jq '.toApple // []' "$TMP_DIR/compare_result.json" > "$TMP_DIR/to_create_in_apple.json"
    
    local to_google=$(jq 'length' "$TMP_DIR/to_create_in_google.json")
    local to_apple=$(jq 'length' "$TMP_DIR/to_create_in_apple.json")
    
    log "Changes detected:"
    log "  - Create in Google: $to_google events"
    log "  - Create in Apple: $to_apple events"
}

# Create event in Google Calendar
create_in_google() {
    local event_file="$1"
    local count=$(jq 'length' "$event_file")
    
    if [[ $count -eq 0 ]]; then
        return 0
    fi
    
    log "Creating $count events in Google Calendar..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warn "[DRY RUN] Would create $count events in Google:"
        jq -r '.[] | "  - \(.title) at \(.start)"' "$event_file"
        return 0
    fi
    
    local access_token=$(cat ~/Library/Application\ Support/gogcli/tokens.json 2>/dev/null | jq -r '.["quentin.casares@gmail.com"].access_token // empty')
    local created=0
    local failed=0
    
    # Process each event
    jq -c '.[]' "$event_file" | while read event; do
        local title=$(echo "$event" | jq -r '.title')
        local start=$(echo "$event" | jq -r '.start')
        local end=$(echo "$event" | jq -r '.end')
        local location=$(echo "$event" | jq -r '.location // ""')
        local description=$(echo "$event" | jq -r '.description // ""')
        local source_uid=$(echo "$event" | jq -r '.source_uid')
        
        # Build event JSON for Google
        local event_json=$(jq -n \
            --arg summary "$title" \
            --arg start "$start" \
            --arg end "$end" \
            --arg location "$location" \
            --arg description "$description" \
            '{
                summary: $summary,
                location: $location,
                description: $description,
                start: (if $start | contains("T") then {dateTime: $start} else {date: $start} end),
                end: (if $end | contains("T") then {dateTime: $end} else {date: $end} end)
            }')
        
        # Create event
        local response=$(curl -s -X POST "https://www.googleapis.com/calendar/v3/calendars/$GOOGLE_CAL/events" \
            -H "Authorization: Bearer $access_token" \
            -H "Content-Type: application/json" \
            -d "$event_json")
        
        local new_id=$(echo "$response" | jq -r '.id // empty')
        
        if [[ -n "$new_id" ]]; then
            # Store UID mapping
            jq --arg apple_uid "$source_uid" --arg google_uid "$new_id" \
                '.uid_map[$apple_uid] = $google_uid' "$STATE_FILE" > "$TMP_DIR/state_new.json" && mv "$TMP_DIR/state_new.json" "$STATE_FILE"
            ((created++)) || true
            log "  Created: $title"
        else
            ((failed++)) || true
            error "  Failed to create: $title"
        fi
    done
    
    success "Google: $created created, $failed failed"
}

# Create event in Apple Calendar (via AppleScript)
create_in_apple() {
    local event_file="$1"
    local count=$(jq 'length' "$event_file")
    
    if [[ $count -eq 0 ]]; then
        return 0
    fi
    
    log "Creating $count events in Apple Calendar..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warn "[DRY RUN] Would create $count events in Apple:"
        jq -r '.[] | "  - \(.title) at \(.start)"' "$event_file"
        return 0
    fi
    
    local created=0
    local failed=0
    
    # AppleScript to create events
    local script_file="$TMP_DIR/create_events.scpt"
    
    cat > "$script_file" << 'APPLESCRIPT'
on run argv
    set eventsJSON to item 1 of argv
    set calName to item 2 of argv
    
    tell application "Calendar"
        tell calendar calName
            -- Parse and create events here
            -- This is simplified; real implementation needs JSON parsing
        end tell
    end tell
end run
APPLESCRIPT

    # For now, log that this needs implementation
    warn "Apple Calendar creation requires AppleScript implementation"
    warn "Events to create:"
    jq -r '.[] | "  - \(.title) at \(.start)"' "$event_file"
    
    success "Apple: $created created (AppleScript implementation needed)"
}

# Update sync state
update_state() {
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    jq --arg ts "$timestamp" '.last_sync = $ts' "$STATE_FILE" > "$TMP_DIR/state_new.json" && mv "$TMP_DIR/state_new.json" "$STATE_FILE"
}

# Main sync function
sync() {
    log "========================================"
    log "Calendar Sync Started"
    log "========================================"
    
    load_config
    init_state
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warn "DRY RUN MODE - No changes will be made"
    fi
    
    # Export both calendars
    export_apple
    export_google
    
    # Find changes
    find_changes
    
    # Apply changes
    create_in_google "$TMP_DIR/to_create_in_google.json"
    create_in_apple "$TMP_DIR/to_create_in_apple.json"
    
    # Update state
    update_state
    
    log "========================================"
    log "Calendar Sync Completed"
    log "========================================"
}

# Show help
show_help() {
    cat << 'EOF'
Calendar Sync - Bidirectional Apple ↔ Google sync

Usage: sync.sh [options]

Options:
    --dry-run       Preview changes without applying
    --help          Show this help

Environment:
    DRY_RUN=1       Enable dry run mode
    APPLE_CAL       Apple calendar name (default: Personal)
    GOOGLE_CAL      Google calendar ID (default: primary)

Examples:
    ./sync.sh                    # Run sync
    DRY_RUN=1 ./sync.sh          # Dry run
    ./sync.sh --dry-run          # Dry run
EOF
}

# Main
main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --dry-run|--dry)
            DRY_RUN=true
            sync
            ;;
        *)
            sync
            ;;
    esac
}

main "$@"
