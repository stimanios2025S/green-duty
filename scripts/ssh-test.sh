#!/bin/sh
echo "=== SSH key fingerprint ==="
ssh-keygen -lf ~/.ssh/github-deploy-key.pub 2>&1
echo ""
echo "=== Test GitHub SSH auth ==="
ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i ~/.ssh/github-deploy-key git@github.com 2>&1 | head -5
echo ""
echo "=== git ssh command config ==="
git config --global core.sshCommand 2>&1 || echo "(none)"
