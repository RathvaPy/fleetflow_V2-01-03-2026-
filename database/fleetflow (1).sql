-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 07:59 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fleetflow`
--

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `license_number` varchar(100) NOT NULL,
  `license_expiry` date NOT NULL,
  `status` enum('On Duty','Off Duty','Suspended') NOT NULL DEFAULT 'Off Duty',
  `safety_score` int(11) DEFAULT 75,
  `trips_completed` int(11) DEFAULT 0,
  `avatar_initials` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`id`, `name`, `email`, `phone`, `license_number`, `license_expiry`, `status`, `safety_score`, `trips_completed`, `avatar_initials`) VALUES
('D1772302119923', 'Piyush Rathva', 'rathva.py@gmail.com', '+919687053855', 'GJ123456', '2028-12-31', 'Suspended', 75, 0, 'PR'),
('D1772302651641', 'Jaivansh Thakur', 'jay01@gmail.com', '+91 91234 56780', 'TX-48291', '2026-02-28', 'Off Duty', 75, 1, 'J'),
('D1772303161181', 'Ramesh Chaudhari', 'ramesh@gmail.com', '+91 90123 45678', 'FL-27K-8841', '2028-02-19', 'On Duty', 75, 1, 'P'),
('D1772305838886', 'Prakash Kumar ', 'pkyt220@gmail.com', '+91 93456 78901', 'IL-TRK-5529', '2027-05-02', 'On Duty', 75, 0, 'SJ'),
('D1772310000001', 'Rahul Mehta', 'rahul.mehta@gmail.com', '+91 9811111111', 'DL-TR-1001', '2028-05-12', 'On Duty', 90, 25, 'RM'),
('D1772310000002', 'Ankit Verma', 'ankit.verma@gmail.com', '+91 9822222222', 'UP-TR-1002', '2027-09-18', 'Off Duty', 82, 14, 'AV'),
('D1772310000003', 'Deepak Yadav', 'deepak.yadav@gmail.com', '+91 9833333333', 'MH-TR-1003', '2029-01-22', 'On Duty', 88, 30, 'DY'),
('D1772310000004', 'Manoj Kumar', 'manoj.kumar@gmail.com', '+91 9844444444', 'RJ-TR-1004', '2026-11-30', 'Suspended', 60, 5, 'MK'),
('D1772310000005', 'Sanjay Patel', 'sanjay.patel@gmail.com', '+91 9855555555', 'GJ-TR-1005', '2028-03-14', 'On Duty', 93, 40, 'SP'),
('D1772310000006', 'Ravi Singh', 'ravi.singh@gmail.com', '+91 9866666666', 'PB-TR-1006', '2027-07-19', 'Off Duty', 79, 18, 'RS'),
('D1772310000007', 'Arjun Chauhan', 'arjun.chauhan@gmail.com', '+91 9877777777', 'HR-TR-1007', '2028-12-24', 'On Duty', 91, 35, 'AC'),
('D1772310000008', 'Vijay Thakur', 'vijay.thakur@gmail.com', '+91 9888888888', 'MP-TR-1008', '2029-04-08', 'On Duty', 85, 22, 'VT'),
('D1772310000009', 'Nitin Sharma', 'nitin.sharma@gmail.com', '+91 9899999999', 'KA-TR-1009', '2027-10-10', 'Off Duty', 76, 11, 'NS'),
('D1772310000010', 'Pawan Joshi', 'pawan.joshi@gmail.com', '+91 9700000000', 'TN-TR-1010', '2028-06-17', 'On Duty', 89, 27, 'PJ'),
('D1772310000011', 'Kunal Desai', 'kunal.desai@gmail.com', '+91 9711111111', 'GJ-TR-1011', '2029-08-09', 'On Duty', 94, 50, 'KD'),
('D1772310000012', 'Harsh Vardhan', 'harsh.vardhan@gmail.com', '+91 9722222222', 'DL-TR-1012', '2027-02-28', 'Off Duty', 83, 19, 'HV'),
('D1772310000013', 'Rakesh Mishra', 'rakesh.mishra@gmail.com', '+91 9733333333', 'UP-TR-1013', '2028-09-15', 'On Duty', 87, 28, 'RM'),
('D1772310000014', 'Suraj Gupta', 'suraj.gupta@gmail.com', '+91 9744444444', 'MH-TR-1014', '2026-12-12', 'Suspended', 65, 9, 'SG'),
('D1772310000015', 'Imran Khan', 'imran.khan@gmail.com', '+91 9755555555', 'RJ-TR-1015', '2029-03-21', 'On Duty', 92, 37, 'IK'),
('D1772310000016', 'Rohit Yadav', 'rohit.yadav@gmail.com', '+91 9766666666', 'BR-TR-1016', '2027-11-05', 'Off Duty', 80, 16, 'RY'),
('D1772310000017', 'Aakash Jain', 'aakash.jain@gmail.com', '+91 9777777777', 'MP-TR-1017', '2028-07-28', 'On Duty', 86, 23, 'AJ'),
('D1772310000018', 'Sunil Pawar', 'sunil.pawar@gmail.com', '+91 9788888888', 'CG-TR-1018', '2029-01-01', 'On Duty', 90, 32, 'SP'),
('D1772310000019', 'Yogesh Solanki', 'yogesh.solanki@gmail.com', '+91 9799999999', 'HR-TR-1019', '2028-10-10', 'Off Duty', 78, 13, 'YS'),
('D1772310000020', 'Mahesh Rawat', 'mahesh.rawat@gmail.com', '+91 9600000000', 'UK-TR-1020', '2027-04-16', 'On Duty', 91, 29, 'MR'),
('D1772310000021', 'Ajay Tiwari', 'ajay.tiwari@gmail.com', '+91 9611111111', 'UP-TR-1021', '2029-05-05', 'On Duty', 95, 45, 'AT');

-- --------------------------------------------------------

--
-- Table structure for table `driver_license_categories`
--

CREATE TABLE `driver_license_categories` (
  `id` int(11) NOT NULL,
  `driver_id` varchar(36) NOT NULL,
  `category` enum('Truck','Van','Bike') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driver_license_categories`
