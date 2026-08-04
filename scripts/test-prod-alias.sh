#!/bin/sh
URL="https://green-duty.vercel.app"
EMAIL="e2e-$(date +%s)@example.com"
echo "Testing production alias: $URL"
echo "Email: $EMAIL"
echo ""

echo "--- 1. Homepage /login ---"
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 25 "$URL/login"

echo ""
echo "--- 2. SIGNUP ---"
RESP=$(curl -s -X POST "$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\",\"accountType\":\"guest\"}" \
  --max-time 45)
echo "$RESP"
CODE=$(echo "$RESP" | grep -o '"fallbackCode":"[^"]*"' | sed 's/.*:"//; s/"//')
[ -z "$CODE" ] && CODE="000000"
echo ""

echo "--- 3. VERIFY (code $CODE) ---"
curl -s -X POST "$URL/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}" \
  --max-time 45 | head -c 350
echo ""

echo ""
echo "--- 4. LOGIN ---"
curl -s -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" \
  --max-time 45 | head -c 350
echo ""
