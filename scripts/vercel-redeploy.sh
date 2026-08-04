#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== Trigger redeploy from latest git commit ==="
curl -s -X POST "$API/v13/deployments?teamId=$TEAM&forceNew=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"green-duty\",\"project\":\"$PROJECT\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"repoId\":1322347878,\"ref\":\"master\"}}" | head -c 600
echo ""
