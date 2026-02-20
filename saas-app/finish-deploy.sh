#!/bin/bash
# Complete Vercel Deployment
# Run this to finish deployment

echo "🚀 Completing Vercel Deployment"
echo "================================"
echo ""

# Check if already logged in
if vercel whoami > /dev/null 2>&1; then
    echo "✅ Already logged in to Vercel"
else
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

# Navigate to project
cd ~/.openclaw/workspace/saas-app

# Deploy to production
echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Summary:"
echo "-----------"
echo "Worker: https://socialflow-api.qcasares.workers.dev"
echo "Frontend: Will be shown after Vercel deploy"
echo ""
echo "⚠️  Remaining tasks:"
echo "1. Set Resend API key for email OTP"
echo "2. Set Stripe keys for payments"
echo "3. Configure social OAuth apps"
