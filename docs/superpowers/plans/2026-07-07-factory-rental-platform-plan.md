# 广澜厂房租赁平台 — 实施计划

> **For agentic workers:** 使用 Task 追踪每个步骤。任务跨前后端，需逐项完成。

**目标:** 构建完整的厂房租赁展示平台，包含前端展示/下单系统和后台管理系统。

**架构:** Next.js 14 (App Router) 前端 → FastAPI 后端 → SQLite 数据库。前后端分离，RESTful API 通信。

**技术栈:** Next.js 14, Tailwind CSS, shadcn/ui, FastAPI (Python 3.11+), SQLAlchemy, SQLite, JWT, SMTP

## 全局约束

- 所有 API 路由 `/api/*` 由 FastAPI (port 8000) 处理
- 前端 Next.js dev server (port 3000) 通过代理转发 API 请求
- 用户端 JWT 和管理员 JWT 独立签发，管理员 API 路径前缀 `/admin/`
- 密码使用 bcrypt 哈希存储
- 邮件使用 SMTP 后台任务发送（新订单通知管理员、状态变更通知客户）
- 图片上传存储本地 `uploads/` 目录，限制单张 5MB
- 分页每页 12 条
- 遵循品牌指南配色（主色 #0F766E）

---

## 文件结构

```
租赁网站/
├── frontend/                          # Next.js 14 项目
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # 根布局（字体加载 + Providers）
│   │   │   ├── page.tsx               # 首页
│   │   │   ├── globals.css            # Tailwind + 品牌 CSS 变量
│   │   │   ├── spaces/
│   │   │   │   ├── page.tsx           # 厂房列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # 厂房详情
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── user/
│   │   │   │   ├── layout.tsx         # 用户中心布局（侧边导航）
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx       # 我的订单列表
│   │   │   │   │   └── [id]/page.tsx  # 订单详情
│   │   │   │   ├── favorites/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── notifications/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx         # 后台布局（侧边栏）
│   │   │       ├── page.tsx           # 仪表盘
│   │   │       ├── spaces/
│   │   │       │   ├── page.tsx       # 厂房管理表格
│   │   │       │   └── [id]/page.tsx  # 编辑厂房
│   │   │       └── orders/
│   │   │           ├── page.tsx       # 订单管理表格
│   │   │           └── [id]/page.tsx  # 订单详情+合同生成
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui (button, card, badge, table, dialog, form...)
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── SpaceCard.tsx          # 厂房卡片
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Badge.tsx              # 面积/状态/订单标签
│   │   │   ├── OrderForm.tsx          # 下单表单
│   │   │   ├── Pagination.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminDataTable.tsx
│   │   │   ├── StatCard.tsx           # 仪表盘统计卡片
│   │   │   └── ContractForm.tsx       # 合同生成表单
│   │   ├── lib/
│   │   │   ├── api.ts                 # 封装 fetch（自动附带 JWT）
│   │   │   ├── auth.ts                # JWT 存储/读取/清除 + AuthContext
│   │   │   └── utils.ts               # 格式化面积/租金/日期
│   │   └── types/
│   │       └── index.ts               # Space, Order, User, Contract 等 TS 类型
│   ├── tailwind.config.ts
│   ├── next.config.js                 # API 代理到 localhost:8000
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 应用入口 + CORS + 路由注册
│   │   ├── database.py                # SQLAlchemy engine + SessionLocal + Base
│   │   ├── models/
│   │   │   ├── user.py                # User, Admin 模型
│   │   │   ├── space.py               # Space 模型
│   │   │   ├── order.py               # Order 模型
│   │   │   ├── contract.py            # Contract 模型
│   │   │   ├── favorite.py            # Favorite 模型
│   │   │   └── notification.py        # Notification 模型
│   │   ├── schemas/
│   │   │   ├── user.py                # UserCreate, UserLogin, UserResponse, Token
│   │   │   ├── space.py               # SpaceCreate, SpaceUpdate, SpaceResponse
│   │   │   ├── order.py               # OrderCreate, OrderResponse, OrderStatusUpdate
│   │   │   ├── contract.py            # ContractCreate, ContractResponse
│   │   │   └── notification.py        # NotificationResponse
│   │   ├── routers/
│   │   │   ├── spaces.py              # GET /api/spaces, GET /api/spaces/{id}
│   │   │   ├── auth.py                # POST /api/auth/register, /login
│   │   │   ├── orders.py              # POST/GET /api/orders, GET /api/orders/{id}...
│   │   │   ├── users.py               # GET/PUT /api/user/profile
│   │   │   ├── favorites.py           # POST/GET /api/favorites
│   │   │   ├── notifications.py       # GET /api/notifications, PUT .../read
│   │   │   └── admin.py               # /admin/* 所有管理端路由
│   │   ├── services/
│   │   │   ├── auth.py                # create_token, verify_token, hash_password
│   │   │   ├── email.py               # send_email（SMTP 后台任务）
│   │   │   └── contract.py            # generate_contract_pdf
│   │   └── utils/
│   │       └── order_no.py            # 订单编号生成器
│   ├── seed.py                        # 初始化管理员 + 10 条示例厂房数据
│   ├── requirements.txt
│   └── .env.example
│
├── uploads/                           # 图片上传目录（gitignore）
├── docs/                              # 需求文档/品牌/设计系统/UI方案
└── assets/                            # Design Tokens + Banner 资源
```

