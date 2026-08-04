#!/bin/sh
echo "=== ~/.vercel contents ==="
ls -la ~/.vercel/ 2>&1
echo ""
echo "=== auth.json (token only, first 20 chars) ==="
if [ -f ~/.vercel/auth.json ]; then
  cat ~/.vercel/auth.json | head -c 80
  echo ""
else
  echo "no auth.json"
fi
