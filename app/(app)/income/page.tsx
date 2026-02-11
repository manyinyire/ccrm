"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Filter, Download, FileText, Trash2, Settings } from "lucide-react"
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
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import type { Assembly, IncomeRecord } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

type IncomeItemDef = { id: string; name: string; isDefault: boolean; sortOrder: number }
type ProjectDef = { id: string; name: string; status: string }
export default function IncomePage() {
  const { currency } = useCurrency()
  const [search, setSearch] = useState("")
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false)
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [incomeItems, setIncomeItems] = useState<IncomeItemDef[]>([])
  const [projects, setProjects] = useState<ProjectDef[]>([])

  const fetchData = useCallback(async () => {
    const [incRes, asmRes, itemsRes, projRes] = await Promise.all([
      fetch("/api/income"),
      fetch("/api/assemblies"),
      fetch("/api/income-items"),
      fetch("/api/projects"),
    ])
    setIncomeRecords(await incRes.json())
    setAssemblies(await asmRes.json())
    setIncomeItems(await itemsRes.json())
    const allProjects = await projRes.json()
    setProjects(allProjects.filter((p: ProjectDef) => p.status === "ACTIVE"))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = incomeRecords.filter((r) => {
    const matchesSearch =
      r.assemblyName.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
    const matchesAssembly = assemblyFilter === "all" || r.assemblyId === assemblyFilter
    return matchesSearch && matchesAssembly
  })

  const totalIncome = filtered.reduce((sum, r) => sum + convertToUSD(r.totalAmount, r.currency), 0)
  const totalAttendance = filtered.reduce((sum, r) => sum + r.adults + r.children, 0)
  const totalNewSouls = filtered.reduce((sum, r) => sum + r.newSouls, 0)

  function handleExportCSV() {
    const rows = filtered.map((r) => ({
      Date: r.date,
      Assembly: r.assemblyName,
      Currency: r.currency,
      Adults: r.adults,
      Children: r.children,
      "New Souls": r.newSouls,
      Offering: r.offering,
      Tithe: r.tithe,
      Total: r.totalAmount,
    }))
    exportToCSV(rows, "income-records")
  }

  return (
    <>
      <PageHeader
        title="Income & Attendance"
        description="Track and manage weekly income from all assemblies"
        breadcrumb="Income"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Income Report", "income-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Items
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Income Items</DialogTitle>
              <DialogDescription>Add or remove income line items. Default items cannot be deleted.</DialogDescription>
            </DialogHeader>
            <IncomeItemsManager items={incomeItems} onUpdate={fetchData} />
          </DialogContent>
        </Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Income Record</DialogTitle>
              <DialogDescription>
                Enter the weekly income and attendance data for an assembly.
              </DialogDescription>
            </DialogHeader>
            <IncomeForm assemblies={assemblies} incomeItems={incomeItems} projects={projects} onClose={() => { setDialogOpen(false); fetchData() }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="income-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Income (USD equiv.)</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalIncome, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Attendance</span>
                <span className="text-2xl font-bold">{totalAttendance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Souls</span>
                <span className="text-2xl font-bold text-success">{totalNewSouls}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by assembly or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Assemblies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {assemblies.filter(a => a.status === "ACTIVE").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Cur.</TableHead>
                  <TableHead className="text-right">Adults</TableHead>
                  <TableHead className="text-right">Children</TableHead>
                  <TableHead className="text-right">New Souls</TableHead>
                  <TableHead className="text-right">Offering</TableHead>
                  <TableHead className="text-right">Tithe</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {record.assemblyName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{record.currency}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{record.adults}</TableCell>
                    <TableCell className="text-right tabular-nums">{record.children}</TableCell>
                    <TableCell className="text-right">
                      {record.newSouls > 0 ? (
                        <Badge className="bg-success text-success-foreground">{record.newSouls}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.offering, record.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.tithe, record.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(record.totalAmount, record.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </>
  )
}

function IncomeItemsManager({ items, onUpdate }: { items: IncomeItemDef[]; onUpdate: () => void }) {
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    await fetch("/api/income-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName("")
    setAdding(false)
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/income-items/${id}`, { method: "DELETE" })
    onUpdate()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.name}</span>
              {item.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
            </div>
            {!item.isDefault && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="New item name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  )
}

// Map item name to the corresponding DB field key
const ITEM_FIELD_MAP: Record<string, string> = {
  "Offering": "offering",
  "Tithe": "tithe",
  "Feast Badges": "feastBadges",
  "Firewood": "firewood",
  "Instruments": "instruments",
  "Pastors Welfare": "pastorsWelfare",
}

function IncomeForm({ assemblies, incomeItems, projects, onClose }: { assemblies: Assembly[]; incomeItems: IncomeItemDef[]; projects: ProjectDef[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>({
    date: new Date().toISOString().split("T")[0],
    assemblyId: assemblies.find(a => a.status === "ACTIVE")?.id || "",
    currency: "USD",
    adults: 0, children: 0, newSouls: 0,
  })
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})

  // Initialize default item amounts
  useEffect(() => {
    const defaults: Record<string, number> = {}
    incomeItems.forEach((item) => {
      const fieldKey = ITEM_FIELD_MAP[item.name]
      if (fieldKey) {
        defaults[fieldKey] = 0
      }
    })
    setForm((f) => ({ ...f, ...defaults }))
  }, [incomeItems])

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }))
  const num = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(key, parseFloat(e.target.value) || 0)

  const handleSubmit = async () => {
    setLoading(true)
    await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, customItems: customAmounts }),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={form.date as string} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assembly">Assembly</Label>
          <Select value={form.assemblyId as string} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assemblies.filter(a => a.status === "ACTIVE").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency as string} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="adults">Adults</Label>
          <Input id="adults" type="number" placeholder="0" onChange={num("adults")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="children">Children</Label>
          <Input id="children" type="number" placeholder="0" onChange={num("children")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newSouls">New Souls</Label>
          <Input id="newSouls" type="number" placeholder="0" onChange={num("newSouls")} />
        </div>
      </div>

      {/* Dynamic income items + active projects */}
      <div className="grid grid-cols-3 gap-4">
        {incomeItems.map((item) => {
          const fieldKey = ITEM_FIELD_MAP[item.name]
          const isCustom = !fieldKey
          return (
            <div key={item.id} className="flex flex-col gap-2">
              <Label>{item.name}</Label>
              <Input
                type="number"
                placeholder="0"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  if (isCustom) {
                    setCustomAmounts((prev) => ({ ...prev, [item.name]: val }))
                  } else {
                    set(fieldKey, val)
                  }
                }}
              />
            </div>
          )
        })}
        {projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <Label>{p.name}</Label>
            <Input
              type="number"
              placeholder="0"
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0
                setCustomAmounts((prev) => ({ ...prev, [`project:${p.id}`]: val }))
              }}
            />
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.assemblyId}>{loading ? "Saving..." : "Save Record"}</Button>
      </DialogFooter>
    </div>
  )
}

