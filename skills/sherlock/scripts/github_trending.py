#!/usr/bin/env python3
"""
GitHub trending repos sweep
Outputs top gaining repos by language
"""
import json
import urllib.request
from datetime import datetime

def fetch_trending():
    """Fetch trending repos from GitHub API (using search as proxy)"""
    # Search for repos created in last 7 days with most stars
    query = "created:>2026-02-24"  # Adjust date as needed
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=15"
    
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("User-Agent", "sherlock-research-agent")
    
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def main():
    results = {
        "source": "github_trending",
        "timestamp": datetime.utcnow().isoformat(),
        "repos": []
    }
    
    try:
        data = fetch_trending()
        for item in data.get("items", []):
            results["repos"].append({
                "name": item.get("full_name"),
                "url": item.get("html_url"),
                "description": item.get("description"),
                "stars": item.get("stargazers_count"),
                "language": item.get("language"),
                "created": item.get("created_at"),
                "topics": item.get("topics", [])[:5]
            })
    except Exception as e:
        results["error"] = str(e)
        # Fallback: return empty but valid structure
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
