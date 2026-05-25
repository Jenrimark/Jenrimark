# Jenrimark 个人站

Astro 静态站 + Bento 首页，Mac 开发，家里 Windows 托管（Nginx + 88 FRP）。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出 dist/
```

## 写内容

1. 改 `src/site.config.ts`
2. 在 `src/content/blog/` 新增 `.md`
3. `git push` → 家里 Webhook 自动 pull + build

- [傻瓜教程-Mac开发-Windows家里.md](docs/傻瓜教程-Mac开发-Windows家里.md) — Nginx、frp
- [Windows-Git自动部署.md](docs/Windows-Git自动部署.md) — Webhook、SSH、`HOME_WEBHOOK_URL`

## deploy 目录（Windows）

```
deploy/windows/
  run-webhook.bat      # Push 触发（常开）
  startup-webhook.bat  # 开机自启 Webhook
  deploy-once.bat      # 手动部署
  setup-ssh.bat        # Git 改 SSH
  startup-nginx.bat / startup-frpc.bat
deploy/scripts/
  deploy.ps1 / webhook-server.ps1 / setup-ssh-remote.ps1
deploy/frp/frpc.toml.example
```

## GitHub Actions

- `ci.yml` — 提交时云端 typecheck + build
- `trigger-home-deploy.yml` — push 后 curl 家里 Webhook（需 Secret `HOME_WEBHOOK_URL`）
