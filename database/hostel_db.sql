-- HostelEase - Hostel Management System
-- Database: hostel_db

CREATE DATABASE IF NOT EXISTS hostel_db;
USE hostel_db;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin') NOT NULL DEFAULT 'student',
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    year_of_study VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Rooms Table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    facilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Applications Table
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    status ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),

    INDEX (user_id),
    INDEX (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    status ENUM('Success','Failed') DEFAULT 'Success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Room Records
INSERT INTO rooms (room_number, room_type, capacity, fee, facilities) VALUES
('S001', 'Single Sharing', 1, 5000.00, 'WiFi, Attached Bathroom, Bed, Study Table'),
('D001', 'Double Sharing', 2, 3500.00, 'WiFi, Bed, Study Table'),
('T001', 'Triple Sharing', 3, 2500.00, 'WiFi, Bed, Study Table'),
('F001', 'Four Sharing', 4, 2000.00, 'WiFi, Bed, Study Table');

-- Note:
-- Admin and student accounts can be created through the application.