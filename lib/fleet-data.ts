// Centralized fleet data store for FleetFlow
// This module provides mock data and state management for the entire application

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired"
export type VehicleType = "Truck" | "Van" | "Bike"
export type DriverStatus = "On Duty" | "Off Duty" | "Suspended"
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled"

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  licensePlate: string
  maxCapacity: number
  odometer: number
  status: VehicleStatus
  region: string
  acquisitionCost: number
  yearAcquired: number
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  licenseCategories: VehicleType[]
  status: DriverStatus
  safetyScore: number
  tripsCompleted: number
  avatar: string
}

export interface Trip {
  id: string
  vehicleId: string
  driverId: string
  origin: string
  destination: string
  cargoWeight: number
  cargoDescription: string
  status: TripStatus
  createdAt: string
  dispatchedAt?: string
  completedAt?: string
  startOdometer: number
  endOdometer?: number
  estimatedFuelCost?: number
  actualFuelCost?: number
  litersFilled?: number
  finalOdometer?: number
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  type: string
  description: string
  cost: number
  date: string
  status: "Scheduled" | "In Progress" | "Completed"
}

export interface FuelLog {
  id: string
  vehicleId: string
  tripId?: string
  liters: number
  cost: number
  date: string
  odometer: number
}

// --- Initial Data ---

export const initialVehicles: Vehicle[] = [
  { id: "V001", name: "Hauler-01", type: "Truck", licensePlate: "TRK-4521", maxCapacity: 8000, odometer: 124500, status: "On Trip", region: "North", acquisitionCost: 85000, yearAcquired: 2021 },
  { id: "V002", name: "Swift-02", type: "Van", licensePlate: "VAN-7832", maxCapacity: 1500, odometer: 67800, status: "Available", region: "South", acquisitionCost: 35000, yearAcquired: 2022 },
  { id: "V003", name: "Titan-03", type: "Truck", licensePlate: "TRK-9014", maxCapacity: 12000, odometer: 89200, status: "In Shop", region: "East", acquisitionCost: 95000, yearAcquired: 2020 },
  { id: "V004", name: "Zoom-04", type: "Bike", licensePlate: "BKE-2156", maxCapacity: 50, odometer: 15400, status: "Available", region: "Central", acquisitionCost: 5000, yearAcquired: 2023 },
  { id: "V005", name: "Cargo-05", type: "Van", licensePlate: "VAN-6643", maxCapacity: 2000, odometer: 45100, status: "On Trip", region: "West", acquisitionCost: 38000, yearAcquired: 2022 },
  { id: "V006", name: "Atlas-06", type: "Truck", licensePlate: "TRK-3378", maxCapacity: 10000, odometer: 156700, status: "Available", region: "North", acquisitionCost: 90000, yearAcquired: 2019 },
  { id: "V007", name: "Sprint-07", type: "Van", licensePlate: "VAN-1190", maxCapacity: 1200, odometer: 38900, status: "Available", region: "South", acquisitionCost: 32000, yearAcquired: 2023 },
  { id: "V008", name: "Bolt-08", type: "Bike", licensePlate: "BKE-5582", maxCapacity: 40, odometer: 8700, status: "Retired", region: "Central", acquisitionCost: 4500, yearAcquired: 2020 },
  { id: "V009", name: "Mammoth-09", type: "Truck", licensePlate: "TRK-7764", maxCapacity: 15000, odometer: 201000, status: "On Trip", region: "East", acquisitionCost: 110000, yearAcquired: 2018 },
  { id: "V010", name: "Dash-10", type: "Van", licensePlate: "VAN-4427", maxCapacity: 1800, odometer: 52300, status: "Available", region: "West", acquisitionCost: 36000, yearAcquired: 2021 },
]

