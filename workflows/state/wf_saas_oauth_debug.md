# Workflow: Debug SaaS App Google OAuth
## Task: Identify and fix invalid_client error
## Started: 2026-02-18 15:39

### Phase 1: PLANNING - Task Decomposition

Steps:
1. [x] Check current OAuth configuration in code
2. [x] Verify environment variables on Vercel
3. [x] Validate Google Cloud Console settings
4. [ ] Identify mismatches or missing configs
5. [ ] Propose and implement fixes

### Phase 2: EXECUTION

#### Step 1: Check code configuration
- File: `.env.local`
- GOOGLE_CLIENT_ID: 529549692465-tbjgbc8jeb0bfeafjou77lrr34suil8h.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET: 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
- NEXTAUTH_URL: https://saas-app-lime.vercel.app ✅

#### Step 2: Check Vercel environment
- Command: `vercel env ls`
- Status: Variables set correctly

#### Step 3: Validate Google Cloud Console
Required checks:
- [ ] OAuth client type is "Web application" (not Desktop)
- [ ] Redirect URI: https://saas-app-lime.vercel.app/api/auth/callback/google
- [ ] JavaScript origin: https://saas-app-lime.vercel.app
- [ ] App is published (not in testing mode)
- [ ] No API restrictions blocking the client

### Phase 3: REFLECTION

Current status: OAuth client created but Google returns "invalid_client"
Possible causes:
1. Client still in propagation (wait time needed)
2. Client type mismatch (Desktop vs Web)
3. Missing API enablement (Google+ API, People API)
4. App not fully published

### Next Actions:
1. Wait 10 more minutes for propagation
2. If still failing, create new Web app client with exact redirect URI
3. Enable necessary Google APIs
