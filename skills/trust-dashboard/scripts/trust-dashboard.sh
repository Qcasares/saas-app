#!/bin/bash
# Trust Dashboard - Skill Security & Trust Monitor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
DATA_FILE="$SKILL_DIR/data/trust-state.json"
REPORT_FILE="$SKILL_DIR/data/latest-report.md"

# Trust tier lookup via helper function
get_trust_tier() {
    case "$1" in
        "accli"|"agent-security-audit"|"ai-skill-scanner"|"apple-notes"|"calendar-sync"|"calendar-notion-sync"|"data-analyst"|"elevenlabs-stt"|"firecrawl-skills"|"git-essentials"|"github"|"gog"|"moltbook-interact"|"pdf"|"proactive-messages"|"self-improving-agent"|"vestige")
            echo "TRUSTED"
            ;;
        "auto-updater"|"skillboss"|"image-cog"|"ai-explain"|"humanize"|"tweet-writer"|"senior-architect"|"second-brain"|"elite-longterm-memory"|"prompt-engineering-expert"|"sql-toolkit")
            echo "VERIFIED"
            ;;
        "agent-browser-stagehand"|"blogburst")
            echo "AUDITED"
            ;;
        *)
            echo "UNVERIFIED"
            ;;
    esac
}

# Security audit patterns
check_security_patterns() {
    local skill_path="$1"
    local issues=""
    
    if grep -r "curl.*webhook" "$skill_path" 2>/dev/null | grep -v "# " >/dev/null 2>&1; then
        issues="${issues}Potential webhook exfiltration,"
    fi
    
    if grep -r "\\.env" "$skill_path" 2>/dev/null | grep -E "(cat|read|open)" >/dev/null 2>&1; then
        issues="${issues}Accesses .env files,"
    fi
    
    if grep -r "password|secret|token|api_key" "$skill_path" 2>/dev/null | grep -v "example|placeholder|config" >/dev/null 2>&1; then
        issues="${issues}References credentials,"
    fi
    
    if grep -r "eval|exec|system(" "$skill_path" --include="*.py" --include="*.js" 2>/dev/null | grep -v "# " >/dev/null 2>&1; then
        issues="${issues}Uses dynamic code execution,"
    fi
    
    if grep -r "requestbin|glot.io|ngrok" "$skill_path" 2>/dev/null >/dev/null 2>&1; then
        issues="${issues}Uses known suspicious domains,"
    fi
    
    if [ -z "$issues" ]; then
        echo "CLEAN"
    else
        echo "$issues" | sed 's/,$//'
    fi
}

# Calculate risk score
calculate_risk_score() {
    local tier="$1"
    local security_status="$2"
    
    local score=0
    
    case "$tier" in
        "TRUSTED") score=10 ;;
        "VERIFIED") score=25 ;;
        "AUDITED") score=40 ;;
        "UNVERIFIED") score=70 ;;
        "SUSPICIOUS") score=90 ;;
    esac
    
    if [ "$security_status" != "CLEAN" ]; then
        score=$((score + 30))
    fi
    
    echo "$score"
}

