"use client"

import { useState } from "react"
import { Plus, Search, Download, FileText } from "lucide-react"
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
import { expenses, assemblies, owedPersons, formatCurrency, convertToUSD } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

const statusStyles = {
  PAID: "bg-success/10 text-success border-success/20",
  PARTIAL: "bg-warning/10 text-warning border-warning/20",
  OWED: "bg-destructive/10 text-destructive border-destructive/20",
}

const sourceLabels = {
  OWED_PERSON: "Owed Person",
  CASH_AT_HAND: "Cash at Hand",
  PASTOR: "Pastor",
}

export default function ExpensesPage() {
  const { currency } = useCurrency()
  const [search, setSearch] = useState("")
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(search.toLowerCase()) ||
      e.event.toLowerCase().includes(search.toLowerCase())
    const matchesAssembly = assemblyFilter === "all" || e.assemblyId === assemblyFilter
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesAssembly && matchesStatus
  })

  const totalExpenses = filtered.reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)
  const paidExpenses = filtered.filter((e) => e.status === "PAID").reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)
  const owedExpenses = filtered.filter((e) => e.status === "OWED").reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)

  function handleExportCSV() {
    const rows = filtered.map((e) => {
      const person = e.owedPersonId ? owedPersons.find((p) => p.id === e.owedPersonId)?.name : ""
      return {
        Date: e.date,
        Assembly: e.assemblyName,
        Currency: e.currency,
        Event: e.event,
        Description: e.description,
        Amount: e.amount,
        "Paid To": e.paidTo,
        Source: sourceLabels[e.paymentSource],
        "Owed Person": person ?? "",
        Status: e.status,
      }
    })
    exportToCSV(rows, "expenses")
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track and manage expenses across all assemblies"
        breadcrumb="Expenses"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Expenses Report", "expenses-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Expense</DialogTitle>
              <DialogDescription>Record a new expense for an assembly.</DialogDescription>
            </DialogHeader>
            <ExpenseForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="expenses-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses (USD equiv.)</span>
                <span className="text-2xl font-bold">{formatCurrency(totalExpenses, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</span>
                <span className="text-2xl font-bold text-success">{formatCurrency(paidExpenses, "USD")}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owed</span>
                <span className="text-2xl font-bold text-destructive">{formatCurrency(owedExpenses, "USD")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Assemblies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {assemblies.filter(a => a.status === "active").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="OWED">Owed</SelectItem>
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
                  <TableHead>Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Paid To</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Owed To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => {
                  const person = expense.owedPersonId
                    ? owedPersons.find((p) => p.id === expense.owedPersonId)
                    : null
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {new Date(expense.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {expense.assemblyName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{expense.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{expense.event}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{expense.description}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </TableCell>
                      <TableCell>{expense.paidTo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {sourceLabels[expense.paymentSource]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {person ? (
                          <span className="text-sm font-medium">{person.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyles[expense.status]}
                        >
                          {expense.status}
                        </Badge>
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

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState("CASH_AT_HAND")

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" defaultValue="2026-02-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assembly">Assembly</Label>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assemblies.filter(a => a.status === "active").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select defaultValue="USD">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="event">Event</Label>
        <Input id="event" placeholder="e.g. Sunday Service, Youth Conference" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the expense..." rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paidTo">Paid To</Label>
          <Input id="paidTo" placeholder="Recipient name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="source">Payment Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWED_PERSON">Owed Person</SelectItem>
              <SelectItem value="CASH_AT_HAND">Cash at Hand</SelectItem>
              <SelectItem value="PASTOR">Pastor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {source === "OWED_PERSON" && (
          <div className="flex flex-col gap-2">
            <Label>Owed Person</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {owedPersons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {source !== "OWED_PERSON" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue="PAID">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWED">Owed</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Save Expense</Button>
      </DialogFooter>
    </div>
  )
}
