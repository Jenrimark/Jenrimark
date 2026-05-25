# Jenrimark 个人站

Astro 静态站 + Bento 首页 + GitHub Actions 自动部署到家里 Nginx（经 frp 穿透）。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出 dist/
npm run preview  # 预览构建结果
```

## 写内容

1. 改 `src/site.config.ts`
2. 在 `src/content/blog/` 新增 `.md` 文章
3. `git push origin main` → Actions 构建并 rsync（需配置 Secrets）

详细架构见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

**Mac 开发 + Windows 家里？** 按 [docs/傻瓜教程-Mac开发-Windows家里.md](docs/傻瓜教程-Mac开发-Windows家里.md) 一步步做即可。

**家里 Windows 用 Git 拉代码自动构建？** 见 [docs/Windows-Git自动部署.md](docs/Windows-Git自动部署.md)。  
**push 后立刻更新？** 配置 Webhook：`deploy/windows/run-webhook.bat` + GitHub Secret `HOME_WEBHOOK_URL`（见 [Windows-Git自动部署.md](docs/Windows-Git自动部署.md)）。备用：`watch-update.bat` 每 5 分钟轮询。

## 目录

```
src/
  components/     # Bento 卡片、页头页脚
  content/blog/   # Markdown 文章
  layouts/        # 页面布局
  pages/          # 路由
deploy/
  nginx/          # Nginx 配置模板
  frp/            # frp 示例
  scripts/        # 本地部署脚本
.github/workflows/deploy.yml
```

## MVP 原则

先跑通 **改代码 → Push → 页面更新**，再迭代 Bento 模块与设计细节。
