#!/bin/sh
echo "=== SSH keys ==="
ls ~/.ssh/ 2>/dev/null || echo "no ~/.ssh directory"
echo ""
echo "=== git credential helper ==="
git config --global credential.helper 2>&1 || echo "(none)"
echo ""
echo "=== winget ==="
command -v winget 2>&1 || echo "no winget"
echo ""
echo "=== existing gitignore safety: env/data ==="
grep -n "env\|/data" /home/user/greenduty/.gitignore 2>&1
