#!/bin/sh
echo "=== search common Vercel config locations ==="
for d in ~/.vercel ~/.local/share/com.vercel.cli ~/AppData/Roaming/com.vercel.cli ~/AppData/Roaming/vercel ~/AppData/Local/vercel; do
  [ -e "$d" ] && echo "FOUND: $d" && ls -la "$d" 2>&1 | head -5
done
echo ""
echo "=== where does vercel CLI store config? ==="
vercel whoami 2>&1 | tail -2
