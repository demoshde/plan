#!/bin/bash
# Deployment script for OT Logistic Convoy Management System
# VPS: 156.67.220.158
# Domain: plan.outboundlogistic.com
#
# Live layout on the server (verified 2026-07-21):
#   Frontend docroot : /home/outboundlogistic-plan/htdocs        (nginx `location /` root)
#   Backend app dir  : /home/outboundlogistic-plan/htdocs/server (PM2 app "plan-api", port 5002)

set -euo pipefail

VPS_IP="156.67.220.158"
VPS_USER="root"
WEB_ROOT="/home/outboundlogistic-plan/htdocs"
SERVER_DIR="/home/outboundlogistic-plan/htdocs/server"
PM2_APP="plan-api"

echo "🚀 Deploying to $VPS_IP ($PM2_APP)..."

# --- Build client -----------------------------------------------------------
echo "📦 Building client..."
( cd client && npm run build )

# --- Sanity check build output ---------------------------------------------
if [ ! -f client/dist/index.html ]; then
  echo "❌ Build failed: client/dist/index.html not found. Aborting."
  exit 1
fi

# --- Deploy frontend --------------------------------------------------------
# NOTE: no --delete here because WEB_ROOT also contains server/ and other files.
echo "📤 Uploading frontend to $WEB_ROOT ..."
rsync -avz client/dist/ "$VPS_USER@$VPS_IP:$WEB_ROOT/"

# --- Deploy backend ---------------------------------------------------------
echo "📤 Uploading backend to $SERVER_DIR ..."
rsync -avz --delete server/src/ "$VPS_USER@$VPS_IP:$SERVER_DIR/src/"
rsync -avz server/package.json "$VPS_USER@$VPS_IP:$SERVER_DIR/package.json"

# --- Install deps & restart API --------------------------------------------
echo "🔄 Installing dependencies and restarting $PM2_APP ..."
ssh "$VPS_USER@$VPS_IP" PM2_APP="$PM2_APP" SERVER_DIR="$SERVER_DIR" 'bash -s' <<'ENDSSH'
set -euo pipefail
cd "$SERVER_DIR"
npm install --omit=dev
pm2 restart "$PM2_APP" --update-env
pm2 save
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Visit: https://plan.outboundlogistic.com"
