"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import {
  type Vehicle, type Driver, type Trip, type MaintenanceLog, type FuelLog,
  type TripStatus,
} from "./fleet-data"

const API_URL = "/api"

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeVehicle(v: Vehicle): Vehicle {
  return {
    ...v,
    maxCapacity: toNumber(v.maxCapacity),
    odometer: toNumber(v.odometer),
    acquisitionCost: toNumber(v.acquisitionCost),
    yearAcquired: toNumber(v.yearAcquired, new Date().getFullYear()),
  }
}

function normalizeTrip(t: Trip): Trip {
  return {
    ...t,
    cargoWeight: toNumber(t.cargoWeight),
    startOdometer: toNumber(t.startOdometer),
    endOdometer: t.endOdometer == null ? undefined : toNumber(t.endOdometer),
    estimatedFuelCost: t.estimatedFuelCost == null ? undefined : toNumber(t.estimatedFuelCost),
    actualFuelCost: t.actualFuelCost == null ? undefined : toNumber(t.actualFuelCost),
    litersFilled: t.litersFilled == null ? undefined : toNumber(t.litersFilled),
    finalOdometer: t.finalOdometer == null ? undefined : toNumber(t.finalOdometer),
  }
}

function normalizeMaintenanceLog(log: MaintenanceLog): MaintenanceLog {
  return {
    ...log,
    cost: toNumber(log.cost),
  }
}

function normalizeFuelLog(log: FuelLog): FuelLog {
  return {
    ...log,
    liters: toNumber(log.liters),
    cost: toNumber(log.cost),
    odometer: toNumber(log.odometer),
  }
}

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
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>
  updateTripStatus: (id: string, status: TripStatus, endOdometer?: number) => Promise<void>
  addMaintenanceLog: (m: Omit<MaintenanceLog, "id">) => Promise<void>
  updateMaintenanceLog: (id: string, updates: Partial<MaintenanceLog>) => Promise<void>
  addFuelLog: (f: Omit<FuelLog, "id">) => Promise<void>
  getVehicle: (id: string) => Vehicle | undefined
  getDriver: (id: string) => Driver | undefined
  refetchData: () => Promise<void>
}

const FleetContext = createContext<FleetContextType | null>(null)

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoints = ["vehicles", "drivers", "trips", "maintenance", "fuel"];
      const results = await Promise.allSettled(
        endpoints.map(async (e) => {
          const res = await fetch(`${API_URL}/${e}`);
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error(`API ${e} error ${res.status}:`, errBody.error || res.statusText);
            return []; // return empty array on error so app still loads
          }
          return res.json();
        })
      );

      const [vResult, dResult, tResult, mResult, fResult] = results;
      setVehicles(vResult.status === "fulfilled" ? vResult.value.map(normalizeVehicle) : []);
      setDrivers(dResult.status === "fulfilled" ? dResult.value : []);
      setTrips(tResult.status === "fulfilled" ? tResult.value.map(normalizeTrip) : []);
      setMaintenanceLogs(mResult.status === "fulfilled" ? mResult.value.map(normalizeMaintenanceLog) : []);
      setFuelLogs(fResult.status === "fulfilled" ? fResult.value.map(normalizeFuelLog) : []);

      const anyError = results.some(r => r.status === "rejected");
      if (anyError) {
        console.warn("Some API calls failed. Ensure MySQL is running and tables are imported from reconstruct-db.sql");
      } else {
        console.log("Data fetched successfully.");
      }
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("CRITICAL: Failed to reach API. Error:", msg);
      console.warn("Check: 1) node server.js is running. 2) MySQL is running. 3) reconstruct-db.sql is imported in phpMyAdmin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchData()
  }, [refetchData])

  const addVehicle = useCallback(async (v: Omit<Vehicle, "id">) => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      })
      const newVehicle = await res.json()
      setVehicles((prev) => [...prev, normalizeVehicle(newVehicle)])
    } catch (error) {
      console.error("Error adding vehicle:", error)
    }
  }, [])

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    try {
      await fetch(`${API_URL}/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)))
    } catch (error) {
      console.error("Error updating vehicle:", error)
    }
  }, [])

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/vehicles/${id}`, { method: "DELETE" })
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    } catch (error) {
      console.error("Error deleting vehicle:", error)
    }
  }, [])

  const addDriver = useCallback(async (d: Omit<Driver, "id">) => {
    try {
      const res = await fetch(`${API_URL}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      })
      const newDriver = await res.json()
      setDrivers((prev) => [...prev, newDriver])
    } catch (error) {
      console.error("Error adding driver:", error)
    }
  }, [])

  const updateDriver = useCallback(async (id: string, updates: Partial<Driver>) => {
    try {
      await fetch(`${API_URL}/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
    } catch (error) {
      console.error("Error updating driver:", error)
    }
  }, [])

  const deleteDriver = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/drivers/${id}`, { method: "DELETE" })
      setDrivers((prev) => prev.filter((d) => d.id !== id))
    } catch (error) {
      console.error("Error deleting driver:", error)
    }
  }, [])

  const addTrip = useCallback(async (t: Omit<Trip, "id">) => {
    try {
      const res = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      })
      const newTrip = await res.json()
      setTrips((prev) => [normalizeTrip(newTrip), ...prev])
      refetchData() // Refresh to get updated vehicle/driver statuses
    } catch (error) {
      console.error("Error adding trip:", error)
    }
  }, [refetchData])

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
    try {
      await fetch(`${API_URL}/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      setTrips((prev) => prev.map((t) => (t.id === id ? normalizeTrip({ ...t, ...updates }) : t)))
    } catch (error) {
      console.error("Error updating trip:", error)
    }
  }, [])

  const updateTripStatus = useCallback(async (id: string, status: TripStatus, endOdometer?: number) => {
    try {
      await fetch(`${API_URL}/trips/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, endOdometer }),
      })
      refetchData()
    } catch (error) {
      console.error("Error updating trip status:", error)
    }
  }, [refetchData])

  const addMaintenanceLog = useCallback(async (m: Omit<MaintenanceLog, "id">) => {
    try {
      const res = await fetch(`${API_URL}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      })
      const newLog = await res.json()
      setMaintenanceLogs((prev) => [normalizeMaintenanceLog(newLog), ...prev])
      refetchData()
    } catch (error) {
      console.error("Error adding maintenance log:", error)
    }
  }, [refetchData])

  const updateMaintenanceLog = useCallback(async (id: string, updates: Partial<MaintenanceLog>) => {
    try {
      await fetch(`${API_URL}/maintenance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      refetchData()
    } catch (error) {
      console.error("Error updating maintenance log:", error)
    }
  }, [refetchData])

  const addFuelLog = useCallback(async (f: Omit<FuelLog, "id">) => {
    try {
      const res = await fetch(`${API_URL}/fuel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      })
      const newFuelLog = await res.json()
      setFuelLogs((prev) => [normalizeFuelLog(newFuelLog), ...prev])
    } catch (error) {
      console.error("Error adding fuel log:", error)
    }
  }, [])

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
