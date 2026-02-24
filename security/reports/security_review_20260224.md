🔒 Nightly Security Review - Tue Feb 24 03:32:38 GMT 2026
================================

## 1. Environment Files Check
⚠️ HIGH: .env files detected in repository
/Users/quentincasares/.openclaw/workspace/saas-app/.env.local
/Users/quentincasares/.openclaw/workspace/saas-app/.env.example
/Users/quentincasares/.openclaw/workspace/.env

## 2. Hardcoded Credentials Check
⚠️ CRITICAL: Potential credentials found
```
/Users/quentincasares/.openclaw/workspace/skills/skillboss/config.json:  "apiKey": "sk-gAAAAABplGqdVl8CcNf2OMq4vYEa3FfgoesbmVCEhOv8gSwNmNxrRL4jsLc80MOW5Z3qRhBeSWHb-v2LGnK9odWf-LCT3bFixEFEHgjy4fzPWk42DnHEa-H1Mt1serEB_LMf1XCi8jVbOwC7gM3Tz1kHizSQaNINpQ==",
```

## 3. SSH Keys Check
✅ No SSH keys found in workspace

## 4. File Permissions Check
✅ No world-writable files found

## 5. Path Exposure Check
ℹ️ LOW: Absolute paths in code
/Users/quentincasares/.openclaw/workspace/scripts/nightly-security-review.sh:PATH_HITS=$(grep -r "Users/quentincasares" "$WORKSPACE" --include="*.py" --include="*.js" --include="*.md" 2>/dev/null | grep -v "security/reports" | head -5 || true)
Binary file /Users/quentincasares/.openclaw/workspace/skills/ai-skill-scanner/scripts/__pycache__/advanced_checks.cpython-314.pyc matches
/Users/quentincasares/.openclaw/workspace/skills/calendar-sync/com.openclaw.calendar-sync.plist:        <string>/Users/quentincasares/.openclaw/workspace/skills/calendar-sync/scripts/sync.sh &gt;&gt; /Users/quentincasares/.openclaw/workspace/skills/calendar-sync/data/cron.log 2&gt;&amp;1</string>

## 6. Large File Check
⚠️ MEDIUM: Large files detected (>10MB)
/Users/quentincasares/.openclaw/workspace/.fastembed_cache/models--nomic-ai--nomic-embed-text-v1.5/blobs/147d5aa88c2101237358e17796cf3a227cead1ec304ec34b465bb08e9d952965 522M
/Users/quentincasares/.openclaw/workspace/saas-app/.next/cache/webpack/client-production/13.pack 13M
/Users/quentincasares/.openclaw/workspace/saas-app/.next/cache/webpack/client-production/14.pack 13M
/Users/quentincasares/.openclaw/workspace/saas-app/.next/cache/webpack/client-production/4.pack 49M
/Users/quentincasares/.openclaw/workspace/saas-app/.next/cache/webpack/client-production/index.pack 19M

## 7. Suspicious Scripts Check
✅ No suspicious script patterns found

## Summary
- Report generated: Tue Feb 24 03:32:40 GMT 2026
- Critical findings: 1

⚠️ ALERT: 1 critical findings require immediate attention!
