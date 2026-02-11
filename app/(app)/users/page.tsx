"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Mail,
  Calendar,
  Settings,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { roleLabels } from "@/lib/mock-data"
import type { AppUser, Assembly } from "@/lib/mock-data"

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-warning/10 text-warning border-warning/20",
  deactivated: "bg-destructive/10 text-destructive border-destructive/20",
}

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-[hsl(213,94%,40%)]/10 text-[hsl(213,94%,40%)] border-[hsl(213,94%,40%)]/20",
  TREASURER: "bg-success/10 text-success border-success/20",
  ASSEMBLY_LEADER: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  VIEWER: "bg-muted text-muted-foreground",
}

export default function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])

  const fetchData = useCallback(async () => {
    const [usrRes, asmRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/assemblies"),
    ])
    setAppUsers(await usrRes.json())
    setAssemblies(await asmRes.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async () => {
    if (!selectedUserId) return
    await fetch(`/api/users/${selectedUserId}`, { method: "DELETE" })
    setDeleteDialogOpen(false)
    setSelectedUserId(null)
    fetchData()
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "deactivated" : "active"
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchData()
  }

  const filtered = appUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const activeCount = appUsers.filter((u) => u.status === "active").length
  const totalCount = appUsers.length

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access permissions"
        breadcrumb="Users"
      >
        <Button variant="outline" onClick={() => router.push("/users/permissions")}>
          <Settings className="mr-2 h-4 w-4" />
          Role Permissions
        </Button>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingUser(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user details, role, and assembly assignment." : "Create a new user account for the Church CRM system."}
              </DialogDescription>
            </DialogHeader>
            <UserForm user={editingUser} assemblies={assemblies} onClose={() => { setDialogOpen(false); setEditingUser(null); fetchData() }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</span>
              <p className="mt-1 text-2xl font-bold">{totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
              <p className="mt-1 text-2xl font-bold text-success">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admins</span>
              <p className="mt-1 text-2xl font-bold text-primary">
                {appUsers.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deactivated</span>
              <p className="mt-1 text-2xl font-bold text-destructive">
                {appUsers.filter((u) => u.status === "deactivated").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TREASURER">Treasurer</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleStyles[user.role]}>
                        <Shield className="mr-1 h-3 w-3" />
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.assemblyName ? (
                        <Badge variant="secondary" className="font-normal">{user.assemblyName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">All Assemblies</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[user.status]}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.updatedAt || user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingUser(user); setDialogOpen(true) }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem className="text-warning" onClick={() => handleToggleStatus(user.id, user.status)}>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-success" onClick={() => handleToggleStatus(user.id, user.status)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function UserForm({ user, assemblies, onClose }: { user: AppUser | null; assemblies: Assembly[]; onClose: () => void }) {
  const isEdit = !!user
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "VIEWER",
    assemblyId: user?.assemblyId || "",
  })

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    if (isEdit) {
      const body: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        assemblyId: form.assemblyId || null,
      }
      if (form.password) body.password = form.password
      await fetch(`/api/users/${user!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } else {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assemblyId: form.assemblyId || null,
        }),
      })
    }
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="userName">Full Name</Label>
          <Input id="userName" placeholder="e.g. John Moyo" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="userEmail">Email</Label>
          <Input id="userEmail" type="email" placeholder="john@church.org" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={isEdit} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => set("role", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="TREASURER">Treasurer</SelectItem>
              <SelectItem value="ASSEMBLY_LEADER">Assembly Leader</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Assembly {form.role === "ASSEMBLY_LEADER" && <span className="text-destructive">*</span>}</Label>
          <Select value={form.assemblyId} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select assembly" />
            </SelectTrigger>
            <SelectContent>
              {form.role !== "ASSEMBLY_LEADER" && <SelectItem value="">All Assemblies</SelectItem>}
              {assemblies.filter((a: Assembly) => a.status === "ACTIVE").map((a: Assembly) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="userPassword">{isEdit ? "New Password (leave blank to keep current)" : "Temporary Password"}</Label>
        <Input id="userPassword" type="password" placeholder={isEdit ? "Leave blank to keep current" : "Set initial password"} value={form.password} onChange={(e) => set("password", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name || !form.email || (!isEdit && !form.password) || (form.role === "ASSEMBLY_LEADER" && !form.assemblyId)}>
          {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </Button>
      </DialogFooter>
    </div>
  )
}
