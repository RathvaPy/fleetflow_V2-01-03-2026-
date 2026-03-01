"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type UserRole = "manager" | "dispatcher"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  hasAccess: (page: string) => boolean
  canDelete: boolean
  canViewFinancials: boolean
  isManager: boolean
  isDispatcher: boolean
}

const DISPATCHER_PAGES = ["dashboard", "vehicles", "trips", "drivers"]

const API_URL = "/api/auth"

const AuthContext = createContext<AuthContextType | null>(null)

const USER_STORAGE_KEY = "fleetflow_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore user from localStorage on page load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) return { success: false, error: "Please fill in all fields." }

    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Invalid credentials." }
      }

      setUser(data)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Failed to connect to authentication server." }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password || !name) return { success: false, error: "Please fill in all fields." }

    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed." }
      }

      setUser(data)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
      return { success: true }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Failed to connect to authentication server." }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Basic mock for reset - usually requires email service
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const hasAccess = useCallback(
    (page: string) => {
      if (!user) return false
      if (user.role === "manager") return true
      return DISPATCHER_PAGES.includes(page)
    },
    [user]
  )

  const canDelete = user?.role === "manager"
  const canViewFinancials = user?.role === "manager"
  const isManager = user?.role === "manager"
  const isDispatcher = user?.role === "dispatcher"

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        hasAccess,
        canDelete,
        canViewFinancials,
        isManager,
        isDispatcher,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
