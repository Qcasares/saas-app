#!/usr/bin/env python3
"""
Synthesize all sweep data into structured intel report
"""
import json
import sys
from datetime import datetime

def load_sweep(filename):
    try:
        with open(filename) as f:
            return json.load(f)
    except:
        return None

def main():
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Load all sweep data
    hn = load_sweep(f"/tmp/sherlock_hn_{today}.json")
    github = load_sweep(f"/tmp/sherlock_github_{today}.json")
    crypto = load_sweep(f"/tmp/sherlock_crypto_{today}.json")
    news = load_sweep(f"/tmp/sherlock_news_{today}.json")
    
    report = f"""# Sherlock Intel Report — {today}

*Generated: {datetime.utcnow().isoformat()} UTC*

## Executive Summary

"""
    
    bullets = []
    
    # Crypto signals
    if crypto and 'top_gainers' in crypto:
        gainers = crypto['top_gainers'][:3]
        if gainers:
            bullets.append(f"**Crypto momentum:** {gainers[0]['symbol']} leading at +{gainers[0]['change_24h']}%")
    
    if crypto and 'anomalies' in crypto and crypto['anomalies']:
        bullets.append(f"**Anomalies detected:** {len(crypto['anomalies'])} assets with high volatility + volume")
    
    # HN signals
    if hn and 'top_stories' in hn:
        top = hn['top_stories'][0] if hn['top_stories'] else None
        if top:
            bullets.append(f"**Tech discourse:** '{top['title'][:50]}...' ({top['score']} pts, {top['descendants']} comments)")
    
    # GitHub signals
    if github and 'repos' in github:
        top_repo = github['repos'][0] if github['repos'] else None
        if top_repo:
            bullets.append(f"**Emerging tool:** {top_repo['name']} — {top_repo['stars']} stars")
    
    # News signals
    if news and 'headlines' in news:
        top_news = news['headlines'][0] if news['headlines'] else None
        if top_news:
            bullets.append(f"**Breaking:** {top_news['title'][:60]}...")
    
    if not bullets:
        bullets.append("*Insufficient data for summary*")
    
    for b in bullets:
        report += f"- {b}\n"
    
    report += "\n## Crypto Market Intelligence\n\n"
    
    if crypto:
        if crypto.get('top_gainers'):
            report += "### Top Gainers (24h)\n| Asset | Price | Change | Volume |\n|-------|-------|--------|--------|\n"
            for g in crypto['top_gainers'][:5]:
                report += f"| {g['symbol']} | ${g['price']:.4f} | +{g['change_24h']}% | ${g['volume_24h']:,.0f} |\n"
            report += "\n"
        
        if crypto.get('anomalies'):
            report += "### Volume + Volatility Anomalies\n"
            for a in crypto['anomalies']:
                report += f"- **{a['symbol']}:** {a['change_24h']:+.1f}% on ${a['volume_24h']:,.0f} volume\n"
            report += "\n"
    
    report += "## Tech & Development Trends\n\n"
    
    if hn and hn.get('show_hn'):
        report += "### Show HN (New Projects)\n"
        for item in hn['show_hn'][:5]:
            report += f"- [{item['title']}]({item['url']}) — {item['points']} pts, {item['comments']} comments\n"
        report += "\n"
    
    if github and github.get('repos'):
        report += "### Trending Repositories\n"
        for repo in github['repos'][:5]:
            desc = repo.get('description', '') or 'No description'
            report += f"- **{repo['name']}** ({repo['language'] or 'N/A'}) — {repo['stars']} stars\n"
            report += f"  {desc[:80]}{'...' if len(desc) > 80 else ''}\n"
        report += "\n"
    
    report += "## Key Headlines\n\n"
    
    if news and news.get('headlines'):
        for item in news['headlines'][:5]:
            report += f"- [{item['title']}]({item['url']}) — *{item['source']}*\n"
    else:
        report += "*News feed unavailable*\n"
    
    report += f"""
---

*Report confidence: {'High' if all([hn, github, crypto]) else 'Partial' if any([hn, github, crypto]) else 'Low'}*
*Data sources: Hacker News, GitHub, Coinbase, CoinDesk*
"""
    
    # Output to file and stdout
    output_path = f"/Users/quentincasares/.openclaw/workspace/intel/SHERLOCK-{today}.md"
    print(report)
    
    try:
        with open(output_path, 'w') as f:
            f.write(report)
        print(f"\n[Report saved to {output_path}]")
    except Exception as e:
        print(f"\n[Error saving report: {e}]")

if __name__ == "__main__":
    main()
