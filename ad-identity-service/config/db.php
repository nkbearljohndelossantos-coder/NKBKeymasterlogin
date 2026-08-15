<?php
// Hostinger MySQL Database Configuration

define('DB_HOST', 'localhost');
define('DB_NAME', 'u335953510_login_db');
define('DB_USER', 'u335953510_login');
define('DB_PASS', 'NkbManufacturing25');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error_code' => 'DATABASE_CONNECTION_ERROR',
                'message' => 'Cannot connect to Hostinger MySQL database: ' . $e->getMessage()
            ]);
            exit;
        }
    }
    return $pdo;
}
