# Responses API 迁移与项目优化实施计划

> **已归档**：此计划为 Supabase 时代的历史文档；当前实现为自托管 PostgreSQL + JWT，
> 请以 README.md / PROJECT_BRIEF.md 为准。

> **For agentic workers:** Execution in this session is **inline** (no subagent dispatch). Steps use checkbox (`- [ ]`) syntax.

**Goal:** 移除泄漏的 API Key，将 LLM 调用从 Chat Completions 迁移到 DeepSeek 原生 Responses API，并按 Vercel React/Next.js 最佳实践做一轮低风险优化。

**Architecture:** 保持现有分层（API routes → lib/llm/deepseek.ts → DeepSeek）。仅替换 LLM 传输层（`/responses` 端点 + 语义事件流），路由与前端不感知协议差异。优化集中在文档、死代码、输入校验、并行化和本地存储健壮性。

**Tech Stack:** Next.js 16.2.6（App Router）、React 19、TypeScript 5、DeepSeek Responses API（`https://api.deepseek.com/responses`）、Supabase。

## Global Constraints

- 不改动路由/组件的对外接口（`chatCompletionStream({ messages, ... })` 签名保持）。
- 默认模型改为 `deepseek-v4-flash`（Responses API 目前仅支持该模型；`deepseek-v4-pro` 预计 2026 年 8 月初支持，通过 `DEEPSEEK_MODEL` 环境变量切换）。
- 所有文案保持中文；新文案不得再出现"localStorage 存储"等过时表述。
- 验证门禁：`npm run lint` 与 `npm run build` 必须通过。

---

### Task 1: 清理泄漏 Key 与文档同步

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `PROJECT_BRIEF.md`（仅技术栈表）

- [x] **Step 1: 替换 `.env.example` 中的真实 Key 为占位符，并把模型改为 `deepseek-v4-flash`**
  - `DEEPSEEK_API_KEY=sk-你的DeepSeek密钥`
  - `DEEPSEEK_MODEL=deepseek-v4-flash`，加注释：Responses API 目前仅支持 flash；pro 支持 2026 年 8 月初上线后可切换。
  - 取消注释 Supabase 变量并加说明（浏览器端需要 URL + anon key；服务端可选 service role key）。

- [x] **Step 2: 更新 README**
  - 技术栈表：Next.js 16、数据存储改为 Supabase。
  - 快速开始：补 Supabase 项目创建 + 执行 `supabase/migrations/*.sql` 的步骤；修正 `cd CarAgentC` → `cd autodoc-agent`。
  - 环境变量节：加入 Supabase 变量与 Responses API 说明；模型名用 `deepseek-v4-flash`。
  - 开发路线：Phase 5 标记为已部分完成（Supabase 迁移完成）。

- [x] **Step 3: 更新 PROJECT_BRIEF 技术栈表**（Next.js 14 → 16；数据库标注 Supabase 已完成）

**验证:** 仓库内无泄漏的真实 Key 残留；README 无 "localStorage" 数据存储表述、无 "CarAgentC"。

---

### Task 2: 迁移 LLM 层到 Responses API

**Files:**
- Modify: `src/lib/llm/deepseek.ts`

**Interfaces:**
- Consumes: `ChatCompletionMessage[]`（`role: 'system'|'user'|'assistant'`）
- Produces: `chatCompletionStream(options): Promise<ReadableStream<string>>`、`chatCompletion(options): Promise<string>`（签名不变，内部走 `/responses`）

- [x] **Step 1: 重写请求构造**
  - 端点为 `${DEEPSEEK_BASE_URL}/responses`。
  - 第一条 system 消息 → `instructions`；其余消息 → `input` 数组（映射为 `{ role, content }`，过滤掉后续 system 角色）。
  - 参数映射：`maxTokens` → `max_output_tokens`；`temperature` 保持（范围 [0,2]）。

- [x] **Step 2: 重写流式解析**
  - 解析 `data: {json}`，读取 `event.type`（兼容字段名 `type`）。
  - `response.output_text.delta` → 输出 `delta` 文本。
  - `response.completed` / `response.incomplete` → 正常关闭。
  - `response.failed` → 输出错误文本并关闭。
  - 保留连接超时 + chunk 超时逻辑；忽略 reasoning 事件（不输出思维链）。

- [x] **Step 3: 非流式 `chatCompletion` 同步迁移**：POST `/responses`（`stream: false`），返回响应体 `output_text`。

- [x] **Step 4: 错误映射补充**：400（上下文超长）→ 友好提示；其余 401/404/429 沿用现有映射。

**验证:** `npm run lint` 通过；构建通过。手动冒烟：`curl -N -X POST http://localhost:3000/api/diagnose/start` 返回 SSE 且最终事件非 `[DONE]`（若未配置 Supabase 则至少确认 401/配置错误而非 500 协议错误）。

---

### Task 3: API 路由健壮性与并行化

**Files:**
- Modify: `src/app/api/diagnose/start/route.ts`
- Modify: `src/app/api/diagnose/chat/route.ts`
- Modify: `src/app/api/used-car/evaluate/route.ts`

- [x] **Step 1: 并行化**：`const [body, { user }] = await Promise.all([request.json(), getServerUser()])`（先校验登录失败再继续）。

- [x] **Step 2: 输入长度上限**：`symptom ≤ 1000`、`message ≤ 2000`、`description ≤ 4000`，超限返回 400 中文提示；used-car 校验 `mileage/askingPrice` 为有限非负数。

**验证:** 手动 curl 超长输入返回 400；未登录返回 401（不触发 LLM 调用）。

---

### Task 4: 前端文案、死代码与本地存储健壮性

**Files:**
- Modify: `src/components/home/QuickDiagnose.tsx`
- Modify: `src/app/admin/seed/page.tsx`
- Modify: `src/lib/storage.ts`
- Delete: `src/hooks/useChat.ts`

- [x] **Step 1: QuickDiagnose 文案**：删除"无需登录"表述，改为"输入一个症状，立即开始 AI 智能问诊"。

- [x] **Step 2: seed 页文案**："所有本地数据已清除" → "所有数据已清除"；注意事项第一条改为 Supabase 表述（"演示数据保存在您的账户下"）。

- [x] **Step 3: storage.ts 当前会话 localStorage 访问**：包装 try/catch 并做内存缓存（规则 4.4/7.5）。

- [x] **Step 4: 删除 `src/hooks/useChat.ts`**（已确认无引用）。

**验证:** `rg -n "useChat" src` 无结果（hooks/useChat 自身除外）；`rg -n "无需登录|localStorage 中" src` 无结果。

---

### Task 5: 验证与收尾

- [x] **Step 1: 安装依赖并跑 lint/build**：`npm install && npm run lint && npm run build`（lint 0 错误；build 通过）。
- [x] **Step 2: 修复 lint 问题**：11 error + 20 warning 全部清零（含历史遗留的未使用导入、set-state-in-effect、正则/文案问题）。
- [x] **Step 3: 汇总变更**，向用户报告；未提交 git（等待用户确认）。

## 附注（执行中发现并处理）

- 构建在缺少 Supabase 环境变量时会失败（`proxy` / AuthProvider 初始化客户端）。已创建本地 `.env.local` 占位配置（gitignore 排除）并写入 README 的 Supabase 配置步骤。
- DeepSeek Responses API 当前仅支持 `deepseek-v4-flash`，`deepseek-v4-pro` 支持预计 2026 年 8 月初上线（以官方文档为准），通过 `DEEPSEEK_MODEL` 可随时切换。
