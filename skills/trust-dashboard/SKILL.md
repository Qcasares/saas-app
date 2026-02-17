---
name: trust-dashboard
version: 1.0.0
description: "Security dashboard for monitoring installed skill trust levels and audit status"
author: KingKong
keywords: [security, trust, audit, skills, dashboard, monitoring]
metadata:
  openclaw:
    emoji: "🔒"
---

# Trust Dashboard

Monitor the security posture of your installed skills. Track trust tiers, audit status, and identify potential risks.

## Features

- **Trust Tiers**: Categorize skills by verification level
- **Security Scanning**: Automated pattern detection for suspicious code
- **Risk Scoring**: Weighted scoring based on trust tier and findings
- **Weekly Reports**: Automated security briefings
- **Historical Tracking**: Monitor changes over time

## Trust Tiers

| Tier | Color | Meaning |
|------|-------|---------|
| 🟢 TRUSTED | Green | Core skills, personally audited, actively used |
| 🔵 VERIFIED | Blue | Community reviewed, no issues, established authors |
| 🟡 AUDITED | Yellow | Reviewed, minor concerns or limited verification |
| ⚪ UNVERIFIED | White | Not yet reviewed, exercise caution |
| 🔴 SUSPICIOUS | Red | Security concerns detected, immediate review needed |

## Usage

```bash
# Quick status
trust-dashboard status

# Full report
trust-dashboard report

# Security audit only
trust-dashboard audit
```

## Security Patterns Checked

- Webhook exfiltration attempts (`curl` to external services)
- `.env` file access (legitimate for config, flagged for review)
- Credential references in code
- Dynamic code execution (`eval`, `exec`)
- Known suspicious domains (webhook.site, requestbin, etc.)

## Weekly Automation

Runs every Sunday at 10 AM via cron job. Reports security status and any changes since last scan.

## Configuration

Edit trust tiers in `scripts/trust-dashboard.sh`:

```bash
case "$1" in
    "accli"|"github"|"gog")
        echo "TRUSTED"
        ;;
esac
```

## Data Files

- `data/trust-state.json` - Latest scan results
- `data/latest-report.md` - Generated markdown report
- `data/history/` - Historical scan data (if enabled)

## Interpreting Results

**Risk Scores:**
- 0-19: Low risk - well maintained, trusted sources
- 20-39: Moderate - generally safe, monitor unverified
- 40-59: Elevated - review unverified skills
- 60+: High - immediate audit recommended

**Security Notes:**
- `.env` access is common for legitimate config loading
- Domain mentions may be in comments/documentation
- Always review flagged skills manually

## Related

- `ai-skill-scanner` - Deep security analysis
- `agent-security-audit` - Prompt injection checks
- ClawHavoc defense in MEMORY.md
