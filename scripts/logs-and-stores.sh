#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== 1. Function runtime logs (deployment) ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v1/deployments/dpl_BVWFNt96ds2MxvuoQ/runtime-logs?teamId=$TEAM&limit=30" 2>&1 | head -c 1500
echo ""

echo ""
echo "=== 2. Existing stores (Postgres/KV/Blob) on team ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v1/integrations/stores?teamId=$TEAM" 2>&1 | head -c 800
echo ""
