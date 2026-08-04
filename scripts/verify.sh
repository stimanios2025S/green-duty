#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
for i in 1 2 3 4 5 6 7 8; do
  sleep 12
  NEW=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1)
  echo "  [$i] $(echo "$NEW" | awk '{print $4}')"
  echo "$NEW" | grep -q "Ready" && break
done
echo ""
echo "=== music with album art ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | grep -o '"albumImage":"[^"]*"' | head -1
echo ""
echo "=== search API ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/instagro/search?q=eco" | head -c 200
echo ""
echo "=== messages page ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 30 "https://green-duty.vercel.app/feed/messages"