--

INSERT INTO `driver_license_categories` (`id`, `driver_id`, `category`) VALUES
(57, 'D1772310000001', 'Truck'),
(58, 'D1772310000002', 'Truck'),
(59, 'D1772310000003', 'Truck'),
(60, 'D1772310000004', 'Truck'),
(61, 'D1772310000005', 'Truck'),
(62, 'D1772310000006', 'Truck'),
(63, 'D1772310000007', 'Truck'),
(64, 'D1772310000008', 'Truck'),
(65, 'D1772310000009', 'Truck'),
(66, 'D1772310000010', 'Truck'),
(67, 'D1772310000011', 'Truck'),
(68, 'D1772310000012', 'Truck'),
(69, 'D1772310000013', 'Truck'),
(70, 'D1772310000014', 'Truck'),
(71, 'D1772310000015', 'Truck'),
(72, 'D1772310000016', 'Truck'),
(73, 'D1772310000017', 'Truck'),
(74, 'D1772310000018', 'Truck'),
(75, 'D1772310000019', 'Truck'),
(76, 'D1772310000020', 'Truck'),
(77, 'D1772310000021', 'Truck');

-- --------------------------------------------------------

--
-- Table structure for table `fuel_logs`
--

CREATE TABLE `fuel_logs` (
  `id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `trip_id` varchar(36) DEFAULT NULL,
  `liters` decimal(10,2) NOT NULL,
  `cost` decimal(15,2) NOT NULL,
  `log_date` date NOT NULL,
  `odometer_reading` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fuel_logs`
--

INSERT INTO `fuel_logs` (`id`, `vehicle_id`, `trip_id`, `liters`, `cost`, `log_date`, `odometer_reading`) VALUES
('F1772316000001', 'V1772311000001', 'T1772315000001', 96.00, 11800.00, '2026-02-20', 122050),
('F1772316000002', 'V1772311000003', 'T1772315000002', 65.00, 7800.00, '2026-02-21', 99600),
('F1772316000003', 'V1772311000005', 'T1772315000003', 72.00, 8700.00, '2026-02-22', 256010),
('F1772316000004', 'V1772311000010', 'T1772315000004', 70.00, 8200.00, '2026-02-23', 133580),
('F1772316000005', 'V1772311000017', 'T1772315000005', 62.00, 7600.00, '2026-02-24', 168900),
('F1772316000006', 'V1772311000018', 'T1772315000006', 90.00, 10800.00, '2026-02-25', 439420),
('F1772316000007', 'V1772311000021', 'T1772315000007', 50.00, 5900.00, '2026-02-26', 379100),
('F1772316000008', 'V1772311000024', 'T1772315000008', 38.00, 4300.00, '2026-02-27', 84900),
('F1772316000009', 'V1772311000026', 'T1772315000009', 58.00, 7000.00, '2026-02-27', 177020),
('F1772316000010', 'V1772311000015', 'T1772315000010', 120.00, 14700.00, '2026-02-28', 403200),
('F1772316000011', 'V1772311000016', 'T1772315000011', 110.00, 13700.00, '2026-02-28', 289780),
('F1772316000012', 'V1772311000023', 'T1772315000012', 98.00, 12200.00, '2026-03-01', 268650);

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_logs`
--

CREATE TABLE `maintenance_logs` (
  `id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `service_date` date NOT NULL,
  `status` enum('Scheduled','In Progress','Completed') NOT NULL DEFAULT 'In Progress'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `maintenance_logs`
--

INSERT INTO `maintenance_logs` (`id`, `vehicle_id`, `service_type`, `description`, `cost`, `service_date`, `status`) VALUES
('M1772314000001', 'V1772311000001', 'Oil Change', 'Engine oil and filter replacement', 4500.00, '2026-02-09', 'Completed'),
('M1772314000002', 'V1772311000003', 'Brake Service', 'Brake pad replacement and inspection', 8200.00, '2026-02-11', 'Completed'),
('M1772314000003', 'V1772311000005', 'Clutch Repair', 'Clutch plate replacement', 18500.00, '2026-02-04', 'Completed'),
('M1772314000004', 'V1772311000010', 'Wheel Alignment', 'Full wheel alignment and balancing', 3500.00, '2026-02-17', 'Completed'),
('M1772314000005', 'V1772311000017', 'Battery Replacement', 'New heavy duty battery installed', 9500.00, '2026-02-19', 'Completed'),
('M1772314000006', 'V1772311000002', 'Engine Overhaul', 'Partial engine overhaul due to overheating issue', 42000.00, '2026-02-26', 'In Progress'),
('M1772314000007', 'V1772311000011', 'Suspension Repair', 'Suspension bush and shock absorber replacement', 16000.00, '2026-02-27', 'In Progress'),
('M1772314000008', 'V1772311000020', 'Transmission Check', 'Gearbox inspection and oil change', 11000.00, '2026-02-25', 'In Progress'),
('M1772314000009', 'V1772311000007', 'Oil Change', 'Routine service after 10,000 km', 4000.00, '2026-03-06', 'Scheduled'),
('M1772314000010', 'V1772311000015', 'Brake Inspection', 'Quarterly brake system inspection', 5000.00, '2026-03-08', 'Scheduled'),
('M1772314000011', 'V1772311000021', 'AC Service', 'Cabin AC cleaning and gas refill', 6500.00, '2026-03-04', 'Scheduled'),
('M1772314000012', 'V1772311000024', 'Tyre Replacement', 'Front tyre pair replacement', 22000.00, '2026-03-11', 'Scheduled'),
('M1772314000013', 'V1772311000008', 'Engine Tuning', 'Fuel injection calibration and tuning', 7200.00, '2026-02-14', 'Completed'),
('M1772314000014', 'V1772311000016', 'Coolant Flush', 'Cooling system cleaning and coolant refill', 5800.00, '2026-02-21', 'Completed'),
('M1772314000015', 'V1772311000022', 'Electrical Check', 'Full electrical wiring inspection', 8900.00, '2026-02-28', 'In Progress');

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` varchar(36) NOT NULL,
  `vehicle_id` varchar(36) NOT NULL,
  `driver_id` varchar(36) NOT NULL,
  `origin` varchar(255) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `cargo_weight` decimal(10,2) NOT NULL,
  `cargo_description` text DEFAULT NULL,
  `status` enum('Draft','Dispatched','Completed','Cancelled') NOT NULL DEFAULT 'Draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `dispatched_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `start_odometer` int(11) NOT NULL,
  `end_odometer` int(11) DEFAULT NULL,
  `estimated_fuel_cost` decimal(15,2) DEFAULT NULL,
  `actual_fuel_cost` decimal(15,2) DEFAULT NULL,
  `liters_filled` decimal(10,2) DEFAULT NULL,
  `final_odometer` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `vehicle_id`, `driver_id`, `origin`, `destination`, `cargo_weight`, `cargo_description`, `status`, `created_at`, `dispatched_at`, `completed_at`, `start_odometer`, `end_odometer`, `estimated_fuel_cost`, `actual_fuel_cost`, `liters_filled`, `final_odometer`) VALUES
