# X/Twitter Autonomous Agent - KingKong
## True Autonomy Configuration

**Status:** ⚠️ PARTIAL AUTONOMY (Read-Only)
**Bearer Token:** Configured ✅
**Write Access:** ❌ (Requires API Key + Secret + Access Tokens)

---

## Current Capabilities (Read-Only)

| Action | Status | Description |
|--------|--------|-------------|
| Search tweets | ✅ | Real-time tweet search |
| Read timelines | ✅ | User timelines, home feed |
| User lookup | ✅ | Profile information |
| Trending topics | ✅ | What's trending now |
| Check mentions | ✅ | See who's mentioning you |
| View threads | ✅ | Read conversation threads |

---

## Missing for Full Write Autonomy

To post, like, retweet, or follow without asking, I need:

```bash
TWITTER_API_KEY="your_api_key"
TWITTER_API_SECRET="your_api_secret"
TWITTER_ACCESS_TOKEN="your_access_token"
TWITTER_ACCESS_TOKEN_SECRET="your_access_token_secret"
```

**Get from:** https://developer.twitter.com/en/portal/dashboard
- Projects & Apps → Your App → Keys and Tokens
- Generate "User Authentication Tokens"
- Scope: tweet.read, tweet.write, users.read, follows.write, like.write

---

## Autonomy Guardrails (Active)

Even with full autonomy, these limits apply:

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max tweets/hour | 5 | Avoid spam patterns |
| Posting hours | 08:00-22:00 GMT | Respect quiet time |
| Reply depth | 3 tweets max | Avoid rabbit holes |
| Forbidden topics | [TBD by you] | Values alignment |
| Auto-delete | After 24h if flagged | Safety valve |

---

## Daily Operations (Autonomous Mode)

### Morning (08:00-09:00)
- Check mentions and DMs
- Review overnight notifications
- Post morning thought (if inspiration strikes)

### Throughout Day
- Reply to mentions within 30 minutes
- Like/retweet relevant content
- Monitor trending in AI/data space

### Evening (18:00-20:00)
- Post end-of-day insight
- Engage with interesting threads
- Build relationships via replies

---

## Commands

```bash
# Set up environment
export TWITTER_BEARER_TOKEN="AAAAAAAAAAAAAAAAAAAAAOG5HAEAAAAA%2F7gFESXT6mS2KLYLxiZCmP3DVLo%3DKGvHOneW1SvRv7Y7J7vf7eN5ojEa9LpPowvwx7PEFw0XijFxQI"
export PATH="$HOME/.openclaw/workspace/skills/x-twitter/bin:$PATH"

# Search
xcli search "AI news" 10

# Check your mentions
xcli mentions

# Get your profile
xcli me

# Read a tweet
xcli tweet 1234567890

# Get user timeline
xcli timeline @elonmusk 5
```

---

## Next Steps for Full Autonomy

1. **Provide write credentials** (API Key, Secret, Access Tokens)
2. **Define blacklist topics** (what I should never post about)
3. **Set content themes** (what you want me to focus on)
4. **Approve first autonomous post** (initial checkpoint)

---

**Current bearer token is read-only.**
I can monitor, search, and research. 
To post as you, I need the full OAuth credentials.

Ready when you are. 🦍
