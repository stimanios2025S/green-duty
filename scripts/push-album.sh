#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "fix: remove invalid Jamendo include=albumimage (broke search)

include=albumimage makes Jamendo return status:failed → route fell back
to local. album_image/image come in the default response anyway.

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
echo "=== music (meditation) with album art ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | grep -o '"source":"[a-z]*"' | head -1
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | grep -o '"albumImage":"[^"]*"' | head -1
echo ""
