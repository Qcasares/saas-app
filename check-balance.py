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
print('💰 UPDATED PORTFOLIO AFTER USD DEPOSIT')
print('=' * 60)
accounts = client.get_accounts()
total_usd = 0
holdings = []

for acc in accounts.accounts:
    bal = acc.available_balance
    balance = float(bal['value'] if isinstance(bal, dict) else bal.value)
    if balance > 0:
        # Get USD value
        if acc.currency == 'USD':
            usd_val = balance
        elif acc.currency == 'USDC':
            usd_val = balance
        else:
            try:
                price = float(client.get_product(f"{acc.currency}-USD").price)
                usd_val = balance * price
            except:
                usd_val = 0
        total_usd += usd_val
        holdings.append((acc.currency, balance, usd_val))

for curr, bal, usd in sorted(holdings, key=lambda x: x[2], reverse=True):
    if usd > 0.01:
        print(f"{curr:8} {bal:15.6f} (${usd:,.2f})")

print('=' * 60)
print(f"Total Value: ${total_usd:,.2f}")
print('=' * 60)
