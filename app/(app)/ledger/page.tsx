"use client"

import { useState } from "react"
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  UserPlus,
  Download,
  FileText,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  expenses,
  refunds,
  owedPersons,
  getOwedLedger,
  formatCurrency,
} from "@/lib/mock-data"
import { BookOpen, DollarSign, TrendingDown } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

export default function LedgerPage() {
  const { currency } = useCurrency()
  const [selectedPerson, setSelectedPerson] = useState<string>("all")
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [personDialogOpen, setPersonDialogOpen] = useState(false)

  const personId = selectedPerson === "all" ? undefined : selectedPerson
  const ledger = getOwedLedger(personId)
  const activeLedger = currency === "USD" ? ledger.usd : ledger.zwl

  const filteredExpenses = ledger.expenses.filter((e) => e.currency === currency)

  function handleExportCSV() {
    const rows = filteredExpenses.map((e) => {
      const person = owedPersons.find((p) => p.id === e.owedPersonId)
      const expRefunds = refunds.filter((r) => r.expenseId === e.id)
      const refunded = expRefunds.reduce((s, r) => s + r.amount, 0)
      return {
        Date: e.date,
        Description: e.description,
        Assembly: e.assemblyName,
        "Owed To": person?.name ?? "-",
        Amount: e.amount,
        Refunded: refunded,
        Remaining: e.amount - refunded,
        Status: e.status,
        Currency: e.currency,
      }
    })
    exportToCSV(rows, `owed-ledger-${currency.toLowerCase()}`)
  }

  return (
    <>
      <PageHeader
        title="Owed Ledger"
        description="Track reimbursements owed to individuals who paid on behalf of the church"
        breadcrumb="Owed Ledger"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Owed Ledger Report", "ledger-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Dialog open={personDialogOpen} onOpenChange={setPersonDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Owed Person</DialogTitle>
              <DialogDescription>
                Register a new person who may be owed money by the church.
              </DialogDescription>
            </DialogHeader>
            <PersonForm onClose={() => setPersonDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Refund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record a Refund</DialogTitle>
              <DialogDescription>
                Record a payment back to the owed person.
              </DialogDescription>
            </DialogHeader>
            <RefundForm onClose={() => setRefundDialogOpen(false)} currency={currency} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="ledger-content">
        {/* Person Filter Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={selectedPerson} onValueChange={setSelectedPerson}>
            <TabsList>
              <TabsTrigger value="all">All People</TabsTrigger>
              {owedPersons.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Badge variant="outline" className="w-fit text-xs">
            Showing {currency} transactions
          </Badge>
        </div>

        {/* Person Info Card (when a specific person selected) */}
        {personId && (() => {
          const person = owedPersons.find((p) => p.id === personId)
          if (!person) return null
          return (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">{person.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-lg font-semibold">{person.name}</span>
                  <span className="text-sm text-muted-foreground">{person.role}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {person.phone}
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title={`Total Debt (${currency})`}
            value={formatCurrency(activeLedger.totalDebt, currency)}
            icon={BookOpen}
            description="All expenses paid on behalf"
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title={`Total Refunded (${currency})`}
            value={formatCurrency(activeLedger.totalRefund, currency)}
            icon={DollarSign}
            description="Amount paid back"
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title={`Outstanding (${currency})`}
            value={formatCurrency(activeLedger.balance, currency)}
            icon={TrendingDown}
            description={activeLedger.totalDebt > 0 ? `${((activeLedger.totalRefund / activeLedger.totalDebt) * 100).toFixed(0)}% recovered` : "No debt"}
            iconClassName="bg-warning/10 text-warning"
          />
        </div>

        {/* Overall Progress */}
        {activeLedger.totalDebt > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Repayment Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(activeLedger.totalRefund, currency)} of {formatCurrency(activeLedger.totalDebt, currency)}
                  </span>
                </div>
                <Progress
                  value={(activeLedger.totalRefund / activeLedger.totalDebt) * 100}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(activeLedger.balance, currency)} remaining to be refunded
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Cards */}
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No {currency} owed expenses found{personId ? " for this person" : ""}.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredExpenses.map((expense) => {
              const person = owedPersons.find((p) => p.id === expense.owedPersonId)
              const expenseRefunds = refunds.filter((r) => r.expenseId === expense.id)
              const totalRefunded = expenseRefunds.reduce((sum, r) => sum + r.amount, 0)
              const remaining = expense.amount - totalRefunded
              const progress = (totalRefunded / expense.amount) * 100

              let statusIcon = <AlertTriangle className="h-4 w-4 text-destructive" />
              let statusLabel = "Owed"
              let statusClass = "bg-destructive/10 text-destructive border-destructive/20"

              if (remaining === 0) {
                statusIcon = <CheckCircle2 className="h-4 w-4 text-success" />
                statusLabel = "Cleared"
                statusClass = "bg-success/10 text-success border-success/20"
              } else if (totalRefunded > 0) {
                statusIcon = <Clock className="h-4 w-4 text-warning" />
                statusLabel = "Partial"
                statusClass = "bg-warning/10 text-warning border-warning/20"
              }

              return (
                <Card key={expense.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">{expense.description}</CardTitle>
                        <CardDescription>{expense.assemblyName} - {expense.event}</CardDescription>
                      </div>
                      <Badge variant="outline" className={statusClass}>
                        {statusIcon}
                        <span className="ml-1">{statusLabel}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {/* Owed To */}
                    {person && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {person.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium">Owed to: {person.name}</span>
                        <span className="text-xs text-muted-foreground">({person.role})</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <span className="text-sm font-semibold">{formatCurrency(expense.amount, expense.currency)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Refunded</span>
                        <span className="text-sm font-semibold text-success">{formatCurrency(totalRefunded, expense.currency)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Remaining</span>
                        <span className="text-sm font-semibold text-destructive">{formatCurrency(remaining, expense.currency)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Recovery</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>Paid to: {expense.paidTo}</span>
                      <span>
                        {new Date(expense.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {expenseRefunds.filter((r) => r.amount > 0).length > 0 && (
                      <div className="border-t pt-3">
                        <span className="text-xs font-medium text-muted-foreground">Refund History</span>
                        <div className="mt-2 flex flex-col gap-2">
                          {expenseRefunds
                            .filter((r) => r.amount > 0)
                            .map((r) => (
                              <div key={r.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
                                <span>{r.note || "Refund"}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground">
                                    {new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                  <span className="font-semibold text-success">+{formatCurrency(r.amount, r.currency)}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function PersonForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="personName">Full Name</Label>
        <Input id="personName" placeholder="e.g. John Moyo" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="personPhone">Phone Number</Label>
        <Input id="personPhone" placeholder="+263 7X XXX XXXX" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="personRole">Role</Label>
        <Input id="personRole" placeholder="e.g. Finance Officer, Deacon, Elder" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Add Person</Button>
      </DialogFooter>
    </div>
  )
}

function RefundForm({ onClose, currency }: { onClose: () => void; currency: string }) {
  const owedExpenses = expenses.filter((e) => e.paymentSource === "OWED_PERSON" && e.currency === currency)

  return (
    <div className="grid gap-4">
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
      <div className="flex flex-col gap-2">
        <Label>Expense</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select expense to refund" />
          </SelectTrigger>
          <SelectContent>
            {owedExpenses
              .filter((e) => e.status !== "PAID")
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.description} - {formatCurrency(e.amount, e.currency)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refundAmount">Amount ({currency})</Label>
        <Input id="refundAmount" type="number" placeholder="0" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refundDate">Date</Label>
        <Input id="refundDate" type="date" defaultValue="2026-02-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refundNote">Note</Label>
        <Textarea id="refundNote" placeholder="Refund note..." rows={2} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Record Refund</Button>
      </DialogFooter>
    </div>
  )
}
