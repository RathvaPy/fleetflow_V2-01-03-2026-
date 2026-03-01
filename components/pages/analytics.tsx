"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, DollarSign, Fuel, Gauge, Lock, Calendar } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 12,
  color: "var(--color-popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
}

// Theme-compatible chart colors
const CHART_COLORS = {
  fuel: "var(--color-chart-3)",
  maintenance: "var(--color-chart-1)",
  fleet: ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"],
  trips: ["var(--color-chart-2)", "var(--color-chart-1)", "var(--color-chart-5)", "var(--color-chart-4)"],
}

export function AnalyticsPage() {
  const { vehicles, trips, fuelLogs, maintenanceLogs } = useFleet()
  const { canViewFinancials } = useAuth()
  const [timeView, setTimeView] = useState<"monthly" | "quarterly">("monthly")

  if (!canViewFinancials) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Access Restricted</p>
            <p className="text-xs text-muted-foreground">Analytics are only available to managers. Contact your administrator for access.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fleet composition
  const truckCount = vehicles.filter((v) => v.type === "Truck").length
  const vanCount = vehicles.filter((v) => v.type === "Van").length
  const bikeCount = vehicles.filter((v) => v.type === "Bike").length
  const fleetComposition = [
    { name: "Trucks", value: truckCount },
    { name: "Vans", value: vanCount },
    { name: "Bikes", value: bikeCount },
  ]

  // Trip status distribution
  const tripStats = [
    { name: "Completed", value: trips.filter((t) => t.status === "Completed").length },
    { name: "Dispatched", value: trips.filter((t) => t.status === "Dispatched").length },
    { name: "Draft", value: trips.filter((t) => t.status === "Draft").length },
    { name: "Cancelled", value: trips.filter((t) => t.status === "Cancelled").length },
  ]

  // Chart data based on time view
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const data = months.map(m => ({ month: m, fuel: 0, maintenance: 0 }))
    fuelLogs.forEach(f => {
      const date = new Date(f.date)
      if (!isNaN(date.getTime())) data[date.getMonth()].fuel += Number(f.cost)
    })
    maintenanceLogs.forEach(m => {
      const date = new Date(m.date)
      if (!isNaN(date.getTime())) data[date.getMonth()].maintenance += Number(m.cost)
    })
    return data
  }, [fuelLogs, maintenanceLogs])

  const quarterlyData = useMemo(() => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"]
    const data = quarters.map(q => ({ quarter: q, fuel: 0, maintenance: 0 }))
    fuelLogs.forEach(f => {
      const date = new Date(f.date)
      if (!isNaN(date.getTime())) {
        const q = Math.floor(date.getMonth() / 3)
        data[q].fuel += Number(f.cost)
      }
    })
    maintenanceLogs.forEach(m => {
      const date = new Date(m.date)
      if (!isNaN(date.getTime())) {
        const q = Math.floor(date.getMonth() / 3)
        data[q].maintenance += Number(m.cost)
      }
    })
    return data
  }, [fuelLogs, maintenanceLogs])

  const chartData = timeView === "monthly" ? monthlyData : quarterlyData
  const xKey = timeView === "monthly" ? "month" : "quarter"

  // Vehicle ROI calculations
  const vehicleROI = vehicles.map((v) => {
    const completedTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed")
    const fuelCost = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((a, f) => a + Number(f.cost), 0)
    const maintCost = maintenanceLogs.filter((m) => m.vehicleId === v.id).reduce((a, m) => a + Number(m.cost), 0)
    const totalCost = fuelCost + maintCost
    const revenue = completedTrips.reduce((a, t) => a + Number(t.cargoWeight) * 0.5, 0)
    const acquisitionCost = Number(v.acquisitionCost)
    const roi = acquisitionCost > 0 ? ((revenue - totalCost) / acquisitionCost) * 100 : 0
    const totalDistance = completedTrips.reduce((a, t) => a + (Number(t.endOdometer ?? 0) - Number(t.startOdometer)), 0)
    const totalLiters = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((a, f) => a + Number(f.liters), 0)
    const efficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(1) : "N/A"

    return {
      ...v,
      tripsCount: completedTrips.length,
      revenue,
      totalCost,
      roi: roi.toFixed(1),
      efficiency,
      costPerKm: totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : "N/A",
    }
  })

  // Trend data for line chart
  const trendData = monthlyData.map((d) => ({
    ...d,
    total: d.fuel + d.maintenance,
  }))

  function handleExport() {
    const headers = "Vehicle,Trips,Revenue,Cost,ROI (%),Efficiency (km/L),Cost/km\n"
    const rows = vehicleROI.map((v) =>
      `${v.name},${v.tripsCount},${v.revenue},${v.totalCost},${v.roi}%,${v.efficiency},${v.costPerKm}`
    ).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fleetflow-analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = vehicleROI.reduce((a, v) => a + v.revenue, 0)
  const totalCosts = vehicleROI.reduce((a, v) => a + v.totalCost, 0)
  const netProfit = totalRevenue - totalCosts
  const totalFuelSpend = monthlyData.reduce((a, d) => a + d.fuel, 0)
  const totalMaintSpend = monthlyData.reduce((a, d) => a + d.maintenance, 0)
  const formatVehicleId = (id: string) => (id.length > 10 ? `${id.slice(0, 10)}...` : id)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top line metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="size-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Revenue</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-chart-3/10">
              <Fuel className="size-4 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Fuel Cost</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalFuelSpend.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-chart-1/10">
              <Gauge className="size-4 text-chart-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Maintenance Cost</p>
              <p className="text-lg font-bold text-foreground">{"\u20B9"}{totalMaintSpend.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={`text-lg font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                {"\u20B9"}{netProfit.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Cost Chart with Time Toggle */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Operational Cost Trends</CardTitle>
            <CardDescription className="text-xs">Fuel vs Maintenance spend breakdown</CardDescription>
          </div>
          <Tabs value={timeView} onValueChange={(v) => setTimeView(v as "monthly" | "quarterly")}>
            <TabsList className="h-7">
              <TabsTrigger value="monthly" className="text-[11px] h-5 px-2.5 gap-1">
                <Calendar className="size-3" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="quarterly" className="text-[11px] h-5 px-2.5 gap-1">
                <Calendar className="size-3" />
                Quarterly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={timeView === "quarterly" ? 32 : 18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  stroke="var(--color-border)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  stroke="var(--color-border)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [`\u20B9${value.toLocaleString()}`, name]}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar dataKey="fuel" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Fuel Expenses" />
                <Bar dataKey="maintenance" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Maintenance Costs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Color Legend Summary */}
          <div className="mt-3 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-sm bg-chart-3" />
              <span className="text-muted-foreground">Fuel Expenses</span>
              <span className="font-semibold text-foreground">{"\u20B9"}{(timeView === "monthly" ? totalFuelSpend : quarterlyData.reduce((a, d) => a + d.fuel, 0)).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-sm bg-chart-1" />
              <span className="text-muted-foreground">Maintenance Costs</span>
              <span className="font-semibold text-foreground">{"\u20B9"}{(timeView === "monthly" ? totalMaintSpend : quarterlyData.reduce((a, d) => a + d.maintenance, 0)).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Line + Pie Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Cost Trend Line */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Total Cost Trend</CardTitle>
            <CardDescription className="text-xs">Combined monthly spend over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" stroke="var(--color-border)" tickLine={false} axisLine={false} tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`\u20B9${value.toLocaleString()}`, "Total Cost"]}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#totalGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Composition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fleet Composition</CardTitle>
            <CardDescription className="text-xs">Vehicle type breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-center justify-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {fleetComposition.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS.fleet[idx]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trip Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Trip Status Distribution</CardTitle>
            <CardDescription className="text-xs">Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-center justify-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tripStats.map((entry, idx) => (
                      <Cell key={entry.name} fill={CHART_COLORS.trips[idx]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle ROI Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Vehicle ROI & Performance</CardTitle>
            <CardDescription className="text-xs">Financial performance breakdown per vehicle</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleExport}>
            <Download className="size-3" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Trips</TableHead>
                <TableHead className="text-xs">Revenue</TableHead>
                <TableHead className="text-xs">Costs</TableHead>
                <TableHead className="text-xs">ROI %</TableHead>
                <TableHead className="text-xs">km/L</TableHead>
                <TableHead className="text-xs">{"\u20B9"}/km</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleROI.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-muted text-[10px] font-mono text-muted-foreground" title={v.id}>{formatVehicleId(v.id)}</div>
                      <span className="text-sm font-medium text-foreground">{v.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.tripsCount}</TableCell>
                  <TableCell className="text-xs text-foreground">{"\u20B9"}{v.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{"\u20B9"}{v.totalCost.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${Number(v.roi) >= 0 ? "text-success" : "text-destructive"}`}>
                      {v.roi}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.efficiency}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.costPerKm === "N/A" ? "N/A" : `\u20B9${v.costPerKm}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
