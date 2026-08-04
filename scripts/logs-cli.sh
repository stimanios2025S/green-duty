#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== vercel integration ls ==="
vercel integration ls 2>&1 | head -15
echo ""
echo "=== vercel logs (recent) ==="
vercel logs dpl_BVWFNt96ds2MxvuoQ 2>&1 | tail -20
