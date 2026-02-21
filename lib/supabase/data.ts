import { createClient } from "@/lib/supabase/client"
import type { DbVehicle, DbDriver, DbTrip, DbMaintenanceLog } from "./types"
import type { Vehicle, Driver, Trip, MaintenanceLog } from "@/lib/fleet-data"
import type { VehicleStatus, DriverStatus } from "@/lib/fleet-data"

// Initialize client
const supabase = createClient()

// ==================== VEHICLES ====================

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching vehicles:", error)
    throw error
  }

  return (data || []).map(mapDbVehicleToVehicle)
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching vehicle:", error)
    return null
  }

  return mapDbVehicleToVehicle(data)
}

export async function fetchAvailableVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("status", "Available")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching available vehicles:", error)
    throw error
  }

  return (data || []).map(mapDbVehicleToVehicle)
}

export async function insertVehicle(vehicle: Omit<Vehicle, "id">): Promise<Vehicle> {
  const dbVehicle = mapVehicleToDbVehicle(vehicle)
  
  const { data, error } = await supabase
    .from("vehicles")
    .insert(dbVehicle)
    .select()
    .single()

  if (error) {
    console.error("Error inserting vehicle:", error)
    throw error
  }

  return mapDbVehicleToVehicle(data)
}

export async function updateVehicleInDb(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  const dbUpdates = mapVehicleToDbVehicle(updates)
  
  const { data, error } = await supabase
    .from("vehicles")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating vehicle:", error)
    throw error
  }

  return mapDbVehicleToVehicle(data)
}

export async function deleteVehicleFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting vehicle:", error)
    throw error
  }
}

// ==================== DRIVERS ====================

export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching drivers:", error)
    throw error
  }

  return (data || []).map(mapDbDriverToDriver)
}

export async function fetchDriverById(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching driver:", error)
    return null
  }

  return mapDbDriverToDriver(data)
}

export async function fetchOnDutyDrivers(): Promise<Driver[]> {
  const today = new Date().toISOString().split("T")[0]
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("status", "On Duty")
    .gte("license_expiry", today)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching on duty drivers:", error)
    throw error
  }

  return (data || []).map(mapDbDriverToDriver)
}

export async function insertDriver(driver: Omit<Driver, "id">): Promise<Driver> {
  const dbDriver = mapDriverToDbDriver(driver)
  
  const { data, error } = await supabase
    .from("drivers")
    .insert(dbDriver)
    .select()
    .single()

  if (error) {
    console.error("Error inserting driver:", error)
    throw error
  }

  return mapDbDriverToDriver(data)
}

export async function updateDriverInDb(id: string, updates: Partial<Driver>): Promise<Driver> {
  const dbUpdates = mapDriverToDbDriver(updates)
  
  const { data, error } = await supabase
    .from("drivers")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating driver:", error)
    throw error
  }

  return mapDbDriverToDriver(data)
}

export async function deleteDriverFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting driver:", error)
    throw error
  }
}

// ==================== TRIPS ====================

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
    throw error
  }

  return (data || []).map(mapDbTripToTrip)
}

export async function fetchTripById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching trip:", error)
    return null
  }

  return mapDbTripToTrip(data)
}

export async function insertTrip(trip: Omit<Trip, "id">): Promise<Trip> {
  const dbTrip = mapTripToDbTrip(trip)
  
  const { data, error } = await supabase
    .from("trips")
    .insert(dbTrip)
    .select()
    .single()

  if (error) {
    console.error("Error inserting trip:", error)
    throw error
  }

  // Update vehicle status to "On Trip"
  await updateVehicleStatus(trip.vehicleId, "On Trip")
  
  // Update driver status to "On Duty"
  await updateDriverStatus(trip.driverId, "On Duty")

  return mapDbTripToTrip(data)
}

export async function dispatchTrip(id: string): Promise<Trip> {
  const now = new Date().toISOString()
  
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .update({ 
      status: "Dispatched",
      dispatched_at: now
    })
    .eq("id", id)
    .select()
    .single()

  if (tripError) {
    console.error("Error dispatching trip:", tripError)
    throw tripError
  }

  return mapDbTripToTrip(trip)
}

