#!/bin/sh
echo "=== with include=albumimage ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=2&include=musicinfo,albumimage&audioformat=mp32&order=popularity_total&search=meditation" | grep -o '"status":"[a-z]*"' | head -1
echo ""
echo "=== without albumimage include ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=2&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | grep -o '"status":"[a-z]*"' | head -1
echo ""
echo "=== what image fields exist? ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=1&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | grep -o '"image":"[^"]*"' | head -2
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=1&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | grep -o '"album_image":"[^"]*"' | head -2
