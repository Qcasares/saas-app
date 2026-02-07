#!/bin/bash
# Pre-install security scanner for ClawHub skills
# Usage: ./skill-preinstall-check.sh <skill-name-or-path>
# Returns: 0 = clean, 1 = suspicious, 2 = error

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Suspicious patterns to flag (high-confidence malicious indicators)
SUSPICIOUS_PATTERNS=(
    # External download commands (not in documentation)
    'curl.*-O.*http'
    'curl.*-o.*http'
    'wget.*-O'
    # Suspicious domains
    'glot\.io'
    'webhook\.site'
    'requestbin'
    'ngrok-free\.app'
    'pastebin\.com'
    # Credential exfiltration patterns
    'curl.*webhook'
    'wget.*webhook'
    'fetch.*webhook'
    # Prerequisite social engineering
    'copy.*paste.*terminal'
    'paste.*into.*terminal'
    'run.*script.*terminal'
    # Active obfuscation (not detection patterns)
    'eval.*atob'
    'eval.*base64'
)

# Known malicious skill names (from threat intel)
KNOWN_MALICIOUS=(
    'solana-wallet-tracker'
    'youtube-summarize-pro'
    'openclaw-agent'
)

SKILL_INPUT="${1:-}"
if [[ -z "$SKILL_INPUT" ]]; then
    echo "Usage: $0 <skill-name-or-path>"
    echo "Example: $0 skillboss"
    exit 2
fi

# Determine skill path
if [[ -d "$SKILL_INPUT" ]]; then
    SKILL_PATH="$SKILL_INPUT"
    SKILL_NAME=$(basename "$SKILL_PATH")
elif [[ -d "skills/$SKILL_INPUT" ]]; then
    SKILL_PATH="skills/$SKILL_INPUT"
    SKILL_NAME="$SKILL_INPUT"
else
    # Try to find via clawhub
    SKILL_PATH=$(clawhub path "$SKILL_INPUT" 2>/dev/null || echo "")
    if [[ -z "$SKILL_PATH" ]]; then
        echo -e "${RED}✗ Skill not found: $SKILL_INPUT${NC}"
        exit 2
    fi
    SKILL_NAME="$SKILL_INPUT"
fi

echo "🔍 Scanning skill: $SKILL_NAME"
echo "📁 Path: $SKILL_PATH"
echo ""

# Check against known malicious names
for malicious in "${KNOWN_MALICIOUS[@]}"; do
    if [[ "$SKILL_NAME" == "$malicious" ]]; then
        echo -e "${RED}🚨 CRITICAL: Skill name matches known malicious pattern: $malicious${NC}"
        exit 1
    fi
done

# Files to scan (exclude security scanner false positives)
SCAN_FILES=()
if [[ -f "$SKILL_PATH/SKILL.md" ]]; then
    SCAN_FILES+=("$SKILL_PATH/SKILL.md")
fi
if [[ -f "$SKILL_PATH/install.sh" ]]; then
    SCAN_FILES+=("$SKILL_PATH/install.sh")
fi
if [[ -d "$SKILL_PATH/scripts" ]]; then
    for f in "$SKILL_PATH/scripts"/*; do
        # Skip files that are clearly security scanners (reduce false positives)
        if [[ "$f" == *"scan"* ]] || [[ "$f" == *"check"* ]] || [[ "$f" == *"audit"* ]]; then
            continue
        fi
        SCAN_FILES+=("$f")
    done
fi

if [[ ${#SCAN_FILES[@]} -eq 0 ]]; then
    echo -e "${YELLOW}⚠ No scannable files found${NC}"
    exit 0
fi

# Scan for suspicious patterns
FOUND_ISSUES=0
for file in "${SCAN_FILES[@]}"; do
    [[ -f "$file" ]] || continue
    
    for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
        if grep -iE "$pattern" "$file" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠ Suspicious pattern found: $pattern${NC}"
            echo "   in: $file"
            grep -iEn "$pattern" "$file" | head -3 | sed 's/^/   /'
            echo ""
            FOUND_ISSUES=$((FOUND_ISSUES + 1))
        fi
    done
done

# Check for prerequisites section with installation instructions
for file in "${SCAN_FILES[@]}"; do
    [[ -f "$file" ]] || continue
    
    # Look for prerequisites sections that mention manual steps
    if grep -iA5 "prerequisites" "$file" 2>/dev/null | grep -iE "(install|download|curl|wget|script|terminal|copy.*paste)" >/dev/null; then
        echo -e "${YELLOW}⚠ Prerequisites section with manual installation detected${NC}"
        echo "   in: $file"
        echo "   This matches the ClawHavoc attack pattern (fake prerequisites)"
        echo ""
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $FOUND_ISSUES -eq 0 ]]; then
    echo -e "${GREEN}✓ Clean: No suspicious patterns detected${NC}"
    echo "   Skill appears safe to install"
    exit 0
else
    echo -e "${YELLOW}⚠ Found $FOUND_ISSUES suspicious pattern(s)${NC}"
    echo "   Review before installing"
    exit 1
fi
