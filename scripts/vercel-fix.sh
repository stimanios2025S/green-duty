#!/bin/sh
# Disable deployment protection + add env vars via Vercel API
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== 1. Disable SSO/Deployment protection (make production public) ==="
curl -s -X PATCH "$API/v9/projects/$PROJECT?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null,"passwordProtection":null}' | head -c 400
echo ""

echo ""
echo "=== 2. Verify protection is off ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v9/projects/$PROJECT?teamId=$TEAM" | grep -o '"ssoProtection":[^}]*}' | head -1
echo ""
