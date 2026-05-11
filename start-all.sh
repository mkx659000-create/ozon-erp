#!/bin/bash
set -e

echo "🚀 Starting Ozon ERP System..."

# Start Redis if not running
brew services start redis 2>/dev/null || true

# Start backend server
cd "$(dirname "$0")/apps/server"
pkill -f "node dist/main" 2>/dev/null || true
node dist/main.js > /tmp/ozon-erp-server.log 2>&1 &
echo "✅ Backend started (logs: /tmp/ozon-erp-server.log)"

# Wait for backend
sleep 3
until curl -s http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -q '"code":0'; do
  sleep 1
done
echo "✅ Backend is ready"

# Start Cloudflare tunnel
pkill -f cloudflared 2>/dev/null || true
cloudflared tunnel --url http://localhost:3000 > /tmp/cloudflare.log 2>&1 &

# Wait for tunnel URL
until grep -q 'trycloudflare.com' /tmp/cloudflare.log 2>/dev/null; do sleep 1; done
CF_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflare.log | head -1)

echo ""
echo "✅ =============================================="
echo "🌐 Public URL: $CF_URL"
echo "👤 Login: admin / admin123"
echo "🏪 Store: 我的Ozon店铺 (Client-Id: 4183499)"
echo "================================================"
echo ""
echo "The URL changes each restart. For a permanent URL,"
echo "set up a named Cloudflare tunnel or deploy to Railway."
