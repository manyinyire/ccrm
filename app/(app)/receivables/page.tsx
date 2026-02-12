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
  incomeId: string | null
  incomeDate: string | null
  incomeTotalAmount: number | null
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
  const totalReceived = receivables
    .filter((r) => !r.sentToPastor)
    .reduce((sum, r) => sum + convertToUSD(r.amount, r.currency), 0)
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
            <ReceivableForm assemblies={assemblies} incomeRecords={incomeRecords} receivables={receivables} onClose={() => { setDialogOpen(false); fetchData() }} />
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
                  <TableHead>Linked Income</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Cur.</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No receivables recorded yet.</TableCell>
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
                      {rec.incomeDate ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(rec.incomeDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {rec.incomeTotalAmount != null && ` · ${formatCurrency(rec.incomeTotalAmount, rec.currency as any)}`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
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
                          <ArrowUpRight className="mr-1 h-3 w-3" />Sent to Pastor
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-primary">Received</Badge>
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

function ReceivableForm({ assemblies, incomeRecords, receivables, onClose }: {
  assemblies: Assembly[]
  incomeRecords: IncomeRecord[]
  receivables: Receivable[]
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [assemblyId, setAssemblyId] = useState(assemblies.find((a) => a.status === "ACTIVE")?.id || "")
  const [incomeId, setIncomeId] = useState("")
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [sentToPastor, setSentToPastor] = useState(false)
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  // Compute unsettled income for selected assembly
  const unsettledIncome = incomeRecords
    .filter((inc) => {
      if (inc.assemblyId !== assemblyId) return false
      // Calculate how much has been received against this income
      const receivedForIncome = receivables
        .filter((r) => r.incomeId === inc.id)
        .reduce((sum, r) => sum + r.amount, 0)
      const remaining = inc.totalAmount - receivedForIncome
      return remaining > 0.01 // has unsettled balance
    })
    .map((inc) => {
      const receivedForIncome = receivables
        .filter((r) => r.incomeId === inc.id)
        .reduce((sum, r) => sum + r.amount, 0)
      return {
        ...inc,
        received: receivedForIncome,
        remaining: inc.totalAmount - receivedForIncome,
      }
    })

  // When assembly changes, reset income selection
  const handleAssemblyChange = (v: string) => {
    setAssemblyId(v)
    setIncomeId("")
    setAmount(0)
  }

  // When income is selected, auto-fill amount with remaining balance
  const handleIncomeChange = (v: string) => {
    setIncomeId(v)
    const selected = unsettledIncome.find((inc) => inc.id === v)
    if (selected) {
      setAmount(selected.remaining)
    }
  }

  const selectedIncome = unsettledIncome.find((inc) => inc.id === incomeId)

  const handleSubmit = async () => {
    if (!assemblyId || !amount || !incomeId) return
    setLoading(true)
    const currency = selectedIncome?.currency || "USD"
    await fetch("/api/receivables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assemblyId,
        incomeId,
        date,
        currency,
        amount,
        paymentMethod,
        sentToPastor,
        description,
      }),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      {/* Step 1: Select Assembly */}
      <div className="flex flex-col gap-2">
        <Label>Assembly</Label>
        <Select value={assemblyId} onValueChange={handleAssemblyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select assembly" />
          </SelectTrigger>
          <SelectContent>
            {assemblies.filter((a) => a.status === "ACTIVE").map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Select unsettled income */}
      {assemblyId && (
        <div className="flex flex-col gap-2">
          <Label>Unsettled Income ({unsettledIncome.length} pending)</Label>
          {unsettledIncome.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3 text-center">
              No unsettled income for this assembly.
            </p>
          ) : (
            <Select value={incomeId} onValueChange={handleIncomeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select income to settle" />
              </SelectTrigger>
              <SelectContent>
                {unsettledIncome.map((inc) => (
                  <SelectItem key={inc.id} value={inc.id}>
                    {new Date(inc.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" — "}
                    {formatCurrency(inc.totalAmount, inc.currency as any)}
                    {inc.received > 0 && ` (${formatCurrency(inc.remaining, inc.currency as any)} remaining)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Step 3: Show selected income details & payment info */}
      {selectedIncome && (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {new Date(selectedIncome.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatCurrency(selectedIncome.totalAmount, selectedIncome.currency as any)}
                    {selectedIncome.received > 0 && ` · Already received: ${formatCurrency(selectedIncome.received, selectedIncome.currency as any)}`}
                  </p>
                </div>
                <Badge variant="outline" className="font-semibold">
                  Remaining: {formatCurrency(selectedIncome.remaining, selectedIncome.currency as any)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-amount">Amount ({selectedIncome.currency})</Label>
              <Input
                id="rec-amount"
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                max={selectedIncome.remaining}
              />
              {amount > selectedIncome.remaining && (
                <p className="text-xs text-destructive">Cannot exceed remaining balance</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ECOCASH">EcoCash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-date">Date</Label>
              <Input id="rec-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sent-to-pastor"
              checked={sentToPastor}
              onCheckedChange={(checked) => setSentToPastor(!!checked)}
            />
            <Label htmlFor="sent-to-pastor" className="text-sm font-normal cursor-pointer">
              Sent to Pastor (forwarded to pastor — deducts from assembly balance)
            </Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-desc">Description (optional)</Label>
            <Input id="rec-desc" placeholder="e.g. Weekly remittance" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !assemblyId || !incomeId || !amount || (selectedIncome ? amount > selectedIncome.remaining : false)}
        >
          {loading ? "Saving..." : "Settle Payment"}
        </Button>
      </DialogFooter>
    </div>
  )
}
