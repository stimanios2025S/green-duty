#!/bin/sh
echo "=== all keys of first track ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=1&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | grep -oE '"[a-z_]+":' | sort -u | head -40
