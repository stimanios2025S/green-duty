#!/bin/sh
echo "=== full first track (check album fields) ==="
curl -s --max-time 40 "https://green-duty.vercel.app/api/music?q=meditation" | head -c 700
echo ""
