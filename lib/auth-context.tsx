"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

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
  supabaseUser: User | null
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
  supabaseConfigured: boolean
}

// Dispatcher can only access these pages
const DISPATCHER_PAGES = ["dashboard", "vehicles", "trips", "drivers"]

const AuthContext = createContext<AuthContextType | null>(null)

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== "" && key !== "" && !url.includes("your-project"))
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const configured = isSupabaseConfigured()

  // Initialize auth state
  useEffect(() => {
    if (!configured) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Check initial session
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        setSupabaseUser(sbUser)
        const metadata = sbUser.user_metadata ?? {}
        setUser({
          id: sbUser.id,
          name: metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "User",
          email: sbUser.email || "",
          role: (metadata.role as UserRole) || "manager",
          avatar: getInitials(metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "U"),
        })
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const sbUser = session.user
        setSupabaseUser(sbUser)
        const metadata = sbUser.user_metadata ?? {}
        setUser({
          id: sbUser.id,
          name: metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "User",
          email: sbUser.email || "",
          role: (metadata.role as UserRole) || "manager",
          avatar: getInitials(metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "U"),
        })
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [configured])

  // Helper function to get role from profiles table
  const fetchRoleFromProfiles = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      
      if (error) {
        console.warn("Could not fetch role from profiles, using metadata:", error)
        return "manager"
      }
      
      return (data?.role as UserRole) || "manager"
    } catch (err) {
      console.warn("Error fetching role from profiles:", err)
      return "manager"
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!configured) {
      // Fallback: offline mode - accept any non-empty credentials
      if (!email || !password) return { success: false, error: "Please fill in all fields." }
      const name = email.split("@")[0]
      setUser({
        id: "local-user",
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email,
        role: "manager",
        avatar: getInitials(name),
      })
      return { success: true }
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { success: false, error: error.message }
      if (data.user) {
        const metadata = data.user.user_metadata ?? {}
        
        // Fetch role from profiles table first, then fall back to metadata
        const profileRole = await fetchRoleFromProfiles(data.user.id)
        
        setSupabaseUser(data.user)
        setUser({
          id: data.user.id,
          name: metadata.full_name || metadata.name || email.split("@")[0],
          email: data.user.email || email,
          role: profileRole,
          avatar: getInitials(metadata.full_name || metadata.name || email.split("@")[0]),
        })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }, [configured, fetchRoleFromProfiles])

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!configured) {
      // Fallback: offline mode
      if (!email || !password || !name) return { success: false, error: "Please fill in all fields." }
      setUser({
        id: "local-user",
        name,
        email,
        role,
        avatar: getInitials(name),
      })
      return { success: true }
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            avatar_initials: getInitials(name),
          },
        },
      })
      if (error) return { success: false, error: error.message }
      if (data.user && !data.user.identities?.length) {
        return { success: false, error: "An account with this email already exists." }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }, [configured])

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!configured) {
      return { success: true } // Offline mode - pretend it worked
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err) {
      return { success: false, error: "An unexpected error occurred." }
    }
  }, [configured])

  const logout = useCallback(async () => {
    if (configured) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    setUser(null)
    setSupabaseUser(null)
  }, [configured])

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
        supabaseUser,
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
        supabaseConfigured: configured,
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
