<?php
// Unified Account & Password Persistence for Hostinger PHP Backend
// Handles: GET (list), POST (create/reset), PUT (update details/password), DELETE (remove)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/accounts.json';

// Initialize default accounts if accounts.json does not exist
if (!file_exists($dataFile)) {
    $initial = [
        [
            'id' => 1,
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
        ]
    ];
    file_put_contents($dataFile, json_encode($initial, JSON_PRETTY_PRINT));
}

$accounts = json_decode(@file_get_contents($dataFile), true);
if (!is_array($accounts)) {
    $accounts = [];
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

// 1. GET ACCOUNTS
if ($method === 'GET') {
    echo json_encode([
        'success' => true,
        'employees' => $accounts,
        'total_count' => count($accounts)
    ]);
    exit;
}

// 2. CREATE / REGISTER ACCOUNT
if ($method === 'POST') {
    $empId = trim($input['employee_id'] ?? '');
    $newPass = trim($input['new_password'] ?? ($input['password'] ?? ''));

    if (empty($empId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Employee ID is required']);
        exit;
    }

    $existingIdx = -1;
    foreach ($accounts as $idx => $acc) {
        if (strcasecmp($acc['employee_id'] ?? '', $empId) === 0) {
            $existingIdx = $idx;
            break;
        }
    }

    if ($existingIdx >= 0) {
        // Update password / info
        if (!empty($newPass)) $accounts[$existingIdx]['password'] = $newPass;
        if (!empty($input['name'])) $accounts[$existingIdx]['name'] = trim($input['name']);
        if (!empty($input['email'])) $accounts[$existingIdx]['email'] = trim($input['email']);
        if (!empty($input['department'])) $accounts[$existingIdx]['department'] = trim($input['department']);
        if (!empty($input['position'])) $accounts[$existingIdx]['position'] = trim($input['position']);
        if (!empty($input['role'])) $accounts[$existingIdx]['role'] = trim($input['role']);
        if (!empty($input['status'])) $accounts[$existingIdx]['status'] = trim($input['status']);
        if (!empty($input['windows_username'])) $accounts[$existingIdx]['windows_username'] = trim($input['windows_username']);
    } else {
        $accounts[] = [
            'id' => count($accounts) + 1,
            'employee_id' => $empId,
            'name' => trim($input['name'] ?? $empId),
            'email' => trim($input['email'] ?? (strtolower(preg_replace('/[^a-z0-9]/', '', $empId)) . '@nkbmanufacturing.com')),
            'department' => trim($input['department'] ?? 'General Operations'),
            'position' => trim($input['position'] ?? 'Staff'),
            'role' => trim($input['role'] ?? 'EMPLOYEE'),
            'password' => !empty($newPass) ? $newPass : 'Password123!',
            'status' => trim($input['status'] ?? 'Active'),
            'windows_username' => trim($input['windows_username'] ?? 'NKBUser'),
            'windows_domain' => '.'
        ];
    }

    file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Account {$empId} saved successfully", 'accounts' => $accounts]);
    exit;
}

// 3. UPDATE / EDIT ACCOUNT
if ($method === 'PUT') {
    $empId = trim($input['employee_id'] ?? ($input['new_employee_id'] ?? ''));
    $existingIdx = -1;

    foreach ($accounts as $idx => $acc) {
        if (strcasecmp($acc['employee_id'] ?? '', $empId) === 0) {
            $existingIdx = $idx;
            break;
        }
    }

    if ($existingIdx >= 0) {
        if (!empty($input['new_employee_id'])) $accounts[$existingIdx]['employee_id'] = trim($input['new_employee_id']);
        if (!empty($input['name'])) $accounts[$existingIdx]['name'] = trim($input['name']);
        if (!empty($input['email'])) $accounts[$existingIdx]['email'] = trim($input['email']);
        if (!empty($input['department'])) $accounts[$existingIdx]['department'] = trim($input['department']);
        if (!empty($input['position'])) $accounts[$existingIdx]['position'] = trim($input['position']);
        if (!empty($input['role'])) $accounts[$existingIdx]['role'] = trim($input['role']);
        if (!empty($input['password'])) $accounts[$existingIdx]['password'] = trim($input['password']);
        if (!empty($input['status'])) $accounts[$existingIdx]['status'] = trim($input['status']);
        if (!empty($input['windows_username'])) $accounts[$existingIdx]['windows_username'] = trim($input['windows_username']);
    } else {
        $accounts[] = [
            'id' => count($accounts) + 1,
            'employee_id' => $empId,
            'name' => trim($input['name'] ?? $empId),
            'email' => trim($input['email'] ?? ''),
            'department' => trim($input['department'] ?? 'General'),
            'position' => trim($input['position'] ?? 'Staff'),
            'role' => trim($input['role'] ?? 'EMPLOYEE'),
            'password' => trim($input['password'] ?? 'Password123!'),
            'status' => trim($input['status'] ?? 'Active'),
            'windows_username' => trim($input['windows_username'] ?? 'NKBUser'),
            'windows_domain' => '.'
        ];
    }

    file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Account {$empId} updated successfully"]);
    exit;
}

// 4. DELETE ACCOUNT
if ($method === 'DELETE') {
    $empId = trim($_GET['employee_id'] ?? ($input['employee_id'] ?? ''));
    if (!empty($empId)) {
        $accounts = array_values(array_filter($accounts, function($a) use ($empId) {
            return strcasecmp($a['employee_id'] ?? '', $empId) !== 0;
        }));
        file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));
    }
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Account {$empId} deleted successfully"]);
    exit;
}
