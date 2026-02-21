"use client"

import { Bell, Search, LogOut, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFleet } from "@/lib/fleet-context"
import { useAuth } from "@/lib/auth-context"
import { ThemeSwitcher } from "@/components/theme-switcher"

const pageLabels: Record<string, string> = {
  dashboard: "Command Center",
  vehicles: "Vehicle Registry",
  trips: "Trip Dispatcher",
  drivers: "Driver Profiles",
  maintenance: "Maintenance & Service Logs",
  expenses: "Expenses & Fuel Logging",
  analytics: "Operational Analytics",
}

export function AppHeader({ activePage }: { activePage: string }) {
  const { vehicles } = useFleet()
  const { user, logout } = useAuth()
  const maintenanceAlerts = vehicles.filter((v) => v.status === "In Shop").length

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">
          {pageLabels[activePage] ?? "FleetFlow"}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fleet..."
            className="h-8 w-56 pl-8 text-sm bg-muted/50 border-border"
          />
        </div>
      </div>

      {/* Theme Switcher */}
      <ThemeSwitcher />

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative size-8">
        <Bell className="size-4" />
        {maintenanceAlerts > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {maintenanceAlerts}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 hover:bg-muted/50">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user?.avatar ?? "U"}
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-xs font-medium text-foreground">{user?.name ?? "User"}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{user?.role ?? "manager"}</span>
            </div>
            <ChevronDown className="hidden lg:block size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {user?.avatar ?? "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{user?.name ?? "User"}</span>
                  <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`w-fit mt-1 h-5 px-2 text-[10px] font-medium ${
                  user?.role === "manager"
                    ? "bg-primary/10 text-primary"
                    : "bg-chart-2/10 text-chart-2"
                }`}
              >
                {"Role: " + (user?.role === "dispatcher" ? "Dispatcher" : "Manager")}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout()}
            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
