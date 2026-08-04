#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== env vars on Vercel project ==="
vercel env ls 2>&1 | head -15
echo ""
echo "=== production domains/aliases ==="
vercel domains ls 2>&1 | head -10
echo ""
echo "=== project settings (protection hint) ==="
vercel project ls 2>&1 | head -8
