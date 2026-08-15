# NKB Windows Login System — Installation & Deployment Guide

## Architecture Overview

The system consists of three runtime components:
1. **NKB Credential Provider (`credential-provider/`)**: C++ COM DLL installed on Windows 10/11 endpoints.
2. **NKB Authentication API (`auth-api/`)**: Node.js REST API service managing policy, session tokens, and MySQL persistence.
3. **AD Identity Service (`ad-identity-service/`)**: Independent Node.js microservice managing privileged Active Directory operations over LDAPS.

---

## 1. Backend Service Deployment

### Step A: Deploy MySQL Database
Execute schema and migration scripts in `database/`:
```bash
mysql -u root -p < database/schema/01_init_nkb_login.sql
mysql -u root -p < database/migrations/02_seed_test_data.sql
```

### Step B: Deploy NKB Authentication API
```bash
cd auth-api
cp .env.example .env
# Edit .env with production database credentials and service token
npm install --production
node src/server.js
```

### Step C: Deploy AD Identity Service
```bash
cd ad-identity-service
cp .env.example .env
# Set AD_PROVIDER=active-directory, AD service account, and expected token
npm install --production
node src/server.js
```

---

## 2. Automated Testing Verification

Execute the 34-scenario integration test harness:
```bash
cd integration-tests
node test_runner.js
```

---

## 3. Windows Endpoint Credential Provider Installation

Run PowerShell as **Administrator**:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope Process
.\installer\Register-NKBCredentialProvider.ps1 -DllPath "..\credential-provider\build\bin\Release\NKBCredentialProvider.dll" -ApiUrl "https://auth.nkbmanufacturing.com"
```

To remove or uninstall:
```powershell
.\installer\Unregister-NKBCredentialProvider.ps1
```
