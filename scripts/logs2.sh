#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== deployments list ==="
vercel ls green-duty 2>&1 | grep "green-duty-" | head -4
echo ""
echo "=== logs for the newest ==="
LATEST=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1 | awk '{print $3}')
echo "URL: $LATEST"
vercel logs "$LATEST" 2>&1 | tail -20
