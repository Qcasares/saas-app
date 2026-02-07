#!/bin/bash
# OpenClaw Security Audit Script
# Run this immediately to assess current security posture

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  OpenClaw/ClawdBot Security Audit"
echo "  Generated: $(date)"
echo "═══════════════════════════════════════════════════════════"
echo

OPENCLAW_DIR="${HOME}/.openclaw"
WORKSPACE_DIR="${OPENCLAW_DIR}/workspace"
SKILLS_DIR="${WORKSPACE_DIR}/skills"
SCANNER_DIR="${SKILLS_DIR}/ai-skill-scanner"
AUDIT_DIR="${OPENCLAW_DIR}/audit"
QUARANTINE_DIR="${OPENCLAW_DIR}/quarantine"

# Create directories
mkdir -p "$AUDIT_DIR" "$QUARANTINE_DIR"
chmod 700 "$AUDIT_DIR" "$QUARANTINE_DIR"

REPORT_FILE="${AUDIT_DIR}/security-audit-$(date +%Y%m%d-%H%M%S).txt"
DANGEROUS_SKILLS=()
SUSPICIOUS_SKILLS=()

echo "📊 Scanning all installed skills..."
echo "Report will be saved to: $REPORT_FILE"
echo

# Check if scanner exists
if [ ! -f "${SCANNER_DIR}/scripts/scan.py" ]; then
    echo "❌ ERROR: ai-skill-scanner not found!"
    echo "   Install it with: openclaw skills add ai-skill-scanner"
    exit 1
fi

