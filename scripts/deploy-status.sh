#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== Latest deployment status ==="
sleep 8
curl -s -H "Authorization: Bearer $TOKEN" "$API/v13/deployments/dpl_BVWFNt96ds2MxvuoQ?teamId=$TEAM" | grep -o '"status":"[^"]*"\|"readyState":"[^"]*"\|"url":"[^"]*"' | head -5
echo ""
echo "=== Test: is the site public now? (no auth prompt) ==="
curl -s -o /dev/null -w "HTTP %{http_code} → %{redirect_url}\n" --max-time 25 "https://green-duty-boukrif-stimanios-projects.vercel.app/login" 2>&1
echo ""
