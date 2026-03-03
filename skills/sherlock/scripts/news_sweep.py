#!/usr/bin/env python3
"""
News sweep — tech/crypto/AI headlines
Uses RSS/API aggregation
"""
import json
import urllib.request
from datetime import datetime

def fetch_crypto_news():
    """Fetch from CoinDesk RSS as proxy for crypto news"""
    results = []
    try:
        url = "https://feeds.coindesk.com/coindesk/news.rss"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            # Simple XML parsing for items
            import re
            items = re.findall(r'<item>.*?</item>', content, re.DOTALL)
            for item in items[:8]:
                title = re.search(r'<title>(.*?)</title>', item)
                link = re.search(r'<link>(.*?)</link>', item)
                if title:
                    results.append({
                        "title": title.group(1).replace('<![CDATA[', '').replace(']]>', ''),
                        "url": link.group(1) if link else "",
                        "source": "coindesk"
                    })
    except Exception as e:
        return {"error": str(e)}
    return results

def main():
    results = {
        "source": "news_aggregate",
        "timestamp": datetime.utcnow().isoformat(),
        "headlines": []
    }
    
    crypto_news = fetch_crypto_news()
    if isinstance(crypto_news, list):
        results['headlines'].extend(crypto_news)
    else:
        results['crypto_error'] = crypto_news.get('error')
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
