# Calendar → Notion Sync

Daily sync from Google Calendar to Notion database.

## Prerequisites

1. **gog CLI** (Google Calendar access)
   ```bash
   brew install steipete/tap/gogcli
   gog auth add your@gmail.com --services calendar
   ```

2. **notion-cli** (Notion API access)
   ```bash
   npm install -g @iansinnott/notion-cli
   notion auth
   ```

3. **Notion Database** with these properties:
   - `title` (Title)
   - `Date` (Date with time)
   - `Description` (Rich text) — optional
   - `Location` (Rich text) — optional

## Configuration

Edit `config/sync-config.json`:

```json
{
  "google_calendar": "primary",
  "notion_database": "YOUR_DATABASE_ID",
  "sync_days_ahead": 1,
  "dry_run": false
}
```

**Getting your Notion Database ID:**
1. Open your database in Notion
2. Copy the URL: `https://notion.so/workspace/...?v=...`
3. Database ID is the part after the last `/` and before `?v=`

## Usage

```bash
# Manual sync
./scripts/sync.sh

# Dry run (preview only)
DRY_RUN=1 ./scripts/sync.sh

# Check sync status
cat data/sync-state.json
```

## Automation

Runs daily at 8:00 AM via cron job.

## How It Works

1. Fetches today's events from Google Calendar
2. Checks if each event already exists in Notion (by title + date)
3. Creates new Notion pages for missing events
4. Logs sync state to `data/sync-state.json`
