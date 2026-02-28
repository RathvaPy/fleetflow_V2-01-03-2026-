-- FleetFlow Database Reconstruction Script
-- Target: MySQL (XAMPP / MariaDB)
-- Engine: InnoDB
-- Charset: utf8mb4

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS driver_license_categories;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 2. Create 'users' table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('manager', 'dispatcher') NOT NULL DEFAULT 'dispatcher',
    avatar_initials VARCHAR(10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create 'vehicles' table
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Truck', 'Van', 'Bike') NOT NULL,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    max_capacity INT NOT NULL,
    odometer INT NOT NULL DEFAULT 0,
    status ENUM('Available', 'On Trip', 'In Shop', 'Retired') NOT NULL DEFAULT 'Available',
    region ENUM('North', 'South', 'East', 'West', 'Central') DEFAULT 'North',
    acquisition_cost DECIMAL(15, 2),
    year_acquired INT,
    INDEX (status),
    INDEX (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create 'drivers' table
CREATE TABLE drivers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    status ENUM('On Duty', 'Off Duty', 'Suspended') NOT NULL DEFAULT 'Off Duty',
    safety_score INT DEFAULT 75,
    trips_completed INT DEFAULT 0,
    avatar_initials VARCHAR(10),
    INDEX (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Create 'driver_license_categories' table (Normalized categories)
CREATE TABLE driver_license_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    category ENUM('Truck', 'Van', 'Bike') NOT NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    UNIQUE KEY (driver_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create 'trips' table
CREATE TABLE trips (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    cargo_weight DECIMAL(10, 2) NOT NULL,
    cargo_description TEXT,
    status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    dispatched_at DATETIME,
    completed_at DATETIME,
    start_odometer INT NOT NULL,
    end_odometer INT,
    estimated_fuel_cost DECIMAL(15, 2),
    actual_fuel_cost DECIMAL(15, 2),
    liters_filled DECIMAL(10, 2),
    final_odometer INT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    INDEX (status),
    INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create 'maintenance_logs' table
CREATE TABLE maintenance_logs (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    service_date DATE NOT NULL,
    status ENUM('Scheduled', 'In Progress', 'Completed') NOT NULL DEFAULT 'In Progress',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX (status),
    INDEX (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Create 'fuel_logs' table
CREATE TABLE fuel_logs (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36),
    liters DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    log_date DATE NOT NULL,
    odometer_reading INT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    INDEX (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
