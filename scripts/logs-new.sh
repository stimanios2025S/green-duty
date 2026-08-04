#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
echo "=== logs for green-duty-heakrjid0 ==="
vercel logs green-duty-heakrjid0-boukrif-stimanios-projects.vercel.app 2>&1 | tail -25
