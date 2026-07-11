#!/bin/bash
# TaskMesh EC2 Setup Script
# Run this on a fresh Ubuntu EC2 instance (t2.micro free tier)
# Usage: bash setup-ec2.sh

set -e

echo "=== TaskMesh EC2 Setup ==="
echo "This will install: Node.js 20, Redis, Nginx, PM2"
echo ""

# ─── 1. System updates ───
echo "[1/7] Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# ─── 2. Install Node.js 20 ───
echo "[2/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node: $(node -v) | NPM: $(npm -v)"

# ─── 3. Install Redis ───
echo "[3/7] Installing Redis..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Set Redis password
REDIS_PASS=$(openssl rand -base64 16)
sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASS/" /etc/redis/redis.conf
sudo systemctl restart redis-server
echo "Redis password: $REDIS_PASS"
echo "Save this! Add to your .env as: REDIS_URL=redis://:$REDIS_PASS@localhost:6379"

# ─── 4. Install Nginx ───
echo "[4/7] Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx

# ─── 5. Install PM2 ───
echo "[5/7] Installing PM2..."
sudo npm install -g pm2

# ─── 6. Install Git ───
echo "[6/7] Installing Git..."
sudo apt install -y git

# ─── 7. Clone and setup app ───
echo "[7/7] Cloning TaskMesh..."
cd /home/ubuntu
if [ ! -d "TaskMesh" ]; then
  git clone https://github.com/VishalDevx/TaskMesh.git
fi

cd TaskMesh
npm install
npx prisma generate

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
  echo ""
  echo "=== Create .env.production ==="
  echo "Copy your .env and update these values:"
  echo "  REDIS_URL=redis://:$REDIS_PASS@localhost:6379"
  echo "  AUTH_URL=http://YOUR_EC2_PUBLIC_IP"
  echo "  NEXT_PUBLIC_APP_URL=http://YOUR_EC2_PUBLIC_IP"
  echo "  NEXT_PUBLIC_SOCKET_URL=http://YOUR_EC2_PUBLIC_IP:3001"
  echo ""
fi

# Setup Nginx config
sudo cp /home/ubuntu/TaskMesh/deploy/nginx.conf /etc/nginx/sites-available/taskmesh
sudo ln -sf /etc/nginx/sites-available/taskmesh /etc/nginx/sites-enabled/taskmesh
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Create .env.production with your env vars"
echo "2. Update REDIS_URL to: redis://:$REDIS_PASS@localhost:6379"
echo "3. Run: npm run build"
echo "4. Run: pm2 start ecosystem.config.js"
echo "5. Run: pm2 save"
echo "6. Open port 80 and 3001 in AWS Security Group"
echo "7. Visit: http://YOUR_EC2_PUBLIC_IP"
echo ""
echo "For SSL (recommended): sudo certbot --nginx -d yourdomain.com"
