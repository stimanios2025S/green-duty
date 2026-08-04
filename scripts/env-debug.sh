#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== latest deployment id ==="
vercel ls green-duty 2>&1 | grep "green-duty-" | head -1
echo ""
echo "=== inspect latest deployment env ==="
vercel inspect green-duty.vercel.app 2>&1 | grep -iA2 "env\|status" | head -20
