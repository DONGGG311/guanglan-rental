# 广澜印刷包装有限公司 — 厂房租赁平台 需求设计文档

> 创建日期：2026-07-07
> 状态：已确认

---

## 1. 项目概览

广澜印刷包装有限公司拥有闲置厂房空间，需要搭建一个线上厂房租赁展示平台。客户可在线浏览厂房信息、提交租赁订单，管理员后台管理厂房和订单。

### 1.1 目标用户

| 用户类型 | 描述 |
|----------|------|
| 租赁客户 | 印刷厂、包装厂等需要租赁厂房的企业或个人 |
| 管理员 | 广澜公司内部单一管理员，负责厂房管理和订单处理 |

---

## 2. 商业模式与规则

| 维度 | 决策 |
|------|------|
| 租赁模式 | 月租 + 年租双档位，最短 1 个月起租 |
| 交易方式 | 纯展示/线下成交，不涉及在线支付 |
| 押金 | 面议，不显示具体金额 |
| 厂房分类 | 按面积三档：小型（<100㎡）/ 中型（100-500㎡）/ 大型（>500㎡） |
| 首期上线量 | 约 10 个厂房，后续通过后台动态管理 |

### 2.1 租赁流程

```
客户浏览 → 厂房详情 → 点击"立即租赁"
    ↓
选择：登录/注册 或 快速下单（手机号）
    ↓
选择租赁周期（月租/年租）、起租日期、时长 → 提交订单
    ↓
订单状态流转：
  待审核 → 审核中 → 已通过 → 已签约 → 租赁中 → 已完成
            ↘ 已拒绝    ↘ 已取消
```

---

## 3. 技术架构

```
┌──────────────────────────┐
│   前端：Next.js 14        │
│   App Router + Tailwind   │
│   Port 3000               │
└───────────┬──────────────┘
            │ REST API (JSON)
┌───────────┴──────────────┐
│   后端：FastAPI (Python)  │
│   JWT 认证 + 邮件通知     │
│   Port 8000               │
└───────────┬──────────────┘
            │
┌───────────┴──────────────┐
│   SQLite                  │
│   本地文件存储（图片）     │
└──────────────────────────┘
```

**技术选型：**
- 前端：Next.js 14 App Router、Tailwind CSS、shadcn/ui
- 后端：FastAPI (Python 3.11+)、SQLAlchemy ORM、Alembic 迁移
- 数据库：SQLite（后续可迁移至 PostgreSQL）
- 认证：JWT（用户端 + 管理端独立登录）
- 通知：SMTP 邮件（后台任务发送）
- 部署：前端 Vercel / 后端云服务器或同机部署

---

## 4. 前端页面路由

```
首页 (/)
├── 厂房列表 (/spaces)              ← 面积筛选、关键词搜索、分页
│   └── 厂房详情 (/spaces/[id])     ← 完整参数、图片、租赁下单入口
├── 用户注册 (/auth/register)
├── 用户登录 (/auth/login)
└── 用户中心 (/user)               ← 需登录
    ├── 我的订单 (/user/orders)
    │   └── 订单详情 (/user/orders/[id])  ← 合同查看、续租申请
    ├── 我的收藏 (/user/favorites)
    ├── 个人信息 (/user/profile)
    └── 消息通知 (/user/notifications)

后台管理 (/admin)                   ← 独立登录入口
├── 仪表盘 (/admin)                ← 订单概览、厂房统计
├── 厂房管理 (/admin/spaces)       ← 增删改、上下架、图片管理
├── 订单管理 (/admin/orders)       ← 审核、状态更新
│   └── 合同生成 (/admin/orders/[id]/contract)
└── 消息通知 (/admin/notifications)
```

---

## 5. 数据模型

### 5.1 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | VARCHAR(50) | 姓名 |
| phone | VARCHAR(20) | 手机号（唯一） |
| email | VARCHAR(100) | 邮箱（唯一，可选） |
| password_hash | VARCHAR(255) | 密码哈希 |
| company | VARCHAR(100) | 公司名称（可选） |
| created_at | DATETIME | 注册时间 |

### 5.2 管理员表 (admins)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| password_hash | VARCHAR(255) | 密码哈希 |
| email | VARCHAR(100) | 邮箱（通知接收） |
| created_at | DATETIME | 创建时间 |

### 5.3 厂房表 (spaces)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | VARCHAR(100) | 厂房名称 |
| area | FLOAT | 面积（㎡） |
| area_category | VARCHAR(10) | small/medium/large |
| monthly_rent | FLOAT | 月租金（元） |
| yearly_rent | FLOAT | 年租金（元） |
| address | VARCHAR(255) | 详细地址 |
| description | TEXT | 厂房描述 |
| floor_height | FLOAT | 层高（m） |
| ground_load | FLOAT | 地面承重（t/㎡） |
| power_capacity | INTEGER | 供电容量（kVA） |
| has_crane | BOOLEAN | 是否有行车 |
| has_forklift | BOOLEAN | 是否有叉车 |
| floor_material | VARCHAR(50) | 地面材质 |
| fire_rating | VARCHAR(50) | 消防等级 |
| drainage | VARCHAR(100) | 排水/排污 |
| ventilation | VARCHAR(100) | 通风条件 |
| has_office | BOOLEAN | 是否有办公配套 |
| parking | VARCHAR(100) | 停车位情况 |
| loading_platform | BOOLEAN | 是否有装卸平台 |
| images | TEXT | 图片路径（JSON 数组） |
| status | VARCHAR(20) | available/rented/maintenance |
| is_published | BOOLEAN | 是否上架展示 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 5.4 订单表 (orders)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| order_no | VARCHAR(30) | 订单编号（唯一） |
| user_id | INTEGER | 用户 ID（可空，快速下单填 0） |
| contact_name | VARCHAR(50) | 联系人姓名 |
| contact_phone | VARCHAR(20) | 联系电话 |
| contact_email | VARCHAR(100) | 联系邮箱（可选） |
| space_id | INTEGER FK | 厂房 ID |
| rent_type | VARCHAR(10) | monthly/yearly |
| start_date | DATE | 起租日期 |
| duration | INTEGER | 租赁时长（月/年数） |
| total_amount | FLOAT | 总金额（自动计算） |
| status | VARCHAR(20) | 见下方状态流转 |
| admin_remark | TEXT | 管理员备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**订单状态：**
`pending`（待审核）→ `reviewing`（审核中）→ `approved`（已通过）/ `rejected`（已拒绝）→ `signed`（已签约）→ `active`（租赁中）→ `completed`（已完成）/ `cancelled`（已取消）

