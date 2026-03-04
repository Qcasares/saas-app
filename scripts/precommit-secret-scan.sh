#!/usr/bin/env bash
set -euo pipefail

# Lightweight secret scan for staged files
# Blocks commits that include common secret patterns or sensitive files

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [[ -z "${STAGED_FILES}" ]]; then
  exit 0
fi

# File path denylist (case-insensitive)
DENYLIST_REGEX='(^|/)(\.env(\..*)?$|client_secret\.json$|.*\.pem$|.*\.key$|id_rsa$|id_ed25519$)'

# Content patterns (case-insensitive where applicable)
PATTERNS=(
  'BEGIN PRIVATE KEY'
  'BEGIN RSA PRIVATE KEY'
  'OPENAI_API_KEY'
  'COINBASE_API_KEY'
  'COINBASE_API_SECRET'
  'GOOGLE_CLIENT_SECRET'
  'AWS_SECRET_ACCESS_KEY'
  'AWS_ACCESS_KEY_ID'
  'sk-[A-Za-z0-9]{20,}'
  'xox[baprs]-[A-Za-z0-9-]+'
)

HIT=0

while IFS= read -r file; do
  # Skip deleted files
  if [[ ! -f "$file" ]]; then
    continue
  fi

  if [[ "$file" =~ $DENYLIST_REGEX ]]; then
    echo "[BLOCKED] Staged sensitive file: $file"
    HIT=1
    continue
  fi

  # Scan file content for patterns
  for pattern in "${PATTERNS[@]}"; do
    if grep -Eqi "$pattern" "$file"; then
      echo "[BLOCKED] Secret pattern match in $file (pattern: $pattern)"
      HIT=1
      break
    fi
  done

done <<< "$STAGED_FILES"

if [[ $HIT -eq 1 ]]; then
  echo "\nCommit blocked. Remove secrets or add them to a secure store." >&2
  exit 1
fi

exit 0
