-- ========================================================
-- NKB MANUFACTURING - ALL-IN-ONE HOSTINGER DATABASE SETUP
-- Database: u335953510_login_db (With Enterprise RBAC)
-- ========================================================

-- 1. Table: employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
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

-- 6. Table: roles (RBAC)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_system_role` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: permissions (RBAC)
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `permission_key` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_permission_key` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: role_permissions (RBAC Mapping)
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `granted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: user_roles (RBAC User Mapping)
CREATE TABLE IF NOT EXISTS `user_roles` (
  `employee_id` VARCHAR(50) NOT NULL,
  `role_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`, `role_id`),
  CONSTRAINT `fk_ur_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED DATA: EMPLOYEES & WORKSTATIONS
-- ========================================================
INSERT INTO `employees` (`employee_id`, `email`, `name`, `department`, `position`, `role`, `status`, `password_hash`, `password_status`)
VALUES 
('EMP-000001', 'earljohn@nkbmanufacturing.com', 'Earl John', 'IT Administration', 'Systems Administrator', 'SUPER_ADMIN', 'Active', '$2b$12$e/hZ6.n7aZeqoR.8hVq5UOz352pU8hO2wX2FvO1bK5fL3aK8J3k7m', 'Normal'),
('EMP-000123', 'juan.delacruz@nkbmanufacturing.com', 'Juan Dela Cruz', 'Manufacturing Ops', 'Assembly Line Lead', 'EMPLOYEE', 'Active', '$2b$12$e/hZ6.n7aZeqoR.8hVq5UOz352pU8hO2wX2FvO1bK5fL3aK8J3k7m', 'Normal')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `windows_account_mappings` (`employee_id`, `windows_username`, `windows_domain`)
VALUES 
('EMP-000001', 'NKBUser', '.'),
('EMP-000123', 'NKBUser', '.')
ON DUPLICATE KEY UPDATE `windows_username`=VALUES(`windows_username`);

INSERT INTO `computers` (`hostname`, `description`, `status`)
VALUES 
('NKBMANUF', 'Main IT Admin Workstation', 'Active'),
('NKB-PC-001', 'Plant Floor Assembly Terminal', 'Active'),
('NKB-PC-002', 'Quality Control Station', 'Active')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `employee_computers` (`employee_id`, `computer_hostname`)
VALUES 
('EMP-000001', 'NKBMANUF'),
('EMP-000001', 'NKB-PC-001'),
('EMP-000123', 'NKBMANUF'),
('EMP-000123', 'NKB-PC-002')
ON DUPLICATE KEY UPDATE `computer_hostname`=VALUES(`computer_hostname`);

-- ========================================================
-- SEED DATA: RBAC ROLES & PERMISSIONS
-- ========================================================
INSERT INTO `roles` (`id`, `role_name`, `display_name`, `description`, `is_system_role`)
VALUES 
(1, 'SUPER_ADMIN', 'Super Administrator', 'Full access to all system functions, database, security, and employee management.', 1),
(2, 'IT_ADMIN', 'IT Administrator', 'Manage workstation PCs, reset passwords, view security audit logs.', 1),
(3, 'HR_MANAGER', 'HR Manager', 'Register and edit employee information, departments, and personnel records.', 1),
(4, 'SUPERVISOR', 'Line Supervisor', 'View team presence, check workstation occupancy, approve local PC requests.', 1),
(5, 'EMPLOYEE', 'Standard Employee', 'Standard Windows workstation login and personal profile access.', 1)
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`);

INSERT INTO `permissions` (`id`, `permission_key`, `category`, `description`)
VALUES 
(1, 'employee:create', 'Employees', 'Register new employee accounts'),
(2, 'employee:read', 'Employees', 'View employee roster and profile info'),
(3, 'employee:update', 'Employees', 'Edit employee names, IDs, departments, positions'),
(4, 'employee:delete', 'Employees', 'Archive or delete employee accounts'),
(5, 'employee:reset_password', 'Security', 'Reset employee Windows / portal passwords'),
(6, 'employee:lock_unlock', 'Security', 'Lock or suspend employee login access'),
(7, 'workstation:authorize', 'Workstations', 'Assign and authorize physical PCs for employees'),
(8, 'workstation:manage', 'Workstations', 'Add, edit, or decommission company workstations'),
(9, 'audit:read', 'Audit', 'View sign-in history, device logs, security trail'),
(10, 'rbac:manage', 'RBAC', 'Assign roles and permissions to users')
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

-- Super Admin gets all 1-10
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- IT Admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- HR Manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 1), (3, 2), (3, 3)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- Supervisor
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 2), (4, 9)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- User Role Assignments
INSERT INTO `user_roles` (`employee_id`, `role_id`) VALUES
('EMP-000001', 1),
('EMP-000123', 5)
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);
