# Browser Skill Configuration

## Status
- **Skill**: agent-browser-stagehand (via ClawHub)
- **Framework**: Stagehand by Browserbase
- **Chrome**: /Applications/Google Chrome.app ✅
- **CLI**: ~/bin/browser
- **Setup**: ✅ Complete

## Installation Details

```bash
# Stagehand installed globally
npm install -g @browserbasehq/stagehand

# Browser wrapper created at
~/bin/browser
```

## Usage

```bash
# Navigate to a URL
browser navigate https://example.com

# Perform actions
browser act "click the login button"
browser act "fill in the email field with test@example.com"

# Extract data
browser extract "get all product prices"

# Discover elements
browser observe "find all buttons"

# Take screenshot
browser screenshot

# Close browser
browser close
```

## How It Works

Stagehand uses AI (Claude via Anthropic API) to:
- Understand natural language instructions
- Navigate web pages
- Interact with elements
- Extract structured data

## Configuration

**API Key**: Sourced automatically from OpenClaw auth system
- Checks `ANTHROPIC_API_KEY` environment variable
- Falls back to OpenClaw auth profiles

**Chrome Path**: Auto-detected at `/Applications/Google Chrome.app`

## Modes

| Mode | Use Case |
|------|----------|
| **Local** (default) | Development, testing, personal use |
| **Browserbase** (optional) | Production, stealth, proxy, CAPTCHA handling |

To use Browserbase cloud browsers:
```bash
export BROWSERBASE_API_KEY="your-key"
export BROWSERBASE_PROJECT_ID="your-project"
```

## Limitations

- Requires active Chrome installation
- Local mode doesn't handle CAPTCHAs
- Some sites may block automation

## Examples

```bash
# Check flight prices
browser navigate https://google.com/travel/flights
browser act "search for flights from London to Paris tomorrow"
browser extract "get the cheapest flight price"

# Fill a form
browser navigate https://example.com/contact
browser act "fill name with John Doe"
browser act "fill email with john@example.com"
browser act "click submit"
```

## Documentation

- `SKILL.md` - Basic usage
- `EXAMPLES.md` - Detailed examples
- `REFERENCE.md` - API reference
