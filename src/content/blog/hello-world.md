---
title: 第一篇文章 — MVP 已上线
description: 先上线一篇文章，比纠结主题颜色重要一万倍。
pubDate: 2026-05-24
tags: [astro, mvp]
---

欢迎来到我的个人站点 **1.0 版本**。

这套架构很轻：

- **Astro** 生成纯静态页面，默认零客户端 JavaScript
- **Git push** 触发 GitHub Actions 检测与打包
- **rsync** 把 `dist/` 同步到家里服务器的 Nginx 目录
- **frp** 把公网流量穿透到本地

## 下一步

1. 改 `src/site.config.ts` 里的域名和社交链接
2. 在 `src/content/blog/` 下继续加 Markdown
3. 把 Bento 卡片里的项目链接换成真实仓库

写就完事了。
