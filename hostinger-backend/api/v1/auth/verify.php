<?php
// PHP Authentication Verification Endpoint with Dynamic Password Matching
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$cleanId = trim($input['identifier'] ?? '');
$rawPass = trim($input['password'] ?? '');

if (empty($cleanId) || empty($rawPass)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error_code' => 'MISSING_CREDENTIALS',
        'message' => 'Identifier and password are required.'
    ]);
    exit;
}

// 1. Check persistent accounts.json
$dataFile = __DIR__ . '/../admin/accounts.json';
$accounts = file_exists($dataFile) ? (json_decode(file_get_contents($dataFile), true) ?? []) : [];

$matchedAcc = null;
foreach ($accounts as $acc) {
    if (strcasecmp($acc['employee_id'] ?? '', $cleanId) === 0 || strcasecmp($acc['email'] ?? '', $cleanId) === 0) {
        $matchedAcc = $acc;
        break;
    }
}

// 2. Check default super admin
if (!$matchedAcc && (strcasecmp($cleanId, 'EMP-000001') === 0 || strcasecmp($cleanId, 'earljohn@nkbmanufacturing.com') === 0 || strcasecmp($cleanId, 'admin') === 0)) {
    $matchedAcc = [
        'employee_id' => 'EMP-000001',
        'name' => 'Earl John Delos Santos',
        'email' => 'earljohn@nkbmanufacturing.com',
        'department' => 'IT Administration',
        'position' => 'Systems Administrator',
        'role' => 'SUPER_ADMIN',
        'password' => 'Password123!',
        'status' => 'Active',
        'windows_username' => 'NKBUser',
        'windows_domain' => '.'
    ];
}

// 3. Fallback to Canteen Directory
if (!$matchedAcc) {
    $canteenJson = @file_get_contents('https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026');
    $canteenEmployees = json_decode($canteenJson, true) ?? [];
    foreach ($canteenEmployees as $emp) {
        if (strcasecmp($emp['employee_id'] ?? '', $cleanId) === 0 || strcasecmp($emp['barcode_number'] ?? '', $cleanId) === 0) {
            $matchedAcc = [
                'employee_id' => $emp['employee_id'],
                'name' => $emp['name'],
                'email' => strtolower(preg_replace('/[^a-z0-9]/', '', $emp['employee_id'])) . '@nkbmanufacturing.com',
                'department' => $emp['department'] ?? 'General Operations',
                'position' => $emp['position'] ?? 'Staff',
                'role' => 'EMPLOYEE',
                'password' => 'Password123!',
                'status' => (strtolower($emp['status'] ?? 'active') === 'active') ? 'Active' : 'Disabled',
                'windows_username' => 'NKBUser',
                'windows_domain' => '.'
            ];
            break;
        }
    }
}

if (!$matchedAcc) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'INVALID_CREDENTIALS',
        'message' => 'Employee ID or email not found in directory.'
    ]);
    exit;
}

if (strcasecmp($matchedAcc['status'] ?? 'Active', 'Active') !== 0) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'ACCOUNT_DISABLED',
        'message' => 'Account is disabled or inactive.'
    ]);
    exit;
}

// 4. Validate Password against current saved password or master fallback
$expectedPass = $matchedAcc['password'] ?? 'Password123!';
if ($rawPass !== $expectedPass && $rawPass !== 'Password123!' && $rawPass !== 'NkbManufacturing25') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'INVALID_CREDENTIALS',
        'message' => 'Incorrect password.'
    ]);
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'employee_id' => $matchedAcc['employee_id'],
    'email' => $matchedAcc['email'],
    'name' => $matchedAcc['name'],
    'department' => $matchedAcc['department'] ?? 'General Operations',
    'position' => $matchedAcc['position'] ?? 'Staff',
    'role' => $matchedAcc['role'] ?? 'EMPLOYEE',
    'windows_username' => $matchedAcc['windows_username'] ?? 'NKBUser',
    'windows_domain' => $matchedAcc['windows_domain'] ?? '.',
    'password_status' => 'Normal',
    'authenticated_at' => gmdate('Y-m-d\TH:i:s\Z')
]);
