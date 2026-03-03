#!/usr/bin/env python3
"""
Messari fundamental data sweep — research-grade crypto analytics
Note: Free tier available, API key recommended for higher limits
"""
import json
import urllib.request
from datetime import datetime

MESSARI_API = "https://data.messari.io/api/v1"

def messari_request(endpoint, api_key=None):
    """Make Messari API request"""
    url = f"{MESSARI_API}{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Sherlock-Research-Agent/1.0")
    if api_key:
        req.add_header("x-messari-api-key", api_key)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

def main():
    results = {
        "source": "messari",
        "timestamp": datetime.utcnow().isoformat(),
        "news": [],
        "research": [],
        "metrics": {}
    }
    
    # Try to get latest news (free tier)
    print("Fetching Messari news...")
    news = messari_request("/news")
    if "data" in news:
        results["news"] = [
            {
                "title": n.get("title"),
                "content": n.get("content", "")[:200] + "...",
                "published_at": n.get("published_at"),
                "assets": [a.get("name") for a in n.get("assets", [])]
            }
            for n in news["data"][:5]
        ]
    
    # Key metrics for BTC and ETH
    for asset in ["bitcoin", "ethereum"]:
        print(f"Fetching {asset} metrics...")
        metrics = messari_request(f"/assets/{asset}/metrics")
        if "data" in metrics:
            data = metrics["data"]
            results["metrics"][asset] = {
                "price_usd": data.get("market_data", {}).get("price_usd"),
                "volume_24h": data.get("market_data", {}).get("volume_last_24_hours"),
                "realized_cap": data.get("on_chain_data", {}).get("realized_cap"),
                "active_addresses": data.get("on_chain_data", {}).get("active_addresses"),
                "transaction_volume": data.get("on_chain_data", {}).get("transaction_volume"),
                "nvt_ratio": data.get("on_chain_data", {}).get("nvt_ratio")
            }
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
