<?php
// Health Check Endpoint with Database Diagnostic
require_once __DIR__ . '/api/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = getDbConnection();
$dbConnected = ($pdo !== null);

$response = [
    'status' => $dbConnected ? 'HEALTHY' : 'DEGRADED',
    'service' => 'NKB Manufacturing Windows Authentication & Management Portal',
    'database' => [
        'connected' => $dbConnected,
        'database_name' => 'u335953510_login_db',
        'host' => '127.0.0.1'
    ],
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
];

http_response_code($dbConnected ? 200 : 503);
echo json_encode($response, JSON_PRETTY_PRINT);
