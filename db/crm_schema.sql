-- Personal CRM Database Schema
-- Stores contacts, interactions, and relationship data

-- Contacts table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  role TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  phone TEXT,
  location TEXT,
  notes TEXT,
  source TEXT, -- gmail, calendar, manual, etc.
  vector_embedding BLOB, -- for semantic search
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email interactions
CREATE TABLE IF NOT EXISTS crm_email_interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  email_subject TEXT,
  email_body_snippet TEXT,
  direction TEXT, -- inbound, outbound
  sent_at DATETIME,
  thread_id TEXT,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Meeting interactions
CREATE TABLE IF NOT EXISTS crm_meeting_interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  meeting_title TEXT,
  meeting_date DATETIME,
  duration_minutes INTEGER,
  calendar_event_id TEXT,
  notes TEXT,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Relationship health scores
CREATE TABLE IF NOT EXISTS crm_health_scores (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE,
  score INTEGER, -- 0-100
  last_interaction_at DATETIME,
  days_since_contact INTEGER,
  interaction_frequency TEXT, -- weekly, monthly, quarterly, yearly, sporadic
  trend TEXT, -- improving, stable, declining
  next_suggested_contact DATETIME,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Follow-up reminders
CREATE TABLE IF NOT EXISTS crm_followups (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATETIME,
  priority TEXT, -- high, medium, low
  status TEXT DEFAULT 'pending', -- pending, snoozed, done, cancelled
  snoozed_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE
);

-- Contact merge history
CREATE TABLE IF NOT EXISTS crm_merge_history (
  id TEXT PRIMARY KEY,
  primary_contact_id TEXT NOT NULL,
  merged_contact_id TEXT NOT NULL,
  merged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fields_merged TEXT -- JSON of what was merged
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON crm_contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON crm_contacts(name);
CREATE INDEX IF NOT EXISTS idx_emails_contact ON crm_email_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_date ON crm_email_interactions(sent_at);
CREATE INDEX IF NOT EXISTS idx_meetings_contact ON crm_meeting_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON crm_meeting_interactions(meeting_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON crm_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due ON crm_followups(due_date);
