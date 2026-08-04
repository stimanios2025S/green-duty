#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== deploy production ==="
vercel --prod --yes 2>&1 | tail -15
