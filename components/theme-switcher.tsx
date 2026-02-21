"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="gap-2 text-xs cursor-pointer"
        >
          <Sun className="size-3.5" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-primary text-[10px]">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="gap-2 text-xs cursor-pointer"
        >
          <Moon className="size-3.5" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-primary text-[10px]">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="gap-2 text-xs cursor-pointer"
        >
          <Monitor className="size-3.5" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-primary text-[10px]">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
