<?php
// Dedicated MySQL Connection Diagnostic Tester
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$startTime = microtime(true);
$host = getenv('DB_HOST') ?: '127.0.0.1';
$dbname = getenv('DB_NAME') ?: 'u335953510_login_db';
$user = getenv('DB_USER') ?: 'u335953510_login';
$pass = getenv('DB_PASS') ?: 'NkbManufacturing25';

$response = [
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    'target_database' => $dbname,
    'target_host' => $host,
    'target_user' => $user
];

try {
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 3
    ];
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Run live test query
    $stmt = $pdo->query("SELECT VERSION() AS mysql_version, DATABASE() AS current_db");
    $dbInfo = $stmt->fetch();

    // Check table counts
    $empCountStmt = $pdo->query("SELECT COUNT(*) AS count FROM `employees`");
    $empCount = $empCountStmt->fetch()['count'] ?? 0;

    $auditCountStmt = $pdo->query("SELECT COUNT(*) AS count FROM `audit_logs`");
    $auditCount = $auditCountStmt->fetch()['count'] ?? 0;

    $elapsed = round((microtime(true) - $startTime) * 1000, 2);

    $response['status'] = 'SUCCESS';
    $response['connected'] = true;
    $response['message'] = 'MySQL Database connected and operational!';
    $response['server_version'] = $dbInfo['mysql_version'];
    $response['database_name'] = $dbInfo['current_db'];
    $response['latency_ms'] = "{$elapsed} ms";
    $response['tables'] = [
        'employees' => (int)$empCount,
        'audit_logs' => (int)$auditCount
    ];
    http_response_code(200);
} catch (PDOException $e) {
    $elapsed = round((microtime(true) - $startTime) * 1000, 2);
    $response['status'] = 'ERROR';
    $response['connected'] = false;
    $response['message'] = 'Failed to connect to MySQL database: ' . $e->getMessage();
    $response['error_code'] = $e->getCode();
    $response['latency_ms'] = "{$elapsed} ms";
    http_response_code(500);
}

echo json_encode($response, JSON_PRETTY_PRINT);
