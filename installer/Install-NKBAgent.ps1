# PowerShell Administrator Script
# Full Installer for NKB Keymaster Windows Login Agent
# Target: Windows 10 / 11 (x64)

param(
    [string]$ApiHost = "login.nkbmanufacturing.com",
    [int]$ApiPort = 443,
    [switch]$UseHttps = $true
)

# 1. Check Administrator Privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[-] ERROR: Please run this script as Administrator!" -ForegroundColor Red
    Pause
    Exit 1
}

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  NKB MANUFACTURING - WINDOWS AGENT INSTALLER             " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 2. Define Destination Directory in Program Files
$InstallDir = "$env:ProgramFiles\NKB Manufacturing\Keymaster"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "[+] Created directory: $InstallDir" -ForegroundColor Green
}

# 3. Locate and Copy Compiled DLL
$SourceDll = "$PSScriptRoot\..\credential-provider\build\bin\Release\NKBCredentialProvider.dll"
if (-not (Test-Path $SourceDll)) {
    $SourceDll = "$PSScriptRoot\NKBCredentialProvider.dll"
}

if (-not (Test-Path $SourceDll)) {
    Write-Host "[-] Error: NKBCredentialProvider.dll not found!" -ForegroundColor Red
    Write-Host "    Expected at: $SourceDll" -ForegroundColor Yellow
    Pause
    Exit 1
}

$DestDll = "$InstallDir\NKBCredentialProvider.dll"
Copy-Item -Path $SourceDll -Destination $DestDll -Force
Write-Host "[+] Installed DLL to: $DestDll" -ForegroundColor Green

# 4. Register COM InprocServer32 DLL
regsvr32.exe /s "$DestDll"
Write-Host "[+] COM InprocServer32 registered." -ForegroundColor Green

# 5. Register Windows Credential Provider
$Clsid = "{A9B8C7D6-E5F4-4321-8765-43210FEDCBA9}"
$FriendlyName = "NKB Manufacturing Credential Provider"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers\$Clsid"

if (-not (Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
Set-ItemProperty -Path $RegPath -Name "(default)" -Value $FriendlyName -Type String
Write-Host "[+] Windows Credential Provider tile registered." -ForegroundColor Green

# 6. Configure Cloud Endpoint Registry Settings
$NkbConfigPath = "HKLM:\SOFTWARE\NKB Manufacturing\CredentialProvider"
if (-not (Test-Path $NkbConfigPath)) {
    New-Item -Path $NkbConfigPath -Force | Out-Null
}
Set-ItemProperty -Path $NkbConfigPath -Name "ApiHost" -Value $ApiHost -Type String
Set-ItemProperty -Path $NkbConfigPath -Name "ApiPort" -Value $ApiPort -Type DWord
Set-ItemProperty -Path $NkbConfigPath -Name "UseHttps" -Value $(if ($UseHttps) { 1 } else { 0 }) -Type DWord

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " [OK] NKB AGENT & LOGIN TILE SUCCESSFULLY INSTALLED!" -ForegroundColor Green
Write-Host " Cloud API Endpoint: https://$ApiHost:$ApiPort" -ForegroundColor Cyan
Write-Host " Press [Win + L] to test the NKB Manufacturing Login Tile." -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan
