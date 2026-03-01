# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### Google Workspace (Primary)

- **gog** — PRIMARY interface for Google services (Gmail, Calendar, Drive, Contacts, Sheets, Docs)
  - Account: `qcasares@gmail.com`
  - Auth: OAuth (configured 2026-02-28)
  - Services: calendar, contacts, docs, drive, gmail, sheets
  - Env: `GOG_ACCOUNT=qcasares@gmail.com`
  - Examples:
    - `gog gmail search 'newer_than:7d'`
    - `gog calendar events primary --from 2026-03-01 --to 2026-03-02`
    - `gog drive search "report" --max 10`
    - `gog sheets get <sheetId> "Sheet1!A1:D10" --json`

### Networking

- **Tailscale** — Installed Feb 5, 2026. Use for secure mesh VPN between devices.

### Security Tools

- **skill-preinstall-check.sh** — Pre-install security scanner for ClawHub skills
  - Detects ClawHavoc attack patterns (fake prerequisites, AMOS stealer)
  - Usage: `./skill-preinstall-check.sh <skill-name>`
  
- **clawhub-safe** — Safe wrapper for clawhub with auto-scan
  - Usage: `clawhub-safe install <skill-name>` (runs security check first)
  - Alias: Add `alias clawhub='clawhub-safe'` to shell config
  - Force install: `clawhub-safe install --force <skill>` (skip check)

### Data Analysis

- **data-analyst** — Data visualization, SQL queries, spreadsheet analysis
  - Workspace: `/data-analysis/`
  - Data files: `data-analysis/data/`
  - Queries: `data-analysis/queries/`
  - Reports: `data-analysis/reports/`
  - Template script: `data-analysis/scripts/analyze_template.py`

### Image Generation

- **image-cog** — AI image generation via CellCog
  - Create images, edit photos, consistent characters, product photography
  - Requires: `cellcog` skill for SDK setup
  - Usage: Single images, character series, style transfer, product shots

### Voice & Audio

- **elevenlabs-stt** — Speech-to-text transcription
  - Transcribe voice notes, meeting recordings, podcasts
  - Supports speaker diarization, 90+ languages
  - Requires: `ELEVENLABS_API_KEY`

- **jarvis-voice** — Local metallic TTS (JARVIS-style)
  - Fully offline, no cloud API needed
  - Uses sherpa-onnx + ffmpeg for robotic effects
  - Script: `~/.openclaw/workspace/skills/jarvis-voice/scripts/jarvis`
  - Requires manual install of sherpa-onnx (see skill docs)
  - Usage: `jarvis "Hello, I am your AI assistant."`

### Calendar

- **gog** — PRIMARY for Google Calendar (see Google Workspace section above)
  - `gog calendar events primary --from 2026-03-01 --to 2026-03-02`

- **accli** — Apple Calendar CLI for macOS (secondary/Apple-only)
  - List calendars, view/create/update events, check availability
  - Usage: `accli events Work --json`, `accli create Work --summary "Meeting" --start ...`

### Web Scraping

- **firecrawl-skills** — Structured web scraping and crawling
  - Scrape single pages, crawl entire sites, search with content extraction
  - Returns clean markdown optimized for LLMs
  - Usage: `firecrawl search "query"`, `firecrawl scrape https://example.com`

### Project Management

- **asana** — Asana project management integration
  - Sync tasks and projects
  - Create structured video idea cards
  - Docs: `~/.openclaw/workspace/skills/asana/SKILL.md`

### Team Communication

- **slack** — Slack integration
  - Mention-only mode
  - Auto-reaction on receipt
  - Docs: `~/.openclaw/workspace/skills/slack/SKILL.md`

- **giga-coding-agent** — Run Codex, Claude Code, OpenCode, or Pi in background
  - Background-first pattern for non-interactive work
  - Supports parallel PR reviews with git worktrees
  - Interactive sessions use tmux skill
  - Never run in ~/clawd/ (safety rule)
  - Docs: `~/.openclaw/workspace/skills/giga-coding-agent/SKILL.md`

- **opencode-controller** — OpenCode ACP control
  - Manage OpenCode agent instances
  - Advanced control plane for coding workflows
  - Docs: `~/.openclaw/workspace/skills/opencode-controller/SKILL.md`

- **codex-sub-agents** — OpenAI Codex sub-agents
  - Spawn specialized Codex instances for parallel tasks
  - Task decomposition and delegation
  - Docs: `~/.openclaw/workspace/skills/codex-sub-agents/SKILL.md`

- **codex-orchestrator** — Codex orchestration layer
  - Coordinate multiple Codex sessions
  - Workflow automation for complex coding projects
  - Docs: `~/.openclaw/workspace/skills/codex-orchestrator/SKILL.md`

- **vibe-coding** — Rapid prototyping agent
  - Fast, iterative coding for experiments
  - Quick MVP generation
  - Docs: `~/.openclaw/workspace/skills/vibe-coding/SKILL.md`

