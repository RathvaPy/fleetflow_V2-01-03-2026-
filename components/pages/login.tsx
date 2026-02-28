"use client"

import { useState } from "react"
import { Truck, LogIn, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useAuth, type UserRole } from "@/lib/auth-context"

type Screen = "login" | "forgot" | "forgot-success" | "register" | "register-success"

export function LoginPage() {
  const { login, signup, resetPassword } = useAuth()
  const [screen, setScreen] = useState<Screen>("login")
  const [loading, setLoading] = useState(false)

  // Login state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("")

  // Register state
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regRole, setRegRole] = useState<UserRole>("dispatcher")
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regError, setRegError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error || "Invalid credentials. Please try again.")
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail) return
    setLoading(true)
    const result = await resetPassword(resetEmail)
    setLoading(false)
    if (result.success) {
      setScreen("forgot-success")
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRegError("")
    if (!regName || !regEmail || !regPassword) {
      setRegError("Please fill in all fields.")
      return
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    const result = await signup(regEmail, regPassword, regName, regRole)
    setLoading(false)
    if (result.success) {
      setScreen("register-success")
    } else {
      setRegError(result.error || "Registration failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Truck className="size-7" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">FleetFlow</h1>
            <p className="text-sm text-muted-foreground">Fleet & Logistics Management</p>
          </div>
        </div>

        {/* ========== LOGIN SCREEN ========== */}
        {screen === "login" && (
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Sign in to your account</CardTitle>
              <CardDescription className="text-xs">
                Enter your credentials to access the fleet dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-9 text-sm"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 pr-9 text-sm"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setResetEmail(""); setScreen("forgot") }}
                      className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5">
                    <AlertCircle className="size-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive" role="alert">{error}</p>
                  </div>
                )}

                <Button type="submit" className="h-9 gap-2 text-sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LogIn className="size-3.5" />
                  )}
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {"Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => { setRegError(""); setScreen("register") }}
                    className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== FORGOT PASSWORD SCREEN ========== */}
        {screen === "forgot" && (
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Reset Your Password</CardTitle>
              <CardDescription className="text-xs">
                {"Enter your registered email address and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reset-email" className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-9 pl-8 text-sm"
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="h-9 gap-2 text-sm" disabled={!resetEmail || loading}>
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Mail className="size-3.5" />
                  )}
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Back to Login
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========== FORGOT SUCCESS SCREEN ========== */}
        {screen === "forgot-success" && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-foreground">Reset Link Sent!</p>
                <p className="text-xs text-muted-foreground">
                  {"We've sent a password reset link to "}
                  <span className="font-medium text-foreground">{resetEmail}</span>.
                  Check your inbox and follow the instructions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5 text-xs"
                onClick={() => setScreen("login")}
              >
                <ArrowLeft className="size-3" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ========== REGISTER SCREEN ========== */}
        {screen === "register" && (
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Create an Account</CardTitle>
              <CardDescription className="text-xs">
                Fill in your details to register for FleetFlow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-name" className="text-xs">Full Name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="h-9 text-sm"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-email" className="text-xs">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-9 text-sm"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="h-9 pr-9 text-sm"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                    >
                      {showRegPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-role" className="text-xs">Role</Label>
                  <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)} disabled={loading}>
                    <SelectTrigger className="h-9 text-sm" id="reg-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager (Full Access)</SelectItem>
                      <SelectItem value="dispatcher">Dispatcher (Limited Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5">
                    <AlertCircle className="size-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive" role="alert">{regError}</p>
                  </div>
                )}

                <Button type="submit" className="h-9 gap-2 text-sm" disabled={!regName || !regEmail || !regPassword || loading}>
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setScreen("login")}
                      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========== REGISTER SUCCESS SCREEN ========== */}
        {screen === "register-success" && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-foreground">Account Created!</p>
                <p className="text-xs text-muted-foreground">
                  {"Welcome, "}
                  <span className="font-medium text-foreground">{regName}</span>.
                  Your account has been created successfully. You can now sign in.
                </p>
              </div>
              <Button
                size="sm"
                className="mt-2 gap-1.5 text-xs"
                onClick={() => {
                  setEmail(regEmail)
                  setPassword("")
                  setScreen("login")
                }}
              >
                <LogIn className="size-3.5" />
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
