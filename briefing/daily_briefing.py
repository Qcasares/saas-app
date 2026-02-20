#!/usr/bin/env python3
"""
Daily Briefing Generator
7am consolidated digest of calendar, CRM, tasks, emails, content performance
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List

DB_CRM = "~/.openclaw/workspace/db/personal_crm.db"
DB_KB = "~/.openclaw/workspace/db/knowledge_base.db"

class DailyBriefing:
    def __init__(self):
        self.today = datetime.now().date()
        self.briefing_parts = []
    
    def generate(self) -> str:
        """Generate complete daily briefing"""
        self.briefing_parts = []
        
        self.briefing_parts.append(f"# Daily Briefing - {self.today.strftime('%A, %B %d')}")
        self.briefing_parts.append("")
        
        # 1. Today's Calendar
        calendar_section = self._get_calendar_section()
        if calendar_section:
            self.briefing_parts.append(calendar_section)
        
        # 2. CRM Context for Meetings
        crm_section = self._get_crm_section()
        if crm_section:
            self.briefing_parts.append(crm_section)
        
        # 3. Pending Action Items
        actions_section = self._get_actions_section()
        if actions_section:
            self.briefing_parts.append(actions_section)
        
        # 4. Content Performance (Yesterday)
        content_section = self._get_content_section()
        if content_section:
            self.briefing_parts.append(content_section)
        
        # 5. Follow-up Reminders
        followups_section = self._get_followups_section()
        if followups_section:
            self.briefing_parts.append(followups_section)
        
        return "\n".join(self.briefing_parts)
    
    def _get_calendar_section(self) -> str:
        """Get today's calendar events"""
        # TODO: Integrate with gog calendar
        return """## 📅 Today's Calendar

*Calendar integration pending Google OAuth setup*

- 10:00 AM - Team Standup
- 2:00 PM - Client Meeting (Greg from NVIDIA)
  - Last met: 3 weeks ago
  - Context: Discussing data strategy
- 4:30 PM - 1:1 with Melissa
"""
    
    def _get_crm_section(self) -> str:
        """Get CRM context for today's meeting attendees"""
        try:
            conn = sqlite3.connect(DB_CRM.replace('~', '/Users/quentincasares'))
            cursor = conn.cursor()
            
            # Get contacts with health scores
            cursor.execute('''
                SELECT c.name, c.company, c.role, h.score, h.days_since_contact
                FROM crm_contacts c
                JOIN crm_health_scores h ON c.id = h.contact_id
                WHERE h.days_since_contact > 30
                ORDER BY h.days_since_contact DESC
                LIMIT 5
            ''')
            
            stale_contacts = cursor.fetchall()
            conn.close()
            
            if not stale_contacts:
                return ""
            
            lines = ["## 👥 CRM Insights"]
            lines.append("")
            lines.append("**Stale relationships (need follow-up):**")
            
            for name, company, role, score, days in stale_contacts:
                lines.append(f"- {name} ({company}) - {days} days since contact [Health: {score}/100]")
            
            lines.append("")
            return "\n".join(lines)
            
        except Exception as e:
            return f"## 👥 CRM Insights\n\n*Error loading CRM: {e}*\n"
    
    def _get_actions_section(self) -> str:
        """Get pending action items"""
        try:
            conn = sqlite3.connect(DB_CRM.replace('~', '/Users/quentincasares'))
            cursor = conn.cursor()
            
            # Get pending follow-ups
            cursor.execute('''
                SELECT f.title, f.due_date, c.name, f.priority
                FROM crm_followups f
                JOIN crm_contacts c ON f.contact_id = c.id
                WHERE f.status = 'pending'
                AND date(f.due_date) <= date('now', '+7 days')
                ORDER BY f.due_date
                LIMIT 10
            ''')
            
            actions = cursor.fetchall()
            conn.close()
            
            if not actions:
                return "## ✅ Action Items\n\nNo pending actions.\n"
            
            lines = ["## ✅ Action Items"]
            lines.append("")
            
            overdue = []
            upcoming = []
            
            for title, due_date, contact, priority in actions:
                item = f"- [{priority.upper()}] {title} ({contact}) - Due: {due_date}"
                if due_date and datetime.fromisoformat(due_date.replace('Z', '+00:00')).date() < self.today:
                    overdue.append(item)
                else:
                    upcoming.append(item)
            
            if overdue:
                lines.append("**Overdue:**")
                lines.extend(overdue)
                lines.append("")
            
            if upcoming:
                lines.append("**Upcoming:**")
                lines.extend(upcoming)
            
            lines.append("")
            return "\n".join(lines)
            
        except Exception as e:
            return f"## ✅ Action Items\n\n*Error loading actions: {e}*\n"
    
    def _get_content_section(self) -> str:
        """Get yesterday's content performance"""
        # TODO: Integrate with social media tracking
        return """## 📊 Yesterday's Content Performance

*Social media tracking pending implementation*

- YouTube: Views pending
- X/Twitter: Impressions pending
- LinkedIn: Engagement pending
"""
    
    def _get_followups_section(self) -> str:
        """Get follow-up suggestions"""
        return """## 🔔 Follow-up Suggestions

- Reach out to Greg (NVIDIA) - Meeting today at 2pm
- Follow up with Alpha Bank team - Project milestone pending
- Check in with Volante Global contact - 45 days since last contact
"""

if __name__ == "__main__":
    briefing = DailyBriefing()
    print(briefing.generate())
