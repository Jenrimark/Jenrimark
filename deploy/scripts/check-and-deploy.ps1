# 检查 GitHub 是否有新提交，有则执行 deploy.ps1
# 单次运行（适合任务计划程序每 N 分钟执行一次）:
#   powershell -ExecutionPolicy Bypass -File deploy\scripts\check-and-deploy.ps1
# 后台循环（适合 deploy\windows\后台监听更新.bat）:
#   见该 bat 文件

$ErrorActionPreference = "Stop"

$RepoRoot   = if ($env:REPO_ROOT)   { $env:REPO_ROOT }   else { "E:\Desktop\Jenrimark" }
$Branch     = if ($env:BRANCH)     { $env:BRANCH }     else { "main" }
$LogFile    = if ($env:DEPLOY_LOG)  { $env:DEPLOY_LOG }  else { Join-Path $RepoRoot "deploy-auto.log" }

function Write-Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

if (-not (Test-Path $RepoRoot)) {
    Write-Log "错误: 仓库不存在 $RepoRoot ，请先 git clone"
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Log "错误: 未安装 git"
    exit 1
}

Set-Location $RepoRoot

if (-not (Test-Path ".git")) {
    Write-Log "错误: 不是 git 仓库: $RepoRoot"
    exit 1
}

Write-Log "检查远程更新 (分支 $Branch)..."

try {
    git fetch origin $Branch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "git fetch 失败"
    }
} catch {
    Write-Log "网络或 git 错误: $_"
    exit 1
}

$remoteRef = "origin/$Branch"
try {
    $localHash  = (git rev-parse HEAD).Trim()
    $remoteHash = (git rev-parse $remoteRef).Trim()
} catch {
    Write-Log "错误: 无法解析提交，请确认已 clone 且存在 $remoteRef"
    exit 1
}

if ($localHash -eq $remoteHash) {
    Write-Log "已是最新 ($($localHash.Substring(0,7)))，跳过构建"
    exit 0
}

Write-Log "发现新提交 $($localHash.Substring(0,7)) -> $($remoteHash.Substring(0,7))，开始部署..."

$deployScript = Join-Path $PSScriptRoot "deploy.ps1"
& $deployScript
if ($LASTEXITCODE -ne 0) {
    Write-Log "部署失败"
    exit 1
}

Write-Log "部署成功"
exit 0
