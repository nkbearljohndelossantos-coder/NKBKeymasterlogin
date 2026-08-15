# NKB Manufacturing — Windows Company Login System

A production-ready **Windows 10/11 Credential Provider** and **Active Directory DS Identity Microservice Architecture** for NKB Manufacturing.

---

## 📁 Project Structure

```
NKB-Windows-Login/
├── credential-provider/      # C++ Win32 COM DLL (ICredentialProvider & ICredentialProviderCredential2)
│   ├── include/
│   ├── src/
│   ├── resources/
│   └── CMakeLists.txt
├── auth-api/                 # Node.js / Express REST API for NKB authorization & MySQL
│   ├── src/
│   ├── package.json
│   └── .env.example
├── ad-identity-service/      # Independent Node.js microservice for privileged AD DS operations
│   ├── src/
│   ├── package.json
│   └── .env.example
├── database/                 # MySQL database DDL schemas and migration seeds
│   ├── schema/
│   └── migrations/
├── integration-tests/        # 34-Scenario Automated Integration Test Harness (Mock AD Provider)
│   ├── test_runner.js
│   ├── fixtures/
│   └── .env.test.example
├── installer/                # PowerShell Register/Unregister scripts and build batch files
│   ├── Register-NKBCredentialProvider.ps1
│   ├── Unregister-NKBCredentialProvider.ps1
│   └── build_all.bat
└── docs/                     # Technical, Security, Architecture & API Documentation
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── API_SPECIFICATION.md
    └── INSTALLATION.md
```

---

## 🔒 Security Architecture Highlights

1. **True AD Privilege Boundary**: `ad-identity-service` runs as a separate Node.js process with its own least-privilege service account (`svc-nkb-auth`). The public Auth API holds **no** Active Directory credentials.
2. **Service Token Protection**: Inter-service communication (`/internal/ad/*`) is protected by dynamic service tokens verified using `crypto.timingSafeEqual` to eliminate timing attacks.
3. **Correlation ID Tracking**: Every transaction carries an `x-correlation-id` for end-to-end audit tracing.
4. **Isolated Test Harness**: Automated tests run against isolated mock AD providers without touching production domain controllers.
5. **Zero Password Leakage**: Passwords exist in memory only for the minimum required time and are wiped with `RtlSecureZeroMemory` in C++ and never logged.

---

## 🧪 Running Integration Tests

To run the complete 34-scenario integration test suite:

```bash
cd integration-tests
node test_runner.js
```

All 34 test cases will execute and verify authentication, account lockout, dual-identifier matching, AD lookup/enable/disable/password-reset, service token rejection, and administrative identity reconciliation.
