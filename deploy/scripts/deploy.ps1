# 家里 Windows 一键拉代码 + 构建 + 同步到 Nginx 目录
# 用法:
#   powershell -ExecutionPolicy Bypass -File deploy\scripts\deploy.ps1
# 或双击 deploy\windows\一键部署.bat

$ErrorActionPreference = "Stop"

# 可按你电脑改路径（也可用环境变量 REPO_ROOT / DEPLOY_PATH 覆盖）
$RepoRoot   = if ($env:REPO_ROOT)   { $env:REPO_ROOT }   else { "E:\Desktop\Jenrimark" }
$BuildDist  = Join-Path $RepoRoot "dist"
$DeployPath = if ($env:DEPLOY_PATH) { $env:DEPLOY_PATH } else { $BuildDist }
$Branch     = if ($env:BRANCH)     { $env:BRANCH }     else { "main" }

Write-Host "==> 仓库目录: $RepoRoot"
Write-Host "==> 构建输出: $BuildDist"
Write-Host "==> Nginx 目录: $DeployPath"
Write-Host "==> 分支: $Branch"

if (-not (Test-Path $RepoRoot)) {
    throw "仓库目录不存在: $RepoRoot`n请先 git clone（见 docs/Windows-Git自动部署.md）"
}

Set-Location $RepoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "未找到 git，请先安装 Git for Windows"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "未找到 npm，请先安装 Node.js"
}

Write-Host "==> git pull..."
git fetch origin $Branch
git checkout $Branch 2>$null
git pull origin $Branch

Write-Host "==> npm ci && npm run build..."
npm ci
npm run build

if (-not (Test-Path $BuildDist)) {
    throw "构建失败：未生成 dist 目录"
}

# 构建目录与 Nginx 目录相同时，无需 robocopy（你的默认布局就是这样）
if (-not (Test-Path $DeployPath)) {
    New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
}
$buildResolved  = (Resolve-Path $BuildDist).Path
$deployResolved = (Resolve-Path $DeployPath).Path

if ($buildResolved -eq $deployResolved) {
    Write-Host "==> 构建目录即网站目录，跳过复制"
} else {
    Write-Host "==> 同步 $BuildDist -> $DeployPath ..."
    robocopy $BuildDist $DeployPath /MIR /NFL /NDL /NJH /NJS | Out-Host
    if ($LASTEXITCODE -ge 8) {
        throw "文件同步失败，robocopy 退出码: $LASTEXITCODE"
    }
}

Write-Host ""
Write-Host "部署完成: $DeployPath"
Write-Host "本机预览: http://127.0.0.1:8080/"
Write-Host "外网(若 frpc 已开): http://gd02.frp0.cc:23333/"
