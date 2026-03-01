"use client"

import { useState, useMemo } from "react"
import { Search, Fuel, DollarSign, Lock, ArrowRight, MapPin, Gauge, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"

export function ExpensesPage() {
  const { canViewFinancials } = useAuth()
  const { trips, vehicles, drivers, fuelLogs, maintenanceLogs, updateTrip, getVehicle, getDriver, addFuelLog } = useFleet()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Form state for logging expenses on a completed trip
  const [selectedTripId, setSelectedTripId] = useState("")
  const [finalOdometer, setFinalOdometer] = useState("")
  const [actualFuelCost, setActualFuelCost] = useState("")
  const [litersFilled, setLitersFilled] = useState("")

  if (!canViewFinancials) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Access Restricted</p>
            <p className="text-xs text-muted-foreground">Expense data is only available to managers. Contact your administrator for access.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Only show completed trips
  const completedTrips = useMemo(() => trips.filter((t) => t.status === "Completed"), [trips])

  // Trips that already have expense data logged
  const loggedTrips = useMemo(() => completedTrips.filter((t) => t.actualFuelCost != null), [completedTrips])

  // Trips that still need expense logging (no actualFuelCost yet)
  const unloggedTrips = useMemo(() => completedTrips.filter((t) => t.actualFuelCost == null), [completedTrips])

  // Selected trip details for the form
  const selectedTrip = trips.find((t) => t.id === selectedTripId)
  const selectedVehicle = selectedTrip ? getVehicle(selectedTrip.vehicleId) : undefined
  const selectedDriver = selectedTrip ? getDriver(selectedTrip.driverId) : undefined

  const totalKmTraveled = selectedTrip && finalOdometer
    ? Math.max(0, Number(finalOdometer) - selectedTrip.startOdometer)
    : 0

  // Summary calculations
  const totalFuel = fuelLogs.reduce((acc, f) => acc + Number(f.cost), 0)
  const totalMaintenance = maintenanceLogs.reduce((acc, m) => acc + Number(m.cost), 0)
  const totalCost = totalFuel + totalMaintenance
  const totalLiters = fuelLogs.reduce((acc, f) => acc + Number(f.liters), 0)

  // Filtered logged trips for the table
  const filteredLogged = loggedTrips.filter((t) => {
    const vehicle = getVehicle(t.vehicleId)
    const driver = getDriver(t.driverId)
    const searchLower = search.toLowerCase()
    return (
      t.id.toLowerCase().includes(searchLower) ||
      (vehicle?.name ?? "").toLowerCase().includes(searchLower) ||
      (driver?.name ?? "").toLowerCase().includes(searchLower) ||
      t.origin.toLowerCase().includes(searchLower) ||
      t.destination.toLowerCase().includes(searchLower)
    )
  })

  function handleSelectTrip(tripId: string) {
    setSelectedTripId(tripId)
    const trip = trips.find((t) => t.id === tripId)
    if (trip) {
      // Auto-fill the final odometer from endOdometer if available
      setFinalOdometer(trip.endOdometer ? String(trip.endOdometer) : "")
      setActualFuelCost("")
      setLitersFilled("")
    }
  }

  async function handleLogExpense() {
    if (!selectedTripId || !finalOdometer || !actualFuelCost || !litersFilled) return
    const tripToUpdate = trips.find((t) => t.id === selectedTripId)
    const parsedFinalOdometer = Number(finalOdometer)
    const parsedActualFuelCost = Number(actualFuelCost)
    const parsedLitersFilled = Number(litersFilled)

    // Update the trip with expense data
    await updateTrip(selectedTripId, {
      actualFuelCost: parsedActualFuelCost,
      litersFilled: parsedLitersFilled,
      finalOdometer: parsedFinalOdometer,
    })

    // Also add a fuel log entry for this trip
    if (tripToUpdate) {
      await addFuelLog({
        vehicleId: tripToUpdate.vehicleId,
        tripId: tripToUpdate.id,
        liters: parsedLitersFilled,
        cost: parsedActualFuelCost,
        date: tripToUpdate.completedAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
        odometer: parsedFinalOdometer,
      })
    }

    setDialogOpen(false)
    setSelectedTripId("")
    setFinalOdometer("")
    setActualFuelCost("")
    setLitersFilled("")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-info/10">
              <DollarSign className="size-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Operational</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalCost.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-chart-3/10">
              <Fuel className="size-4 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Fuel</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalFuel.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10">
              <DollarSign className="size-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Maintenance</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalMaintenance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Fuel className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Liters</p>
              <p className="text-lg font-bold text-foreground">{totalLiters.toLocaleString()} L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Trips Expense Log */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Completed Trip Expenses</h2>
          <p className="text-xs text-muted-foreground">Only completed (Done) trips are shown. Log fuel & expense data per trip.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-60 pl-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setDialogOpen(true)}
            disabled={unloggedTrips.length === 0}
          >
            <Fuel className="size-3.5" />
            Log Trip Expense
          </Button>
        </div>
      </div>

      {/* Pending Logging Banner */}
      {unloggedTrips.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-warning/10">
              <Gauge className="size-4 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{unloggedTrips.length} completed trip{unloggedTrips.length > 1 ? "s" : ""} pending expense logging</p>
              <p className="text-xs text-muted-foreground">Click "Log Trip Expense" to record fuel costs and odometer readings.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logged Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Expense Records</CardTitle>
          <CardDescription className="text-xs">Fuel and odometer data for completed trips</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Trip ID</TableHead>
                <TableHead className="text-xs">Route</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs">Start Odo.</TableHead>
                <TableHead className="text-xs">Final Odo.</TableHead>
                <TableHead className="text-xs">KM Traveled</TableHead>
                <TableHead className="text-xs">Est. Fuel (&#8377;)</TableHead>
                <TableHead className="text-xs">Actual Fuel (&#8377;)</TableHead>
                <TableHead className="text-xs">Liters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogged.map((trip) => {
                const vehicle = getVehicle(trip.vehicleId)
                const driver = getDriver(trip.driverId)
                const kmTraveled = (trip.finalOdometer ?? trip.endOdometer ?? 0) - trip.startOdometer
                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{trip.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-foreground">{trip.origin}</span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span className="text-foreground">{trip.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{vehicle?.name ?? trip.vehicleId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{driver?.name ?? trip.driverId}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{trip.startOdometer.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{(trip.finalOdometer ?? trip.endOdometer ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-mono">{kmTraveled.toLocaleString()} km</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{"\u20B9"}{Number(trip.estimatedFuelCost ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{"\u20B9"}{Number(trip.actualFuelCost ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{Number(trip.litersFilled ?? 0)} L</TableCell>
                  </TableRow>
                )
              })}
              {filteredLogged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">
                    No expense records found. Log expenses for completed trips.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Trip Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Trip Expense</DialogTitle>
            <DialogDescription>Select a completed trip and record the actual fuel cost and odometer readings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Trip Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Select Completed Trip</Label>
              <Select value={selectedTripId} onValueChange={handleSelectTrip}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose a completed trip..." /></SelectTrigger>
                <SelectContent>
                  {unloggedTrips.length === 0 && (
                    <SelectItem value="none" disabled>All trips have been logged</SelectItem>
                  )}
                  {unloggedTrips.map((t) => {
                    const v = getVehicle(t.vehicleId)
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        {t.id} - {t.origin} {"\u2192"} {t.destination} ({v?.name})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-populated trip details */}
            {selectedTrip && (
              <>
                <Separator />
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground mb-2">Auto-populated Trip Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Driver</p>
                        <p className="text-xs font-medium text-foreground">{selectedDriver?.name ?? "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Driver ID</p>
                        <p className="text-xs font-mono text-foreground">{selectedTrip.driverId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Vehicle</p>
                        <p className="text-xs font-medium text-foreground">{selectedVehicle?.name ?? "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Starting Odometer</p>
                        <p className="text-xs font-mono text-foreground">{selectedTrip.startOdometer.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />

                {/* Final Odometer */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Final Odometer (km)</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min={selectedTrip.startOdometer}
                    value={finalOdometer}
                    onChange={(e) => setFinalOdometer(e.target.value)}
                    placeholder="Enter final reading"
                  />
                </div>

                {/* Total KM Traveled - live calculation */}
                {totalKmTraveled > 0 && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Total KM Traveled</span>
                    <Badge variant="secondary" className="text-xs font-mono bg-success/10 text-success">
                      {totalKmTraveled.toLocaleString()} km
                    </Badge>
                  </div>
                )}

                {/* Actual Fuel Cost & Liters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Actual Fuel Cost (&#8377;)</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      min="0"
                      value={actualFuelCost}
                      onChange={(e) => setActualFuelCost(e.target.value)}
                      placeholder="e.g. 2500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Liters Filled</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      min="0"
                      value={litersFilled}
                      onChange={(e) => setLitersFilled(e.target.value)}
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>

                {/* Estimated vs Actual comparison */}
                {Number(selectedTrip.estimatedFuelCost ?? 0) > 0 && actualFuelCost && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Estimated</p>
                      <p className="text-xs font-medium text-foreground">{"\u20B9"}{Number(selectedTrip.estimatedFuelCost ?? 0).toLocaleString()}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Actual</p>
                      <p className="text-xs font-medium text-foreground">{"\u20B9"}{Number(actualFuelCost).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Difference</p>
                      <p className={`text-xs font-medium ${Number(actualFuelCost) <= Number(selectedTrip.estimatedFuelCost ?? 0) ? "text-success" : "text-destructive"}`}>
                        {Number(actualFuelCost) <= Number(selectedTrip.estimatedFuelCost ?? 0) ? "-" : "+"}{"\u20B9"}{Math.abs(Number(actualFuelCost) - Number(selectedTrip.estimatedFuelCost ?? 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); setSelectedTripId("") }}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleLogExpense}
              disabled={!selectedTripId || !finalOdometer || !actualFuelCost || !litersFilled}
            >
              Log Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

