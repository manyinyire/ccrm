"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Church, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      router.push("/login?registered=true")
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(213,94%,55%)]">
            <Church className="h-5 w-5 text-[hsl(0,0%,100%)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">Church CRM</span>
            <span className="text-xs text-[hsl(210,14%,60%)]">Finance Manager</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Join your church&apos;s financial management platform.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-[hsl(210,14%,70%)]">
            Create your account to start managing income, expenses, reimbursements, and assets across all assemblies.
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
          Church Assembly Finance CRM v2.0
        </p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Church className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Church CRM</span>
        </div>

        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardContent className="p-0 lg:p-8">
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Freddy Moyo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                    minLength={6}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
