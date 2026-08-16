@echo off
:: NKB Manufacturing Windows Agent 1-Click Installer
:: Runs Install-NKBAgent.ps1 with elevated privileges
title Installing NKB Manufacturing Windows Agent...
cd /d "%~dp0"

:: Check for Administrative Rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ============================================================
    echo  ERROR: Administrator permissions required!
    echo ============================================================
    echo  Please right-click "Install-Agent.bat" and select:
    echo  "Run as administrator"
    echo ============================================================
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-NKBAgent.ps1" -ApiHost "login.nkbmanufacturing.com" -ApiPort 443 -UseHttps
echo.
pause
