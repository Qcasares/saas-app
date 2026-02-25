---
name: x-twitter
description: Interact with Twitter/X — read tweets, search, post, like, retweet, and manage your timeline.
user-invocable: true
metadata: {"openclaw":{"emoji":"🐦‍⬛","skillKey":"x-twitter","primaryEnv":"TWITTER_BEARER_TOKEN","requires":{"bins":["xcli"],"env":["TWITTER_API_KEY","TWITTER_API_SECRET","TWITTER_ACCESS_TOKEN","TWITTER_ACCESS_TOKEN_SECRET"]},"install":[]}}
---

# twitter-openclaw 🐦‍⬛

Interact with Twitter/X posts, timelines, and users from OpenClaw.

## Authentication

Requires a Twitter API Bearer Token set as `TWITTER_BEARER_TOKEN`.

Optionally set `TWITTER_API_KEY` and `TWITTER_API_SECRET` for write operations (post, like, retweet).

Run `xcli auth-check` to verify credentials.

## Setup

1. Create `~/.openclaw/workspace/.x-autonomy-config` with your Twitter API credentials:
```bash
export TWITTER_API_KEY=your_api_key
export TWITTER_API_SECRET=your_api_secret
export TWITTER_ACCESS_TOKEN=your_access_token
export TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

2. Ensure the `xcli` binary is in your PATH or use the full path:
```bash
export PATH="$PATH:$HOME/.openclaw/workspace/skills/x-twitter/bin"
```

## Commands

### Reading

```bash
xcli read <tweet-url-or-id>          # Read a single tweet with full metadata
xcli thread <tweet-url-or-id>        # Read full conversation thread
xcli replies <tweet-url-or-id> -n 20 # List replies to a tweet
xcli user <@handle>                  # Show user profile info
xcli user-tweets <@handle> -n 20     # User's recent tweets
```

### Timelines

```bash
xcli home -n 20                      # Home timeline
xcli mentions -n 10                  # Your mentions
xcli likes <@handle> -n 10           # User's liked tweets
```

### Search

```bash
xcli search "query" -n 10            # Search tweets
xcli search "from:elonmusk AI" -n 5  # Search with operators
xcli search "#trending" --recent     # Recent tweets only
xcli search "query" --popular        # Popular tweets only
```

### Trending

```bash
xcli trending                        # Trending topics worldwide
xcli trending --woeid 23424977       # Trending in specific location
```

### Posting

```bash
xcli tweet "hello world"                          # Post a tweet
xcli reply <tweet-url-or-id> "great thread!"      # Reply to a tweet
xcli quote <tweet-url-or-id> "interesting take"   # Quote tweet
xcli tweet "look at this" --media image.png        # Tweet with media
```

### Engagement

```bash
xcli like <tweet-url-or-id>          # Like a tweet
xcli unlike <tweet-url-or-id>        # Unlike a tweet
xcli retweet <tweet-url-or-id>       # Retweet
xcli unretweet <tweet-url-or-id>     # Undo retweet
xcli bookmark <tweet-url-or-id>      # Bookmark a tweet
xcli unbookmark <tweet-url-or-id>    # Remove bookmark
```

### Following

```bash
xcli follow <@handle>                # Follow user
xcli unfollow <@handle>              # Unfollow user
xcli followers <@handle> -n 20       # List followers
xcli following <@handle> -n 20       # List following
```

### Lists

```bash
xcli lists                           # Your lists
xcli list-timeline <list-id> -n 20   # Tweets from a list
xcli list-add <list-id> <@handle>    # Add user to list
xcli list-remove <list-id> <@handle> # Remove user from list
```

## Output Options

```bash
--json          # JSON output
--plain         # Plain text, no formatting
--no-color      # Disable ANSI colors
-n <count>      # Number of results (default: 10)
--cursor <val>  # Pagination cursor for next page
--all           # Fetch all pages (use with caution)
```

## Guidelines for OpenClaw

- When reading tweets, always show: author, handle, text, timestamp, engagement counts.
- For threads, present tweets in chronological order.
- When searching, summarize results concisely with key metrics.
- Before posting/liking/retweeting, confirm the action with the user.
- Rate limits apply — space out bulk operations.
- Use `--json` when you need to process output programmatically.

## Troubleshooting

### 401 Unauthorized
Check that `TWITTER_BEARER_TOKEN` is set and valid.

### 429 Rate Limited
Wait and retry. Twitter API has strict rate limits per 15-minute window.

---

**TL;DR**: Read, search, post, and engage on Twitter/X. Always confirm before write actions.
