# SocialFlow - Social Media Management Platform

A comprehensive, production-ready SaaS platform for managing social media accounts across Twitter/X, Instagram, LinkedIn, and TikTok.

## Features

### ✅ Core Features Implemented

1. **Authentication**
   - Google OAuth integration
   - Email OTP (One-Time Password) authentication
   - JWT-based session management

2. **Social Media Integrations**
   - **Twitter/X**: OAuth 2.0, post tweets with media, schedule tweets, thread creation, analytics
   - **Instagram**: OAuth connection, post photos/videos, schedule posts, analytics
   - **LinkedIn**: OAuth 2.0, post to profile/company pages, schedule posts, analytics
   - **TikTok**: OAuth connection, video upload, schedule posts, analytics

3. **Content Calendar**
   - Monthly/weekly/daily views
   - Color-coded by platform and status
   - Click to view/edit posts
   - Bulk actions (delete, reschedule)
   - Filter by platform, status

4. **Analytics Dashboard**
   - Follower growth charts
   - Engagement rate trends
   - Post performance comparison
   - Platform breakdown pie charts
   - Date range selector
   - Export to CSV

5. **Stripe Payments**
   - 3-tier pricing (Starter $9, Pro $29, Enterprise $99)
   - Monthly/Yearly billing
   - Checkout flow
   - Customer portal for subscription management
   - Webhook handling for subscriptions

6. **Teams & Collaboration**
   - Invite team members by email
   - Role-based access (owner, admin, editor, viewer)
   - Activity logs
   - Post comments

7. **Media Library**
   - Upload images/videos
   - Organize in folders
   - Search/filter
   - Reuse across posts

8. **Notifications**
   - In-app notifications
   - Email notifications (post published/failed, team invites, etc.)

9. **Settings & Configuration**
   - Connected accounts management
   - Brand settings
   - Billing history
   - API keys management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe
- **Charts**: Recharts
- **UI Components**: Radix UI + shadcn/ui

## Project Structure

```
saas-app/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes (login, register, callback)
│   ├── api/               # API routes (proxy to worker)
│   ├── dashboard/         # Dashboard pages
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── calendar/      # Content calendar
│   │   ├── posts/         # Posts list & create
│   │   ├── accounts/      # Connected accounts
│   │   ├── billing/       # Subscription management
│   │   ├── settings/      # User settings
│   │   └── page.tsx       # Dashboard home
│   ├── pricing/           # Pricing page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
├── worker/               # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts      # Main worker entry
│   │   ├── routes/       # API routes
│   │   │   ├── auth.ts
│   │   │   ├── social.ts
│   │   │   ├── posts.ts
│   │   │   ├── analytics.ts
│   │   │   ├── subscriptions.ts
│   │   │   ├── teams.ts
│   │   │   ├── media.ts
│   │   │   ├── notifications.ts
│   │   │   └── webhooks.ts
│   │   ├── db/           # Database helpers
│   │   └── utils/        # Utilities
│   └── migrations/       # Database migrations
├── .env.example          # Environment variables template
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (for D1 database)
- Stripe account (for payments)
- OAuth app credentials for each social platform

### 1. Clone and Install

```bash
git clone <repo-url>
cd saas-app
npm install
cd worker
npm install
cd ..
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `RESEND_API_KEY`: For email OTP
- `WORKER_URL`: Your worker URL

### 3. Set up Cloudflare D1 Database

```bash
cd worker
wrangler d1 create saas-app-db
# Note the database_id from output
```

Update `wrangler.toml` with your database_id.

### 4. Run Database Migrations

```bash
wrangler d1 migrations apply DB --local
```

### 5. Configure Worker Secrets

```bash
# Set all required secrets
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put TWITTER_CLIENT_ID
wrangler secret put TWITTER_CLIENT_SECRET
# ... etc for all OAuth providers
```

### 6. Run Development Servers

Terminal 1 - Worker:
```bash
cd worker
wrangler dev
```

Terminal 2 - Next.js:
```bash
npm run dev
```

### 7. Deploy

Deploy the worker:
```bash
cd worker
wrangler deploy
```

Deploy the Next.js app (using your preferred hosting):
```bash
npm run build
# Deploy to Vercel, Netlify, etc.
```

## OAuth Setup

### Twitter/X
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app
3. Set callback URL: `https://your-worker.workers.dev/social/twitter/callback`
4. Copy Client ID and Secret

### Instagram
1. Go to https://developers.facebook.com/apps
2. Create app → Select "Other"
3. Add Instagram Basic Display product
4. Set callback URL: `https://your-worker.workers.dev/social/instagram/callback`
5. Copy App ID and Secret

### LinkedIn
1. Go to https://www.linkedin.com/developers/apps
2. Create new app
3. Set callback URL: `https://your-worker.workers.dev/social/linkedin/callback`
4. Copy Client ID and Secret

### TikTok
1. Go to https://developers.tiktok.com/
2. Create a new app
3. Set callback URL: `https://your-worker.workers.dev/social/tiktok/callback`
4. Copy Client Key and Secret

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email
- `POST /api/auth/otp` - Request/generate OTP
- `POST /api/auth/google` - Google OAuth

### Social Accounts
- `GET /api/social/accounts` - List connected accounts
- `DELETE /api/social/accounts/:id` - Disconnect account
- `GET /api/social/connect/:platform` - Initiate OAuth
- `GET /api/social/callback/:platform` - OAuth callback

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/bulk-delete` - Bulk delete
- `POST /api/posts/bulk-reschedule` - Bulk reschedule
- `GET /api/posts/calendar` - Get posts for calendar

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/account/:id` - Account analytics
- `GET /api/analytics/posts` - Post performance
- `GET /api/analytics/export` - Export data

### Subscriptions
- `GET /api/subscriptions/plans` - List plans
- `GET /api/subscriptions/current` - Current subscription
- `POST /api/subscriptions/checkout` - Create checkout
- `POST /api/subscriptions/portal` - Customer portal

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team
- `POST /api/teams/:id/invite` - Invite member
- `POST /api/teams/accept-invite` - Accept invitation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
# Deployment trigger
