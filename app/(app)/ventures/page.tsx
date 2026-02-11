"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Trash2, Eye, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"

type VentureExpense = { id: string; date: string; currency: string; amount: number; description: string }
type VentureAllocation = { id: string; assemblyId: string; assembly: { name: string }; date: string; currency: string; quantity: number; unitPrice: number; totalAmount: number; description: string }
type VenturePayment = { id: string; assemblyId: string; assembly: { name: string }; date: string; currency: string; amount: number; paymentMethod: string; description: string }
type Venture = {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  expenses: VentureExpense[]
  allocations: VentureAllocation[]
  payments: VenturePayment[]
}

export default function VenturesPage() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ventures, setVentures] = useState<Venture[]>([])

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/ventures")
    setVentures(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = ventures.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCapital = ventures.reduce((sum, v) => sum + v.expenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0), 0)
  const totalRevenue = ventures.reduce((sum, v) => sum + v.payments.reduce((s, p) => s + convertToUSD(p.amount, p.currency), 0), 0)
  const totalAllocated = ventures.reduce((sum, v) => sum + v.allocations.reduce((s, a) => s + convertToUSD(a.totalAmount, a.currency), 0), 0)
  const totalProfit = totalRevenue - totalCapital

  return (
    <>
      <PageHeader
        title="Ventures"
        description="Manage income-generating activities, track capital, allocations, and profitability"
        breadcrumb="Ventures"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Venture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Venture</DialogTitle>
              <DialogDescription>Start a new income-generating venture.</DialogDescription>
            </DialogHeader>
            <VentureForm onClose={() => { setDialogOpen(false); fetchData() }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Capital</span>
                <span className="text-2xl font-bold">{formatCurrency(totalCapital, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Allocated</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAllocated, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Received</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit / Loss</span>
                <span className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit, "USD")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ventures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ventures Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No ventures found.</TableCell>
                  </TableRow>
                )}
                {filtered.map((v) => {
                  const capital = v.expenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)
                  const allocated = v.allocations.reduce((s, a) => s + convertToUSD(a.totalAmount, a.currency), 0)
                  const revenue = v.payments.reduce((s, p) => s + convertToUSD(p.amount, p.currency), 0)
                  const profit = revenue - capital
                  const outstanding = allocated - revenue
                  return (
                    <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/ventures/${v.id}`)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{v.name}</p>
                          {v.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{v.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.status === "ACTIVE" ? "default" : v.status === "COMPLETED" ? "secondary" : "destructive"}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(capital, "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(allocated, "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(revenue, "USD")}</TableCell>
                      <TableCell className={`text-right tabular-nums font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {profit >= 0 ? "+" : ""}{formatCurrency(profit, "USD")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {outstanding > 0 ? (
                          <Badge variant="destructive">{formatCurrency(outstanding, "USD")}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); router.push(`/ventures/${v.id}`) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm(`Delete venture "${v.name}"?`)) return
                            await fetch(`/api/ventures/${v.id}`, { method: "DELETE" })
                            fetchData()
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function VentureForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    await fetch("/api/ventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="v-name">Venture Name</Label>
        <Input id="v-name" placeholder="e.g. Poultry Farming" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="v-desc">Description (optional)</Label>
        <Textarea id="v-desc" placeholder="Brief description of the venture..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
          {loading ? "Creating..." : "Create Venture"}
        </Button>
      </DialogFooter>
    </div>
  )
}