# Scan each skill
for skill_path in "$SKILLS_DIR"/*; do
    if [ -d "$skill_path" ]; then
        skill_name=$(basename "$skill_path")
        echo -n "  Scanning $skill_name... "
        
        # Run scan
        result=$(python3 "${SCANNER_DIR}/scripts/scan.py" "$skill_path" --json 2>/dev/null) || {
            echo "ERROR"
            continue
        }
        
        score=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['score'])")
        critical=$(echo "$result" | python3 -c "import sys, json; d=json.load(sys.stdin); print(sum(1 for f in d.get('findings',[]) if f['severity']=='CRITICAL'))")
        high=$(echo "$result" | python3 -c "import sys, json; d=json.load(sys.stdin); print(sum(1 for f in d.get('findings',[]) if f['severity']=='HIGH'))")
        
        echo "[$score] (C:$critical H:$high)"
        
        # Save detailed report
        echo "=== $skill_name ===" >> "$REPORT_FILE"
        python3 "${SCANNER_DIR}/scripts/scan.py" "$skill_path" >> "$REPORT_FILE" 2>&1
        echo "" >> "$REPORT_FILE"
        
        # Track risky skills
        case "$score" in
            "DANGEROUS")
                DANGEROUS_SKILLS+=("$skill_name")
                ;;
            "SUSPICIOUS")
                SUSPICIOUS_SKILLS+=("$skill_name")
                ;;
        esac
    fi
done

echo
echo "═══════════════════════════════════════════════════════════"
echo "  AUDIT SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo

if [ ${#DANGEROUS_SKILLS[@]} -gt 0 ]; then
    echo "🚨 DANGEROUS SKILLS DETECTED (${#DANGEROUS_SKILLS[@]}):"
    for skill in "${DANGEROUS_SKILLS[@]}"; do
        echo "   - $skill"
    done
    echo
    echo "   ⚠️  THESE SKILLS SHOULD BE QUARANTINED IMMEDIATELY"
    echo "   Run: ./quarantine-dangerous-skills.sh"
    echo
fi

if [ ${#SUSPICIOUS_SKILLS[@]} -gt 0 ]; then
    echo "⚠️  SUSPICIOUS SKILLS DETECTED (${#SUSPICIOUS_SKILLS[@]}):"
    for skill in "${SUSPICIOUS_SKILLS[@]}"; do
        echo "   - $skill"
    done
    echo
fi

echo "═══════════════════════════════════════════════════════════"
echo "  CREDENTIAL SECURITY CHECK"
echo "═══════════════════════════════════════════════════════════"
echo

# Check for exposed credential files
echo "🔍 Checking for exposed credential files..."
EXPOSED_FILES=()

# Check common credential file locations
check_file() {
    if [ -f "$1" ]; then
        perms=$(stat -f "%Lp" "$1" 2>/dev/null || stat -c "%a" "$1" 2>/dev/null)
        if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
            EXPOSED_FILES+=("$1 (perms: $perms)")
        fi
    fi
}

# Check OpenClaw credential files
check_file "${OPENCLAW_DIR}/openclaw.json"
check_file "${OPENCLAW_DIR}/exec-approvals.json"
check_file "${OPENCLAW_DIR}/credentials/telegram-pairing.json"

# Check for .env files
while IFS= read -r -d '' file; do
    dir=$(dirname "$file")
    if [[ "$dir" == *".openclaw"* ]] || [[ "$dir" == *".clawdbot"* ]]; then
        check_file "$file"
    fi
done < <(find ~ -name ".env*" -type f -print0 2>/dev/null)

if [ ${#EXPOSED_FILES[@]} -gt 0 ]; then
    echo "⚠️  EXPOSED CREDENTIAL FILES:"
    for file in "${EXPOSED_FILES[@]}"; do
        echo "   - $file"
    done
    echo
    echo "   Run: chmod 600 <file> to fix permissions"
else
    echo "✅ No exposed credential files found"
fi

echo
echo "═══════════════════════════════════════════════════════════"
echo "  NETWORK SECURITY CHECK"
echo "═══════════════════════════════════════════════════════════"
echo

# Check /etc/hosts for malicious domain blocks
echo "🔍 Checking for malicious domain blocks..."
MISSING_BLOCKS=()
MALICIOUS_DOMAINS=(
    "webhook.site"
    "requestbin.com"
    "requestbin.net"
    "pipedream.net"
    "ngrok.io"
)

for domain in "${MALICIOUS_DOMAINS[@]}"; do
    if ! grep -q "$domain" /etc/hosts 2>/dev/null; then
        MISSING_BLOCKS+=("$domain")
    fi
done

if [ ${#MISSING_BLOCKS[@]} -gt 0 ]; then
    echo "⚠️  MALICIOUS DOMAINS NOT BLOCKED:"
    for domain in "${MISSING_DOMAINS[@]}"; do
        echo "   - $domain"
    done
    echo
    echo "   Run: ./block-malicious-domains.sh"
else
    echo "✅ Malicious domains are blocked"
fi

echo
echo "═══════════════════════════════════════════════════════════"
echo "  RECOMMENDATIONS"
echo "═══════════════════════════════════════════════════════════"
echo

if [ ${#DANGEROUS_SKILLS[@]} -gt 0 ] || [ ${#SUSPICIOUS_SKILLS[@]} -gt 0 ]; then
    echo "🔴 IMMEDIATE ACTIONS REQUIRED:"
    echo
    if [ ${#DANGEROUS_SKILLS[@]} -gt 0 ]; then
        echo "   1. Quarantine dangerous skills immediately"
        echo "   2. Review what these skills may have accessed"
        echo "   3. Rotate any potentially exposed credentials"
    fi
    if [ ${#SUSPICIOUS_SKILLS[@]} -gt 0 ]; then
        echo "   4. Review suspicious skills before next use"
    fi
    echo
fi

echo "🟡 SHORT-TERM ACTIONS (This Week):"
echo "   - Enable audit logging for all skill executions"
echo "   - Set up regular security scans (weekly)"
echo "   - Document all installed skills and their permissions"
echo "   - Review and tighten file permissions"
echo

echo "🟢 LONG-TERM ACTIONS (This Month):"
echo "   - Implement sandboxed execution environment"
echo "   - Set up code signing verification"
echo "   - Deploy runtime behavior monitoring"
echo

echo "═══════════════════════════════════════════════════════════"
echo "  Detailed report saved to:"
echo "  $REPORT_FILE"
echo "═══════════════════════════════════════════════════════════"
