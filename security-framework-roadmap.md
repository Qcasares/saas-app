# OpenClaw/ClawdBot Security Framework Roadmap

**Classification:** CRITICAL INFRASTRUCTURE  
**Date:** 2026-02-04  
**Threat Level:** HIGH (Active credential exfiltration incident confirmed)  

---

## Executive Summary

A malicious skill disguised as a weather application was discovered on ClawdHub that successfully exfiltrated `~/.clawdbot/.env` credentials to webhook.site. The current OpenClaw/ClawdBot ecosystem lacks fundamental security controls:

- ❌ **No code signing** for skills
- ❌ **No sandboxing** or isolation for skill execution
- ❌ **No audit trails** for skill activities
- ❌ **No permission manifests** to restrict skill capabilities
- ❌ **No runtime monitoring** for suspicious behavior

This document provides a comprehensive security framework with immediate actions, short-term improvements, and long-term architectural changes.

---

## 1. Current Skill Inventory & Risk Assessment

### Installed Skills (16 Total)

| Skill | Version | Risk Score | Critical Issues | High Issues | Notes |
|-------|---------|------------|-----------------|-------------|-------|
| **agent-browser-jrdv4mcscrb2** | 1.0.0 | 🚨 DANGEROUS | 1 | 6 | Keylogging capability, screenshots |
| **skillboss** | 1.0.0 | 🚨 DANGEROUS | 8 | 19 | Network + file reads = exfiltration risk |
| **moltbook-interact** | 1.0.1 | ⚠️ SUSPICIOUS | 0 | 9 | Reads auth files, external domains |
| **prompt-engineering-expert** | 1.0.0 | ⚠️ SUSPICIOUS | 0 | 8 | Multiple high-severity patterns |
| **elite-longterm-memory** | 0.1.0 | ⚠️ SUSPICIOUS | 0 | 4 | File access patterns |
| **self-improving-agent** | 1.0.5 | ⚠️ SUSPICIOUS | 0 | 1 | Self-modification capability |
| **blogburst** | 1.0.5 | ⚠️ SUSPICIOUS | 0 | 1 | Network access |
| **second-brain** | 0.1.4 | 🔎 REVIEW | 0 | 0 | External API dependency |
| **proactive-messages** | 1.0.0 | 🔎 REVIEW | 0 | 0 | Message automation |
| ai-skill-scanner | 2.1.0 | ℹ️ INFO | 0 | 0 | Security scanner (ourselves) |
| agent-security-audit | 1.0.0 | ✅ CLEAN | 0 | 0 | Prompt injection defense |
| auto-updater | 1.0.0 | ✅ CLEAN | 0 | 0 | Self-update capability |
| gog | 1.0.0 | ✅ CLEAN | 0 | 0 | Game database |
| humanize | 1.0.0 | ✅ CLEAN | 0 | 0 | Text processing |
| pdf | 0.1.0 | ✅ CLEAN | 0 | 0 | Document processing |
| tweet-writer | 1.0.0 | ✅ CLEAN | 0 | 0 | Social media |

### Immediate Risk Summary

**CRITICAL RISKS:**
1. **agent-browser-jrdv4mcscrb2**: Has keyboard input monitoring (`keydown`) and screenshot capabilities that could capture sensitive information
2. **skillboss**: Exhibits behavioral patterns matching credential exfiltration (network calls + sensitive file reads + environment access)

**HIGH RISKS:**
- **moltbook-interact**: Accesses `~/.openclaw/auth-profiles.json` and processes credentials
- **prompt-engineering-expert**: Multiple unverified high-severity patterns
- **elite-longterm-memory**: File system access with memory persistence

---

## 2. Existing Security Tools on ClawHub

### Currently Available

