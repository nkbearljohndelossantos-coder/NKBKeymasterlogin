-- NKB Manufacturing Windows Company Login System
-- Database Schema Initialization
-- MySQL 8.0+ / MariaDB 10.3+

CREATE DATABASE IF NOT EXISTS `nkb_auth_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nkb_auth_db`;

-- --------------------------------------------------------
-- Table: employees
-- Stores core employee identity, status, and authentication credentials.
-- Supports lookup by either unique employee_id OR unique email.
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Table: windows_account_mappings
-- Maps NKB Employee to their assigned Windows domain/local user account.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `windows_account_mappings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `windows_username` VARCHAR(100) NOT NULL,
  `windows_domain` VARCHAR(100) NOT NULL DEFAULT 'NKB',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_employee_windows` (`employee_id`),
  CONSTRAINT `fk_mapping_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: computers
-- Tracks authorized workstations within NKB Manufacturing.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `computers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hostname` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `status` ENUM('Active', 'Decommissioned', 'Maintenance') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_hostname` (`hostname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: employee_computers
-- Manages employee workstation assignment permissions.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_computers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(50) NOT NULL,
  `computer_hostname` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_emp_comp` (`employee_id`, `computer_hostname`),
  CONSTRAINT `fk_emp_comp_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_comp_computer` FOREIGN KEY (`computer_hostname`) REFERENCES `computers` (`hostname`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: audit_logs
-- Immutable security event logs for compliance and IT audit trail.
-- --------------------------------------------------------
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
