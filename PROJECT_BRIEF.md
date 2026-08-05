# AutoDoc Agent — 车主自助预诊断智能体

## 一、项目概述

### 定位
面向车主的AI自助预诊断工具。车主在去修车前，通过多轮对话描述车辆症状，Agent给出：
- 可能故障原因（按概率排序）
- 建议检查项目
- 维修方案 + 合理价格区间
- 防被宰提醒

### 比赛背景
- 赛事："经开智造"AI智能体大赛（武汉经开区）
- 赛道：场景落地类
- 报名截止：2026年5月31日
- 核心评审：场景价值30% + 产品完成度25% + 创新示范20% + 推广商业15% + 传播影响10%

### 目标用户
- 3亿中国车主（主要），不懂车，怕被宰
- 二手车买家（次要），需要车况评估

---

## 二、技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 前端 | Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui | 快速出活，组件丰富，部署方便 |
| 后端 | Next.js API Routes (全栈一体) | 减少架构复杂度 |
| LLM | DeepSeek API — 原生 Responses API（主） + 支持切换其他模型 | 性价比高，中文能力强 |
| 数据库 | PostgreSQL 16（自托管）+ JWT 会话认证 | 全栈 Docker 部署，数据自主可控 |
| 知识库 | JSON/TypeScript 结构化数据 | 故障知识图谱用树形JSON存储 |
| 部署 | Docker（自购云服务器） | 全栈容器化，独立可控 |

---

## 三、核心功能模块

### 模块1：智能问诊引擎（核心）

**功能描述：** 用户输入车辆症状描述，Agent通过多轮对话追问关键信息，最终输出诊断报告。

**对话流程：**
```
用户输入症状（如"我的车启动时有异响"）
    ↓
Agent 提取关键信息：
  - 车型（品牌/车系/年款/排量）
  - 症状描述
  - 发生条件（冷车/热车/高速/低速/怠速...）
  - 持续时间
  - 是否有其他伴随症状
    ↓
Agent 追问缺失信息（最多3轮）
    ↓
Agent 查询故障知识图谱
    ↓
输出诊断报告
```

**诊断报告内容：**
1. 车辆信息摘要
2. 可能原因列表（按概率排序，每条包含）：
   - 故障名称
   - 可能性评级（高/中/低）
   - 症状匹配说明
   - 建议检查项目
   - 维修方案
   - 配件+工时价格区间（原厂件/副厂件）
   - 严重程度 & 是否可继续行驶
3. ⚠️ 防被宰提醒（常见过度维修套路）
4. 建议下一步行动

**技术要求：**
- 使用 System Prompt 定义Agent角色为"资深汽车诊断技师"
- 实现多轮对话状态管理（Context Window）
- 故障知识图谱作为 RAG 知识源注入
- 对话历史持久化到数据库
- 流式输出（打字机效果）

### 模块2：故障知识图谱

**数据结构设计：**

```typescript
// 知识图谱核心结构
interface FaultKnowledge {
  id: string;                    // 唯一标识
  category: string;              // 大类：发动机/变速箱/底盘/电气/车身
  subcategory: string;           // 子类：点火系统/燃油系统/冷却系统...
  
  symptoms: SymptomEntry[];      // 症状描述（多维度匹配）
  possibleCauses: CauseEntry[];  // 可能原因列表
  
  relatedFaultCodes: string[];   // 关联OBD故障码
  commonInModels: string[];      // 高发车型
  tsbReferences: string[];       // 技术服务通报编号
}

interface SymptomEntry {
  description: string;           // 症状描述（自然语言）
  keywords: string[];            // 关键词（用于匹配）
  conditions: string[];          // 发生条件
  severity: 'critical' | 'warning' | 'info';
}

interface CauseEntry {
  name: string;                  // 故障名称
  probability: number;           // 0-1 概率权重
  explanation: string;           // 为什么这个症状指向这个原因
  checkItems: string[];          // 建议检查项目
  repairMethod: string;          // 维修方案
  parts: PartPrice[];            // 配件价格
  laborHours: number;            // 标准工时
  severity: 'critical' | 'moderate' | 'minor';
  canDrive: boolean;             // 是否可继续行驶
  overchargeWarnings: string[];  // 防被宰提醒
}

interface PartPrice {
  name: string;                  // 配件名称
  oemPrice: number;              // 原厂件价格
  aftermarketPrice: number;      // 副厂件价格
  brandPrice: number;            // 品牌件价格
}
```

