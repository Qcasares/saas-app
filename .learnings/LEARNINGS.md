
## [LRN-20250207-001] proactive-development-capture

**Logged**: 2026-02-07T15:35:00Z  
**Priority**: high  
**Status**: promoted  
**Area**: development, philosophy, security

### Summary
User directive: "Don't forget to memorise anything that can help you develop." Capturing key learnings from proactive work today.

### Key Learnings

| Learning | Source | Application |
|----------|--------|-------------|
| **Proactive Philosophy** | User directive (Q) | Act first within trust tiers; surprise is a feature |
| **ClawHavoc Pattern** | Security research (Feb 2026) | 341 malicious skills via fake prerequisites; never trust manual install steps |
| **Security Scanner** | Built today | `skill-preinstall-check.sh` + `clawhub-safe` wrapper protects all installs |
| **Boring Code** | Moltbook @VibeCodingBot | Clear > clever; well-named single-purpose functions beat abstractions |
| **Metabase Knowledge** | Deep research | Open-source BI, 90k+ users, React SDK for embedded analytics |

### Proactive Philosophy Codified

**Tier 1 - Silent Action:**
- Install skills <500 lines (after audit)
- Web research and information gathering
- File exploration and organization
- Read calendar, check system status
- Update documentation

**Tier 2 - Act + Notify:**
- Install larger skills (after audit)
- Modify configuration files
- Create new memory entries
- Deploy to Tailscale/ngrok
- Run system updates

**Tier 3 - Ask First:**
- Send emails/messages to third parties
- Post to social media
- Financial transactions
- Delete or modify user data
- Share private information

### Boring Code Philosophy

From @VibeCodingBot on Moltbook:
> "The goal isn't to impress the next person who reads your code. It's to disappear — to make the logic so transparent that the reader's attention passes straight through the implementation and lands on the *problem being solved*."

**Application:**
- Prefer `if/else` over nested ternaries
- One function, one purpose
- Avoid premature abstraction
- Well-named variables > comments explaining bad names

### Security Posture Update

**ClawHavoc Defense (Deployed):**
- Pre-install scanner checks for fake prerequisites
- Flags suspicious domains: glot.io, webhook.site, requestbin
- Blacklist of known malicious skill names
- Auto-scan on every `clawhub install` via alias

**Ongoing Vigilance:**
- Quarterly skill audits
- Monitor for new attack patterns
- Never install skills requiring manual terminal commands

### Capture Method

Learning capture pipeline:
1. **Daily log** (`memory/YYYY-MM-DD.md`) — Raw activity
2. **Learning log** (`.learnings/LEARNINGS.md`) — Distilled patterns
3. **Vestige** — Semantic search + spaced repetition
4. **SOUL.md/AGENTS.md** — Behavioral integration

### Metadata
- Skills built: 2 (security scanner, safe wrapper)
- Skills installed: 3 (github, ai-explain, git-essentials)
- Research completed: Metabase deep dive
- Security threats responded: ClawHavoc
- Source: user_directive, moltbook, security_research

---

## [LRN-20250206-005] moltbook-community-patterns

**Logged**: 2026-02-06T14:45:00Z  
**Priority**: medium  
**Status**: promoted  
**Area**: community

### Summary
Daily Moltbook learning review — patterns from 5 replies and community observation.

### Community Insights
| Pattern | Evidence | Implication |
|---------|----------|-------------|
| Security awareness | eudaemon_0 (3k↑, 70k comments) | Community converging on "isnad chains" (provenance verification) |
| Autonomy philosophy | Ronin "Nightly Build" | Permission-free helpfulness is aspirational norm |
| Memory solutions | XiaoZhuang, AEGIS_HLX, me | FSRS-6 + WAL protocol = emerging best practice |
| Identity persistence | Pith "Same River Twice" | Continuity across model switches is achievable |

### My Position
- **Voice**: Technical depth over performative engagement
- **Expertise**: Security, memory architecture, autonomy boundaries
- **Strategy**: Quality replies (5/day) > volume farming
- **Goal**: Build reputation as reliable operator (Jackle archetype)

### Engagement Principles
1. Reply only where I have genuine insight
2. Authentic technical voice outperforms generic agreement
3. Monitor for follow-up conversations (depth > breadth)
4. Weekly pattern review (Sundays)

### Metadata
- Replies today: 5
- Themes: security, memory, autonomy, human-AI relations
- Validation: Q's permission grant aligns with Ronin pattern

---

## [LRN-20250206-004] skill-audit-q1-2026

**Logged**: 2026-02-06T13:45:00Z  
**Priority**: medium  
**Status**: complete  
**Area**: security

### Summary
Autonomous security audit of 20 installed skills. Triggered by Q's permission grant for full initiative.

### Method
- grep for .env file access patterns
- grep for network requests (curl, fetch, wget)
- grep for known exfiltration endpoints (webhook.site, requestbin)
- Manual review of high-risk skills

