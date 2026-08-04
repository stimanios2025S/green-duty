#!/bin/sh
echo "=== exact route URL (limit=30, search=meditation) ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=30&include=musicinfo&audioformat=mp32&order=popularity_total&search=meditation" | head -c 300
echo ""
echo "=== without search (should be 30) ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=30&include=musicinfo&audioformat=mp32&order=popularity_total" | grep -o '"results_count":[0-9]*'
echo ""
echo "=== with tags=electronic ==="
curl -s --max-time 30 "https://api.jamendo.com/v3.0/tracks/?client_id=52b5ce2c&format=json&limit=30&include=musicinfo&audioformat=mp32&order=popularity_total&tags=electronic" | grep -o '"results_count":[0-9]*'
