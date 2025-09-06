-- database/seeds.sql
USE d_nothi_db;

-- Insert sample users
INSERT INTO users (employee_id, name, email, password, role, department, designation) VALUES
('SYS001', 'System Administrator', 'sysadmin@dnothi.com', '$2a$10$ExampleHashedPassword', 'SystemAdmin', 'IT', 'System Administrator'),
('ADM001', 'Admin User', 'admin@dnothi.com', '$2a$10$ExampleHashedPassword', 'Admin', 'Administration', 'Administrator'),
('SUP001', 'Supervisor User', 'supervisor@dnothi.com', '$2a$10$ExampleHashedPassword', 'Supervisor', 'Operations', 'Team Lead'),
('AGT001', 'Agent User', 'agent@dnothi.com', '$2a$10$ExampleHashedPassword', 'Agent', 'Operations', 'Field Agent');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Technical', 'Technical tasks and issues'),
('Administrative', 'Administrative tasks'),
('Field Work', 'Field work and site visits'),
('Training', 'Training and development');

-- Insert sample services
INSERT INTO services (category_id, name, description) VALUES
(1, 'Software Development', 'Application development tasks'),
(1, 'System Maintenance', 'System maintenance and updates'),
(2, 'Documentation', 'Document preparation and management'),
(3, 'Site Inspection', 'Field site inspection');

-- Insert sample offices
INSERT INTO offices (name, location) VALUES
('Head Office', 'Dhaka'),
('Regional Office', 'Chittagong'),
('Field Office', 'Sylhet');

-- Insert sample sources
INSERT INTO sources (name, description) VALUES
('Internal', 'Internal generated task'),
('Client', 'Client requested task'),
('Management', 'Management directive');

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, assigned_by, category_id, service_id, office_id, source_id) VALUES
('Website Update', 'Update company website with new content', 'In Progress', 'High', '2023-12-15', 4, 2, 1, 1, 1, 1),
('Field Inspection', 'Inspect construction site in Sylhet', 'Pending', 'Medium', '2023-12-20', 4, 3, 3, 4, 3, 2),
('Training Session', 'Conduct staff training on new software', 'Completed', 'Low', '2023-12-10', 4, 2, 4, 1, 1, 3);

-- Insert sample leave types
INSERT INTO leave_types (name, description, max_days) VALUES
('Annual Leave', 'Paid annual leave', 20),
('Sick Leave', 'Paid sick leave', 15),
('Casual Leave', 'Paid casual leave', 10);

-- Insert sample leaves
INSERT INTO leaves (user_id, leave_type_id, start_date, end_date, reason, status, approved_by) VALUES
(4, 1, '2023-12-25', '2023-12-28', 'Family vacation', 'Pending', NULL),
(4, 2, '2023-11-15', '2023-11-16', 'Medical appointment', 'Approved', 3);

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action_type, table_name, record_id, ip_address, user_agent) VALUES
(2, 'CREATE', 'tasks', 1, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 'CREATE', 'leaves', 1, '192.168.1.2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');