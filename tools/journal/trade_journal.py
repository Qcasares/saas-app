#!/usr/bin/env python3
"""
Trade Journal Summary
- Reads trading/executions.json and trading/active-positions.json
- Produces a quick performance + health snapshot
"""
import json
import argparse
from collections import Counter
from datetime import datetime
from pathlib import Path

DEFAULT_EXECUTIONS = "trading/executions.json"
DEFAULT_POSITIONS = "trading/active-positions.json"
DEFAULT_PRICES = "trading/MARKET-ANALYSIS.json"


def load_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except Exception:
        return default


def summarize_executions(executions):
    status_counts = Counter([e.get("status", "unknown") for e in executions])
    assets = Counter([e.get("asset", "unknown") for e in executions])
    failures = [e for e in executions if e.get("status") == "failed"]
    errors = Counter([f.get("error", "unknown") for f in failures])

    executed = [e for e in executions if e.get("status") == "executed"]
    simulated = [e for e in executions if e.get("status") == "simulated"]

    def avg_position(items):
        vals = [e.get("position_value", 0) for e in items if isinstance(e.get("position_value", None), (int, float))]
        return sum(vals) / len(vals) if vals else 0

    return {
        "total": len(executions),
        "status_counts": dict(status_counts),
        "top_assets": assets.most_common(5),
        "error_breakdown": errors.most_common(5),
        "avg_position_executed": avg_position(executed),
        "avg_position_simulated": avg_position(simulated),
    }


def mark_to_market(positions, prices):
    price_map = prices.get("prices", {})
    mtm = []
    total_pnl = 0
    for p in positions:
        asset = p.get("asset")
        entry = p.get("entry_price")
        direction = p.get("direction", "LONG")
        position_value = p.get("position_value", 0) or 0
        current = None
        if asset in price_map:
            current = price_map[asset].get("price")
        if current and entry:
            if direction == "SHORT":
                pnl_pct = (entry - current) / entry
            else:
                pnl_pct = (current - entry) / entry
            pnl_usd = pnl_pct * position_value
            total_pnl += pnl_usd
        else:
            pnl_pct = None
            pnl_usd = None
        mtm.append({
            "asset": asset,
            "direction": direction,
            "entry_price": entry,
            "current_price": current,
            "position_value": position_value,
            "pnl_pct": pnl_pct,
            "pnl_usd": pnl_usd
        })
    return mtm, total_pnl


def main():
    parser = argparse.ArgumentParser(description="Trade journal summary")
    parser.add_argument("--executions", default=DEFAULT_EXECUTIONS)
    parser.add_argument("--positions", default=DEFAULT_POSITIONS)
    parser.add_argument("--prices", default=DEFAULT_PRICES)
    parser.add_argument("--output", default="trading/journal-summary.json")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    executions = load_json(args.executions, [])
    positions = load_json(args.positions, [])
    prices = load_json(args.prices, {})

    exec_summary = summarize_executions(executions)
    mtm, total_pnl = mark_to_market(positions, prices)

    summary = {
        "generated_at": datetime.now().isoformat(),
        "executions": exec_summary,
        "positions": {
            "open_count": len(positions),
            "exposure": sum([p.get("position_value", 0) or 0 for p in positions]),
            "mark_to_market": mtm,
            "total_pnl_usd": total_pnl,
        }
    }

    # Write JSON summary
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(summary, f, indent=2)

    if args.format == "json":
        print(json.dumps(summary, indent=2))
        return

    # Text output
    print("🧾 TRADE JOURNAL SUMMARY")
    print("=" * 50)
    print(f"Generated: {summary['generated_at']}")
    print("")
    print("EXECUTIONS")
    print("-" * 50)
    print(f"Total: {exec_summary['total']}")
    for status, count in exec_summary["status_counts"].items():
        print(f"  {status}: {count}")
    print(f"Avg position (executed): ${exec_summary['avg_position_executed']:.2f}")
    print(f"Avg position (simulated): ${exec_summary['avg_position_simulated']:.2f}")
    if exec_summary["error_breakdown"]:
        print("\nTop errors:")
        for err, cnt in exec_summary["error_breakdown"]:
            print(f"  {cnt}x {err}")

    print("\nOPEN POSITIONS")
    print("-" * 50)
    print(f"Count: {summary['positions']['open_count']}")
    print(f"Exposure: ${summary['positions']['exposure']:.2f}")
    print(f"MTM PnL (est.): ${summary['positions']['total_pnl_usd']:.2f}")
    for p in mtm:
        if p["current_price"] and p["entry_price"]:
            pnl_pct = p["pnl_pct"] * 100 if p["pnl_pct"] is not None else 0
            pnl_usd = p["pnl_usd"] or 0
            print(f"  {p['asset']}: {pnl_pct:+.2f}% (${pnl_usd:+.2f})")
        else:
            print(f"  {p['asset']}: price unavailable")


if __name__ == "__main__":
    main()
