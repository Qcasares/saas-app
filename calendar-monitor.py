#!/usr/bin/env python3
"""
KingKong Calendar Integration
Proactive calendar monitoring and alerts
"""

import subprocess
import json
from datetime import datetime, timedelta

def get_calendar_events():
    """Get upcoming calendar events using accli"""
    try:
        # Get events for next 24 hours
        result = subprocess.run(
            ["accli", "events", "--json", "--start", "now", "--end", "+24h"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            events = json.loads(result.stdout)
            return events.get("events", [])
        return []
    except:
        return []

def check_upcoming_events():
    """Check for events in next 2 hours and alert"""
    events = get_calendar_events()
    
    now = datetime.now()
    alerts = []
    
    for event in events:
        start_time_str = event.get("start", {}).get("dateTime", "")
        if start_time_str:
            start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
            time_until = start_time - now
            
            # Alert if event is within 2 hours
            if timedelta(0) < time_until < timedelta(hours=2):
                summary = event.get("summary", "No title")
                minutes_until = int(time_until.total_seconds() / 60)
                
                alert = f"📅 {summary} in {minutes_until} minutes"
                alerts.append(alert)
    
    return alerts

def suggest_prep_time():
    """Suggest preparation time before meetings"""
    # Placeholder - could integrate with event type
    # E.g., "Board meeting" = 30 min prep, "1:1" = 5 min prep
    pass

def main():
    alerts = check_upcoming_events()
    
    if alerts:
        print("Upcoming events:")
        for alert in alerts:
            print(f"  {alert}")
    else:
        print("No events in next 2 hours")

if __name__ == "__main__":
    main()
