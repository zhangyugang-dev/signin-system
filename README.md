# 会务签到系统

一个基于 Next.js 的最小化会议签到系统，支持单场活动的签到管理。

## 功能

- **活动配置**：管理员可设置活动名称和时间
- **CSV 导入**：批量导入参会人名单（姓名 + 手机号）
- **签到页面**：参会人输入姓名 + 手机号后四位完成签到
- **签到统计**：实时显示已签到 / 未签到人数
- **数据导出**：导出签到结果为 CSV 文件

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + TypeScript
- **样式**：Tailwind CSS 4
- **数据库**：SQLite + Prisma 7
- **部署**：Vercel / 任意 Node.js 服务器

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npx prisma migrate dev
```

这会在 `prisma/` 目录下创建 SQLite 数据库文件 `dev.db`。

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问：

- **签到页面**：[http://localhost:3000](http://localhost:3000)
- **管理后台**：[http://localhost:3000/admin](http://localhost:3000/admin)

## 使用说明

### 管理后台 (`/admin`)

1. **配置活动**：填写活动名称和时间，点击"保存配置"
2. **导入名单**：准备 CSV 文件（格式：`姓名,手机号`，第一行为表头），上传即可
3. **查看统计**：页面顶部显示总人数、已签到、未签到统计
4. **导出结果**：点击"导出 CSV"下载签到结果
5. **管理名单**：可逐个删除或一键清空参会人

### 签到页面 (`/`)

1. 参会人打开签到链接
2. 输入姓名和手机号后四位
3. 点击"签到"按钮
4. 系统验证通过后显示签到成功

### 签到规则

- 仅名单内的参会人可以签到
- 签到匹配规则：姓名 + 手机号后四位
- 已签到的参会人不可重复签到

## CSV 文件格式

```csv
姓名,手机号
张三,13800138000
李四,13900139000
```

## 部署

### Vercel 部署

```bash
npm i -g vercel
vercel
```

注意：Vercel Serverless 函数使用临时文件系统，SQLite 数据会在部署间丢失。生产环境建议使用：

- Vercel Postgres / Neon / Turso 等托管数据库
- 或部署到有持久化存储的 VPS 上

### Docker 部署（可选）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 项目结构

```
src/app/
├── page.tsx          # 签到页面（首页）
├── actions.ts        # Server Actions
├── admin/
│   └── page.tsx      # 管理后台
├── api/
│   └── export-csv/
│       └── route.ts  # CSV 导出接口
├── layout.tsx        # 根布局
└── globals.css       # 全局样式
prisma/
└── schema.prisma     # 数据库模型
```

## 数据库模型

### Event（活动）

| 字段      | 类型     | 说明     |
| --------- | -------- | -------- |
| id        | String   | 主键     |
| name      | String   | 活动名称 |
| eventTime | DateTime | 活动时间 |

### Attendee（参会人）

| 字段       | 类型      | 说明         |
| ---------- | --------- | ------------ |
| id         | String    | 主键         |
| name       | String    | 姓名         |
| phone      | String    | 手机号       |
| phoneLast4 | String    | 手机号后四位 |
| checkedIn  | Boolean   | 是否已签到   |
| checkedInAt| DateTime? | 签到时间     |
