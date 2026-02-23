---
name: bankr
description: AI-powered crypto trading agent and LLM gateway via natural language. Use when the user wants to trade crypto, check portfolio balances, view token prices, transfer crypto, manage NFTs, use leverage, bet on Polymarket, deploy tokens, set up automated trading, sign and submit raw transactions, or access LLM models through the Bankr LLM gateway funded by your Bankr wallet. Supports Base, Ethereum, Polygon, Solana, and Unichain.
metadata:
  {
    "clawdbot":
      {
        "emoji": "📺",
        "homepage": "https://bankr.bot",
        "requires": { "bins": ["bankr"] },
      },
  }
---

# Bankr

Execute crypto trading and DeFi operations using natural language. Two integration options:

1. **Bankr CLI** (recommended) — Install `@bankr/cli` for a batteries-included terminal experience
2. **REST API** — Call `https://api.bankr.bot` directly from any language or tool

Both use the same API key and the same async job workflow under the hood.

## Getting an API Key

Before using either option, you need a Bankr API key. Two ways to get one:

**Option A: Headless email login (recommended for agents)**

Two-step flow — send OTP, then verify and complete setup. See "First-Time Setup" below for the full guided flow with user preference prompts.

```bash
# Step 1 — send OTP to email
bankr login email user@example.com

# Step 2 — verify OTP and generate API key (options based on user preferences)
bankr login email user@example.com --code 123456 --accept-terms --key-name "My Agent" --read-write
```

This creates a wallet, accepts terms, and generates an API key — no browser needed. Before running step 2, ask the user whether they need read-only or read-write access, LLM gateway, and their preferred key name.

**Option B: Bankr Terminal**

