# SocialFlow - SaaS Application Setup Guide

## Overview

SocialFlow is a full-stack SaaS application with authentication, user management, and subscription features built with:

- **Frontend**: Next.js 14 with React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js v5 with Google OAuth and Email OTP
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite-based)

## Authentication Features

✅ **Google OAuth** - Sign in with Google  
✅ **Email OTP** - Passwordless email verification  
✅ **Session Management** - JWT-based sessions  
✅ **Route Protection** - Automatic redirects for protected routes  
✅ **User Dashboard** - Real user data from database  
✅ **Account Settings** - Profile management  

## Required Credentials Setup

### 1. Google OAuth (Required for Google login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure consent screen if needed
6. For **Application type**, select **Web application**
7. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret** to `.env.local`

### 2. Resend Email API (Required for Email OTP)

1. Sign up at [Resend](https://resend.com)
2. Get your API key from the dashboard
3. Add to `.env.local`
4. Verify your domain or use the test domain

### 3. D1 Database Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Create D1 database:
   ```bash
   wrangler d1 create saas-app-db
   ```

4. Copy the database ID to `worker/wrangler.toml`

5. Run migrations:
   ```bash
   cd worker
   wrangler d1 migrations apply DB
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-min-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Worker API
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
```

## Local Development

### Start the Next.js App

```bash
npm run dev
```
App runs at http://localhost:3000

### Start the Worker (in another terminal)

```bash
cd worker
npm install
wrangler dev
```
Worker runs at http://localhost:8787

### Set Worker Secrets

```bash
cd worker
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

## Database Schema

The schema includes:
- **users** - User accounts
- **accounts** - OAuth provider connections
- **sessions** - Active sessions (for database strategy)
- **subscriptions** - Plan subscriptions
- **social_accounts** - Connected social platforms
- **otp_codes** - Email verification codes

See `db/schema.sql` and `db/migrations/` for full schema.

## Deployment

### Deploy the Worker

```bash
cd worker
wrangler deploy
```

### Deploy the Next.js App

For Vercel:
```bash
vercel
```

For Cloudflare Pages:
```bash
npm run build
# Upload dist folder to Pages
```

## Authentication Flow

1. **Google OAuth**:
   - User clicks "Continue with Google"
   - Redirected to Google consent screen
   - Returns with credentials, creates/updates user
   - JWT session created, redirected to dashboard

2. **Email OTP**:
   - User enters email, clicks "Continue"
   - 6-digit code sent via email
   - User enters code, account created/verified
   - JWT session created, redirected to dashboard

## File Structure

```
saas-app/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth API endpoint
│   ├── api/user/profile/route.ts         # User profile API
│   ├── (auth)/
│   │   ├── login/page.tsx               # Login page
│   │   └── register/page.tsx            # Register page
│   ├── dashboard/
│   │   ├── page.tsx                     # Dashboard (server)
│   │   ├── DashboardClient.tsx          # Dashboard (client)
│   │   └── settings/                    # Settings pages
│   ├── layout.tsx
│   └── providers.tsx
├── lib/
│   └── auth.ts                          # NextAuth configuration
├── middleware.ts                        # Route protection
├── db/
│   ├── schema.sql                       # Initial schema
│   └── migrations/                      # Migration files
├── worker/                              # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts                     # Worker entry
│   │   ├── routes/auth.ts               # Auth routes
│   │   └── db/                          # Database helpers
│   └── wrangler.toml                    # Worker config
└── .env.local                           # Local environment
```

## Testing

1. **Test Email OTP** (without Resend):
   - OTP codes are logged to console when RESEND_API_KEY is not set
   - Check terminal for `OTP for email@example.com: 123456`

2. **Test Google OAuth**:
   - Must have valid Google credentials
   - Use http://localhost:3000 for local testing

3. **Protected Routes**:
   - Try accessing `/dashboard` without logging in
   - Should redirect to `/login`

## Troubleshooting

**Build Error**: `D1Database not found`
- Ensure you're running with Wrangler (worker:dev) for DB access
- For local dev, the DB binding comes from wrangler.toml

**Session not persisting**:
- Check NEXTAUTH_SECRET is set
- Ensure cookies are not blocked
- Check browser console for errors

**Email not sending**:
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for delivery status
- For testing, check console for logged OTP codes

## Next Steps

1. Set up Stripe for payments (subscriptions already in schema)
2. Add social media platform integrations
3. Implement post scheduling
4. Add analytics dashboard
5. Set up webhooks for real-time updates

## Support

For issues or questions, check:
- NextAuth.js docs: https://next-auth.js.org/
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- D1 docs: https://developers.cloudflare.com/d1/
