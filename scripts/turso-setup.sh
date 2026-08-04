#!/bin/sh
# Add Turso env vars to Vercel + trigger redeploy
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
PROJECT="prj_xeLtqZpnXOzAhpSFRrWDsGKOR58j"
TEAM="team_6EoWgumo4jU0SsY8Ad0rHmeC"
API="https://api.vercel.com"
TURSO_URL="libsql://greenduty-stimanios2025s.aws-eu-west-1.turso.io"
TURSO_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU4MzU1NTYsImlkIjoiMDE5ZmNjMTctYzAwMS03YjAwLTkwZTEtNWI0Zjc5Mzk1MTZlIiwia2lkIjoid3NIWGZKYlU0cm5qcGUzQm9xbWlQVlJHWm0tSjgtVFNIeVFMNXBhcUZLcyIsInJpZCI6ImY5YzRhYzQxLTZkNTMtNGQ4NC05ZjE4LTJiYWMxZGRiZGJiOCJ9.msbMa4gr4m1s18vKkVuuUdpT3qTbeTSChgsnlTChqHOvCrkeDwg43-rUatiafp-Gzu_LFnnktcaKttmsOLW5Bw"

echo "=== 1. Add TURSO_DATABASE_URL (Production) ==="
curl -s -X POST "$API/v10/projects/$PROJECT/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"TURSO_DATABASE_URL\",\"value\":\"$TURSO_URL\",\"type\":\"encrypted\",\"target\":[\"production\"]}" | head -c 120
echo ""

echo "=== 2. Add TURSO_AUTH_TOKEN (Production) ==="
curl -s -X POST "$API/v10/projects/$PROJECT/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"TURSO_AUTH_TOKEN\",\"value\":\"$TURSO_TOKEN\",\"type\":\"encrypted\",\"target\":[\"production\"]}" | head -c 120
echo ""

echo "=== 3. Verify all env vars ==="
curl -s -H "Authorization: Bearer $TOKEN" "$API/v9/projects/$PROJECT/env?teamId=$TEAM" | grep -o '"key":"[^"]*"' | sort -u
echo ""
