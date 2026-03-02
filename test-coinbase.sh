#!/bin/bash
# Direct Coinbase API test with proper JWT

cd /Users/quentincasares/.openclaw/workspace
source .env

KEY_ID="$COINBASE_API_KEY"
KEY_NAME="organizations/517ace2a-5ef0-4120-994a-d0f2d20f83b6/apiKeys/$KEY_ID"
SECRET="$COINBASE_API_SECRET"

echo "Key ID: $KEY_ID"
echo "Key Name: $KEY_NAME"
echo ""

# Create JWT
timestamp=$(date +%s)
exp=$((timestamp + 120))

# Header
header=$(echo -n '{"alg":"ES256","typ":"JWT","kid":"'$KEY_ID'"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')

# Payload - iss=key_id, sub=key_name
payload=$(echo -n '{"iss":"'$KEY_ID'","sub":"'$KEY_NAME'","aud":"https://api.coinbase.com","nbf":'$timestamp',"exp":'$exp',"uri":"GET api.coinbase.com/api/v3/brokerage/accounts"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')

# Sign
keyfile=$(mktemp)
echo "$SECRET" > "$keyfile"
signing_input="${header}.${payload}"
signature=$(echo -n "$signing_input" | openssl dgst -sha256 -sign "$keyfile" 2>/dev/null | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
rm -f "$keyfile"

jwt="${signing_input}.${signature}"

echo "JWT: ${jwt:0:80}..."
echo ""
echo "Testing API..."

# Test with curl
curl -s -H "Authorization: Bearer $jwt" "https://api.coinbase.com/api/v3/brokerage/accounts" | head -c 500
