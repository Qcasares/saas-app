#!/bin/bash
# Debug JWT signing for Coinbase API

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../.."

if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "Error: .env not found at $(pwd)/.env"
    exit 1
fi

echo "=== Coinbase JWT Debug ==="
echo "Working dir: $(pwd)"
echo "API Key: ${COINBASE_API_KEY:0:20}..."
echo "Secret length: ${#COINBASE_API_SECRET}"
echo ""

# Create temp key file properly
keyfile=$(mktemp)
printf '%s\n' "$COINBASE_API_SECRET" > "$keyfile"

echo "=== Key File Check ==="
echo "Key file: $keyfile"
ls -la "$keyfile"
echo ""

# Test 1: Check if OpenSSL can read the key
echo "=== Testing Key Parse ==="
if openssl ec -in "$keyfile" -text -noout 2>&1 | head -3; then
    echo "✅ Key parses successfully"
else
    echo "❌ Key parse failed"
    cat "$keyfile"
fi
echo ""

# Test 2: Generate JWT step by step
echo "=== JWT Generation ==="
timestamp=$(date +%s)
exp=$(($timestamp + 120))

# Header
header='{"alg":"ES256","typ":"JWT","kid":"'$COINBASE_API_KEY'"}'
echo "Header JSON: $header"
b64_header=$(echo -n "$header" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
echo "Header B64: ${b64_header:0:60}..."
echo ""

# Payload
uri="GET api.coinbase.com/api/v3/brokerage/accounts"
payload='{"iss":"cdp","nbf":'$timestamp',"exp":'$exp',"sub":"'$COINBASE_API_KEY'","uri":"'$uri'"}'
echo "Payload JSON: ${payload:0:100}..."
b64_payload=$(echo -n "$payload" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')
echo "Payload B64: ${b64_payload:0:60}..."
echo ""

# Signing
signing_input="${b64_header}.${b64_payload}"
echo "Signing input length: ${#signing_input}"

echo "=== Attempting to Sign ==="
if signature=$(echo -n "$signing_input" | openssl dgst -sha256 -sign "$keyfile" 2>/tmp/openssl_error.txt | openssl base64 -e -A | tr '+/' '-_' | tr -d '='); then
    echo "✅ Signature created: ${signature:0:60}..."
    jwt="${signing_input}.${signature}"
    echo "JWT length: ${#jwt}"
    echo ""
    echo "=== Testing API Call ==="
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $jwt" "https://api.coinbase.com/api/v3/brokerage/accounts")
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | grep -v "HTTP_CODE:")
    echo "HTTP Code: $http_code"
    echo "Response: ${body:0:300}"
else
    echo "❌ Signing failed"
    cat /tmp/openssl_error.txt
fi

rm -f "$keyfile" /tmp/openssl_error.txt
