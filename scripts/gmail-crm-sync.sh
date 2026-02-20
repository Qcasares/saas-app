#!/bin/bash
# Gmail Integration for Personal CRM
# Scans Gmail for contacts and interactions

set -e

ACCOUNT="${GOG_ACCOUNT:-qcasares@gmail.com}"
DB="${CRM_DB:-$HOME/.openclaw/workspace/db/personal_crm.db}"
DAYS_BACK="${1:-365}"

echo "📧 Scanning Gmail for CRM contacts (last $DAYS_BACK days)..."

# Search for emails from last year
SEARCH_QUERY="newer_than:${DAYS_BACK}d -from:me -label:spam -label:trash"

# Get emails using gog
gog gmail search "$SEARCH_QUERY" --max 1000 --json --account "$ACCOUNT" 2>/dev/null | \
python3 << 'PYSCRIPT'
import json
import sys
import sqlite3
import re
from datetime import datetime

db_path = sys.argv[1] if len(sys.argv) > 1 else "~/.openclaw/workspace/db/personal_crm.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

data = json.load(sys.stdin)

# Noise senders to filter out
NOISE_PATTERNS = [
    r'noreply@', r'no-reply@', r'donotreply@',
    r'newsletter@', r'marketing@', r'sales@',
    r'notifications@', r'updates@', r'info@',
    r'@mailchimp', r'@sendgrid', r'@hubspot',
    r'@linkedin.com', r'@github.com', r'@google.com'
]

def is_noise(email):
    email_lower = email.lower()
    return any(re.search(pattern, email_lower) for pattern in NOISE_PATTERNS)

def extract_name(from_field):
    # Parse "Name <email@example.com>"
    match = re.match(r'"?([^"<]+)"?\s*<([^>]+)\u003e', from_field)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    # Just email
    return None, from_field.strip()

processed = 0
for thread in data.get('threads', []):
    for msg in thread.get('messages', []):
        from_field = msg.get('from', '')
        
        name, email = extract_name(from_field)
        
        # Skip noise
        if is_noise(email):
            continue
        
        # Skip if already exists
        cursor.execute("SELECT id FROM crm_contacts WHERE email = ?", (email,))
        if cursor.fetchone():
            # Update interaction
            cursor.execute('''
                INSERT INTO crm_email_interactions 
                (id, contact_id, email_subject, email_body_snippet, direction, sent_at)
                SELECT 
                    lower(hex(randomblob(16))),
                    id,
                    ?,
                    ?,
                    'inbound',
                    ?
                FROM crm_contacts WHERE email = ?
            ''', (msg.get('subject', ''), msg.get('snippet', ''), 
                  msg.get('date', datetime.now().isoformat()), email))
        else:
            # New contact
            contact_id = hex(hash(email))[2:]
            
            cursor.execute('''
                INSERT OR IGNORE INTO crm_contacts 
                (id, email, name, source, created_at)
                VALUES (?, ?, ?, 'gmail', ?)
            ''', (contact_id, email, name or email.split('@')[0], datetime.now().isoformat()))
            
            # Add interaction
            cursor.execute('''
                INSERT INTO crm_email_interactions 
                (id, contact_id, email_subject, email_body_snippet, direction, sent_at)
                VALUES (?, ?, ?, ?, 'inbound', ?)
            ''', (hex(hash(msg.get('id', '')))[2:], contact_id, 
                  msg.get('subject', ''), msg.get('snippet', ''),
                  msg.get('date', datetime.now().isoformat())))
        
        processed += 1

conn.commit()
conn.close()
print(f"Processed {processed} emails")
PYSCRIPT
"$DB"

echo "✅ Gmail scan complete"
