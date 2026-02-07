# Second Brain Configuration

To activate semantic memory (Ensue integration):

## Step 1: Get API Key
Visit: https://ensue-network.ai/dashboard

## Step 2: Set Environment Variable
Add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
export ENSUE_API_KEY="your-api-key-here"
```

## Step 3: Enable in OpenClaw
Either:
- Set the environment variable before starting OpenClaw
- Or update openclaw.json with the skill configuration

## Step 4: Verify
Test with:
```bash
curl -X POST https://api.ensue-network.ai/ \
  -H "Authorization: Bearer $ENSUE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_keys","arguments":{"prefix":"public/","limit":5}},"id":1}'
```

## Current Status
- Second Brain skill: ✅ Installed
- API Key: ❌ Not configured
- Local memory: ✅ Active (all tiers working)

## Without API Key
Local memory still functions fully:
- Daily notes (memory/YYYY-MM-DD.md)
- Learning logs (.learnings/*.md)
- Curated memory (MEMORY.md)
- Memory search (semantic search via file contents)

The Ensue integration adds:
- Semantic search across structured namespaces
- Cross-device memory sync
- Vector-based retrieval
