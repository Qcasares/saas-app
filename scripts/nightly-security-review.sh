#!/bin/bash
# Nightly Security Review Script
# Runs at 3:30am to analyze codebase for security issues

set -e

WORKSPACE="$HOME/.openclaw/workspace"
REPORT_FILE="$WORKSPACE/security/reports/security_review_$(date +%Y%m%d).md"
ALERT_FILE="$WORKSPACE/security/reports/critical_findings_$(date +%Y%m%d).txt"

mkdir -p "$WORKSPACE/security/reports"

echo "🔒 Nightly Security Review - $(date)" > "$REPORT_FILE"
echo "================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

CRITICAL_COUNT=0

# Function to add finding
add_finding() {
    local severity="$1"
    local category="$2"
    local finding="$3"
    local evidence="$4"
    
    echo "### [$severity] $category" >> "$REPORT_FILE"
    echo "**Finding:** $finding" >> "$REPORT_FILE"
    if [ -n "$evidence" ]; then
        echo "**Evidence:** $evidence" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
    
    if [ "$severity" = "CRITICAL" ]; then
        echo "[$category] $finding" >> "$ALERT_FILE"
        ((CRITICAL_COUNT++))
    fi
}

echo "📋 Running security checks..."

# Check 1: .env files in repo
echo "## 1. Environment Files Check" >> "$REPORT_FILE"
ENV_FILES=$(find "$WORKSPACE" -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null || true)
if [ -n "$ENV_FILES" ]; then
    add_finding "HIGH" "Environment Files" ".env files detected in repository" "$ENV_FILES"
else
    echo "✅ No .env files found in repo" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 2: Hardcoded credentials
echo "## 2. Hardcoded Credentials Check" >> "$REPORT_FILE"
CRED_PATTERNS="sk-[a-zA-Z0-9]|api_key|secret_key|password|token"
CRED_HITS=$(grep -r -E "$CRED_PATTERNS" "$WORKSPACE" --include="*.py" --include="*.js" --include="*.ts" --include="*.sh" 2>/dev/null | grep -v "security/" | grep -v "node_modules" | head -10 || true)
if [ -n "$CRED_HITS" ]; then
    add_finding "CRITICAL" "Hardcoded Credentials" "Potential credentials found in code" "$(echo "$CRED_HITS" | head -3)"
else
    echo "✅ No hardcoded credentials detected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 3: SSH keys
echo "## 3. SSH Keys Check" >> "$REPORT_FILE"
SSH_KEYS=$(find "$WORKSPACE" -name "id_rsa" -o -name "id_ed25519" -o -name "*.pem" 2>/dev/null | grep -v node_modules || true)
if [ -n "$SSH_KEYS" ]; then
    add_finding "HIGH" "SSH Keys" "SSH private keys found in workspace" "$SSH_KEYS"
else
    echo "✅ No SSH keys found in workspace" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 4: File permissions
echo "## 4. File Permissions Check" >> "$REPORT_FILE"
WORLD_WRITABLE=$(find "$WORKSPACE" -type f -perm -002 2>/dev/null | grep -v node_modules | head -5 || true)
if [ -n "$WORLD_WRITABLE" ]; then
    add_finding "MEDIUM" "File Permissions" "World-writable files found" "$WORLD_WRITABLE"
else
    echo "✅ No world-writable files found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 5: Sensitive paths in code
echo "## 5. Path Exposure Check" >> "$REPORT_FILE"
PATH_HITS=$(grep -r "Users/quentincasares" "$WORKSPACE" --include="*.py" --include="*.js" --include="*.md" 2>/dev/null | grep -v "security/reports" | head -5 || true)
if [ -n "$PATH_HITS" ]; then
    add_finding "LOW" "Path Exposure" "Absolute paths in code" "$(echo "$PATH_HITS" | head -2)"
else
    echo "✅ No exposed paths detected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 6: Database size (alert if too large)
echo "## 6. Database Health Check" >> "$REPORT_FILE"
DB_SIZE=$(find "$WORKSPACE" -name "*.db" -o -name "*.sqlite" 2>/dev/null | head -1 | xargs stat -f%z 2>/dev/null || echo "0")
if [ "$DB_SIZE" -gt 100000000 ]; then  # 100MB
    add_finding "MEDIUM" "Database Size" "Large database file detected (${DB_SIZE} bytes)"
else
    echo "✅ Database sizes normal" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Summary
echo "## Summary" >> "$REPORT_FILE"
echo "- Report generated: $(date)" >> "$REPORT_FILE"
echo "- Critical findings: $CRITICAL_COUNT" >> "$REPORT_FILE"

if [ $CRITICAL_COUNT -gt 0 ]; then
    echo "" >> "$REPORT_FILE"
    echo "⚠️  **ALERT: $CRITICAL_COUNT critical findings require immediate attention!**" >> "$REPORT_FILE"
    
    # Send critical alert
    # message action:send message="🚨 Security Review: $CRITICAL_COUNT critical findings detected. Check security reports."
fi

echo "✅ Security review complete: $REPORT_FILE"

# Cleanup old reports (keep 30 days)
find "$WORKSPACE/security/reports" -name "security_review_*.md" -mtime +30 -delete
