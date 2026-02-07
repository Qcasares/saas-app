---
name: calendar-sync
version: 1.0.0
description: "Bidirectional sync between Apple Calendar and Google Calendar. Prevents duplicates, handles conflicts, runs daily via cron."
author: KingKong
keywords: [calendar, sync, apple, google, icloud, gcal, bidirectional]
metadata:
  openclaw:
    emoji: "📅"
    requires:
      bins: [icalbuddy, gog]
---

# Calendar Sync Skill

Bidirectional synchronization between Apple Calendar and Google Calendar.

## Features

- **Bidirectional sync**: Apple → Google AND Google → Apple
- **Duplicate prevention**: UID mapping prevents duplicates
- **Conflict resolution**: Timestamp-based conflict handling
- **Daily automation**: Cron job runs at 5 AM
- **Safe by default**: Dry-run mode, confirmation before deletion

## Prerequisites

```bash
# Install icalBuddy for Apple Calendar access
brew install ical-buddy

# Ensure gog is configured for Google Calendar
gog auth list
```

## Configuration

Edit `config/sync-config.json`:

```json
{
  "apple_calendar": "Personal",
  "google_calendar": "primary",
  "sync_deletions": false,
  "conflict_resolution": "newer_wins",
  "dry_run": false
}
```

## Usage

```bash
# Manual sync
./scripts/sync.sh

# Dry run (preview changes)
DRY_RUN=1 ./scripts/sync.sh

# Check sync status
cat data/sync-state.json | jq '.last_sync'
```

## How It Works

1. **Export** both calendars to temporary files
2. **Compare** events using:
   - UID mapping (previously synced events)
   - Title + start time matching (new events)
3. **Detect changes**:
   - New events (create in other calendar)
   - Modified events (update in other calendar)
   - Deleted events (optional, delete in other calendar)
4. **Apply changes** bidirectionally
5. **Update UID mappings** for future syncs

## Safety

- Always backs up before sync
- Dry-run mode available
- Confirmation required for deletions > 5 events
- Detailed logging to `data/sync.log`
