#!/bin/sh
export PATH="$PATH:/c/Users/stimanios/AppData/Roaming/npm"
cd /home/user/greenduty
TURSO_URL="libsql://greenduty-stimanios2025s.aws-eu-west-1.turso.io"
TURSO_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU4MzU1NTYsImlkIjoiMDE5ZmNjMTctYzAwMS03YjAwLTkwZTEtNWI0Zjc5Mzk1MTZlIiwia2lkIjoid3NIWGZKYlU0cm5qcGUzQm9xbWlQVlJHWm0tSjgtVFNIeVFMNXBhcUZLcyIsInJpZCI6ImY5YzRhYzQxLTZkNTMtNGQ4NC05ZjE4LTJiYWMxZGRiZGJiOCJ9.msbMa4gr4m1s18vKkVuuUdpT3qTbeTSChgsnlTChqHOvCrkeDwg43-rUatiafp-Gzu_LFnnktcaKttmsOLW5Bw"

echo "=== whoami (check CLI can refresh token) ==="
vercel whoami 2>&1 | tail -2

echo ""
echo "=== add TURSO_DATABASE_URL ==="
vercel env add TURSO_DATABASE_URL production --value "$TURSO_URL" --project green-duty 2>&1 | tail -3

echo ""
echo "=== add TURSO_AUTH_TOKEN ==="
vercel env add TURSO_AUTH_TOKEN production --value "$TURSO_TOKEN" --project green-duty 2>&1 | tail -3

echo ""
echo "=== verify env ==="
vercel env ls --project green-duty 2>&1 | tail -8
