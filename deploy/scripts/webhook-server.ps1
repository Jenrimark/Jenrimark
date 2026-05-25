# Listen for deploy trigger (GitHub Actions curl or GitHub Webhook via frp)
# Default: http://127.0.0.1:9100/webhook?token=YOUR_SECRET

param(
    [int]$Port = 9100
)

$ErrorActionPreference = "Stop"
$RepoRoot = if ($env:REPO_ROOT) { $env:REPO_ROOT } else { "E:\Desktop\Jenrimark" }
$DeployPs1 = Join-Path $RepoRoot "deploy\scripts\deploy.ps1"
$TokenFile = Join-Path $RepoRoot "deploy\webhook.token"

function Read-TokenFromFile([string]$path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    return $text.Trim().Trim([char]0xFEFF)
}

function Get-QueryToken([System.Net.HttpListenerRequest]$request) {
    $raw = $request.QueryString["token"]
    if ([string]::IsNullOrEmpty($raw)) { return "" }
    return [System.Uri]::UnescapeDataString($raw).Trim()
}

# Load token: prefer webhook.token file; env DEPLOY_WEBHOOK_TOKEN overrides if set
$Token = $null
$tokenSource = "none"
if (Test-Path $TokenFile) {
    $Token = Read-TokenFromFile $TokenFile
    $tokenSource = "file"
}
if (-not [string]::IsNullOrWhiteSpace($env:DEPLOY_WEBHOOK_TOKEN)) {
    $Token = $env:DEPLOY_WEBHOOK_TOKEN.Trim().Trim([char]0xFEFF)
    $tokenSource = "env DEPLOY_WEBHOOK_TOKEN"
}
if (-not $Token) {
    throw "Create deploy\webhook.token (see webhook.token.example)"
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
Write-Host "Token source: $tokenSource (length $($Token.Length))"
Write-Host "Token file:   $TokenFile"
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
    else {
        $qToken = Get-QueryToken $request
        if ($qToken -cne $Token) {
            $code = 401
            $body = "unauthorized"
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 401 mismatch (query len=$($qToken.Length), expected len=$($Token.Length))"
            if ($qToken.Length -eq 0) {
                Write-Host "  Hint: add ?token=... to URL"
            }
        }
        else {
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $reader.ReadToEnd() | Out-Null
                $reader.Close()
            }
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Deploy triggered."
            Start-Process -FilePath "powershell.exe" -WorkingDirectory $RepoRoot -WindowStyle Minimized -ArgumentList @(
                "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $DeployPs1
            ) | Out-Null
            $body = "deploy started"
        }
    }

    $response.StatusCode = $code
    $buf = [System.Text.Encoding]::UTF8.GetBytes($body)
    $response.ContentLength64 = $buf.Length
    $response.OutputStream.Write($buf, 0, $buf.Length)
    $response.Close()
}
