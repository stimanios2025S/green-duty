#!/bin/sh
cd /home/user/greenduty
node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -30
echo "EXIT: $?"