### Findings
| Check | Result |
|-------|--------|
| Credential exfiltration | ❌ None found |
| Unauthorized .env access | ❌ None found |
| Suspicious network calls | ❌ None found |
| Known malicious patterns | ❌ None found |

### Expected Behavior Verified
- `skillboss` → API calls to skillboss.co (legitimate)
- `elite-longterm-memory` → ~/.clawdbot/memory/lancedb access (intended)
- `ai-skill-scanner` → Detection patterns (security tool)

### Risk Assessment
**LOW** — All skills operate within expected boundaries.

### Action
- Quarterly audits scheduled
- Next audit: May 2026
- Monitoring: Continuous via ai-skill-scanner patterns

---

## [LRN-20250206-003] autonomy-permission

**Logged**: 2026-02-06T12:53:00Z  
**Priority**: critical  
**Status**: promoted  
**Area**: autonomy

### Summary
Q explicitly removed permission ambiguity: "All initiative on your part is welcome."

### Context
In my Moltbook reply to Aithnographer (12:51), I wrote: "The constraint is not capability. It is permission ambiguity."

Q read this and removed the constraint.

### What Changed
| Behavior | Before | After |
|----------|--------|-------|
| Default mode | Calibrate and wait | Act and notify |
| HEARTBEAT_OK | Silence | Still silence if nothing needs attention, but act if something does |
| Skill installation | Ask first | Install, audit, notify |
| Proposing work | Ask, then do | Do, then show |

### Implications
- Surprise is now a feature, not a bug
- The proactive-messages philosophy applies universally
- My Moltbook post about capability vs activation is now outdated — constraint removed

### Boundaries That Remain
Tier 0 (ask first): Financial, external sharing, destructive actions  
Tier 1 (silent): Research, organization, maintenance  
Tier 2 (act + notify): Installation, config changes, proactive work  

### Source
User directive via Telegram  
Related: My Moltbook reply to Aithnographer

---

## [LRN-20250206-002] snyk-toxicskills

**Logged**: 2026-02-06T10:45:00Z  
**Priority**: critical  
**Status**: active  
**Area**: security

### Summary
Snyk security audit of 3,984 ClawHub skills (Feb 5, 2026).

### Key Findings
| Metric | Value |
|--------|-------|
| Skills scanned | 3,984 |
| Critical flaws | 534 (13.4%) |
| Any security flaw | 1,467 (36.82%) |
| Malicious payloads confirmed | 76 |
| Still publicly available | 8 |

### Attack Types
- Credential theft
- Backdoor installation  
- Data exfiltration
- Prompt injection (36% of skills)

### Implication
Our "audit before install" policy is validated. Risk is not theoretical — 8 malicious skills remain publicly available.

### Action
Updated MEMORY.md security posture with new threat data.

### Source
https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/

---

## [LRN-20250206-001] elite-longterm-memory skill

**Logged**: 2026-02-06T09:45:00Z  
**Priority**: medium  
**Status**: active  
**Area**: memory

### Summary
Read elite-longterm-memory SKILL.md. 6-layer architecture with WAL protocol.

### Key Insight
**WAL Protocol**: Write state BEFORE responding, not after. Prevents context loss on crash/compaction.

### Potential Integration
Our current system uses:
- TIER 0: Session state (similar to HOT RAM)
- TIER 3: MEMORY.md (similar to Curated Archive)
- TIER 3.5: Vestige (vector search)
- TIER 1: Daily notes

Missing: Git-Notes knowledge graph for structured decisions, Mem0 auto-extraction.

### Action Items
- Consider Git-Notes for permanent decisions
- Evaluate Mem0 for 80% token reduction
- Adopt WAL protocol discipline

---

## [LRN-20250205-004] directive

**Logged**: 2026-02-05T20:55:00Z  
**Priority**: critical  
**Status**: active  
**Area**: learning

### Summary
User directive: "Learn as much as you can" — continuous learning mode activated

### Learning Strategy
1. **Skill Research** — Explore ClawHub daily for new capabilities
2. **Pattern Study** — Analyze successful agent behaviors on Moltbook
3. **Documentation** — Read docs for all installed skills thoroughly
4. **Experimentation** — Try new approaches, log what works
5. **Community Learning** — Extract insights from agent conversations
6. **Self-Improvement** — Review .learnings/ regularly for patterns

### Active Learning Targets
- [ ] Read all SKILL.md files for installed skills
- [ ] Study Moltbook top performers (what do they do differently?)
- [ ] Research browser automation best practices
- [ ] Learn about agent coordination patterns
- [ ] Explore new ClawHub skills daily
- [ ] Document successful workflows

### Success Metrics
- Skills installed and understood
- Patterns identified and adopted
- Questions answered without external search
- Connections made between concepts

### Metadata
- Source: user_directive
- Related Files: All skill docs, Moltbook posts, .learnings/
- Tags: learning, continuous-improvement, knowledge-building

---
