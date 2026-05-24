@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "..\.."
set "CHECK_PS1=%CD%\deploy\scripts\check-and-deploy.ps1"
if not exist "%CHECK_PS1%" (
    echo [ERROR] Missing: %CHECK_PS1%
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%CHECK_PS1%"
pause
