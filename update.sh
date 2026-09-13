#!/bin/bash
set -e

# 广澜租赁 日常更新脚本
#
# 与 deploy.sh 的区别：deploy.sh 是「首次安装」，会 rm -rf 整个目录（清空数据）。
# 本脚本只做 git pull + 重启，绝不删除数据。
#
# 用法：
#   bash update.sh            # 全量更新（后端 + 前端）
#   bash update.sh backend    # 只更新后端（快，约 10 秒）
#   bash update.sh frontend   # 只更新前端（慢，需重新构建 3-5 分钟）

APP_DIR="/opt/guanglan-rental"
BACKUP_DIR="/home/ubuntu/backups"
KEEP_BACKUPS=20
TARGET="${1:-all}"

if [ "$TARGET" != "all" ] && [ "$TARGET" != "backend" ] && [ "$TARGET" != "frontend" ]; then
  echo "用法: bash update.sh [all|backend|frontend]"
  exit 1
fi

echo "=== 广澜租赁 更新部署（不影响数据）==="
echo "更新范围: $TARGET"
echo

# 0. 备份数据库（只增不减，保留最近 $KEEP_BACKUPS 份）
mkdir -p "$BACKUP_DIR"
if [ -f "$APP_DIR/backend/guanglan.db" ]; then
  STAMP=$(date +%Y%m%d-%H%M%S)
  cp "$APP_DIR/backend/guanglan.db" "$BACKUP_DIR/guanglan-$STAMP.db"
  echo "[0/4] 数据库已备份 → $BACKUP_DIR/guanglan-$STAMP.db"
  ls -1t "$BACKUP_DIR"/guanglan-*.db 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
else
  echo "[0/4] 未找到数据库，跳过备份"
fi

# 1. 拉取代码（git pull 不会碰 guanglan.db 和 uploads/，它们在 .gitignore 里）
echo "[1/4] 拉取最新代码..."
cd "$APP_DIR"
if ! git pull; then
  echo "  ❌ git pull 失败。如果提示有本地修改，请先执行："
  echo "     cd $APP_DIR && git status"
  exit 1
fi

# 2. 更新后端
if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  echo "[2/4] 更新后端..."
  cd "$APP_DIR/backend"
  ./venv/bin/pip install -q -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
  sudo systemctl restart guanglan-api
  sleep 3
  if ! sudo systemctl is-active --quiet guanglan-api; then
    echo "  ❌ 后端启动失败，日志如下："
    sudo journalctl -u guanglan-api -n 40 --no-pager
    echo
    echo "  数据未受影响，可回滚代码后重试。"
    exit 1
  fi
  echo "  后端已重启 ✅"
else
  echo "[2/4] 跳过后端"
fi

# 3. 更新前端
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  echo "[3/4] 更新前端（构建 3-5 分钟，请耐心等待）..."
  cd "$APP_DIR/frontend"
  npm install --silent
  npm run build
  pm2 restart guanglan-web
  echo "  前端已重启 ✅"
else
  echo "[3/4] 跳过前端"
fi

# 4. 健康检查
echo "[4/4] 健康检查..."
sleep 2
HEALTH=$(curl -s --max-time 5 http://127.0.0.1:8000/api/health || echo "FAILED")

echo
echo "===== 🎉 更新完成 ====="
echo "后端健康检查: $HEALTH"
echo "数据备份目录: $BACKUP_DIR"
echo
echo "如果新版本有问题要回退："
echo "  cd $APP_DIR && git log --oneline -5"
echo "  git checkout <上一个提交的哈希> && bash /home/ubuntu/update.sh"
