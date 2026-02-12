#!/bin/bash
# Deployment script for OT Logistic Convoy Management System
# VPS: 156.67.220.158
# Domain: plan.outboundlogistic.com

VPS_IP="156.67.220.158"
VPS_USER="root"
APP_DIR="/var/www/convoy"

echo "🚀 Deploying to $VPS_IP..."

# Build client
echo "📦 Building client..."
cd client && npm run build && cd ..

# Create deployment package
echo "📁 Creating deployment package..."
rm -rf deploy_temp
mkdir -p deploy_temp/client
mkdir -p deploy_temp/server

cp -r server/src deploy_temp/server/
cp server/package.json deploy_temp/server/
cp -r client/dist deploy_temp/client/

# Transfer to VPS
echo "📤 Transferring files..."
rsync -avz --delete deploy_temp/ $VPS_USER@$VPS_IP:$APP_DIR/

# Remote setup and restart
echo "🔄 Restarting services on VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/convoy/server
npm install --production
pm2 restart convoy-api || pm2 start src/index.js --name convoy-api
pm2 save
ENDSSH

# Cleanup
rm -rf deploy_temp

echo "✅ Deployment complete!"
echo "🌐 Visit: https://plan.outboundlogistic.com"
