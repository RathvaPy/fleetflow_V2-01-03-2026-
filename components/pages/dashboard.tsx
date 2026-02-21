"use client"

import { Truck, AlertTriangle, Activity, Package, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFleet } from "@/lib/fleet-context"
import { weeklyTripData } from "@/lib/fleet-data"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 12,
  color: "var(--color-popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
}

export function DashboardPage() {
  const { vehicles, trips, drivers } = useFleet()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")

  const filteredVehicles = vehicles.filter((v) => {
    if (typeFilter !== "all" && v.type !== typeFilter) return false
    if (regionFilter !== "all" && v.region !== regionFilter) return false
    return true
  })

  const activeFleet = filteredVehicles.filter((v) => v.status === "On Trip").length
  const maintenanceAlerts = filteredVehicles.filter((v) => v.status === "In Shop").length
  const available = filteredVehicles.filter((v) => v.status === "Available").length
  const totalActive = filteredVehicles.filter((v) => v.status !== "Retired").length
  const utilizationRate = totalActive > 0 ? Math.round((activeFleet / totalActive) * 100) : 0
  const pendingCargo = trips.filter((t) => t.status === "Draft").length

  const regions = [...new Set(vehicles.map((v) => v.region))]

  const kpis = [
    {
      title: "Active Fleet",
      value: activeFleet,
      subtitle: `${available} available`,
      icon: Truck,
      trend: "+2 from yesterday",
      trendUp: true,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Maintenance Alerts",
      value: maintenanceAlerts,
      subtitle: "Vehicles in shop",
      icon: AlertTriangle,
      trend: maintenanceAlerts > 0 ? "Needs attention" : "All clear",
      trendUp: maintenanceAlerts === 0,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Utilization Rate",
      value: `${utilizationRate}%`,
      subtitle: `${totalActive} total active`,
      icon: Activity,
      trend: "+5% this week",
      trendUp: true,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Cargo",
      value: pendingCargo,
      subtitle: "Awaiting dispatch",
      icon: Package,
      trend: pendingCargo > 2 ? "Backlog growing" : "On track",
      trendUp: pendingCargo <= 2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Vehicle Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Truck">Truck</SelectItem>
            <SelectItem value="Van">Van</SelectItem>
            <SelectItem value="Bike">Bike</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
                  <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                  <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
                </div>
                <div className={`flex size-10 items-center justify-center rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`size-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {kpi.trendUp ? (
                  <TrendingUp className="size-3 text-success" />
                ) : (
                  <TrendingDown className="size-3 text-destructive" />
                )}
                <span className={`text-xs ${kpi.trendUp ? "text-success" : "text-destructive"}`}>
                  {kpi.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekly Trip Volume</CardTitle>
            <CardDescription className="text-xs">Trips dispatched per day this week</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTripData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                  />
                  <Bar dataKey="trips" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Trips" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fuel Efficiency Trend</CardTitle>
            <CardDescription className="text-xs">Average km/L across the fleet this week</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTripData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} domain={[6, 10]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "var(--color-muted-foreground)", strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fuel"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--color-chart-3)" }}
                    name="km/L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Trip Activity</CardTitle>
          <CardDescription className="text-xs">Latest dispatched and completed trips</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            {trips.slice(0, 5).map((trip) => {
              const vehicle = vehicles.find((v) => v.id === trip.vehicleId)
              const driver = drivers.find((d) => d.id === trip.driverId)
              return (
                <div key={trip.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-mono font-medium text-muted-foreground">
                      {trip.id}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {trip.origin} {"\u2192"} {trip.destination}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {vehicle?.name} {"\u00B7"} {driver?.name}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Draft: "bg-muted text-muted-foreground",
    Dispatched: "bg-info/10 text-info",
    Completed: "bg-success/10 text-success",
    Cancelled: "bg-destructive/10 text-destructive",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}