1. Visit [bankr.bot/api](https://bankr.bot/api)
2. **Sign up / Sign in** — Enter your email and the one-time passcode (OTP) sent to it
3. **Generate an API key** — Create a key with **Agent API** access enabled (the key starts with `bk_...`)

Both options automatically provision **EVM wallets** (Base, Ethereum, Polygon, Unichain) and a **Solana wallet** — no manual wallet setup needed.

## Option 1: Bankr CLI (Recommended)

### Install

```bash
bun install -g @bankr/cli
```

Or with npm:

```bash
npm install -g @bankr/cli
```

### First-Time Setup

#### Headless email login (recommended for agents)

When the user asks to log in with an email, walk them through this flow:

**Step 1 — Send verification code**

```bash
bankr login email <user-email>
```

**Step 2 — Ask the user for the OTP code** they received via email.

**Step 3 — Before completing login, ask the user about their preferences:**

1. **Accept Terms of Service** — Present the [Terms of Service](https://bankr.bot/terms) link and confirm the user agrees. Required for new users — do not pass `--accept-terms` unless the user has explicitly confirmed.
2. **Read-only or read-write API key?**
   - **Read-only** (default) — portfolio, balances, prices, research only
   - **Read-write** (`--read-write`) — enables swaps, transfers, orders, token launches, leverage, Polymarket bets
3. **Enable LLM gateway access?** (`--llm`) — multi-model API at `llm.bankr.bot` (currently limited to beta testers). Skip if user doesn't need it.
4. **Key name?** (`--key-name`) — a display name for the API key (e.g. "My Agent", "Trading Bot")

**Step 4 — Construct and run the step 2 command** with the user's choices:

```bash
# Example with all options
bankr login email <user-email> --code <otp> --accept-terms --key-name "My Agent" --read-write --llm

# Example read-only, no LLM
bankr login email <user-email> --code <otp> --accept-terms --key-name "Research Bot"
```

#### Login options reference

| Option | Description |
|--------|-------------|
| `--code <otp>` | OTP code received via email (step 2) |
| `--accept-terms` | Accept [Terms of Service](https://bankr.bot/terms) without prompting (required for new users) |
| `--key-name <name>` | Display name for the API key (e.g. "My Agent"). Prompted if omitted |
| `--read-write` | Enable write operations: swaps, transfers, orders, token launches, leverage, Polymarket bets. **Without this flag, the key is read-only** (portfolio, balances, prices, research only) |
| `--llm` | Enable [LLM gateway](https://docs.bankr.bot/llm-gateway/overview) access (multi-model API at `llm.bankr.bot`). Currently limited to beta testers |

Any option not provided on the command line will be prompted interactively by the CLI, so you can mix headless and interactive as needed.

#### Login with existing API key

If the user already has an API key:

```bash
bankr login --api-key bk_YOUR_KEY_HERE
```

If they need to create one at the Bankr Terminal:
1. Run `bankr login --url` — prints the terminal URL
2. Present the URL to the user, ask them to generate a `bk_...` key
3. Run `bankr login --api-key bk_THE_KEY`

#### Separate LLM Gateway Key (Optional)

If your LLM gateway key differs from your API key, pass `--llm-key` during login or run `bankr config set llmKey YOUR_LLM_KEY` afterward. When not set, the API key is used for both. See [references/llm-gateway.md](references/llm-gateway.md) for full details.

#### Verify Setup

```bash
bankr whoami
bankr prompt "What is my balance?"
```

## Option 2: REST API (Direct)

No CLI installation required — call the API directly with `curl`, `fetch`, or any HTTP client.

### Authentication

All requests require an `X-API-Key` header:

```bash
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: bk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is my ETH balance?"}'
```

### Quick Example: Submit → Poll → Complete

```bash
# 1. Submit a prompt — returns a job ID
JOB=$(curl -s -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is my ETH balance?"}')
JOB_ID=$(echo "$JOB" | jq -r '.jobId')

# 2. Poll until terminal status
while true; do
  RESULT=$(curl -s "https://api.bankr.bot/agent/job/$JOB_ID" \
    -H "X-API-Key: $BANKR_API_KEY")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ] && break
  sleep 2
done

# 3. Read the response
echo "$RESULT" | jq -r '.response'
```

### Conversation Threads

Every prompt response includes a `threadId`. Pass it back to continue the conversation:

```bash
# Start — the response includes a threadId
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the price of ETH?"}'
# → {"jobId": "job_abc", "threadId": "thr_XYZ", ...}

# Continue — pass threadId to maintain context
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "And what about SOL?", "threadId": "thr_XYZ"}'
```

Omit `threadId` to start a new conversation. CLI equivalent: `bankr prompt --continue` (reuses last thread) or `bankr prompt --thread <id>`.

### API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/prompt` | POST | Submit a prompt (async, returns job ID) |
| `/agent/job/{jobId}` | GET | Check job status and results |
| `/agent/job/{jobId}/cancel` | POST | Cancel a running job |
| `/agent/sign` | POST | Sign messages/transactions (sync) |
| `/agent/submit` | POST | Submit raw transactions (sync) |

### Synchronous Endpoints

For direct signing and transaction submission, Bankr also provides synchronous endpoints:

- **POST /agent/sign** - Sign messages, typed data, or transactions without broadcasting
- **POST /agent/submit** - Submit raw transactions directly to the blockchain

## CLI Command Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `bankr login` | Authenticate with the Bankr API (interactive menu) |
| `bankr login email <address>` | Send OTP to email (headless step 1) |
| `bankr login email <address> --code <otp> [options]` | Verify OTP and complete setup (headless step 2) |
| `bankr login --api-key <key>` | Login with an existing API key directly |
| `bankr logout` | Clear stored credentials |
| `bankr whoami` | Show current authentication info |
| `bankr prompt <text>` | Send a prompt to the Bankr AI agent |
| `bankr prompt --continue <text>` | Continue the most recent conversation thread |
| `bankr status <jobId>` | Check the status of a running job |
| `bankr cancel <jobId>` | Cancel a running job |
| `bankr skills` | Show all Bankr AI agent skills with examples |

### LLM Gateway Commands

| Command | Description |
|---------|-------------|
| `bankr llm models` | List available LLM models |
| `bankr llm credits` | Check credit balance |

## Capabilities Overview

### Trading Operations

- **Token Swaps**: Buy/sell/swap tokens across chains
- **Cross-Chain**: Bridge tokens between chains
- **Limit Orders**: Execute at target prices
- **Stop Loss**: Automatic sell protection
- **DCA**: Dollar-cost averaging strategies
- **TWAP**: Time-weighted average pricing

### Portfolio Management

- Check balances across all chains
- View USD valuations
- Track holdings by token or chain
- Real-time price updates
- Multi-chain aggregation

### Market Research

- Token prices and market data
- Technical analysis (RSI, MACD, etc.)
- Social sentiment analysis
- Price charts
- Trending tokens

### Supported Chains

| Chain    | Native Token | Best For                      | Gas Cost |
| -------- | ------------ | ----------------------------- | -------- |
| Base     | ETH          | Memecoins, general trading    | Very Low |
| Polygon  | MATIC        | Gaming, NFTs, frequent trades | Very Low |
| Ethereum | ETH          | Blue chips, high liquidity    | High     |
| Solana   | SOL          | High-speed trading            | Minimal  |
| Unichain | ETH          | Newer L2 option               | Very Low |

## Safety & Access Control

**Dedicated Agent Wallet**: When building autonomous agents, create a separate Bankr account rather than using your personal wallet.

**API Key Types**: 
- Read-only keys: portfolio, balances, prices only
- Read-write keys: enables swaps, transfers, trading

**Key safety rules:**
- Store keys in environment variables (`BANKR_API_KEY`)
- Never commit keys to source code
- Test with small amounts on low-cost chains (Base, Polygon)
- Rotate keys periodically

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BANKR_API_KEY` | API key (overrides stored key) |
| `BANKR_API_URL` | API URL (default: `https://api.bankr.bot`) |
| `BANKR_LLM_KEY` | LLM gateway key (falls back to `BANKR_API_KEY`) |

## Resources

- **Documentation**: https://docs.bankr.bot
- **API Key Management**: https://bankr.bot/api
- **CLI Package**: https://www.npmjs.com/package/@bankr/cli
- **Twitter**: @bankr_bot