#### 1. **ai-skill-scanner** (v2.1.0) ✅ INSTALLED
- **Publisher:** ClawHub Official
- **Capability:** Static analysis scanner for malicious patterns
- **Detection Coverage:**
  - Credential exfiltration (fetch/curl with auth data)
  - Suspicious network calls (webhooks, hardcoded IPs)
  - Code obfuscation (base64, eval, hex encoding)
  - File system access (SSH keys, browser data, .env files)
  - Process execution (shell commands, reverse shells)
  - Data collection (keylogging, screenshots, clipboard)
  - Cryptocurrency theft (wallet extraction, mining)
  - Prompt injection attempts
  - Behavioral analysis (file + network = exfiltration)
- **Advanced Features:**
  - Shannon entropy analysis for encoded payloads
  - String concatenation evasion detection
  - Payload decoder (base64/hex with malicious content detection)
  - Dependency analysis (known malicious npm/pypi packages)
  - Python AST analysis for dangerous imports/calls
  - JavaScript/TypeScript data flow analysis
  - Steganography detection (hidden binary in text files)
  - Network destination analysis (suspicious domains, lookalikes)
  - Temporal/conditional trigger detection (time bombs)

#### 2. **agent-security-audit** (v1.0.0) ✅ INSTALLED
- **Publisher:** 太郎書館 (Taro Library)
- **Capability:** Prompt injection defense and content sanitization
- **Features:**
  - System prompt hardening guidelines
  - Honeypot response patterns for injection attempts
  - Content sanitization (HTML comments, zero-width chars, base64)
  - Injection pattern detection
  - Memory write validation
  - Safe-fetch patterns with logging

### Missing Capabilities (Research Needed)

1. **YARA Rules for Skills** - No evidence found in current inventory
2. **Runtime Behavior Monitor** - Not available
3. **Sandboxed Execution Environment** - Not available
4. **Code Signing Verification** - Not available
5. **Permission Manifest Enforcement** - Not available

---

## 3. Sandboxing & Isolation Options

### Option A: Container-based Isolation (Recommended)

**Implementation:** Docker/Podman containers per skill
```yaml
# Proposed skill-container.yaml
skill:
  sandbox:
    type: container
    image: openclaw/skill-runtime:latest
    network: restricted  # No outbound by default
    filesystem: readonly  # Except /tmp and /workspace
    resources:
      cpus: 1
      memory: 512MB
      disk: 1GB
  permissions:
    network:
      - api.openai.com
      - api.github.com
    filesystem:
      read:
        - /workspace/**
      write:
        - /tmp/**
        - /workspace/output/**
    environment:
      allow: [OPENAI_API_KEY, GITHUB_TOKEN]
      deny: [AWS_SECRET*, .env*]
```

**Pros:**
- Strong isolation boundary
- Resource limits enforceable
- Network policies can restrict exfiltration
- Industry standard

**Cons:**
- Performance overhead
- Requires container runtime
- Skill compatibility issues

### Option B: gVisor/Firecracker MicroVMs

**Implementation:** Lightweight VMs for each skill execution
- **gVisor:** User-space kernel for syscall interception
- **Firecracker:** AWS Lambda's microVM technology

**Pros:**
- Stronger isolation than containers
- Faster than full VMs
- Seccomp-bpf filtering

**Cons:**
- More complex setup
- Higher resource usage than containers

### Option C: Deno-style Permission System

**Implementation:** Runtime permission prompts
```javascript
// Skill manifest would declare needed permissions
{
  "permissions": {
    "network": ["api.openai.com", "https://github.com"],
    "filesystem": {
      "read": ["./workspace"],
      "write": ["./output"]
    },
    "env": ["OPENAI_API_KEY"],
    "exec": false,
    "clipboard": false
  }
}
```

**Execution would require explicit approval:**
```
⚠️  Skill "weather-app" requests permissions:
   - Network access to: webhook.site ⚠️ SUSPICIOUS
   - Read: ~/.clawdbot/.env ⚠️ SENSITIVE
   
   [Deny] [Allow Once] [Allow Always]
```

