# Task 9-10 实施报告

**日期:** 2026-07-08
**状态:** 完成
**构建:** `npm run build` 通过

---

## 改了什么

### Task 9 — 下单表单

1. **`frontend/src/lib/api.ts`** — 新增订单相关 API 方法：
   - `createOrder` — POST /api/orders
   - `getMyOrders` — GET /api/orders（支持分页参数）
   - `getOrder` — GET /api/orders/:id
   - `renewOrder` — POST /api/orders/:id/renew

2. **`frontend/src/components/OrderForm.tsx`** (新建) — 模态框下单表单：
   - 字段：联系人姓名（必填）、联系电话（必填）、联系邮箱（选填）、租赁类型（月租/年租下拉）、起租日期（date picker）、租赁时长（数字）、备注（文本框）
   - 已登录用户自动预填姓名、电话、邮箱
   - 未登录用户可手动填写，顶部显示 amber 提示
   - 提交前前端校验必填项
   - 成功后弹出 toast 显示订单编号
   - 已登录用户自动跳转到 `/user/orders`

3. **`frontend/src/app/spaces/[id]/page.tsx`** (修改) — 集成下单入口：
   - 桌面右侧"立即租赁"按钮绑定 `onClick` 打开 OrderForm
   - 移动端底部固定栏按钮同样绑定
   - 仅当 `space.status === "available"` 时按钮可点击

### Task 10 — 用户中心

4. **`frontend/src/app/user/layout.tsx`** (新建) — 用户中心布局：
   - 桌面端：200px 左侧导航，包含"我的订单/我的收藏/个人信息/消息通知"
   - 移动端：顶部水平可滚动 Tab 导航
   - 当前激活项：`border-l-teal-700 bg-teal-50 text-teal-700`
   - 默认项：`text-slate-600 hover:bg-slate-50`
   - 登录检查：无 token 时跳转到 `/login`，检查中显示加载动画

5. **`frontend/src/app/user/orders/page.tsx`** (新建) — 订单列表：
   - 桌面端：表格（订单编号/厂房名称/金额/状态标签/日期/查看按钮）
   - 移动端：卡片列表，点击跳转详情
   - 同时拉取关联厂房名称
   - 三种状态：加载骨架屏、空状态引导、错误重试

6. **`frontend/src/app/user/orders/[id]/page.tsx`** (新建) — 订单详情：
   - 订单信息区：编号、状态标签、创建时间、联系人
   - 厂房信息区：名称、地址、面积，可链接跳转到厂房详情
   - 租赁信息区：类型、起租日、时长、总金额
   - 续租按钮：仅 `status === "active"` 时显示
   - 管理员备注：有备注时显示 amber 提示区
   - 返回按钮

---

## 验证结果

- TypeScript 类型检查通过
- Next.js 构建通过（6 条路由，无报错）
- 新路由：`/user/orders` (静态), `/user/orders/[id]` (动态)

---

## 风险 & 注意事项

1. **厂房名称查找**：订单列表通过独立 API 调用获取每个厂房的名称，如果订单数量很大（>50），建议后端在订单接口中 expand `space` 关联数据以减少请求数。

2. **未登录下单**：OrderForm 允许未登录用户下单，API 的 `request()` 在无 token 时不传 Authorization header。如果后端要求所有 `/api/orders` POST 需认证，未登录下单会失败。当前实现会在失败时显示错误 toast。

3. **用户信息存储格式**：预填依赖 `localStorage.getItem("user")` 返回 JSON 对象（含 `name`, `phone`, `email` 字段）。如果登录/注册页未按此格式存储，预填功能不会生效（表单仍可手动填写）。

4. **收藏/个人信息/消息通知页面**：这些路由（`/user/favorites`, `/user/profile`, `/user/notifications`）在导航中存在但尚未创建页面，点击会 404。需要在后续任务中实现。

5. **Select 组件 API 差异**：该项目使用的是 `@base-ui/react` select，其 `onValueChange` 回调参数类型为 `(value: string | null, eventDetails)`，需要注意 null 值的处理。

---

## 文件清单

| 操作 | 文件 |
|------|------|
| 修改 | `frontend/src/lib/api.ts` |
| 新建 | `frontend/src/components/OrderForm.tsx` |
| 修改 | `frontend/src/app/spaces/[id]/page.tsx` |
| 新建 | `frontend/src/app/user/layout.tsx` |
| 新建 | `frontend/src/app/user/orders/page.tsx` |
| 新建 | `frontend/src/app/user/orders/[id]/page.tsx` |
