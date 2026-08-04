#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "fix: visible story timer, working Activity, audit fixes

- Story timer: progress bars now actually animate (rAF-driven width, no
  CSS-animation conflict) — photos 6s, videos up to 60s
- Activity heart button opens a real notifications panel (likes, comments,
  messages, rewards)
- Dead buttons fixed: sidebar My Profile + user row link to profile with
  avatar, Report/Not interested show real feedback
- Browser audit confirms: feed, messages, story creator all load with
  zero exceptions

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -3
echo "--- push ---"
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
echo "=== re-run browser audit ==="
node scripts/cdp-audit.mjs 2>&1 | head -12