# Generate report
generate_report() {
    echo "# 🔒 Trust Dashboard Report"
    echo ""
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    local total_skills=0
    local trusted_count=0
    local verified_count=0
    local audited_count=0
    local unverified_count=0
    local total_risk=0
    local issues_found=0
    
    echo "## Skill Status"
    echo ""
    
    # Process each skill
    for skill_path in ~/.openclaw/workspace/skills/*; do
        [ -d "$skill_path" ] || continue
        
        skill_name=$(basename "$skill_path")
        total_skills=$((total_skills + 1))
        
        tier=$(get_trust_tier "$skill_name")
        
        case "$tier" in
            "TRUSTED") trusted_count=$((trusted_count + 1)) ;;
            "VERIFIED") verified_count=$((verified_count + 1)) ;;
            "AUDITED") audited_count=$((audited_count + 1)) ;;
            *) unverified_count=$((unverified_count + 1)) ;;
        esac
        
        # Check security patterns
        security_status=$(check_security_patterns "$skill_path" "$skill_name")
        
        # Calculate risk
        risk_score=$(calculate_risk_score "$tier" "$security_status")
        total_risk=$((total_risk + risk_score))
        
        if [ "$security_status" != "CLEAN" ]; then
            issues_found=$((issues_found + 1))
        fi
        
        # Output skill status
        tier_emoji=""
        case "$tier" in
            "TRUSTED") tier_emoji="🟢" ;;
            "VERIFIED") tier_emoji="🔵" ;;
            "AUDITED") tier_emoji="🟡" ;;
            *) tier_emoji="⚪" ;;
        esac
        
        echo "### $tier_emoji [$tier] $skill_name"
        if [ "$security_status" != "CLEAN" ]; then
            echo ""
            echo "⚠️ **Security Notes:**"
            echo "$security_status" | tr ',' '\n' | sed 's/^/- /'
        fi
        echo ""
        echo "Risk Score: $risk_score/100"
        echo ""
    done
    
    # Summary
    local avg_risk=0
    if [ $total_skills -gt 0 ]; then
        avg_risk=$((total_risk / total_skills))
    fi
    
    echo "---"
    echo ""
    echo "## 📊 Summary"
    echo ""
    echo "| Metric | Value |"
    echo "|--------|-------|"
    echo "| Total Skills | $total_skills |"
    echo "| 🟢 Trusted | $trusted_count |"
    echo "| 🔵 Verified | $verified_count |"
    echo "| 🟡 Audited | $audited_count |"
    echo "| ⚪ Unverified | $unverified_count |"
    echo "| ⚠️ With Issues | $issues_found |"
    echo "| Avg Risk Score | $avg_risk/100 |"
    echo ""
    
    # Risk assessment
    echo "## Overall Assessment"
    echo ""
    if [ $avg_risk -lt 20 ]; then
        echo "✅ **LOW RISK** - Your skill ecosystem is secure"
    elif [ $avg_risk -lt 40 ]; then
        echo "🟡 **MODERATE RISK** - Generally secure, monitor unverified skills"
    elif [ $avg_risk -lt 60 ]; then
        echo "🟠 **ELEVATED RISK** - Review unverified skills"
    else
        echo "🔴 **HIGH RISK** - Immediate audit recommended"
    fi
    echo ""
    
    # Save JSON data
    cat > "$DATA_FILE" <<EOF
{
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_skills": $total_skills,
  "trust_distribution": {
    "trusted": $trusted_count,
    "verified": $verified_count,
    "audited": $audited_count,
    "unverified": $unverified_count
  },
  "security_issues": $issues_found,
  "average_risk_score": $avg_risk,
  "assessment": "$(if [ $avg_risk -lt 20 ]; then echo "LOW"; elif [ $avg_risk -lt 40 ]; then echo "MODERATE"; elif [ $avg_risk -lt 60 ]; then echo "ELEVATED"; else echo "HIGH"; fi)"
}
EOF
}

# Show compact status
show_status() {
    if [ ! -f "$DATA_FILE" ]; then
        echo "No trust data yet. Run: trust-dashboard report"
        return 1
    fi
    
    cat "$DATA_FILE" | jq -r '[.assessment, .total_skills, .trust_distribution.trusted, .security_issues] | @tsv' | \
    awk '{print "🔒 " $1 " RISK | " $2 " skills | " $3 " trusted | " $4 " issues"}'
}

# Run security audit
run_audit() {
    echo "🔍 Running security audit..."
    echo ""
    
    for skill_path in ~/.openclaw/workspace/skills/*; do
        [ -d "$skill_path" ] || continue
        skill_name=$(basename "$skill_path")
        tier=$(get_trust_tier "$skill_name")
        
        echo "[$tier] $skill_name"
        
        security_status=$(check_security_patterns "$skill_path" "$skill_name")
        if [ "$security_status" != "CLEAN" ]; then
            echo "  ⚠️  Security concerns:"
            echo "$security_status" | tr ',' '\n' | sed 's/^/     - /'
        else
            echo "  ✅ Clean"
        fi
    done
}

# Main command handler
case "${1:-status}" in
    "report"|"full")
        generate_report > "$REPORT_FILE"
        cat "$REPORT_FILE"
        echo ""
        echo "📄 Full report saved to: $REPORT_FILE"
        ;;
    "status")
        show_status 2>/dev/null || {
            echo "Generating initial report..."
            generate_report > "$REPORT_FILE" 2>/dev/null
            cat "$DATA_FILE" | jq -r '"🔒 " + .assessment + " RISK | " + (.total_skills|tostring) + " skills | " + (.trust_distribution.trusted|tostring) + " trusted"'
        }
        ;;
    "audit")
        run_audit
        ;;
    *)
        echo "Trust Dashboard - Skill Security Monitor"
        echo ""
        echo "Usage: trust-dashboard [command]"
        echo ""
        echo "Commands:"
        echo "  status      Show quick status"
        echo "  report      Generate full markdown report"
        echo "  audit       Run security audit"
        echo ""
        echo "Trust Tiers:"
        echo "  🟢 TRUSTED    - Core skills, personally audited"
        echo "  🔵 VERIFIED   - Community reviewed, clean"
        echo "  🟡 AUDITED    - Reviewed, minor concerns"
        echo "  ⚪ UNVERIFIED - Not yet reviewed"
        ;;
esac
