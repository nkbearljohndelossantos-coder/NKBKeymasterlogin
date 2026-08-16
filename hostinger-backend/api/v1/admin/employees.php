<?php
// Unified Real-Time MySQL Employee API for Hostinger
require_once __DIR__ . '/../../db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = getDbConnection();
$dataFile = __DIR__ . '/accounts.json';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

// 1. GET ALL EMPLOYEES (From MySQL)
if ($method === 'GET') {
    $employees = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT id, employee_id, name, email, department, position, role, password_hash AS password, status, windows_username, windows_domain FROM `employees` ORDER BY id ASC");
            $employees = $stmt->fetchAll();
        } catch (Exception $e) {
            error_log("[DB Read Error] " . $e->getMessage());
        }
    }

    // Fallback if DB empty or error
    if (empty($employees)) {
        if (file_exists($dataFile)) {
            $employees = json_decode(file_get_contents($dataFile), true) ?? [];
        }
        if (empty($employees)) {
            $employees = [
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
        }
    }

    echo json_encode([
        'success' => true,
        'employees' => $employees,
        'total_count' => count($employees),
        'database_connected' => ($pdo !== null)
    ]);
    exit;
}

// 2. CREATE / REGISTER EMPLOYEE (Insert to MySQL)
if ($method === 'POST') {
    $empId = trim($input['employee_id'] ?? '');
    $name = trim($input['name'] ?? $empId);
    $email = trim($input['email'] ?? (strtolower(preg_replace('/[^a-z0-9]/', '', $empId)) . '@nkbmanufacturing.com'));
    $department = trim($input['department'] ?? 'General Operations');
    $position = trim($input['position'] ?? 'Staff');
    $role = trim($input['role'] ?? 'EMPLOYEE');
    $password = trim($input['new_password'] ?? ($input['password'] ?? 'Password123!'));
    $status = trim($input['status'] ?? 'Active');
    $winUser = trim($input['windows_username'] ?? 'NKBUser');
    $winDomain = trim($input['windows_domain'] ?? '.');

    if (empty($empId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Employee ID is required']);
        exit;
    }

    $dbSuccess = false;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `employees` 
                (`employee_id`, `name`, `email`, `department`, `position`, `role`, `password_hash`, `status`, `windows_username`, `windows_domain`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`),
                    `email` = VALUES(`email`),
                    `department` = VALUES(`department`),
                    `position` = VALUES(`position`),
                    `role` = VALUES(`role`),
                    `password_hash` = VALUES(`password_hash`),
                    `status` = VALUES(`status`),
                    `windows_username` = VALUES(`windows_username`),
                    `windows_domain` = VALUES(`windows_domain`)
            ");
            $stmt->execute([$empId, $name, $email, $department, $position, $role, $password, $status, $winUser, $winDomain]);
            $dbSuccess = true;
        } catch (Exception $e) {
            error_log("[DB Insert Error] " . $e->getMessage());
        }
    }

    // Also sync to local JSON backup
    $accounts = file_exists($dataFile) ? (json_decode(file_get_contents($dataFile), true) ?? []) : [];
    $idx = -1;
    foreach ($accounts as $k => $a) {
        if (strcasecmp($a['employee_id'] ?? '', $empId) === 0) { $idx = $k; break; }
    }
    $record = [
        'id' => ($idx >= 0) ? $accounts[$idx]['id'] : count($accounts) + 1,
        'employee_id' => $empId, 'name' => $name, 'email' => $email,
        'department' => $department, 'position' => $position, 'role' => $role,
        'password' => $password, 'status' => $status,
        'windows_username' => $winUser, 'windows_domain' => $winDomain
    ];
    if ($idx >= 0) $accounts[$idx] = $record;
    else $accounts[] = $record;
    file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Employee {$empId} successfully registered in MySQL Database!",
        'database_synced' => $dbSuccess
    ]);
    exit;
}

// 3. UPDATE / EDIT EMPLOYEE (Update in MySQL)
if ($method === 'PUT') {
    $originalEmpId = trim($input['employee_id'] ?? ($input['new_employee_id'] ?? ''));
    $newEmpId = trim($input['new_employee_id'] ?? $originalEmpId);
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $department = trim($input['department'] ?? '');
    $position = trim($input['position'] ?? '');
    $role = trim($input['role'] ?? 'EMPLOYEE');
    $password = trim($input['password'] ?? '');
    $status = trim($input['status'] ?? 'Active');
    $winUser = trim($input['windows_username'] ?? 'NKBUser');
    $winDomain = trim($input['windows_domain'] ?? '.');

    $dbSuccess = false;
    if ($pdo && !empty($originalEmpId)) {
        try {
            $sql = "UPDATE `employees` SET 
                        `employee_id` = ?, 
                        `name` = ?, 
                        `email` = ?, 
                        `department` = ?, 
                        `position` = ?, 
                        `role` = ?, 
                        `status` = ?, 
                        `windows_username` = ?, 
                        `windows_domain` = ?";
            $params = [$newEmpId, $name, $email, $department, $position, $role, $status, $winUser, $winDomain];
            
            if (!empty($password)) {
                $sql .= ", `password_hash` = ?";
                $params[] = $password;
            }
            $sql .= " WHERE `employee_id` = ?";
            $params[] = $originalEmpId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $dbSuccess = true;
        } catch (Exception $e) {
            error_log("[DB Update Error] " . $e->getMessage());
        }
    }

    // Also update JSON backup
    $accounts = file_exists($dataFile) ? (json_decode(file_get_contents($dataFile), true) ?? []) : [];
    foreach ($accounts as &$a) {
        if (strcasecmp($a['employee_id'] ?? '', $originalEmpId) === 0) {
            $a['employee_id'] = $newEmpId;
            if (!empty($name)) $a['name'] = $name;
            if (!empty($email)) $a['email'] = $email;
            if (!empty($department)) $a['department'] = $department;
            if (!empty($position)) $a['position'] = $position;
            if (!empty($role)) $a['role'] = $role;
            if (!empty($password)) $a['password'] = $password;
            if (!empty($status)) $a['status'] = $status;
            if (!empty($winUser)) $a['windows_username'] = $winUser;
            if (!empty($winDomain)) $a['windows_domain'] = $winDomain;
            break;
        }
    }
    file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Employee {$newEmpId} successfully updated in MySQL Database!",
        'database_synced' => $dbSuccess
    ]);
    exit;
}

// 4. DELETE EMPLOYEE (Delete from MySQL)
if ($method === 'DELETE') {
    $empId = trim($_GET['employee_id'] ?? ($input['employee_id'] ?? ''));
    if ($pdo && !empty($empId)) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `employees` WHERE `employee_id` = ?");
            $stmt->execute([$empId]);
        } catch (Exception $e) {
            error_log("[DB Delete Error] " . $e->getMessage());
        }
    }

    $accounts = file_exists($dataFile) ? (json_decode(file_get_contents($dataFile), true) ?? []) : [];
    $accounts = array_values(array_filter($accounts, function($a) use ($empId) {
        return strcasecmp($a['employee_id'] ?? '', $empId) !== 0;
    }));
    file_put_contents($dataFile, json_encode($accounts, JSON_PRETTY_PRINT));

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Employee {$empId} removed from MySQL Database!"]);
    exit;
}