### 5.5 合同表 (contracts)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| order_id | INTEGER FK | 关联订单 ID（唯一） |
| contract_no | VARCHAR(50) | 合同编号 |
| party_a | VARCHAR(100) | 甲方（广澜公司） |
| party_b | VARCHAR(100) | 乙方（承租方） |
| space_name | VARCHAR(100) | 厂房名称 |
| rent_type | VARCHAR(10) | 租赁类型 |
| start_date | DATE | 起租日期 |
| end_date | DATE | 到期日期 |
| rent_amount | FLOAT | 租金金额 |
| deposit | VARCHAR(50) | 押金（面议文字） |
| terms | TEXT | 合同条款 |
| file_path | VARCHAR(255) | 生成 PDF 路径 |
| created_at | DATETIME | 生成时间 |

### 5.6 收藏表 (favorites)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| user_id | INTEGER FK | 用户 ID |
| space_id | INTEGER FK | 厂房 ID |
| created_at | DATETIME | 收藏时间 |

（user_id + space_id 联合唯一）

### 5.7 通知表 (notifications)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| user_id | INTEGER | 接收用户 ID |
| title | VARCHAR(100) | 通知标题 |
| content | TEXT | 通知内容 |
| is_read | BOOLEAN | 是否已读 |
| type | VARCHAR(20) | order_update/system/other |
| created_at | DATETIME | 发送时间 |

---

## 6. API 设计

### 6.1 公开 API（无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/spaces` | 厂房列表（分页、搜索、面积筛选） |
| GET | `/api/spaces/{id}` | 厂房详情 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

### 6.2 用户 API（需 JWT 认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/profile` | 获取个人信息 |
| PUT | `/api/user/profile` | 更新个人信息 |
| POST | `/api/orders` | 提交租赁订单 |
| GET | `/api/orders` | 我的订单列表 |
| GET | `/api/orders/{id}` | 订单详情 |
| POST | `/api/orders/{id}/renew` | 续租申请 |
| GET | `/api/orders/{id}/contract` | 查看/下载合同 |
| POST | `/api/favorites` | 收藏/取消收藏 |
| GET | `/api/favorites` | 我的收藏列表 |
| GET | `/api/notifications` | 我的消息列表 |
| PUT | `/api/notifications/{id}/read` | 标记已读 |

### 6.3 管理端 API（/admin 前缀 + 管理员 JWT 认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/admin/auth/login` | 管理员登录 |
| GET | `/admin/dashboard` | 仪表盘统计 |
| GET | `/admin/spaces` | 厂房管理列表 |
| POST | `/admin/spaces` | 新增厂房 |
| PUT | `/admin/spaces/{id}` | 编辑厂房 |
| DELETE | `/admin/spaces/{id}` | 删除厂房 |
| PUT | `/admin/spaces/{id}/publish` | 上下架切换 |
| POST | `/admin/spaces/{id}/images` | 上传图片 |
| DELETE | `/admin/spaces/{id}/images` | 删除图片 |
| GET | `/admin/orders` | 订单管理列表 |
| PUT | `/admin/orders/{id}/status` | 更新订单状态 |
| POST | `/admin/orders/{id}/contract` | 生成合同 |
| GET | `/admin/orders/{id}/contract` | 查看合同 |
| POST | `/admin/notifications` | 发送通知给用户 |

---

## 7. 非功能需求

| 维度 | 要求 |
|------|------|
| SEO | 厂房列表/详情支持 SSR/SSG，便于搜索引擎收录 |
| 响应式 | 全平台自适应（PC + 平板 + 手机） |
| 安全 | JWT 认证、密码 bcrypt 哈希、SQL 注入防护 |
| 邮件通知 | 新订单通知管理员、订单状态变更通知客户 |
| 图片上传 | 支持多图上传，自动生成缩略图，限制单张 5MB |
| 性能 | 列表分页（每页 12 条）、图片懒加载 |

---

## 8. 里程碑建议

| 阶段 | 内容 | 预估 |
|------|------|------|
| Phase 1 | 厂房展示（列表+详情+搜索筛选）、用户注册登录 | MVP |
| Phase 2 | 租赁下单流程、订单管理后台 | MVP |
| Phase 3 | 合同生成、消息通知、收藏功能 | Full |
| Phase 4 | 邮件通知、图片管理、用户中心完善 | Full |

---

## 附录：决策记录

所有决策均基于 2026-07-07 与用户逐项沟通确认，无遗留 TBD。
