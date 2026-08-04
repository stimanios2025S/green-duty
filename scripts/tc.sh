#!/bin/sh
cd /home/user/greenduty
node node_modules/typescript/bin/tsc --noEmit 2>&1 | head -10
echo "TSC $?"
node node_modules/next/dist/bin/next build 2>&1 | tail -4
