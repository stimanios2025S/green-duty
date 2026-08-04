#!/bin/sh
npm install -g vercel 2>&1 | tail -3
echo "---verify---"
export PATH="$PATH:/c/Program Files/nodejs"
command -v vercel 2>&1 && vercel --version 2>&1 | head -1 || echo "vercel not in PATH"
