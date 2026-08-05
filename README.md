# AutoDoc 智驾医生

**AI 驱动的汽车自助预诊断工具** — "经开智造" AI 智能体大赛参赛作品

面向中国 3 亿车主的 AI 自助预诊断智能体。通过多轮对话描述车辆症状，AI 给出可能故障原因、维修方案、透明报价和**防被宰提醒**，让修车不再踩坑。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 核心功能

### 🔍 智能问诊引擎
- 多轮对话式交互，AI 追问关键信息精准定位故障
- 基于 DeepSeek 大模型 + 结构化故障知识库（42+ 故障条目，8 大系统）
- SSE 流式输出，打字机效果实时呈现
- 自动生成结构化诊断报告

### 💰 透明报价 + 防被宰提醒
- 原厂件 / 品牌件 / 副厂件三种价格参考
- 揭露常见过度维修套路
- 标注可疑建议，帮车主避开修车陷阱

### 🚗 二手车车况快评
- 输入车辆信息 + 卖家描述，AI 评估车况
- 综合评分（0-100 分）+ 合理价格区间
- 分析卖家描述中的可疑点
- 该车型常见坑点提醒

### 📊 完整管理系统
- 车辆管理（CRUD）
- 诊断历史记录（搜索/回顾）
- 管理后台（数据概览/知识库管理/使用统计）
- 个人中心

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router + Turbopack) |
| 样式 | Tailwind CSS 4 + shadcn/ui (@base-ui/react) |
| 语言 | TypeScript 5 |
| LLM | DeepSeek API — 原生 Responses API（SSE 流式） |
| 数据存储 | PostgreSQL 16（自托管，Docker 卷持久化） |
| 认证 | JWT 会话（自研，httpOnly Cookie + bcrypt） |
| 图标 | Lucide React |
| Markdown | react-markdown + remark-gfm |
| 部署 | Docker（自购云服务器） |

## 📦 快速开始

