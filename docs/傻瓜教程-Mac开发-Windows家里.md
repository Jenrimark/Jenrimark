# 傻瓜教程：Mac 写网站，Windows 家里 24 小时挂着

你只需要记住两件事：

- **Mac**：改代码、生成网页文件（`dist` 文件夹）
- **Windows**：用 Nginx 展示网页 + 用 frpc 让外网能访问

外网访问地址（你现在的隧道）：

```text
http://gd02.frp0.cc:23333/
```

---

## 总览（先看懂再动手）

```text
[ Mac ]  写代码 → npm run build → 得到 dist 文件夹
              ↓（U盘 / 微信传文件 / 局域网共享 拷到 Windows）
[ Windows ]  dist 放到 E:\Desktop\Jenrimark\dist
              Nginx 在 8080 端口读这个文件夹
              frpc 把 8080 穿透到 gd02.frp0.cc:23333
              ↓
[ 任何人 ]  浏览器打开 http://gd02.frp0.cc:23333/
```

**第一次**配置 Windows 大约 30～60 分钟；以后更新网站只需：**Mac 构建 → 拷贝 dist 覆盖 → 刷新浏览器**。

---

# 第一部分：Mac（开发机）

## 1. 确认已安装 Node

打开 **终端**，输入：

```bash
node -v
```

若显示 `v22.x.x` 之类版本号即可。若没有，去 https://nodejs.org 下载 LTS 安装。

## 2. 进入项目并本地预览

```bash
cd ~/Documents/CODE/JenrimarkTop/Jenrimark
npm install
npm run dev
```

浏览器打开终端里提示的地址（一般是 http://localhost:4321 ），能见到网站就 OK。按 `Ctrl + C` 停止。

## 3. 改你自己的信息

用 Cursor 打开并编辑：

- `src/site.config.ts` — 名字、简介、GitHub 链接
- `src/content/blog/` — 用 Markdown 写文章

## 4. 生成要上传到家里的「成品网页」

```bash
cd ~/Documents/CODE/JenrimarkTop/Jenrimark
npm run build
```

完成后项目里会出现 **`dist` 文件夹**，里面全是 `.html` 和静态资源。**把整个 `dist` 文件夹拷到 Windows**（见下文「传文件到 Windows」）。

---

# 第二部分：Windows（家里服务器）— 一次性配置

以下在 **家里 Windows 电脑** 上操作（和 88 FRP 隧道 `Windows-Jenrimark` 同一台）。

## A. 网站目录（你的路径）

网站根目录固定为：

```text
E:\Desktop\Jenrimark\dist\
```

首页文件：

```text
E:\Desktop\Jenrimark\dist\index.html
```

