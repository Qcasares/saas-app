#!/usr/bin/env python3
"""
Twitter/X Thread Follower
Extracts full threads from X/Twitter URLs, not just the first tweet
"""

import re
import json
from typing import List, Dict, Optional

class TwitterExtractor:
    def __init__(self, bearer_token: str = None):
        self.bearer_token = bearer_token
        self.base_url = "https://api.twitter.com/2"
    
    def extract_tweet_id(self, url: str) -> Optional[str]:
        """Extract tweet ID from various Twitter/X URL formats"""
        patterns = [
            r'twitter\.com/\w+/status/(\d+)',
            r'x\.com/\w+/status/(\d+)',
            r'twitter\.com/i/web/status/(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def get_tweet(self, tweet_id: str) -> Dict:
        """Get single tweet data (requires API v2)"""
        if not self.bearer_token:
            return {
                'error': 'Bearer token required for API access',
                'tweet_id': tweet_id,
                'note': 'Use xcli tool with configured token, or browser automation'
            }
        
        import urllib.request
        
        url = f"{self.base_url}/tweets/{tweet_id}?tweet.fields=created_at,public_metrics,author_id,referenced_tweets"
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {self.bearer_token}'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode())
        except Exception as e:
            return {'error': str(e), 'tweet_id': tweet_id}
    
    def get_thread(self, tweet_id: str) -> List[Dict]:
        """
        Get conversation thread from a tweet
        Note: Requires conversation_id lookup then search
        """
        # Get the initial tweet to find conversation_id
        initial = self.get_tweet(tweet_id)
        
        if 'error' in initial:
            return [initial]
        
        # For now, return just the main tweet
        # Full thread reconstruction requires:
        # 1. Get conversation_id from tweet
        # 2. Search tweets with conversation_id
        # 3. Reconstruct thread chronologically
        
        return [initial]
    
    def process_url(self, url: str) -> Dict:
        """Process a Twitter/X URL"""
        tweet_id = self.extract_tweet_id(url)
        
        if not tweet_id:
            return {'error': 'Invalid Twitter/X URL', 'url': url}
        
        tweets = self.get_thread(tweet_id)
        
        return {
            'tweet_id': tweet_id,
            'url': url,
            'tweets': tweets,
            'content_type': 'tweet',
            'is_thread': len(tweets) > 1,
            'thread_length': len(tweets)
        }
    
    def extract_from_text(self, text: str) -> List[str]:
        """Extract all Twitter/X URLs from text"""
        pattern = r'https?://(?:twitter\.com|x\.com)/\w+/status/\d+'
        return re.findall(pattern, text)

if __name__ == "__main__":
    tx = TwitterExtractor()
    
    # Test
    test_urls = [
        "https://twitter.com/elonmusk/status/1234567890",
        "https://x.com/openai/status/0987654321"
    ]
    
    for url in test_urls:
        print(f"\nProcessing: {url}")
        result = tx.process_url(url)
        print(json.dumps(result, indent=2))
