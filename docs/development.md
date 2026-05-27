# 开发与部署

Astro 静态站 + Bento 首页 + `/view` 浏览器起始页，Mac 开发，家里 Windows 托管（Nginx + frp）。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出 dist/
npm run preview  # 预览构建结果
npm run check    # Astro 类型检查
```

## 写内容

1. 改 `src/site.config.ts` — 站点名、描述、社交链接
2. 改 `src/data/profile.ts` — 简介、项目、简历时间线
3. 在 `src/content/blog/` 新增 `.md` 博文
4. `git push` → 家里 Webhook 自动 pull + build（见下方）

## 目录结构（核心）

```
src/
  pages/          # 路由页面
  data/           # profile、搜索配置等
  content/blog/   # 博客 Markdown
  components/     # Astro 组件
  styles/         # 全局与 /view 样式
extension/        # Chrome 书签同步扩展源码
deploy/           # Windows 部署脚本与 frp 模板
public/downloads/ # 扩展 zip（build 时自动生成）
```

## deploy 目录（Windows 家里机）

```
deploy/windows/
  run-webhook.bat           # Push 触发（常开）
  startup-webhook.bat       # 开机自启 Webhook
  deploy-once.bat           # 手动部署
  setup-ssh.bat             # Git 改 SSH
  startup-nginx.bat
  startup-frpc.bat
deploy/scripts/
  deploy.ps1
  webhook-server.ps1
  setup-ssh-remote.ps1
deploy/frp/frpc.toml.example
```

真实配置（含 token）勿提交：`deploy/frp/frpc.toml`、`deploy/webhook.token` 等，见 `.gitignore`。

## GitHub Actions

| 工作流 | 作用 |
|--------|------|
| `ci.yml` | 提交时云端 typecheck + build |
| `trigger-home-deploy.yml` | push 后 curl 家里 Webhook（需 Secret `HOME_WEBHOOK_URL`） |

## 环境要求

- Node.js **≥ 22.12.0**（见 `package.json` engines）

## 相关链接

- [站点配置](../src/site.config.ts)
- [个人资料数据](../src/data/profile.ts)
- [扩展说明](../extension/README.md)
