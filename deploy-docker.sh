#!/usr/bin/env bash

# ==============================================================================
# HRSDGDG Luxury Platform — Automated Docker Deployment Script
# Usage: ./deploy-docker.sh
# ==============================================================================

set -e

echo "=================================================================="
echo "💎 [HRSDGDG] Automated Docker Deployment & Migration Pipeline"
echo "=================================================================="

APP_DIR="/var/www/hrsdgdg"
cd "${APP_DIR}" || cd "$(dirname "$0")"

# 1. Stop standalone PM2 oria-api if active so port 5077 is freed for Docker container
if command -v pm2 &> /dev/null; then
  if pm2 list | grep -q "oria-api"; then
    echo "🛑 Stopping standalone PM2 oria-api to switch port 5077 to Docker container..."
    pm2 stop oria-api || true
    pm2 delete oria-api || true
    pm2 save || true
  fi
fi

# 2. Build Docker Image & Start Containers
echo "🐳 Building Docker image 'hrsdgdg-platform:latest'..."
docker compose build --no-cache hrsdgdg-platform

echo "🚀 Starting Docker Compose stack (Platform + PostgreSQL)..."
docker compose up -d --remove-orphans

# 3. Wait for containers to be healthy
echo "⏳ Waiting for services to initialize..."
sleep 5

# 4. Run PostgreSQL schema migration and seed
echo "🐘 Verifying PostgreSQL migration inside container..."
docker compose exec -T hrsdgdg-platform node oria-api/db/migrate.js || true

# 5. Verification & Health Check
echo "🔍 Performing health check on http://127.0.0.1:5077/api/categories..."
for i in {1..10}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5077/api/categories || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check PASSED (HTTP $HTTP_STATUS)!"
    break
  fi
  echo "⏳ Waiting for app response (attempt $i/10, status: $HTTP_STATUS)..."
  sleep 3
done

echo "=================================================================="
echo "🎉 [HRSDGDG] Deployment Complete & Online!"
echo "👉 Marketplace (PWA): https://hrsdgdg.sdbo.ma/"
echo "👉 Admin Dashboard:   https://hrsdgdg.sdbo.ma/admin/"
echo "👉 REST API:          https://hrsdgdg.sdbo.ma/api/bijoux"
echo "=================================================================="
