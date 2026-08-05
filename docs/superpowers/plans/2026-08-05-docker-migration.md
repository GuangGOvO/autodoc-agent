# Docker 全栈部署迁移实施计划

> **For agentic workers:** Execution in this session is **inline**。步骤使用 checkbox（`- [ ]`）语法。

**Goal:** 移除 Vercel 部署设置，将 AutoDoc 智驾医生迁移到 Docker 部署（自购云服务器），验证镜像构建与容器运行。

**Architecture:** Next.js 16 使用 `output: 'standalone'` 产出自包含 server，多阶段 Docker 构建（deps → builder → runner），Compose 管理生命周期，环境变量通过 `.env.local`（gitignore 排除）注入。数据库/认证暂保持 Supabase 托管服务（是否自托管 Postgres + Auth 是后续决策点）。

**Tech Stack:** Docker 29 / Compose 2.x、node:22-alpine、Next.js standalone。

## Global Constraints

- 不提交任何真实密钥：`.env*` 一律进 `.dockerignore`，运行期通过 `env_file` 注入。
- 镜像内以非 root 用户运行（`nextjs`，uid 1001）。
- 保留本地 `npm run dev/build/start` 工作流不受影响。
- 验证门禁：`docker build` 成功 + 容器健康检查通过 + 首页 HTTP 200。

---

### Task 1: 移除 Vercel 部署设置

**Files:**
- Delete: `vercel.json`
- Delete: `public/vercel.svg`（Next.js 默认未使用资产）
- Modify: `README.md`（技术栈表 + 部署章节改为 Docker）
- Modify: `PROJECT_BRIEF.md`（部署行 + 里程碑 15）
- Modify: `DEMO_SCRIPT.md`（Vercel 线上地址表述）

- [x] **Step 1:** 删除 `vercel.json` 与 `public/vercel.svg`。
- [x] **Step 2:** README 技术栈表 `部署 | Vercel` → `部署 | Docker（自购云服务器）`；删除 "Vercel 部署（推荐）" 章节。
- [x] **Step 3:** PROJECT_BRIEF 部署行与里程碑同步；DEMO_SCRIPT 地址表述更新。

**验证:** `rg -i vercel .`（排除 node_modules/.git/.next/docs）无残留引用。

---

### Task 2: Docker 化配置

**Files:**
- Modify: `next.config.ts`（`output: 'standalone'`；移除 Vercel 预览 origin）
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Create: `Makefile`

- [x] **Step 1:** `next.config.ts` 增加 `output: 'standalone'`，`allowedDevOrigins` 移除 `test.u1041672.nyat.app`。
- [x] **Step 2:** 编写多阶段 `Dockerfile`（node:22-alpine；npm ci → next build → standalone runner；非 root；HEALTHCHECK；构建期注入 NEXT_PUBLIC_*）。
- [x] **Step 3:** 编写 `.dockerignore`（排除 node_modules/.next/.git/.env*/docs）。
- [x] **Step 4:** 编写 `docker-compose.yml`（app 服务：构建 args + `env_file: .env`（required:false）、端口 3000、restart）。
- [x] **Step 5:** 编写 `Makefile`（build/up/down/logs/restart/ps）。

**验证:** `docker compose config` 通过；`.env.local` 不被打包进镜像（build 时无密钥告警）。

---

### Task 3: 构建与运行验证

- [x] **Step 1:** `docker compose build` 成功（autodoc-agent:latest）。
- [x] **Step 2:** `docker compose up -d` 后首页返回 200；容器状态 healthy。
- [x] **Step 3:** `docker compose logs app` 无致命错误；受保护路由 307 跳登录正常。
- [x] **Step 4:** `docker compose down` 清理完成（镜像保留）。

**验证:** 容器 HEALTHCHECK 通过；页面渲染正常（占位 env 下首页可访问，登录/API 需真实 env）。

---

### Task 4: 文档与收尾

- [x] **Step 1:** README 新增 Docker 部署章节（环境要求、步骤、Nginx 反代示例、SSE 提示）。
- [ ] **Step 2:** 提交改动（等待用户确认）。
- [x] **Step 3:** 汇报；明确"数据库/认证是否自托管"决策点（Supabase 托管 vs 自托管 Postgres + Auth）。