1. 打开 **文件资源管理器**，进入 `E:\Desktop\Jenrimark\`
2. 若没有 `dist` 文件夹，新建 **`dist`**
3. 把 Mac 上 `npm run build` 生成的 **`dist` 里的所有文件**（不要多套一层 `dist\dist`）放进 `E:\Desktop\Jenrimark\dist\`，应能看到 `index.html`

---

## B. 安装 Nginx（让 8080 能打开网页）

### B1. 下载

1. 浏览器打开：https://nginx.org/en/download.html  
2. 下载 **Stable version** 的 **Windows zip**（例如 `nginx-1.28.x.zip`）
3. 解压到 `C:\nginx`（解压后应有 `C:\nginx\nginx.exe`）

### B2. 改配置

1. 用记事本打开：`C:\nginx\conf\nginx.conf`
2. **删掉或注释掉** 里面原有的整个 `server { ... }` 块（若有）
3. 在文件**最末尾** `}` 之前，粘贴下面整段（注意路径是 Windows 写法）：

```nginx
server {
    listen       8080;
    server_name  localhost;

    root   E:/Desktop/Jenrimark/dist;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. 保存

### B3. 启动并测试

1. 按 `Win + R`，输入 `cmd`，回车  
2. 执行：

```cmd
cd C:\nginx
start nginx
```

3. 打开浏览器访问：**http://127.0.0.1:8080/**  
   - 能看到网站 → 成功，继续 **C. 安装 frpc**  
   - 打不开 → 看文末「故障排除」

> 以后改网站只替换 `E:\Desktop\Jenrimark\dist` 里的文件，**不用改 nginx.conf**（除非改端口）。

---

## C. 安装 frpc（88 FRP 穿透）

### C1. 下载 frp

1. 打开：https://github.com/fatedier/frp/releases  
2. 下载：`frp_xxx_windows_amd64.zip`  
3. 解压到：`E:\Desktop\FRP`（应有 `E:\Desktop\FRP\frpc.exe`）

### C2. 放配置文件

1. 登录 **88 FRP** 网站 → **我的订阅** → 你的隧道 → **编辑 / 复制配置**
2. 在 `E:\Desktop\FRP` 新建文件 **`frpc.toml`**（记事本另存为，编码 UTF-8）
3. 把平台复制的**整段配置**粘贴进去保存

必须和面板一致，例如：

- `localIP = "127.0.0.1"`
- `localPort = 8080`  ← 和 Nginx 端口一致
- `remotePort = 23333`
- `name = "..."` ← 平台给的，不要改

### C3. 启动 frpc

**PowerShell**（你截图里用的，必须加 `.\`）：

```powershell
cd E:\Desktop\FRP
.\frpc.exe -c frpc.toml
```

**cmd** 里也可以：

```cmd
cd /d E:\Desktop\FRP
frpc.exe -c frpc.toml
```

或直接双击 **`frp_start.bat`** / 项目里的 `deploy\windows\run-frpc.bat`。

- 窗口不要关（关了就断线）
- 看到 **start proxy success** 或类似成功提示
- 88 FRP 面板显示隧道 **运行中**

### C4. 外网测试

用手机 **4G/5G**（不要用家里 WiFi）打开：

```text
http://gd02.frp0.cc:23333/
```

能看到网站 = 全流程打通。

---

## D. 开机自动启动（可选）

**前提**：你已经能手动打开 `http://127.0.0.1:8080/` 和手机上的 `http://gd02.frp0.cc:23333/`。

推荐 **快捷方式** 指向仓库里的英文 bat（`git pull` 后自动用新版）。全局启动：`shell:common startup`。

---

### 方法一：Startup 快捷方式（推荐）

#### 第 1 步：打开启动文件夹

资源管理器地址栏输入 `shell:startup` 或 `shell:common startup` 回车。

#### 第 2 步：为以下 bat 各建一个快捷方式

目标路径（在仓库里）：

```text
E:\Desktop\Jenrimark\deploy\windows\startup-nginx.bat
E:\Desktop\Jenrimark\deploy\windows\startup-frpc.bat
E:\Desktop\Jenrimark\deploy\windows\startup-webhook.bat   （运行方式选「最小化」）
```

Git 自动更新见 [Windows-Git自动部署.md](./Windows-Git自动部署.md)。

#### 第 3 步：重启电脑测试

1. **重启 Windows**
2. 登录后等约 10 秒
3. 任务栏可能有一个 **最小化的「88FRP」** 黑窗口（frpc），不要关
4. 浏览器打开 `http://127.0.0.1:8080/` 和手机 `http://gd02.frp0.cc:23333/`

---

### 方法二：自己建「快捷方式」（想学会再用这个）

#### 先打开启动文件夹

同样：**`Win + R`** → 输入 `shell:startup` → 回车。

#### 建 Nginx 快捷方式

1. 在 **「启动」** 文件夹空白处 **右键** → **新建** → **快捷方式**
2. **请键入对象的位置** 里粘贴：

```text
C:\nginx\nginx.exe
```

3. 点 **下一步**
4. 名称填：`Nginx 网站` → **完成**

#### 建 frpc 快捷方式

1. 仍在 **「启动」** 文件夹空白处 **右键** → **新建** → **快捷方式**
2. **请键入对象的位置** 里粘贴（一整行）：

```text
E:\Desktop\FRP\frpc.exe -c E:\Desktop\FRP\frpc.toml
```

3. **下一步** → 名称填：`88 FRP` → **完成**

4. **重要**：右键刚建好的 **「88 FRP」** 快捷方式 → **属性**  
   - **「起始位置」** 改成：`E:\Desktop\FRP`  
   - 点 **确定**

（否则有时 frpc 找不到同目录的 `frpc.toml`。）

#### 可选：让 frpc 窗口最小化

1. 右键 **「88 FRP」** 快捷方式 → **属性**
2. **运行方式** 选 **最小化**
3. **确定**

---

### 启动文件夹里应该长什么样

```
启动/
  startup-nginx.bat（快捷方式）
  startup-frpc.bat（快捷方式）
  startup-webhook.bat（快捷方式，最小化）
```

或：

```
启动/
  Nginx 网站.lnk        ← 方法二
  88 FRP.lnk            ← 方法二
```

---

### 取消开机自启

再 **`Win + R`** → `shell:startup` → 回车，把里面的 bat 或快捷方式 **删掉** 即可。

### 以前的自启不在这个文件夹？这样找

很多人用过 **任务计划程序**、**任务管理器-启动应用** 或 **注册表**，不一定在 `shell:startup`。

#### ① 任务管理器（最先查，最简单）

1. **`Ctrl + Shift + Esc`** 打开任务管理器  
2. 点 **「启动」** 或 **「启动应用」** 选项卡（Win10/11 都有）  
3. 找名字像 **nginx、frp、frpc、88** 或你以前起的名字  
4. 右键 → **禁用**（先禁用测重启；确认不要了再在下面位置彻底删）

#### ② 任务计划程序（很常见）

1. **`Win + R`** → 输入 **`taskschd.msc`** → 回车  
2. 左侧点 **「任务计划程序库」**  
3. 中间列表找 **nginx / frp / frpc / Jenrimark** 等可疑项  
4. 右键 → **删除**（或先 **禁用**）  
5. 也可右侧 **「创建基本任务」** 旁的历史任务，看「触发器」是否为 **登录时 / 启动时**

#### ③ 两个「启动」文件夹都看一眼

| 打开方式 | 谁生效 |
|----------|--------|
| `Win+R` → **`shell:startup`** | 仅当前 Windows 用户 |
| `Win+R` → **`shell:common startup`** | 本机所有用户 |

把里面旧的 **nginx / frp 相关 .bat、.lnk** 删掉。

#### ④ 注册表（进阶，删前可先导出备份）

1. **`Win + R`** → **`regedit`** → 回车  
2. 分别打开下面两项，看右侧有没有 **nginx、frpc、frp**：

```text
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
```

```text
HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Run
```

3. 确认是旧自启后，右键该项 → **删除**

#### ⑤ 搜 bat 脚本

在资源管理器打开：

- `E:\Desktop\FRP\`（是否有 `frp_start.bat` 被别的方式调用）  
- `C:\nginx\`  

回忆是否用过 **「任务计划程序 → 导入」** 或某安装包自带的「开机启动」。

#### 建议操作顺序

1. 任务管理器 → 启动 → **禁用** 可疑项 → **重启** 测试  
2. 仍自动启动 → **taskschd.msc** 删对应计划任务  
3. 再查 **shell:startup** 和 **shell:common startup**  
4. 仍不行 → 查注册表 **Run**

删干净后，Startup 里只保留 `startup-nginx` / `startup-frpc` / `startup-webhook` 各一个快捷方式，避免重复启动。

---

# 第三部分：以后每次更新网站（日常只需 5 分钟）

## 在 Mac 上

```bash
cd ~/Documents/CODE/JenrimarkTop/Jenrimark
# 改完代码后
npm run build
```

## 把 dist 传到 Windows

任选一种你最容易的：

| 方式 | 做法 |
|------|------|
| U 盘 | Mac 复制 `dist` → U 盘 → Windows 粘贴覆盖 `E:\Desktop\Jenrimark\dist` |
| 微信/QQ | 把 `dist` 打成 zip 发文件传输助手，Windows 解压覆盖 |
| 局域网 | Windows 开共享文件夹，Mac 访达 `前往 → 连接服务器` 复制 |

**覆盖时注意**：用新 `dist` 里的文件**全部替换** `E:\Desktop\Jenrimark\dist`，保留 `index.html` 在根目录。

## 在 Windows 上

一般 **不用重启** Nginx 和 frpc，手机浏览器 **强制刷新** 即可。

若打不开新页面：

```cmd
cd C:\nginx
nginx -s reload
```

frpc 窗口若已关闭，重新运行：

```powershell
cd E:\Desktop\FRP
.\frpc.exe -c frpc.toml
```

---

# 传文件到 Windows（Mac 详细步骤）

1. Mac 上打开访达，进入项目里的 **`dist`** 文件夹  
2. `Cmd + A` 全选 → `Cmd + C` 复制  
3. U 盘或共享到 Windows 后，打开 `E:\Desktop\Jenrimark\dist`  
4. `Ctrl + A` 全选旧文件 → 删除 → `Ctrl + V` 粘贴新的  

---

# 故障排除

## Mac：`npm run build` 报错

```bash
cd ~/Documents/CODE/JenrimarkTop/Jenrimark
rm -rf node_modules
npm install
npm run build
```

## Windows：127.0.0.1:8080 打不开

1. 检查 `E:\Desktop\Jenrimark\dist\index.html` 是否存在  
2. 检查 `nginx.conf` 里 `root` 路径是否是 `E:/Desktop/Jenrimark/dist`（用正斜杠 `/`）  
3. 是否启动过 nginx：`cd C:\nginx` 后 `start nginx`  
4. 端口被占用：改 `listen 8081`，同时把 `frpc.toml` 里 `localPort` 改成 `8081`

## Windows：frpc 启动失败

1. 删掉配置末尾两行再试：

```toml
transport.useEncryption = true
transport.useCompression = true
```

2. 确认 `user`、`serverAddr` 与 88 FRP 面板完全一致（重新复制配置）  
3. 面板隧道是否已创建且未过期

## 外网 gd02.frp0.cc:23333 打不开，但本机 8080 可以

1. frpc 窗口是否在运行  
2. 88 FRP 是否显示 **运行中**  
3. 用手机流量测（不要用家里 WiFi）

## 停止 / 重启 Nginx

```cmd
cd C:\nginx
nginx -s stop
start nginx
```

---

# 和 GitHub 自动部署的关系

| 方式 | 说明 |
|------|------|
| Mac 拷 dist | 最简单，见上文第三部分 |
| **Windows Git 一键部署** | 装 Git + Node，双击 `deploy-once.bat`，见 **[Windows-Git自动部署.md](./Windows-Git自动部署.md)** |
| GitHub Actions + rsync | 需 SSH 隧道，见 [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

# 检查清单（打印对照）

**Mac 一次性**

- [ ] `npm install` 成功  
- [ ] `npm run dev` 能预览  
- [ ] `npm run build` 生成 `dist`

**Windows 一次性**

- [ ] `E:\Desktop\Jenrimark\dist\index.html` 存在  
- [ ] Nginx 安装，`http://127.0.0.1:8080` 能打开  
- [ ] frpc 安装，`frpc.toml` 来自 88 FRP  
- [ ] frpc 运行，面板「运行中」  
- [ ] 手机 4G 打开 `http://gd02.frp0.cc:23333/` 能打开  

**每次更新**

- [ ] Mac `npm run build`  
- [ ] 覆盖 Windows 的 `dist`  
- [ ] 刷新外网页面  

---

更短的 frp 说明见：[FRP-第三方平台.md](./FRP-第三方平台.md)  
架构总览见：[ARCHITECTURE.md](./ARCHITECTURE.md)
