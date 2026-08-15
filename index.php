<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key, x-correlation-id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode([
    'status' => 'ONLINE',
    'service' => 'NKB Manufacturing Windows Authentication API (Hostinger Web Hosting)',
    'version' => '1.0.0',
    'health_check' => '/health.php',
    'api_verify_endpoint' => '/api/v1/auth/verify.php',
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
]);
