#!/bin/bash
cd "C:\Users\stimanios\green-duty"
git add app/globals.css app/dashboard/page.tsx
git commit -m "fix: white screen on Vercel - @theme inline to @theme, missing color tokens, DA currency"
git push