export const initialDrivers: Driver[] = [
  { id: "D001", name: "Alex Rivera", email: "alex.r@fleetflow.io", phone: "+1-555-0101", licenseNumber: "DL-98201", licenseExpiry: "2027-03-15", licenseCategories: ["Truck", "Van"], status: "On Duty", safetyScore: 94, tripsCompleted: 187, avatar: "AR" },
  { id: "D002", name: "Jordan Chen", email: "jordan.c@fleetflow.io", phone: "+1-555-0102", licenseNumber: "DL-45632", licenseExpiry: "2025-11-20", licenseCategories: ["Van", "Bike"], status: "On Duty", safetyScore: 88, tripsCompleted: 142, avatar: "JC" },
  { id: "D003", name: "Sam Okafor", email: "sam.o@fleetflow.io", phone: "+1-555-0103", licenseNumber: "DL-77890", licenseExpiry: "2026-06-01", licenseCategories: ["Truck"], status: "Off Duty", safetyScore: 76, tripsCompleted: 95, avatar: "SO" },
  { id: "D004", name: "Maria Santos", email: "maria.s@fleetflow.io", phone: "+1-555-0104", licenseNumber: "DL-33214", licenseExpiry: "2024-12-31", licenseCategories: ["Truck", "Van", "Bike"], status: "Suspended", safetyScore: 52, tripsCompleted: 63, avatar: "MS" },
  { id: "D005", name: "Liam Frost", email: "liam.f@fleetflow.io", phone: "+1-555-0105", licenseNumber: "DL-66478", licenseExpiry: "2027-09-10", licenseCategories: ["Van"], status: "On Duty", safetyScore: 91, tripsCompleted: 210, avatar: "LF" },
  { id: "D006", name: "Priya Sharma", email: "priya.s@fleetflow.io", phone: "+1-555-0106", licenseNumber: "DL-12567", licenseExpiry: "2026-04-22", licenseCategories: ["Truck", "Van"], status: "On Duty", safetyScore: 97, tripsCompleted: 245, avatar: "PS" },
  { id: "D007", name: "Tyler Brooks", email: "tyler.b@fleetflow.io", phone: "+1-555-0107", licenseNumber: "DL-88943", licenseExpiry: "2026-01-15", licenseCategories: ["Bike"], status: "Off Duty", safetyScore: 83, tripsCompleted: 78, avatar: "TB" },
  { id: "D008", name: "Nadia Volkov", email: "nadia.v@fleetflow.io", phone: "+1-555-0108", licenseNumber: "DL-55321", licenseExpiry: "2027-07-30", licenseCategories: ["Truck", "Van", "Bike"], status: "On Duty", safetyScore: 90, tripsCompleted: 156, avatar: "NV" },
]

export const initialTrips: Trip[] = [
  { id: "T001", vehicleId: "V001", driverId: "D001", origin: "Warehouse A", destination: "Distribution Center B", cargoWeight: 6500, cargoDescription: "Electronics shipment", status: "Dispatched", createdAt: "2026-02-18T08:00:00", dispatchedAt: "2026-02-18T09:30:00", startOdometer: 124500, estimatedFuelCost: 2500 },
  { id: "T002", vehicleId: "V005", driverId: "D005", origin: "Port Terminal", destination: "Retail Hub C", cargoWeight: 1800, cargoDescription: "Clothing pallets", status: "Dispatched", createdAt: "2026-02-19T07:00:00", dispatchedAt: "2026-02-19T08:15:00", startOdometer: 45100, estimatedFuelCost: 1200 },
  { id: "T003", vehicleId: "V009", driverId: "D006", origin: "Factory D", destination: "Warehouse E", cargoWeight: 14000, cargoDescription: "Raw materials", status: "Dispatched", createdAt: "2026-02-20T06:00:00", dispatchedAt: "2026-02-20T07:00:00", startOdometer: 201000, estimatedFuelCost: 3500 },
  { id: "T004", vehicleId: "V002", driverId: "D002", origin: "Depot F", destination: "Customer G", cargoWeight: 1200, cargoDescription: "Furniture delivery", status: "Completed", createdAt: "2026-02-15T09:00:00", dispatchedAt: "2026-02-15T10:00:00", completedAt: "2026-02-15T16:30:00", startOdometer: 67200, endOdometer: 67800, estimatedFuelCost: 900, actualFuelCost: 850, litersFilled: 45, finalOdometer: 67800 },
  { id: "T005", vehicleId: "V006", driverId: "D001", origin: "Warehouse A", destination: "Retail Hub H", cargoWeight: 8500, cargoDescription: "Food supplies", status: "Completed", createdAt: "2026-02-14T05:00:00", dispatchedAt: "2026-02-14T06:00:00", completedAt: "2026-02-14T14:00:00", startOdometer: 156200, endOdometer: 156700, estimatedFuelCost: 2000, actualFuelCost: 1900, litersFilled: 95, finalOdometer: 156700 },
  { id: "T006", vehicleId: "V007", driverId: "D008", origin: "Depot I", destination: "Customer J", cargoWeight: 900, cargoDescription: "Medical supplies", status: "Draft", createdAt: "2026-02-21T10:00:00", startOdometer: 38900, estimatedFuelCost: 600 },
  { id: "T007", vehicleId: "V010", driverId: "D005", origin: "Warehouse K", destination: "Distribution Center L", cargoWeight: 1600, cargoDescription: "Auto parts", status: "Cancelled", createdAt: "2026-02-13T08:00:00", startOdometer: 52000, estimatedFuelCost: 800 },
]

