# 🔧 Engineering Technical Notes

*Architecture decisions, fixes, and maintenance logs.*

---

## 2026-03-01 — Security Hardening & Dependency Updates

### Summary
Addressed critical security findings from automated security review. Updated dependencies in web-app. Clarified false-positive security alerts.

---

### 1. Security Remediation (CRITICAL)

**Status:** Documented, partial remediation complete  
**Risk Level:** 🔴 HIGH → Requires Q action

#### Findings from Security Review (2026-03-01)

| Severity | Finding | Location | Action Taken |
|----------|---------|----------|--------------|
| 🔴 CRITICAL | Exposed OpenAI API key | `/.env` | Documented, needs Q to revoke |
| 🟡 HIGH | Environment files in repo | `/.env`, `/saas-app/.env.local` | Verified .gitignore coverage |
| 🟢 LOW | Hardcoded paths | Multiple files | Documented for future refactor |

#### Immediate Actions Required by Q

1. **Revoke OpenAI API Key**
   - URL: https://platform.openai.com/api-keys
   - Key prefix: `sk-proj-ea0_buSOIF...`
   - Generate new key, store in macOS Keychain

2. **Rotate Google OAuth Credentials**
   - Location: `/saas-app/.env.local`
   - Client ID: `529549692465-tbjgbc8jeb0bfeafjou77lrr34suil8h.apps.googleusercontent.com`
   - Google Cloud Console → APIs & Services → Credentials

3. **Generate New NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```

#### Verification Completed

- ✅ `.env` is in `.gitignore` (line 1)
- ✅ `.env.local` patterns in `.gitignore`
- ✅ No secrets found in git history (via manual review)
- ✅ SSH keys scan: PASS
- ✅ World-writable files: PASS

#### Recommended Next Steps

1. Move secrets to macOS Keychain:
   ```bash
   # Store
   security add-generic-password -s "openai-api-key" -a "$USER" -w "sk-..."
   # Retrieve  
   security find-generic-password -s "openai-api-key" -w
   ```

2. For Cloudflare Workers production:
   ```bash
   cd saas-app/worker
   wrangler secret put OPENAI_API_KEY
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

3. Install pre-commit hooks for secret detection:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

---

### 2. Web-App Dependency Updates

**Status:** ✅ Complete  
**Packages Updated:**

| Package | From | To |
|---------|------|-----|
| @tailwindcss/postcss | 4.1.18 | 4.2.1 |
| @types/node | 20.19.33 | 20.19.35 |
| eslint | 9.39.2 | 9.39.3 |
| tailwind-merge | 3.4.1 | 3.5.0 |
| tailwindcss | 4.1.18 | 4.2.1 |

**Held Back (breaking changes):**
- `lucide-react` 0.574.0 → 0.575.0 (patch, will update with testing)
- `react`/`react-dom` 19.2.3 → 19.2.4 (patch, will update with testing)
- `eslint` 9.39.3 → 10.0.2 (major, needs config review)
- `@types/node` 20.x → 25.x (major, Node version dependency)

**Security Audit Fix:**
Applied `npm audit fix` to resolve 3 vulnerabilities:
- `ajv` ReDoS (moderate) - ✅ Fixed
- `hono` timing comparison (low) - ✅ Fixed  
- `minimatch` ReDoS (high) - ✅ Fixed

**Final Verification:**
```bash
cd web-app
npm audit  # 0 vulnerabilities ✅
npm run build  # Build successful ✅
```

---

### 3. Security Scanner False Positives Documented

**Status:** ✅ Clarified

The security monitor flagged three "unverified skills" without SKILL.md:
- `skills/scribe/SOUL.md`
- `skills/sherlock/SOUL.md`  
- `skills/trader/SOUL.md`

**Resolution:** These are **agent personas**, not ClawHub installable skills. They define agent identity (SOUL.md), not tool interfaces (SKILL.md). The scanner correctly identifies they're not standard skills, but they're intentionally designed as agent definitions.

**Recommendation:** Update security scanner to distinguish between:
- `skills/<name>/SKILL.md` → ClawHub tool skills
- `skills/<name>/SOUL.md` → Agent persona definitions

---

### 4. Malicious Pattern Alerts Reviewed

**Status:** ✅ False Positives Confirmed

Alerts for `exec.*os` patterns in:
- `openclaw-kirocli-coding-agent/SKILL.md`
- `sql-toolkit/SKILL.md`

**Resolution:** These are legitimate documentation examples showing proper CLI usage patterns, not malicious code. The pattern match is overly broad.

---

## Work Log

| Time | Task | Status |
|------|------|--------|
| 11:47 AM | Read engineering SOUL.md | ✅ |
| 11:48 AM | Check security reports | ✅ |
| 11:50 AM | Review .gitignore coverage | ✅ |
| 11:52 AM | Update web-app dependencies | ✅ |
| 11:55 AM | Create TECH-NOTES.md | ✅ |

---

## Open Items

1. **AWAITING Q ACTION:** Revoke/rotate exposed credentials (OpenAI, Google OAuth)
2. **FUTURE:** Install pre-commit hooks for secret detection
3. **FUTURE:** Refactor hardcoded paths to use environment variables
4. **FUTURE:** Update breaking-change dependencies (React 19.2.4, ESLint 10.x)

---

*Logged by: Architect (Engineering Agent)*  
*Date: 2026-03-01*  
*Next Review: 2026-03-02*
