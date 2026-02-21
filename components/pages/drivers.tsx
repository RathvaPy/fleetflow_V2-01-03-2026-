"use client"

import { useState } from "react"
import {
  Search, Plus, ShieldCheck, ShieldAlert, AlertTriangle, UserPlus, MoreHorizontal, Pencil, Trash2, RefreshCw, Eye,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"
import type { DriverStatus, VehicleType } from "@/lib/fleet-data"

export function DriversPage() {
  const { drivers, vehicles, trips, addDriver, updateDriver, deleteDriver } = useFleet()
  const { isManager } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [renewingDriverId, setRenewingDriverId] = useState<string | null>(null)

  // Add form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formLicenseNumber, setFormLicenseNumber] = useState("")
  const [formLicenseExpiry, setFormLicenseExpiry] = useState("")
  const [formLicenseCategories, setFormLicenseCategories] = useState<VehicleType[]>([])
  const [formStatus, setFormStatus] = useState<DriverStatus>("Off Duty")
  const [formAssignedVehicle, setFormAssignedVehicle] = useState("")
  const [idError, setIdError] = useState("")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editLicenseNumber, setEditLicenseNumber] = useState("")
  const [editLicenseExpiry, setEditLicenseExpiry] = useState("")
  const [editLicenseCategories, setEditLicenseCategories] = useState<VehicleType[]>([])
  const [editStatus, setEditStatus] = useState<DriverStatus>("Off Duty")

  // Renew license state
  const [renewExpiryDate, setRenewExpiryDate] = useState("")

  const filtered = drivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColor: Record<DriverStatus, string> = {
    "On Duty": "bg-success/10 text-success",
    "Off Duty": "bg-muted text-muted-foreground",
    Suspended: "bg-destructive/10 text-destructive",
  }

  function isLicenseExpired(expiry: string) {
    return new Date(expiry) < new Date()
  }

  function isLicenseExpiringSoon(expiry: string) {
    const d = new Date(expiry)
    const now = new Date()
    const sixMonths = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
    return d > now && d < sixMonths
  }

  function getSafetyColor(score: number) {
    if (score >= 85) return "text-success"
    if (score >= 65) return "text-[#f59e0b]"
    return "text-destructive"
  }

  function getSafetyProgressColor(score: number) {
    if (score >= 85) return "[&>div]:bg-success"
    if (score >= 65) return "[&>div]:bg-[#f59e0b]"
    return "[&>div]:bg-destructive"
  }

  function toggleCategory(cat: VehicleType) {
    setFormLicenseCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function toggleEditCategory(cat: VehicleType) {
    setEditLicenseCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function resetForm() {
    setFormName("")
    setFormEmail("")
    setFormPhone("")
    setFormLicenseNumber("")
    setFormLicenseExpiry("")
    setFormLicenseCategories([])
    setFormStatus("Off Duty")
    setFormAssignedVehicle("")
    setIdError("")
  }

  function handleAddDriver() {
    if (!formName || !formLicenseNumber || !formLicenseExpiry || !formPhone || formLicenseCategories.length === 0) return
    const exists = drivers.some((d) => d.licenseNumber.toLowerCase() === formLicenseNumber.toLowerCase())
    if (exists) {
      setIdError("A driver with this license number already exists.")
      return
    }
    const initials = formName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    addDriver({
      name: formName,
      email: formEmail || `${formName.toLowerCase().replace(/\s/g, ".")}@fleetflow.io`,
      phone: formPhone,
      licenseNumber: formLicenseNumber,
      licenseExpiry: formLicenseExpiry,
      licenseCategories: formLicenseCategories,
      status: formStatus,
      safetyScore: 75,
      tripsCompleted: 0,
      avatar: initials,
    })
    setDialogOpen(false)
    resetForm()
  }

  function openEditDialog(driverId: string) {
    const driver = drivers.find((d) => d.id === driverId)
    if (!driver) return
    setEditingDriverId(driverId)
    setEditName(driver.name)
    setEditEmail(driver.email)
    setEditPhone(driver.phone)
    setEditLicenseNumber(driver.licenseNumber)
    setEditLicenseExpiry(driver.licenseExpiry)
    setEditLicenseCategories([...driver.licenseCategories])
    setEditStatus(driver.status)
    setEditDialogOpen(true)
  }

  function handleEditDriver() {
    if (!editingDriverId || !editName || !editLicenseNumber || !editPhone || editLicenseCategories.length === 0) return
    const initials = editName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    updateDriver(editingDriverId, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      licenseNumber: editLicenseNumber,
      licenseExpiry: editLicenseExpiry,
      licenseCategories: editLicenseCategories,
      status: editStatus,
      avatar: initials,
    })
    setEditDialogOpen(false)
    setEditingDriverId(null)
  }

  function openRenewDialog(driverId: string) {
    setRenewingDriverId(driverId)
    setRenewExpiryDate("")
    setRenewDialogOpen(true)
  }

  function handleRenewLicense() {
    if (!renewingDriverId || !renewExpiryDate) return
    updateDriver(renewingDriverId, { licenseExpiry: renewExpiryDate })
    setRenewDialogOpen(false)
    setRenewingDriverId(null)
  }

  function handleStatusChange(driverId: string, newStatus: DriverStatus) {
    updateDriver(driverId, { status: newStatus })
  }

  function handleDeleteDriver(driverId: string) {
    deleteDriver(driverId)
  }

  const expiredCount = drivers.filter((d) => isLicenseExpired(d.licenseExpiry)).length
  const onDutyCount = drivers.filter((d) => d.status === "On Duty").length
  const suspendedCount = drivers.filter((d) => d.status === "Suspended").length

  const renewingDriver = renewingDriverId ? drivers.find((d) => d.id === renewingDriverId) : null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Drivers</p>
              <p className="text-xl font-bold text-foreground">{drivers.length}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="size-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">On Duty</p>
              <p className="text-xl font-bold text-success">{onDutyCount}</p>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">Active</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Expired License</p>
              <p className="text-xl font-bold text-destructive">{expiredCount}</p>
            </div>
            <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px]">Alert</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">Suspended</p>
              <p className="text-xl font-bold text-muted-foreground">{suspendedCount}</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, ID, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 pl-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="On Duty">On Duty</SelectItem>
              <SelectItem value="Off Duty">Off Duty</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isManager && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" />
            Add New Driver
          </Button>
        )}
      </div>

      {/* Driver Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Driver</TableHead>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">License No.</TableHead>
                <TableHead className="text-xs">License Expiry</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Categories</TableHead>
                <TableHead className="text-xs">Safety Score</TableHead>
                <TableHead className="text-xs">Trips</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                {isManager && <TableHead className="text-xs">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((driver) => {
                const expired = isLicenseExpired(driver.licenseExpiry)
                const expiringSoon = isLicenseExpiringSoon(driver.licenseExpiry)
                const activeTrips = trips.filter((t) => t.driverId === driver.id && t.status === "Dispatched").length

                return (
                  <TableRow
                    key={driver.id}
                    className={expired ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {driver.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{driver.name}</span>
                          <span className="text-[11px] text-muted-foreground">{driver.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{driver.id}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{driver.licenseNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {expired ? (
                          <ShieldAlert className="size-3.5 text-destructive shrink-0" />
                        ) : expiringSoon ? (
                          <AlertTriangle className="size-3.5 text-[#f59e0b] shrink-0" />
                        ) : (
                          <ShieldCheck className="size-3.5 text-success shrink-0" />
                        )}
                        <span className={`text-xs ${expired ? "text-destructive font-semibold" : expiringSoon ? "text-[#f59e0b]" : "text-muted-foreground"}`}>
                          {new Date(driver.licenseExpiry).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {expired && <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[9px] h-4 px-1">EXPIRED</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{driver.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {driver.licenseCategories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] h-5 px-1.5">{cat}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={driver.safetyScore} className={`h-1.5 flex-1 ${getSafetyProgressColor(driver.safetyScore)}`} />
                        <span className={`text-xs font-bold tabular-nums ${getSafetyColor(driver.safetyScore)}`}>{driver.safetyScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{driver.tripsCompleted}</span>
                        {activeTrips > 0 && (
                          <span className="text-[10px] text-primary">{activeTrips} active</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isManager ? (
                        <Select
                          value={driver.status}
                          onValueChange={(v) => handleStatusChange(driver.id, v as DriverStatus)}
                        >
                          <SelectTrigger className="h-6 w-[110px] text-[11px] border-0 bg-transparent px-0 focus:ring-0">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[driver.status]}`}>
                              {driver.status}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On Duty">On Duty</SelectItem>
                            <SelectItem value="Off Duty">Off Duty</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[driver.status]}`}>
                          {driver.status}
                        </span>
                      )}
                    </TableCell>
                    {isManager && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="size-7 p-0">
                              <MoreHorizontal className="size-3.5" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(driver.id)} className="gap-2 text-xs">
                              <Pencil className="size-3" />
                              Edit Driver
                            </DropdownMenuItem>
                            {expired && (
                              <DropdownMenuItem onClick={() => openRenewDialog(driver.id)} className="gap-2 text-xs">
                                <RefreshCw className="size-3" />
                                Renew License
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteDriver(driver.id)}
                              className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="size-3" />
                              Delete Driver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isManager ? 10 : 9} className="h-24 text-center text-sm text-muted-foreground">
                    No drivers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dispatcher read-only notice */}
      {!isManager && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <Eye className="size-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            You are viewing driver profiles in read-only mode. Contact a Manager to make changes.
          </p>
        </div>
      )}

      {/* Add New Driver Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Enter the driver details. All fields marked are required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input className="h-8 text-sm" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Phone Number *</Label>
                <Input className="h-8 text-sm" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g. +91-9876543210" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input className="h-8 text-sm" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. rahul@fleetflow.io (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">License Number * (Unique)</Label>
                <Input
                  className={`h-8 text-sm ${idError ? "border-destructive" : ""}`}
                  value={formLicenseNumber}
                  onChange={(e) => { setFormLicenseNumber(e.target.value); setIdError("") }}
                  placeholder="e.g. DL-12345"
                />
                {idError && <span className="text-[11px] text-destructive">{idError}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">License Expiry Date *</Label>
                <Input className="h-8 text-sm" type="date" value={formLicenseExpiry} onChange={(e) => setFormLicenseExpiry(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">License Categories * (select all that apply)</Label>
              <div className="flex items-center gap-2">
                {(["Truck", "Van", "Bike"] as VehicleType[]).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={formLicenseCategories.includes(cat) ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Assigned Vehicle (optional)</Label>
                <Select value={formAssignedVehicle} onValueChange={setFormAssignedVehicle}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vehicles.filter((v) => v.status === "Available").map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as DriverStatus)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Duty">On Duty</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); resetForm() }}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleAddDriver}
              disabled={!formName || !formLicenseNumber || !formLicenseExpiry || !formPhone || formLicenseCategories.length === 0}
            >
              Add Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input className="h-8 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Phone Number *</Label>
                <Input className="h-8 text-sm" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input className="h-8 text-sm" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">License Number *</Label>
                <Input className="h-8 text-sm" value={editLicenseNumber} onChange={(e) => setEditLicenseNumber(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">License Expiry Date *</Label>
                <Input className="h-8 text-sm" type="date" value={editLicenseExpiry} onChange={(e) => setEditLicenseExpiry(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">License Categories *</Label>
              <div className="flex items-center gap-2">
                {(["Truck", "Van", "Bike"] as VehicleType[]).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={editLicenseCategories.includes(cat) ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={() => toggleEditCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as DriverStatus)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="Off Duty">Off Duty</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleEditDriver}
              disabled={!editName || !editLicenseNumber || !editPhone || editLicenseCategories.length === 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew License Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renew License</DialogTitle>
            <DialogDescription>
              {renewingDriver
                ? `Update the license expiry date for ${renewingDriver.name} (${renewingDriver.licenseNumber}).`
                : "Set a new license expiry date."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {renewingDriver && (
              <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-destructive uppercase tracking-wide font-medium">Current Expiry</span>
                  <span className="text-sm font-semibold text-destructive">
                    {new Date(renewingDriver.licenseExpiry).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px]">EXPIRED</Badge>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">New Expiry Date *</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={renewExpiryDate}
                onChange={(e) => setRenewExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenewDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRenewLicense} disabled={!renewExpiryDate}>
              <RefreshCw className="size-3 mr-1.5" />
              Renew License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
