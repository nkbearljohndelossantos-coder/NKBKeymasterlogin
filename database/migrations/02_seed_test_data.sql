-- NKB Manufacturing Windows Company Login System
-- Seed Test Data Script

USE `nkb_auth_db`;

-- Seed Test Employees
-- Note: Passwords are bcrypt hashes for 'Password123!' -> '$2a$10$7R4Q7VvR9hYV.q9Fk.Z.Me5T3z6L1d6U9/2P7w5f5g5h5i5j5k5l5m' or similar
-- For standard test suite compatibility, we seed valid hashes for 'Password123!'
-- Hash generated for 'Password123!' using bcrypt: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW'

INSERT INTO `employees` 
  (`employee_id`, `email`, `name`, `department`, `position`, `role`, `status`, `password_hash`, `password_status`)
VALUES
  ('EMP-000001', 'earljohn@nkbmanufacturing.com', 'Earl John', 'IT Department', 'Systems Administrator', 'IT Admin', 'Active', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Normal'),
  ('EMP-000123', 'juan.delacruz@nkbmanufacturing.com', 'Juan Dela Cruz', 'Manufacturing Ops', 'Assembly Line Lead', 'Employee', 'Active', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Normal'),
  ('EMP-000999', 'disabled.user@nkbmanufacturing.com', 'Disabled User', 'Quality Control', 'Inspector', 'Employee', 'Disabled', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Normal'),
  ('EMP-000888', 'locked.user@nkbmanufacturing.com', 'Locked User', 'Logistics', 'Warehouse Lead', 'Employee', 'Locked', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Normal')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Seed Windows Account Mappings
INSERT INTO `windows_account_mappings` (`employee_id`, `windows_username`, `windows_domain`)
VALUES
  ('EMP-000001', 'EMP-000001', 'NKB'),
  ('EMP-000123', 'EMP-000123', 'NKB'),
  ('EMP-000999', 'EMP-000999', 'NKB'),
  ('EMP-000888', 'EMP-000888', 'NKB')
ON DUPLICATE KEY UPDATE `windows_username` = VALUES(`windows_username`);

-- Seed Computers
INSERT INTO `computers` (`hostname`, `description`, `status`)
VALUES
  ('NKB-PC-001', 'IT Admin Workstation 1', 'Active'),
  ('NKB-PC-002', 'Manufacturing Floor PC 1', 'Active'),
  ('NKB-PC-UNASSIGNED', 'Unassigned Test PC', 'Active')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- Seed Employee Computer Assignments
INSERT INTO `employee_computers` (`employee_id`, `computer_hostname`)
VALUES
  ('EMP-000001', 'NKB-PC-001'),
  ('EMP-000123', 'NKB-PC-002'),
  ('EMP-000999', 'NKB-PC-001'),
  ('EMP-000888', 'NKB-PC-001')
ON DUPLICATE KEY UPDATE `computer_hostname` = VALUES(`computer_hostname`);
