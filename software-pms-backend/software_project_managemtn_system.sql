-- สร้างฐานข้อมูล
CREATE DATABASE software_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ใช้ฐานข้อมูล
USE software_pms;

-- ตาราง Projects
CREATE TABLE projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Completed', 'On Hold') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- ตาราง Sprints
CREATE TABLE sprints (
    sprint_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    project_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

-- ตาราง Test Files
CREATE TABLE test_files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    upload_date DATETIME NOT NULL,
    last_modified_date DATETIME,
    last_modified_by VARCHAR(100),
    sprint_id INT,
    status ENUM('Pass', 'Fail', 'Pending', 'Deleted') DEFAULT 'Pending',
    json_content JSON NOT NULL,
    FOREIGN KEY (sprint_id) REFERENCES sprints(sprint_id) ON DELETE CASCADE
);

-- ตาราง Test File History
CREATE TABLE test_file_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    action_type ENUM('upload', 'modify', 'delete') NOT NULL,
    action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_by VARCHAR(100),
    details JSON,
    FOREIGN KEY (file_id) REFERENCES test_files(file_id) ON DELETE CASCADE
);

-- ตาราง Users
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Tester', 'Viewer') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตาราง Action Logs
CREATE TABLE action_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    target_table VARCHAR(50),
    target_id INT,
    details JSON,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ตั้งค่า Index เพื่อเพิ่มความเร็วในการ Query
CREATE INDEX idx_project_id ON sprints(project_id);
CREATE INDEX idx_sprint_id ON test_files(sprint_id);
CREATE INDEX idx_status ON test_files(status);
