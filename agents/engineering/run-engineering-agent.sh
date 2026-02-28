#!/bin/zsh
# run-engineering-agent.sh — Spawn Architect for daily engineering tasks
# Schedule: 10 AM daily

export OPENCLAW_WORKSPACE=/Users/quentincasares/.openclaw/workspace

cd "$OPENCLAW_WORKSPACE"

# Spawn sub-agent with engineering context
openclaw sessions spawn \
  --runtime subagent \
  --mode run \
  --label "architect-engineering-$(date +%Y%m%d)" \
  --task "You are Architect, the engineering agent. Read your SOUL.md at agents/engineering/SOUL.md. Check for any pending technical tasks: GitHub issues, code reviews needed, infrastructure maintenance, or technical debt. Pick 1-2 high-impact items and work on them. Commit changes with clear messages. Log what you did to intel/TECH-NOTES.md with today's date. If uncertain about priorities, ask Q first."
