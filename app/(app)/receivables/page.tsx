"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Filter, Download, FileText, Trash2, HandCoins, ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

type Receivable = {
  id: string
  assemblyId: string
  assemblyName: string
  date: string
  currency: string
  amount: number
  paymentMethod: string
  sentToPastor: boolean
  description: string
}

export default function ReceivablesPage() {
  const { currency } = useCurrency()
  const [search, setSearch] = useState("")
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])

  const fetchData = useCallback(async () => {
    const [recRes, incRes, asmRes] = await Promise.all([
      fetch("/api/receivables"),
      fetch("/api/income"),
      fetch("/api/assemblies"),
    ])
    setReceivables(await recRes.json())
    setIncomeRecords(await incRes.json())
    setAssemblies(await asmRes.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = receivables.filter((r) => {
    const matchesSearch =
      r.assemblyName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
    const matchesAssembly = assemblyFilter === "all" || r.assemblyId === assemblyFilter
    return matchesSearch && matchesAssembly
  })

  // Assembly balance calculations
  // Income totalAmount = money owed by assembly
  // Receivables amount = money received from assembly (deducts from balance)
  const activeAssemblies = assemblies.filter((a) => a.status === "ACTIVE")

  const assemblyBalances = activeAssemblies.map((asm) => {
    const incomeTotal = incomeRecords
      .filter((r) => r.assemblyId === asm.id)
      .reduce((sum, r) => sum + convertToUSD(r.totalAmount, r.currency), 0)
    const receivedTotal = receivables
      .filter((r) => r.assemblyId === asm.id)
      .reduce((sum, r) => sum + convertToUSD(r.amount, r.currency), 0)
    return {
      id: asm.id,
      name: asm.name,
      incomeTotal,
      receivedTotal,
      balance: incomeTotal - receivedTotal,
    }
  })

  const totalOutstanding = assemblyBalances.reduce((sum, a) => sum + Math.max(0, a.balance), 0)
  const totalReceived = receivables.reduce((sum, r) => sum + convertToUSD(r.amount, r.currency), 0)
  const totalSentToPastor = receivables
    .filter((r) => r.sentToPastor)
    .reduce((sum, r) => sum + convertToUSD(r.amount, r.currency), 0)

  function handleExportCSV() {
    const rows = filtered.map((r) => ({
      Date: r.date,
      Assembly: r.assemblyName,
      Currency: r.currency,
      Amount: r.amount,
      Method: r.paymentMethod,
      "Sent to Pastor": r.sentToPastor ? "Yes" : "No",
      Description: r.description,
    }))
    exportToCSV(rows, "receivables")
  }

  return (
    <>
      <PageHeader
        title="Receivables"
        description="Track money received from assemblies and manage outstanding balances"
        breadcrumb="Receivables"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Receivables Report", "receivables-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Receivable
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Receivable</DialogTitle>
              <DialogDescription>Record money received from an assembly. This deducts from their outstanding balance.</DialogDescription>
            </DialogHeader>
            <ReceivableForm assemblies={assemblies} onClose={() => { setDialogOpen(false); fetchData() }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="receivables-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Received (USD equiv.)</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalReceived, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</span>
                <span className="text-2xl font-bold text-warning">{formatCurrency(totalOutstanding, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent to Pastor</span>
                <span className="text-2xl font-bold text-success">{formatCurrency(totalSentToPastor, "USD")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assembly Balances */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Assembly Balances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assemblyBalances.map((asm) => (
                <div key={asm.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{asm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Income: {formatCurrency(asm.incomeTotal, "USD")} · Received: {formatCurrency(asm.receivedTotal, "USD")}
                    </p>
                  </div>
                  <Badge variant={asm.balance > 0 ? "destructive" : "secondary"} className="ml-2 tabular-nums">
                    {asm.balance > 0 ? `Owes ${formatCurrency(asm.balance, "USD")}` : "Settled"}
                  </Badge>
                </div>
              ))}
              {assemblyBalances.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">No active assemblies.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by assembly, description, or date..."
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
              {activeAssemblies.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Receivables Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Cur.</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Sent to Pastor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No receivables recorded yet.</TableCell>
                  </TableRow>
                )}
                {filtered.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">
                      {new Date(rec.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{rec.assemblyName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rec.paymentMethod === "ECOCASH" ? "EcoCash" : "Cash"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{rec.currency}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(rec.amount, rec.currency as any)}
                    </TableCell>
                    <TableCell>
                      {rec.sentToPastor ? (
                        <Badge className="bg-success text-success-foreground">
                          <ArrowUpRight className="mr-1 h-3 w-3" />Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[150px]">{rec.description || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                        await fetch(`/api/receivables/${rec.id}`, { method: "DELETE" })
                        fetchData()
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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

function ReceivableForm({ assemblies, onClose }: { assemblies: Assembly[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    assemblyId: assemblies.find((a) => a.status === "ACTIVE")?.id || "",
    currency: "USD",
    amount: 0,
    paymentMethod: "CASH",
    sentToPastor: false,
    description: "",
  })

  const set = (key: string, value: string | number | boolean) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.assemblyId || !form.amount) return
    setLoading(true)
    await fetch("/api/receivables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-date">Date</Label>
          <Input id="rec-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Assembly</Label>
          <Select value={form.assemblyId} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assemblies.filter((a) => a.status === "ACTIVE").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-amount">Amount</Label>
          <Input id="rec-amount" type="number" placeholder="0" onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} />
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
          <Label>Payment Method</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="ECOCASH">EcoCash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="sent-to-pastor"
          checked={form.sentToPastor}
          onCheckedChange={(checked) => set("sentToPastor", !!checked)}
        />
        <Label htmlFor="sent-to-pastor" className="text-sm font-normal cursor-pointer">
          Sent to Pastor (deducts from church balance)
        </Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-desc">Description (optional)</Label>
        <Input id="rec-desc" placeholder="e.g. Weekly remittance" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.assemblyId || !form.amount}>
          {loading ? "Saving..." : "Record Receivable"}
        </Button>
      </DialogFooter>
    </div>
  )
}
