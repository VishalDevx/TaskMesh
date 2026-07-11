#!/bin/bash
# TaskMesh Deploy Script
# Run this on your EC2 instance after cloning the repo
# Usage: bash deploy.sh

set -e

echo "=== TaskMesh Deploy ==="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "Error: .env.production not found!"
  echo "Create it from .env and update the values for production."
  echo "  cp .env .env.production"
  echo "  nano .env.production"
  exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the app
echo "Building Next.js..."
npm run build

# Stop existing PM2 processes
pm2 delete taskmesh-next taskmesh-socket taskmesh-workers 2>/dev/null || true

# Start all services
echo "Starting services with PM2..."
pm2 start deploy/ecosystem.config.js

# Save PM2 config for auto-restart on reboot
pm2 save

# Setup PM2 to start on system boot
pm2 startup 2>/dev/null || true

echo ""
echo "=== Deploy Complete! ==="
echo ""
echo "Services running:"
pm2 list
echo ""
echo "Check logs:"
echo "  pm2 logs taskmesh-next"
echo "  pm2 logs taskmesh-socket"
echo "  pm2 logs taskmesh-workers"
echo ""
echo "Monitor:"
echo "  pm2 monit"
