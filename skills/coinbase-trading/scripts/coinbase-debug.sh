#!/bin/bash
# Debug Coinbase API authentication

cd "$(dirname "$0")"
source ../../.env 2>/dev/null

echo "Testing Coinbase API..."
echo "API Key: ${COINBASE_API_KEY:0:15}..."
echo ""

# Test without auth first (should fail)
echo "Test 1: Accounts without auth (expect 401)"
curl -s -w "\nHTTP Code: %{http_code}\n" "https://api.coinbase.com/api/v3/brokerage/accounts" 2>/dev/null | tail -3
echo ""

# Now test with a simple JWT
echo "Test 2: Generate JWT"
timestamp=$(date +%s)
header=$(echo -n '{"alg":"ES256","typ":"JWT","kid":"'$COINBASE_API_KEY'"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
payload=$(echo -n '{"iss":"cdp","nbf":'$timestamp',"exp":'$(($timestamp + 120))',"sub":"'$COINBASE_API_KEY'","uri":"GET api.coinbase.com/api/v3/brokerage/accounts"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
echo "Header: ${header:0:50}..."
echo "Payload: ${payload:0:50}..."

# Write key to temp file
keyfile=$(mktemp)
echo "$COINBASE_API_SECRET" > "$keyfile"
echo "Key file: $keyfile"

# Try to sign
signing_input="${header}.${payload}"
if signature=$(echo -n "$signing_input" | openssl dgst -sha256 -sign "$keyfile" 2>&1 | openssl base64 -e -A | tr '+/' '-_' | tr -d '='); then
    jwt="${signing_input}.${signature}"
    echo "JWT generated successfully: ${jwt:0:80}..."
    echo ""
    echo "Test 3: Accounts with JWT auth"
    curl -s -w "\nHTTP Code: %{http_code}\n" -H "Authorization: Bearer $jwt" "https://api.coinbase.com/api/v3/brokerage/accounts" 2>/dev/null | head -20
else
    echo "Failed to sign JWT: $signature"
fi

rm -f "$keyfile"
