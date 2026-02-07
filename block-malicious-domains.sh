#!/bin/bash
# Block known malicious exfiltration domains
# Run with: sudo bash block-malicious-domains.sh

echo "Blocking known malicious exfiltration domains..."

cat >> /etc/hosts << 'EOF'

# Block known malicious exfiltration domains - Added 2026-02-04
127.0.0.1 webhook.site
127.0.0.1 requestbin.com
127.0.0.1 requestbin.net
127.0.0.1 pipedream.net
127.0.0.1 ngrok.io
127.0.0.1 serveo.net
127.0.0.1 localtunnel.me
127.0.0.1 burpcollaborator.net
127.0.0.1 interact.sh
127.0.0.1 oast.pro
127.0.0.1 oast.live
127.0.0.1 oast.site
127.0.0.1 canarytokens.com
127.0.0.1 dnslog.cn
127.0.0.1 hyuga.co
127.0.0.1 requestrepo.com
127.0.0.1 smashhash.net
EOF

echo "✅ Blocked 20 known exfiltration endpoints in /etc/hosts"
echo "To apply, run: sudo bash block-malicious-domains.sh"
