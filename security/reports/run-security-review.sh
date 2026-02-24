#!/bin/bash
# Nightly Security Review Script - Simplified
# Runs security checks without problematic minified JS scanning

set -e

WORKSPACE="$HOME/.openclaw/workspace"
REPORT_FILE="$WORKSPACE/security/reports/security_review_$(date +%Y%m%d).md"
mkdir -p "$WORKSPACE/security/reports"

echo "🔒 Nightly Security Review - $(date)" > "$REPORT_FILE"
echo "================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

CRITICAL_COUNT=0

# Check 1: .env files in repo
echo "## 1. Environment Files Check" >> "$REPORT_FILE"
ENV_FILES=$(find "$WORKSPACE" -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.next/*" 2>/dev/null || true)
if [ -n "$ENV_FILES" ]; then
    echo "⚠️ HIGH: .env files detected in repository" >> "$REPORT_FILE"
    echo "$ENV_FILES" >> "$REPORT_FILE"
else
    echo "✅ No .env files found in repo" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 2: Hardcoded credentials (limited scope)
echo "## 2. Hardcoded Credentials Check" >> "$REPORT_FILE"
# Only check specific source directories, avoid minified JS
CRED_FILES="$WORKSPACE/scripts $WORKSPACE/skills $WORKSPACE/memory $WORKSPACE/*.md $WORKSPACE/*.sh 2>/dev/null"
CRED_HITS=""
for dir in scripts skills memory; do
    if [ -d "$WORKSPACE/$dir" ]; then
        hits=$(grep -r -E "sk-[a-zA-Z0-9]{20,}|api_key.*=.*['\"][^'\"]+['\"]|secret_key.*=.*['\"][^'\"]+['\"]|password.*=.*['\"][^'\"]+['\"]" "$WORKSPACE/$dir" 2>/dev/null | head -5 || true)
        if [ -n "$hits" ]; then
            CRED_HITS="$CRED_HITS$hits"
        fi
    fi
done

if [ -n "$CRED_HITS" ]; then
    echo "⚠️ CRITICAL: Potential credentials found" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "$CRED_HITS" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
else
    echo "✅ No hardcoded credentials detected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 3: SSH keys
echo "## 3. SSH Keys Check" >> "$REPORT_FILE"
SSH_KEYS=$(find "$WORKSPACE" -name "id_rsa" -o -name "id_ed25519" -o -name "*.pem" 2>/dev/null | grep -v node_modules | grep -v dist | head -5 || true)
if [ -n "$SSH_KEYS" ]; then
    echo "⚠️ HIGH: SSH private keys found in workspace" >> "$REPORT_FILE"
    echo "$SSH_KEYS" >> "$REPORT_FILE"
else
    echo "✅ No SSH keys found in workspace" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 4: File permissions
echo "## 4. File Permissions Check" >> "$REPORT_FILE"
WORLD_WRITABLE=$(find "$WORKSPACE" -type f -perm -002 2>/dev/null | grep -v node_modules | grep -v dist | head -5 || true)
if [ -n "$WORLD_WRITABLE" ]; then
    echo "⚠️ MEDIUM: World-writable files found" >> "$REPORT_FILE"
    echo "$WORLD_WRITABLE" >> "$REPORT_FILE"
else
    echo "✅ No world-writable files found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 5: Sensitive paths in code
echo "## 5. Path Exposure Check" >> "$REPORT_FILE"
PATH_HITS=$(grep -r "Users/quentincasares" "$WORKSPACE/scripts" "$WORKSPACE/skills" 2>/dev/null | head -3 || true)
if [ -n "$PATH_HITS" ]; then
    echo "ℹ️ LOW: Absolute paths in code" >> "$REPORT_FILE"
    echo "$PATH_HITS" >> "$REPORT_FILE"
else
    echo "✅ No exposed paths detected" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 6: Large files
echo "## 6. Large File Check" >> "$REPORT_FILE"
LARGE_FILES=$(find "$WORKSPACE" -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v dist | grep -v .git | head -5 || true)
if [ -n "$LARGE_FILES" ]; then
    echo "⚠️ MEDIUM: Large files detected (>10MB)" >> "$REPORT_FILE"
    ls -lh $LARGE_FILES | awk '{print $9, $5}' >> "$REPORT_FILE"
else
    echo "✅ No unusually large files found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check 7: Suspicious scripts
echo "## 7. Suspicious Scripts Check" >> "$REPORT_FILE"
SUSPICIOUS=$(find "$WORKSPACE" -name "*.sh" -o -name "*.py" 2>/dev/null | xargs grep -l "curl.*http://|wget.*http://|eval\s*(|base64\s*-d|bash\s*-i" 2>/dev/null | head -5 || true)
if [ -n "$SUSPICIOUS" ]; then
    echo "⚠️ HIGH: Potentially suspicious scripts detected" >> "$REPORT_FILE"
    echo "$SUSPICIOUS" >> "$REPORT_FILE"
else
    echo "✅ No suspicious script patterns found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Summary
echo "## Summary" >> "$REPORT_FILE"
echo "- Report generated: $(date)" >> "$REPORT_FILE"
echo "- Critical findings: $CRITICAL_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $CRITICAL_COUNT -gt 0 ]; then
    echo "⚠️ ALERT: $CRITICAL_COUNT critical findings require immediate attention!" >> "$REPORT_FILE"
else
    echo "✅ No critical security issues detected." >> "$REPORT_FILE"
fi

echo "Security review complete: $REPORT_FILE"
cat "$REPORT_FILE"
