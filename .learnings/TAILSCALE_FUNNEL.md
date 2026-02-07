# Tailscale Funnel Configuration

## Status: ✅ CONFIGURED

**Public URL:** https://mm.tailc992d2.ts.net/
**Local Target:** http://localhost:18789 (OpenClaw Gateway)
**Machine:** mm (Mac mini)
**Tailnet:** tailc992d2.ts.net

## Start the Funnel

The funnel needs to run in the foreground (or via tmux/screen):

```bash
tailscale funnel localhost:18789
```

Or to run in background (requires keeping Terminal open):
```bash
# In a new Terminal window/tab
tailscale funnel localhost:18789
```

## How It Works

Tailscale Funnel creates a secure HTTPS tunnel from the public internet to your local OpenClaw instance:

```
Internet → https://mm.tailc992d2.ts.net/ → Tailscale → Your Mac mini → OpenClaw (port 18789)
```

## Access Methods

### 1. Public URL (anyone with the link)
```
https://mm.tailc992d2.ts.net/
```

### 2. With Auth Token
```
https://mm.tailc992d2.ts.net/?token=d0cbd2b56e4235723860a68f5ddfce2995507fd340a4e175
```

### 3. Within Tailnet (more secure)
```
http://mm:18789
```

## Management Commands

```bash
# Check funnel status
tailscale funnel status

# View serve config
tailscale serve status

# Stop funnel
tailscale funnel reset

# Start funnel
tailscale funnel localhost:18789
```

## Security

- ✅ HTTPS enabled (Tailscale manages certificates)
- ✅ URL is public but obscure (random tailnet suffix)
- ✅ OpenClaw token auth still applies
- ⚠️ Funnel stops if Terminal closes (unless using tmux/screen)

## Persistent Setup (Optional)

To keep funnel running after Terminal closes, use tmux:

```bash
# Install tmux
brew install tmux

# Start new session
tmux new -s funnel

# In tmux session
tailscale funnel localhost:18789

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t funnel
```