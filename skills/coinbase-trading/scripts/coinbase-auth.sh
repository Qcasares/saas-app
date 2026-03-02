#!/bin/bash
# Coinbase Advanced Trade API - Authentication Helper
# Generates signed requests for Coinbase API

set -e

# Load API credentials from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../../.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a
fi

if [ -z "$COINBASE_API_KEY" ] || [ -z "$COINBASE_API_SECRET" ]; then
    echo "Error: COINBASE_API_KEY and COINBASE_API_SECRET must be set in .env" >&2
    exit 1
fi

# API configuration
API_BASE="https://api.coinbase.com"

# The full resource name for the sub claim
# Format: organizations/{org_id}/apiKeys/{key_id}
COINBASE_KEY_NAME="organizations/517ace2a-5ef0-4120-994a-d0f2d20f83b6/apiKeys/$COINBASE_API_KEY"

# Function to base64url encode (no padding, URL-safe)
base64url_encode() {
    openssl base64 -e -A 2>/dev/null | tr '+/' '-_' | tr -d '='
}

# Function to create JWT token for authentication
create_jwt() {
    local key_id="$1"
    local key_name="$2"
    local secret_pem="$3"
    local request_method="$4"
    local request_path="$5"
    
    # Current timestamp
    local timestamp=$(date +%s)
    local exp=$(($timestamp + 120))
    
    # JWT Header - kid is the raw key ID
    local header='{"alg":"ES256","typ":"JWT","kid":"'$key_id'"}'
    local b64_header=$(echo -n "$header" | base64url_encode)
    
    # JWT Payload - CRITICAL: iss=key_id, sub=key_name (full resource path)
    # Also need 'aud' and 'uri' for Coinbase
    local uri="$request_method api.coinbase.com$request_path"
    local payload='{"iss":"'$key_id'","sub":"'$key_name'","aud":"https://api.coinbase.com","nbf":'$timestamp',"exp":'$exp',"uri":"'$uri'"}'
    local b64_payload=$(echo -n "$payload" | base64url_encode)
    
    # Create signing input
    local signing_input="${b64_header}.${b64_payload}"
    
    # Create temp file for private key
    local key_file=$(mktemp)
    printf '%s\n' "$secret_pem" > "$key_file"
    
    # Sign with ES256 (ECDSA using P-256 and SHA-256)
    local signature=$(echo -n "$signing_input" | openssl dgst -sha256 -sign "$key_file" 2>/dev/null | base64url_encode)
    
    # Cleanup
    rm -f "$key_file"
    
    # Return complete JWT
    echo "${signing_input}.${signature}"
}

# Function to make authenticated API call
coinbase_request() {
    local method="$1"
    local path="$2"
    local body="${3:-}"
    
    local jwt=$(create_jwt "$COINBASE_API_KEY" "$COINBASE_KEY_NAME" "$COINBASE_API_SECRET" "$method" "$path")
    
    local curl_opts=(-s -H "Authorization: Bearer $jwt")
    
    if [ -n "$body" ]; then
        curl_opts+=(-H "Content-Type: application/json" -d "$body")
    fi
    
    curl -X "$method" "${API_BASE}${path}" "${curl_opts[@]}"
}

# Export functions for use by other scripts
export -f base64url_encode create_jwt coinbase_request 2>/dev/null || true
export COINBASE_KEY_NAME

# If called directly with arguments, execute request
if [ $# -ge 2 ]; then
    coinbase_request "$@"
fi
