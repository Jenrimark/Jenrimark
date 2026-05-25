@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "..\.."
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$t=(Get-Content 'deploy\webhook.token' -Raw).Trim().Trim([char]0xFEFF); ^
   $u='http://127.0.0.1:9100/webhook?token=' + [uri]::EscapeDataString($t); ^
   Write-Host 'POST' $u; ^
   Invoke-WebRequest -Method POST -Uri $u -Body '{}' -ContentType 'application/json'"
pause
