#!/bin/sh
URL="https://green-duty-bt7fq2jlz-boukrif-stimanios-projects.vercel.app"
EMAIL="e2e-$(date +%s)@example.com"
echo "Test email: $EMAIL"
echo ""

echo "=== 1. SIGNUP ==="
RESP=$(curl -s -X POST "$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\",\"accountType\":\"guest\"}" \
  --max-time 40)
echo "$RESP"
echo ""

# Extract fallbackCode if present
CODE=$(echo "$RESP" | grep -o '"fallbackCode":"[^"]*"' | sed 's/.*:"//; s/"//')
echo "fallbackCode: ${CODE:-none}"

if [ -z "$CODE" ]; then
  echo "No fallback code — checking verify with dummy"
  CODE="000000"
fi

echo ""
echo "=== 2. VERIFY ==="
curl -s -X POST "$URL/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}" \
  --max-time 40 | head -c 400
echo ""

echo ""
echo "=== 3. LOGIN (verified account) ==="
curl -s -X POST "$URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" \
  --max-time 40 | head -c 400
echo ""

echo ""
echo "=== 4. DUPLICATE SIGNUP (should say exists) ==="
curl -s -X POST "$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"$EMAIL\",\"password\":\"secret123\",\"accountType\":\"guest\"}" \
  --max-time 40 | head -c 200
echo ""