### 环境要求
- Node.js 22（与 Docker 镜像一致；本地迁移脚本使用 `--env-file-if-exists`）
- npm / pnpm / yarn
- DeepSeek API Key（[申请地址](https://platform.deepseek.com/)）

### 安装运行

```bash
# 克隆项目
git clone <repo-url>
cd autodoc-agent

# 安装依赖
npm install

# 配置环境变量（Next.js 开发服务器与 Docker Compose 都会读取 .env）
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key、数据库连接与 JWT_SECRET

# 启动本地数据库（Docker Compose 的 db 服务）
docker compose up -d db

# 执行数据库迁移（db/migrations/ 下的 SQL 脚本）
npm run db:migrate

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 环境变量

创建 `.env` 文件：

```env
# DeepSeek LLM
DEEPSEEK_API_KEY=sk-你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
# Responses API 目前仅支持 deepseek-v4-flash
DEEPSEEK_MODEL=deepseek-v4-flash

# 数据库（本地开发连 localhost）
DATABASE_URL=postgres://autodoc:你的数据库密码@localhost:5432/autodoc
POSTGRES_USER=autodoc
POSTGRES_PASSWORD=你的数据库密码
POSTGRES_DB=autodoc

# 会话签名密钥（生产环境必须 ≥32 字符随机字符串；生成：openssl rand -base64 48）
JWT_SECRET=请设置一个足够长的随机字符串

# 生产环境默认要求 HTTPS 才下发会话 Cookie；Nginx 尚未上 TLS 的内网部署可显式设为 false
# COOKIE_SECURE=true

# 管理员邮箱白名单（逗号分隔），注册时自动授予 admin 角色
# ADMIN_EMAILS=admin@example.com

# 开发环境允许的来源（逗号分隔），如手机局域网访问
# NEXT_PUBLIC_DEV_ORIGINS=192.168.5.7
```

> 注意：`db/migrations/` 下的 SQL 脚本通过 `npm run db:migrate`（幂等）应用，
> 它们创建 `users`、`vehicles`、`diagnosis_sessions`、`diagnosis_messages`、
> `used_car_evaluations` 表与索引。

## 📁 项目结构

```
autodoc-agent/
├── Dockerfile / docker-compose.yml / Makefile / .dockerignore
├── .github/workflows/ci.yml      # CI：lint/tsc/build + Docker 冒烟
├── LICENSE / README.md / PROJECT_BRIEF.md / DEMO_SCRIPT.md
├── db/
│   └── migrations/               # 数据库迁移（0001 初始化 / 0002 用户角色）
├── scripts/
│   └── migrate.mjs               # 幂等迁移脚本（npm run db:migrate）
└── src/
    ├── app/                      # 页面路由
    │   ├── page.tsx / login / register / error / loading / not-found
    │   ├── diagnose/  vehicles/  history/  used-car/  profile/
    │   ├── admin/                # 管理后台（仅 admin 角色）
    │   └── api/                  # REST API（auth/vehicles/diagnose/used-car/profile/stats）
    ├── components/
    │   ├── ui/                   # shadcn/ui 基础组件
    │   ├── chat/  report/  vehicle/  layout/  home/
    │   └── auth/AuthProvider.tsx # 全局登录态
    ├── lib/
    │   ├── llm/                  # DeepSeek Responses API + prompts
    │   ├── knowledge/            # 故障知识图谱 + 症状匹配
    │   ├── session.ts / serverAuth.ts / auth.ts / password.ts  # 认证与会话
    │   ├── storage.ts / apiClient.ts                           # API 数据层
    │   ├── rateLimit.ts / sse.ts / db.ts
    │   └── reportParser.ts / usedCarParser.ts / utils.ts
    ├── hooks/  data/  types/     # hooks / 静态知识库 / 类型
    └── proxy.ts                  # 路由保护（登录 + admin 角色）
```

## 🧠 故障知识库

覆盖 **8 大汽车系统**，**42+ 故障类型**：

| 系统 | 条目数 | 示例 |
|------|--------|------|
| 发动机 | 20+ | 点火系统、燃油系统、冷却系统、涡轮增压... |
| 变速箱 | 4+ | 换挡顿挫、异响、漏油... |
| 底盘悬挂 | 3+ | 减震器、球头、摆臂... |
| 制动系统 | 4+ | 刹车异响、制动力不足... |
| 电气系统 | 4+ | 电瓶、发电机、灯光... |
| 空调系统 | 3+ | 制冷差、异味、噪音... |
| 车身 | 2+ | 车漆、密封条... |
| 转向系统 | 2+ | 方向助力、转向异响... |

每条故障包含：
- 多维度症状描述（含车主口语化表达）
- 可能原因（按概率排序）
- 建议检查项目
- 维修方案 + 三种配件价格
- 严重程度 + 能否继续行驶
- **防被宰提醒**

## 🎬 Demo 演示流程

1. **首页** — 展示产品定位和防被宰案例对比
2. **智能诊断** — 输入"冷启动发动机抖动"，体验多轮对话
3. **诊断报告** — 查看结构化报告（原因/价格/防被宰）
4. **车辆管理** — 添加"2020款大众朗逸"
5. **二手车评估** — 评估一辆二手本田思域
6. **管理后台** — 查看知识库和使用统计

### 预设演示数据

访问 `/admin/seed` 页面，一键导入预设的演示数据（3 辆车 + 4 个诊断会话 + 1 个二手车评估）。
（实际导入：4 辆车 + 6 个诊断会话，其中 4 条已完成 + 1 个二手车评估）

## 🚀 部署

### 本地运行

```bash
npm run build
npm start
```

### Docker 部署（自购云服务器）

**环境要求**：Docker 20.10+、Docker Compose 2.24+（使用 `env_file.required` 语法）

```bash
# 1. 上传代码到服务器（git clone 或 scp）

# 2. 配置环境变量（.env 已被 gitignore/.dockerignore 排除，不会进入镜像）
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key、数据库密码与 JWT_SECRET

# 3. 构建并启动（自动拉起 db 服务）
docker compose up -d --build

# 4. 执行数据库迁移（只需一次）
docker compose exec -T app node scripts/migrate.mjs

# 5. 验证
curl http://localhost:3000
docker compose ps        # STATUS 应为 healthy

# 常用命令
docker compose logs -f app   # 查看日志
docker compose restart app   # 重启
docker compose down          # 停止并删除容器
```

**HTTPS（必需）**：生产环境 `NODE_ENV=production` 时会话 Cookie 默认带 `Secure` 标记，
纯 HTTP 下浏览器不会保存登录态。请用 certbot 申请证书并让 80 端口 301 跳转 443：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;   # 保持 SSE 流式输出
    }
}
```

> 提示：智能问诊使用 SSE 流式响应，Nginx 反代务必保留 `proxy_buffering off`，否则打字机效果会被缓冲。

**数据备份**：

```bash
# 一键备份（输出到 backups/ 目录，建议配合 crontab 定期执行）
make backup

# 恢复最近一次备份
make restore
```

> 认证、LLM 等接口已内置基础限流（进程内固定窗口）。单实例部署无需额外配置；
> 若未来横向扩容到多实例，请把限流迁移到 Redis 等共享存储。

**管理后台**：`/admin` 仅 `admin` 角色可访问。把管理员邮箱加入 `.env` 的
`ADMIN_EMAILS`（逗号分隔）后注册，即自动获得管理员身份。

## 📋 开发路线

- [x] **Phase 1** — 核心可运行（项目初始化 + 知识图谱 + 对话引擎 + UI）
- [x] **Phase 2** — 产品完整度（用户系统 + 车辆管理 + 报告页 + 历史）
- [x] **Phase 3** — 比赛加分（二手车评估 + 管理后台 + 首页优化）
- [x] **Phase 4** — 打磨（预设数据 + UI 优化 + 部署配置）
- [x] **Phase 5** — 自托管数据库 + 用户认证（邮箱/用户名登录）+ 多模型支持
- [x] **Phase 6** — 全自托管改造（PostgreSQL + JWT 会话，移除 Supabase）
- [ ] **Phase 7**（规划中） — 向量化知识检索 + 诊断报告 JSON 结构化输出

## ⚠️ 免责声明

本工具提供的所有诊断结果、维修方案和价格信息仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。价格数据来源于公开渠道，实际价格因地区和渠道而异。

## 📄 License

MIT License

---

**AutoDoc 智驾医生** — 修车前，先问 AI，让每一分钱都花在刀刃上。
