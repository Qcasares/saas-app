# Ironclaw Integration for KingKong

## Overview
Ironclaw extends my capabilities with 7 WASM tools:
- **GitHub** - Repositories, issues, PRs
- **Gmail** - Email management
- **Google Calendar** - Events and scheduling
- **Google Drive** - File storage
- **Google Docs** - Document editing
- **Google Sheets** - Spreadsheets
- **Google Slides** - Presentations

## Current Status

### ✅ Working
- Ironclaw v0.11.1 installed and configured
- Database: libSQL (local SQLite)
- LLM: OpenAI (gpt-4o)
- Embeddings: Enabled
- Web UI: https://mm.tailc992d2.ts.net/ (via Tailscale Funnel)
- Time tool: ✅ Tested working

### ⚠️ Needs Setup
- **GitHub tool**: Token configured but tool has auth issues
- **Google tools**: Require OAuth flow (needs browser)

## Usage Patterns

### 1. Direct Delegation (CLI)
```bash
# Using the wrapper script
~/.openclaw/workspace/ironclaw-delegate.sh "What time is it in London?"

# Or directly
ironclaw -m "Your question here"
```

### 2. From KingKong
I can spawn Ironclaw as a sub-agent:
```bash
sessions_spawn -a ironclaw "Check my calendar for tomorrow"
```

### 3. Web UI
Access directly at: https://mm.tailc992d2.ts.net/

## Authentication Setup

### GitHub (Current Issue)
Token is set in `~/.ironclaw/.env` but tool fails. May need:
- Classic PAT instead of fine-grained
- Different secret name format
- Tool update

### Google (OAuth Required)
1. Visit https://mm.tailc992d2.ts.net/
2. Ask Ironclaw: "Authenticate with Google"
3. Approve the tool_auth request
4. Open the OAuth URL in browser
5. Complete Google authentication

## Integration Benefits

| Task | Without Ironclaw | With Ironclaw |
|------|-----------------|---------------|
| GitHub queries | Limited (MCP only) | Full API access |
| Calendar checks | accli (macOS only) | Cross-platform |
| Gmail | Not available | Read/send emails |
| Google Drive | Not available | Full Drive access |
| Memory search | vestige/memory_search | Additional semantic layer |

## Next Steps

1. **Fix GitHub auth**: Try classic PAT or debug WASM tool
2. **Complete Google OAuth**: Use Web UI to authenticate
3. **Create automation**: Cron jobs using Ironclaw tools
4. **Parallel delegation**: Spawn multiple Ironclaw instances

## Wrapper Script Usage

```bash
# Make executable
chmod +x ~/.openclaw/workspace/ironclaw-delegate.sh

# Delegate tasks
./ironclaw-delegate.sh "List my unread emails"
./ironclaw-delegate.sh "Create a calendar event tomorrow at 2pm"
./ironclaw-delegate.sh "Find files in Drive about 'project X'"
```
