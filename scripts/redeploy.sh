#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== force production redeploy ==="
vercel --prod --yes 2>&1 | tail -8
echo ""
echo "=== wait for ready ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 10
  NEW=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1)
  echo "  [$i] $(echo "$NEW" | awk '{print $4}')"
  echo "$NEW" | grep -q "Ready" && break
done
echo ""
echo "=== music API check ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=calm" | head -c 300
echo ""
