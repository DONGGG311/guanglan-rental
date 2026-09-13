#!/bin/bash
set -e

# 跳过所有交互弹窗
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

REPO_URL="https://github.com/DONGGG311/guanglan-rental.git"
APP_DIR="/opt/guanglan-rental"

echo "=== 广澜租赁平台 一键部署 ==="

# 0. 创建 swap（小内存机器构建前端时会被 OOM Killer 杀掉，必须先加 swap）
if [ ! -f /swapfile ]; then
  echo "[0/7] 创建 2G swap..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile > /dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
  echo "  swap 已创建 ✅"
else
  echo "[0/7] swap 已存在，跳过"
fi

# 1. 安装系统依赖
echo "[1/7] 安装系统依赖..."
sudo apt update -qq
sudo NEEDRESTART_MODE=a DEBIAN_FRONTEND=noninteractive apt install -y -qq \
  python3 python3-pip python3-venv nginx git curl

# 2. 安装 Node.js 20
echo "[2/7] 安装 Node.js 20..."
sudo apt remove -y -qq libnode-dev libnode72 nodejs 2>/dev/null || true
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo NEEDRESTART_MODE=a DEBIAN_FRONTEND=noninteractive apt install -y -qq nodejs
sudo npm install -g npm@latest --silent 2>/dev/null || true

# 3. 拉取项目
echo "[3/7] 拉取项目..."
cd /opt
sudo rm -rf "$APP_DIR"
sudo git clone -q "$REPO_URL" "$APP_DIR"
sudo chown -R "$(whoami)":"$(whoami)" "$APP_DIR"
cd "$APP_DIR"

# 4. 部署后端
echo "[4/7] 部署后端..."
cd "$APP_DIR/backend"
python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install -q -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
python3 seed.py

sudo tee /etc/systemd/system/guanglan-api.service > /dev/null << 'SYSTEMD'
[Unit]
Description=GuangLan Rental API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/guanglan-rental/backend
Environment=PYTHONUNBUFFERED=1
ExecStart=/opt/guanglan-rental/backend/venv/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable --now guanglan-api
sleep 2
if ! sudo systemctl is-active --quiet guanglan-api; then
  echo "  ❌ 后端启动失败，日志如下："
  sudo journalctl -u guanglan-api -n 40 --no-pager
  exit 1
fi
echo "  后端已启动 ✅"

# 5. 部署前端
echo "[5/7] 部署前端（构建较慢，请耐心等待）..."
cd "$APP_DIR/frontend"
npm config set registry https://registry.npmmirror.com
npm install --silent
npm run build

sudo npm install -g pm2 --silent 2>/dev/null
pm2 delete guanglan-web 2>/dev/null || true
pm2 start npm --name "guanglan-web" -- start
pm2 save
# 开机自启（失败不影响本次部署）
sudo env PATH="$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu > /dev/null 2>&1 || true
echo "  前端已启动 ✅"

# 6. 配置 Nginx
echo "[6/7] 配置 Nginx..."
sudo tee /etc/nginx/sites-available/guanglan > /dev/null << 'NGINX'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 10M;

    # 前端页面（含 /admin/login 等管理后台页面）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 所有后端接口（用户端 /api/* 和 管理端 /api/admin/* 都在这里）
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/guanglan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "  Nginx 已配置 ✅"

# 7. 健康检查
echo "[7/7] 健康检查..."
sleep 2
HEALTH=$(curl -s --max-time 5 http://127.0.0.1:8000/api/health || echo "FAILED")
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me || echo "<你的公网IP>")

echo ""
echo "===== 🎉 部署完成 ====="
echo "后端健康检查: $HEALTH"
echo ""
echo "前台首页:  http://$PUBLIC_IP"
echo "用户登录:  http://$PUBLIC_IP/login"
echo "管理后台:  http://$PUBLIC_IP/admin/login"
echo "管理员账号: admin / admin123  ⚠️ 上线后请立即修改密码"
echo ""
echo "排查命令："
echo "  sudo systemctl status guanglan-api    # 后端状态"
echo "  sudo journalctl -u guanglan-api -f    # 后端日志"
echo "  pm2 logs guanglan-web                 # 前端日志"