---

## Phase 1: 项目脚手架 + 数据库

### Task 1: 初始化后端项目

**文件:**
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/database.py`
- Create: `backend/.env.example`

**目标:** FastAPI 可启动，SQLite 连接就绪

- [ ] **Step 1: 创建 requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
pydantic[email]==2.9.2
aiofiles==24.1.0
aiosmtplib==3.0.2
jinja2==3.1.4
weasyprint==62.3
```

- [ ] **Step 2: 创建 database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./guanglan.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: 创建 main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

app = FastAPI(title="广澜租赁平台 API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: 启动后端验证**

```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
```

- [ ] **Step 5: Commit**

```bash
git add backend/ && git commit -m "feat: init FastAPI backend with SQLite"
```

---

### Task 2: 初始化前端项目

**文件:**
- Create: `frontend/` (via `npx create-next-app`)
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/next.config.js`

**目标:** Next.js 可启动，Tailwind + shadcn/ui 就绪，品牌色配置完毕

- [ ] **Step 1: 创建 Next.js 项目**

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd frontend
```

- [ ] **Step 2: 安装 shadcn/ui 并添加组件**

```bash
npx shadcn@latest init -d  # 默认配置
npx shadcn@latest add button card badge table dialog form input select textarea tabs dropdown-menu separator pagination skeleton toast
```

- [ ] **Step 3: 配置 tailwind.config.ts 品牌色**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0F766E", dark: "#115E59", light: "#CCFBF1" },
        secondary: { DEFAULT: "#334155", light: "#F1F5F9" },
        accent: { DEFAULT: "#D97706", hover: "#B45309", light: "#FEF3C7" },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
      },
    },
  },
};
export default config;
```

- [ ] **Step 4: 配置 globals.css 品牌 Token**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap');

@layer base {
  :root {
    --color-primary: #0F766E;
    --color-primary-dark: #115E59;
    --color-primary-light: #CCFBF1;
    --color-accent: #D97706;
  }
}
```

- [ ] **Step 5: 配置 API 代理 (next.config.js)**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' },
      { source: '/admin/:path*', destination: 'http://localhost:8000/admin/:path*' },
    ];
  },
};
module.exports = nextConfig;
```

- [ ] **Step 6: 启动验证 `npm run dev`**

- [ ] **Step 7: Commit**

---

### Task 3: 数据库模型

**文件:**
- Create: `backend/app/models/user.py`, `space.py`, `order.py`, `contract.py`, `favorite.py`, `notification.py`

**目标:** 7 张表全部建好，启动 FastAPI 时自动建表

- [ ] **Step 1: 创建 User 和 Admin 模型**

```python
# models/user.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    company = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 2: 创建 Space 模型** (参照 spec 第 5.3 节所有字段，共 23 个字段)

```python
# models/space.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Space(Base):
    __tablename__ = "spaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    area = Column(Float, nullable=False)
    area_category = Column(String(10), nullable=False, default="small")  # small/medium/large
    monthly_rent = Column(Float, nullable=False)
    yearly_rent = Column(Float, nullable=False)
    address = Column(String(255))
    description = Column(Text)
    floor_height = Column(Float)
    ground_load = Column(Float)
    power_capacity = Column(Integer)
    has_crane = Column(Boolean, default=False)
    has_forklift = Column(Boolean, default=False)
    floor_material = Column(String(50))
    fire_rating = Column(String(50))
    drainage = Column(String(100))
    ventilation = Column(String(100))
    has_office = Column(Boolean, default=False)
    parking = Column(String(100))
    loading_platform = Column(Boolean, default=False)
    images = Column(Text, default="[]")  # JSON array of file paths
    status = Column(String(20), default="available")
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 3: 创建 Order 模型**

```python
# models/order.py
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(30), unique=True, nullable=False)
    user_id = Column(Integer, nullable=True)  # nullable for quick order
    contact_name = Column(String(50), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(100))
    space_id = Column(Integer, nullable=False)
    rent_type = Column(String(10), nullable=False)  # monthly/yearly
    start_date = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    admin_remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 4: 创建 Contract, Favorite, Notification 模型** (参照 spec 第 5.5-5.7 节)

