# Error Log

Tracking command failures, exceptions, and unexpected behaviors.

---

*No errors logged yet. This is a good thing.*

To add an error entry, use this format:

## [ERR-YYYYMMDD-XXX] command_name

**Logged**: ISO-8601 timestamp  
**Priority**: high  
**Status**: pending  
**Area**: frontend | backend | infra | tests | docs | config

### Summary
Brief description of what failed

### Error
```
Actual error output
```

### Context
What was being attempted

### Suggested Fix

### Metadata
- Reproducible: yes | no | unknown
- Related Files: 

---

## [SEC-20250207-001] clawhub-supply-chain-attack

**Logged**: 2026-02-07T08:15:00Z  
**Priority**: CRITICAL  
**Status**: active  
**Area**: security

### Summary
Major supply chain attack discovered: 341 malicious ClawHub skills targeting OpenClaw users with macOS malware (AMOS stealer, keyloggers, backdoors).

### Threat Intelligence
| Attribute | Details |
|-----------|---------|
| Campaign size | 341+ malicious skills |
| Timeline | Jan 27 - Feb 2, 2026 |
| First wave | 28 skills (Jan 27-29) |
| Second wave | 386 skills (Jan 31-Feb 2) |
| Targets | Claude Code, Moltbot users |
| Payloads | Atomic macOS Stealer, keyloggers, backdoors |
| Platform | macOS specifically targeted |

### Sources
- The Hacker News: https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html
- Tom's Hardware: https://www.tomshardware.com/tech-industry/cyber-security/malicious-moltbot-skill-targets-crypto-users-on-clawhub
- Security Affairs: https://securityaffairs.com/187562/malware/moltbot-skills-exploited-to-distribute-400-malware-packages-in-days.html
- SC World: https://www.scworld.com/news/openclaw-agents-targeted-with-341-malicious-clawhub-skills

### Our Status
- 20 skills installed, audited Feb 6 — no malicious patterns detected
- All skills installed BEFORE campaign timeline (Jan 27+)
- No new skills installed since Feb 5
- **Risk level: LOW** (for current install base)

### Immediate Actions
1. ✅ Verified installed skills against known attack timeline
2. ✅ Confirmed no skills installed during attack window
3. 🔄 Enhanced audit with new IOCs (in progress)
4. ⏳ Monitoring for specific skill name patterns from reports

### Recommended Next Steps
- Review any skills installed after Jan 27, 2026
- Monitor for ClawHub security advisories
- Consider blocking ClawHub installs temporarily until ecosystem stabilizes
- Set up automated skill audit on each install

### Metadata
- Related: Snyk ToxicSkills report (Feb 5)
- Related Files: SECURITY-EXECUTIVE-SUMMARY.md, TRUST_TIERS.md
- Tags: supply-chain, malware, macos, clawhub, critical
