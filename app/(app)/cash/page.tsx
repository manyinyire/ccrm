"use client"

import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  incomeRecords,
  expenses,
  getCashAtHand,
  formatCurrency,
} from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function CashPage() {
  const cash = getCashAtHand()

  // Build a ledger of cash-in and cash-out transactions
  const cashInRecords = incomeRecords.map((r) => ({
    id: r.id,
    date: r.date,
    type: "in" as const,
    description: `Received from ${r.assemblyName}`,
    amount: r.received,
    assembly: r.assemblyName,
  }))

  const cashOutRecords = expenses
    .filter((e) => e.paymentSource === "CASH_AT_HAND")
    .map((e) => ({
      id: e.id,
      date: e.date,
      type: "out" as const,
      description: e.description,
      amount: e.amount,
      assembly: e.assemblyName,
    }))

  const allTransactions = [...cashInRecords, ...cashOutRecords]
    .sort((a, b) => b.date.localeCompare(a.date))

  // Running balance
  let runningBalance = 0
  const transactionsWithBalance = allTransactions
    .slice()
    .reverse()
    .map((t) => {
      if (t.type === "in") {
        runningBalance += t.amount
      } else {
        runningBalance -= t.amount
      }
      return { ...t, runningBalance }
    })
    .reverse()

  // Monthly cash flow for chart
  const monthlyCashFlow = [
    { month: "Sep", inflow: 82000, outflow: 35000 },
    { month: "Oct", inflow: 95000, outflow: 42000 },
    { month: "Nov", inflow: 88000, outflow: 38000 },
    { month: "Dec", inflow: 120000, outflow: 55000 },
    { month: "Jan", inflow: 108000, outflow: 45000 },
    { month: "Feb", inflow: 83000, outflow: 28500 },
  ]

  return (
    <>
      <PageHeader
        title="Cash At Hand"
        description="Digital wallet showing all cash inflows and outflows"
        breadcrumb="Cash At Hand"
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Cash In"
            value={formatCurrency(cash.cashIn)}
            icon={TrendingUp}
            description="Total received from assemblies"
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Cash Out"
            value={formatCurrency(cash.cashOut)}
            icon={TrendingDown}
            description="Total expenses from cash"
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="Cash Balance"
            value={formatCurrency(cash.balance)}
            icon={Wallet}
            description="Available cash at hand"
            iconClassName="bg-primary/10 text-primary"
          />
        </div>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cash Flow</CardTitle>
            <CardDescription>Monthly inflows vs outflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCashFlow} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(220, 10%, 46%)"
                  />
                  <Tooltip
                    formatter={(value: number) => [`NGN ${value.toLocaleString()}`, undefined]}
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 16%, 90%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="inflow" fill="hsl(160, 64%, 43%)" radius={[4, 4, 0, 0]} name="Cash In" />
                  <Bar dataKey="outflow" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Cash Out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
            <CardDescription>All cash inflows and outflows with running balance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((t) => (
                  <TableRow key={`${t.type}-${t.id}`}>
                    <TableCell className="font-medium">
                      {new Date(t.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {t.type === "in" ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/10">
                            <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
                            <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                          </div>
                        )}
                        <span className="text-sm">{t.type === "in" ? "Inflow" : "Outflow"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{t.assembly}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={t.type === "in" ? "text-success font-medium" : "text-destructive font-medium"}>
                        {t.type === "in" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(t.runningBalance)}
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
