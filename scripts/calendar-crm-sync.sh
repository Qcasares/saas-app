#!/bin/bash
# Google Calendar Integration for Personal CRM
# Extracts meeting participants and creates interaction records

set -e

ACCOUNT="${GOG_ACCOUNT:-qcasares@gmail.com}"
DB="${CRM_DB:-$HOME/.openclaw/workspace/db/personal_crm.db}"
DAYS_BACK="${1:-365}"

echo "📅 Scanning Calendar for CRM contacts (last $DAYS_BACK days)..."

# Calculate date range
FROM_DATE=$(date -v-${DAYS_BACK}d +%Y-%m-%dT00:00:00Z 2>/dev/null || date -d "${DAYS_BACK} days ago" +%Y-%m-%dT00:00:00Z)
TO_DATE=$(date +%Y-%m-%dT23:59:59Z)

# Get calendar events
gog calendar events primary --from "$FROM_DATE" --to "$TO_DATE" --json --account "$ACCOUNT" 2>/dev/null | \
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

def extract_email(attendee_str):
    match = re.search(r'[<\s]([^\s<>]+@[^\s<>]+)[>\s]', attendee_str)
    return match.group(1) if match else None

def extract_name(attendee_str):
    # Try to get name before email
    match = re.match(r'([^<<]+)', attendee_str)
    if match:
        return match.group(1).strip()
    return None

events_processed = 0
attendees_found = 0

for event in data.get('events', []):
    event_id = event.get('id', '')
    summary = event.get('summary', 'Meeting')
    start_time = event.get('start', {}).get('dateTime', '')
    end_time = event.get('end', {}).get('dateTime', '')
    
    # Calculate duration
    duration = 30  # default
    if start_time and end_time:
        try:
            start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            duration = int((end - start).total_seconds() / 60)
        except:
            pass
    
    # Process attendees
    for attendee in event.get('attendees', []):
        email = attendee.get('email', '')
        if not email or email.endswith('@resource.calendar.google.com'):
            continue
        
        name = attendee.get('displayName', '') or email.split('@')[0]
        
        # Skip if it's your own email
        if 'casares' in email.lower():
            continue
        
        attendees_found += 1
        
        # Check if contact exists
        cursor.execute("SELECT id FROM crm_contacts WHERE email = ?", (email,))
        result = cursor.fetchone()
        
        if result:
            contact_id = result[0]
        else:
            # Create new contact
            contact_id = hex(hash(email))[2:]
            cursor.execute('''
                INSERT OR IGNORE INTO crm_contacts 
                (id, email, name, source, created_at)
                VALUES (?, ?, ?, 'calendar', ?)
            ''', (contact_id, email, name, datetime.now().isoformat()))
        
        # Add meeting interaction
        cursor.execute('''
            INSERT OR IGNORE INTO crm_meeting_interactions 
            (id, contact_id, meeting_title, meeting_date, duration_minutes, calendar_event_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (hex(hash(event_id + email))[2:], contact_id, summary, 
              start_time or datetime.now().isoformat(), duration, event_id))
    
    events_processed += 1

conn.commit()
conn.close()
print(f"Processed {events_processed} events, found {attendees_found} attendees")
PYSCRIPT
"$DB"

echo "✅ Calendar scan complete"