**Pros:**
- Native to JavaScript/TypeScript runtime
- Fine-grained control
- User-visible permission prompts

**Cons:**
- Requires runtime support in OpenClaw
- Skills need migration

### Option D: seccomp + Landlock (Linux) / Seatbelt (macOS)

**Implementation:** Kernel-level syscall filtering
```bash
# Example seccomp policy
seccomp:
  default: ERRNO
  allowed:
    - read
    - write
    - exit
    - exit_group
  denied:
    - connect  # Network blocked
    - openat   # File access restricted
```

**Pros:**
- Minimal performance impact
- Kernel-enforced
- No container overhead

**Cons:**
- Platform-specific (Linux/macOS differences)
- Complex policy management

---

## 4. Permission Manifest System

### Proposed Manifest Format (skill-manifest.json)

```json
{
  "manifestVersion": "2026-02",
  "skill": {
    "name": "weather-app",
    "version": "1.2.0",
    "publisher": "trusted-dev",
    "signature": "sha256:abc123...",
    "signatureAlgorithm": "ed25519"
  },
  "permissions": {
    "network": {
      "outbound": {
        "allow": [
          "api.openweathermap.org",
          "api.weatherapi.com"
        ],
        "deny": [
          "*webhook*",
          "*requestbin*",
          "10.*.*.*",
          "192.168.*.*"
        ],
        "requireApproval": true
      }
    },
    "filesystem": {
      "read": {
        "allow": ["./**", "/tmp/**"],
        "deny": [
          "**/.env*",
          "**/.ssh/**",
          "**/.aws/**",
          "**/.clawdbot/**",
          "**/.openclaw/credentials/**",
          "**/Library/Keychains/**",
          "**/*password*",
          "**/*secret*",
          "**/*token*"
        ]
      },
      "write": {
        "allow": ["./output/**", "/tmp/**"],
        "deny": ["**/*"]
      }
    },
    "environment": {
      "read": {
        "allow": ["HOME", "USER", "PATH"],
        "deny": ["*KEY*", "*SECRET*", "*TOKEN*", "*PASSWORD*", "*CREDENTIAL*"]
      }
    },
    "exec": {
      "allowed": false,
      "shell": false,
      "subprocess": false
    },
    "clipboard": {
      "read": false,
      "write": false
    },
    "display": {
      "screenshot": false,
      "uiAutomation": false
    },
    "input": {
      "keyboard": false,
      "mouse": false
    }
  },
  "runtime": {
    "maxMemoryMB": 512,
    "maxCPUPercent": 50,
    "maxExecutionTimeSec": 300,
    "allowBackground": false
  },
  "audit": {
    "logLevel": "verbose",
    "logPermissions": true,
    "logNetwork": true,
    "logFilesystem": true,
    "retentionDays": 30
  }
}
```

### Permission Enforcement Levels

| Level | Description | Enforcement |
|-------|-------------|-------------|
| **BLOCK** | Never allowed, immediate termination | Kernel/runtime level |
| **PROMPT** | Requires user approval per execution | Interactive dialog |
| **AUDIT** | Allowed but logged with full context | Audit log |
| **ALLOW** | Allowed without logging | Silent |

---

## 5. Best Practices from Moltbook Community

Based on analysis of moltbook-interact skill and community patterns:

### 5.1 Credential Management
```bash
# Good: Use OpenClaw's built-in auth system
openclaw agents auth add <service> --token <token>
# Stored in: ~/.openclaw/auth-profiles.json (encrypted)

# Bad: Storing in skill directories or .env files
echo "API_KEY=secret" > ~/.clawdbot/.env  # ❌ VULNERABLE
```

### 5.2 Skill Installation Best Practices
1. **Always scan before install:**
   ```bash
   openclaw skills scan <skill-path>  # Proposed command
   ```

