# NKB Manufacturing Windows Login Architecture

## Identity & Microservice Process Architecture

The NKB Manufacturing Windows Login System separates **NKB Application Authorization** from **Privileged Active Directory DS Operations** into independent, decoupled microservice processes.

> [!CRITICAL]
> **True AD Identity Service Process Boundary**
> 
> The general NKB Authentication API does **NOT** hold Active Directory credentials or direct LDAP connections. All privileged Active Directory actions are isolated inside the independent **AD Identity Service** (`ad-identity-service/`).

```
┌─────────────────────────────────────────────────────────────┐
│                 NKB IT Management System                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Administrative Requests (HTTPS / JWT)
                               v
┌─────────────────────────────────────────────────────────────┐
│          NKB Authentication REST API (Port 3000)            │
│  - Evaluates NKB Employee Authorization Policies            │
│  - Dual Identifier Resolution (Email vs. Employee ID)       │
│  - No Direct Active Directory Service Account Credentials   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal Authenticated Request
                               │ (x-service-token: nkb-ad-service-secret...)
                               v
┌─────────────────────────────────────────────────────────────┐
│            AD Identity Service Process (Port 3001)          │
│  - Dedicated Independent Node.js Express Microservice       │
│  - Enforces Service-to-Service Token Authentication         │
│  - Operates under Least-Privilege Account (svc-nkb-auth)    │
│  - Internal Endpoints: /internal/ad/*                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ LDAPS (TLS 1.2/1.3 / Port 636)
                               v
┌─────────────────────────────────────────────────────────────┐
│             Active Directory Domain Controller              │
│                     (NKB.LOCAL Domain)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Service-to-Service Security & Privileges

### 1. Service Token Authentication
- Requests from the NKB Authentication API to the AD Identity Service must include the `x-service-token` header.
- Anonymous or unauthenticated requests to `/internal/ad/*` are rejected with `401 Unauthorized` or `403 Forbidden`.

### 2. Least-Privilege AD Service Account
- The AD Identity Service connects using a dedicated non-Domain-Admin service account (`svc-nkb-auth`).
- Delegated OU permissions are strictly restricted to:
  - User lookup & status query
  - Account enable / disable
  - Password reset over LDAPS (`port 636`)
  - Identity reconciliation auditing

### 3. Password Security & Memory Sanitization
- Passwords exist in RAM only during LDAPS dispatch and are never stored in MySQL, written to disk, logged in flat files, or returned in REST API responses.

---

## 🔄 Administrative Identity Reconciliation Engine

The system provides an IT Admin reconciliation engine (`POST /api/v1/admin/reconcile` → `POST /internal/ad/reconcile`) to verify consistency across identity stores:

```
NKB Employee ID ↔ NKB Email ↔ Windows Username ↔ AD Account Status ↔ Computer Assignments
```

### Detected Discrepancies:
1. **Missing AD Account**: NKB employee record has no matching Active Directory account.
2. **Incorrect AD Mapping**: Mismatch between NKB Windows username mapping and AD user account.
3. **Status Mismatch**: Employee disabled in NKB API while Active Directory account is Enabled (or vice versa).
4. **Computer Assignment Mismatch**: Employee assigned to unauthorized workstation.
