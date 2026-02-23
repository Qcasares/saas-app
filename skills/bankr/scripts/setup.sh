#!/bin/bash
# Bankr OpenClaw Skill Setup
# Run this to configure Bankr for autonomous trading

echo "📺 Bankr Skill Setup for OpenClaw"
echo "================================"

# Check bankr installation
if ! command -v bankr &> /dev/null; then
    echo "❌ Bankr CLI not found"
    echo "Installing..."
    npm install -g @bankr/cli
fi

echo "✅ Bankr CLI installed: $(bankr --version)"

# Check authentication
echo ""
echo "🔐 Checking authentication..."
if bankr whoami > /dev/null 2>&1; then
    echo "✅ Already authenticated"
    bankr whoami
else
    echo "⚠️  Not authenticated"
    echo ""
    echo "To set up Bankr, run:"
    echo "  bankr login email qcasares@gmail.com"
    echo ""
    echo "Or visit: https://bankr.bot/api"
fi

# Check API key in environment
echo ""
echo "🔑 Environment configuration..."
if [ -n "$BANKR_API_KEY" ]; then
    echo "✅ BANKR_API_KEY is set"
else
    echo "⚠️  BANKR_API_KEY not set in environment"
    echo "   Will attempt to load from ~/.bankr/config.json"
fi

# Create wrapper symlink
echo ""
echo "🔗 Setting up OpenClaw integration..."
WRAPPER="$HOME/.openclaw/workspace/skills/bankr/scripts/bankr"
if [ -f "$WRAPPER" ]; then
    echo "✅ Wrapper script ready"
    chmod +x "$WRAPPER"
else
    echo "❌ Wrapper script not found"
fi

echo ""
echo "================================"
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Authenticate: bankr login email qcasares@gmail.com"
echo "2. Test: bankr prompt 'What is my ETH balance?'"
echo "3. Start trading: bankr prompt 'Buy $50 of ETH on Base'"
