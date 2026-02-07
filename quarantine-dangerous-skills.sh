#!/bin/bash
# Quarantine dangerous skills immediately
# Use this when security audit detects DANGEROUS skills

set -e

OPENCLAW_DIR="${HOME}/.openclaw"
WORKSPACE_DIR="${OPENCLAW_DIR}/workspace"
SKILLS_DIR="${WORKSPACE_DIR}/skills"
QUARANTINE_DIR="${OPENCLAW_DIR}/quarantine"
AUDIT_DIR="${OPENCLAW_DIR}/audit"

mkdir -p "$QUARANTINE_DIR" "$AUDIT_DIR"
chmod 700 "$QUARANTINE_DIR" "$AUDIT_DIR"

DANGEROUS_SKILLS=(
    "agent-browser-jrdv4mcscrb2"
    "skillboss"
)

echo "═══════════════════════════════════════════════════════════"
echo "  SKILL QUARANTINE UTILITY"
echo "═══════════════════════════════════════════════════════════"
echo

for skill in "${DANGEROUS_SKILLS[@]}"; do
    skill_path="${SKILLS_DIR}/${skill}"
    
    if [ -d "$skill_path" ]; then
        echo "🚨 Quarantining: $skill"
        
        # Create backup with timestamp
        backup_name="${skill}-$(date +%Y%m%d-%H%M%S)"
        quarantine_path="${QUARANTINE_DIR}/${backup_name}"
        
        # Move to quarantine
        mv "$skill_path" "$quarantine_path"
        
        # Log the action
        echo "$(date -Iseconds) QUARANTINED: $skill -> $quarantine_path" >> "${AUDIT_DIR}/quarantine.log"
        
        echo "   ✅ Moved to: $quarantine_path"
        echo
    else
        echo "   ℹ️  Not installed: $skill"
    fi
done

echo "═══════════════════════════════════════════════════════════"
echo "  NEXT STEPS"
echo "═══════════════════════════════════════════════════════════"
echo
echo "Quarantined skills are in: $QUARANTINE_DIR"
echo
echo "To restore a skill (after security review):"
echo "   mv ${QUARANTINE_DIR}/<skill-name>-<timestamp> ${SKILLS_DIR}/<skill-name>"
echo
echo "To permanently delete:"
echo "   rm -rf ${QUARANTINE_DIR}/<skill-name>-<timestamp>"
echo
echo "⚠️  IMPORTANT: Review quarantine.log for details"
echo
