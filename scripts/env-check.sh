#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== all env vars (incl sensitive count) ==="
vercel env ls --project green-duty 2>&1 | tail -12
echo ""
echo "=== check if key exists in project API ==="
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v9/projects/prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j/env?teamId=team_6EoWgumo4jU0SsY8Ad0rHmeC" | grep -o '"key":"[^"]*"' | sort -u
