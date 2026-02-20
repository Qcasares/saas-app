#!/bin/bash
# Check Google Workspace integration status

echo "🔍 Checking Google Workspace Integration Status"
echo "================================================"
echo ""

# Check gog installation
if command -v gog &> /dev/null; then
    echo "✅ gog CLI installed: $(gog --version 2>&1 || echo 'version unknown')"
else
    echo "❌ gog CLI not installed"
    echo "   Install: brew install steipete/tap/gogcli"
    exit 1
fi
echo ""

# Check OAuth credentials
if [ -f ~/.config/gog/client_secret.json ]; then
    echo "✅ OAuth credentials file exists"
else
    echo "❌ OAuth credentials missing"
    echo "   Download from Google Cloud Console and place at ~/.config/gog/client_secret.json"
fi
echo ""

# Check configured accounts
echo "📋 Configured accounts:"
gog auth list 2>&1 || echo "   No accounts configured"
echo ""

# Check environment
if [ -n "$GOG_ACCOUNT" ]; then
    echo "✅ GOG_ACCOUNT set: $GOG_ACCOUNT"
else
    echo "⚠️  GOG_ACCOUNT not set"
    echo "   Add to ~/.zshrc: export GOG_ACCOUNT=qcasares@gmail.com"
fi
echo ""

# Test connectivity (if configured)
if gog auth list 2>&1 | grep -q "@"; then
    echo "🧪 Testing API access..."
    
    # Test Gmail
    if gog gmail search 'newer_than:1d' --max 1 --json &>/dev/null; then
        echo "✅ Gmail API: Working"
    else
        echo "❌ Gmail API: Failed (may need token refresh)"
    fi
    
    # Test Calendar
    if gog calendar events primary --max 1 --json &>/dev/null; then
        echo "✅ Calendar API: Working"
    else
        echo "❌ Calendar API: Failed (may need token refresh)"
    fi
else
    echo "⚠️  No accounts configured - cannot test API access"
fi
echo ""

# Check CRM database
if [ -f ~/.openclaw/workspace/db/personal_crm.db ]; then
    echo "✅ CRM database exists"
    
    # Count contacts
    CONTACTS=$(sqlite3 ~/.openclaw/workspace/db/personal_crm.db "SELECT COUNT(*) FROM crm_contacts;" 2>/dev/null || echo "0")
    echo "   Contacts: $CONTACTS"
    
    EMAILS=$(sqlite3 ~/.openclaw/workspace/db/personal_crm.db "SELECT COUNT(*) FROM crm_email_interactions;" 2>/dev/null || echo "0")
    echo "   Email interactions: $EMAILS"
    
    MEETINGS=$(sqlite3 ~/.openclaw/workspace/db/personal_crm.db "SELECT COUNT(*) FROM crm_meeting_interactions;" 2>/dev/null || echo "0")
    echo "   Meeting interactions: $MEETINGS"
else
    echo "⚠️  CRM database not initialized"
    echo "   Run: sqlite3 ~/.openclaw/workspace/db/personal_crm.db < ~/.openclaw/workspace/db/crm_schema.sql"
fi