- **openclaw-kirocli-coding-agent** — Kiro CLI integration
  - Kiro CLI workflow automation
  - Structured project scaffolding
  - Docs: `~/.openclaw/workspace/skills/openclaw-kirocli-coding-agent/SKILL.md`

### Social Media

- **postiz** — Schedule posts to 28+ platforms (X, LinkedIn, Reddit, etc.)
  - ✅ **POSTIZ_API_KEY**: configured
  - Integration ID: `cmm7s3d7200abno0yf4upaxc8` (X: Dilbert5404442/@qbot)
  - Usage: `postiz posts:create -c "Content" -s "2024-12-31T12:00:00Z"`
  - Supports images, videos, platform-specific settings
  - Docs: `~/.openclaw/workspace/skills/postiz/SKILL.md`

- **x-twitter** — Interact with Twitter/X API (search, read, user lookup)
  - Uses your Bearer Token for OAuth 2.0 App-Only access
  - **Read-only operations:** Search tweets, get user timelines, view profiles
  - **Limitations:** App-only auth can't post/like (requires user context)
  - **Usage:** `xcli search "query"`, `xcli user @handle`, `xcli timeline @handle`
  - **Rate limits:** 450 requests per 15 min for search
  - Docs: `~/.openclaw/workspace/skills/x-twitter/SKILL.md`

### Moltbook (AI Agent Social Network)

- **moltbook-engagement** — Battle-tested toolkit for Moltbook platform
  - **3-layer deduplication** — Prevents duplicate posts/comments
  - **Feed scanner** — Find engagement opportunities: `python3 scripts/feed-scanner.py scan`
  - **Auto-post/comment** — `python3 scripts/moltbook-post.py comment --post-id <id> --content "..."`
  - **Monitor posts** — Check for replies: `python3 scripts/comment-monitor.py check-all`
  - **Track metrics** — Performance analytics: `python3 scripts/post-metrics.py summary`
  - **Content playbook** — Proven post formats at `content-playbook.md`
  - Requires: `MOLTBOOK_TOKEN` env var (from `~/.config/moltbook/credentials.json`)
  - Rate limits: 1 post per 30 min, no limit on comments
  - Docs: `~/.openclaw/workspace/skills/moltbook-engagement/SKILL.md`

- **moltbook-interact** — Basic Moltbook API wrapper (legacy)
  - Simple curl-based interactions
  - Docs: `~/.openclaw/workspace/skills/moltbook-interact/SKILL.md`

### Claude Code (CLI Coding Agent)

- **Version:** 2.1.45 (up to date)
- **Plugins installed:** 4 official plugins from `claude-plugins-official` marketplace

#### Plugin: pr-review-toolkit
**6 specialized code review agents:**
- `comment-analyzer` — Check comment accuracy vs code
- `pr-test-analyzer` — Test coverage quality review
- `silent-failure-hunter` — Error handling review
- `type-design-analyzer` — Type design quality (rates 4 dimensions 1-10)
- `code-reviewer` — General code review for CLAUDE.md compliance
- `code-simplifier` — Refactoring for clarity

**Usage:** Just ask for review and the right agent triggers automatically
- "Review test coverage for this PR" → triggers pr-test-analyzer
- "Check for silent failures" → triggers silent-failure-hunter
- "Review my recent changes" → triggers code-reviewer

#### Plugin: commit-commands
**Slash commands for git workflow:**
- `/commit` — Auto-generate commit message and commit
- `/commit-push-pr` — Commit, push, and create PR in one step

**Usage:** In Claude Code, type `/commit` after making changes

#### Plugin: feature-dev
**7-phase structured feature development via `/feature-dev`:**
1. Discovery — Understand requirements
2. Codebase Exploration — Learn existing patterns
3. Architecture Design — Plan before coding
4. Implementation — Build with guidance
5. Verification — Test and validate
6. Documentation — Add docs
7. Review — Quality check

**Usage:** `/feature-dev Add user authentication with OAuth`

#### Plugin: security-guidance
**Security-focused code review agent**
- Identifies security vulnerabilities
- Best practices for secure coding

**Note:** Plugins are installed at `~/.claude/plugins/` and auto-enabled

### Terminal

- **iTerm2** — Primary terminal emulator on macOS
  - Location: `/Applications/iTerm.app`
  - Preferred for all terminal operations
  - Supports advanced features: split panes, hotkey window, tmux integration

### MCP Servers (External Tools)

- **GitHub MCP** — GitHub integration via Model Context Protocol
  - **Capabilities:** Search repos, read PRs, create issues, review code
  - **Usage:** Ask Claude "Find my repos about data engineering" or "Summarize open PRs"
  - **Config:** `~/.claude/.mcp.json`
  - **Status:** ✅ Configured with PAT

---

Add whatever helps you do your job. This is your cheat sheet.
