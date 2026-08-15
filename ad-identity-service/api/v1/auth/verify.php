<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error_code' => 'METHOD_NOT_ALLOWED', 'message' => 'Only POST method is allowed.']);
    exit;
}

require_once __DIR__ . '/../../config/db.php';

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || !isset($data['identifier']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error_code' => 'MISSING_CREDENTIALS',
        'message' => 'Identifier (Email or Employee ID) and password are required.'
    ]);
    exit;
}

$identifier = trim($data['identifier']);
$password = $data['password'];
$computerName = isset($data['computer_name']) ? trim($data['computer_name']) : '';

$pdo = getDB();

// 1. Dual Identifier Lookup (Email OR Employee ID)
$stmt = $pdo->prepare("
    SELECT * FROM employees 
    WHERE LOWER(email) = LOWER(:id1) OR UPPER(employee_id) = UPPER(:id2)
    LIMIT 1
");
$stmt->execute([':id1' => $identifier, ':id2' => $identifier]);
$employee = $stmt->fetch();

if (!$employee) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'INVALID_CREDENTIALS',
        'message' => 'Invalid credentials.'
    ]);
    exit;
}

// 2. Check Account Status (Disabled)
if ($employee['status'] === 'Disabled') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'ACCOUNT_DISABLED',
        'message' => 'Your NKB employee account is disabled. Please contact IT Administration.'
    ]);
    exit;
}

// 3. Check Account Lockout
if ($employee['status'] === 'Locked' || ($employee['lockout_until'] && strtotime($employee['lockout_until']) > time())) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'ACCOUNT_LOCKED',
        'message' => 'Account is temporarily locked due to excessive failed attempts. Please try again later.'
    ]);
    exit;
}

// 4. Check Workstation Computer Assignment (if configured)
if (!empty($computerName)) {
    $compStmt = $pdo->prepare("SELECT COUNT(*) as total FROM employee_computers WHERE employee_id = :empId");
    $compStmt->execute([':empId' => $employee['employee_id']]);
    $hasAssignments = $compStmt->fetchColumn() > 0;

    if ($hasAssignments) {
        $checkStmt = $pdo->prepare("
            SELECT COUNT(*) FROM employee_computers 
            WHERE employee_id = :empId AND UPPER(computer_hostname) = UPPER(:comp)
        ");
        $checkStmt->execute([':empId' => $employee['employee_id'], ':comp' => $computerName]);
        if ($checkStmt->fetchColumn() == 0) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error_code' => 'UNAUTHORIZED_COMPUTER',
                'message' => 'You are not authorized to sign in on this workstation.'
            ]);
            exit;
        }
    }
}

// 5. Verify Password Hash
$passwordValid = password_verify($password, $employee['password_hash']);

if (!$passwordValid) {
    // Increment failed attempts
    $newFailed = $employee['failed_login_attempts'] + 1;
    $lockoutUntil = null;
    $newStatus = $employee['status'];

    if ($newFailed >= 5) {
        $newStatus = 'Locked';
        $lockoutUntil = date('Y-m-d H:i:s', time() + (15 * 60)); // 15 mins
    }

    $updateStmt = $pdo->prepare("
        UPDATE employees 
        SET failed_login_attempts = :failed, status = :st, lockout_until = :lock 
        WHERE id = :id
    ");
    $updateStmt->execute([
        ':failed' => $newFailed,
        ':st' => $newStatus,
        ':lock' => $lockoutUntil,
        ':id' => $employee['id']
    ]);

    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error_code' => 'INVALID_CREDENTIALS',
        'message' => 'Invalid credentials.'
    ]);
    exit;
}

// 6. Reset Failed Attempts on Success
$resetStmt = $pdo->prepare("
    UPDATE employees 
    SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = NOW() 
    WHERE id = :id
");
$resetStmt->execute([':id' => $employee['id']]);

// 7. Retrieve Windows Domain Mapping
$mapStmt = $pdo->prepare("SELECT * FROM windows_account_mappings WHERE employee_id = :empId LIMIT 1");
$mapStmt->execute([':empId' => $employee['employee_id']]);
$mapping = $mapStmt->fetch();

$windowsUsername = $mapping ? $mapping['windows_username'] : $employee['employee_id'];
$windowsDomain = $mapping ? $mapping['windows_domain'] : 'NKB';

// 8. Return Success Payload matching Windows Credential Provider
http_response_code(200);
echo json_encode([
    'success' => true,
    'employee_id' => $employee['employee_id'],
    'email' => $employee['email'],
    'name' => $employee['name'],
    'department' => $employee['department'],
    'position' => $employee['position'],
    'role' => $employee['role'],
    'windows_username' => $windowsUsername,
    'windows_domain' => $windowsDomain,
    'password_status' => $employee['password_status'],
    'authenticated_at' => gmdate('Y-m-d\TH:i:s\Z')
]);
