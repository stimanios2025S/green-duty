#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
echo "=== find config dirs (Windows) ==="
find /c/Users/stimanios/AppData -iname "*vercel*" -maxdepth 4 2>/dev/null | head -10
echo ""
echo "=== env add help ==="
vercel env add --help 2>&1 | head -20
echo ""
echo "=== can we see project settings via CLI? ==="
vercel project inspect green-duty 2>&1 | head -20
