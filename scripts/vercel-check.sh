#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== whoami ==="
vercel whoami 2>&1 | head -3
echo ""
echo "=== project link (.vercel) ==="
ls -la .vercel 2>/dev/null && cat .vercel/project.json 2>/dev/null || echo "not linked yet"
echo ""
echo "=== recent deployments ==="
vercel ls 2>&1 | head -12
