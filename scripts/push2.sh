#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "fix: await Turso schema init in getDb (race condition)

The schema batch was fire-and-forget, so the first query hit a missing
table. getDb() is now async and awaits schema creation before returning.

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -2
echo "--- push ---"
git push 2>&1 | tail -2
