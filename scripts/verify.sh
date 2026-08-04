#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== waiting for deploy ==="
for i in 1 2 3 4 5 6 7 8; do
  sleep 12
  NEW=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1)
  echo "  [$i] $(echo "$NEW" | awk '{print $4}')"
  echo "$NEW" | grep -q "Ready" && break
done
echo ""
echo "=== music API (should be jamendo now) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=calm" | head -c 500
echo ""
