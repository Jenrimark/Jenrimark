# Windows：Git 拉代码 + Push 触发部署

**流程**：Mac `git push` → GitHub Actions curl → 家里 Webhook → `git pull` + `npm run build` → 更新 `dist`。

---

## 路径

| 项目 | 路径 |
|------|------|
| Git 仓库 | `E:\Desktop\Jenrimark` |
| 网站 | `E:\Desktop\Jenrimark\dist` |
| Webhook | `deploy\windows\run-webhook.bat` |
| 手动部署 | `deploy\windows\deploy-once.bat` |

---

## 一次性准备

1. 安装 [Git](https://git-scm.com/download/win)、[Node.js 22+](https://nodejs.org)
2. `deploy\webhook.token`：一行短密钥（勿提交 Git）
3. 88 FRP：远程 **23334** → 本地 **9100**；网站 **23333** → 本地 **8080**
4. Nginx + frp：见 [傻瓜教程-Mac开发-Windows家里.md](./傻瓜教程-Mac开发-Windows家里.md)
5. **SSH 拉代码**：运行 `deploy\windows\setup-ssh.bat`（避免 HTTPS TLS 报错）

---

## Webhook（Push 触发）

### 为什么会「过一阵就超时」？

| 现象 | 原因 |
|------|------|
| 网站 23333 正常，23334 curl 一直转圈 | **frp 隧道 idle 断开**或 **9100 Webhook 进程已挂**；公网 TCP 能连上，但本地没人回 HTTP |
| 重启 `run-webhook.bat` 立刻好 | Webhook 无自愈，崩溃/睡眠后不会自己起来 |
| Actions 显示「进行中」很久 | 旧版 `curl` 无超时；现已加 `--max-time` 快速失败 |

**长期做法（推荐）**：

1. **看门狗**：开机自启改用 `startup-webhook-watchdog.bat`（每 60s 检测 9100，挂了自动拉起）
2. **frp 心跳**：在 `E:\Desktop\FRP\frpc.toml` 增加（与 `deploy/frp/frpc.toml.example` 一致）：
   ```toml
   heartbeatInterval = 30
   heartbeatTimeout = 90
   ```
   改完后重启 frpc。
3. **电源**：Windows 勿休眠（或「休眠时保持网络」），否则 9100 / frpc 会停。

### 常开服务

- **推荐**：`deploy\windows\run-webhook-watchdog.bat`（含自动重启，可最小化）
- 调试：`deploy\windows\run-webhook.bat`（窗口关了就停）

开机自启：Startup 快捷方式 → **`startup-webhook-watchdog.bat`**（替代旧的 `startup-webhook.bat`）

### GitHub Secret（存储库密钥）

| Name | Value |
|------|--------|
| `HOME_WEBHOOK_URL` | `http://gd02.frp0.cc:23334/webhook?token=与webhook.token相同` |

`token=` 后建议 **一行短密钥**（20～40 字符），与文件 **逐字相同**。

### 本机测试

```powershell
$t = (Get-Content "E:\Desktop\Jenrimark\deploy\webhook.token" -Raw).Trim()
$url = "http://127.0.0.1:9100/webhook?token=" + [uri]::EscapeDataString($t)
Invoke-WebRequest -Method POST -Uri $url -Body '{}' -ContentType "application/json"
```

应 **200**，Webhook 窗口显示 `Deploy triggered.`。

---

## 日常

```bash
# Mac
git add .
git commit -m "update"
git push
```

Windows 自动部署（需 `run-webhook.bat`、frpc、Nginx 在跑）。急用：双击 `deploy-once.bat`。

---

## 脚本一览

| 文件 | 作用 |
|------|------|
| `run-webhook.bat` | Webhook 监听 9100（手动调试） |
| `run-webhook-daemon.bat` | Webhook 无 pause（看门狗拉起用） |
| `run-webhook-watchdog.bat` | 每 60s 检测并重启 Webhook |
| `startup-webhook-watchdog.bat` | 开机启动看门狗（推荐） |
| `startup-webhook.bat` | 仅启动 Webhook（无自愈，不推荐长期用） |
| `deploy-once.bat` | 手动 pull + build |
| `setup-ssh.bat` | HTTPS 改 SSH |
| `startup-nginx.bat` / `startup-frpc.bat` | 开机 Nginx / frpc |
| `run-nginx.bat` / `run-frpc.bat` | 手动启动 |

| PowerShell | 作用 |
|------------|------|
| `deploy/scripts/webhook-server.ps1` | 接收 POST；`GET /health` 供看门狗探测 |
| `deploy/scripts/watch-webhook.ps1` | 看门狗逻辑 |
| `deploy/scripts/deploy.ps1` | pull + build |
| `deploy/scripts/setup-ssh-remote.ps1` | 配置 SSH |

| GitHub Actions | 作用 |
|----------------|------|
| `ci.yml` | 云端 check + build 校验 |
| `trigger-home-deploy.yml` | push 后 curl 家里 Webhook |

---

## 常见问题

| 问题 | 处理 |
|------|------|
| 401 / len 不一致 | `webhook.token` 与 URL 的 token 必须相同；看窗口 `query len` vs `expected len` |
| 无法连接 9100 | 先开 `run-webhook.bat` |
| Actions 绿但家里没动 | SSH `git pull` 是否成功；Webhook 是否在跑 |
| Actions 一直「进行中」/超时 | 家里 `run-webhook-watchdog.bat` 或 frpc **23334** 隧道挂了；本机测 `http://127.0.0.1:9100/health`；公网测 `http://gd02.frp0.cc:23334/health`；重启看门狗 + frpc |
| `curl: (28) Operation timed out` | TCP 能连但 **9100 无 HTTP 响应**（Webhook 未跑 / frp 隧道 stale）；见上文「过一阵就超时」 |
| TLS on pull | `setup-ssh.bat` |
