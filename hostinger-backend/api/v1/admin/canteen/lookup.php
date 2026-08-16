<?php
// PHP Real-Time Employee Lookup Endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$queryId = strtoupper(trim($_GET['id'] ?? ''));
if (empty($queryId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID parameter is required']);
    exit;
}

$canteenJson = @file_get_contents('https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026');
$canteenEmployees = json_decode($canteenJson, true);

if (!is_array($canteenEmployees) || empty($canteenEmployees)) {
    $localPath = __DIR__ . '/../../../../canteen_employees.json';
    if (file_exists($localPath)) {
        $canteenEmployees = json_decode(file_get_contents($localPath), true) ?? [];
    }
}

$matched = null;
if (is_array($canteenEmployees)) {
    foreach ($canteenEmployees as $emp) {
        $empId = strtoupper(trim($emp['employee_id'] ?? ''));
        $barcode = strtoupper(trim($emp['barcode_number'] ?? ''));
        if ($empId === $queryId || $barcode === $queryId || str_ends_with($empId, $queryId) || str_ends_with($barcode, $queryId)) {
            $matched = $emp;
            break;
        }
    }
}

if ($matched) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'employee' => [
            'employee_id' => $matched['employee_id'],
            'email' => strtolower(preg_replace('/[^a-z0-9]/', '', $matched['employee_id'])) . '@nkbmanufacturing.com',
            'name' => $matched['name'],
            'department' => $matched['department'] ?? 'General Operations',
            'position' => $matched['position'] ?? 'Staff',
            'status' => (strtolower($matched['status'] ?? 'active') === 'active') ? 'Active' : 'Disabled',
            'windows_username' => 'NKBUser',
            'windows_domain' => '.'
        ]
    ]);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Employee not found']);
}
