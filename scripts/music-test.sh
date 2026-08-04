#!/bin/sh
echo "=== music API (no query — should list world music) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?genre=electronic" | head -c 400
echo ""
echo "=== raw Jamendo from server route (search 'meditation') ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | head -c 400
echo ""
