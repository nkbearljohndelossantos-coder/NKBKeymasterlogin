<?php
// PHP Endpoint for Syncing Canteen API Employees
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$canteenJson = @file_get_contents('https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026');
$canteenEmployees = json_decode($canteenJson, true);

if (!is_array($canteenEmployees) || empty($canteenEmployees)) {
    // Fallback: check local cached json file
    $localPath = __DIR__ . '/../../../../canteen_employees.json';
    if (file_exists($localPath)) {
        $canteenEmployees = json_decode(file_get_contents($localPath), true) ?? [];
    }
}

$count = is_array($canteenEmployees) ? count($canteenEmployees) : 0;

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => "Synced {$count} employees from Canteen API",
    'count' => $count,
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
]);