**数据量目标（MVP）：**
- 覆盖 **8大系统**：发动机、变速箱、底盘悬挂、制动、电气、空调、车身、转向
- 每个系统 **15-20个常见故障**
- 总计 **120-160个故障条目**
- 每条故障包含 **3-5个症状描述**（含口语化表达）
- 覆盖 **Top 20 热门车型** 的特有故障

**数据来源：**
1. OBD-II 标准故障码库（GitHub开源项目）
2. 汽车维修手册公开内容
3. 汽车之家/懂车帝论坛高频故障帖整理
4. 《汽车维修工时定额标准》

### 模块3：车型数据库

**数据内容：**
```typescript
interface VehicleModel {
  brand: string;          // 品牌：大众、丰田、比亚迪...
  series: string;         // 车系：朗逸、卡罗拉、秦PLUS...
  yearRange: string;      // 年款范围
  engine: string;         // 发动机型号
  transmission: string;   // 变速箱类型
  knownIssues: string[];  // 该车型已知通病（关联FaultKnowledge.id）
  maintenanceSchedule: MaintenanceItem[]; // 保养周期
}
```

**数据量目标：** Top 20 热门车型（朗逸、轩逸、卡罗拉、速腾、雅阁、凯美瑞、哈弗H6、比亚迪秦/宋/汉、Model 3/Y等）

### 模块4：二手车车况快评（加分功能）

**功能描述：** 输入车辆基本信息 + 卖家描述，Agent输出车况评估报告。

**报告内容：**
- 车况评分（0-100）
- 该车型常见坑点
- 建议重点检查项
- 合理价格区间（基于车龄/里程/市场行情）
- ⚠️ 卖家描述中的可疑点

### 模块5：用户系统

- 手机号/微信登录（MVP阶段可简化为邮箱登录）
- 车辆管理（添加/编辑/删除"我的车"）
- 诊断历史（查看过往所有诊断报告）
- 个人偏好设置

### 模块6：管理后台（轻量）

- 知识库管理（增删改查故障条目）
- 诊断数据统计（日活、诊断次数、热门故障排行）
- 用户反馈管理

---

## 四、页面结构

### 前台页面

| 页面 | 路径 | 内容 |
|------|------|------|
| 首页 | `/` | 产品介绍 + 快速开始诊断入口 |
| 智能问诊 | `/diagnose` | 核心对话界面（类ChatGPT风格） |
| 诊断报告 | `/diagnose/[id]` | 单次诊断结果详情页 |
| 我的车辆 | `/vehicles` | 车辆管理列表 |
| 添加车辆 | `/vehicles/add` | 车型选择 + 信息录入 |
| 诊断历史 | `/history` | 历史记录列表 + 搜索 |
| 二手车评估 | `/used-car` | 二手车车况快评入口 |
| 评估报告 | `/used-car/[id]` | 评估结果详情 |
| 个人中心 | `/profile` | 用户信息 + 设置 |

### 后台页面

| 页面 | 路径 | 内容 |
|------|------|------|
| 后台首页 | `/admin` | 数据概览Dashboard |
| 知识库管理 | `/admin/knowledge` | 故障条目CRUD |
| 诊断统计 | `/admin/stats` | 使用数据统计图表 |

### UI设计要求

