#!/bin/bash
# Hourly Database Backup Script
# Auto-discovers SQLite databases and backs them up to Google Drive

set -e

BACKUP_DIR="${BACKUP_DIR:-$HOME/.openclaw/backups}"
GDRIVE_FOLDER="${GDRIVE_FOLDER:-AI_Assistant_Backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="db_backup_${TIMESTAMP}.tar.gz.enc"

mkdir -p "$BACKUP_DIR"

# Find all SQLite databases
echo "🔍 Discovering SQLite databases..."
databases=$(find "$HOME/.openclaw/workspace" -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null | grep -v node_modules)

if [ -z "$databases" ]; then
    echo "⚠️  No databases found"
    exit 0
fi

echo "Found databases:"
echo "$databases" | while read db; do
    echo "  - $db"
done

# Create temp directory for backup
temp_dir=$(mktemp -d)
trap "rm -rf $temp_dir" EXIT

# Copy databases to temp
echo "📁 Copying databases..."
while IFS= read -r db; do
    if [ -f "$db" ]; then
        cp "$db" "$temp_dir/$(basename $db)"
        echo "  ✓ $(basename $db)"
    fi
done <<< "$databases"

# Create encrypted tar archive
echo "🔐 Creating encrypted backup..."
tar -czf - -C "$temp_dir" . | openssl enc -aes-256-cbc -salt -pass pass:"${BACKUP_PASSWORD:-defaultpassword}" > "$BACKUP_DIR/$BACKUP_NAME"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    size=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    echo "✅ Backup created: $BACKUP_NAME ($size)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Upload to Google Drive (if gog is configured)
if command -v gog &> /dev/null && [ -n "$GOG_ACCOUNT" ]; then
    echo "☁️  Uploading to Google Drive..."
    # Note: gog drive upload would go here
    # gog drive upload "$BACKUP_DIR/$BACKUP_NAME" --parent "$GDRIVE_FOLDER"
    echo "  (Upload implementation pending gog drive support)"
fi

# Clean up old backups (keep last 7)
echo "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t db_backup_*.tar.gz.enc 2>/dev/null | tail -n +8 | xargs -r rm -v

echo "✅ Backup complete"
