#!/usr/bin/env python3
"""
Crypto news aggregator — CoinDesk, The Block, regulatory news
Web scraping approach for public articles
"""
import json
import urllib.request
import re
from datetime import datetime

def fetch_cointelegraph():
    """Fetch CoinTelegraph crypto news"""
    try:
        url = "https://cointelegraph.com/rss"
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            # Simple regex extraction
            items = re.findall(r"<item>(.*?)</item>", content, re.DOTALL)
            news = []
            for item in items[:8]:
                title = re.search(r"<title>(.*?)</title>", item)
                link = re.search(r"<link>(.*?)</link>", item)
                if title:
                    news.append({
                        "title": title.group(1).replace("<![CDATA[", "").replace("]]>", ""),
                        "url": link.group(1) if link else "",
                        "source": "cointelegraph"
                    })
            return news
    except Exception as e:
        return [{"error": str(e)}]

def fetch_coindesk():
    """Fetch CoinDesk news"""
    try:
        url = "https://feeds.coindesk.com/coindesk/news.rss"
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            items = re.findall(r"<item>(.*?)</item>", content, re.DOTALL)
            news = []
            for item in items[:8]:
                title = re.search(r"<title>(.*?)</title>", item)
                if title:
                    news.append({
                        "title": title.group(1).replace("<![CDATA[", "").replace("]]>", ""),
                        "source": "coindesk"
                    })
            return news
    except Exception as e:
        return [{"error": str(e)}]

def main():
    results = {
        "source": "crypto_news_aggregate",
        "timestamp": datetime.utcnow().isoformat(),
        "headlines": []
    }
    
    print("Fetching CoinTelegraph...")
    ct_news = fetch_cointelegraph()
    results["headlines"].extend(ct_news)
    
    print("Fetching CoinDesk...")
    cd_news = fetch_coindesk()
    results["headlines"].extend(cd_news)
    
    # Categorize
    regulatory_keywords = ["SEC", "regulation", "compliance", "law", "legal", "policy", "CBDC"]
    macro_keywords = ["Fed", "inflation", "rates", "economy", "recession", "dollar"]
    
    results["regulatory"] = [
        n for n in results["headlines"] 
        if any(kw in n.get("title", "") for kw in regulatory_keywords)
    ]
    
    results["macro"] = [
        n for n in results["headlines"]
        if any(kw in n.get("title", "") for kw in macro_keywords)
    ]
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
