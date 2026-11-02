#!/usr/bin/env bash

# ==============================================================================
# HRSDGDG — Server Git Bare Repository & Automated Deployment Hook Setup
# Run on server: bash setup-git-hook.sh
# ==============================================================================

set -e

REPO_DIR="/var/repo/hrsdgdg.git"
WORK_TREE="/var/www/hrsdgdg"

echo "💎 Setting up Git Deployment Hook at ${REPO_DIR}..."

mkdir -p "${REPO_DIR}"
mkdir -p "${WORK_TREE}"

if [ ! -d "${REPO_DIR}/objects" ]; then
  git init --bare "${REPO_DIR}"
  echo "✅ Initialized bare git repository at ${REPO_DIR}"
fi

HOOK_FILE="${REPO_DIR}/hooks/post-receive"

cat << 'EOF' > "${HOOK_FILE}"
#!/usr/bin/env bash
set -e

echo "💎 ========================================================"
echo "💎 [HRSDGDG GIT HOOK] New code pushed! Starting deployment..."
echo "💎 ========================================================"

WORK_TREE="/var/www/hrsdgdg"
GIT_DIR="/var/repo/hrsdgdg.git"
BACKUP_DIR="/var/backups/hrsdgdg_data"

mkdir -p "${WORK_TREE}"
mkdir -p "${BACKUP_DIR}"

# 1. CRITICAL: Preserve live database.json and user uploads before git checkout
if [ -s "${WORK_TREE}/oria-api/data/database.json" ]; then
  echo "🔒 Securing live production database before git update..."
  cp -p "${WORK_TREE}/oria-api/data/database.json" "${BACKUP_DIR}/database.json.latest"
  cp -p "${WORK_TREE}/oria-api/data/database.json" "${BACKUP_DIR}/database_$(date +%Y%m%d_%H%M%S).json"
fi

if [ -d "${WORK_TREE}/oria-api/data/uploads" ]; then
  mkdir -p "${BACKUP_DIR}/uploads"
  cp -rn "${WORK_TREE}/oria-api/data/uploads/"* "${BACKUP_DIR}/uploads/" 2>/dev/null || true
fi

# 2. Checkout code updates
git --work-tree="${WORK_TREE}" --git-dir="${GIT_DIR}" checkout -f main

# 3. CRITICAL: Restore production live database so git checkout NEVER overwrites real data
# (If backup was corrupted with '?????', keep the clean UTF-8 database from git repository)
if [ -s "${BACKUP_DIR}/database.json.latest" ]; then
  if grep -q '?????' "${BACKUP_DIR}/database.json.latest"; then
    echo "⚠️ Detected corrupted '?????' in backup database.json! Using fresh clean UTF-8 database.json from repository..."
    cp -p "${WORK_TREE}/oria-api/data/database.json" "${BACKUP_DIR}/database.json.latest"
  else
    echo "🛡️ Restoring live production database (preserving all live users, products, categories)..."
    cp -p "${BACKUP_DIR}/database.json.latest" "${WORK_TREE}/oria-api/data/database.json"
  fi
fi

if [ -d "${BACKUP_DIR}/uploads" ]; then
  mkdir -p "${WORK_TREE}/oria-api/data/uploads"
  cp -rn "${BACKUP_DIR}/uploads/"* "${WORK_TREE}/oria-api/data/uploads/" 2>/dev/null || true
fi

cd "${WORK_TREE}"
chmod +x deploy-docker.sh
./deploy-docker.sh

echo "💎 ========================================================"
echo "💎 [HRSDGDG GIT HOOK] Deployment successfully finished!"
echo "💎 ========================================================"
EOF

chmod +x "${HOOK_FILE}"

echo "✅ Git post-receive hook installed and made executable at ${HOOK_FILE}."
echo ""
echo "👉 Local Developer Setup:"
echo "   git remote add production root@198.199.75.86:/var/repo/hrsdgdg.git"
echo "   git push production main"