export const initialMaintenanceLogs: MaintenanceLog[] = [
  { id: "M001", vehicleId: "V003", type: "Oil Change", description: "Full synthetic oil change and filter replacement", cost: 280, date: "2026-02-20", status: "In Progress" },
  { id: "M002", vehicleId: "V006", type: "Tire Rotation", description: "Rotate all six tires and balance", cost: 150, date: "2026-02-10", status: "Completed" },
  { id: "M003", vehicleId: "V001", type: "Brake Inspection", description: "Brake pads and rotor inspection", cost: 420, date: "2026-02-08", status: "Completed" },
  { id: "M004", vehicleId: "V009", type: "Transmission Service", description: "Transmission fluid flush and filter change", cost: 650, date: "2026-01-28", status: "Completed" },
  { id: "M005", vehicleId: "V002", type: "Battery Replacement", description: "Replace AGM battery", cost: 200, date: "2026-02-05", status: "Completed" },
  { id: "M006", vehicleId: "V005", type: "AC Service", description: "Recharge AC system and leak test", cost: 180, date: "2026-01-15", status: "Completed" },
  { id: "M007", vehicleId: "V010", type: "Engine Tune-Up", description: "Spark plugs, ignition coils, air filter", cost: 350, date: "2026-02-18", status: "Scheduled" },
]

export const initialFuelLogs: FuelLog[] = [
  { id: "F001", vehicleId: "V001", tripId: "T001", liters: 120, cost: 192, date: "2026-02-18", odometer: 124500 },
  { id: "F002", vehicleId: "V002", tripId: "T004", liters: 45, cost: 72, date: "2026-02-15", odometer: 67800 },
  { id: "F003", vehicleId: "V005", tripId: "T002", liters: 55, cost: 88, date: "2026-02-19", odometer: 45100 },
  { id: "F004", vehicleId: "V006", tripId: "T005", liters: 95, cost: 152, date: "2026-02-14", odometer: 156700 },
  { id: "F005", vehicleId: "V009", tripId: "T003", liters: 180, cost: 288, date: "2026-02-20", odometer: 201000 },
  { id: "F006", vehicleId: "V001", liters: 115, cost: 184, date: "2026-02-12", odometer: 124200 },
  { id: "F007", vehicleId: "V003", liters: 130, cost: 208, date: "2026-02-06", odometer: 89000 },
  { id: "F008", vehicleId: "V010", liters: 50, cost: 80, date: "2026-02-11", odometer: 52100 },
  { id: "F009", vehicleId: "V007", liters: 40, cost: 64, date: "2026-02-09", odometer: 38700 },
  { id: "F010", vehicleId: "V006", liters: 100, cost: 160, date: "2026-02-02", odometer: 156000 },
]

// Weekly trip data for charts
export const weeklyTripData = [
  { day: "Mon", trips: 12, fuel: 8.2 },
  { day: "Tue", trips: 15, fuel: 7.8 },
  { day: "Wed", trips: 9, fuel: 9.1 },
  { day: "Thu", trips: 18, fuel: 7.5 },
  { day: "Fri", trips: 22, fuel: 8.0 },
  { day: "Sat", trips: 8, fuel: 8.8 },
  { day: "Sun", trips: 5, fuel: 9.3 },
]

// Monthly cost data for analytics (full year view)
export const monthlyCostData = [
  { month: "Jan '25", fuel: 3800, maintenance: 1400 },
  { month: "Feb '25", fuel: 4100, maintenance: 1600 },
  { month: "Mar '25", fuel: 4500, maintenance: 2000 },
  { month: "Apr '25", fuel: 4200, maintenance: 1800 },
  { month: "May '25", fuel: 3900, maintenance: 1500 },
  { month: "Jun '25", fuel: 4700, maintenance: 2600 },
  { month: "Jul '25", fuel: 5000, maintenance: 2100 },
  { month: "Aug '25", fuel: 4600, maintenance: 1900 },
  { month: "Sep '25", fuel: 4200, maintenance: 1800 },
  { month: "Oct '25", fuel: 4800, maintenance: 2200 },
  { month: "Nov '25", fuel: 3900, maintenance: 1500 },
  { month: "Dec '25", fuel: 5100, maintenance: 3100 },
  { month: "Jan '26", fuel: 4600, maintenance: 1900 },
  { month: "Feb '26", fuel: 3800, maintenance: 2400 },
]

// Quarterly summary for analytics
export const quarterlyCostData = [
  { quarter: "Q1 '25", fuel: 12400, maintenance: 5000 },
  { quarter: "Q2 '25", fuel: 12800, maintenance: 5900 },
  { quarter: "Q3 '25", fuel: 13800, maintenance: 5800 },
  { quarter: "Q4 '25", fuel: 13800, maintenance: 6800 },
  { quarter: "Q1 '26", fuel: 8400, maintenance: 4300 },
]
