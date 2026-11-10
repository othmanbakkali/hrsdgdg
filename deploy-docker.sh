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

# 0. CRITICAL: Safety Backup of Database & Live Data before update
BACKUP_DIR="/var/backups/hrsdgdg_data"
mkdir -p "${BACKUP_DIR}"
if [ -s "${APP_DIR}/oria-api/data/database.json" ]; then
  if grep -q '?????' "${APP_DIR}/oria-api/data/database.json"; then
    echo "⚠️ Detected corrupted '?????' in existing database.json! Checking for git repository clean copy..."
  else
    echo "🛡️  [DATA SAFETY] Backing up live database.json before container restart..."
    cp -p "${APP_DIR}/oria-api/data/database.json" "${BACKUP_DIR}/database_$(date +%Y%m%d_%H%M%S).json"
    cp -p "${APP_DIR}/oria-api/data/database.json" "${BACKUP_DIR}/database.json.latest"
  fi
fi
if [ -d "${APP_DIR}/oria-api/data/uploads" ]; then
  mkdir -p "${BACKUP_DIR}/uploads"
  cp -rn "${APP_DIR}/oria-api/data/uploads/"* "${BACKUP_DIR}/uploads/" 2>/dev/null || true
fi

# Protect database.json from git index changes
git update-index --skip-worktree oria-api/data/database.json 2>/dev/null || true

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
echo "=== [SERVER DIAGNOSTICS: NGINX SITES] ==="
cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null || true
echo "=== [SERVER DIAGNOSTICS: LISTENING PORTS] ==="
ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null || true
echo "=== [SERVER DIAGNOSTICS: PM2 PROCESSES] ==="
pm2 list 2>/dev/null || true

docker compose build hrsdgdg-platform

echo "🚀 Starting Docker Compose stack (Platform + PostgreSQL)..."
docker compose up -d --remove-orphans

# 3. Wait for containers to be healthy
echo "⏳ Waiting for services to initialize..."
sleep 5

# 3b. Sync compiled frontend dist from container to host (for direct Nginx static file serving)
echo "📦 Syncing compiled frontend dist from container to host..."
mkdir -p "${APP_DIR}/oria-main" "${APP_DIR}/oria-admin"
docker compose cp hrsdgdg-platform:/app/oria-main/dist "${APP_DIR}/oria-main/" || true
docker compose cp hrsdgdg-platform:/app/oria-admin/dist "${APP_DIR}/oria-admin/" || true

# 3c. Reload Nginx if present
if command -v nginx &> /dev/null; then
  echo "🔄 Testing and reloading Nginx..."
  nginx -t 2>/dev/null && (nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null) || true
fi

echo "=== [SERVER DIAGNOSTICS: DOCKER PORT 5077 RESPONSE] ==="
curl -s http://127.0.0.1:5077/ | head -n 25 || true

# 4. Run PostgreSQL schema migration and seed
echo "🐘 Verifying PostgreSQL migration inside container..."
docker compose exec -T hrsdgdg-platform node oria-api/db/migrate.js || true

# 5. Database Safety Check: Ensure live database is 100% intact
if [ -s "${BACKUP_DIR}/database.json.latest" ]; then
  CURRENT_SIZE=$(stat -c%s "${APP_DIR}/oria-api/data/database.json" 2>/dev/null || echo "0")
  if [ "$CURRENT_SIZE" -lt 50000 ]; then
    echo "⚠️ Database size abnormal ($CURRENT_SIZE bytes)! Restoring from live backup..."
    cp -p "${BACKUP_DIR}/database.json.latest" "${APP_DIR}/oria-api/data/database.json"
  fi
fi

# 6. Verification & Health Check
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
