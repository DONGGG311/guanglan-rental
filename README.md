# 广澜租赁平台

广澜印刷包装有限公司旗下厂房租赁平台，提供配套齐全、参数透明的专业印刷包装生产空间租赁服务。

## 技术栈

**前端：** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui

**后端：** Python FastAPI, SQLAlchemy, SQLite, JWT 认证

**辅助：** aiosmtplib (邮件), weasyprint (合同 PDF), Jinja2 (合同模板)

## 快速启动

### 1. 克隆项目

```bash
git clone <repo-url>
cd 租赁网站
```

### 2. 安装依赖

**后端：**
```bash
cd backend
pip install -r requirements.txt
```

**前端：**
```bash
cd frontend
npm install
```

### 3. 配置环境变量

**后端（backend/.env）：**
```bash
cp backend/.env.example backend/.env
```
按需修改 `.env` 中的数据库路径、JWT 密钥和 SMTP 邮件配置。

### 4. 初始化数据库（种子数据）

```bash
cd backend
python seed.py
```
这会创建管理员账号（admin / admin123）和示例厂房数据。

### 5. 启动服务

**后端（端口 8000）：**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**前端（端口 3000）：**
```bash
cd frontend
npm run dev
```

### 6. 访问

- 前端：http://localhost:3000
- 后端 API 文档：http://localhost:8000/docs
- 管理后台：http://localhost:3000/admin

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy 数据模型
│   │   ├── routers/      # API 路由
│   │   ├── schemas/      # Pydantic 请求/响应模型
│   │   ├── services/     # 业务逻辑（认证、合同、邮件）
│   │   └── utils/        # 工具函数
│   ├── seed.py           # 数据库初始化脚本
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/          # Next.js App Router 页面
│       ├── components/   # 可复用组件
│       └── lib/          # API 客户端、工具函数
├── .superpowers/
│   └── sdd/              # 设计文档与任务计划
└── README.md
```

## 设计文档

- [需求文档](.superpowers/sdd/requirements.md)
- [设计规格](.superpowers/sdd/design-spec.md)
- [任务计划](.superpowers/sdd/task-plan.md)
