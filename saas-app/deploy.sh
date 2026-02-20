#!/bin/bash
# SocialFlow Deployment Script
# Run this to complete the deployment

echo "🚀 SocialFlow Deployment Script"
echo "================================"
echo ""

# Step 1: Register workers.dev subdomain
echo "Step 1: Register workers.dev subdomain"
echo "---------------------------------------"
echo "Please open this URL in your browser:"
echo "https://dash.cloudflare.com/5091ff797e3c9ac9b429ce97faaf0165/workers/onboarding"
echo ""
echo "Choose a subdomain name like: socialflow-api"
echo ""
read -p "Press Enter after you've registered the subdomain..."

# Step 2: Set remaining secrets
echo ""
echo "Step 2: Setting remaining secrets"
echo "----------------------------------"

cd ~/.openclaw/workspace/saas-app/worker

# Stripe secrets
echo "Setting Stripe secrets..."
echo "Enter your Stripe Secret Key (sk_test_... or sk_live_...):"
read -s STRIPE_SECRET
echo "$STRIPE_SECRET" | wrangler secret put STRIPE_SECRET_KEY

echo "Enter your Stripe Webhook Secret (whsec_...):"
read -s STRIPE_WEBHOOK
echo "$STRIPE_WEBHOOK" | wrangler secret put STRIPE_WEBHOOK_SECRET

echo "Enter your Stripe Publishable Key (pk_test_... or pk_live_...):"
read -s STRIPE_PUBLISHABLE
echo "$STRIPE_PUBLISHABLE" | wrangler secret put STRIPE_PUBLISHABLE_KEY

# Resend API Key
echo "Setting Resend API Key..."
echo "Enter your Resend API Key (re_...):"
read -s RESEND_KEY
echo "$RESEND_KEY" | wrangler secret put RESEND_API_KEY

# Social OAuth secrets
echo "Setting Social OAuth secrets..."
echo "Enter Twitter Client ID (or press Enter to skip):"
read TWITTER_ID
if [ ! -z "$TWITTER_ID" ]; then
    echo "$TWITTER_ID" | wrangler secret put TWITTER_CLIENT_ID
fi

echo "Enter Twitter Client Secret (or press Enter to skip):"
read -s TWITTER_SECRET
if [ ! -z "$TWITTER_SECRET" ]; then
    echo "$TWITTER_SECRET" | wrangler secret put TWITTER_CLIENT_SECRET
fi

echo "Enter Instagram Client ID (or press Enter to skip):"
read INSTAGRAM_ID
if [ ! -z "$INSTAGRAM_ID" ]; then
    echo "$INSTAGRAM_ID" | wrangler secret put INSTAGRAM_CLIENT_ID
fi

echo "Enter Instagram Client Secret (or press Enter to skip):"
read -s INSTAGRAM_SECRET
if [ ! -z "$INSTAGRAM_SECRET" ]; then
    echo "$INSTAGRAM_SECRET" | wrangler secret put INSTAGRAM_CLIENT_SECRET
fi

echo "Enter LinkedIn Client ID (or press Enter to skip):"
read LINKEDIN_ID
if [ ! -z "$LINKEDIN_ID" ]; then
    echo "$LINKEDIN_ID" | wrangler secret put LINKEDIN_CLIENT_ID
fi

echo "Enter LinkedIn Client Secret (or press Enter to skip):"
read -s LINKEDIN_SECRET
if [ ! -z "$LINKEDIN_SECRET" ]; then
    echo "$LINKEDIN_SECRET" | wrangler secret put LINKEDIN_CLIENT_SECRET
fi

echo "Enter TikTok Client Key (or press Enter to skip):"
read TIKTOK_KEY
if [ ! -z "$TIKTOK_KEY" ]; then
    echo "$TIKTOK_KEY" | wrangler secret put TIKTOK_CLIENT_KEY
fi

echo "Enter TikTok Client Secret (or press Enter to skip):"
read -s TIKTOK_SECRET
if [ ! -z "$TIKTOK_SECRET" ]; then
    echo "$TIKTOK_SECRET" | wrangler secret put TIKTOK_CLIENT_SECRET
fi

# Step 3: Deploy worker
echo ""
echo "Step 3: Deploying worker"
echo "------------------------"
wrangler deploy

# Step 4: Update frontend env
echo ""
echo "Step 4: Updating frontend environment"
echo "--------------------------------------"
cd ~/.openclaw/workspace/saas-app

# Get the worker URL
WORKER_URL="https://socialflow-api.qcasares.workers.dev"
echo "Worker URL: $WORKER_URL"

# Update .env.local
cat > .env.local << EOF
# Production Environment
NEXTAUTH_URL=https://saas-app-lime.vercel.app
NEXTAUTH_SECRET=production-secret-key-min-32-chars-long

# Worker API URL
NEXT_PUBLIC_WORKER_URL=$WORKER_URL

# Google OAuth (required for Google login)
GOOGLE_CLIENT_ID=529549692465-tbjgbc8jeb0bfeafjou77lrr34suil8h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Email Configuration (using Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@socialflow.app
EOF

# Step 5: Deploy frontend
echo ""
echo "Step 5: Deploying frontend to Vercel"
echo "-------------------------------------"
echo "Building Next.js app..."
npm run build

echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "Worker: $WORKER_URL"
echo "Frontend: https://saas-app-lime.vercel.app"
