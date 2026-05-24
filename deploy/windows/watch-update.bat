@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "..\.."
set "REPO=%CD%"
set "CHECK_PS1=%REPO%\deploy\scripts\check-and-deploy.ps1"

title Jenrimark auto-update
echo Repo: %REPO%
echo Check every 5 minutes. Close this window to stop.
echo Log: %REPO%\deploy-auto.log
echo.

if not exist "%CHECK_PS1%" (
    echo [ERROR] Missing: %CHECK_PS1%
    pause
    exit /b 1
)

:loop
powershell -NoProfile -ExecutionPolicy Bypass -File "%CHECK_PS1%"
echo.
echo Next check in 5 minutes...
timeout /t 300 /nobreak >nul
goto loop
