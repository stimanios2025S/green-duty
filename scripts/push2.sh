#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "debug: log Jamendo response shape" 2>&1 | tail -2
git push 2>&1 | tail -2
echo "=== wait for deploy ==="
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
for i in 1 2 3 4 5 6 7 8; do
  sleep 12
  NEW=$(vercel ls green-duty 2>&1 | grep "green-duty-" | head -1)
  echo "  [$i] $(echo "$NEW" | awk '{print $4}')"
  echo "$NEW" | grep -q "Ready" && break
done
echo "=== music test ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | head -c 300
echo ""
echo "=== logs ==="
vercel logs green-duty.vercel.app 2>&1 | grep -i "music\|jamendo" | tail -8
