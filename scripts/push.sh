#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "fix: remove -m-6 full-bleed hack causing real overflow

The negative margin expanded containers 24px past the viewport on
tablet/desktop. InstaGro pages render in a full-width unpadded main, so
-m-6 is unnecessary — removed it. Home page keeps a clean h-full wrapper.

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -3
git push 2>&1 | tail -2
echo "=== wait for deploy ==="
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
for i in 1 2 3 4 5 6 7 8; do
  sleep 12
  NEW=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1)
  echo "  [$i] $(echo "$NEW" | awk '{print $4}')"
  echo "$NEW" | grep -q "Ready" && break
done
echo ""
echo "=== resolution audit ==="
node scripts/res-audit.mjs 2>&1 | head -8
