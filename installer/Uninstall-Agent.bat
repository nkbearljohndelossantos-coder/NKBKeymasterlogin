@echo off
:: NKB Manufacturing Windows Agent 1-Click Uninstaller
title Uninstalling NKB Manufacturing Windows Agent...
cd /d "%~dp0"

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ============================================================
    echo  ERROR: Administrator permissions required!
    echo ============================================================
    echo  Please right-click "Uninstall-Agent.bat" and select:
    echo  "Run as administrator"
    echo ============================================================
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Unregister-NKBCredentialProvider.ps1"
echo.
pause
