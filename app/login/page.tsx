"use client"

import React, { Suspense } from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Church, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => {})
  }, [])

  const orgName = settings.orgName || "Church CRM"
  const orgTagline = settings.orgTagline || "Finance Manager"
  const logoUrl = settings.logoUrl || ""
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[hsl(220,20%,10%)] p-12 text-[hsl(0,0%,100%)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(213,94%,55%)] overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Church className="h-5 w-5 text-[hsl(0,0%,100%)]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">{orgName}</span>
            <span className="text-xs text-[hsl(210,14%,60%)]">{orgTagline}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Manage your church finances with clarity and confidence.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-[hsl(210,14%,70%)]">
            Track income, expenses, reimbursements, and assets across all your assemblies in one unified platform.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-[hsl(220,18%,16%)] p-4">
              <div className="text-2xl font-bold text-[hsl(213,94%,55%)]">5</div>
              <div className="mt-1 text-xs text-[hsl(210,14%,60%)]">Assemblies</div>
            </div>
            <div className="rounded-xl bg-[hsl(220,18%,16%)] p-4">
              <div className="text-2xl font-bold text-[hsl(160,64%,43%)]">USD/ZWL</div>
              <div className="mt-1 text-xs text-[hsl(210,14%,60%)]">Multi-Currency</div>
            </div>
            <div className="rounded-xl bg-[hsl(220,18%,16%)] p-4">
              <div className="text-2xl font-bold text-[hsl(32,95%,50%)]">Real-time</div>
              <div className="mt-1 text-xs text-[hsl(210,14%,60%)]">Reports</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[hsl(210,14%,50%)]">
          {orgName} v2.0
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Church className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          <span className="text-xl font-bold">{orgName}</span>
        </div>

        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardContent className="p-0 lg:p-8">
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="freddy@church.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
