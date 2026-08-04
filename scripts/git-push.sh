#!/bin/sh
cd /home/user/greenduty
git add -A
git commit -m "feat: dual-mode database (Turso for production, SQLite for dev)

- Async DB interface shared by both backends
- Turso/libSQL client for serverless (Vercel) persistence
- Local SQLite fallback for development

Co-Authored-By: Claude <noreply@anthropic.com>" 2>&1 | tail -3
echo "--- push ---"
git push 2>&1 | tail -3
