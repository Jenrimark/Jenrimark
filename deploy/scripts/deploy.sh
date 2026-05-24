#!/usr/bin/env bash
# 家里服务器本地部署（Webhook 或手动执行）
# 用法: DEPLOY_PATH=/var/www/jenrimark/dist ./deploy/scripts/deploy.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/jenrimark/dist}"
BRANCH="${BRANCH:-main}"

cd "$REPO_ROOT"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

npm ci
npm run build

mkdir -p "$DEPLOY_PATH"
rsync -av --delete dist/ "$DEPLOY_PATH/"

echo "Deployed to $DEPLOY_PATH"
