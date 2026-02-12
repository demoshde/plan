#!/bin/bash
# VPS Setup Script for OT Logistic
# Run this on your Hostinger VPS as root

set -e

echo "🚀 Setting up VPS for OT Logistic..."

# Update system
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MongoDB
echo "📦 Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /var/www/convoy

# Setup firewall
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repo: git clone https://github.com/demoshde/plan.git /var/www/convoy"
echo "2. Setup server: cd /var/www/convoy/server && npm install"
echo "3. Build client: cd /var/www/convoy/client && npm install && npm run build"
echo "4. Copy nginx config: cp /var/www/convoy/nginx.conf /etc/nginx/sites-available/convoy"
echo "5. Enable site: ln -s /etc/nginx/sites-available/convoy /etc/nginx/sites-enabled/"
echo "6. Get SSL: certbot --nginx -d plan.outboundlogistic.com"
echo "7. Start app: pm2 start /var/www/convoy/ecosystem.config.js"
echo "8. Save PM2: pm2 save && pm2 startup"
