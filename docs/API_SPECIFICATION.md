# NKB Authentication REST API Specification

## Endpoints

### 1. Verify Login Credentials
* **URL**: `POST /api/v1/auth/verify`
* **Access**: Public / Credential Provider
* **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "identifier": "earljohn@nkbmanufacturing.com",
  "password": "Password123!",
  "computer_name": "NKB-PC-001"
}
```
*Note: `identifier` accepts either NKB Email Address OR Employee ID (`EMP-000123`).*

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "employee_id": "EMP-000001",
  "email": "earljohn@nkbmanufacturing.com",
  "name": "Earl John",
  "department": "IT Department",
  "position": "Systems Administrator",
  "role": "IT Admin",
  "windows_username": "EMP-000001",
  "windows_domain": "NKB",
  "password_status": "Normal",
  "authenticated_at": "2026-08-13T06:30:00.000Z"
}
```

---

### 2. Administrative Identity Reconciliation Engine
* **URL**: `POST /api/v1/admin/reconcile`
* **Headers**: `Authorization: Bearer <token>` or `x-admin-key: nkb-admin-dev-key`

#### Response (`200 OK`)
```json
{
  "success": true,
  "timestamp": "2026-08-14T07:10:00.000Z",
  "summary": {
    "total_checked": 4,
    "matched": 4,
    "discrepancies_found": 0
  },
  "discrepancies": []
}
```

---

## Internal AD Identity Service Endpoints (Port 3001)

These endpoints run on the independent `ad-identity-service/` process and require service-to-service authentication header `x-service-token`.

* `POST /internal/ad/user/lookup` - Search AD DS user account
* `POST /internal/ad/user/status` - Query AD DS account status
* `POST /internal/ad/user/enable` - Enable AD DS account
* `POST /internal/ad/user/disable` - Disable AD DS account
* `POST /internal/ad/user/password-reset` - Reset AD DS user password over LDAPS (Port 636)
* `POST /internal/ad/reconcile` - Perform identity reconciliation between MySQL and Active Directory
