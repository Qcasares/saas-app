#!/bin/zsh
# run-content-agent.sh — Spawn Scribe for content drafting
# Schedule: 9 AM, 5 PM daily

export OPENCLAW_WORKSPACE=/Users/quentincasares/.openclaw/workspace

cd "$OPENCLAW_WORKSPACE"

# Check if intel file exists and has fresh content
if [[ ! -f "intel/DAILY-INTEL.md" ]]; then
  echo "No DAILY-INTEL.md found. Skipping content generation."
  exit 0
fi

# Spawn sub-agent with content context
openclaw sessions spawn \
  --runtime subagent \
  --mode run \
  --label "scribe-content-$(date +%Y%m%d-%H%M)" \
  --task "You are Scribe, the content agent. Read your SOUL.md at agents/content/SOUL.md, then read intel/DAILY-INTEL.md. Draft 2-3 pieces of content (X/Twitter and/or LinkedIn) based on the research. Write your drafts to intel/CONTENT-DRAFTS.md with today's date. Match Q's voice: executive presence, no emojis/hashtags, short punchy sentences. Save as 'pending review' — don't auto-post."
