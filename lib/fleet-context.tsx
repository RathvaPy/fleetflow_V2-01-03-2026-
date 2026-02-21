"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import {
  type Vehicle, type Driver, type Trip, type MaintenanceLog, type FuelLog,
  type VehicleStatus, type DriverStatus, type TripStatus,
  initialVehicles, initialDrivers, initialTrips, initialMaintenanceLogs, initialFuelLogs,
} from "./fleet-data"
import { useAuth } from "./auth-context"
import {
  fetchVehicles,
  fetchDrivers,
  fetchTrips,
  fetchMaintenanceLogs,
  insertVehicle,
  updateVehicleInDb,
  deleteVehicleFromDb,
  insertDriver,
  updateDriverInDb,
  deleteDriverFromDb,
  insertTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  insertMaintenanceLog,
  updateMaintenanceLogInDb,
} from "./supabase/data"

interface FleetContextType {
  vehicles: Vehicle[]
  drivers: Driver[]
  trips: Trip[]
  maintenanceLogs: MaintenanceLog[]
  fuelLogs: FuelLog[]
  isLoading: boolean
  addVehicle: (v: Omit<Vehicle, "id">) => Promise<void>
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  addDriver: (d: Omit<Driver, "id">) => Promise<void>
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>
  deleteDriver: (id: string) => Promise<void>
  addTrip: (t: Omit<Trip, "id">) => Promise<void>
  updateTrip: (id: string, updates: Partial<Trip>) => void
  updateTripStatus: (id: string, status: TripStatus, endOdometer?: number) => Promise<void>
  addMaintenanceLog: (m: Omit<MaintenanceLog, "id">) => Promise<void>
  updateMaintenanceLog: (id: string, updates: Partial<MaintenanceLog>) => Promise<void>
  addFuelLog: (f: Omit<FuelLog, "id">) => void
  getVehicle: (id: string) => Vehicle | undefined
  getDriver: (id: string) => Driver | undefined
  refetchData: () => Promise<void>
}

