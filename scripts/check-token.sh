#!/bin/sh
AUTH="/c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"
echo "=== auth.json ==="
cat "$AUTH" | head -c 400
echo ""
echo ""
echo "=== token extracted ==="
TOKEN=$(grep -o '"token"[^,]*' "$AUTH" | head -1 | sed 's/.*: *"//; s/"//')
echo "len: ${#TOKEN}"
echo "first 12: ${TOKEN:0:12}"
echo ""
echo "=== quick API test ==="
curl -s -H "Authorization: Bearer $TOKEN" "https://api.vercel.com/v2/user" | head -c 200
echo ""
