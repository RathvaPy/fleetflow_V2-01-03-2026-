// Database types matching the Supabase tables from the migration script
// These types mirror the exact columns in each table for type-safe CRUD

export type UserRole = "manager" | "dispatcher"

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired"
export type VehicleType = "Truck" | "Van" | "Bike"
export type DriverStatus = "On Duty" | "Off Duty" | "Suspended"
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled"
export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed"
export type ExpenseCategory = "Fuel" | "Maintenance" | "Insurance" | "Tolls" | "Permits" | "Other"

// ---------- profiles ----------
export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_initials: string
  created_at: string
  updated_at: string
}

// ---------- vehicles ----------
export interface DbVehicle {
  id: string
  name: string
  type: VehicleType
  license_plate: string
  max_capacity: number
  odometer: number
  status: VehicleStatus
  region: string
  acquisition_cost: number
  year_acquired: number
  created_at: string
  updated_at: string
}

// ---------- drivers ----------
export interface DbDriver {
  id: string
  name: string
  email: string
  phone: string
  license_number: string
  license_expiry: string
  license_categories: VehicleType[]
  status: DriverStatus
  safety_score: number
  trips_completed: number
  avatar_initials: string
  created_at: string
  updated_at: string
}

// ---------- trips ----------
export interface DbTrip {
  id: string
  vehicle_id: string
  driver_id: string
  origin: string
  destination: string
  cargo_weight: number
  cargo_description: string
  status: TripStatus
  start_odometer: number
  end_odometer: number | null
  estimated_fuel_cost: number | null
  actual_fuel_cost: number | null
  liters_filled: number | null
  dispatched_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ---------- maintenance_logs ----------
export interface DbMaintenanceLog {
  id: string
  vehicle_id: string
  type: string
  description: string
  cost: number
  scheduled_date: string
  status: MaintenanceStatus
  created_at: string
  updated_at: string
}

// ---------- expenses ----------
export interface DbExpense {
  id: string
  vehicle_id: string
  trip_id: string | null
  category: ExpenseCategory
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}
