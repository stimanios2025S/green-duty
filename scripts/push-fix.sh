#!/bin/sh
cd /home/user/greenduty
git add lib/db.ts
git commit -m "fix: use batch for Turso schema init (multi-statement SQL)

libSQL execute() rejects multiple statements; split schema and use batch()

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -2
echo "--- push ---"
git push 2>&1 | tail -2