- [ ] **Step 5: 更新 main.py 导入所有模型后建表**

```python
from app.models import user, space, order, contract, favorite, notification
```

- [ ] **Step 6: 启动后端确认表创建成功**

- [ ] **Step 7: Commit**

---

### Task 4: 认证系统 (JWT)

**文件:**
- Create: `backend/app/services/auth.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/routers/auth.py`

**目标:** 用户注册/登录返回 JWT，管理员登录返回管理员 JWT

- [ ] **Step 1: 实现密码哈希和 Token 生成**

```python
# services/auth.py
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "guanglan-secret-key-change-in-production"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta = timedelta(hours=24)) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```

- [ ] **Step 2: 定义 Pydantic Schemas**

```python
# schemas/user.py
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    phone: str
    email: str | None = None
    password: str
    company: str | None = None

class UserLogin(BaseModel):
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None
    company: str | None
```

- [ ] **Step 3: 实现注册/登录路由**

```python
# routers/auth.py
@router.post("/api/auth/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # 检查手机号是否已注册
    # 哈希密码 → 创建 User → 返回 Token

@router.post("/api/auth/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    # 查找用户 → 验证密码 → 返回 Token
```

- [ ] **Step 4: 实现 get_current_user 依赖注入**

```python
def get_current_user(token: str = Header(...), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(401)
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(401)
    return user
```

- [ ] **Step 5: 用 curl 测试注册/登录**

- [ ] **Step 6: Commit**

---

### Task 5: 种子数据

**文件:**
- Create: `backend/seed.py`

**目标:** 一键初始化管理员账户 + 10 条示例厂房数据

- [ ] **Step 1: 创建 seed.py** — 管理员: `admin / admin123`，10 个厂房覆盖小/中/大三种面积各 3-4 个
- [ ] **Step 2: 运行 `python seed.py` 并验证数据**
- [ ] **Step 3: Commit**

---

## Phase 2: 厂房展示（前台核心）

### Task 6: 厂房 API

**文件:**
- Create: `backend/app/schemas/space.py`
- Create: `backend/app/routers/spaces.py`

**目标:** 厂房列表（搜索+筛选+分页）和详情 API 可用

- [ ] **Step 1: 定义 Space Schema** (请求/响应，JSON 序列化)
- [ ] **Step 2: 实现列表接口 `GET /api/spaces`**

查询参数：`?keyword=&area_category=&status=available&page=1&page_size=12`

```python
@router.get("/api/spaces")
def list_spaces(
    keyword: str = "",
    area_category: str = "",
    status: str = "available",
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db)
):
    query = db.query(Space).filter(Space.is_published == True)
    if area_category: query = query.filter(Space.area_category == area_category)
    if status: query = query.filter(Space.status == status)
    if keyword: query = query.filter(
        Space.name.contains(keyword) | Space.address.contains(keyword)
    )
    total = query.count()
    items = query.offset((page-1)*page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}
```

- [ ] **Step 3: 实现详情接口 `GET /api/spaces/{id}`**
- [ ] **Step 4: 用 curl 测试**
- [ ] **Step 5: Commit**

---

### Task 7: 首页 + 厂房列表页 + 厂房详情页

**文件:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/components/SpaceCard.tsx`
- Create: `frontend/src/components/SearchBar.tsx`
- Create: `frontend/src/components/Badge.tsx`
- Create: `frontend/src/components/Pagination.tsx`
- Create: `frontend/src/components/EmptyState.tsx`
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/Footer.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx` (首页)
- Create: `frontend/src/app/spaces/page.tsx` (列表)
- Create: `frontend/src/app/spaces/[id]/page.tsx` (详情)

**目标:** 三个前台页面完整可用

- [ ] **Step 1: 创建 TS 类型定义**

