#!/usr/bin/env python3
"""
CoinGecko market data sweep — comprehensive pricing and market metrics
Free tier: 30 calls/min, 10K calls/month
"""
import json
import urllib.request
import urllib.parse
from datetime import datetime

COINGECKO_API = "https://api.coingecko.com/api/v3"

def cg_request(endpoint, params=None):
    """Make CoinGecko API request"""
    url = f"{COINGECKO_API}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Sherlock-Research-Agent/1.0")
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

def main():
    results = {
        "source": "coingecko",
        "timestamp": datetime.utcnow().isoformat(),
        "global_metrics": {},
        "top_movers": [],
        "trending": [],
        "btc_dominance": None
    }
    
    # Global crypto market data
    print("Fetching global metrics...")
    global_data = cg_request("/global")
    if "data" in global_data:
        data = global_data["data"]
        results["global_metrics"] = {
            "total_market_cap_usd": data.get("total_market_cap", {}).get("usd"),
            "total_volume_24h_usd": data.get("total_volume", {}).get("usd"),
            "btc_dominance": data.get("market_cap_percentage", {}).get("btc"),
            "eth_dominance": data.get("market_cap_percentage", {}).get("eth"),
            "active_cryptocurrencies": data.get("active_cryptocurrencies"),
            "markets": data.get("markets")
        }
        results["btc_dominance"] = data.get("market_cap_percentage", {}).get("btc")
    
    # Top 100 coins with 24h change
    print("Fetching top 100 coins...")
    coins = cg_request("/coins/markets", {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false",
        "price_change_percentage": "24h"
    })
    
    if isinstance(coins, list):
        # Sort by 24h change for top movers
        coins_with_change = [c for c in coins if c.get("price_change_percentage_24h") is not None]
        
        # Top gainers
        gainers = sorted(coins_with_change, key=lambda x: x["price_change_percentage_24h"], reverse=True)[:10]
        results["top_gainers"] = [
            {
                "symbol": g["symbol"].upper(),
                "name": g["name"],
                "price": g["current_price"],
                "change_24h": g["price_change_percentage_24h"],
                "volume_24h": g["total_volume"],
                "market_cap": g["market_cap"]
            }
            for g in gainers
        ]
        
        # Top losers
        losers = sorted(coins_with_change, key=lambda x: x["price_change_percentage_24h"])[:10]
        results["top_losers"] = [
            {
                "symbol": l["symbol"].upper(),
                "name": l["name"],
                "price": l["current_price"],
                "change_24h": l["price_change_percentage_24h"],
                "volume_24h": l["total_volume"],
                "market_cap": l["market_cap"]
            }
            for l in losers
        ]
        
        # Key assets for tracking
        key_symbols = ["BTC", "ETH", "SOL", "XRP", "ADA", "LINK", "NEAR", "TAO", "HYPE"]
        key_coins = [c for c in coins if c["symbol"].upper() in key_symbols][:15]
        results["key_assets"] = [
            {
                "symbol": k["symbol"].upper(),
                "name": k["name"],
                "price": k["current_price"],
                "change_24h": k["price_change_percentage_24h"],
                "volume_24h": k["total_volume"],
                "ath": k.get("ath"),
                "ath_change": k.get("ath_change_percentage")
            }
            for k in key_coins
        ]
    
    # Trending searches (community interest)
    print("Fetching trending...")
    trending = cg_request("/search/trending")
    if "coins" in trending:
        results["trending"] = [
            {
                "symbol": t["item"]["symbol"],
                "name": t["item"]["name"],
                "market_cap_rank": t["item"]["market_cap_rank"],
                "score": t["item"].get("score")
            }
            for t in trending["coins"][:10]
        ]
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
