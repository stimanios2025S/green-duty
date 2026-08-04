#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "fix: Jamendo tags can be a string — world music now returns results

The genre mapping crashed on tracks whose musicinfo.tags is a string
instead of an array, throwing the whole branch into the local fallback.
Now handles array OR string tags.

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -2
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
echo "=== WORLD MUSIC TEST (meditation) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | head -c 300
echo ""
echo "=== WORLD MUSIC TEST (electronic) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?genre=electronic" | head -c 250
echo ""