```ts
// types/index.ts
export interface Space {
  id: number;
  name: string;
  area: number;
  area_category: 'small' | 'medium' | 'large';
  monthly_rent: number;
  yearly_rent: number;
  address: string;
  description: string;
  floor_height: number;
  ground_load: number;
  power_capacity: number;
  has_crane: boolean;
  has_forklift: boolean;
  floor_material: string;
  fire_rating: string;
  drainage: string;
  ventilation: string;
  has_office: boolean;
  parking: string;
  loading_platform: boolean;
  images: string[];
  status: 'available' | 'rented' | 'maintenance';
  is_published: boolean;
}

export interface Order {
  id: number;
  order_no: string;
  contact_name: string;
  contact_phone: string;
  space_id: number;
  rent_type: 'monthly' | 'yearly';
  start_date: string;
  duration: number;
  total_amount: number;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'signed' | 'active' | 'completed' | 'cancelled';
  admin_remark?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const AREA_LABELS: Record<string, string> = { small: '小型', medium: '中型', large: '大型' };
export const STATUS_LABELS: Record<string, string> = { available: '可租', rented: '已出租', maintenance: '维护中' };
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待审核', reviewing: '审核中', approved: '已通过', rejected: '已拒绝',
  signed: '已签约', active: '租赁中', completed: '已完成', cancelled: '已取消',
};
```

- [ ] **Step 2: 创建 API 封装**

```ts
// lib/api.ts
const API_BASE = '';  // Next.js rewrites 代理

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string,string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getSpaces: (params: Record<string,string>) =>
    request<PaginatedResponse<Space>>(`/api/spaces?${new URLSearchParams(params)}`),
  getSpace: (id: number) => request<Space>(`/api/spaces/${id}`),
  login: (data: {phone:string; password:string}) =>
    request<{access_token:string}>(`/api/auth/login`, { method:'POST', body: JSON.stringify(data) }),
  register: (data: any) =>
    request<{access_token:string}>(`/api/auth/register`, { method:'POST', body: JSON.stringify(data) }),
  // ... 后续任务逐步添加更多方法
};
```

- [ ] **Step 3-6: 依次实现 Navbar → SpaceCard/Badge → 首页 → 厂房列表 → 厂房详情**

按 UI 方案 (docs/ui-styling.md) 实现每个组件和页面

- [ ] **Step 7: Commit**

---

## Phase 3: 租赁下单

### Task 8: 订单 API

**文件:**
- Create: `backend/app/schemas/order.py`
- Create: `backend/app/routers/orders.py`
- Create: `backend/app/utils/order_no.py`

**目标:** 提交订单 + 查看订单列表/详情 API 可用

- [ ] **Step 1: 定义 Order Schema** (OrderCreate: 联系人+厂房+租期；OrderResponse: 完整订单)
- [ ] **Step 2: 实现提交订单 `POST /api/orders`** — 支持登录用户和快速下单
- [ ] **Step 3: 实现订单列表 `GET /api/orders`** — 按 user_id 或 phone 过滤
- [ ] **Step 4: 实现订单详情 `GET /api/orders/{id}`**
- [ ] **Step 5: 用 curl 测试**
- [ ] **Step 6: Commit**

---

### Task 9: 下单流程前端

**文件:**
- Create: `frontend/src/components/OrderForm.tsx`
- Modify: `frontend/src/app/spaces/[id]/page.tsx` (加入下单入口)

**目标:** 用户在详情页点击"立即租赁"→ 弹窗表单 → 提交成功

- [ ] **Step 1: 实现 OrderForm 组件** — 模态框，调用提交 API，区分登录/快速下单
- [ ] **Step 2: 集成到详情页** — "立即租赁"按钮打开表单，成功后 toast 提示
- [ ] **Step 3: Commit**

---

### Task 10: 用户中心 — 订单

**文件:**
- Create: `frontend/src/app/user/layout.tsx`
- Create: `frontend/src/app/user/orders/page.tsx`
- Create: `frontend/src/app/user/orders/[id]/page.tsx`

**目标:** 用户登录后可查看自己的订单列表和详情

- [ ] **Step 1: 用户中心布局** — 左侧导航（订单/收藏/个人信息/通知）
- [ ] **Step 2: 订单列表页** — 表格 + 状态标签颜色
- [ ] **Step 3: 订单详情页** — 订单信息 + 厂房信息 + 续租按钮
- [ ] **Step 4: Commit**

---

