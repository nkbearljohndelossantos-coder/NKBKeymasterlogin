-- ========================================================
-- NKB MANUFACTURING - ENTERPRISE RBAC ARCHITECTURE
-- Database: u335953510_login_db
-- ========================================================

-- 1. Table: roles
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

-- 2. Table: permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `permission_key` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_permission_key` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: role_permissions (Many-to-Many RBAC Mapping)
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `granted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: user_roles (Many-to-Many Employee to Roles)
CREATE TABLE IF NOT EXISTS `user_roles` (
  `employee_id` VARCHAR(50) NOT NULL,
  `role_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`, `role_id`),
  CONSTRAINT `fk_ur_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- INITIAL SEED: ROLES & PERMISSIONS
-- ========================================================

-- Insert Roles
INSERT INTO `roles` (`id`, `role_name`, `display_name`, `description`, `is_system_role`)
VALUES 
(1, 'SUPER_ADMIN', 'Super Administrator', 'Full access to all system functions, database, security, and employee management.', 1),
(2, 'IT_ADMIN', 'IT Administrator', 'Manage workstation PCs, reset passwords, view security audit logs.', 1),
(3, 'HR_MANAGER', 'HR Manager', 'Register and edit employee information, departments, and personnel records.', 1),
(4, 'SUPERVISOR', 'Line Supervisor', 'View team presence, check workstation occupancy, approve local PC requests.', 1),
(5, 'EMPLOYEE', 'Standard Employee', 'Standard Windows workstation login and personal profile access.', 1)
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`);

-- Insert Granular Permissions
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

-- Assign Permissions to Roles
-- SUPER_ADMIN (Gets All Permissions 1 - 10)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- IT_ADMIN (Employee management, security, workstations, audits)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- HR_MANAGER (Employee registration and roster view)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 1), (3, 2), (3, 3)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- SUPERVISOR (Roster read and workstation view)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 2), (4, 9)
ON DUPLICATE KEY UPDATE `permission_id`=VALUES(`permission_id`);

-- Assign Initial User Roles
INSERT INTO `user_roles` (`employee_id`, `role_id`) VALUES
('EMP-000001', 1), -- Earl John as Super Admin
('EMP-000123', 5)  -- Juan Dela Cruz as Standard Employee
ON DUPLICATE KEY UPDATE `role_id`=VALUES(`role_id`);
