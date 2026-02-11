"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Save, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { roleLabels } from "@/lib/mock-data"

type RolePermission = {
  id: string
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

const permissionLabels: Record<string, { label: string; description: string }> = {
  canViewAll: { label: "View All Assemblies", description: "Can see data from all assemblies, not just their own" },
  canManageIncome: { label: "Manage Income", description: "Can create, edit, and delete income records" },
  canManageExpenses: { label: "Manage Expenses", description: "Can create, edit, and delete expense records" },
  canManageReceivables: { label: "Manage Receivables", description: "Can record and manage receivables" },
  canManageVentures: { label: "Manage Ventures", description: "Can create ventures, products, allocations, and payments" },
  canManageProjects: { label: "Manage Projects", description: "Can create and manage projects" },
  canManageAssets: { label: "Manage Assets", description: "Can add and manage church assets" },
  canManageUsers: { label: "Manage Users", description: "Can create, edit, and deactivate user accounts" },
  canManageAssemblies: { label: "Manage Assemblies", description: "Can create and edit assemblies" },
  canViewReports: { label: "View Reports", description: "Can access reports and analytics" },
  canExport: { label: "Export Data", description: "Can export data to CSV and PDF" },
}

const permissionKeys = Object.keys(permissionLabels)

export default function PermissionsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/permissions")
    setPermissions(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePermission = (role: string, key: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.role === role ? { ...p, [key]: !(p as any)[key] } : p
      )
    )
  }

  const saveRole = async (perm: RolePermission) => {
    setSaving(perm.role)
    await fetch("/api/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perm),
    })
    setSaving(null)
    setSaved(perm.role)
    setTimeout(() => setSaved(null), 2000)
  }

  const roleOrder = ["SUPER_ADMIN", "ADMIN", "TREASURER", "ASSEMBLY_LEADER", "VIEWER"]
  const sorted = roleOrder.map((r) => permissions.find((p) => p.role === r)).filter(Boolean) as RolePermission[]

  return (
    <>
      <PageHeader
        title="Role Permissions"
        description="Define what each user role can and cannot do in the system"
        breadcrumb="Users / Permissions"
      >
        <Button variant="outline" onClick={() => router.push("/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        <div className="text-sm text-muted-foreground">
          Configure permissions for each role. Changes are saved per role. <strong>Super Admin</strong> always has full access.
        </div>

        {/* Permission Matrix */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sorted.map((perm) => {
            const isSuperAdmin = perm.role === "SUPER_ADMIN"
            return (
              <Card key={perm.role} className={isSuperAdmin ? "border-primary/30" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{roleLabels[perm.role] || perm.role}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {saved === perm.role && <Badge className="bg-green-600 text-white text-[10px]">Saved</Badge>}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSuperAdmin || saving === perm.role}
                        onClick={() => saveRole(perm)}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        {saving === perm.role ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">Super Admin always has full access and cannot be modified.</p>
                  )}
                  {perm.role === "ASSEMBLY_LEADER" && (
                    <p className="text-xs text-orange-600 mt-1">Assembly Leaders can only see data from their assigned assembly.</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {permissionKeys.map((key) => {
                      const info = permissionLabels[key]
                      const checked = (perm as any)[key] as boolean
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <Checkbox
                            checked={checked}
                            disabled={isSuperAdmin}
                            onCheckedChange={() => togglePermission(perm.role, key)}
                            className="mt-0.5"
                          />
                          <div className="flex flex-col">
                            <Label className="text-sm font-medium cursor-pointer" onClick={() => !isSuperAdmin && togglePermission(perm.role, key)}>
                              {info.label}
                            </Label>
                            <span className="text-xs text-muted-foreground">{info.description}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {permissions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading permissions...
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
