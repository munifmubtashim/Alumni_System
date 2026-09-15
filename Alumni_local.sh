#!/bin/bash
set -e

DOMAIN="alumni.local"
BACKEND_DIR="packages/backend/src/api"
FRONTEND_DIR="packages/frontend"

echo "==> Starting PostgreSQL..."
brew services start postgresql

echo "==> Building frontend..."
cd "$FRONTEND_DIR"
npm run build
cd - > /dev/null

echo "==> Starting Node backend on port 3000..."
cd "$BACKEND_DIR"
npx tsx server.ts &
BACKEND_PID=$!
cd - > /dev/null

sleep 3

echo "==> Restarting Apache..."
sudo apachectl restart

sleep 2

echo "==> Testing https://$DOMAIN/api/health ..."
curl -k "https://$DOMAIN/api/health"
echo ""

echo "==> Stack is running:"
echo "    App:     https://$DOMAIN"
echo "    API:     https://$DOMAIN/api"
echo "    Backend PID: $BACKEND_PID"
echo ""
echo "    Press Ctrl+C to stop the backend."

wait $BACKEND_PID