"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle, VehicleType, VehicleStatus } from "@/lib/fleet-data"

export function VehiclesPage() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleet()
  const { canDelete } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [type, setType] = useState<VehicleType>("Van")
  const [licensePlate, setLicensePlate] = useState("")
  const [maxCapacity, setMaxCapacity] = useState("")
  const [odometer, setOdometer] = useState("")
  const [region, setRegion] = useState("North")
  const [acquisitionCost, setAcquisitionCost] = useState("")
  const [outOfService, setOutOfService] = useState(false)

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function resetForm() {
    setName("")
    setType("Van")
    setLicensePlate("")
    setMaxCapacity("")
    setOdometer("")
    setRegion("North")
    setAcquisitionCost("")
    setOutOfService(false)
    setEditVehicle(null)
  }

  function openAdd() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditVehicle(v)
    setName(v.name)
    setType(v.type)
    setLicensePlate(v.licensePlate)
    setMaxCapacity(String(v.maxCapacity))
    setOdometer(String(v.odometer))
    setRegion(v.region)
    setAcquisitionCost(String(v.acquisitionCost))
    setOutOfService(v.status === "Retired")
    setDialogOpen(true)
  }

  function handleSave() {
    const vehicle = {
      name,
      type,
      licensePlate,
      maxCapacity: Number(maxCapacity),
      odometer: Number(odometer),
      region,
      acquisitionCost: Number(acquisitionCost),
      yearAcquired: new Date().getFullYear(),
      status: outOfService ? "Retired" as VehicleStatus : "Available" as VehicleStatus,
    }

    if (editVehicle) {
      updateVehicle(editVehicle.id, vehicle)
    } else {
      addVehicle(vehicle)
    }
    setDialogOpen(false)
    resetForm()
  }

  const statusColor: Record<VehicleStatus, string> = {
    Available: "bg-success/10 text-success",
    "On Trip": "bg-info/10 text-info",
    "In Shop": "bg-destructive/10 text-destructive",
    Retired: "bg-muted text-muted-foreground",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-60 pl-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openAdd}>
          <Plus className="size-3.5" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">License Plate</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Max Capacity</TableHead>
                <TableHead className="text-xs">Odometer</TableHead>
                <TableHead className="text-xs">Region</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-mono text-muted-foreground">
                        {v.id}
                      </div>
                      <span className="text-sm font-medium text-foreground">{v.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{v.licensePlate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.maxCapacity.toLocaleString()} kg</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.odometer.toLocaleString()} km</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.region}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[v.status]}`}>
                      {v.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(v)}>
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit {v.name}</span>
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => deleteVehicle(v.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete {v.name}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
            <DialogDescription>
              {editVehicle ? "Update vehicle details below." : "Enter vehicle details to add to the registry."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Vehicle Name</Label>
                <Input className="h-8 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hauler-01" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">License Plate</Label>
                <Input className="h-8 text-sm" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="e.g. TRK-1234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Vehicle Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as VehicleType)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["North", "South", "East", "West", "Central"].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Max Capacity (kg)</Label>
                <Input className="h-8 text-sm" type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="1500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Odometer (km)</Label>
                <Input className="h-8 text-sm" type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{"Cost (\u20B9)"}</Label>
                <Input className="h-8 text-sm" type="number" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} placeholder="35000" />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch checked={outOfService} onCheckedChange={setOutOfService} id="out-of-service" />
              <Label htmlFor="out-of-service" className="text-xs font-normal text-muted-foreground">
                Mark as Out of Service (Retired)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!name || !licensePlate}>
              {editVehicle ? "Save Changes" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
