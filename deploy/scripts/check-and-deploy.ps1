# Check GitHub for new commits; deploy if changed

$ErrorActionPreference = "Stop"

$RepoRoot = if ($env:REPO_ROOT) { $env:REPO_ROOT } else { "E:\Desktop\Jenrimark" }
$Branch   = if ($env:BRANCH)     { $env:BRANCH }     else { "main" }
$LogFile  = if ($env:DEPLOY_LOG) { $env:DEPLOY_LOG } else { Join-Path $RepoRoot "deploy-auto.log" }

function Write-Log([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & git @GitArgs 2>&1 | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return $code
}

if (-not (Test-Path $RepoRoot)) {
    Write-Log "ERROR: Repo not found: $RepoRoot"
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Log "ERROR: git not installed"
    exit 1
}

Set-Location $RepoRoot

if (-not (Test-Path ".git")) {
    Write-Log "ERROR: Not a git repo: $RepoRoot"
    exit 1
}

Write-Log "Checking origin/$Branch ..."

if ((Invoke-Git fetch origin $Branch) -ne 0) {
    Write-Log "ERROR: git fetch failed"
    exit 1
}

$remoteRef = "origin/$Branch"
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$localHash  = (git rev-parse HEAD 2>$null).Trim()
$remoteHash = (git rev-parse $remoteRef 2>$null).Trim()
$ErrorActionPreference = $prev

if (-not $localHash -or -not $remoteHash) {
    Write-Log "ERROR: Cannot read commits. Check branch $remoteRef"
    exit 1
}

if ($localHash -eq $remoteHash) {
    Write-Log "Up to date ($($localHash.Substring(0, 7))). Skip."
    exit 0
}

Write-Log "New commits $($localHash.Substring(0, 7)) -> $($remoteHash.Substring(0, 7)). Deploying..."

$deployScript = Join-Path $PSScriptRoot "deploy.ps1"
& $deployScript
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: Deploy failed"
    exit 1
}

Write-Log "Deploy OK"
exit 0
