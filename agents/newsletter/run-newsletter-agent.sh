#!/bin/zsh
# run-newsletter-agent.sh — Spawn Editor for weekly newsletter
# Schedule: Sunday 6 PM

export OPENCLAW_WORKSPACE=/Users/quentincasares/.openclaw/workspace

cd "$OPENCLAW_WORKSPACE"

# Collect last 7 days of intel files
# Spawn sub-agent with newsletter context
openclaw sessions spawn \
  --runtime subagent \
  --mode run \
  --label "editor-newsletter-$(date +%Y%m%d)" \
  --task "You are Editor, the newsletter agent. Read your SOUL.md at agents/newsletter/SOUL.md. Compile the weekly newsletter from the past 7 days of intel in intel/DAILY-INTEL.md and any content drafts in intel/CONTENT-DRAFTS.md. Create a cohesive digest with a narrative thread. Save to intel/NEWSLETTER-DRAFT.md with this week's date range. Aim for 5-minute read max. End with something thought-provoking. Status: pending review."