export async function completeTrip(id: string, endOdometer: number): Promise<Trip> {
  const now = new Date().toISOString()
  
  // First get the trip to find vehicle and driver
  const { data: existingTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()

  if (!existingTrip) {
    throw new Error("Trip not found")
  }

  const { data, error } = await supabase
    .from("trips")
    .update({
      status: "Completed",
      completed_at: now,
      end_odometer: endOdometer,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error completing trip:", error)
    throw error
  }

  // Update vehicle status back to "Available" and update odometer
  await updateVehicleOdometer(existingTrip.vehicle_id, endOdometer)
  await updateVehicleStatus(existingTrip.vehicle_id, "Available")
  
  // Update driver status to "Off Duty" and increment trips completed
  await incrementDriverTrips(existingTrip.driver_id)

  return mapDbTripToTrip(data)
}

export async function cancelTrip(id: string): Promise<Trip> {
  const now = new Date().toISOString()
  
  // First get the trip to find vehicle and driver
  const { data: existingTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()

  const { data, error } = await supabase
    .from("trips")
    .update({
      status: "Cancelled",
      completed_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error cancelling trip:", error)
    throw error
  }

  // Free up vehicle and driver
  if (existingTrip) {
    await updateVehicleStatus(existingTrip.vehicle_id, "Available")
    await updateDriverStatus(existingTrip.driver_id, "Off Duty")
  }

  return mapDbTripToTrip(data)
}

// ==================== MAINTENANCE LOGS ====================

export async function fetchMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase
    .from("maintenance_logs")
    .select("*")
    .order("scheduled_date", { ascending: false })

  if (error) {
    console.error("Error fetching maintenance logs:", error)
    throw error
  }

  return (data || []).map(mapDbMaintenanceToMaintenance)
}

export async function insertMaintenanceLog(log: Omit<MaintenanceLog, "id">): Promise<MaintenanceLog> {
  const dbLog = mapMaintenanceToDbMaintenance(log)
  
  const { data, error } = await supabase
    .from("maintenance_logs")
    .insert(dbLog)
    .select()
    .single()

  if (error) {
    console.error("Error inserting maintenance log:", error)
    throw error
  }

  // If status is not completed, set vehicle to "In Shop"
  if (log.status !== "Completed") {
    await updateVehicleStatus(log.vehicleId, "In Shop")
  }

  return mapDbMaintenanceToMaintenance(data)
}

export async function updateMaintenanceLogInDb(id: string, updates: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
  const dbUpdates = mapMaintenanceToDbMaintenance(updates)
  
  const { data, error } = await supabase
    .from("maintenance_logs")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating maintenance log:", error)
    throw error
  }

  // If marking as completed, set vehicle back to "Available"
  if (updates.status === "Completed") {
    const log = await supabase.from("maintenance_logs").select("vehicle_id").eq("id", id).single()
    if (log.data) {
      // Check if there are other active maintenance logs for this vehicle
      const { data: otherLogs } = await supabase
        .from("maintenance_logs")
        .select("id")
        .eq("vehicle_id", log.data.vehicle_id)
        .neq("id", id)
        .neq("status", "Completed")

      if (!otherLogs || otherLogs.length === 0) {
        await updateVehicleStatus(log.data.vehicle_id, "Available")
      }
    }
  }

  return mapDbMaintenanceToMaintenance(data)
}

// ==================== HELPER FUNCTIONS ====================

async function updateVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<void> {
  const { error } = await supabase
    .from("vehicles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)

  if (error) {
    console.error("Error updating vehicle status:", error)
    throw error
  }
}

async function updateVehicleOdometer(vehicleId: string, odometer: number): Promise<void> {
  const { error } = await supabase
    .from("vehicles")
    .update({ odometer, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)

  if (error) {
    console.error("Error updating vehicle odometer:", error)
    throw error
  }
}

async function updateDriverStatus(driverId: string, status: DriverStatus): Promise<void> {
  const { error } = await supabase
    .from("drivers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", driverId)

  if (error) {
    console.error("Error updating driver status:", error)
    throw error
  }
}

async function incrementDriverTrips(driverId: string): Promise<void> {
  // First get current trips count
  const { data: driver } = await supabase
    .from("drivers")
    .select("trips_completed")
    .eq("id", driverId)
    .single()

  if (driver) {
    const { error } = await supabase
      .from("drivers")
      .update({ 
        status: "Off Duty",
        trips_completed: driver.trips_completed + 1,
        updated_at: new Date().toISOString() 
      })
      .eq("id", driverId)

    if (error) {
      console.error("Error updating driver trips:", error)
      throw error
    }
  }
}

// ==================== MAPPING FUNCTIONS ====================

function mapDbVehicleToVehicle(db: DbVehicle): Vehicle {
  return {
    id: db.id,
    name: db.name,
    type: db.type,
    licensePlate: db.license_plate,
    maxCapacity: db.max_capacity,
    odometer: db.odometer,
    status: db.status,
    region: db.region,
    acquisitionCost: db.acquisition_cost,
    yearAcquired: db.year_acquired,
  }
}

function mapVehicleToDbVehicle(v: Partial<Vehicle>): Partial<DbVehicle> {
  return {
    name: v.name,
    type: v.type,
    license_plate: v.licensePlate,
    max_capacity: v.maxCapacity,
    odometer: v.odometer,
    status: v.status,
    region: v.region,
    acquisition_cost: v.acquisitionCost,
    year_acquired: v.yearAcquired,
  }
}

function mapDbDriverToDriver(db: DbDriver): Driver {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    licenseNumber: db.license_number,
    licenseExpiry: db.license_expiry,
    licenseCategories: db.license_categories,
    status: db.status,
    safetyScore: db.safety_score,
    tripsCompleted: db.trips_completed,
    avatar: db.avatar_initials,
  }
}

function mapDriverToDbDriver(d: Partial<Driver>): Partial<DbDriver> {
  return {
    name: d.name,
    email: d.email,
    phone: d.phone,
    license_number: d.licenseNumber,
    license_expiry: d.licenseExpiry,
    license_categories: d.licenseCategories,
    status: d.status,
    safety_score: d.safetyScore,
    trips_completed: d.tripsCompleted,
    avatar_initials: d.avatar,
  }
}

function mapDbTripToTrip(db: DbTrip): Trip {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    driverId: db.driver_id,
    origin: db.origin,
    destination: db.destination,
    cargoWeight: db.cargo_weight,
    cargoDescription: db.cargo_description,
    status: db.status,
    createdAt: db.created_at,
    dispatchedAt: db.dispatched_at || undefined,
    completedAt: db.completed_at || undefined,
    startOdometer: db.start_odometer,
    endOdometer: db.end_odometer || undefined,
    estimatedFuelCost: db.estimated_fuel_cost || undefined,
    actualFuelCost: db.actual_fuel_cost || undefined,
    litersFilled: db.liters_filled || undefined,
    finalOdometer: db.end_odometer || undefined,
  }
}

function mapTripToDbTrip(t: Partial<Trip>): Partial<DbTrip> {
  return {
    vehicle_id: t.vehicleId,
    driver_id: t.driverId,
    origin: t.origin,
    destination: t.destination,
    cargo_weight: t.cargoWeight,
    cargo_description: t.cargoDescription,
    status: t.status,
    start_odometer: t.startOdometer,
    end_odometer: t.endOdometer,
    estimated_fuel_cost: t.estimatedFuelCost,
    actual_fuel_cost: t.actualFuelCost,
    liters_filled: t.litersFilled,
    dispatched_at: t.dispatchedAt,
    completed_at: t.completedAt,
  }
}

function mapDbMaintenanceToMaintenance(db: DbMaintenanceLog): MaintenanceLog {
  return {
    id: db.id,
    vehicleId: db.vehicle_id,
    type: db.type,
    description: db.description,
    cost: db.cost,
    date: db.scheduled_date,
    status: db.status,
  }
}

function mapMaintenanceToDbMaintenance(m: Partial<MaintenanceLog>): Partial<DbMaintenanceLog> {
  return {
    vehicle_id: m.vehicleId,
    type: m.type,
    description: m.description,
    cost: m.cost,
    scheduled_date: m.date,
    status: m.status,
  }
}

// ==================== DASHBOARD COUNTS ====================

export async function fetchDashboardCounts() {
  // Get all vehicles for counts
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("status")

  const { data: trips } = await supabase
    .from("trips")
    .select("status")

  const { data: drivers } = await supabase
    .from("drivers")
    .select("status")

  const activeFleet = (vehicles || []).filter(v => v.status === "On Trip").length
  const maintenanceAlerts = (vehicles || []).filter(v => v.status === "In Shop").length
  const available = (vehicles || []).filter(v => v.status === "Available").length
  const totalActive = (vehicles || []).filter(v => v.status !== "Retired").length
  const pendingCargo = (trips || []).filter(t => t.status === "Draft").length

  return {
    activeFleet,
    maintenanceAlerts,
    available,
    totalActive,
    pendingCargo,
    totalDrivers: (drivers || []).length,
    onDutyDrivers: (drivers || []).filter(d => d.status === "On Duty").length,
  }
}
