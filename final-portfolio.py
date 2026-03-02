import sys
sys.path.insert(0, '/Users/quentincasares/.openclaw/workspace/.venv/lib/python3.13/site-packages')
import os
os.environ['COINBASE_API_KEY'] = '577c27e6-22e2-4901-af7e-9caa79720505'
os.environ['COINBASE_API_SECRET'] = '''-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIGOJIL1WBIFeIicwJXjRI4SilzVTgFND5QsmitSxGbs2oAoGCCqGSM49
AwEHoUQDQgAE/LWTBBv4u88l04i4Gf0w1sefeog1d5KQHLz6CHbfXRyq+0LNiEHR
QETdTMbw+CLPKS8shhwkponw897MKIjjFg==
-----END EC PRIVATE KEY-----'''

from coinbase.rest import RESTClient
client = RESTClient(api_key=os.environ['COINBASE_API_KEY'], api_secret=os.environ['COINBASE_API_SECRET'])

print('=' * 60)
print('📊 FINAL OPTIMIZED PORTFOLIO')
print('=' * 60)

accounts = client.get_accounts()
prices = {}
positions = []

for acc in accounts.accounts:
    bal = acc.available_balance
    balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
    if balance > 0:
        try:
            if acc.currency not in prices:
                prices[acc.currency] = float(client.get_product(f"{acc.currency}-USD").price)
            usd_val = balance * prices[acc.currency]
        except:
            usd_val = balance if acc.currency in ['USD', 'USDC'] else 0
        positions.append((acc.currency, balance, usd_val))

total = sum(p[2] for p in positions)

for curr, bal, usd in sorted(positions, key=lambda x: x[2], reverse=True):
    pct = (usd / total * 100) if total > 0 else 0
    emoji = {'BTC': '🏦', 'SOL': '🚀', 'USD': '💵', 'USDC': '💵', 'GBP': '💷'}.get(curr, '📦')
    print(f"{emoji} {curr:5} {bal:12.6f} (${usd:,.2f}) [{pct:.0f}%]")

print('=' * 60)
print(f"💰 Total Value: ${total:,.2f}")
print('=' * 60)
print()
print("Strategy:")
print("  • BTC (82%) - Stable foundation, long-term hold")
print("  • SOL (18%) - High growth potential")
print()
print("Next moves:")
print("  • Monitor SOL for +20% gain target")
print("  • Watch for USD deposit to arrive")
print("  • Ready to add to winning positions")
