# NextBar — Spa Service Log App

**Lake Spa 按摩师电子工作日志系统**

一个面向按摩师的极简工作记录工具。治疗师只需选择服务，系统自动计算价格、时长、结束时间，并管理收款记录。

---

## 项目定位

> **治疗师只需告诉系统做了什么服务，系统自动记录、计算和保存一切。**

NextBar 不是一个数据录入系统，而是一个**按摩师工作流程助手**。目标是让治疗师在 **5 秒内** 完成一次服务记录。

---

## 当前状态（MVP）

### ✅ 已完成的核心功能

#### 服务选择
- **按摩分类导航**：Quick Relief → Full Body → Foot Care，三级层级选择
- **Quick Relief 一键添加**：单时长服务（Back Massage 30min $50、Neck+Back 30min $60）点击即添加，无需选择时长
- **多时长服务**：Swedish、Deep Tissue 等服务先选项目再选时长
- **美容 / 油 / 附加服务 标签页**：扁平按钮，点击即添加
- **附加服务（Add-ons）**：Back Gua Sha +$40/+30min、Cupping +$20/+10min 等，显示价格和附加时长
- **+ Custom 自定义**：所有标签页均支持自定义，仅需输入价格和时长

#### 本工记录
- **可编辑 Chips**：每个服务独立 chip，点击 × 移除，点击 chip 本体可编辑
- **自动计算服务合计**：所有服务价格自动累加
- **自动计算总时长**：基础服务时长 + 所有附加服务时长
- **自动计算结束时间**：开始时间 + 总时长（可选提前5分钟）
- **开始时间可点击编辑**：紧凑内联时间编辑器

#### 收款（Ledger 模型）
- **原子化支付条目**：每笔交易独立记录，不捆绑 service + tip
- **三种类型**：服务费 / 小费 / 退款
- **三种方式**：现金 / 刷卡 / 礼品卡
- **礼品卡支持**：输入卡号 + 拍照上传照片
- **混合支付**：支持多笔支付，部分现金 + 部分刷卡 + 部分礼品卡
- **自动计算待付金额**：`remainingBalance = serviceTotal - serviceCollected + refunds`
- **退款支持**：预付后退款场景

#### 日报表
- **状态徽章**：每行显示 ● In Service / ● Unpaid / ● $X Due / ● Paid
- **合计行**：现金、刷卡、礼品卡汇总
- **日汇总**：工数、总时长、现金收入、刷卡服务费、刷卡小费

#### 通用功能
- **自动保存**：每次操作后自动保存，显示"保存中…"/"已自动保存"
- **撤销**：支持撤销最近 20 步操作
- **单品编辑**：点击 chip → 自动切换到对应标签页 → 点击新按钮替换
- **编辑已有记录**：点击表格行 → 恢复所有 chips/时间/付款 → 完成修改或取消

### 🏗 待完善

- **数据库持久化**：当前使用本地 React 状态，刷新页面丢失
- **真实 OCR**：当前使用 Mock OCR，需要手动输入识别文字
- **真实认证系统**：当前使用简单身份选择
- **PWA / 离线模式**：尚未支持
- **打印功能**：需要对接打印机
- **Owner 后台服务管理**：已有页面框架，需要完善

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | Next.js | 16.2.11 | App Router + Turbopack |
| **UI** | React | 19.2.4 | 函数组件 + Hooks |
| **语言** | TypeScript | ^5 | 严格模式 |
| **样式** | Tailwind CSS | v4 | PostCSS 插件模式 |
| **组件库** | Radix UI | — | 无样式 headless 组件 |
| **图标** | Lucide React | ^1.26 | 图标库 |
| **ORM** | Prisma | 7.9.0 | 数据库客户端 |
| **数据库** | SQLite | — | 本地开发（better-sqlite3） |
| **测试** | Vitest | ^4.1 | 单元测试 |
| **代码检查** | ESLint | ^9 | eslint-config-next |

### 核心依赖

```json
{
  "next": "16.2.11",
  "react": "19.2.4",
  "prisma": "^7.9.0",
  "tailwindcss": "^4"
}
```

---

## 项目结构

