#!/bin/sh
URL="https://green-duty-6wrrm0wdu-boukrif-stimanios-projects.vercel.app"
echo "=== 1. Homepage ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 25 "$URL/login" 2>&1

echo ""
echo "=== 2. Signup API (real test) ==="
curl -s -X POST "$URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vercel Test","email":"verceltest-'"$(date +%s)"'@example.com","password":"secret123","accountType":"guest"}' \
  --max-time 30 2>&1
echo ""
