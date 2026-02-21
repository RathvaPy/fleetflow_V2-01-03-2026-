/**
 * Supabase CRUD helper functions for FleetFlow.
 *
 * These are thin wrappers around the Supabase browser client.
 * Each function maps to one table and one operation so that
 * components can call them directly (or through fleet-context once
 * you swap the in-memory store for live data).
 *
 * Usage example:
 *   import { fetchVehicles, insertVehicle } from "@/lib/supabase/hooks"
 *   const vehicles = await fetchVehicles()
 *   await insertVehicle({ name: "Cargo-11", ... })
 */

import { createClient } from "./client"
import type {
  DbVehicle,
  DbDriver,
  DbTrip,
  DbMaintenanceLog,
  DbExpense,
  Profile,
} from "./types"

// ─── helpers ────────────────────────────────────────────────────────
const supabase = () => createClient()

// ─── profiles ───────────────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase()
    .from("profiles")
    .update(updates)
    .eq("id", userId)
  if (error) throw error
}

// ─── vehicles ───────────────────────────────────────────────────────

export async function fetchVehicles() {
  const { data, error } = await supabase()
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as DbVehicle[]
}

export async function insertVehicle(vehicle: Omit<DbVehicle, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase()
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single()
  if (error) throw error
  return data as DbVehicle
}

export async function updateVehicle(id: string, updates: Partial<DbVehicle>) {
  const { error } = await supabase()
    .from("vehicles")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase()
    .from("vehicles")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ─── drivers ────────────────────────────────────────────────────────

export async function fetchDrivers() {
  const { data, error } = await supabase()
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as DbDriver[]
}

export async function insertDriver(driver: Omit<DbDriver, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase()
    .from("drivers")
    .insert(driver)
    .select()
    .single()
  if (error) throw error
  return data as DbDriver
}

export async function updateDriver(id: string, updates: Partial<DbDriver>) {
  const { error } = await supabase()
    .from("drivers")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

export async function deleteDriver(id: string) {
  const { error } = await supabase()
    .from("drivers")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ─── trips ──────────────────────────────────────────────────────────

export async function fetchTrips() {
  const { data, error } = await supabase()
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as DbTrip[]
}

export async function insertTrip(trip: Omit<DbTrip, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase()
    .from("trips")
    .insert(trip)
    .select()
    .single()
  if (error) throw error
  return data as DbTrip
}

export async function updateTrip(id: string, updates: Partial<DbTrip>) {
  const { error } = await supabase()
    .from("trips")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

export async function deleteTripRow(id: string) {
  const { error } = await supabase()
    .from("trips")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ─── maintenance_logs ───────────────────────────────────────────────

export async function fetchMaintenanceLogs() {
  const { data, error } = await supabase()
    .from("maintenance_logs")
    .select("*")
    .order("scheduled_date", { ascending: false })
  if (error) throw error
  return data as DbMaintenanceLog[]
}

export async function insertMaintenanceLog(
  log: Omit<DbMaintenanceLog, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase()
    .from("maintenance_logs")
    .insert(log)
    .select()
    .single()
  if (error) throw error
  return data as DbMaintenanceLog
}

export async function updateMaintenanceLog(id: string, updates: Partial<DbMaintenanceLog>) {
  const { error } = await supabase()
    .from("maintenance_logs")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

// ─── expenses ───────────────────────────────────────────────────────

export async function fetchExpenses() {
  const { data, error } = await supabase()
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
  if (error) throw error
  return data as DbExpense[]
}

export async function insertExpense(
  expense: Omit<DbExpense, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase()
    .from("expenses")
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data as DbExpense
}

export async function updateExpense(id: string, updates: Partial<DbExpense>) {
  const { error } = await supabase()
    .from("expenses")
    .update(updates)
    .eq("id", id)
  if (error) throw error
}

export async function deleteExpense(id: string) {
  const { error } = await supabase()
    .from("expenses")
    .delete()
    .eq("id", id)
  if (error) throw error
}

// ─── analytics helpers (RPC calls) ──────────────────────────────────

export async function fetchDashboardStats() {
  const { data, error } = await supabase().rpc("get_dashboard_stats")
  if (error) throw error
  return data
}

export async function fetchUserRole() {
  const { data, error } = await supabase().rpc("get_my_role")
  if (error) throw error
  return data as string
}