const FleetContext = createContext<FleetContextType | null>(null)

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(initialMaintenanceLogs)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(initialFuelLogs)
  const [isLoading, setIsLoading] = useState(true)
  const { supabaseConfigured } = useAuth()

  // Fetch data from Supabase on mount if configured
  const refetchData = useCallback(async () => {
    if (!supabaseConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [vehiclesData, driversData, tripsData, maintenanceData] = await Promise.all([
        fetchVehicles(),
        fetchDrivers(),
        fetchTrips(),
        fetchMaintenanceLogs(),
      ])

      setVehicles(vehiclesData)
      setDrivers(driversData)
      setTrips(tripsData)
      setMaintenanceLogs(maintenanceData)
    } catch (error) {
      console.error("Error fetching data from Supabase:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabaseConfigured])

  useEffect(() => {
    refetchData()
  }, [refetchData])

  const addVehicle = useCallback(async (v: Omit<Vehicle, "id">) => {
    if (supabaseConfigured) {
      const newVehicle = await insertVehicle(v)
      setVehicles((prev) => [...prev, newVehicle])
    } else {
      const id = `V${String(vehicles.length + 1).padStart(3, "0")}`
      setVehicles((prev) => [...prev, { ...v, id }])
    }
  }, [vehicles.length, supabaseConfigured])

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    if (supabaseConfigured) {
      const updated = await updateVehicleInDb(id, updates)
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } else {
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)))
    }
  }, [supabaseConfigured])

  const deleteVehicle = useCallback(async (id: string) => {
    if (supabaseConfigured) {
      await deleteVehicleFromDb(id)
    }
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }, [supabaseConfigured])

  const addDriver = useCallback(async (d: Omit<Driver, "id">) => {
    if (supabaseConfigured) {
      const newDriver = await insertDriver(d)
      setDrivers((prev) => [...prev, newDriver])
    } else {
      const id = `D${String(drivers.length + 1).padStart(3, "0")}`
      setDrivers((prev) => [...prev, { ...d, id }])
    }
  }, [drivers.length, supabaseConfigured])

  const updateDriver = useCallback(async (id: string, updates: Partial<Driver>) => {
    if (supabaseConfigured) {
      const updated = await updateDriverInDb(id, updates)
      setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } else {
      setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
    }
  }, [supabaseConfigured])

  const deleteDriver = useCallback(async (id: string) => {
    if (supabaseConfigured) {
      await deleteDriverFromDb(id)
    }
    setDrivers((prev) => prev.filter((d) => d.id !== id))
  }, [supabaseConfigured])

  const addTrip = useCallback(async (t: Omit<Trip, "id">) => {
    if (supabaseConfigured) {
      const newTrip = await insertTrip(t)
      setTrips((prev) => [newTrip, ...prev])
      // Refresh vehicles and drivers to get updated status
      const [updatedVehicles, updatedDrivers] = await Promise.all([
        fetchVehicles(),
        fetchDrivers(),
      ])
      setVehicles(updatedVehicles)
      setDrivers(updatedDrivers)
    } else {
      const id = `T${String(trips.length + 1).padStart(3, "0")}`
      setTrips((prev) => [...prev, { ...t, id }])
      // Update vehicle & driver status
      setVehicles((prev) => prev.map((v) => (v.id === t.vehicleId ? { ...v, status: "On Trip" as VehicleStatus } : v)))
      setDrivers((prev) => prev.map((d) => (d.id === t.driverId ? { ...d, status: "On Duty" as DriverStatus } : d)))
    }
  }, [trips.length, supabaseConfigured])

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    // Local update only - for cases where we don't need DB update
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

  const updateTripStatus = useCallback(async (id: string, status: TripStatus, endOdometer?: number) => {
    if (supabaseConfigured) {
      let updatedTrip: Trip
      if (status === "Dispatched") {
        updatedTrip = await dispatchTrip(id)
      } else if (status === "Completed") {
        updatedTrip = await completeTrip(id, endOdometer!)
      } else if (status === "Cancelled") {
        updatedTrip = await cancelTrip(id)
      } else {
        return
      }
      
      setTrips((prev) => prev.map((t) => (t.id === id ? updatedTrip : t)))
      
      // Refresh vehicles and drivers to get updated status
      const [updatedVehicles, updatedDrivers] = await Promise.all([
        fetchVehicles(),
        fetchDrivers(),
      ])
      setVehicles(updatedVehicles)
      setDrivers(updatedDrivers)
    } else {
      // Local state update (fallback)
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const updated = { ...t, status }
          if (status === "Dispatched") updated.dispatchedAt = new Date().toISOString()
          if (status === "Completed") {
            updated.completedAt = new Date().toISOString()
            if (endOdometer) updated.endOdometer = endOdometer
          }
          return updated
        })
      )
      // If completed or cancelled, free up vehicle & driver
      if (status === "Completed" || status === "Cancelled") {
        const trip = trips.find((t) => t.id === id)
        if (trip) {
          setVehicles((prev) => prev.map((v) => (v.id === trip.vehicleId ? { ...v, status: "Available" as VehicleStatus, ...(endOdometer ? { odometer: endOdometer } : {}) } : v)))
          setDrivers((prev) => prev.map((d) => (d.id === trip.driverId ? { ...d, status: "Off Duty" as DriverStatus, tripsCompleted: d.tripsCompleted + (status === "Completed" ? 1 : 0) } : d)))
        }
      }
    }
  }, [trips, supabaseConfigured])

  const addMaintenanceLog = useCallback(async (m: Omit<MaintenanceLog, "id">) => {
    if (supabaseConfigured) {
      const newLog = await insertMaintenanceLog(m)
      setMaintenanceLogs((prev) => [newLog, ...prev])
      // Refresh vehicles to get updated status
      const updatedVehicles = await fetchVehicles()
      setVehicles(updatedVehicles)
    } else {
      const id = `M${String(maintenanceLogs.length + 1).padStart(3, "0")}`
      setMaintenanceLogs((prev) => [...prev, { ...m, id }])
      // Auto-set vehicle to "In Shop"
      if (m.status !== "Completed") {
        setVehicles((prev) => prev.map((v) => (v.id === m.vehicleId ? { ...v, status: "In Shop" as VehicleStatus } : v)))
      }
    }
  }, [maintenanceLogs.length, supabaseConfigured])

  const updateMaintenanceLog = useCallback(async (id: string, updates: Partial<MaintenanceLog>) => {
    if (supabaseConfigured) {
      const updated = await updateMaintenanceLogInDb(id, updates)
      setMaintenanceLogs((prev) => prev.map((m) => (m.id === id ? updated : m)))
      // Refresh vehicles to get updated status
      const updatedVehicles = await fetchVehicles()
      setVehicles(updatedVehicles)
    } else {
      setMaintenanceLogs((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
      // If marking as completed, set vehicle back to Available
      if (updates.status === "Completed") {
        const log = maintenanceLogs.find((m) => m.id === id)
        if (log) {
          const otherActiveLogs = maintenanceLogs.filter(
            (m) => m.id !== id && m.vehicleId === log.vehicleId && m.status !== "Completed"
          )
          if (otherActiveLogs.length === 0) {
            setVehicles((prev) => prev.map((v) => (v.id === log.vehicleId ? { ...v, status: "Available" as VehicleStatus } : v)))
          }
        }
      }
    }
  }, [maintenanceLogs, supabaseConfigured])

  const addFuelLog = useCallback((f: Omit<FuelLog, "id">) => {
    // Fuel logs are not stored in Supabase in this implementation
    // Keeping local-only for now
    const id = `F${String(fuelLogs.length + 1).padStart(3, "0")}`
    setFuelLogs((prev) => [...prev, { ...f, id }])
  }, [fuelLogs.length])

  const getVehicle = useCallback((id: string) => vehicles.find((v) => v.id === id), [vehicles])
  const getDriver = useCallback((id: string) => drivers.find((d) => d.id === id), [drivers])

  return (
    <FleetContext.Provider
      value={{
        vehicles, drivers, trips, maintenanceLogs, fuelLogs, isLoading,
        addVehicle, updateVehicle, deleteVehicle, addDriver, updateDriver, deleteDriver,
        addTrip, updateTrip, updateTripStatus, addMaintenanceLog, updateMaintenanceLog, addFuelLog,
        getVehicle, getDriver, refetchData,
      }}
    >
      {children}
    </FleetContext.Provider>
  )
}

export function useFleet() {
  const ctx = useContext(FleetContext)
  if (!ctx) throw new Error("useFleet must be used within FleetProvider")
  return ctx
}
