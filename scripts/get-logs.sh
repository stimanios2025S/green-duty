#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== runtime logs for latest deployment ==="
vercel logs green-duty-bt7fq2jlz-boukrif-stimanios-projects.vercel.app 2>&1 | tail -40