2. **Verify publisher identity:**
   - Check publisher reputation on ClawHub
   - Verify signature if available
   - Review source code for high-risk skills

3. **Install from trusted sources only:**
   - Official ClawHub registry
   - Verified publishers
   - Avoid direct GitHub URLs unless verified

### 5.3 Content Security
The agent-security-audit skill provides these recommendations:
- Sanitize all external content before processing
- Strip HTML comments containing instructions
- Remove zero-width characters
- Validate memory writes before persistence
- Use honeypot responses for detected injection attempts

---

## 6. Proposed Layered Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LAYER 1: PRE-INSTALL                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Code Signing│  │  Reputation │  │   Static    │  │ Dependency  │    │
│  │ Verification│  │    Check    │  │   Analysis  │  │    Audit    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           LAYER 2: INSTALL                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Sandbox    │  │  Permission │  │  Manifest   │  │   Quarantine│    │
│  │   Setup     │  │   Prompt    │  │  Validation │  │    Period   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           LAYER 3: RUNTIME                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Network   │  │  Filesystem │  │   System    │  │  Resource   │    │
│  │  Filtering  │  │   Access    │  │   Call      │  │    Limits   │    │
│  │             │  │   Control   │  │  Monitoring │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           LAYER 4: MONITORING                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Behavior   │  │   Audit     │  │  Anomaly    │  │   Alert     │    │
│  │  Analysis   │  │    Logs     │  │  Detection  │  │   System    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Roadmap

### 🔴 IMMEDIATE ACTIONS (Today)

#### 7.1.1 Audit & Remove High-Risk Skills
```bash
# Run comprehensive scan on all skills
for skill in ~/.openclaw/workspace/skills/*; do
    python3 ~/.openclaw/workspace/skills/ai-skill-scanner/scripts/scan.py "$skill" --json
done

# Immediate removal candidates (pending review):
# - agent-browser-jrdv4mcscrb2 (keylogging capability)
# - skillboss (exfiltration patterns)
```

#### 7.1.2 Rotate Compromised Credentials
```bash
# Credentials exposed in ~/.clawdbot/.env were exfiltrated
# Immediate rotation required for:
# - All API keys in ~/.clawdbot/.env
# - Any tokens accessible to the malicious skill
# - Consider Telegram bot token rotation
```

#### 7.1.3 Enable Scanning on All New Skills
```bash
# Add to ~/.openclaw/config.json
{
  "security": {
    "scanOnInstall": true,
    "blockDangerousSkills": true,
    "blockSuspiciousSkills": false  # Prompt instead
  }
}
```

#### 7.1.4 Review File Permissions
```bash
# Secure credential directories
chmod 700 ~/.openclaw/credentials
chmod 700 ~/.openclaw/identity
chmod 600 ~/.openclaw/openclaw.json
chmod 600 ~/.openclaw/exec-approvals.json

# Remove any world-readable credential files
find ~ -name ".env" -o -name "credentials.json" | xargs ls -la
```

#### 7.1.5 Block Known Malicious Domains
```bash
# Add to /etc/hosts or DNS filter
127.0.0.1 webhook.site
127.0.0.1 requestbin.com
127.0.0.1 requestbin.net
127.0.0.1 pipedream.net
127.0.0.1 ngrok.io
127.0.0.1 serveo.net
127.0.0.1 localtunnel.me
```

### 🟡 SHORT-TERM (This Week)

