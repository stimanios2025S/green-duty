#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
echo "=== vercel whoami ==="
vercel whoami 2>&1 | head -5
echo "=== exit: $? ==="
