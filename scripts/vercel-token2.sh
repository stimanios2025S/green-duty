#!/bin/sh
echo "=== AppData/Local/com.vercel.cli ==="
ls -la /c/Users/stimanios/AppData/Local/com.vercel.cli/ 2>&1 | head
echo ""
echo "=== xdg.data/com.vercel.cli ==="
ls -la /c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/ 2>&1 | head
echo ""
echo "=== auth.json content (first 30 chars) ==="
for f in /c/Users/stimanios/AppData/Local/com.vercel.cli/auth.json /c/Users/stimanios/AppData/Roaming/xdg.data/com.vercel.cli/auth.json; do
  if [ -f "$f" ]; then
    echo "FOUND: $f"
    head -c 60 "$f"
    echo ""
  fi
done
