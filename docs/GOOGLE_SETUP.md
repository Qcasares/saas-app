# Google Workspace Integration Setup

## Prerequisites

You need OAuth 2.0 credentials from Google Cloud Console.

## Setup Steps

### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google People API (for contacts)
   - Google Sheets API
   - Google Docs API

### 2. Create OAuth Credentials

1. Go to "Credentials" in left sidebar
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app"
4. Name: "OpenClaw Personal Assistant"
5. Download the JSON file (will be named something like `client_secret_xxx.json`)

### 3. Configure gog

```bash
# Place the downloaded file
cp ~/Downloads/client_secret_*.json ~/.config/gog/client_secret.json

# Configure gog
gog auth credentials ~/.config/gog/client_secret.json

# Add your account
gog auth add qcasares@gmail.com --services gmail,calendar,drive,contacts,sheets,docs

# Follow the browser OAuth flow

# Set default account
export GOG_ACCOUNT=qcasares@gmail.com
```

### 4. Test Integration

```bash
# Test Gmail
gog gmail search 'newer_than:7d' --max 5

# Test Calendar
gog calendar events primary --from 2024-01-01T00:00:00Z --max 5

# Test Drive
gog drive search "test" --max 5
```

## CRM Sync

Once configured, run CRM sync:

```bash
# Sync Gmail contacts (last 365 days)
~/.openclaw/workspace/scripts/gmail-crm-sync.sh 365

# Sync Calendar contacts (last 365 days)
~/.openclaw/workspace/scripts/calendar-crm-sync.sh 365
```

## Automation

Add to crontab for daily sync:

```bash
# Daily at 2am: Sync Gmail and Calendar to CRM
0 2 * * * /Users/quentincasares/.openclaw/workspace/scripts/gmail-crm-sync.sh 1 >> /tmp/crm-sync.log 2>&1
0 2 * * * /Users/quentincasares/.openclaw/workspace/scripts/calendar-crm-sync.sh 1 >> /tmp/crm-sync.log 2>&1
```

## Troubleshooting

- **Token expired**: Run `gog auth refresh qcasares@gmail.com`
- **Permission denied**: Re-run `gog auth add` and ensure all services are selected
- **Rate limits**: Google has quotas; syncs are designed to be incremental