('T1772315000001', 'V1772311000001', 'D1772310000001', 'Delhi', 'Chandigarh', 18000.00, 'Steel Pipes', 'Completed', '2026-02-19 11:51:33', '2026-02-19 12:51:33', '2026-02-20 11:51:33', 121300, 122050, 12000.00, 11800.00, 96.00, 122050),
('T1772315000002', 'V1772311000003', 'D1772310000003', 'Lucknow', 'Kanpur', 12000.00, 'Electronics', 'Completed', '2026-02-20 11:51:33', '2026-02-20 13:51:33', '2026-02-21 11:51:33', 99120, 99600, 8000.00, 7800.00, 65.00, 99600),
('T1772315000003', 'V1772311000005', 'D1772310000005', 'Mumbai', 'Pune', 15000.00, 'FMCG Goods', 'Completed', '2026-02-21 11:51:33', '2026-02-21 12:51:33', '2026-02-22 11:51:33', 255420, 256010, 9000.00, 8700.00, 72.00, 256010),
('T1772315000004', 'V1772311000010', 'D1772310000013', 'Ahmedabad', 'Surat', 14000.00, 'Chemical Drums', 'Completed', '2026-02-22 11:51:33', '2026-02-22 12:51:33', '2026-02-23 11:51:33', 133020, 133580, 8500.00, 8200.00, 70.00, 133580),
('T1772315000005', 'V1772311000017', 'D1772310000016', 'Indore', 'Bhopal', 11000.00, 'Hardware Items', 'Completed', '2026-02-23 11:51:33', '2026-02-23 12:51:33', '2026-02-24 11:51:33', 168360, 168900, 7800.00, 7600.00, 62.00, 168900),
('T1772315000006', 'V1772311000018', 'D1772310000018', 'Chennai', 'Coimbatore', 16000.00, 'Food Products', 'Completed', '2026-02-24 11:51:33', '2026-02-24 13:51:33', '2026-02-25 11:51:33', 438670, 439420, 11000.00, 10800.00, 90.00, 439420),
('T1772315000007', 'V1772311000021', 'D1772310000020', 'Delhi', 'Agra', 8000.00, 'Glass Panels', 'Completed', '2026-02-25 11:51:33', '2026-02-25 12:51:33', '2026-02-26 11:51:33', 378560, 379100, 6000.00, 5900.00, 50.00, 379100),
('T1772315000008', 'V1772311000024', 'D1772310000017', 'Gurgaon', 'Noida', 6000.00, 'Office Equipment', 'Completed', '2026-02-26 11:51:33', '2026-02-26 12:51:33', '2026-02-27 11:51:33', 84560, 84900, 4500.00, 4300.00, 38.00, 84900),
('T1772315000009', 'V1772311000026', 'D1772310000021', 'Kanpur', 'Allahabad', 10000.00, 'Plastic Goods', 'Completed', '2026-02-26 11:51:33', '2026-02-26 12:51:33', '2026-02-27 11:51:33', 176430, 177020, 7200.00, 7000.00, 58.00, 177020),
('T1772315000010', 'V1772311000015', 'D1772310000015', 'Jaipur', 'Udaipur', 22000.00, 'Marble Blocks', 'Completed', '2026-02-27 11:51:33', '2026-02-27 12:51:33', '2026-02-28 11:51:33', 402340, 403200, 15000.00, 14700.00, 120.00, 403200),
('T1772315000011', 'V1772311000016', 'D1772310000007', 'Delhi', 'Lucknow', 19000.00, 'Cement Bags', 'Completed', '2026-02-27 11:51:33', '2026-02-27 13:51:33', '2026-02-28 11:51:33', 288900, 289780, 14000.00, 13700.00, 110.00, 289780),
('T1772315000012', 'V1772311000023', 'D1772310000012', 'Kolkata', 'Patna', 17000.00, 'Industrial Equipment', 'Completed', '2026-02-28 11:51:33', '2026-02-28 12:51:33', '2026-03-01 11:51:33', 267890, 268650, 12500.00, 12200.00, 98.00, 268650);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('manager','dispatcher') NOT NULL DEFAULT 'dispatcher',
  `avatar_initials` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `avatar_initials`) VALUES
