"use client"

import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Wrench,
  Receipt,
  BarChart3,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { title: "Command Center", icon: LayoutDashboard, id: "dashboard" },
  { title: "Vehicle Registry", icon: Truck, id: "vehicles" },
  { title: "Trip Dispatcher", icon: Route, id: "trips" },
  { title: "Driver Profiles", icon: Users, id: "drivers" },
  { title: "Maintenance Logs", icon: Wrench, id: "maintenance" },
  { title: "Expenses & Fuel", icon: Receipt, id: "expenses" },
  { title: "Analytics", icon: BarChart3, id: "analytics" },
]

interface AppSidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  const { user, hasAccess } = useAuth()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">FleetFlow</span>
            <span className="text-xs text-sidebar-foreground/60">Fleet Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => hasAccess(item.id))
                .map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activePage === item.id}
                      onClick={() => onNavigate(item.id)}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {user?.avatar ?? "FM"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-foreground">{user?.name ?? "Fleet Manager"}</span>
            <span className="text-xs text-sidebar-foreground/50">{user?.email ?? "admin@fleetflow.io"}</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