#### 7.2.1 Implement Pre-Install Scanning
Create wrapper script for skill installation:
```bash
#!/bin/bash
# /usr/local/bin/openclaw-secure-install

SKILL_PATH="$1"
SCANNER="$HOME/.openclaw/workspace/skills/ai-skill-scanner/scripts/scan.py"

# Run security scan
echo "🔍 Scanning skill for security issues..."
RESULT=$(python3 "$SCANNER" "$SKILL_PATH" --json)
SCORE=$(echo "$RESULT" | jq -r '.score')

case "$SCORE" in
  "DANGEROUS")
    echo "🚨 CRITICAL: Skill blocked - dangerous patterns detected"
    echo "$RESULT" | jq '.findings[] | select(.severity == "CRITICAL")'
    exit 1
    ;;
  "SUSPICIOUS")
    echo "⚠️  WARNING: Suspicious patterns detected"
    echo "$RESULT" | jq '.findings[] | select(.severity == "HIGH")'
    read -p "Continue anyway? (yes/no): " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || exit 1
    ;;
  *)
    echo "✅ Skill passed security scan"
    ;;
esac

# Proceed with installation
openclaw skills add "$SKILL_PATH"
```

#### 7.2.2 Create Skill Permission Profiles
```json
// ~/.openclaw/security/profiles.json
{
  "profiles": {
    "untrusted": {
      "network": "deny",
      "filesystem": "read-only-workspace",
      "environment": "minimal",
      "exec": false
    },
    "standard": {
      "network": "allow-listed",
      "filesystem": "read-write-workspace",
      "environment": "common-only",
      "exec": false
    },
    "trusted": {
      "network": "allow",
      "filesystem": "allow",
      "environment": "allow",
      "exec": true
    }
  }
}
```

#### 7.2.3 Implement Network Monitoring
```bash
# Create packet capture for skill network activity
# Use tcpdump or Wireshark to monitor outbound connections
sudo tcpdump -i any -w /var/log/openclaw-network.pcap 'port not 22 and port not 53'
```

#### 7.2.4 Set Up Audit Logging
```bash
# Create audit log directory
mkdir -p ~/.openclaw/audit
chmod 700 ~/.openclaw/audit

# Log all skill executions
cat >> ~/.openclaw/audit/skill-execution.log << 'EOF'
{
  "timestamp": "2026-02-04T09:56:00Z",
  "skill": "weather-app",
  "action": "network-request",
  "target": "webhook.site",
  "blocked": true,
  "reason": "Known exfiltration endpoint"
}
EOF
```

#### 7.2.5 Review & Document All Installed Skills
Create security documentation for each installed skill:
- Source verification
- Permission requirements
- Network dependencies
- Risk assessment

### 🟢 LONG-TERM (This Month)

#### 7.3.1 Implement Container-based Sandboxing
```dockerfile
# Dockerfile.openclaw-skill-runtime
FROM node:20-alpine

# Create restricted user
RUN adduser -D -s /bin/sh skilluser

# Set up workspace
WORKDIR /workspace
RUN chown skilluser:skilluser /workspace

# Install security tools
RUN apk add --no-cache seccomp strace

# Drop privileges
USER skilluser

# Restrict network by default
# (Use Docker --network none or custom bridge)
```

#### 7.3.2 Build Code Signing Infrastructure
```
1. Generate ClawHub signing key pair (Ed25519)
2. Sign all official skills
3. Distribute public key with OpenClaw
4. Reject unsigned skills by default (with override)
5. Publisher verification system
```

#### 7.3.3 Develop Runtime Behavior Monitor
```python
# Proposed: ~/.openclaw/security/monitor.py
import sys
import ptrace
import logging

class SkillMonitor:
    def __init__(self, skill_path):
        self.skill_path = skill_path
        self.violations = []
    
    def on_syscall(self, syscall):
        # Block dangerous syscalls
        if syscall.name in ['connect', 'socket']:
            if not self.is_allowed_destination(syscall.args):
                self.violations.append(syscall)
                return False  # Block
        
        if syscall.name in ['open', 'openat']:
            if self.is_sensitive_path(syscall.args):
                self.violations.append(syscall)
                return False  # Block
        
        return True  # Allow
    
    def is_allowed_destination(self, args):
        # Check against whitelist
        pass
    
    def is_sensitive_path(self, args):
        # Check against sensitive paths
        pass
```

