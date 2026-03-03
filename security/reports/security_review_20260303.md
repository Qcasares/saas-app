🔒 Nightly Security Review - Tue Mar  3 03:46:40 GMT 2026
================================

## 1. Environment Files Check
### [HIGH] Environment Files
**Finding:** .env files detected in repository
**Evidence:**
```
/Users/quentincasares/.openclaw/workspace/saas-app/.env.local
/Users/quentincasares/.openclaw/workspace/saas-app/.env.example
/Users/quentincasares/.openclaw/workspace/.env
/Users/quentincasares/.openclaw/workspace/.env.cellcog
/Users/quentincasares/.openclaw/workspace/skills/onchainkit/assets/templates/basic-app/.env.local.example
```


## 2. Hardcoded Credentials Check
### [CRITICAL] Hardcoded Credentials
**Finding:** Potential credentials found in code
**Evidence:**
```
/Users/quentincasares/.openclaw/workspace/moltbook-autonomous.py:14:# Set Moltbook token
/Users/quentincasares/.openclaw/workspace/worker/src/routes/auth.ts:45:    // Exchange code for tokens
/Users/quentincasares/.openclaw/workspace/worker/src/routes/auth.ts:46:    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
/Users/quentincasares/.openclaw/workspace/worker/src/routes/auth.ts:58:    const tokens = await tokenResponse.json() as {
/Users/quentincasares/.openclaw/workspace/worker/src/routes/auth.ts:59:      access_token: string;
```


## 3. SSH Keys Check
### [HIGH] SSH Keys
**Finding:** SSH private keys found in workspace
**Evidence:**
```
/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.14/site-packages/pip/_vendor/certifi/cacert.pem
/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.14/site-packages/certifi/cacert.pem
```


## 4. File Permissions Check
✅ No world-writable files found

## 5. Path Exposure Check
### [LOW] Path Exposure
**Finding:** Absolute paths in code
**Evidence:**
```
/Users/quentincasares/.openclaw/workspace/knowledge_base/ingester.py:13:sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace')
/Users/quentincasares/.openclaw/workspace/content/social-media/CONTENT-PACKAGE.md:134:cd /Users/quentincasares/.openclaw/workspace && \
/Users/quentincasares/.openclaw/workspace/content/social-media/CONTENT-PACKAGE.md:141:cd /Users/quentincasares/.openclaw/workspace && \
```


## Summary
- Report generated: Tue Mar  3 03:46:41 GMT 2026
- Critical findings: 1
- Host: mm.local

⚠️ **ALERT: 1 critical finding(s) require attention!**
