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

mkdir -p "${WORK_TREE}"
git --work-tree="${WORK_TREE}" --git-dir="${GIT_DIR}" checkout -f main

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
