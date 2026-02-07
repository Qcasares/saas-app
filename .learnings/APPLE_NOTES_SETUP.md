# Apple Notes Configuration

## Status
- **Skill Installed**: ✅ Yes
- **CLI Tool**: `memo` (via Homebrew)
- **Location**: `/opt/homebrew/bin/memo`
- **macOS**: ✅ Compatible
- **Permissions**: ⚠️ Needs Automation access

## Required Permissions

To use Apple Notes, you need to grant Automation permissions:

1. **Open System Settings**
2. Go to **Privacy & Security** → **Automation**
3. Find **Terminal** (or your terminal app like iTerm)
4. Enable **Notes** under Terminal

Or if prompted with a dialog when first running, click **"Allow"**.

## Available Commands

```bash
# List all notes
memo notes

# List notes in a specific folder
memo notes -f "Folder Name"

# Search notes (fuzzy)
memo notes -s "query"

# List all folders
memo notes -fl

# Add a new note (interactive)
memo notes -a

# Add with title
memo notes -a "Note Title"

# Edit a note (interactive)
memo notes -e

# Delete a note (interactive)
memo notes -d

# Move note to folder (interactive)
memo notes -m

# Export notes to Desktop
memo notes -ex
```

## Limitations

- Cannot edit notes containing images or attachments
- Interactive prompts require terminal access
- macOS only

## Integration with OpenClaw

I can now:
- Read your Apple Notes
- Create new notes
- Search existing notes
- Export notes to Markdown/HTML
- Move notes between folders

## Example Usage

```bash
# Create a note from OpenClaw
memo notes -a "Meeting Notes" <<EOF
## Project Discussion
- Reviewed Q1 goals
- Discussed timeline
- Action items assigned
EOF

# Search for a note
memo notes -s "project timeline"
```

## Troubleshooting

**"Operation not permitted" or hanging:**
→ Grant Automation permissions in System Settings

**Notes not appearing:**
→ Ensure you're signed into iCloud and Notes is synced

**Cannot edit note:**
→ Note may contain images/attachments (not supported by memo)
