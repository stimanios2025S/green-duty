#!/bin/sh
# Check GitHub CLI availability and auth state
echo "=== gh location ==="
command -v gh || echo "gh NOT FOUND"
echo ""
echo "=== gh version ==="
gh --version 2>&1 | head -2 || echo "no gh"
echo ""
echo "=== gh auth status ==="
gh auth status 2>&1 | head -15 || echo "auth check failed"
echo ""
echo "=== git remotes ==="
git -C /home/user/greenduty remote -v 2>&1 || echo "no remotes"
