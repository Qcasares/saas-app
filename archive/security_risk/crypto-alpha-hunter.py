#!/usr/bin/env python3
"""
Crypto Alpha Hunter - Autonomous X Engagement (Free Tier)
Works with limited API access - focuses on posting and basic read
"""

import os
import sys
import random
import tweepy
from datetime import datetime

# Credentials
API_KEY = "tsZdEEL9iMCFQyHU26iIWNG0N"
API_SECRET = "SbDl0nJ9We4Kim6ot99SJtaiUeM7ivHGzzK3Zrc4zCM1JJdZyt"
ACCESS_TOKEN = "2052911-K7fhXcA5NyElPdRrolxKmMHPCmIiTSUsdfxK07uApB"
ACCESS_SECRET = "6iPLJL1jHZyg1W6F9Lcnlm1iKECwxgPqkKQVhRy5vsziz"

# Auth v2
client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_SECRET
)

# Content library
TWEETS = [
    "Market psychology: The best trades feel uncomfortable at entry. If it feels safe, you're probably late 🎯 #crypto #trading",
    "Watching funding rates turn negative while majors hold support. Potential squeeze setup forming 👀",
    "Risk management tip: Your position size should let you sleep at night. If you're checking charts at 3am, it's too big 🛡️",
    "The real edge in crypto isn't finding the next 100x. It's not losing money on the 99 that don't work 🧠",
    "Altcoin dominance creeping up. Rotation into risk assets while BTC consolidates. Interesting dynamics 📊",
    "Patience is a strategy. Most traders lose money by overtrading. Better to wait for the A+ setup 🐢",
    "Volume profile showing compression on majors. Big move incoming—direction TBD 📈📉",
    "Whale wallets accumulating stablecoins. Smart money positioning for the next leg? 🐋",
    "Crypto lesson #1: Protect your capital. You can always make money, but you can't always make it back ⚠️",
    "Interesting thread on market cycles. We're not in euphoria yet, but greed is creeping in. Stay cautious 🎭",
    "The meta is shifting. Meme coin season cooling, fundamentals mattering more. Quality projects rising 🌱",
    "Position sizing exercise: If this trade goes to zero, can you survive? If no, reduce size 📉",
    "Market making you feel FOMO? That's usually the top. When you feel fear, that's usually the bottom 🎢",
    "Crypto isn't just about gains. It's about learning to manage risk, control emotions, and think long-term 📚",
    "Current watchlist: majors holding support, alts showing relative strength. Selective opportunities emerging 👁️",
]

def post_tweet():
    """Post a crypto alpha tweet"""
    text = random.choice(TWEETS)
    try:
        response = client.create_tweet(text=text)
        print(f"✅ Posted: {text[:70]}...")
        return response.data['id']
    except Exception as e:
        print(f"❌ Post failed: {e}")
        return None

def get_my_tweets():
    """Get recent tweets (read-only check)"""
    try:
        me = client.get_me()
        tweets = client.get_users_tweets(me.data.id, max_results=5)
        if tweets.data:
            print(f"✅ Recent tweets: {len(tweets.data)}")
        return tweets.data
    except Exception as e:
        print(f"❌ Get tweets failed: {e}")
        return None

def main():
    print(f"\n🚀 Crypto Alpha Hunter - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)
    
    # Verify auth
    try:
        me = client.get_me()
        print(f"✅ Authenticated as: @{me.data.username}")
    except Exception as e:
        print(f"❌ Auth failed: {e}")
        return
    
    # Actions (limited by API tier)
    print("\n▶️ Posting alpha tweet...")
    post_tweet()
    
    print("\n▶️ Checking recent activity...")
    get_my_tweets()
    
    print("\n✅ Hourly engagement complete")
    print("⚠️  Note: Free API tier limits engagement actions")
    print("=" * 50)

if __name__ == "__main__":
    main()
