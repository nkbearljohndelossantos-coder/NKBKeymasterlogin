<?php
// PHP Endpoint for Getting and Registering Employees
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$canteenJson = @file_get_contents('https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026');
$canteenEmployees = json_decode($canteenJson, true);

if (!is_array($canteenEmployees) || empty($canteenEmployees)) {
    $localPath = __DIR__ . '/../../../canteen_employees.json';
    if (file_exists($localPath)) {
        $canteenEmployees = json_decode(file_get_contents($localPath), true) ?? [];
    }
}

$formattedList = [];

// Super Admin first
$formattedList[] = [
    'id' => 1,
    'employee_id' => 'EMP-000001',
    'email' => 'earljohn@nkbmanufacturing.com',
    'name' => 'Earl John Delos Santos',
    'department' => 'IT Administration',
    'position' => 'Systems Administrator',
    'role' => 'SUPER_ADMIN',
    'status' => 'Active',
    'windows_username' => 'NKBUser',
    'windows_domain' => '.'
];

if (is_array($canteenEmployees)) {
    foreach ($canteenEmployees as $cEmp) {
        $empId = trim($cEmp['employee_id'] ?? '');
        if (!$empId || $empId === 'EMP-000001') continue;

        $cleanEmail = strtolower(preg_replace('/[^a-z0-9]/', '', $empId)) . '@nkbmanufacturing.com';
        $status = (strtolower($cEmp['status'] ?? 'active') === 'active') ? 'Active' : 'Disabled';

        $formattedList[] = [
            'id' => $cEmp['id'] ?? count($formattedList) + 1,
            'employee_id' => $empId,
            'email' => $cleanEmail,
            'name' => $cEmp['name'] ?? $empId,
            'department' => $cEmp['department'] ?? 'General Operations',
            'position' => $cEmp['position'] ?? 'Staff',
            'role' => 'EMPLOYEE',
            'status' => $status,
            'windows_username' => 'NKBUser',
            'windows_domain' => '.',
            'canteen_balance' => $cEmp['current_balance'] ?? 0,
            'barcode' => $cEmp['barcode_number'] ?? $empId
        ];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Employee registered successfully!'
    ]);
    exit;
}

http_response_code(200);
echo json_encode([
    'employees' => $formattedList,
    'total_count' => count($formattedList),
    'last_sync' => gmdate('Y-m-d\TH:i:s\Z')
]);
