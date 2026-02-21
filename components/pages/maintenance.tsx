"use client"

import { useState } from "react"
import { Plus, Wrench, Search, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { useFleet } from "@/lib/fleet-context"

const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Transmission Service",
  "Battery Replacement",
  "AC Service",
  "Engine Tune-Up",
  "General Inspection",
  "Suspension Repair",
  "Electrical Repair",
]

export function MaintenancePage() {
  const { maintenanceLogs, vehicles, addMaintenanceLog, updateMaintenanceLog, getVehicle } = useFleet()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Form state
  const [vehicleId, setVehicleId] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [description, setDescription] = useState("")
  const [cost, setCost] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [status, setStatus] = useState<"Scheduled" | "In Progress" | "Completed">("In Progress")

  const filtered = maintenanceLogs.filter((m) => {
    const vehicle = getVehicle(m.vehicleId)
    return (
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      (vehicle?.name ?? "").toLowerCase().includes(search.toLowerCase())
    )
  })

  // Sort by date, newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  function handleAdd() {
    if (!vehicleId || !serviceType || !cost) return
    addMaintenanceLog({
      vehicleId,
      type: serviceType,
      description,
      cost: Number(cost),
      date,
      status,
    })
    setDialogOpen(false)
    setVehicleId("")
    setServiceType("")
    setDescription("")
    setCost("")
    setDate(new Date().toISOString().split("T")[0])
    setStatus("In Progress")
  }

  // Only allow adding logs for non-retired vehicles
  const eligibleVehicles = vehicles.filter((v) => v.status !== "Retired")

  const statusColor: Record<string, string> = {
    Scheduled: "bg-info/10 text-info",
    "In Progress": "bg-warning/10 text-warning-foreground",
    Completed: "bg-success/10 text-success",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10">
              <Wrench className="size-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold text-foreground">
                {maintenanceLogs.filter((m) => m.status === "In Progress").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-info/10">
              <Wrench className="size-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-lg font-bold text-foreground">
                {maintenanceLogs.filter((m) => m.status === "Scheduled").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Wrench className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-lg font-bold text-foreground">
                {"\u20B9"}{maintenanceLogs.reduce((acc, m) => acc + m.cost, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-60 pl-8 text-sm"
          />
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" />
          Add Service Log
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Service Type</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Cost</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((log) => {
                const vehicle = getVehicle(log.vehicleId)
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                    <TableCell className="text-sm text-foreground">{vehicle?.name ?? log.vehicleId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{log.description}</TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{"\u20B9"}{log.cost.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[log.status]}`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.status !== "Completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 text-[11px] px-2 text-success hover:text-success"
                          onClick={() => updateMaintenanceLog(log.id, { status: "Completed" })}
                        >
                          <CheckCircle2 className="size-3" />
                          Done
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    No maintenance logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-info/5 p-3">
        <p className="text-xs text-info">
          Adding a service log with status &quot;In Progress&quot; or &quot;Scheduled&quot; will automatically set the vehicle&apos;s status to &quot;In Shop&quot;, removing it from the dispatcher pool.
        </p>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service Log</DialogTitle>
            <DialogDescription>
              Log a new maintenance or service record. Non-completed records will move the vehicle to &quot;In Shop&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {eligibleVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{"Cost (\u20B9)"}</Label>
                <Input className="h-8 text-sm" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Date</Label>
                <Input className="h-8 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm min-h-16" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the service..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!vehicleId || !serviceType || !cost}>
              Add Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
