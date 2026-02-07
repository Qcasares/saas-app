# Calendar Sync Skill

Bidirectional synchronization between Apple Calendar and Google Calendar without creating duplicates.

## ✅ Features

- **Bidirectional sync**: Apple → Google AND Google → Apple
- **Duplicate prevention**: UID mapping prevents duplicates
- **Conflict resolution**: Timestamp-based conflict handling
- **Safe operations**: Dry-run mode, confirmation before deletion
- **Daily automation**: Cron job runs at 5 AM
- **Comprehensive logging**: All operations logged

## 📋 Prerequisites

```bash
# Install icalBuddy for Apple Calendar access
brew install ical-buddy

# Ensure gog is configured for Google Calendar
gog auth add quentin.casares@gmail.com --services calendar
```

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   brew install ical-buddy
   ```

2. **Configure the skill:**
   ```bash
   cd skills/calendar-sync
   
   # Edit configuration
   nano config/sync-config.json
   ```

3. **Test in dry-run mode:**
   ```bash
   DRY_RUN=1 ./scripts/sync.sh
   ```

4. **Setup daily sync:**
   ```bash
   ./scripts/setup-cron.sh
   ```

## ⚙️ Configuration

Edit `config/sync-config.json`:

```json
{
  "apple_calendar": "Personal",
  "google_calendar": "primary",
  "sync_deletions": false,
  "conflict_resolution": "newer_wins",
  "dry_run": false,
  "sync_window_days": 90
}
```

| Option | Description |
|--------|-------------|
| `apple_calendar` | Name of Apple calendar to sync |
| `google_calendar` | Google calendar ID (usually "primary") |
| `sync_deletions` | Whether to sync deletions (default: false) |
| `conflict_resolution` | How to handle conflicts: "newer_wins" or "manual" |
| `dry_run` | Preview changes without applying (default: false) |
| `sync_window_days` | Number of days to sync (default: 90) |

## 📝 Usage

### Manual sync
```bash
./scripts/sync.sh
```

### Dry run (preview changes)
```bash
DRY_RUN=1 ./scripts/sync.sh
# or
./scripts/sync.sh --dry-run
```

### Check sync status
```bash
cat data/sync-state.json | jq '.last_sync'
cat data/sync.log | tail -20
```

### Run tests
```bash
./scripts/integration-test.sh
```

## 🔧 How It Works

### 1. Export
- **Apple Calendar**: Uses `icalBuddy` to export events
- **Google Calendar**: Uses `gog` API to fetch events

### 2. Compare
- Matches events by title + start time
- Skips already-synced events (via UID mapping)
- Detects new, modified, and deleted events

### 3. Sync
- Creates missing events in both calendars
- Updates modified events (optional)
- Handles deletions (optional, configurable)

### 4. State Management
- Stores UID mappings in `data/sync-state.json`
- Logs all operations to `data/sync.log`
- Updates last sync timestamp

## 🛡️ Safety Features

1. **Dry-run mode**: Preview all changes before applying
2. **UID mapping**: Prevents duplicate creation
3. **Conflict detection**: Handles simultaneous modifications
4. **Backup**: Original events are never deleted from source
5. **Logging**: Full audit trail of all operations

## 📊 Testing

### Unit tests
```bash
./scripts/integration-test.sh
```

### Manual testing
1. Create a test event in Apple Calendar
2. Run dry-run sync
3. Verify event would be created in Google
4. Run actual sync
5. Verify event appears in Google Calendar
6. Create event in Google Calendar
7. Run sync again
8. Verify event appears in Apple Calendar

## 🔍 Troubleshooting

### "icalBuddy not found"
```bash
brew install ical-buddy
```

### "No Google authentication"
```bash
gog auth add quentin.casares@gmail.com --services calendar
```

### Too many duplicates created
- Check that `sync_window_days` is reasonable (90 is default)
- Verify UID mappings in `data/sync-state.json`
- Run with `DRY_RUN=1` to preview changes

### Events not syncing
- Check `data/sync.log` for errors
- Verify calendar names in config
- Ensure both calendars have events within sync window

## 📅 Cron Schedule

Default: Daily at 5:00 AM

To modify:
```bash
crontab -e
```

Change the line:
```
0 5 * * * /path/to/skills/calendar-sync/scripts/sync.sh
```

To different schedule, e.g., hourly:
```
0 * * * * /path/to/skills/calendar-sync/scripts/sync.sh
```

## 🗂️ File Structure

```
calendar-sync/
├── SKILL.md                    # This documentation
├── config/
│   └── sync-config.json        # User configuration
├── data/
│   ├── sync-state.json         # UID mappings and state
│   └── sync.log               # Operation log
└── scripts/
    ├── sync.sh                # Main sync script
    ├── compare.js             # Event comparison logic
    ├── setup-cron.sh          # Cron job installer
    ├── create-apple-event.scpt # Apple Calendar creation
    └── integration-test.sh    # Test suite
```

## 🔄 Sync Behavior

### Apple → Google
- New Apple events → Created in Google
- Modified Apple events → Updated in Google
- Deleted Apple events → Optionally deleted in Google

### Google → Apple
- New Google events → Created in Apple
- Modified Google events → Updated in Apple
- Deleted Google events → Optionally deleted in Apple

### Conflict Resolution
When an event is modified in both calendars:
- `newer_wins`: Event with later `updated` timestamp wins
- `manual`: Skip and log for manual resolution

## 📈 Performance

- Typical sync time: 10-30 seconds
- Handles 1000+ events efficiently
- Incremental sync (only processes changes)
- Minimal API calls (caches state locally)

## 🐛 Known Limitations

1. **Apple Calendar**: Requires `icalBuddy` (macOS only)
2. **Recurring events**: Syncs individual occurrences, not master events
3. **Attachments**: Not synced between calendars
4. **Attendees**: May be stripped during sync
5. **Colors/Categories**: Not preserved across platforms

## 📝 License

Custom skill for OpenClaw
