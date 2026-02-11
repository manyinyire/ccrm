"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  MapPin,
  User,
  Users,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import type { Assembly, IncomeRecord, Expense } from "@/lib/mock-data"

export default function AssembliesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  const fetchData = useCallback(async () => {
    const [asmRes, incRes, expRes] = await Promise.all([
      fetch("/api/assemblies"),
      fetch("/api/income"),
      fetch("/api/expenses"),
    ])
    setAssemblies(await asmRes.json())
    setIncomeRecords(await incRes.json())
    setExpenses(await expRes.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/assemblies/${deleteId}`, { method: "DELETE" })
    setDeleteId(null)
    fetchData()
  }

  const filtered = assemblies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      a.leader.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <PageHeader
        title="Assemblies"
        description="Manage church assembly locations and leaders"
        breadcrumb="Assemblies"
      >
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingAssembly(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assembly
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAssembly ? "Edit Assembly" : "New Assembly"}</DialogTitle>
              <DialogDescription>{editingAssembly ? "Update assembly details." : "Add a new church assembly to the system."}</DialogDescription>
            </DialogHeader>
            <AssemblyForm
              assembly={editingAssembly}
              onClose={() => { setDialogOpen(false); setEditingAssembly(null); fetchData() }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assemblies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Assembly Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((assembly) => {
            const assemblyIncome = incomeRecords
              .filter((r) => r.assemblyId === assembly.id)
              .reduce((sum, r) => sum + convertToUSD(r.totalAmount, r.currency), 0)
            const assemblyExpenses = expenses
              .filter((e) => e.assemblyId === assembly.id)
              .reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)
            const totalAttendance = incomeRecords
              .filter((r) => r.assemblyId === assembly.id)
              .reduce((sum, r) => sum + r.adults + r.children, 0)
            const avgAttendance = Math.round(
              totalAttendance / Math.max(incomeRecords.filter((r) => r.assemblyId === assembly.id).length, 1)
            )

            return (
              <Card key={assembly.id} className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push(`/assemblies/${assembly.id}`)}>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">{assembly.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {assembly.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        assembly.status === "ACTIVE"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {assembly.status === "ACTIVE" ? "active" : "inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/assemblies/${assembly.id}`) }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View 360°
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingAssembly(assembly); setDialogOpen(true) }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(assembly.id) }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Leader:</span>
                    <span className="font-medium">{assembly.leader}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Income</span>
                      <span className="text-sm font-bold">{formatCurrency(assemblyIncome)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <DollarSign className="h-4 w-4 text-destructive" />
                      <span className="text-xs text-muted-foreground">Expenses</span>
                      <span className="text-sm font-bold">{formatCurrency(assemblyExpenses)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Users className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">Avg. Att.</span>
                      <span className="text-sm font-bold">{avgAttendance}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assembly</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all income, expenses, and assets linked to this assembly. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AssemblyForm({ assembly, onClose }: { assembly: Assembly | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(assembly?.name || "")
  const [location, setLocation] = useState(assembly?.location || "")
  const [leader, setLeader] = useState(assembly?.leader || "")
  const [status, setStatus] = useState(assembly?.status || "ACTIVE")

  const handleSubmit = async () => {
    setLoading(true)
    if (assembly) {
      await fetch(`/api/assemblies/${assembly.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, leader, status }),
      })
    } else {
      await fetch("/api/assemblies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, leader, status }),
      })
    }
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Assembly Name</Label>
        <Input id="name" placeholder="e.g. Grace Assembly" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="e.g. Downtown" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leader">Leader</Label>
        <Input id="leader" placeholder="e.g. Pastor James" value={leader} onChange={(e) => setLeader(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !name}>{loading ? "Saving..." : assembly ? "Update Assembly" : "Save Assembly"}</Button>
      </DialogFooter>
    </div>
  )
}
