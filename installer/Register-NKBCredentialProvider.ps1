# PowerShell Administrator Script
# Registers NKB Manufacturing Windows Credential Provider in Windows Registry
# Requires Administrator Privileges

Param(
    [string]$DllPath = "$PSScriptRoot\..\credential-provider\build\bin\Release\NKBCredentialProvider.dll",
    [string]$ApiHost = "127.0.0.1",
    [int]$ApiPort = 3000,
    [switch]$UseHttps = $false
)

# 1. Check Administrator Privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "ERROR: This script must be executed as Administrator!"
    Exit 1
}

# 2. Check Architecture (x64)
if ([IntPtr]::Size -ne 8) {
    Write-Error "ERROR: NKB Credential Provider requires a 64-bit (x64) Windows operating system."
    Exit 1
}

# 3. Verify DLL Path
$ResolvedDllPath = Resolve-Path $DllPath -ErrorAction SilentlyContinue
if (-not $ResolvedDllPath) {
    Write-Error "DLL not found at: $DllPath. Please build the C++ project first."
    Exit 1
}

$Clsid = "{A9B8C7D6-E5F4-4321-8765-43210FEDCBA9}"
$FriendlyName = "NKB Manufacturing Credential Provider"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " REGISTERING NKB WINDOWS CREDENTIAL PROVIDER " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " Target DLL: $ResolvedDllPath"
Write-Host " Target CLSID: $Clsid"

# 4. Register COM InprocServer32 DLL
regsvr32.exe /s "$ResolvedDllPath"

# 5. Register Credential Provider in HKLM Authentication Key
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers\$Clsid"
if (-not (Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
Set-ItemProperty -Path $RegPath -Name "(default)" -Value $FriendlyName -Type String

# 6. Configure NKB Endpoint in Registry (Machine-level policy)
$NkbConfigPath = "HKLM:\SOFTWARE\NKB Manufacturing\CredentialProvider"
if (-not (Test-Path $NkbConfigPath)) {
    New-Item -Path $NkbConfigPath -Force | Out-Null
}
Set-ItemProperty -Path $NkbConfigPath -Name "ApiHost" -Value $ApiHost -Type String
Set-ItemProperty -Path $NkbConfigPath -Name "ApiPort" -Value $ApiPort -Type DWord
Set-ItemProperty -Path $NkbConfigPath -Name "UseHttps" -Value $(if ($UseHttps) { 1 } else { 0 }) -Type DWord

Write-Host "✅ SUCCESS: NKB Credential Provider registered successfully!" -ForegroundColor Green
Write-Host "   Default Windows Login providers remain ENABLED as emergency fallback." -ForegroundColor Yellow
Write-Host "   Press Lock Screen (Win + L) to test tile appearance." -ForegroundColor Green
