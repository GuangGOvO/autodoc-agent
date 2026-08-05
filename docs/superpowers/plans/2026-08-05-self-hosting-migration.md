# 全自托管改造实施计划（Supabase → 自建 Postgres + JWT）

> **For agentic workers:** Execution in this session is **inline**。步骤使用 checkbox（`- [ ]`）语法。

**Goal:** 移除 Supabase 依赖，改为 Docker 内自建 PostgreSQL + 自研 JWT 会话认证，全栈在自购云服务器上运行。

**Architecture:** 数据库 `postgres:16-alpine`（compose db 服务 + 命名卷持久化）；认证改用 httpOnly JWT Cookie（jose 签名，edge 安全的 proxy 校验）；所有数据读写从"客户端直连 Supabase"改为"客户端 fetch → Next API 路由 → pg"。`storage.ts` / `auth.ts` 保持原函数签名，页面几乎不动。

**Tech Stack:** PostgreSQL 16、pg（node-postgres）、jose（JWT）、bcryptjs（密码哈希）、Next.js API Routes。

## Global Constraints

- 不引入 Supabase 依赖：删除 `@supabase/ssr`、`@supabase/supabase-js` 与 `src/lib/supabase.ts`。
- 前端组件禁止直接连数据库：一律走 API 路由；`storage.ts` 保持导出名与签名不变。
- JWT 密钥只存在于运行期环境变量（`JWT_SECRET`），不提交；密码用 bcrypt 哈希。
- 迁移脚本幂等（`schema_migrations` 表记录已应用迁移）。
- 验证门禁：lint/build 通过；Docker 内 `db + app` 全链路冒烟（注册 → 登录 → 创建车辆 → 页面 200）。

---

### Task 1: 数据层与认证基础设施

**Files:**
- Modify: `package.json`（移除 supabase，新增 pg/jose/bcryptjs/@types/pg）
- Create: `db/migrations/0001_init.sql`
- Create: `src/lib/db.ts`
- Create: `src/lib/session.ts`（jose 签发/校验，edge 安全）
- Create: `src/lib/password.ts`（bcryptjs）
- Modify: `src/lib/serverAuth.ts`（改读 JWT Cookie + DB 查用户）
- Delete: `src/lib/supabase.ts`

- [x] **Step 1:** 更新依赖并 `npm install`（移除 @supabase/*，新增 pg/jose/bcryptjs）。
- [x] **Step 2:** 编写 `db/migrations/0001_init.sql`（users/vehicles/diagnosis_sessions/diagnosis_messages/used_car_evaluations + 索引 + schema_migrations）。
- [x] **Step 3:** 编写 `db.ts`（pg Pool，dev 全局复用）、`session.ts`、`password.ts`。
- [x] **Step 4:** 重写 `serverAuth.ts`（`getServerUser()` 签名不变：读 Cookie → 验 JWT → 查用户）。
- [x] **Step 5:** 删除 `supabase.ts`。

---

### Task 2: 认证与数据 API 路由

**Files:**
- Create: `src/app/api/auth/register/route.ts`、`login`、`logout`、`me`
- Create: `src/app/api/vehicles/route.ts` + `vehicles/[id]/route.ts`
- Create: `src/app/api/diagnose/sessions/route.ts` + `sessions/[id]/route.ts` + `sessions/[id]/messages/route.ts`
- Create: `src/app/api/used-car/evaluations/route.ts` + `evaluations/[id]/route.ts`
- Create: `src/app/api/profile/route.ts`、`src/app/api/stats/route.ts`

- [x] **Step 1:** 认证路由：注册（用户名/邮箱唯一 + bcrypt）、登录（邮箱或用户名）、登出（清 Cookie）、`/me`、check-username。
- [x] **Step 2:** 数据路由：车辆/诊断会话+消息/二手车评估/个人资料/统计，全部按 `user_id` 隔离。
- [x] **Step 3:** 路由统一错误格式 `{ error }`，401/400/404/409 语义正确。

---

### Task 3: 客户端层改造

**Files:**
- Modify: `src/lib/storage.ts`（Supabase 调用 → fetch API 路由，签名不变）
- Modify: `src/lib/auth.ts`（客户端 fetch 包装 + `autodoc-auth-changed` 事件）
- Modify: `src/components/auth/AuthProvider.tsx`（改调 `/api/auth/me`）
- Modify: `src/proxy.ts`（jose 校验 Cookie，edge 安全）

- [x] **Step 1:** `storage.ts` 全部函数改为 `apiFetch` 包装（Vehicle/UserProfile 类型保留导出）。
- [x] **Step 2:** `auth.ts` 客户端函数包装；登出/登录后派发 `autodoc-auth-changed` 事件同步 AuthProvider。
- [x] **Step 3:** `AuthProvider` 改 fetch `/api/auth/me`，移除 Supabase 订阅。
- [x] **Step 4:** `proxy.ts` 用 `session.ts` 校验，保护/放行规则不变。

---

### Task 4: 数据库迁移脚本与 Docker 编排

**Files:**
- Create: `scripts/migrate.mjs`（幂等应用 db/migrations）
- Modify: `docker-compose.yml`（新增 db 服务 + DATABASE_URL/JWT_SECRET）
- Modify: `Dockerfile`（移除 Supabase build-args；runner 复制 scripts）
- Modify: `Makefile`（migrate 命令）
- Modify: `.env.example`（DATABASE_URL/JWT_SECRET/POSTGRES_PASSWORD，移除 Supabase）

- [x] **Step 1:** 编写迁移脚本 + `package.json` 加 `db:migrate`。
- [x] **Step 2:** compose 加 `db`（postgres:16-alpine，卷持久化，healthcheck），app `depends_on` db healthy。
- [x] **Step 3:** 更新 Dockerfile/`Makefile`/`.env.example`。

---

### Task 5: 文档与端到端验证

- [x] **Step 1:** README/PROJECT_BRIEF 架构与部署章节改为自托管（Postgres + JWT，迁移步骤）。
- [x] **Step 2:** `npm run lint` + `npm run build` 通过。
- [x] **Step 3:** Docker 全链路冒烟通过：db+app 启动 → 迁移 → 注册（重复邮箱 409）→ 邮箱/用户名登录 → 建车 → 会话+消息 → 统计 → 数据落盘核对。
- [x] **Step 4:** 提交并推送。