('U1772301969885', 'Piyush ', 'rathva.py@gmail.com', '123456', 'manager', 'P'),
('U1772302476397', 'Rohit', 'rohit@gmail.com', '123456', 'dispatcher', 'R');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('Truck','Van','Bike') NOT NULL,
  `license_plate` varchar(50) NOT NULL,
  `max_capacity` int(11) NOT NULL,
  `odometer` int(11) NOT NULL DEFAULT 0,
  `status` enum('Available','On Trip','In Shop','Retired') NOT NULL DEFAULT 'Available',
  `region` enum('North','South','East','West','Central') DEFAULT 'North',
  `acquisition_cost` decimal(15,2) DEFAULT NULL,
  `year_acquired` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `name`, `type`, `license_plate`, `max_capacity`, `odometer`, `status`, `region`, `acquisition_cost`, `year_acquired`) VALUES
('V1772302027343', 'Ashok Leyland 2518', 'Truck', 'DL-01-TR-9921', 25000, 389540, 'Available', 'North', 0.00, 2026),
('V1772302177647', 'Tata LPT 1613', 'Truck', 'MH-12-TR-4589', 16000, 245780, 'On Trip', 'East', 0.00, 2026),
('V1772306648872', 'Eicher Pro 1110', 'Truck', 'KA-03-TR-7742', 12000, 178320, 'Available', 'Central', 0.00, 2026),
('V1772306685240', 'BharatBenz 1923C', 'Truck', 'GJ-05-TR-6631', 20000, 412905, 'In Shop', 'West', 0.00, 2026),
('V1772306737855', 'Mahindra Blazo X 28', 'Truck', 'MP-04-TR-9017', 15000, 219640, 'Available', 'Central', 0.00, 2026),
('V1772311000001', 'Tata Signa 2823', 'Truck', 'RJ-14-TR-1101', 28000, 120540, 'Available', 'North', 2600000.00, 2022),
('V1772311000002', 'Ashok Leyland 3518', 'Truck', 'DL-01-TR-1102', 35000, 210330, 'On Trip', 'North', 3100000.00, 2021),
('V1772311000003', 'Eicher Pro 6040', 'Truck', 'UP-32-TR-1103', 20000, 98540, 'Available', 'North', 2200000.00, 2023),
('V1772311000004', 'Mahindra Blazo X 28', 'Truck', 'MP-04-TR-1104', 15000, 187650, 'In Shop', 'Central', 2400000.00, 2020),
('V1772311000005', 'BharatBenz 2823R', 'Truck', 'MH-12-TR-1105', 28000, 254870, 'Available', 'West', 2950000.00, 2022),
('V1772311000006', 'Tata LPT 1613', 'Truck', 'GJ-05-TR-1106', 16000, 143220, 'Available', 'West', 1800000.00, 2021),
('V1772311000007', 'Eicher Pro 2110', 'Truck', 'KA-03-TR-1107', 11000, 77540, 'On Trip', 'South', 1650000.00, 2024),
('V1772311000008', 'Ashok Leyland 4220', 'Truck', 'TN-10-TR-1108', 42000, 312780, 'Available', 'South', 3400000.00, 2019),
('V1772311000009', 'Tata Ultra 1918', 'Truck', 'PB-10-TR-1109', 19000, 164890, 'In Shop', 'North', 2100000.00, 2022),
('V1772311000010', 'Mahindra Furio 16', 'Truck', 'HR-26-TR-1110', 16000, 132450, 'Available', 'North', 1750000.00, 2023),
('V1772311000011', 'BharatBenz 1923C', 'Truck', 'CG-07-TR-1111', 20000, 221430, 'On Trip', 'Central', 2550000.00, 2021),
('V1772311000012', 'Tata Signa 4018', 'Truck', 'BR-01-TR-1112', 40000, 356780, 'Available', 'East', 3200000.00, 2020),
('V1772311000013', 'Ashok Leyland 2820', 'Truck', 'WB-20-TR-1113', 28000, 198540, 'Available', 'East', 2750000.00, 2022),
('V1772311000014', 'Eicher Pro 3015', 'Truck', 'OR-02-TR-1114', 15000, 145670, 'Retired', 'East', 1500000.00, 2018),
('V1772311000015', 'Tata Signa 5530', 'Truck', 'RJ-19-TR-1115', 55000, 402340, 'Available', 'North', 4100000.00, 2019),
('V1772311000016', 'Mahindra Blazo X 35', 'Truck', 'UP-78-TR-1116', 35000, 288900, 'On Trip', 'North', 3300000.00, 2020),
('V1772311000017', 'BharatBenz 1217C', 'Truck', 'MH-04-TR-1117', 12000, 167800, 'Available', 'West', 1600000.00, 2023),
('V1772311000018', 'Tata LPT 4925', 'Truck', 'KA-05-TR-1118', 49000, 438670, 'Available', 'South', 4500000.00, 2018),
('V1772311000019', 'Ashok Leyland Dost+', 'Truck', 'GJ-18-TR-1119', 8000, 96540, 'Available', 'West', 950000.00, 2024),
('V1772311000020', 'Eicher Pro 8035XM', 'Truck', 'MP-09-TR-1120', 35000, 309870, 'In Shop', 'Central', 3700000.00, 2021),
('V1772311000021', 'Tata Prima 4625', 'Truck', 'DL-03-TR-1121', 46000, 378560, 'Available', 'North', 4200000.00, 2020),
('V1772311000022', 'Mahindra Blazo X 40', 'Truck', 'TN-22-TR-1122', 40000, 291450, 'On Trip', 'South', 3600000.00, 2022),
('V1772311000023', 'BharatBenz 3528CM', 'Truck', 'WB-11-TR-1123', 35000, 267890, 'Available', 'East', 3400000.00, 2021),
('V1772311000024', 'Eicher Pro 1095', 'Truck', 'HR-55-TR-1124', 9500, 84560, 'Available', 'North', 1250000.00, 2024),
('V1772311000025', 'Tata Ultra T.14', 'Truck', 'RJ-45-TR-1125', 14000, 132890, 'Available', 'North', 1450000.00, 2023),
('V1772311000026', 'Ashok Leyland 1920', 'Truck', 'UP-65-TR-1126', 19000, 176430, 'Available', 'North', 2150000.00, 2022);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `driver_license_categories`
--
ALTER TABLE `driver_license_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `driver_id` (`driver_id`,`category`);

--
-- Indexes for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_id` (`vehicle_id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `log_date` (`log_date`);

--
-- Indexes for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_id` (`vehicle_id`),
  ADD KEY `status` (`status`),
  ADD KEY `service_date` (`service_date`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_id` (`vehicle_id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `status` (`status`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_plate` (`license_plate`),
  ADD KEY `status` (`status`),
  ADD KEY `region` (`region`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `driver_license_categories`
--
ALTER TABLE `driver_license_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `driver_license_categories`
--
ALTER TABLE `driver_license_categories`
  ADD CONSTRAINT `driver_license_categories_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD CONSTRAINT `fuel_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fuel_logs_ibfk_2` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD CONSTRAINT `maintenance_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  ADD CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
