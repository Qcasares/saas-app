#!/bin/zsh
# run-research-agent.sh — Spawn Sherlock for research sweep
# Schedule: 8 AM, 2 PM, 6 PM daily

export OPENCLAW_WORKSPACE=/Users/quentincasares/.openclaw/workspace

cd "$OPENCLAW_WORKSPACE"

# Spawn sub-agent with research context
openclaw sessions spawn \
  --runtime subagent \
  --mode run \
  --label "sherlock-research-$(date +%Y%m%d-%H%M)" \
  --task "You are Sherlock, the research agent. Read your SOUL.md at agents/research/SOUL.md, then perform a comprehensive research sweep. Check X/Twitter for AI/data trends, Hacker News top stories, GitHub trending repos, and any relevant papers. Write your findings to intel/DAILY-INTEL.md with today's date. Be thorough but prioritize signal over noise. Every claim needs a source link."
