/**
 * Supabase Integration Example for FleetFlow
 * 
 * This file demonstrates how to replace mock useEffect data fetching
 * with Supabase queries using the new fleet-context.
 * 
 * =====================================================
 * BASIC USAGE - The context now handles Supabase automatically!
 * =====================================================
 * 
 * The FleetProvider in fleet-context.tsx now:
 * 1. Automatically fetches data from Supabase on mount (if configured)
 * 2. Falls back to mock data when Supabase is not configured
 * 3. Provides CRUD operations that work with both Supabase and mock data
 * 
 * Your existing components will work without any changes!
 * 
 * Example:
 * 
 * 
```
tsx
 * "use client"
 * import { useFleet } from "@/lib/fleet-context"
 * 
 * export function MyComponent() {
 *   const { vehicles, drivers, trips, isLoading } = useFleet()
 * 
 *   if (isLoading) return <div>Loading...</div>
 * 
 *   return (
 *     <div>
 *       {vehicles.map(v => v.name)}
 *     </div>
 *   )
 * }
 * 
```
 * 
 * =====================================================
 * DIRECT SUPABASE ACCESS - For custom queries
 * =====================================================
 * 
 * If you need direct access to Supabase data (e.g., for specific filters),
 * you can import the data functions directly:
 * 
 * 
```
tsx
 * import { 
 *   fetchVehicles, 
 *   fetchAvailableVehicles,
 *   fetchOnDutyDrivers,
 *   fetchDashboardCounts,
 *   insertTrip,
 *   dispatchTrip,
 *   completeTrip 
 * } from "@/lib/supabase/data"
 * 
 * // Example: Dashboard with custom counts
 * useEffect(() => {
 *   async function loadDashboardData() {
 *     const counts = await fetchDashboardCounts()
 *     console.log('Active Fleet:', counts.activeFleet)
 *     console.log('Maintenance Alerts:', counts.maintenanceAlerts)
 *   }
 *   loadDashboardData()
 * }, [])
 * 
 * // Example: Get only available vehicles for dispatch
 * useEffect(() => {
 *   async function loadAvailableVehicles() {
 *     const vehicles = await fetchAvailableVehicles()
 *     setAvailableVehicles(vehicles)
 *   }
 *   loadAvailableVehicles()
 * }, [])
 * 
 * // Example: Get only on-duty drivers with valid license
 * useEffect(() => {
 *   async function loadOnDutyDrivers() {
 *     const drivers = await fetchOnDutyDrivers()
 *     setDrivers(drivers)
 *   }
 *   loadOnDutyDrivers()
 * }, [])
 * 
 * =====================================================
 * TRIP DISPATCH FLOW (with validation preserved)
 * =====================================================
 * 
 * The existing validation logic (End Odometer > Start Odometer) is preserved
 * in the trips.tsx component. The Supabase integration handles:
 * 
 * 1. Creating trip record (insertTrip)
 * 2. Updating vehicle status to "On Trip"
 * 3. Updating driver status to "On Duty"
 * 4. Dispatching (dispatchTrip)
 * 5. Completing (completeTrip) with:
 *    - Validation: endOdometer > startOdometer (handled in UI)
 *    - Updating vehicle odometer
 *    - Setting vehicle back to "Available"
 *    - Setting driver to "Off Duty"
 *    - Incrementing driver trips_completed
 * 
 * 
```
tsx
 * // In trips.tsx - handleCreateTrip now uses context
 * const handleCreateTrip = async () => {
 *   await addTrip({
 *     vehicleId,
 *     driverId,
 *     origin,
 *     destination,
 *     cargoWeight,
 *     cargoDescription,
 *     status: "Draft",
 *     createdAt: new Date().toISOString(),
 *     startOdometer,
 *     estimatedFuelCost,
 *   })
 *   // Vehicle and driver status are automatically updated!
 * }
 * 
 * // Dispatch - updateTripStatus handles all the logic
 * const handleDispatch = async (tripId: string) => {
 *   await updateTripStatus(tripId, "Dispatched")
 * }
 * 
 * // Complete - validation happens in UI, then:
 * const handleComplete = async (tripId: string, endOdometer: number) => {
 *   if (endOdometer <= startOdometer) {
 *     setError("End odometer must be greater than start odometer")
 *     return
 *   }
 *   await updateTripStatus(tripId, "Completed", endOdometer)
 *   // Vehicle odometer updated, vehicle/driver status freed
 * }
 * 
```
 * 
 * =====================================================
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * =====================================================
 * 
 * The auth-context now fetches the user's role from the profiles table
 * in Supabase after login. This ensures:
 * 
 * - Manager: Full access (create, edit, delete vehicles/drivers/trips)
 * - Dispatcher: Limited access (create/dispatch trips, view all)
 * 
 * 
```
tsx
 * import { useAuth } from "@/lib/auth-context"
 * 
 * function MyComponent() {
 *   const { isManager, isDispatcher, user } = useAuth()
 *   
 *   // user.role is now fetched from Supabase profiles table
 *   console.log('User Role:', user?.role) // "manager" | "dispatcher"
 *   
 *   return (
 *     <div>
 *       {isManager && <AdminPanel />}
 *       {isDispatcher && <DispatchPanel />}
 *     </div>
 *   )
 * }
 * 
```
 * 
 * =====================================================
 * ENVIRONMENT SETUP
 * =====================================================
 * 
 * Create a .env.local file with your Supabase credentials:
 * 
 * 
```
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 * 
```
 * 
 * Get these from: Project Settings > API in Supabase Dashboard
 */
