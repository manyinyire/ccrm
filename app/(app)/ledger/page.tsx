"use client"

import { useState } from "react"
import { Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  expenses,
  refunds,
  getFreddyLedger,
  formatCurrency,
} from "@/lib/mock-data"
import { BookOpen, DollarSign, TrendingDown } from "lucide-react"

const freddyExpenses = expenses.filter((e) => e.paymentSource === "FREDDY")

export default function LedgerPage() {
  const ledger = getFreddyLedger()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Freddy Ledger"
        description="Track personal reimbursements and outstanding balances"
        breadcrumb="Freddy Ledger"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                Record a payment back to Freddy for a previous expense.
              </DialogDescription>
            </DialogHeader>
            <RefundForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Debt"
            value={formatCurrency(ledger.totalDebt)}
            icon={BookOpen}
            description="All expenses paid by Freddy"
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="Total Refunded"
            value={formatCurrency(ledger.totalRefund)}
            icon={DollarSign}
            description="Amount paid back"
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(ledger.balance)}
            icon={TrendingDown}
            description={`${((ledger.totalRefund / ledger.totalDebt) * 100).toFixed(0)}% recovered`}
            iconClassName="bg-warning/10 text-warning"
          />
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Repayment Progress</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(ledger.totalRefund)} of {formatCurrency(ledger.totalDebt)}
                </span>
              </div>
              <Progress
                value={(ledger.totalRefund / ledger.totalDebt) * 100}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(ledger.balance)} remaining to be refunded
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Expense Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {freddyExpenses.map((expense) => {
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Amount</span>
                      <span className="text-sm font-semibold">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Refunded</span>
                      <span className="text-sm font-semibold text-success">{formatCurrency(totalRefunded)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Remaining</span>
                      <span className="text-sm font-semibold text-destructive">{formatCurrency(remaining)}</span>
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
                                <span className="font-semibold text-success">+{formatCurrency(r.amount)}</span>
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
      </div>
    </>
  )
}

function RefundForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label>Expense</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select expense to refund" />
          </SelectTrigger>
          <SelectContent>
            {freddyExpenses
              .filter((e) => e.status !== "PAID")
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.description} - {formatCurrency(e.amount)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="refundAmount">Amount</Label>
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