```
work-log/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   ├── seed.ts                # 种子数据
│   └── migrations/            # 数据库迁移
├── src/
│   ├── app/
│   │   ├── page.tsx           # 🔥 主页面 — 治疗师工作日志
│   │   ├── layout.tsx         # 根布局（中文语言）
│   │   ├── globals.css        # 全局样式
│   │   ├── api/               # API 路由（15+ 端点）
│   │   ├── therapist/         # 旧版治疗师页面
│   │   ├── owner/             # 老板后台
│   │   ├── frontdesk/         # 前台页面
│   │   └── ...                # review, print, today 等
│   ├── components/
│   │   ├── CurrentEntry.tsx   # 🔥 本工记录卡片（chips + 时间行）
│   │   ├── DailyLogTable.tsx  # 🔥 日报表 + 状态徽章
│   │   ├── ServiceInput.tsx   # 🔥 服务选择器（4 标签页）
│   │   ├── PaymentSection.tsx # 🔥 收款面板（Ledger 模型）
│   │   ├── NumericKeypad.tsx  # 数字键盘（已弃用，保留引用）
│   │   ├── TimeEntry.tsx      # 时间选择（已弃用，保留引用）
│   │   ├── ui/               # shadcn UI 组件
│   │   └── canvas/           # 手写画布组件
│   ├── hooks/
│   │   ├── useWorkLog.ts     # 🔥 核心状态管理 hook
│   │   ├── use-session.ts    # 会话管理
│   │   └── use-auto-save.ts  # 自动保存
│   ├── lib/
│   │   ├── service-library.ts # 🔥 服务定义中心（31+ 个服务）
│   │   ├── time.ts           # 时间工具函数
│   │   ├── parser.ts         # 记账解析器
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── utils.ts          # 通用工具
│   ├── types/
│   │   └── index.ts          # 核心类型定义
│   └── services/
│       ├── ocr/              # OCR 服务
│       └── print/            # 打印服务
└── package.json
```

> 🔥 = 当前活跃的核心文件

---

## 核心数据模型

```typescript
// 服务项目
interface EntryItem {
  id: string;
  type: "massage" | "facial" | "oil" | "project";
  label: string;       // 显示名称，如 "Deep Tissue 60"
  shorthand: string;   // 记账简写，如 "80按"
  amount: number;      // 价格
  durationMinutes: number; // 时长（分钟）
}

// 支付条目（Ledger 原子化模型）
interface PaymentEntry {
  id: string;
  type: "service" | "tip" | "refund";
  method: "cash" | "card" | "giftcard";
  amount: number;
  recordedAt: string;        // 记录时间
  cardTime?: string;         // 刷卡时间（仅 card）
  giftCardNumber?: string;   // 礼品卡号（仅 giftcard）
  giftCardImage?: string;    // 礼品卡照片 base64
  note?: string;
}

// 工作记录
interface WorkEntry {
  id: string;
  therapistId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  finishEarlyFiveMinutes: boolean;
  calculatedEndTime: string;
  items: EntryItem[];
  originalLog: string;           // 自动生成的原始记账
  serviceTotal: number;          // 自动计算的服务合计
  paymentEntries: PaymentEntry[];
  paymentStatus: PaymentStatus;
  status: "draft" | "completed";
  updatedAt: string;
}
```

### 计算规则

```
serviceTotal = sum(items.amount)
totalDuration = sum(items.durationMinutes)
endTime = startTime + totalDuration - (finishEarly5 ? 5 : 0)

serviceCollected = sum(paymentEntries where type="service")
totalTips = sum(paymentEntries where type="tip")
totalRefunds = sum(paymentEntries where type="refund")
remainingBalance = serviceTotal - serviceCollected + totalRefunds
```

---

## 服务定义中心

所有服务数据集中在 `src/lib/service-library.ts`，包括：

| 分类 | 数量 | 示例 |
|------|------|------|
| **按摩 — Quick Relief** | 2 | Back Massage 30min $50, Neck+Back 30min $60 |
| **按摩 — Full Body** | 5 | Swedish 60/90, Deep Tissue 60/90, Pain Relief 60/90, Lymphatic 60/90, Prenatal 60/90 |
| **按摩 — Foot Care** | 3 | Foot+Back 60/90, Foot Soak 30/60, Foot Reflexology 30/60 |
| **美容** | 3 | Essential Glow $35, Hydra Renew $75, Radiance Luxe $115 |
| **油** | 3 | Oil +5/+10, CBD +20 |
| **附加服务** | 6 | Back Gua Sha +$40/+30min, Cupping +$20/+10min, Lymphatic +$20/+10min, Thai Stretch +$15/+10min, Scalp Gua Sha +$10/+10min, Extra 30min +$40/+30min |

Owner 修改 `service-library.ts` 中的价格 → 前端自动更新。

---

