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

export const initialVehicles: Vehicle[] = []

export const initialDrivers: Driver[] = []

export const initialTrips: Trip[] = []

export const initialMaintenanceLogs: MaintenanceLog[] = []

export const initialFuelLogs: FuelLog[] = []

// Weekly trip data for charts
export const weeklyTripData = [
  { day: "Mon", trips: 0, fuel: 0 },
  { day: "Tue", trips: 0, fuel: 0 },
  { day: "Wed", trips: 0, fuel: 0 },
  { day: "Thu", trips: 0, fuel: 0 },
  { day: "Fri", trips: 0, fuel: 0 },
  { day: "Sat", trips: 0, fuel: 0 },
  { day: "Sun", trips: 0, fuel: 0 },
]

// Monthly cost data for analytics (full year view)
export const monthlyCostData: { month: string; fuel: number; maintenance: number }[] = []

// Quarterly summary for analytics
export const quarterlyCostData: { quarter: string; fuel: number; maintenance: number }[] = []

