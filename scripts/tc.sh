#!/bin/sh
cd /home/user/greenduty
node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -10
echo "EXIT $?"
