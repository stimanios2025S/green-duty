#!/bin/sh
cd /home/user/greenduty
node scripts/cdp-audit.mjs 2>&1 | head -30
