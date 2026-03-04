#!/usr/bin/env python3
"""
Sherlock Deep Research Engine v2.0
Multi-step iterative research with synthesis
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Config
TAVILY_API_KEY = os.getenv('TAVILY_API_KEY', '')
WORKSPACE = Path('/Users/quentincasares/.openclaw/workspace')
INTEL_DIR = WORKSPACE / 'intel'

def load_existing_intel():
    """Load previous research for context"""
    daily_intel = INTEL_DIR / 'DAILY-INTEL.md'
    if daily_intel.exists():
        return daily_intel.read_text()[:2000]  # Last 2000 chars
    return ""

def generate_research_plan(query):
    """Generate multi-step research plan"""
    return {
        "primary_query": query,
        "sub_queries": [
            f"{query} latest news today",
            f"{query} market analysis",
            f"{query} expert opinions",
            f"{query} price prediction forecast"
        ],
        "verification_queries": [
            f"{query} fact check",
            f"{query} official announcement"
        ]
    }

def evaluate_source_credibility(source):
    """Score source reliability 0-1"""
    high_cred = ['coingecko.com', 'coinmarketcap.com', 'messari.io', 
                 'glassnode.com', 'cryptoquant.com', 'theblock.co',
                 'bloomberg.com', 'reuters.com', 'ft.com']
    medium_cred = ['medium.com', 'substack.com', 'twitter.com', 'x.com']
    
    source_lower = source.lower()
    for s in high_cred:
        if s in source_lower:
            return 0.9
    for s in medium_cred:
        if s in source_lower:
            return 0.6
    return 0.4

def synthesize_findings(raw_results, plan):
    """Synthesize multi-source research into structured output"""
    synthesis = {
        "timestamp": datetime.now().isoformat(),
        "query": plan["primary_query"],
        "sources_evaluated": len(raw_results),
        "high_credibility_sources": sum(1 for r in raw_results if r.get('credibility', 0) > 0.8),
        "key_findings": [],
        "contradictions": [],
        "confidence_score": 0.0,
        "recommendation": ""
    }
    
    # Extract key findings from results
    for result in raw_results:
        if result.get('credibility', 0) > 0.7:
            synthesis["key_findings"].append({
                "claim": result.get('title', ''),
                "source": result.get('source', ''),
                "credibility": result.get('credibility', 0),
                "evidence": result.get('snippet', '')
            })
    
    # Calculate confidence
    if synthesis["sources_evaluated"] > 0:
        synthesis["confidence_score"] = sum(r.get('credibility', 0) for r in raw_results) / synthesis["sources_evaluated"]
    
    # Generate recommendation
    if synthesis["confidence_score"] > 0.8 and len(synthesis["key_findings"]) >= 3:
        synthesis["recommendation"] = "HIGH_CONFIDENCE"
    elif synthesis["confidence_score"] > 0.6:
        synthesis["recommendation"] = "MODERATE_CONFIDENCE_VERIFY"
    else:
        synthesis["recommendation"] = "LOW_CONFIDENCE_MORE_RESEARCH_NEEDED"
    
    return synthesis

def generate_report(synthesis):
    """Generate formatted research report"""
    report = f"""## Deep Research Report — {datetime.now().strftime('%Y-%m-%d %H:%M')}

**Query:** {synthesis['query']}
**Confidence:** {synthesis['confidence_score']:.0%} ({synthesis['recommendation']})
**Sources:** {synthesis['sources_evaluated']} evaluated, {synthesis['high_credibility_sources']} high-credibility

### Key Findings
"""
    
    for i, finding in enumerate(synthesis['key_findings'][:5], 1):
        report += f"\n{i. **{finding['claim']}**\n"
        report += f"   Source: {finding['source']} (cred: {finding['credibility']:.0%})\n"
        report += f"   Evidence: {finding['evidence'][:150]}...\n"
    
    report += f"\n### Assessment\n"
    if synthesis['recommendation'] == "HIGH_CONFIDENCE":
        report += "✅ **Well-sourced consensus** — Multiple credible sources align.\n"
    elif synthesis['recommendation'] == "MODERATE_CONFIDENCE_VERIFY":
        report += "⚠️ **Partial consensus** — Verify key claims before action.\n"
    else:
        report += "❓ **Insufficient data** — More research needed.\n"
    
    return report

def main():
    """Run deep research pipeline"""
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--query', required=True, help='Research topic')
    parser.add_argument('--output', default='intel/DEEP-RESEARCH.md')
    args = parser.parse_args()
    
    print(f"🔍 Deep Research: {args.query}")
    
    # Step 1: Generate research plan
    plan = generate_research_plan(args.query)
    print(f"   Generated {len(plan['sub_queries'])} sub-queries")
    
    # Step 2: Load context
    context = load_existing_intel()
    
    # Step 3: Execute searches (placeholder - would call Tavily)
    # For now, create structured output
    raw_results = []
    
    # Step 4: Evaluate sources
    # Step 5: Synthesize
    synthesis = synthesize_findings(raw_results, plan)
    
    # Step 6: Generate report
    report = generate_report(synthesis)
    
    # Save
    output_path = WORKSPACE / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        f.write(report)
    
    print(f"   Report saved: {output_path}")
    print(f"   Confidence: {synthesis['confidence_score']:.0%}")

if __name__ == '__main__':
    main()
