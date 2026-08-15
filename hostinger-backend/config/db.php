<?php
// Hostinger MySQL Database Configuration
// Edit these credentials to match your Hostinger Database

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'u123456_nkb_auth_db'); // Palitan ng Hostinger Database Name mo
define('DB_USER', 'u123456_nkb_admin');   // Palitan ng Hostinger Database Username mo
define('DB_PASS', 'NkbHostingerSecurePass2026!'); // Palitan ng Hostinger Database Password mo

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
                'message' => 'Cannot connect to Hostinger MySQL database. Check db.php credentials.'
            ]);
            exit;
        }
    }
    return $pdo;
}
