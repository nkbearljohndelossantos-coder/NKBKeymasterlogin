# PowerShell Administrator Script
# Unregisters NKB Manufacturing Windows Credential Provider cleanly

Param(
    [string]$DllPath = "$PSScriptRoot\..\credential-provider\build\bin\Release\NKBCredentialProvider.dll"
)

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "ERROR: This script must be executed as Administrator!"
    Exit 1
}

$Clsid = "{A9B8C7D6-E5F4-4321-8765-43210FEDCBA9}"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers\$Clsid"

Write-Host "===========================================================" -ForegroundColor DarkCyan
Write-Host " UNREGISTERING NKB WINDOWS CREDENTIAL PROVIDER " -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor DarkCyan

if (Test-Path $RegPath) {
    Remove-Item -Path $RegPath -Recurse -Force | Out-Null
    Write-Host " Removed Credential Provider Registry Key: $RegPath" -ForegroundColor Green
}

if (Test-Path $DllPath) {
    regsvr32.exe /u /s "$DllPath"
    Write-Host " Unregistered COM DLL: $DllPath" -ForegroundColor Green
}

Write-Host "✅ SUCCESS: NKB Credential Provider unregistered cleanly." -ForegroundColor Green
