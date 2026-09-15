# 合租管家（Housemate）

面向合租年轻人的生活协作小工具：**费用 AA 分摊 · 清洁值日排班 · 公共物品登记与提醒 · 室友公约管理**，外加一个聚合提醒的首页总览。

- 创建房间 → 生成 6 位房间码 → 室友输入房间码即可加入（MVP 无需注册登录）
- 内置演示房间（房间码 `DEMO01`），打开即可完整体验

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vite 5 + React 18 + TypeScript + React Router |
| 后端 | Node.js + Express（REST API） |
| 存储 | JSON 文件存储（`data/db.json`，原子写入、写操作串行化） |
| 部署 | 单进程同时托管 API 与静态资源，任意有 Node 的服务器可跑 |

> 数据层集中在 `server/store.js`，后续可无缝替换为 SQLite / PostgreSQL。

## 目录结构

```
housemate/
├── server/            # Express 后端
│   ├── index.js       # 全部 REST 路由 + 演示数据种子
│   └── store.js       # JSON 文件存储（原子写 / 串行队列）
├── src/
│   ├── pages/         # Landing / Dashboard / 费用 / 排班 / 物品 / 公约 / 成员
│   ├── components/    # Layout、Icon、通用 UI（Button/Modal/Toast/Confirm…）
│   ├── context/       # HouseContext（房间状态 + 身份）
│   ├── api.ts         # API 封装
│   ├── utils.ts       # 结算计算 / 日期 / 格式化
│   └── styles/        # 设计系统（令牌 + 组件样式）
├── design-system/     # 设计规范文档（MASTER.md）
└── data/              # 运行时数据（git 忽略）
```

## 本地开发

```bash
npm install
npm run dev        # 同时启动前端(5173)与后端(3001)，打开 http://localhost:5173
```

也可分开跑：`npm run dev:web` / `npm run dev:api`。

## 部署到 GitHub Pages（纯静态，无需服务器）

纯静态模式下数据存在浏览器 localStorage，无需后端服务器，可直接部署到 GitHub Pages / Vercel / Netlify 等静态托管平台。

```bash
npm run build:static    # VITE_STATIC_MODE=true，产物输出到 dist/
```

将 `dist/` 目录内容推送到 GitHub Pages 分支即可。已部署示例：https://jenrimark.github.io/

> 注意：纯静态模式数据仅存在当前浏览器，清除浏览器数据或换设备会丢失。需要多设备同步请使用下方「部署到服务器」的全栈模式。

## 部署到服务器

### 方式一：单进程直接跑（最简单）

```bash
npm install
npm run build      # 产物输出到 dist/
npm start          # 一个进程同时服务 API 和静态页面，默认端口 3001
```

服务器访问：`http://服务器IP:3001`（记得在防火墙/安全组放行 3001 端口）。

### 方式二：PM2 守护（推荐生产）

```bash
npm install -g pm2
npm run build
pm2 start server/index.js --name housemate
pm2 save && pm2 startup     # 开机自启
```

### 方式三：Nginx 反代（端口 80 + 域名）

```nginx
server {
  listen 80;
  server_name your.domain.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

端口可用环境变量覆盖：`PORT=8080 npm start`。

## 主要 API

```
POST /api/house/create            创建房间（返回房间 + 你的成员信息）
POST /api/house/join              房间码加入
GET  /api/house/:id               拉取房间全部数据
费用   POST/PATCH/DELETE /api/house/:id/expenses[/:eid]
排班   POST /api/house/:id/schedule · PATCH /api/house/:id/assignments/:aid
物品   POST /api/house/:id/items · POST .../items/:iid/log · PATCH/DELETE
公约   POST /api/house/:id/rules · PATCH .../rules/:rid（状态/投票）· DELETE
成员   PATCH/DELETE /api/house/:id/members/:mid
```

## 演示数据

首次启动自动写入演示房间（`DEMO01`「阳光花园 · 3居室」，4 位室友 + 完整示例数据）。删除 `data/db.json` 后重启即重置。
