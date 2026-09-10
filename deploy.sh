#!/usr/bin/env bash

# =========================================================
# ORIA Platform - Automated Server Deployment Script
# Usage: bash deploy.sh
# =========================================================

set -e

echo "💎 [ORIA DEPLOY] Starting deployment..."

# 1. Pull latest changes if using git
if [ -d ".git" ]; then
  echo "📥 Pulling latest git updates..."
  git pull origin main || true
fi

# 2. Install dependencies
echo "📦 Installing dependencies for all modules..."
npm run install:all

# 3. Build frontend applications
echo "🔨 Building frontend applications (oria-admin & oria-main)..."
npm run build:all

# 4. Restart server via PM2 or Docker
if command -v pm2 &> /dev/null; then
  echo "🔄 Reloading PM2 processes..."
  pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save
elif command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  echo "🐳 Rebuilding and starting Docker container..."
  docker compose up -d --build
else
  echo "🚀 Starting Node server directly..."
  npm start
fi

echo "✅ [ORIA DEPLOY] Deployment finished successfully!"
echo "👉 Marketplace: http://localhost:5077/"
echo "👉 Admin:       http://localhost:5077/admin/"
echo "👉 API:         http://localhost:5077/api/"
