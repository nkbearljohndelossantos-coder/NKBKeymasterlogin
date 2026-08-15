# NKB Windows Login System — Emergency Recovery & Rollback Guide

This guide documents the procedures for recovering a Windows workstation if the NKB Credential Provider encounters unexpected network outages, API downtime, or software defects.

---

## 1. Non-Disruptive Failback (Standard Login Tile)

During development and rollout, the **Windows Default Password Credential Provider** remains enabled alongside the NKB Credential Provider tile.

If the NKB Authentication API or Active Directory service is unavailable:
1. On the Windows LogonUI screen, click **Sign-in options** (the key icon).
2. Select the standard **Windows Password** tile or **PIN** tile.
3. Sign in directly with the standard Windows domain or local account password.

---

## 2. Emergency Uninstallation via PowerShell

If you have administrative access to the machine:
```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope Process
.\installer\Unregister-NKBCredentialProvider.ps1
```

This removes the NKB Registry registration key:
`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers\{A9B8C7D6-E5F4-4321-8765-43210FEDCBA9}`
and unregisters the COM DLL via `regsvr32 /u /s`.

---

## 3. Safe Mode Recovery

If LogonUI encounters a critical crash and prevents normal desktop sign-in:

1. Restart Windows and hold **Shift** while selecting **Restart** from the power menu.
2. Navigate to: **Troubleshoot** → **Advanced options** → **Startup Settings** → **Restart**.
3. Press **4** or **F4** to boot into **Safe Mode**.
4. In Safe Mode, open an elevated `cmd.exe` or `PowerShell` prompt and execute:
   ```cmd
   reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers\{A9B8C7D6-E5F4-4321-8765-43210FEDCBA9}" /f
   ```
5. Reboot normally. Windows LogonUI will load with standard Windows authentication providers.

---

## 4. Disaster Recovery & Offline Policy

* **No Plaintext Password Caching**: The NKB Credential Provider never stores passwords locally on disk.
* **Network Error Reporting**: When the backend API is unreachable, the tile displays `"Network/Policy Service Unavailable"` without crashing the logon process or corrupting LSASS.
