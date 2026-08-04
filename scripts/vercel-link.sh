#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
vercel link --yes --project green-duty 2>&1 | tail -6
echo "--- .vercel ---"
cat .vercel/project.json 2>/dev/null || echo "link failed"
