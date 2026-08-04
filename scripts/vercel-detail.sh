#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== green-duty project deployments ==="
vercel ls green-duty 2>&1 | head -10
echo ""
echo "=== production URL probe ==="
curl -s -o /dev/null -w "HTTP %{http_code} (redirect: %{redirect_url})\n" -L --max-time 20 "https://green-duty-6wrrm0wdu-boukrif-stimanios-projects.vercel.app" 2>&1
echo ""
echo "=== env vars on project ==="
vercel env ls 2>&1 | head -12
