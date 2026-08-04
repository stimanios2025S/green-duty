#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== Add RESEND_API_KEY (Production) ==="
curl -s -X POST "$API/v10/projects/$PROJECT/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"RESEND_API_KEY","value":"re_ZWxjXecq_239rD4XLLFXE15SkoZumnLw9","type":"encrypted","target":["production"]}' | head -c 500
echo ""

echo ""
echo "=== Add EMAIL_FROM (Production) ==="
curl -s -X POST "$API/v10/projects/$PROJECT/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"EMAIL_FROM","value":"GreenDuty <onboarding@resend.dev>","type":"encrypted","target":["production"]}' | head -c 500
echo ""

echo ""
echo "=== Verify env vars ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v9/projects/$PROJECT/env?teamId=$TEAM" | grep -o '"key":"[^"]*"' | head
echo ""