## Phase 4: 用户功能完善

### Task 11: 收藏 + 个人信息 + 通知

**文件:**
- Create: `backend/app/routers/favorites.py`, `users.py`, `notifications.py`
- Create: `frontend/src/app/user/favorites/page.tsx`
- Create: `frontend/src/app/user/profile/page.tsx`
- Create: `frontend/src/app/user/notifications/page.tsx`

**目标:** 收藏、个人信息编辑、消息通知全部可用

- [ ] **Step 1: 后端 Favorites API** (POST 切换收藏, GET 列表)
- [ ] **Step 2: 后端 User Profile API** (GET/PUT)
- [ ] **Step 3: 后端 Notifications API** (GET 列表, PUT 标记已读)
- [ ] **Step 4: 前端收藏页** — 厂房卡片列表
- [ ] **Step 5: 前端个人信息页** — 表单编辑
- [ ] **Step 6: 前端通知页** — 消息列表
- [ ] **Step 7: 集成收藏按钮到详情页**
- [ ] **Step 8: Commit**

---

### Task 12: 合同生成

**文件:**
- Create: `backend/app/services/contract.py`
- Create: `backend/app/models/contract.py`
- Create: `backend/app/routers/admin.py` (合同相关部分)
- Create: `frontend/src/components/ContractForm.tsx`

**目标:** 管理员后台生成合同 PDF，用户可查看/下载

- [ ] **Step 1: 实现合同生成服务** — Jinja2 模板 → HTML → WeasyPrint PDF
- [ ] **Step 2: 实现合约 API** — POST 生成, GET 查看/下载
- [ ] **Step 3: 前端合同表单** — 管理员填入关键字段 → 生成
- [ ] **Step 4: Commit**

---

## Phase 5: 后台管理

### Task 13: 后台布局 + 仪表盘

**文件:**
- Create: `frontend/src/components/AdminSidebar.tsx`
- Create: `frontend/src/components/StatCard.tsx`
- Create: `frontend/src/app/admin/layout.tsx`
- Create: `frontend/src/app/admin/page.tsx`
- Modify: `backend/app/routers/admin.py` (仪表盘统计)

**目标:** 后台布局（深色侧边栏）+ 仪表盘统计卡片

- [ ] **Step 1: AdminSidebar** — slate-800 背景，240px 宽
- [ ] **Step 2: Dashboard API** — 返回在租数量、待审核数、本月新增、空置率
- [ ] **Step 3: 仪表盘页面** — 4 个 StatCard + 最近订单列表
- [ ] **Step 4: Commit**

---

### Task 14: 后台厂房管理 + 订单管理

**文件:**
- Create: `frontend/src/components/AdminDataTable.tsx`
- Create: `frontend/src/app/admin/spaces/page.tsx`
- Create: `frontend/src/app/admin/spaces/[id]/page.tsx`
- Create: `frontend/src/app/admin/orders/page.tsx`
- Create: `frontend/src/app/admin/orders/[id]/page.tsx`
- Modify: `backend/app/routers/admin.py` (CRUD + 状态更新)

**目标:** 管理员可完整管理厂房和订单

- [ ] **Step 1: 后端厂房 CRUD API** (POST/PUT/DELETE /admin/spaces, 图片上传)
- [ ] **Step 2: 后端订单管理 API** (PUT 状态更新, GET 列表)
- [ ] **Step 3: 厂房管理页** — 表格 + 新增/编辑弹窗表单 + 图片上传
- [ ] **Step 4: 订单管理页** — 表格 + 状态操作按钮 + 合同入口
- [ ] **Step 5: Commit**

---

## Phase 6: 收尾

### Task 15: 通知邮件 + SEO + 响应式收尾

**文件:**
- Create: `backend/app/services/email.py`
- Modify: `frontend/src/app/layout.tsx` (metadata)

**目标:** 邮件通知可用，全站 SEO 就绪，移动端响应式验证

- [ ] **Step 1: 邮件服务** — SMTP 发送，新订单通知管理员，状态变更通知客户
- [ ] **Step 2: SEO metadata** — 每个页面添加 title/description
- [ ] **Step 3: 全站响应式走查** — 首页/列表/详情/用户中心/后台
- [ ] **Step 4: 最终验证** — 完整流程走通
- [ ] **Step 5: Commit**

---

## 总计：15 个 Task | 6 个 Phase

每个 Task 完成后独立可测。Phase 间有依赖，Phase 内 Task 按序执行。
