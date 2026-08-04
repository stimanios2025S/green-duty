#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== all deployments ==="
vercel ls green-duty 2>&1
echo ""
echo "=== inspect newest ==="
vercel inspect green-duty-heakrjid0-boukrif-stimanios-projects.vercel.app 2>&1 | head -25
