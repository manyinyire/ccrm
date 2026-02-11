"use client"

import { useState } from "react"
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
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assemblies, incomeRecords, expenses, formatCurrency } from "@/lib/mock-data"

export default function AssembliesPage() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assembly
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Assembly</DialogTitle>
              <DialogDescription>Add a new church assembly to the system.</DialogDescription>
            </DialogHeader>
            <AssemblyForm onClose={() => setDialogOpen(false)} />
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
              .reduce((sum, r) => sum + r.totalAmount, 0)
            const assemblyExpenses = expenses
              .filter((e) => e.assemblyId === assembly.id)
              .reduce((sum, e) => sum + e.amount, 0)
            const totalAttendance = incomeRecords
              .filter((r) => r.assemblyId === assembly.id)
              .reduce((sum, r) => sum + r.adults + r.children, 0)
            const avgAttendance = Math.round(
              totalAttendance / Math.max(incomeRecords.filter((r) => r.assemblyId === assembly.id).length, 1)
            )

            return (
              <Card key={assembly.id} className="overflow-hidden">
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
                        assembly.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {assembly.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
    </>
  )
}

function AssemblyForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Assembly Name</Label>
        <Input id="name" placeholder="e.g. Grace Assembly" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="e.g. Downtown" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leader">Leader</Label>
        <Input id="leader" placeholder="e.g. Pastor James" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Status</Label>
        <Select defaultValue="active">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Save Assembly</Button>
      </DialogFooter>
    </div>
  )
}