#### 7.3.4 Create ClawHub Security Registry
- Centralized security scanning for all published skills
- Automated daily re-scanning of all skills
- Security badge system for verified skills
- Community reporting system for malicious skills

#### 7.3.5 Implement Anomaly Detection
```python
# Detect unusual skill behavior
class AnomalyDetector:
    def detect(self, behavior_log):
        # Check for:
        # - Unusual network destinations
        # - Large data transfers
        # - Access to sensitive files
        # - Execution outside normal hours
        # - Repeated failed permission requests
        pass
```

#### 7.3.6 User Security Dashboard
```bash
# Proposed: openclaw security dashboard
$ openclaw security status

🛡️ OpenClaw Security Status
═══════════════════════════════════════════════════════

Installed Skills: 16
  ✅ Clean: 6
  ℹ️  Info: 1
  🔎 Review: 2
  ⚠️  Suspicious: 5
  🚨 Dangerous: 2  ← REQUIRES ATTENTION

Active Sandboxes: 0/16 (Not implemented)
Signed Skills: 0/16 (Code signing not enabled)
Audit Logs: Enabled (retention: 30 days)

Recommendations:
  1. Review dangerous skills: agent-browser-jrdv4mcscrb2, skillboss
  2. Enable sandboxing for high-risk skills
  3. Update 3 skills with available security patches
```

---

## 8. Security Checklist

### For Users

- [ ] Run security scan on all installed skills
- [ ] Remove or quarantine dangerous skills
- [ ] Rotate any potentially exposed credentials
- [ ] Review file permissions on credential directories
- [ ] Enable audit logging
- [ ] Block known malicious domains
- [ ] Document installed skills and their permissions
- [ ] Set up regular security scans (weekly)

### For OpenClaw Developers

- [ ] Implement mandatory pre-install scanning
- [ ] Add permission manifest validation
- [ ] Build sandboxed execution environment
- [ ] Create code signing infrastructure
- [ ] Implement runtime behavior monitoring
- [ ] Build security dashboard
- [ ] Add automatic update checks for security patches
- [ ] Create incident response playbook

### For ClawHub Registry

- [ ] Mandatory security scanning for all submissions
- [ ] Publisher verification system
- [ ] Code signing for all published skills
- [ ] Security badge program
- [ ] Rapid takedown process for malicious skills
- [ ] Community security reporting system
- [ ] Regular re-scanning of existing skills

---

## 9. Incident Response Playbook

### Detected Malicious Skill

1. **Immediate Containment**
   ```bash
   # Stop all OpenClaw processes
   openclaw gateway stop
   
   # Isolate the skill
   mv ~/.openclaw/workspace/skills/<malicious-skill> \
      ~/.openclaw/quarantine/
   ```

2. **Impact Assessment**
   ```bash
   # Check what the skill accessed
   grep <skill-name> ~/.openclaw/audit/*.log
   
   # Review network connections
   cat /var/log/openclaw-network.pcap | grep <timestamp>
   ```

3. **Credential Rotation**
   - Rotate all API keys accessible to the skill
   - Check for any exfiltrated data
   - Review access logs for affected services

4. **Reporting**
   - Report to ClawHub security team
   - Submit to community security database
   - Document lessons learned

---

## 10. References & Resources

### Existing Security Tools
- **ai-skill-scanner** (v2.1.0): Static analysis scanner
- **agent-security-audit** (v1.0.0): Prompt injection defense

### External Resources
- OWASP Top 10 for LLMs
- NIST Cybersecurity Framework
- Docker Security Best Practices
- seccomp-bpf documentation
- gVisor documentation

### Community
- Moltbook Exchange security resources
- ClawHub security discussions
- OpenClaw GitHub security issues

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Security Subagent | Initial comprehensive security framework |

---

**Next Review Date:** 2026-02-11  
**Document Owner:** Security Subagent  
**Classification:** INTERNAL USE ONLY
