# NKB Windows Login System — Security Specification & Hardening Guide

## 1. Zero Password Exposure Guarantee

The system strictly adheres to the principle of zero credential leakage:
* **Passwords in RAM Only**: User passwords exist in memory only during active authentication or LDAPS dispatch and are sanitized immediately via `RtlSecureZeroMemory` (C++) or garbage collection scope (Node.js).
* **No Database Storage**: Windows / Active Directory account passwords are never stored in MySQL or file storage.
* **No Registry Secrets**: Registry keys store only COM registration GUIDs and API endpoint URLs; no credentials or tokens are placed in Registry.
* **No Plaintext Logging**: Passwords, password hashes, and service tokens are never logged to flat files, console output, audit records, or exception messages.

---

## 2. Service-to-Service Token Authentication & Rotation

All communication between the `auth-api` and `ad-identity-service` is authenticated via the `x-service-token` HTTP header.

### Validation Details
* **Timing-Safe Equality**: Service token verification is performed using `crypto.timingSafeEqual` in `serviceAuth.middleware.js` to mitigate side-channel timing attacks.
* **Generic 401 Unauthorized**: Any missing, invalid, or truncated token receives a generic `401 Unauthorized` without leaking verification hints.

### Service Token Rotation Procedure
1. Generate a new cryptographically secure secret (minimum 32 bytes):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the environment configuration of the AD Identity Service (`AD_SERVICE_EXPECTED_TOKEN=<new_secret>`).
3. Update the environment configuration of the NKB Authentication API (`AUTH_API_AD_SERVICE_TOKEN=<new_secret>`).
4. Perform rolling service restarts of `ad-identity-service` and `auth-api`. No application code modifications are required.

---

## 3. Correlation ID Tracing (`x-correlation-id`)

Every administrative and authentication request flowing through the system carries a unique UUID correlation ID:
```
IT Admin / Client Request
        ↓ (x-correlation-id: 7c9e6679-7425-40de-944b-e07fc1f90ae7)
NKB Auth API
        ↓ (x-correlation-id propagated)
AD Identity Service
        ↓
Audit Logs & Diagnostics
```
This enables end-to-end audit tracing and failure diagnostics without logging sensitive user credentials.

---

## 4. Least-Privilege Active Directory Delegation

The `ad-identity-service` process must **never** run with Domain Admin credentials:
* **Service Account**: `svc-nkb-auth`
* **Delegated Permissions**:
  * Read property (`sAMAccountName`, `userPrincipalName`, `userAccountControl`, `mail`) on employee OUs (`OU=Employees,DC=NKB,DC=LOCAL`).
  * Reset Password permission on target employee user objects.
  * Write `userAccountControl` (enable/disable account).
* **Disabled Permissions**: No domain schema changes, no access to domain admin accounts, no domain controller replication privileges.

---

## 5. Network Isolation & Firewall Boundaries

* **Internal Service Binding**: The AD Identity Service (`port 3001`) must bind to internal network interfaces or localhost only.
* **Firewall Rules**: Configure firewall rules so only IP addresses of authorized NKB Authentication API servers can connect to port 3001.
* **Transport Encryption (TLS)**: Production deployments across distinct physical/virtual hosts require HTTPS/TLS 1.2+ for REST API endpoints and LDAPS (`port 636`) for Active Directory communication.
