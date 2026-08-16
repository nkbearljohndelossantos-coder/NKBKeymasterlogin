<?php
// Hostinger MySQL Database Connection Helper
// Auto-initializes schema and provides clean PDO instance

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $dbname = getenv('DB_NAME') ?: 'u335953510_login_db';
    $user = getenv('DB_USER') ?: 'u335953510_login';
    $pass = getenv('DB_PASS') ?: 'NkbManufacturing25';

    try {
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ];
        $pdo = new PDO($dsn, $user, $pass, $options);
        ensureTablesExist($pdo);
        return $pdo;
    } catch (PDOException $e) {
        // Log error but allow fallback
        error_log("[DB Error] " . $e->getMessage());
        return null;
    }
}

function ensureTablesExist($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `employees` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `employee_id` VARCHAR(50) NOT NULL UNIQUE,
                `name` VARCHAR(150) NOT NULL,
                `email` VARCHAR(150) NOT NULL UNIQUE,
                `department` VARCHAR(100) DEFAULT NULL,
                `position` VARCHAR(100) DEFAULT NULL,
                `role` VARCHAR(50) DEFAULT 'EMPLOYEE',
                `password_hash` VARCHAR(255) NOT NULL,
                `status` ENUM('Active', 'Disabled', 'Locked') DEFAULT 'Active',
                `windows_username` VARCHAR(100) DEFAULT 'NKBUser',
                `windows_domain` VARCHAR(100) DEFAULT '.',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `computer_authorizations` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `employee_id` VARCHAR(50) NOT NULL,
                `computer_hostname` VARCHAR(100) NOT NULL,
                `authorized_by` VARCHAR(100) DEFAULT 'SUPER_ADMIN',
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY `idx_emp_comp` (`employee_id`, `computer_hostname`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `audit_logs` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `employee_id` VARCHAR(50) DEFAULT NULL,
                `computer_hostname` VARCHAR(100) DEFAULT NULL,
                `event_type` VARCHAR(50) NOT NULL,
                `status` ENUM('SUCCESS', 'FAILURE') NOT NULL,
                `details` TEXT DEFAULT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Insert default Super Admin if not exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `employees` WHERE `employee_id` = 'EMP-000001'");
        $stmt->execute();
        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("INSERT INTO `employees` (`employee_id`, `name`, `email`, `department`, `position`, `role`, `password_hash`, `status`, `windows_username`, `windows_domain`) VALUES ('EMP-000001', 'Earl John Delos Santos', 'earljohn@nkbmanufacturing.com', 'IT Administration', 'Systems Administrator', 'SUPER_ADMIN', 'Password123!', 'Active', 'NKBUser', '.')");
            $stmt->execute();
        }
    } catch (Exception $e) {
        error_log("[DB Init Error] " . $e->getMessage());
    }
}
