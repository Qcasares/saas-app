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

### Calendar

- **accli** — Apple Calendar CLI for macOS
  - List calendars, view/create/update events, check availability
  - Usage: `accli events Work --json`, `accli create Work --summary "Meeting" --start ...`

### Web Scraping

- **firecrawl-skills** — Structured web scraping and crawling
  - Scrape single pages, crawl entire sites, search with content extraction
  - Returns clean markdown optimized for LLMs
  - Usage: `firecrawl search "query"`, `firecrawl scrape https://example.com`

---

Add whatever helps you do your job. This is your cheat sheet.
