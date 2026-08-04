#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"

echo "=== Wait for build to finish ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/v13/deployments/dpl_BVWFNt96ds2MxvuoQ?teamId=$TEAM" | grep -o '"readyState":"[^"]*"' | head -1)
  echo "  attempt $i: $STATUS"
  case "$STATUS" in
    *READY*|*ERROR*|*CANCELED*) break ;;
  esac
  sleep 6
done

echo ""
echo "=== Live signup test (fresh email) ==="
URL="https://green-duty-boukrif-stimanios-projects.vercel.app"
EMAIL="live-test-$(date +%s)@example.com"
curl -s -X POST "$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Live Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\",\"accountType\":\"guest\"}" \
  --max-time 30 2>&1 | head -c 600
echo ""
echo "Test email: $EMAIL"
