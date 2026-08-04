#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== deployments ==="
vercel ls green-duty 2>&1 | head -6
echo ""
echo "=== newest deployment status ==="
vercel inspect green-duty-bt7fq2jlz-boukrif-stimanios-projects.vercel.app 2>&1 | grep -i "status\|state\|ready\|alias" | head -8
