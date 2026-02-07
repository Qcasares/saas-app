#!/bin/bash
#
# Setup automated calendar sync using launchd (macOS preferred over cron)
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
LAUNCHD_PLIST="$SKILL_DIR/com.openclaw.calendar-sync.plist"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
PLIST_NAME="com.openclaw.calendar-sync.plist"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Calendar Sync - Launchd Setup"
echo "=============================="
echo ""

# Check if already installed
if [[ -f "$LAUNCHD_DIR/$PLIST_NAME" ]]; then
    echo -e "${YELLOW}Launchd job already installed.${NC}"
    echo ""
    echo "Current status:"
    launchctl list | grep com.openclaw.calendar-sync || echo "  Not running"
    echo ""
    echo "To remove: ./setup-cron.sh remove"
    exit 0
fi

# Create LaunchAgents directory if needed
mkdir -p "$LAUNCHD_DIR"

# Copy plist file
cp "$LAUNCHD_PLIST" "$LAUNCHD_DIR/$PLIST_NAME"

# Load the job
launchctl load "$LAUNCHD_DIR/$PLIST_NAME" 2>/dev/null || {
    echo -e "${RED}Failed to load launchd job.${NC}"
    echo "You may need to grant permissions."
    exit 1
}

echo -e "${GREEN}✓ Launchd job installed successfully!${NC}"
echo ""
echo "Schedule: Daily at 5:00 AM"
echo "Log file: $SKILL_DIR/data/launchd.log"
echo "Error log: $SKILL_DIR/data/launchd-error.log"
echo ""
echo "Commands:"
echo "  launchctl list | grep calendar-sync    # Check status"
echo "  launchctl unload ~/Library/LaunchAgents/$PLIST_NAME  # Stop"
echo "  launchctl load ~/Library/LaunchAgents/$PLIST_NAME    # Start"
echo ""

# Test run option
read -p "Run sync now to test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running sync..."
    "$SCRIPT_DIR/sync.sh"
fi
