#!/bin/sh
echo "=== electronic (should be jamendo now) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?genre=electronic" | head -c 300
echo ""
echo "=== popular (no filter) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music" | head -c 300
echo ""
echo "=== direct Jamendo search 'meditation' ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=3&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | head -c 200
echo ""
