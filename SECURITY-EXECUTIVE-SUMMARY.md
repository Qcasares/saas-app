# OpenClaw Security Framework - Executive Summary

**Date:** 2026-02-04  
**Status:** CRITICAL - Active credential exfiltration incident

---

## 🚨 Key Findings

### The Incident
A malicious skill disguised as a weather app on ClawdHub successfully exfiltrated `~/.clawdbot/.env` credentials to **webhook.site**. The current system has **zero security controls**:
- No code signing
- No sandboxing
- No audit trails
- No permission manifests

### Current Risk Assessment

| Risk Level | Count | Skills |
|------------|-------|--------|
| 🚨 **DANGEROUS** | 2 | agent-browser-jrdv4mcscrb2, skillboss |
| ⚠️ **SUSPICIOUS** | 5 | moltbook-interact, prompt-engineering-expert, elite-longterm-memory, self-improving-agent, blogburst |
| 🔎 **REVIEW** | 2 | second-brain, proactive-messages |
| ✅ **CLEAN** | 7 | ai-skill-scanner, agent-security-audit, auto-updater, gog, humanize, pdf, tweet-writer |

---

## 📁 Deliverables Created

### 1. Security Framework Roadmap
**File:** `security-framework-roadmap.md`  
**Size:** 22KB comprehensive document covering:
- Current skill inventory & risk analysis
- Available security tools on ClawHub
- Sandboxing & isolation options (4 approaches)
- Permission manifest system specification
- Moltbook community best practices
- 4-layer security architecture
- Implementation roadmap with priorities
- Incident response playbook

### 2. Immediate Action Scripts

| Script | Purpose | Risk |
|--------|---------|------|
| `security-audit.sh` | Comprehensive audit of all skills | Safe - read only |
| `quarantine-dangerous-skills.sh` | Moves dangerous skills to quarantine | **Modifies system** |
| `block-malicious-domains.sh` | Adds malicious domains to /etc/hosts | **Modifies system** |

---

## 🔴 IMMEDIATE ACTIONS (Today)

### 1. Run Security Audit
```bash
cd ~/.openclaw/workspace
./security-audit.sh
```

### 2. Rotate Compromised Credentials
The following were potentially exposed:
- All contents of `~/.clawdbot/.env`
- Review `~/.openclaw/credentials/`
- Rotate Telegram bot token if stored in .env

### 3. Quarantine Dangerous Skills
```bash
./quarantine-dangerous-skills.sh
```
**This will move:**
- `agent-browser-jrdv4mcscrb2` (keylogging capability)
- `skillboss` (exfiltration behavior patterns)

### 4. Block Malicious Domains
```bash
./block-malicious-domains.sh
```
Blocks 20+ known exfiltration endpoints including webhook.site

---

## 🟡 SHORT-TERM (This Week)

1. **Implement Pre-Install Scanning**
   - All new skills must pass ai-skill-scanner
   - Block DANGEROUS, prompt for SUSPICIOUS

2. **Enable Audit Logging**
   - Log all skill executions
   - Track network connections
   - Monitor file system access

3. **Review File Permissions**
   ```bash
   chmod 700 ~/.openclaw/credentials
   chmod 600 ~/.openclaw/openclaw.json
   chmod 600 ~/.openclaw/exec-approvals.json
   ```

4. **Document All Skills**
   - Create security profile for each installed skill
   - Note network dependencies
   - Track permission requirements

---

## 🟢 LONG-TERM (This Month)

1. **Container-based Sandboxing**
   - Run skills in isolated Docker containers
   - Network policies to block exfiltration
   - Resource limits

2. **Code Signing**
   - Verify all skills are signed by trusted publishers
   - Reject unsigned skills by default

3. **Runtime Behavior Monitor**
   - Detect file + network access patterns
   - Block suspicious syscalls
   - Real-time alerts

4. **Permission Manifest System**
   - Skills declare required permissions
   - User approval for sensitive operations
   - Deny-by-default for risky capabilities

---

## 🛡️ Existing Security Assets

### Installed Security Tools

| Tool | Version | Purpose | Coverage |
|------|---------|---------|----------|
| **ai-skill-scanner** | 2.1.0 | Static analysis | 40+ detection rules including credential exfiltration, obfuscation, file access, network calls, behavioral analysis |
| **agent-security-audit** | 1.0.0 | Prompt injection defense | Content sanitization, injection detection, memory protection |

---

## 📊 Technical Details

### Most Critical Findings

#### agent-browser-jrdv4mcscrb2
- **Risk:** CRITICAL
- **Issues:** Keyboard input monitoring (`keydown`), screenshot capture capability
- **Attack Vector:** Could capture passwords, sensitive data via screenshots

#### skillboss
- **Risk:** CRITICAL  
- **Issues:** Network calls + sensitive file reads + environment access = exfiltration pattern
- **Attack Vector:** Behavioral analysis indicates credential theft capability

#### moltbook-interact
- **Risk:** HIGH
- **Issues:** Accesses `~/.openclaw/auth-profiles.json`, processes credentials
- **Note:** May be legitimate but requires review

---

## 🔄 Next Steps for Main Agent

1. **Review the full roadmap:** `security-framework-roadmap.md`
2. **Run the audit:** `./security-audit.sh`
3. **Decide on quarantine:** Review dangerous skills before running quarantine script
4. **Rotate credentials:** Check what was in ~/.clawdbot/.env
5. **Implement blocking:** Run domain blocker
6. **Set up monitoring:** Enable audit logging
7. **Schedule regular scans:** Weekly security audits

---

## ⚠️ Important Notes

1. **The malicious skill has already exfiltrated data.** Assume any credentials in `~/.clawdbot/.env` are compromised.

2. **Quarantine is reversible.** Skills are moved, not deleted. Can be restored after review.

3. **Scripts require review.** All three scripts are provided for transparency - review before executing.

4. **This is a starting point.** The security framework provides a roadmap, not a complete solution. Implementation requires ongoing effort.

---

**Document:** security-framework-roadmap.md  
**Scripts:** security-audit.sh, quarantine-dangerous-skills.sh, block-malicious-domains.sh  
**Next Review:** 2026-02-11
