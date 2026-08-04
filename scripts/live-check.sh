#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== Production deployments (most recent 3) ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v6/deployments?projectId=prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j&teamId=$TEAM&target=production&limit=3" \
  | grep -o '"uid":"[^"]*"\|"state":"[^"]*"\|"readyState":"[^"]*"\|"url":"[^"]*"\|"created":[0-9]*' | head -20
echo ""
echo "=== Live URL probe ==="
curl -s -o /dev/null -w "login: HTTP %{http_code}\n" --max-time 25 "https://green-duty-boukrif-stimanios-projects.vercel.app/login"
curl -s -o /dev/null -w "home:  HTTP %{http_code}\n" --max-time 25 "https://green-duty-boukrif-stimanios-projects.vercel.app/"
