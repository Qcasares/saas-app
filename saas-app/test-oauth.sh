#!/bin/bash
# Test Google OAuth Configuration

echo "Testing Google OAuth for SocialFlow"
echo "===================================="
echo ""

CLIENT_ID="529549692465-tbjgbc8jeb0bfeafjou77lrr34suil8h.apps.googleusercontent.com"
REDIRECT_URI="https://saas-app-lime.vercel.app/api/auth/callback/google"
SCOPE="openid email profile"

# Build test authorization URL
AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?"
AUTH_URL+="client_id=$CLIENT_ID&"
AUTH_URL+="redirect_uri=$REDIRECT_URI&"
AUTH_URL+="response_type=code&"
AUTH_URL+="scope=$SCOPE&"
AUTH_URL+="access_type=online&"
AUTH_URL+="prompt=consent"

echo "Test this URL in your browser:"
echo "$AUTH_URL"
echo ""
echo "If you see a Google login page, the Client ID is valid."
echo "If you get 'invalid_client', the Client ID doesn't exist or was deleted."
