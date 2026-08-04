#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty

echo "=== wait for latest deployment to be READY ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  LATEST=$(vercel ls green-duty 2>&1 | grep green-duty | head -1)
  echo "  [$i] $(echo "$LATEST" | awk '{print $3, $4}')"
  echo "$LATEST" | grep -q "Ready" && break
  sleep 10
done

echo ""
echo "=== get latest deployment URL ==="
URL=$(vercel ls green-duty 2>&1 | grep green-duty | grep Ready | head -1 | awk '{print $3}')
echo "URL: $URL"
echo "$URL" > /tmp/gd-url.txt

echo ""
echo "=== E2E test on $URL ==="
EMAIL="e2e-$(date +%s)@example.com"
echo "Email: $EMAIL"
echo ""
echo "--- SIGNUP ---"
RESP=$(curl -s -X POST "https://$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\",\"accountType\":\"guest\"}" \
  --max-time 40)
echo "$RESP"
CODE=$(echo "$RESP" | grep -o '"fallbackCode":"[^"]*"' | sed 's/.*:"//; s/"//')
[ -z "$CODE" ] && CODE="000000"
echo ""
echo "--- VERIFY (code $CODE) ---"
curl -s -X POST "https://$URL/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}" \
  --max-time 40 | head -c 300
echo ""
echo ""
echo "--- LOGIN ---"
curl -s -X POST "https://$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" \
  --max-time 40 | head -c 300
echo ""
