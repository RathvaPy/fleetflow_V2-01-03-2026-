-- Database Initialization Script for fleetflow

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  licensePlate VARCHAR(50) NOT NULL,
  maxCapacity INT NOT NULL,
  odometer INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  acquisitionCost DECIMAL(15, 2),
  yearAcquired INT
);

CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  licenseNumber VARCHAR(100),
  licenseExpiry DATE,
  licenseCategories JSON,
  status VARCHAR(50),
  safetyScore INT,
  tripsCompleted INT,
  avatar VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY,
  vehicleId VARCHAR(36) NOT NULL,
  driverId VARCHAR(36) NOT NULL,
  origin VARCHAR(255),
  destination VARCHAR(255),
  cargoWeight INT,
  cargoDescription TEXT,
  status VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  dispatchedAt DATETIME,
  completedAt DATETIME,
  startOdometer INT,
  endOdometer INT,
  estimatedFuelCost DECIMAL(15, 2),
  actualFuelCost DECIMAL(15, 2),
  litersFilled DECIMAL(15, 2),
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  FOREIGN KEY (driverId) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id VARCHAR(36) PRIMARY KEY,
  vehicleId VARCHAR(36) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  cost DECIMAL(15, 2),
  date DATE,
  status VARCHAR(50),
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
);
