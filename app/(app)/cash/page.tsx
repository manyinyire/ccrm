"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/mock-data"
import type { IncomeRecord, Expense } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type Receivable = { id: string; assemblyName: string; date: string; currency: string; amount: number; paymentMethod: string; description: string }

export default function CashPage() {
  const { currency } = useCurrency()
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses"), fetch("/api/receivables")]).then(async ([incRes, expRes, recRes]) => {
      setIncomeRecords(await incRes.json())
      setExpenses(await expRes.json())
      setReceivables(await recRes.json())
    })
  }, [])

  // Cash at hand calculations — now based on receivables
  const cashInUSD = receivables.filter((r) => r.currency === "USD" && r.paymentMethod === "CASH").reduce((sum, r) => sum + r.amount, 0)
  const cashInZWL = receivables.filter((r) => r.currency === "ZWL" && r.paymentMethod === "CASH").reduce((sum, r) => sum + r.amount, 0)
  const ecocashInUSD = receivables.filter((r) => r.currency === "USD" && r.paymentMethod === "ECOCASH").reduce((sum, r) => sum + r.amount, 0)
  const ecocashInZWL = receivables.filter((r) => r.currency === "ZWL" && r.paymentMethod === "ECOCASH").reduce((sum, r) => sum + r.amount, 0)
  const cashOutUSD = expenses.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "USD").reduce((sum, e) => sum + e.amount, 0)
  const cashOutZWL = expenses.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "ZWL").reduce((sum, e) => sum + e.amount, 0)

  const totalInUSD = cashInUSD + ecocashInUSD
  const totalInZWL = cashInZWL + ecocashInZWL

  const activeCash = currency === "USD"
    ? { cashIn: totalInUSD, cashOut: cashOutUSD, balance: totalInUSD - cashOutUSD }
    : { cashIn: totalInZWL, cashOut: cashOutZWL, balance: totalInZWL - cashOutZWL }

  // Build a ledger of cash-in and cash-out transactions
  const cashInRecords = receivables
    .filter((r) => r.currency === currency)
    .map((r) => ({
      id: r.id,
      date: r.date,
      type: "in" as const,
      description: `${r.paymentMethod === "ECOCASH" ? "EcoCash" : "Cash"} from ${r.assemblyName}${r.description ? ` — ${r.description}` : ""}`,
      amount: r.amount,
      assembly: r.assemblyName,
    }))

  const cashOutRecords = expenses
    .filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === currency)
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

  function handleExportCSV() {
    const rows = transactionsWithBalance.map((t) => ({
      Date: t.date,
      Type: t.type === "in" ? "Inflow" : "Outflow",
      Description: t.description,
      Assembly: t.assembly,
      Amount: t.type === "in" ? t.amount : -t.amount,
      "Running Balance": t.runningBalance,
      Currency: currency,
    }))
    exportToCSV(rows, `cash-at-hand-${currency.toLowerCase()}`)
  }

  // Build monthly chart data from transactions
  const monthlyMap: Record<string, { inflow: number; outflow: number }> = {}
  for (const t of allTransactions) {
    const m = new Date(t.date).toLocaleString("en-US", { month: "short" })
    if (!monthlyMap[m]) monthlyMap[m] = { inflow: 0, outflow: 0 }
    if (t.type === "in") monthlyMap[m].inflow += t.amount
    else monthlyMap[m].outflow += t.amount
  }
  let bal = 0
  const cashFlowTrends = Object.entries(monthlyMap).map(([month, d]) => {
    bal += d.inflow - d.outflow
    return { month, inflow: d.inflow, outflow: d.outflow, balance: bal }
  })

  const fmt = (v: number) => formatCurrency(v, currency)

  return (
    <>
      <PageHeader
        title="Cash At Hand"
        description="Digital wallet showing all cash inflows and outflows"
        breadcrumb="Cash At Hand"
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Cash At Hand Report", "cash-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="cash-content">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title={`Cash In (${currency})`}
            value={fmt(activeCash.cashIn)}
            icon={TrendingUp}
            description="Total received from assemblies"
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title={`Cash Out (${currency})`}
            value={fmt(activeCash.cashOut)}
            icon={TrendingDown}
            description="Total expenses from cash"
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title={`Cash Balance (${currency})`}
            value={fmt(activeCash.balance)}
            icon={Wallet}
            description="Available cash at hand"
            iconClassName="bg-primary/10 text-primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Cash Flow Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Cash Flow</CardTitle>
              <CardDescription>Monthly inflows vs outflows (USD equiv.)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowTrends} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis
                      tickFormatter={(v: number) => `$${v}`}
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220, 10%, 46%)"
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 16%, 90%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="inflow" fill="hsl(160, 64%, 43%)" radius={[4, 4, 0, 0]} name="Inflow" />
                    <Bar dataKey="outflow" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Balance Trend Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Balance Trend</CardTitle>
              <CardDescription>Running cash balance over time (USD equiv.)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowTrends} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(213, 94%, 40%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(213, 94%, 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis
                      tickFormatter={(v: number) => `$${v}`}
                      tick={{ fontSize: 12 }}
                      stroke="hsl(220, 10%, 46%)"
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 16%, 90%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(213, 94%, 40%)"
                      strokeWidth={2.5}
                      fill="url(#balanceGrad)"
                      name="Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Cash Flow Line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Net Cash Flow</CardTitle>
            <CardDescription>Inflow minus outflow each month (USD equiv.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cashFlowTrends.map((d) => ({ ...d, net: d.inflow - d.outflow }))}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 16%, 90%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="net" stroke="hsl(160, 64%, 43%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(160, 64%, 43%)" }} name="Net Flow" />
                  <Line type="monotone" dataKey="inflow" stroke="hsl(213, 94%, 40%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Inflow" />
                  <Line type="monotone" dataKey="outflow" stroke="hsl(0, 72%, 51%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Outflow" />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Transaction Ledger</CardTitle>
                <CardDescription>All {currency} cash inflows and outflows with running balance</CardDescription>
              </div>
              <Badge variant="outline">{transactionsWithBalance.length} transactions</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsWithBalance.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Wallet className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No {currency} transactions found.</p>
              </div>
            ) : (
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
                          {t.type === "in" ? "+" : "-"}{fmt(t.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {fmt(t.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
