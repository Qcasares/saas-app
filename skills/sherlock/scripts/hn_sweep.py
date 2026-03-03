#!/usr/bin/env python3
"""
Hacker News sweep — top stories, Show HN, and deep discussions
Outputs JSON for synthesis pipeline
"""
import json
import urllib.request
from datetime import datetime

def fetch_hn(endpoint):
    url = f"https://hacker-news.firebaseio.com/v0/{endpoint}.json"
    with urllib.request.urlopen(url, timeout=10) as resp:
        return json.loads(resp.read())

def fetch_item(item_id):
    url = f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json"
    with urllib.request.urlopen(url, timeout=10) as resp:
        return json.loads(resp.read())

def main():
    results = {
        "source": "hacker_news",
        "timestamp": datetime.utcnow().isoformat(),
        "top_stories": [],
        "show_hn": [],
        "high_discussion": []
    }
    
    # Top stories
    try:
        top_ids = fetch_hn("topstories")[:15]
        for item_id in top_ids:
            item = fetch_item(item_id)
            if item:
                results["top_stories"].append({
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "score": item.get("score"),
                    "descendants": item.get("descendants", 0),
                    "by": item.get("by"),
                    "time": item.get("time")
                })
    except Exception as e:
        results["error"] = str(e)
    
    # Show HN (first page via Algolia)
    try:
        url = "https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=10"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
            for hit in data.get("hits", []):
                results["show_hn"].append({
                    "title": hit.get("title"),
                    "url": hit.get("url"),
                    "points": hit.get("points"),
                    "comments": hit.get("num_comments"),
                    "author": hit.get("author")
                })
    except Exception as e:
        results["show_hn_error"] = str(e)
    
    # High discussion ratio
    for story in results["top_stories"]:
        score = story.get("score", 1)
        comments = story.get("descendants", 0)
        if comments > score * 0.5 and comments > 50:
            results["high_discussion"].append(story)
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
