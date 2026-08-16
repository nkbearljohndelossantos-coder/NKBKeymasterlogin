-- ========================================================
-- NKB MANUFACTURING - HOSTINGER DATABASE INITIALIZATION
-- Database: u335953510_login_db
-- ========================================================

-- 1. Table: employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `role` ENUM('Employee', 'IT Admin', 'Manager') NOT NULL DEFAULT 'Employee',
  `status` ENUM('Active', 'Disabled', 'Locked') NOT NULL DEFAULT 'Active',
  `password_hash` VARCHAR(255) NOT NULL,
  `password_status` ENUM('Normal', 'MustChange') NOT NULL DEFAULT 'Normal',
  `failed_login_attempts` INT NOT NULL DEFAULT 0,
  `lockout_until` DATETIME NULL DEFAULT NULL,
  `last_login_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_employee_id` (`employee_id`),
  UNIQUE KEY `uk_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: windows_account_mappings
CREATE TABLE IF NOT EXISTS `windows_account_mappings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `windows_username` VARCHAR(100) NOT NULL,
  `windows_domain` VARCHAR(100) NOT NULL DEFAULT '.',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_employee_windows` (`employee_id`),
  CONSTRAINT `fk_mapping_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: computers
CREATE TABLE IF NOT EXISTS `computers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hostname` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `status` ENUM('Active', 'Decommissioned', 'Maintenance') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_hostname` (`hostname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: employee_computers
CREATE TABLE IF NOT EXISTS `employee_computers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `computer_hostname` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_emp_comp` (`employee_id`, `computer_hostname`),
  CONSTRAINT `fk_emp_comp_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_comp_computer` FOREIGN KEY (`computer_hostname`) REFERENCES `computers` (`hostname`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `identifier_used` VARCHAR(255) NOT NULL,
  `employee_id` VARCHAR(50) NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `outcome` ENUM('SUCCESS', 'FAILURE', 'BLOCKED', 'LOCKOUT') NOT NULL,
  `computer_name` VARCHAR(100) NULL,
  `ip_address` VARCHAR(45) NULL,
  `details` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_identifier` (`identifier_used`),
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_event_outcome` (`event_type`, `outcome`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INITIAL SEED DATA (Default Password: Password123!)
-- Bcrypt Hash: $2b$12$e/hZ6.n7aZeqoR.8hVq5UOz352pU8hO2wX2FvO1bK5fL3aK8J3k7m
-- ========================================================

INSERT INTO `employees` (`employee_id`, `email`, `name`, `department`, `position`, `role`, `status`, `password_hash`, `password_status`)
VALUES 
('EMP-000001', 'earljohn@nkbmanufacturing.com', 'Earl John', 'IT Administration', 'Systems Administrator', 'IT Admin', 'Active', '$2b$12$e/hZ6.n7aZeqoR.8hVq5UOz352pU8hO2wX2FvO1bK5fL3aK8J3k7m', 'Normal'),
('EMP-000123', 'juan.delacruz@nkbmanufacturing.com', 'Juan Dela Cruz', 'Manufacturing Ops', 'Assembly Line Lead', 'Employee', 'Active', '$2b$12$e/hZ6.n7aZeqoR.8hVq5UOz352pU8hO2wX2FvO1bK5fL3aK8J3k7m', 'Normal')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Map to Local Windows Account NKBUser
INSERT INTO `windows_account_mappings` (`employee_id`, `windows_username`, `windows_domain`)
VALUES 
('EMP-000001', 'NKBUser', '.'),
('EMP-000123', 'NKBUser', '.')
ON DUPLICATE KEY UPDATE `windows_username`=VALUES(`windows_username`);

-- Register Company Computers
INSERT INTO `computers` (`hostname`, `description`, `status`)
VALUES 
('NKBMANUF', 'Main IT Admin Workstation', 'Active'),
('NKB-PC-001', 'Plant Floor Assembly Terminal', 'Active'),
('NKB-PC-002', 'Quality Control Station', 'Active')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- Authorize Computers
INSERT INTO `employee_computers` (`employee_id`, `computer_hostname`)
VALUES 
('EMP-000001', 'NKBMANUF'),
('EMP-000001', 'NKB-PC-001'),
('EMP-000123', 'NKBMANUF'),
('EMP-000123', 'NKB-PC-002')
ON DUPLICATE KEY UPDATE `computer_hostname`=VALUES(`computer_hostname`);
