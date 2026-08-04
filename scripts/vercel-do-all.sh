#!/bin/sh
# Use Vercel API with the stored CLI token to configure the project.
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
if [ -z "$TOKEN" ]; then
  echo "ERROR: no token found in auth.json"
  cat "$AUTH"
  exit 1
fi
echo "Token found (len: ${#TOKEN})"

PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo ""
echo "=== 1. Current project protection settings ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v9/projects/$PROJECT?teamId=$TEAM" | head -c 2000
echo ""
