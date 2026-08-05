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
| 数据存储 | Supabase (PostgreSQL + Auth + RLS) |
| 图标 | Lucide React |
| Markdown | react-markdown + remark-gfm |
| 部署 | Docker（自购云服务器） |

## 📦 快速开始

### 环境要求
- Node.js 18+
- npm / pnpm / yarn
- DeepSeek API Key（[申请地址](https://platform.deepseek.com/)）

### 安装运行

```bash
# 克隆项目
git clone <repo-url>
cd autodoc-agent

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DeepSeek API Key 和 Supabase 配置

# 初始化 Supabase（登录、车辆、诊断记录等数据存储）
# 1. 在 https://supabase.com 创建项目
# 2. 在 SQL Editor 中依次执行 supabase/migrations/ 下的 SQL 脚本
# 3. 把项目的 URL / anon key / service role key 填入 .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 环境变量

创建 `.env.local` 文件：

```env
# DeepSeek LLM
DEEPSEEK_API_KEY=sk-你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
# Responses API 目前仅支持 deepseek-v4-flash
DEEPSEEK_MODEL=deepseek-v4-flash

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
SUPABASE_SERVICE_ROLE_KEY=你的service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 注意：`supabase/migrations/` 目录下的 SQL 脚本必须全部执行（它们创建了
> `profiles`、`vehicles`、`diagnosis_sessions`、`diagnosis_messages`、
> `used_car_evaluations` 表、RLS 策略和用户名登录所需的 RPC）。

## 📁 项目结构

```
src/
├── app/                          # 页面路由
│   ├── page.tsx                  # 首页
│   ├── diagnose/                 # 智能问诊
│   │   ├── page.tsx              # 对话页
│   │   └── [id]/page.tsx         # 诊断报告详情
│   ├── used-car/                 # 二手车评估
│   │   ├── page.tsx              # 评估表单
│   │   └── [id]/page.tsx         # 评估报告详情
│   ├── vehicles/                 # 车辆管理
│   ├── history/                  # 诊断历史
│   ├── profile/                  # 个人中心
│   ├── admin/                    # 管理后台
│   │   ├── page.tsx              # 数据概览
│   │   ├── knowledge/page.tsx    # 知识库管理
│   │   ├── stats/page.tsx        # 使用统计
│   │   └── seed/page.tsx         # 预设演示数据
│   └── api/                      # API 路由
│       ├── diagnose/             # 诊断 API (SSE)
│       └── used-car/             # 评估 API (SSE)
├── components/
│   ├── ui/                       # shadcn/ui 基础组件
│   ├── chat/                     # 对话组件
│   ├── report/                   # 报告展示组件
│   ├── vehicle/                  # 车辆组件
│   └── layout/                   # 布局组件
├── lib/
│   ├── llm/                      # LLM 调用封装
│   ├── knowledge/                # 知识图谱引擎
│   ├── storage.ts                # 本地存储层
│   ├── reportParser.ts           # 报告解析器
│   └── usedCarParser.ts          # 评估报告解析器
├── data/
│   ├── faults/                   # 故障知识图谱 (8 个系统)
│   │   ├── engine.json           # 发动机 (20条)
│   │   ├── transmission.json     # 变速箱
│   │   ├── chassis.json          # 底盘悬挂
│   │   ├── braking.json          # 制动系统
│   │   ├── electrical.json       # 电气系统
│   │   ├── hvac.json             # 空调系统
│   │   ├── body.json             # 车身
│   │   └── steering.json         # 转向系统
│   └── vehicles.json             # Top 20 车型数据
└── types/                        # TypeScript 类型
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

## 🚀 部署

### 本地运行

```bash
npm run build
npm start
```

### Docker 部署（自购云服务器）

**环境要求**：Docker 20.10+、Docker Compose 2.x

```bash
# 1. 上传代码到服务器（git clone 或 scp）

# 2. 配置环境变量（.env 已被 gitignore/.dockerignore 排除，不会进入镜像）
cp .env.example .env
# 编辑 .env，填入 DeepSeek 与 Supabase 真实值
# 注意：NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
# 会在构建期内联进客户端代码，生产构建前务必先写入 .env 再执行第 3 步

# 3. 构建并启动
docker compose up -d --build

# 4. 验证
curl http://localhost:3000
docker compose ps        # STATUS 应为 healthy

# 常用命令
docker compose logs -f app   # 查看日志
docker compose restart app   # 重启
docker compose down          # 停止并删除容器
```

**Nginx 反向代理示例**（80/443，配合域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## 📋 开发路线

- [x] **Phase 1** — 核心可运行（项目初始化 + 知识图谱 + 对话引擎 + UI）
- [x] **Phase 2** — 产品完整度（用户系统 + 车辆管理 + 报告页 + 历史）
- [x] **Phase 3** — 比赛加分（二手车评估 + 管理后台 + 首页优化）
- [x] **Phase 4** — 打磨（预设数据 + UI 优化 + 部署配置）
- [x] **Phase 5** — Supabase 数据库迁移 + 用户认证（邮箱/用户名登录）+ 多模型支持
- [ ] **Phase 6**（规划中） — 向量化知识检索 + 诊断报告 JSON 结构化输出

## ⚠️ 免责声明

本工具提供的所有诊断结果、维修方案和价格信息仅供参考，不构成专业维修建议。具体故障原因和维修方案请咨询专业维修技师。价格数据来源于公开渠道，实际价格因地区和渠道而异。

## 📄 License

MIT License

---

**AutoDoc 智驾医生** — 修车前，先问 AI，让每一分钱都花在刀刃上。
