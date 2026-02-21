"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { FleetProvider } from "@/lib/fleet-context"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { DashboardPage } from "@/components/pages/dashboard"
import { VehiclesPage } from "@/components/pages/vehicles"
import { TripsPage } from "@/components/pages/trips"
import { DriversPage } from "@/components/pages/drivers"
import { MaintenancePage } from "@/components/pages/maintenance"
import { ExpensesPage } from "@/components/pages/expenses"
import { AnalyticsPage } from "@/components/pages/analytics"
import { LoginPage } from "@/components/pages/login"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Truck } from "lucide-react"

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  vehicles: VehiclesPage,
  trips: TripsPage,
  drivers: DriversPage,
  maintenance: MaintenancePage,
  expenses: ExpensesPage,
  analytics: AnalyticsPage,
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, hasAccess } = useAuth()
  const [activePage, setActivePage] = useState("dashboard")

  // If the current page is not accessible (e.g. role switched), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !hasAccess(activePage)) {
      setActivePage("dashboard")
    }
  }, [isAuthenticated, hasAccess, activePage])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Truck className="size-7" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading FleetFlow...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const ActivePage = pages[activePage] ?? DashboardPage

  return (
    <SidebarProvider>
      <AppSidebar activePage={activePage} onNavigate={setActivePage} />
      <SidebarInset>
        <AppHeader activePage={activePage} />
        <ScrollArea className="flex-1">
          <ActivePage />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function FleetFlowApp() {
  return (
    <AuthProvider>
      <FleetProvider>
        <AuthenticatedApp />
      </FleetProvider>
    </AuthProvider>
  )
}
