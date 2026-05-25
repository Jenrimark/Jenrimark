# Listen for deploy trigger (GitHub Actions curl or GitHub Webhook via frp)
# Default: http://127.0.0.1:9100/webhook?token=YOUR_SECRET

param(
    [int]$Port = 9100,
    [string]$Token = $env:DEPLOY_WEBHOOK_TOKEN
)

$ErrorActionPreference = "Stop"
$RepoRoot = if ($env:REPO_ROOT) { $env:REPO_ROOT } else { "E:\Desktop\Jenrimark" }
$DeployPs1 = Join-Path $RepoRoot "deploy\scripts\deploy.ps1"
$TokenFile = Join-Path $RepoRoot "deploy\webhook.token"

if (-not $Token -and (Test-Path $TokenFile)) {
    $Token = (Get-Content $TokenFile -Raw).Trim()
}
if (-not $Token) {
    throw "Set DEPLOY_WEBHOOK_TOKEN or create deploy\webhook.token (see webhook.token.example)"
}

if (-not (Test-Path $DeployPs1)) {
    throw "Missing $DeployPs1"
}

$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Webhook server: $prefix"
Write-Host "POST /webhook?token=***"
Write-Host "Repo: $RepoRoot"
Write-Host "Ctrl+C to stop."
Write-Host ""

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $code = 200
    $body = "ok"

    if ($request.HttpMethod -ne "POST") {
        $code = 405
        $body = "POST only"
    }
    elseif ($request.Url.AbsolutePath -ne "/webhook") {
        $code = 404
        $body = "not found"
    }
    elseif ($request.QueryString["token"] -ne $Token) {
        $code = 401
        $body = "unauthorized"
    }
    else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Deploy triggered."
        Start-Process -FilePath "powershell.exe" -WorkingDirectory $RepoRoot -WindowStyle Minimized -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $DeployPs1
        ) | Out-Null
        $body = "deploy started"
    }

    $response.StatusCode = $code
    $buf = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response.ContentLength64 = $buf.Length
    $response.OutputStream.Write($buf, 0, $buf.Length)
    $response.Close()
}