## 安装与运行

```bash
# 进入项目目录
cd work-log

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 启动开发服务器
npm run dev
```

打开 **http://localhost:3000** 即可使用。

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Turbopack） |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm test` | 运行单元测试 |
| `npm run test:watch` | 测试监听模式 |
| `npm run db:studio` | Prisma Studio 数据库管理 |

---

## 交互流程

### 新增服务记录

```
1. 点击 "新增一工"
   → 自动捕获当前时间作为开始时间

2. 选择服务标签页：
   按摩 → 选择类别 → 选择服务 → 选择时长（或单时长自动添加）
   美容 → 点击服务按钮
   油 → 点击服务按钮
   Add-ons → 点击附加服务按钮（显示价格和附加时长）

3. 可继续添加附加服务
   → 每次添加自动更新合计、总时长、结束时间

4. 点击 "收款"
   → 选择类型（服务费/小费/退款）
   → 选择方式（现金/刷卡/礼品卡）
   → 输入金额（自动预填剩余待付）
   → 刷卡需填写刷卡时间
   → 礼品卡可输入卡号 + 拍照上传
   → 点击 "添加"

5. 点击 "完成本工"
   → 记录保存到左侧日报表
```

### 编辑已有记录

```
1. 点击表格行中的 "编辑"
   → 恢复所有 chips、时间、付款记录

2. 修改任何项目：
   → 点击 chip × 移除单项
   → 点击 chip 本体切换到对应标签页编辑
   → 添加新服务或附加服务

3. 点击 "完成修改" 或 "取消"
```

---

## 真实场景支持

| 场景 | 支持方式 |
|------|----------|
| 现金服务 + 刷卡小费 | 2 笔独立 PaymentEntry |
| 刷卡服务 + 现金小费 | 2 笔独立 PaymentEntry |
| 全部现金/刷卡 | 1 笔 service + 1 笔 tip |
| 预付后加服务付差额 | remainingBalance 自动计算 |
| 混合支付（现金+刷卡+礼品卡） | 多笔 PaymentEntry |
| 预付后退款 | type: "refund" |
| 部分付款 | partial 状态 + 显示待付金额 |
| 多次付款事件 | 任意数量 PaymentEntry |
| 一次性付清 | 1 笔 service + 1 笔 tip（可选） |

---

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | **主页面** | 🔥 治疗师工作日志（当前活跃） |
| `/therapist` | 旧版治疗师页面 | 手写画布版本 |
| `/owner` | 老板后台 | 数据统计 |
| `/owner/codes` | 项目管理 | 服务缩写管理 |
| `/frontdesk` | 前台页面 | — |
| `/review` | OCR 审核 | 识别结果核对 |
| `/today` | 今日概览 | — |
| `/print` | 打印管理 | — |

---

## API 路由

| 路径 | 说明 |
|------|------|
| `GET /api/worksheets` | 获取工作表 |
| `POST /api/worksheets` | 创建工作表 |
| `GET /api/entries` | 获取服务条目 |
| `POST /api/entries` | 创建服务条目 |
| `GET /api/codes` | 获取服务代码 |
| `POST /api/codes` | 创建服务代码 |
| `GET /api/auth/session` | 获取会话 |
| `POST /api/auth/login` | 登录 |
| `GET /api/owner/stats` | 老板统计数据 |
| `GET /api/export` | 导出 CSV |
| `POST /api/ocr` | OCR 识别 |
| `POST /api/print/generate` | 生成打印任务 |

---

## 设计原则

1. **治疗师只做选择，系统自动计算** — 价格、时长、结束时间均由系统自动推导
2. **Ledger 支付模型** — 每笔交易原子化，独立记录，不捆绑 service+tip
3. **Chips 交互** — 每个服务是独立 chip，可单品编辑/删除，无需整行删除
4. **自动保存 + 撤销** — 所有操作自动保存，支持撤销最近 20 步
5. **Apple 风格 UI** — 白色/浅灰背景、细边框、微圆角、柔和系统色
6. **渐进式披露** — 收款面板默认折叠，点击"收款"展开
7. **字典映射** — 服务价格和时长从 service-library 读取，非硬编码

---

## 贡献指南

1. 从 `feat/massage-guide-prints` 分支创建功能分支
2. 保持 TypeScript 严格模式
3. 运行 `npm run lint` 和 `npm run build` 确保无错误
4. 提交 PR 到 `feat/massage-guide-prints` 分支

---

## License

Private — Lake Spa Internal Use Only