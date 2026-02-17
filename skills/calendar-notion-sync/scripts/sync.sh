#!/bin/bash
# Google Calendar → Notion Sync Script (API-based)
# Fetches today's events from Google Calendar and syncs to Notion database

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SKILL_DIR/config/sync-config.json"
STATE_FILE="$SKILL_DIR/data/sync-state.json"
LOG_FILE="$SKILL_DIR/data/sync.log"

# Load config
GOOGLE_CALENDAR=$(cat "$CONFIG_FILE" | jq -r '.google_calendar // "primary"')
NOTION_DATABASE=$(cat "$CONFIG_FILE" | jq -r '.notion_database // ""')
SYNC_DAYS_AHEAD=$(cat "$CONFIG_FILE" | jq -r '.sync_days_ahead // 1')
DRY_RUN=$(cat "$CONFIG_FILE" | jq -r '.dry_run // false')
NOTION_TOKEN=$(cat "$CONFIG_FILE" | jq -r '.notion_token // ""')

# Check prerequisites
if ! command -v gog &> /dev/null; then
    echo "❌ gog CLI not found. Install with: brew install steipete/tap/gogcli"
    exit 1
fi

if [[ -z "$NOTION_TOKEN" ]]; then
    echo "❌ Notion token not configured. Set in $CONFIG_FILE"
    exit 1
fi

if [[ -z "$NOTION_DATABASE" ]]; then
    echo "❌ Notion database ID not configured. Set in $CONFIG_FILE"
    exit 1
fi

# Date range
TODAY=$(date -u +%Y-%m-%d)
END_DATE=$(date -u -v+${SYNC_DAYS_AHEAD}d +%Y-%m-%d 2>/dev/null || date -u -d "+${SYNC_DAYS_AHEAD} days" +%Y-%m-%d)

echo "📅 Syncing Google Calendar → Notion"
echo "   Calendar: $GOOGLE_CALENDAR"
echo "   Notion DB: $NOTION_DATABASE"
echo "   Range: $TODAY to $END_DATE"
echo "   Dry run: $DRY_RUN"
echo ""

# Fetch Google Calendar events
echo "🔄 Fetching Google Calendar events..."
GOG_ACCOUNT="${GOG_ACCOUNT:-}"
ACCOUNT_FLAG=""
if [[ -n "$GOG_ACCOUNT" ]]; then
    ACCOUNT_FLAG="--account $GOG_ACCOUNT"
fi

events_json=$(gog calendar events "$GOOGLE_CALENDAR" \
    --from "${TODAY}T00:00:00Z" \
    --to "${END_DATE}T23:59:59Z" \
    $ACCOUNT_FLAG --json 2>&1) || {
    echo "❌ Failed to fetch calendar events"
    echo "$events_json"
    exit 1
}

# Check if any events
if [[ "$events_json" == "null" ]] || [[ "$events_json" == "[]" ]]; then
    echo "ℹ️ No events found for the specified date range"
    echo "{\"last_sync\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"events_synced\": 0}" > "$STATE_FILE"
    exit 0
fi

echo "📊 Found $(echo "$events_json" | jq 'length') events"
echo ""

# Process each event
synced_count=0
skipped_count=0

while IFS= read -r event; do
    [[ -z "$event" ]] && continue
    
    # Extract event details
    summary=$(echo "$event" | jq -r '.summary // "(No title)"')
    description=$(echo "$event" | jq -r '.description // ""')
    start=$(echo "$event" | jq -r '.start.dateTime // .start.date')
    end=$(echo "$event" | jq -r '.end.dateTime // .end.date')
    location=$(echo "$event" | jq -r '.location // ""')
    event_id=$(echo "$event" | jq -r '.id')
    
    echo "📝 Processing: $summary"
    
    # Check if event already exists in Notion (query by title)
    existing=$(curl -s -X POST "https://api.notion.com/v1/databases/$NOTION_DATABASE/query" \
        -H "Authorization: Bearer $NOTION_TOKEN" \
        -H "Notion-Version: 2022-06-28" \
        -H "Content-Type: application/json" \
        -d "{
            \"filter\": {
                \"and\": [
                    {\"property\": \"Name\", \"title\": {\"equals\": \"$summary\"}}
                ]
            }
        }" 2>&1 | jq '.results | length')
    
    if [[ "$existing" -gt 0 ]]; then
        echo "  ⏭️ Skipping (exists in Notion)"
        ((skipped_count++))
        continue
    fi
    
    # Format date for Notion
    if [[ "$start" == *T* ]]; then
        # DateTime - extract just the date part for simple matching
        start_date=$(echo "$start" | cut -d'T' -f1)
        date_start="$start"
        date_end="$end"
    else
        # All-day event
        start_date="$start"
        date_start="$start"
        date_end=null
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  📝 Would create: $summary ($start_date)"
        ((synced_count++))
        continue
    fi
    
    # Build date property
    if [[ "$date_end" == "null" ]] || [[ -z "$date_end" ]]; then
        date_json="{\"start\": \"$date_start\"}"
    else
        date_json="{\"start\": \"$date_start\", \"end\": \"$date_end\"}"
    fi
    
    # Create Notion page
    echo "  ✅ Creating in Notion..."
    
    # Escape description for JSON
    desc_escaped=$(echo "$description" | head -c 500 | sed 's/"/\\"/g' | tr '\n' ' ')
    
    properties=$(cat <<EOF
{
    "parent": { "database_id": "$NOTION_DATABASE" },
    "properties": {
        "Name": {
            "title": [{"text": {"content": "$summary"}}]
        },
        "Date": {
            "date": $date_json
        }$(if [[ -n "$desc_escaped" ]]; then echo ",
        \"Notes\": {
            \"rich_text\": [{\"text\": {\"content\": \"$desc_escaped\"}}]
        }"; fi)$(if [[ -n "$location" ]]; then echo ",
        \"Location\": {
            \"rich_text\": [{\"text\": {\"content\": \"$location\"}}]
        }"; fi)
    }
}
EOF
)
    
    result=$(curl -s -X POST "https://api.notion.com/v1/pages" \
        -H "Authorization: Bearer $NOTION_TOKEN" \
        -H "Notion-Version: 2022-06-28" \
        -H "Content-Type: application/json" \
        -d "$properties" 2>&1)
    
    if echo "$result" | jq -e '.id' >/dev/null 2>&1; then
        echo "     ✓ Created successfully"
        ((synced_count++))
    else
        echo "     ⚠️ Failed: $(echo "$result" | jq -r '.message // "Unknown error"')"
    fi
    
done <<< "$(echo "$events_json" | jq -c '.[]')"

# Update state
echo "{\"last_sync\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"events_synced\": $synced_count, \"events_skipped\": $skipped_count}" > "$STATE_FILE"

# Log
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Synced: $synced_count, Skipped: $skipped_count" >> "$LOG_FILE"

echo ""
echo "✅ Sync complete: $synced_count created, $skipped_count skipped"
