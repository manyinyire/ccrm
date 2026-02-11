"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export type Permissions = {
  role: string
  canViewAll: boolean
  canManageIncome: boolean
  canManageExpenses: boolean
  canManageReceivables: boolean
  canManageVentures: boolean
  canManageProjects: boolean
  canManageAssets: boolean
  canManageUsers: boolean
  canManageAssemblies: boolean
  canViewReports: boolean
  canExport: boolean
}

const DEFAULT_PERMISSIONS: Permissions = {
  role: "VIEWER",
  canViewAll: false,
  canManageIncome: false,
  canManageExpenses: false,
  canManageReceivables: false,
  canManageVentures: false,
  canManageProjects: false,
  canManageAssets: false,
  canManageUsers: false,
  canManageAssemblies: false,
  canViewReports: false,
  canExport: false,
}

export function usePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(true)

  const userRole = (session?.user as any)?.role as string | undefined
  const userAssemblyId = (session?.user as any)?.assemblyId as string | undefined | null
  const isAssemblyLeader = userRole === "ASSEMBLY_LEADER"

  useEffect(() => {
    if (!userRole) return
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((perms: Permissions[]) => {
        const match = perms.find((p) => p.role === userRole)
        if (match) setPermissions(match)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userRole])

  return {
    permissions,
    loading,
    userRole: userRole || "VIEWER",
    userAssemblyId: userAssemblyId || null,
    isAssemblyLeader,
    isSuperAdmin: userRole === "SUPER_ADMIN",
    isAdmin: userRole === "ADMIN" || userRole === "SUPER_ADMIN",
  }
}
