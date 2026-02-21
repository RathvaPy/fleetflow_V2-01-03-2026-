"use client"

import { useState } from "react"
import { Plus, Search, AlertCircle, ChevronRight, ArrowRight, Eye } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"
import type { TripStatus } from "@/lib/fleet-data"

export function TripsPage() {
  const { trips, vehicles, drivers, addTrip, updateTripStatus, getVehicle, getDriver } = useFleet()
  const { isDispatcher, isManager } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [endOdometer, setEndOdometer] = useState("")
  const [odometerError, setOdometerError] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Form state
  const [vehicleId, setVehicleId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [cargoWeight, setCargoWeight] = useState("")
  const [cargoDescription, setCargoDescription] = useState("")
  const [estimatedFuelCost, setEstimatedFuelCost] = useState("")
  const [startOdometer, setStartOdometer] = useState("")
  const [capacityError, setCapacityError] = useState("")

  const availableVehicles = vehicles.filter((v) => v.status === "Available")
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)

  // Only show drivers whose license covers the vehicle type AND are not suspended AND have valid license
  const validDrivers = drivers.filter((d) => {
    if (d.status === "Suspended") return false
    if (new Date(d.licenseExpiry) < new Date()) return false
    if (selectedVehicle && !d.licenseCategories.includes(selectedVehicle.type)) return false
    return true
  })

  function handleWeightChange(val: string) {
    setCargoWeight(val)
    setCapacityError("")
    const numVal = Number(val)
    if (val !== "" && numVal <= 0) {
      setCapacityError("Cargo weight must be greater than 0 kg")
    } else if (selectedVehicle && numVal > selectedVehicle.maxCapacity) {
      setCapacityError(`Cargo weight exceeds ${selectedVehicle.name}'s max capacity of ${selectedVehicle.maxCapacity.toLocaleString()} kg`)
    }
  }

  function handleCreateTrip() {
    if (!vehicleId || !driverId || !origin || !destination || !cargoWeight) return
    if (capacityError) return

    addTrip({
      vehicleId,
      driverId,
      origin,
      destination,
      cargoWeight: Number(cargoWeight),
      cargoDescription,
      status: "Draft",
      createdAt: new Date().toISOString(),
      startOdometer: Number(startOdometer) || (selectedVehicle?.odometer ?? 0),
      estimatedFuelCost: Number(estimatedFuelCost) || 0,
    })

    setDialogOpen(false)
    setVehicleId("")
    setDriverId("")
    setOrigin("")
    setDestination("")
    setCargoWeight("")
    setCargoDescription("")
    setEstimatedFuelCost("")
    setStartOdometer("")
    setCapacityError("")
  }

  const selectedTrip = selectedTripId ? trips.find((t) => t.id === selectedTripId) : null

  function openCompleteDialog(tripId: string) {
    setSelectedTripId(tripId)
    setEndOdometer("")
    setOdometerError("")
    setCompleteDialogOpen(true)
  }

  function handleEndOdometerChange(val: string) {
    setEndOdometer(val)
    const numVal = Number(val)
    if (val && selectedTrip && numVal <= selectedTrip.startOdometer) {
      setOdometerError(`End odometer must be strictly greater than the starting odometer (${selectedTrip.startOdometer.toLocaleString()} km).`)
    } else if (val && numVal <= 0) {
      setOdometerError("Please enter a valid odometer reading.")
    } else {
      setOdometerError("")
    }
  }

  function handleComplete() {
    if (odometerError || !endOdometer) return
    if (selectedTrip && Number(endOdometer) <= selectedTrip.startOdometer) return
    if (selectedTripId) {
      updateTripStatus(selectedTripId, "Completed", Number(endOdometer))
    }
    setCompleteDialogOpen(false)
    setOdometerError("")
  }

  const filtered = activeTab === "all" ? trips : trips.filter((t) => t.status === activeTab)

  const statusColor: Record<TripStatus, string> = {
    Draft: "bg-muted text-muted-foreground",
    Dispatched: "bg-info/10 text-info",
    Completed: "bg-success/10 text-success",
    Cancelled: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Trip counts */}
      <div className="grid gap-3 sm:grid-cols-4">
        {(["Draft", "Dispatched", "Completed", "Cancelled"] as TripStatus[]).map((status) => {
          const count = trips.filter((t) => t.status === status).length
          return (
            <Card key={status} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab(status)}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{status}</p>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[status]}`}>
                  {status}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs h-6 px-3">All</TabsTrigger>
            <TabsTrigger value="Draft" className="text-xs h-6 px-3">Draft</TabsTrigger>
            <TabsTrigger value="Dispatched" className="text-xs h-6 px-3">Dispatched</TabsTrigger>
            <TabsTrigger value="Completed" className="text-xs h-6 px-3">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        {isDispatcher && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" />
            Create Trip
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Trip ID</TableHead>
                <TableHead className="text-xs">Route</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs">Cargo</TableHead>
                <TableHead className="text-xs">{"Est. Fuel (\u20B9)"}</TableHead>
                <TableHead className="text-xs">Start Odo.</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                {isDispatcher && <TableHead className="text-xs">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((trip) => {
                const vehicle = getVehicle(trip.vehicleId)
                const driver = getDriver(trip.driverId)
                return (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{trip.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-foreground">{trip.origin}</span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span className="text-foreground">{trip.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{vehicle?.name ?? trip.vehicleId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{driver?.name ?? trip.driverId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{trip.cargoWeight.toLocaleString()} kg</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{trip.estimatedFuelCost ? `\u20B9${trip.estimatedFuelCost.toLocaleString()}` : "-"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{trip.startOdometer.toLocaleString()} km</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[trip.status]}`}>
                        {trip.status}
                      </span>
                    </TableCell>
                    {isDispatcher && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trip.status === "Draft" && (
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => updateTripStatus(trip.id, "Dispatched")}>
                              Dispatch
                            </Button>
                          )}
                          {trip.status === "Dispatched" && (
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => openCompleteDialog(trip.id)}>
                              Complete
                            </Button>
                          )}
                          {(trip.status === "Draft" || trip.status === "Dispatched") && (
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 text-destructive" onClick={() => updateTripStatus(trip.id, "Cancelled")}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isDispatcher ? 9 : 8} className="h-24 text-center text-sm text-muted-foreground">
                    No trips found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manager read-only notice */}
      {isManager && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Eye className="size-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            You are viewing trip data in read-only mode. Only Dispatchers can create, dispatch, complete, or cancel trips.
          </p>
        </div>
      )}

      {/* Create Trip Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
            <DialogDescription>Assign a vehicle and driver for this delivery.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Vehicle</Label>
              <Select value={vehicleId} onValueChange={(v) => { setVehicleId(v); setCapacityError(""); setCargoWeight(""); const veh = vehicles.find((x) => x.id === v); setStartOdometer(veh ? String(veh.odometer) : "") }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 && (
                    <SelectItem value="none" disabled>No vehicles available</SelectItem>
                  )}
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.type}) - {v.maxCapacity.toLocaleString()} kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Driver</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select valid driver" /></SelectTrigger>
                <SelectContent>
                  {validDrivers.length === 0 && (
                    <SelectItem value="none" disabled>No valid drivers</SelectItem>
                  )}
                  {validDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} - Score: {d.safetyScore}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Origin</Label>
                <Input className="h-8 text-sm" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Warehouse A" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Destination</Label>
                <Input className="h-8 text-sm" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Hub B" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Cargo Weight (kg)</Label>
              <Input
                className={`h-8 text-sm ${capacityError ? "border-destructive" : ""}`}
                type="number"
                min="0"
                step="0.1"
                value={cargoWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="Enter weight in kg"
              />
              {capacityError && (
                <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 p-2">
                  <AlertCircle className="size-3.5 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">{capacityError}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Cargo Description</Label>
              <Input className="h-8 text-sm" value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)} placeholder="e.g. Electronics shipment" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{"Estimated Fuel Cost (\u20B9)"}</Label>
                <Input className="h-8 text-sm" type="number" min="0" value={estimatedFuelCost} onChange={(e) => setEstimatedFuelCost(e.target.value)} placeholder="e.g. 2500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Starting Odometer (km)</Label>
                <Input className="h-8 text-sm" type="number" min="0" value={startOdometer} onChange={(e) => setStartOdometer(e.target.value)} placeholder="Auto-filled" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleCreateTrip}
              disabled={!vehicleId || !driverId || !origin || !destination || !cargoWeight || !!capacityError}
            >
              Create Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Trip {selectedTrip?.id}</DialogTitle>
            <DialogDescription>Enter the final odometer reading to complete this trip.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {selectedTrip && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Starting Odometer</span>
                  <span className="text-sm font-semibold font-mono text-foreground">{selectedTrip.startOdometer.toLocaleString()} km</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Route</span>
                  <span className="text-xs text-muted-foreground">{selectedTrip.origin} {"\u2192"} {selectedTrip.destination}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">End Odometer (km)</Label>
              <Input
                className={`h-8 text-sm ${odometerError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                type="number"
                value={endOdometer}
                onChange={(e) => handleEndOdometerChange(e.target.value)}
                placeholder={selectedTrip ? `Must be > ${selectedTrip.startOdometer.toLocaleString()}` : "Enter final reading"}
              />
              {odometerError && (
                <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 p-2">
                  <AlertCircle className="size-3.5 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">{odometerError}</span>
                </div>
              )}
              {endOdometer && !odometerError && selectedTrip && Number(endOdometer) > selectedTrip.startOdometer && (
                <div className="flex items-center justify-between rounded-md bg-success/10 p-2">
                  <span className="text-xs text-success">Distance traveled</span>
                  <span className="text-xs font-semibold font-mono text-success">{(Number(endOdometer) - selectedTrip.startOdometer).toLocaleString()} km</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleComplete} disabled={!endOdometer || !!odometerError}>Mark Completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
