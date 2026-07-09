#!/bin/bash
set -e
echo "=== 广澜租赁平台 一键部署 ==="

# 1. 安装依赖
echo "[1/6] 安装系统依赖..."
sudo apt update -qq
sudo apt install -y -qq python3 python3-pip python3-venv nodejs npm nginx git curl

# 2. 安装 Node.js 20
echo "[2/6] 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y -qq nodejs

# 3. 进入项目
echo "[3/6] 拉取项目..."
cd /opt
sudo rm -rf guanglan-rental
sudo git clone -q https://github.com/DONGGG311/guanglan-rental.git
cd guanglan-rental

# 4. 部署后端
echo "[4/6] 部署后端..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
python3 seed.py

# 创建 systemd 服务
sudo tee /etc/systemd/system/guanglan-api.service > /dev/null << 'SYSTEMD'
[Unit]
Description=GuangLan API
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/opt/guanglan-rental/backend
ExecStart=/opt/guanglan-rental/backend/venv/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable --now guanglan-api
echo "  后端已启动 ✅"

# 5. 部署前端
echo "[5/6] 部署前端..."
cd /opt/guanglan-rental/frontend
npm install --silent
npm run build

# 安装 pm2 并启动
sudo npm install -g pm2 --silent 2>/dev/null
pm2 delete guanglan-web 2>/dev/null || true
pm2 start npm --name "guanglan-web" -- start
pm2 save

# 6. 配置 Nginx
echo "[6/6] 配置 Nginx..."
sudo tee /etc/nginx/sites-available/guanglan > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/guanglan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "  Nginx 已配置 ✅"

echo ""
echo "===== 🎉 部署完成！ ====="
echo "浏览器访问: http://8.134.207.100"
echo "后台管理: http://8.134.207.100/admin/login"
echo "账号: admin  密码: admin123"
echo ""
curl -s http://127.0.0.1:8000/api/health
