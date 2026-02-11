"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  Car,
  Monitor,
  Armchair,
  Wrench,
  Building2,
  MapPin,
  Download,
  FileText,
  TrendingDown,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  formatCurrency,
  categoryLabels,
  conditionLabels,
  convertToUSD,
} from "@/lib/mock-data"
import type { Asset, Assembly } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

const COLORS = [
  "hsl(213, 94%, 40%)",
  "hsl(160, 64%, 43%)",
  "hsl(32, 95%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 52%)",
  "hsl(190, 60%, 45%)",
]

const categoryIcons: Record<string, React.ElementType> = {
  EQUIPMENT: Wrench,
  VEHICLE: Car,
  FURNITURE: Armchair,
  ELECTRONICS: Monitor,
  PROPERTY: Building2,
  OTHER: Package,
}

const conditionStyles: Record<string, string> = {
  EXCELLENT: "bg-success/10 text-success border-success/20",
  GOOD: "bg-primary/10 text-primary border-primary/20",
  FAIR: "bg-warning/10 text-warning border-warning/20",
  POOR: "bg-destructive/10 text-destructive border-destructive/20",
  DAMAGED: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function AssetsPage() {
  const { currency } = useCurrency()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])

  const fetchData = useCallback(async () => {
    const [astRes, asmRes] = await Promise.all([
      fetch("/api/assets"),
      fetch("/api/assemblies"),
    ])
    setAssets(await astRes.json())
    setAssemblies(await asmRes.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    await fetch(`/api/assets/${id}`, { method: "DELETE" })
    fetchData()
  }

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase())
    const matchesCat = categoryFilter === "all" || a.category === categoryFilter
    const matchesAssembly = assemblyFilter === "all" || a.assemblyId === assemblyFilter
    return matchesSearch && matchesCat && matchesAssembly
  })

  // Calculate totals in USD equiv
  const totalPurchaseValue = assets.reduce((s: number, a: Asset) => s + convertToUSD(a.purchasePrice, a.currency), 0)
  const totalCurrentValue = assets.reduce((s: number, a: Asset) => s + convertToUSD(a.currentValue, a.currency), 0)
  const totalDepreciation = totalPurchaseValue - totalCurrentValue

  // Category breakdown for pie chart
  const categoryData = Object.keys(categoryLabels).map((cat) => {
    const catAssets = assets.filter((a: Asset) => a.category === cat)
    return {
      name: categoryLabels[cat],
      value: catAssets.reduce((s: number, a: Asset) => s + convertToUSD(a.currentValue, a.currency), 0),
      count: catAssets.length,
    }
  }).filter((c) => c.count > 0)

  // Assembly breakdown for bar chart
  const assemblyAssetData = assemblies
    .filter((a: Assembly) => a.status === "ACTIVE")
    .map((asm: Assembly) => {
      const asmAssets = assets.filter((a: Asset) => a.assemblyId === asm.id)
      return {
        name: asm.name.replace(" Assembly", ""),
        value: asmAssets.reduce((s: number, a: Asset) => s + convertToUSD(a.currentValue, a.currency), 0),
        count: asmAssets.length,
      }
    })

  function handleExportCSV() {
    const rows = filtered.map((a) => ({
      Name: a.name,
      Category: categoryLabels[a.category],
      Assembly: a.assemblyName,
      "Purchase Date": a.purchaseDate,
      "Purchase Price": a.purchasePrice,
      "Current Value": a.currentValue,
      Currency: a.currency,
      Condition: conditionLabels[a.condition],
      Location: a.location,
      "Serial Number": a.serialNumber ?? "",
      "Assigned To": a.assignedTo ?? "",
    }))
    exportToCSV(rows, "asset-register")
  }

  return (
    <>
      <PageHeader
        title="Asset Management"
        description="Track and manage church assets across all assemblies"
        breadcrumb="Assets"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Asset Register Report", "asset-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Register New Asset</DialogTitle>
              <DialogDescription>
                Add a new asset to the church register.
              </DialogDescription>
            </DialogHeader>
            <AssetForm assemblies={assemblies} onClose={() => { setDialogOpen(false); fetchData() }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="asset-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            title="Total Assets"
            value={assets.length.toString()}
            icon={Package}
            description="Registered items"
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Purchase Value"
            value={formatCurrency(totalPurchaseValue, "USD")}
            icon={Package}
            description="Original cost (USD equiv.)"
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Current Value"
            value={formatCurrency(totalCurrentValue, "USD")}
            icon={Package}
            description="Present value (USD equiv.)"
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Depreciation"
            value={formatCurrency(totalDepreciation, "USD")}
            icon={TrendingDown}
            description={`${((totalDepreciation / totalPurchaseValue) * 100).toFixed(1)}% of purchase value`}
            iconClassName="bg-warning/10 text-warning"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Assets by Category</CardTitle>
              <CardDescription>Current value distribution (USD equiv.)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, "USD")} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Assets by Assembly</CardTitle>
              <CardDescription>Current value per assembly (USD equiv.)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assemblyAssetData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                    <Tooltip formatter={(value: number) => formatCurrency(value, "USD")} />
                    <Bar dataKey="value" fill="hsl(213, 94%, 40%)" radius={[4, 4, 0, 0]} name="Value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Assemblies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {assemblies.filter((a: Assembly) => a.status === "ACTIVE").map((a: Assembly) => (
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
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead>Depreciation</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asset) => {
                  const CategoryIcon = categoryIcons[asset.category]
                  const depreciationPct = ((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100

                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{asset.name}</span>
                            {asset.serialNumber && (
                              <span className="text-xs text-muted-foreground">SN: {asset.serialNumber}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {categoryLabels[asset.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {asset.assemblyName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={conditionStyles[asset.condition]}>
                          {conditionLabels[asset.condition]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(asset.purchasePrice, asset.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-semibold">
                        {formatCurrency(asset.currentValue, asset.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Progress value={depreciationPct} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{depreciationPct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="max-w-[120px] truncate">{asset.location}</span>
                        </div>
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
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(asset.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

function AssetForm({ assemblies, onClose }: { assemblies: Assembly[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    category: "EQUIPMENT",
    assemblyId: assemblies.find((a: Assembly) => a.status === "ACTIVE")?.id || "",
    purchasePrice: 0,
    currency: "USD",
    purchaseDate: new Date().toISOString().split("T")[0],
    condition: "GOOD",
    location: "",
    serialNumber: "",
    assignedTo: "",
    notes: "",
  })

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        purchasePrice: parseFloat(String(form.purchasePrice)) || 0,
        currentValue: parseFloat(String(form.purchasePrice)) || 0,
      }),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="assetName">Asset Name</Label>
        <Input id="assetName" placeholder="e.g. Yamaha Sound System" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Assembly</Label>
          <Select value={form.assemblyId} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assemblies.filter((a: Assembly) => a.status === "ACTIVE").map((a: Assembly) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchasePrice">Purchase Price</Label>
          <Input id="purchasePrice" type="number" placeholder="0" onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Condition</Label>
          <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(conditionLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assetLocation">Location</Label>
          <Input id="assetLocation" placeholder="e.g. Main Hall" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input id="serialNumber" placeholder="Optional" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input id="assignedTo" placeholder="Optional" value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assetNotes">Notes</Label>
        <Textarea id="assetNotes" placeholder="Additional notes..." rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name || !form.assemblyId}>{loading ? "Saving..." : "Register Asset"}</Button>
      </DialogFooter>
    </div>
  )
}