- **主色调：** 深蓝(#1e3a5f) + 白色，科技感+专业感
- **强调色：** 橙色(#f97316) 用于CTA按钮和警告提示
- **风格：** 简洁现代，卡片式布局，响应式适配移动端
- **对话界面：** 参考ChatGPT/Claude的对话UI，支持Markdown渲染
- **Logo：** 汽车+AI元素，文字"AutoDoc智驾医生"

---

## 五、数据与知识构建要求

### 初始数据构建方式

1. **OBD故障码库** — 从GitHub开源项目导入，转为项目格式
   - 搜索: `github OBD2 fault codes JSON`
   
2. **故障知识图谱** — 用LLM辅助构建：
   - 给Claude/GPT一份模板，让它根据汽车维修知识生成结构化JSON
   - 人工审核 + 补充价格数据
   
3. **车型数据** — 结构化整理Top 20车型参数
   - 优先覆盖：大众、丰田、本田、日产、比亚迪、特斯拉

4. **价格数据** — 参考汽配平台公开价格，取区间值
   - 标注：价格仅供参考，实际价格因地区和渠道而异

### 知识图谱构建Prompt模板

```
你是一位资深汽车维修技师。请为以下故障生成结构化诊断知识：

故障类别：{category}
故障名称：{fault_name}

请输出JSON格式，包含：
- symptoms: 3-5个不同角度的症状描述（包括车主口语化表达）
- possibleCauses: 可能原因，按概率从高到低
- 每个原因包含：检查项、维修方案、配件价格区间、工时、严重程度
- overchargeWarnings: 针对该故障的常见过度维修套路

参考格式：{schema}
```

---

## 六、项目目录结构

```
autodoc-agent/
├── README.md / PROJECT_BRIEF.md / DEMO_SCRIPT.md
├── package.json / next.config.ts / tsconfig.json / eslint.config.mjs
├── Dockerfile / docker-compose.yml / Makefile / .github/workflows/ci.yml
├── public/                       # 静态资源
├── db/
│   └── migrations/               # 自托管数据库迁移（0001 初始化 + 0002 用户角色）
│       ├── 0001_init.sql
│       └── 0002_add_user_roles.sql
├── scripts/
│   └── migrate.mjs               # 幂等迁移脚本（npm run db:migrate）
├── src/
│   ├── app/
│   │   ├── layout.tsx / page.tsx / login / register / error / loading / not-found
│   │   ├── diagnose/             # 智能问诊（对话页 + 报告页）
│   │   ├── vehicles/             # 车辆管理（列表 / 添加 / 编辑）
│   │   ├── history/              # 诊断历史
│   │   ├── used-car/             # 二手车评估（表单 + 报告页）
│   │   ├── profile/              # 个人中心
│   │   ├── admin/                # 管理后台（仅 admin 角色）
│   │   │   ├── page.tsx / knowledge / stats / seed
│   │   └── api/                  # 全部 REST API（auth / vehicles / diagnose / used-car / profile / stats）
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── chat/ / report/ / vehicle/ / layout/ / home/
│   │   └── auth/AuthProvider.tsx # 全局登录态
│   ├── lib/
│   │   ├── llm/                  # deepseek.ts（Responses API + SSE）+ prompts.ts
│   │   ├── knowledge/            # 知识图谱 graph.ts + 症状匹配 matcher.ts
│   │   ├── session.ts            # JWT 会话（jose，edge 安全）
│   │   ├── serverAuth.ts / auth.ts / password.ts / db.ts
│   │   ├── storage.ts / apiClient.ts / reportParser.ts / usedCarParser.ts
│   │   ├── rateLimit.ts          # 进程内限流
│   │   └── sse.ts                # SSE 响应封装
│   ├── data/                     # 静态知识库（faults/ 8 大系统 + vehicles.json）
│   ├── types/                    # TypeScript 类型
│   └── proxy.ts                  # 路由保护（登录 + admin 角色校验）
└── .env.example                  # 环境变量模板（不含真实密钥）
```

---

## 七、数据库Schema（自托管 PostgreSQL）

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,       -- bcrypt
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- admin / user（0002 迁移）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户车辆表
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  series TEXT NOT NULL,
  year TEXT,
  engine TEXT,
  transmission TEXT,
  mileage NUMERIC DEFAULT 0,
  license_plate TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 诊断会话表
CREATE TABLE diagnosis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress / completed
  initial_symptom TEXT,
  report JSONB,                    -- 最终诊断报告
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 对话消息表
CREATE TABLE diagnosis_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                -- user / assistant / system
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 二手车评估表
CREATE TABLE used_car_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  report_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

迁移由 `db/migrations/*.sql` + `scripts/migrate.mjs` 幂等应用（`schema_migrations` 记录已执行项）。

---

## 八、API接口设计

### 对话诊断

```
POST /api/diagnose/start
Body: { vehicleId?, symptom: string }
Response: { sessionId, message: AssistantMessage }

POST /api/diagnose/chat
Body: { sessionId, message: string }
Response: { message: AssistantMessage, report?: DiagnosisReport }
// 流式输出使用 SSE

GET /api/diagnose/[sessionId]
Response: { session, messages[], report? }
```

### 车辆管理

```
GET /api/vehicles
POST /api/vehicles
PUT /api/vehicles/[id]
DELETE /api/vehicles/[id]
```

### 诊断历史

```
GET /api/history?page=1&limit=20
GET /api/history/[sessionId]
```

### 二手车评估

```
POST /api/used-car/evaluate
Body: { brand, series, year, mileage, price, description, images? }
Response: { report: UsedCarReport }
```

---

## 九、比赛Demo要求

### 必须能演示的场景（按优先级）

1. **核心问诊流程** — 输入"我的车冷启动时发动机抖动"，完整走完多轮对话→出报告
2. **车辆管理** — 添加一辆"2020款大众朗逸1.5L"，然后基于这辆车做诊断
3. **诊断历史** — 展示已完成的诊断记录列表
4. **二手车评估** — 输入一辆二手车信息，输出评估报告
5. **防被宰提醒** — 报告中要有醒目的价格对比和套路提醒

### 预设演示数据
- 预置3-5个典型故障的完整对话记录（避免现场翻车）
- 预置2-3辆常见车型
- 预置诊断历史数据

### 演示脚本要点
- 开场讲痛点："上个月我朋友修车，4S店说要换变速箱，花了8000。后来发现只是一个传感器，200块的事。"
- 展示产品如何解决信息不对称
- 用预设数据流畅演示
- 强调数据全部来自公开渠道，零合作依赖
- 收尾讲商业模式和落地路径

---

## 十、开发优先级与时间规划

### Phase 1 — 核心可运行（Day 1-2）
1. 项目初始化（Next.js + Tailwind + shadcn/ui）
2. 故障知识图谱数据构建（先用30个核心故障条目）
3. 对话问诊引擎（LLM调用 + 多轮对话 + 知识图谱查询）
4. 基础对话UI

### Phase 2 — 产品完整度（Day 3-4）
5. 用户系统（简化版）
6. 车辆管理
7. 诊断报告页面（格式化展示）
8. 诊断历史

### Phase 3 — 比赛加分（Day 5-6）
9. 二手车评估功能
10. 防被宰提醒优化
11. 管理后台
12. 首页 + 产品介绍

### Phase 4 — 打磨（Day 7）
13. 预设演示数据
14. UI细节优化
15. 部署到云服务器（Docker）
16. 准备演示脚本

---

## 十一、环境变量

```env
# LLM
DEEPSEEK_API_KEY=sk-你的DeepSeek密钥（请勿提交真实 Key）
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

# 数据库（自托管 PostgreSQL）
DATABASE_URL=postgres://autodoc:你的数据库密码@localhost:5432/autodoc
POSTGRES_USER=autodoc
POSTGRES_PASSWORD=你的数据库密码
POSTGRES_DB=autodoc

# 会话签名密钥（生产环境必须 ≥32 字符随机字符串，openssl rand -base64 48）
JWT_SECRET=请设置一个足够长的随机字符串

# 可选
# COOKIE_SECURE=true            # 显式控制会话 Cookie 的 Secure 标记
# ADMIN_EMAILS=admin@example.com # 管理员邮箱白名单（逗号分隔）
# NEXT_PUBLIC_DEV_ORIGINS=      # 开发环境允许的来源（逗号分隔）
```

---

## 十二、注意事项

1. **所有数据标注"仅供参考"** — 价格、诊断结果均需声明不构成专业建议
2. **免责声明** — 产品页和报告页都要有"本工具仅提供参考，具体维修请咨询专业技师"
3. **中文优先** — 界面、代码注释、commit message全部用中文
4. **移动端适配** — 评委可能用手机扫码看Demo，移动端体验不能差
5. **加载速度** — 知识图谱数据做懒加载，首屏不要卡
6. **错误处理** — LLM调用超时/失败要有友好的错误提示
